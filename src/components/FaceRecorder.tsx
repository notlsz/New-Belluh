// Your Face: a couple of seconds of you, cut out from the background and played forward then back, used as your
// profile picture or dropped anywhere on your canvas. Frames are captured from the front camera, cut out with an
// on-device person segmenter (loaded only when you record), and kept as one transparent sprite sheet.
import React, { useEffect, useRef, useState } from 'react';
import { Emoji } from '../lib/emoji3d';
import type { Face } from '../services/look';

const N = 24, FPS = 12, SIZE = 256, COLS = 6;
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

// Plays a face sheet forward and back, like a boomerang
export const FaceSprite: React.FC<{ src: string; face: Face; size: number; className?: string; style?: React.CSSProperties }> = ({ src, face, size, className = '', style }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    let k = 0; const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    if (reduce) return;
    const t = setInterval(() => { k = (k + 1) % (face.n * 2 - 2); setI(k < face.n ? k : face.n * 2 - 2 - k); }, 1000 / FPS);
    return () => clearInterval(t);
  }, [face.n]);
  const rows = Math.ceil(face.n / face.cols);
  return <span role="img" className={`block ${className}`} style={{ width: size, height: size, backgroundImage: `url("${src}")`, backgroundSize: `${face.cols * 100}% ${rows * 100}%`, backgroundPosition: `${(i % face.cols) / Math.max(1, face.cols - 1) * 100}% ${Math.floor(i / face.cols) / Math.max(1, rows - 1) * 100}%`, ...style }} />;
};

async function cutOut(frames: HTMLCanvasElement[], onProgress: (p: number) => void): Promise<boolean> {
  try {
    const vision: any = await import(/* @vite-ignore */ `${VISION}/vision_bundle.mjs`);
    const fileset = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
    const seg = await vision.ImageSegmenter.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODEL }, runningMode: 'IMAGE', outputConfidenceMasks: true, outputCategoryMask: false });
    for (let f = 0; f < frames.length; f++) {
      const c = frames[f], ctx = c.getContext('2d')!;
      const res = seg.segment(c);
      const mask: Float32Array = res.confidenceMasks[0].getAsFloat32Array();
      const img = ctx.getImageData(0, 0, SIZE, SIZE);
      // Some models give the background channel first: make sure the middle of the frame (you) is kept
      const mid = mask[(SIZE / 2) * SIZE + SIZE / 2], flip = mid < 0.5;
      for (let p = 0; p < mask.length; p++) { const m = flip ? 1 - mask[p] : mask[p]; img.data[p * 4 + 3] = Math.max(0, Math.min(255, (m - 0.35) / 0.3 * 255)); }
      ctx.putImageData(img, 0, 0);
      res.close?.();
      onProgress((f + 1) / frames.length);
    }
    seg.close?.();
    return true;
  } catch { return false; }
}
// Without the segmenter: a soft oval around the face, so it still reads as a cutout
function softOval(frames: HTMLCanvasElement[]) {
  for (const c of frames) {
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.3, SIZE / 2, SIZE / 2, SIZE * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE); ctx.globalCompositeOperation = 'source-over';
  }
}

export interface FaceStrings { hint: string; go: string; rec: string; cutting: string; retake: string; asPfp: string; toCanvas: string; noCam: string; record: string }

