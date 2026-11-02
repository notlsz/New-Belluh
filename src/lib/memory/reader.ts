// Reading a picked file on the device: a content hash (the item's id, so the same photo picked twice is indexed once),
// when and where it was taken (EXIF via exifr), whether it is a screenshot, a ~256 px WebP preview kept in IndexedDB,
// and a 640 px copy for the image model. Videos are read from a still frame. File names are used only to spot
// screenshots and are never stored.

import type { MediaType } from './types.ts';

export interface ReadFile {
  id: string;
  mediaType: MediaType;
  /** Local wall-clock time it was taken, as UTC ms; null when unknown */
  wall: number | null;
  date: string | null;
  timeZone: string | null;
  lat: number | null; lng: number | null;
  w: number; h: number;
  thumb: Blob | null;
  /** For the image model (and faces): at most 640 px on the long side */
  work: ImageBitmap | null;
}

export interface Reader { read(file: File): Promise<ReadFile | null> }

export const isVideo = (f: File) => f.type.startsWith('video/') || /\.(mov|mp4|m4v|webm)$/i.test(f.name);
export const isImage = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|heic|heif|png|webp|gif|avif|tiff?)$/i.test(f.name);

async function hashOf(file: File): Promise<string> {
  // Whole file for photos; for big videos the first and last 2 MB and the size, which is enough to tell them apart
  let buf: ArrayBuffer;
  if (file.size > 32 * 1024 * 1024) {
    const head = await file.slice(0, 2 << 20).arrayBuffer(), tail = await file.slice(-(2 << 20)).arrayBuffer();
    const b = new Uint8Array(head.byteLength + tail.byteLength + 8);
    b.set(new Uint8Array(head), 0); b.set(new Uint8Array(tail), head.byteLength);
    new DataView(b.buffer).setFloat64(b.length - 8, file.size);
    buf = b.buffer;
  } else buf = await file.arrayBuffer();
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(d.slice(0, 16), x => x.toString(16).padStart(2, '0')).join('');
}

const okDate = (d: unknown): d is Date => d instanceof Date && !isNaN(+d) && d.getFullYear() > 1990 && +d < Date.now() + 86_400_000;
/** A Date exifr built from EXIF wall-clock fields (in this browser's zone) back to those fields, as UTC ms */
const wallOf = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
const offsetMin = (s: unknown) => { const m = typeof s === 'string' && s.match(/^([+-])(\d{2}):?(\d{2})$/); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : null; };

// Phone and desktop screens: tall or wide ratios no camera makes
const SCREEN_RATIOS = [19.5 / 9, 2.16, 20 / 9, 16 / 9, 16 / 10, 4 / 3, 3 / 2];

export function looksLikeScreenshot(o: { name: string; type: string; hasCamera: boolean; hasGps: boolean; w: number; h: number; dpr?: number; screen?: { w: number; h: number } }): boolean {
  if (/screen ?shot|screenshot|bildschirmfoto|capture d.?(é|e)cran|captura de pantalla|schermata|スクリーンショット|스크린샷|屏幕截图|螢幕截圖/i.test(o.name)) return true;
  if (o.hasCamera || o.hasGps) return false;
  const long = Math.max(o.w, o.h), short = Math.min(o.w, o.h);
  if (!short) return false;
  if (o.screen && o.dpr && ((Math.abs(o.w - o.screen.w * o.dpr) < 2 && Math.abs(o.h - o.screen.h * o.dpr) < 2) || (Math.abs(o.h - o.screen.w * o.dpr) < 2 && Math.abs(o.w - o.screen.h * o.dpr) < 2))) return true;
  const ratio = long / short;
  return /png|webp/.test(o.type) && SCREEN_RATIOS.some(r => Math.abs(ratio - r) < 0.02);
}

