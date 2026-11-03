// The phone's photo library for Belluh Memory, through Belluh's own plugin (native/belluh-native: Swift on iOS,
// Kotlin on Android). The web picker strips when and where a photo was taken; the plugin reads both on the device and
// hands over a 640 px copy, which the same on-device engine indexes. Photos and the index never leave the phone: the
// copies sit in the app's private cache and are deleted once indexed.

import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import type { Reader, ReadFile } from '../memory/reader.ts';

export type PhotoAccess = 'granted' | 'limited' | 'denied' | 'prompt';

export interface NativeAsset {
  /** PHAsset.localIdentifier on iOS, the MediaStore id on Android */
  id: string;
  /** Where reading got to (creation date on iOS, date added on Android), ms */
  key: number;
  /** When it was taken, as an instant (UTC ms) */
  createdAt: number;
  mediaType: 'photo' | 'video' | 'screenshot';
  width: number; height: number;
  /** The 640 px JPEG copy in the app's cache */
  path: string;
  /** EXIF DateTimeOriginal, "YYYY:MM:DD HH:MM:SS", the clock where it was taken */
  taken?: string;
  /** EXIF OffsetTimeOriginal, "+02:00" */
  offset?: string;
  lat?: number; lng?: number;
  favorite?: boolean;
}
export interface LibraryCursor { newest?: number; oldest?: number }
export interface Batch { assets: NativeAsset[]; more: boolean; cursor: LibraryCursor }
export interface SharedFile { path: string; mimeType: string }

export interface BelluhPhotosPlugin {
  checkPermissions(): Promise<{ photos: PhotoAccess }>;
  requestPermissions(): Promise<{ photos: PhotoAccess }>;
  /** Limited access: change which photos Belluh can see */
  manageLimited(): Promise<{ photos: PhotoAccess }>;
  openSettings(): Promise<void>;
  nextBatch(o: { limit: number; notBefore?: number }): Promise<Batch>;
  commit(o: { cursor: LibraryCursor; ids: string[] }): Promise<void>;
  setBackground(o: { enabled: boolean; notBefore?: number }): Promise<{ enabled: boolean }>;
  reset(): Promise<void>;
  getShared(): Promise<{ files: SharedFile[] }>;
  /** Whether this build can get a notification token (Android needs google-services.json) */
  pushReady(): Promise<{ ready: boolean }>;
  addListener(event: 'shared', cb: (e: { files: SharedFile[] }) => void): Promise<PluginListenerHandle>;
}

export const BelluhPhotos = registerPlugin<BelluhPhotosPlugin>('BelluhPhotos');

// ------------------------------------------------------------------------------------------------ dates and places

/** "2026:10:01 18:30:00" (EXIF) to those wall-clock fields as UTC ms; null when it isn't a real date */
export function exifWall(s: string | undefined | null): number | null {
  const m = typeof s === 'string' && s.match(/^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [y, mo, d, h, mi, se] = m.slice(1).map(Number);
  if (y < 1990 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || se > 60) return null;
  return Date.UTC(y, mo - 1, d, h, mi, se);
}

/** "+02:00", "-0530" to minutes east of UTC */
export function offsetMinutes(s: string | undefined | null): number | null {
  const m = typeof s === 'string' && s.trim().match(/^([+-])(\d{2}):?(\d{2})$/);
  return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : null;
}

/** The engine's three times for an asset: the local wall clock, the instant, and the zone when known */
export function timesOf(a: Pick<NativeAsset, 'createdAt' | 'taken' | 'offset'>, deviceOffsetAt: (ms: number) => number = ms => -new Date(ms).getTimezoneOffset()): { wall: number | null; date: string | null; timeZone: string | null } {
  const okInstant = Number.isFinite(a.createdAt) && a.createdAt > Date.UTC(1990, 0, 1);
  const wall = exifWall(a.taken);
  const off = offsetMinutes(a.offset);
  if (wall != null && off != null) return { wall, date: new Date(wall - off * 60_000).toISOString(), timeZone: a.offset!.trim() };
  if (wall != null) return { wall, date: okInstant ? new Date(a.createdAt).toISOString() : null, timeZone: null };
  if (!okInstant) return { wall: null, date: null, timeZone: null };
  // No EXIF clock (videos, screenshots, saved images): the library's instant, on this phone's clock
  return { wall: a.createdAt + deviceOffsetAt(a.createdAt) * 60_000, date: new Date(a.createdAt).toISOString(), timeZone: null };
}

const okPlace = (lat: unknown, lng: unknown) => typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
  && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/** A stable id for a library asset (the same photo read twice is indexed once), shaped like the engine's content ids */
export async function nativeId(platform: string, assetId: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`belluh-native:${platform}:${assetId}`)));
  return Array.from(d.slice(0, 16), x => x.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------------------------------------------------ the reader

/** Library copies the engine is about to read, with what the plugin knows about each */
const known = new WeakMap<File, NativeAsset>();
export const rememberAsset = (f: File, a: NativeAsset) => { known.set(f, a); };
export const assetOf = (f: File) => known.get(f) ?? null;

/** The 640 px copy as a File the engine can read */
export function assetFile(a: NativeAsset, blob: Blob): File {
  const f = new File([blob], `${a.mediaType === 'screenshot' ? 'Screenshot' : 'IMG'}-${a.key}.jpg`, { type: 'image/jpeg', lastModified: a.createdAt });
  rememberAsset(f, a);
  return f;
}

/**
 * The engine's reader, aware of the library: for a library copy it decodes the image as usual (preview and model
 * input) and takes the date, place, kind and size from the plugin; every other file is read exactly as on the web.
 */
export function nativeAwareReader(base: Reader, platform: string, lookup: (f: File) => NativeAsset | null = assetOf): Reader {
  return {
    async read(file: File): Promise<ReadFile | null> {
      const a = lookup(file);
      if (!a) return base.read(file);
      const got = await base.read(file);
      if (!got) return null;
      const t = timesOf(a);
      const place = okPlace(a.lat, a.lng);
      return {
        ...got,
        id: await nativeId(platform, a.id),
        mediaType: a.mediaType,
        wall: t.wall ?? got.wall, date: t.date ?? got.date, timeZone: t.timeZone,
        lat: place ? a.lat! : null, lng: place ? a.lng! : null,
        w: a.width || got.w, h: a.height || got.h,
      };
    },
  };
}