const FaceRecorder: React.FC<{ S: FaceStrings; upload: (b: Blob, ext: string, type: string) => Promise<string | null>; resolve: (ref: string) => string | undefined; onDone: (face: Face, as: 'pfp' | 'canvas') => void; onClose: () => void }> = ({ S, upload, resolve, onDone, onClose }) => {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<'starting' | 'ready' | 'rec' | 'cutting' | 'review' | 'saving' | 'nocam'>('starting');
  const [progress, setProgress] = useState(0);
  const [sheet, setSheet] = useState<{ url: string; blob: Blob; type: string } | null>(null);

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false })
      .then(s => { stream.current = s; if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); } setState('ready'); })
      .catch(() => setState('nocam'));
    return () => { stream.current?.getTracks().forEach(t => t.stop()); };
  }, []);
  useEffect(() => () => { if (sheet) URL.revokeObjectURL(sheet.url); }, [sheet]);

  const record = async () => {
    const v = video.current; if (!v) return;
    setState('rec'); setProgress(0);
    const frames: HTMLCanvasElement[] = [];
    const side = Math.min(v.videoWidth, v.videoHeight), sx = (v.videoWidth - side) / 2, sy = (v.videoHeight - side) / 2;
    for (let f = 0; f < N; f++) {
      const c = document.createElement('canvas'); c.width = c.height = SIZE;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.translate(SIZE, 0); ctx.scale(-1, 1); // a mirror, the way you saw yourself
      ctx.drawImage(v, sx, sy, side, side, 0, 0, SIZE, SIZE);
      frames.push(c); setProgress((f + 1) / N);
      await new Promise(r => setTimeout(r, 1000 / FPS));
    }
    setState('cutting'); setProgress(0);
    if (!(await cutOut(frames, setProgress))) softOval(frames);
    const out = document.createElement('canvas'); out.width = SIZE * COLS; out.height = SIZE * Math.ceil(N / COLS);
    const o = out.getContext('2d')!; frames.forEach((c, f) => o.drawImage(c, (f % COLS) * SIZE, Math.floor(f / COLS) * SIZE));
    const webp = await new Promise<Blob | null>(r => out.toBlob(r, 'image/webp', 0.85));
    const blob = webp && webp.type === 'image/webp' ? webp : await new Promise<Blob | null>(r => out.toBlob(r, 'image/png'));
    if (!blob) { setState('ready'); return; }
    setSheet({ url: URL.createObjectURL(blob), blob, type: blob.type }); setState('review');
  };
  const save = async (as: 'pfp' | 'canvas') => {
    if (!sheet) return; setState('saving');
    const ref = await upload(sheet.blob, sheet.type === 'image/webp' ? 'webp' : 'png', sheet.type);
    if (!ref) { setState('review'); return; }
    stream.current?.getTracks().forEach(t => t.stop());
    onDone({ ref, n: N, cols: COLS }, as);
  };

  const face: Face = { ref: sheet?.url ?? '', n: N, cols: COLS };
  const btn = 'h-12 px-5 rounded-full text-[15px] font-bold whitespace-nowrap inline-flex items-center justify-center gap-2';
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[460px] rounded-[2rem] bg-white p-5 md:p-6 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.6)]" onClick={e => e.stopPropagation()}>
        <p className="text-[15px] font-semibold text-slate-500 text-center">{state === 'nocam' ? S.noCam : S.hint}</p>
        <div className="relative mt-4 mx-auto w-full aspect-square max-w-[360px] rounded-[1.75rem] overflow-hidden" style={{ background: state === 'review' ? 'repeating-conic-gradient(#f1f5f9 0 25%, #fff 0 50%) 0 0 / 24px 24px' : '#0f172a' }}>
          <video ref={video} playsInline muted className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${state === 'review' || state === 'nocam' ? 'invisible' : ''}`} />
          {state === 'review' && sheet && <div className="absolute inset-0 flex items-center justify-center"><FaceSprite src={sheet.url} face={face} size={300} style={{ filter: 'drop-shadow(0 0 0 #fff) drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff)' }} /></div>}
          {state === 'nocam' && <div className="absolute inset-0 flex items-center justify-center"><Emoji e="📷" size={72} /></div>}
          {(state === 'rec' || state === 'cutting') && (
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <p className="text-white text-[14px] font-bold">{state === 'rec' ? S.rec : S.cutting}</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/30 overflow-hidden"><div className="h-full bg-white transition-[width]" style={{ width: `${progress * 100}%` }} /></div>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {(state === 'ready' || state === 'starting') && <button type="button" disabled={state !== 'ready'} onClick={record} className={`${btn} bg-[#e5484d] text-white disabled:opacity-40`}><span className="w-3 h-3 rounded-full bg-white" />{S.go}</button>}
          {(state === 'review' || state === 'saving') && <>
            <button type="button" onClick={() => { setSheet(null); setState('ready'); }} className={`${btn} bg-slate-100 text-slate-700`}>{S.retake}</button>
            <button type="button" disabled={state === 'saving'} onClick={() => save('canvas')} className={`${btn} bg-slate-100 text-slate-800 disabled:opacity-40`}>{S.toCanvas}</button>
            <button type="button" disabled={state === 'saving'} onClick={() => save('pfp')} className={`${btn} bg-slate-900 text-white disabled:opacity-40`}>{S.asPfp}</button>
          </>}
        </div>
      </div>
    </div>
  );
};

export default FaceRecorder;