async function scaled(src: ImageBitmap | HTMLVideoElement, w: number, h: number, max: number): Promise<{ canvas: OffscreenCanvas | HTMLCanvasElement; w: number; h: number }> {
  const s = Math.min(1, max / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
  const canvas: OffscreenCanvas | HTMLCanvasElement = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(cw, ch) : Object.assign(document.createElement('canvas'), { width: cw, height: ch });
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src as any, 0, 0, cw, ch);
  return { canvas, w: cw, h: ch };
}
const toBlob = (c: OffscreenCanvas | HTMLCanvasElement): Promise<Blob | null> => 'convertToBlob' in c
  ? c.convertToBlob({ type: 'image/webp', quality: 0.8 }).catch(() => null)
  : new Promise(ok => (c as HTMLCanvasElement).toBlob(b => ok(b), 'image/webp', 0.8));

async function videoFrame(file: File): Promise<{ bitmap: ImageBitmap; w: number; h: number; duration: number } | null> {
  if (typeof document === 'undefined') return null;
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  try {
    await new Promise<void>((ok, no) => { v.onloadeddata = () => ok(); v.onerror = () => no(new Error('video')); setTimeout(() => no(new Error('timeout')), 15000); });
    v.currentTime = Math.min(1, (v.duration || 2) / 2);
    await new Promise<void>(ok => { v.onseeked = () => ok(); setTimeout(ok, 3000); });
    const bitmap = await createImageBitmap(v);
    return { bitmap, w: v.videoWidth, h: v.videoHeight, duration: v.duration };
  } catch { return null; } finally { URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); }
}

export function browserReader(): Reader {
  let exifr: typeof import('exifr') | null = null;
  return {
    async read(file: File): Promise<ReadFile | null> {
      const video = isVideo(file);
      if (!video && !isImage(file)) return null;
      const id = await hashOf(file);
      let wall: number | null = null, date: string | null = null, timeZone: string | null = null, lat: number | null = null, lng: number | null = null;
      let hasCamera = false;
      if (!video) {
        exifr ??= await import('exifr');
        try {
          const x: any = await exifr.parse(file, { tiff: true, exif: true, gps: true, ifd1: false, xmp: true, icc: false, iptc: false, jfif: false, ihdr: false,
            pick: ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal', 'OffsetTime', 'Make', 'Model', 'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef', 'DateCreated'] });
          const when = okDate(x?.DateTimeOriginal) ? x.DateTimeOriginal : okDate(x?.CreateDate) ? x.CreateDate : okDate(x?.DateCreated) ? x.DateCreated : null;
          if (when) {
            wall = wallOf(when);
            const off = offsetMin(x?.OffsetTimeOriginal ?? x?.OffsetTime);
            if (off != null) { timeZone = x?.OffsetTimeOriginal ?? x?.OffsetTime; date = new Date(wall - off * 60000).toISOString(); }
            else date = when.toISOString();
          }
          if (typeof x?.latitude === 'number' && typeof x?.longitude === 'number' && !(x.latitude === 0 && x.longitude === 0)) { lat = x.latitude; lng = x.longitude; }
          hasCamera = !!(x?.Make || x?.Model);
        } catch { /* no EXIF: fine */ }
      }
      if (wall == null && file.lastModified) {
        // No date inside the file (screenshots, videos, saved images): when the file was last changed
        const d = new Date(file.lastModified);
        wall = wallOf(d); date = d.toISOString();
      }

      let bitmap: ImageBitmap | null = null, w = 0, h = 0;
      if (video) { const f = await videoFrame(file); if (f) { bitmap = f.bitmap; w = f.w; h = f.h; } }
      else { try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as any); w = bitmap.width; h = bitmap.height; } catch { bitmap = null; } }
      let thumb: Blob | null = null, work: ImageBitmap | null = null;
      if (bitmap) {
        const t = await scaled(bitmap, w, h, 256); thumb = await toBlob(t.canvas);
        const k = await scaled(bitmap, w, h, 640);
        work = await createImageBitmap(k.canvas as any);
        bitmap.close();
      }
      const scr = typeof window !== 'undefined' ? { w: window.screen?.width ?? 0, h: window.screen?.height ?? 0 } : undefined;
      const mediaType: MediaType = video ? 'video'
        : looksLikeScreenshot({ name: file.name, type: file.type, hasCamera, hasGps: lat != null, w, h, dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1, screen: scr }) ? 'screenshot' : 'photo';
      return { id, mediaType, wall, date, timeZone, lat, lng, w, h, thumb, work };
    },
  };
}
