/// <reference lib="webworker" />
// Belluh Memory's understanding, in a Web Worker on the device. Loaded only once the person turns Memory on.
//   Image model: Apple's MobileCLIP-S0 (Xenova/mobileclip_s0, ONNX) via transformers.js. Its image tower embeds each
//   photo; its text tower embeds searches and a curated vocabulary for zero-shot labels and sensitivity.
//   People (opt-in only): OpenCV Zoo's YuNet face detector and SFace face embedder (MobileFaceNet), via onnxruntime-web.
// Models come from the Hugging Face CDN on first run and stay in the browser's Cache Storage. Images, embeddings and
// labels never leave this worker except back to the engine on the same device.

import type { Sensitivity } from './types.ts';
import { MODEL_ID, MODEL_CACHE } from './constants.ts';

const HF = 'https://huggingface.co';
export const FACE_MODELS = {
  detector: `${HF}/opencv/face_detection_yunet/resolve/main/face_detection_yunet_2023mar.onnx`,
  embedder: `${HF}/opencv/face_recognition_sface/resolve/main/face_recognition_sface_2021dec_int8.onnx`,
};

export type WorkerIn =
  | { type: 'load'; vision: 'fp16' | 'fp32'; prompts: string[]; promptCache?: Float32Array | null; sensitive: { kind: Sensitivity; prompts: string[] }[]; sensCache?: Float32Array | null; faces: boolean }
  | { type: 'image'; id: string; bitmap: ImageBitmap; faces: boolean }
  | { type: 'text'; id: string; text: string };
export type WorkerOut =
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'loaded'; promptMatrix: Float32Array; dim: number; vision: string }
  | { type: 'image'; id: string; vec: Float32Array; sims: Float32Array; sens: Float32Array; faces: { box: [number, number, number, number]; score: number; emb: Float32Array }[] }
  | { type: 'text'; id: string; vec: Float32Array }
  | { type: 'error'; id?: string; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let T: typeof import('@huggingface/transformers') | null = null;
let tokenizer: any, textModel: any, processor: any, visionModel: any;
let promptMatrix: Float32Array | null = null, dim = 512, nPrompts = 0;
let sensMatrix: Float32Array | null = null, nSens = 0;
let ort: typeof import('onnxruntime-web') | null = null;
let yunet: any = null, sface: any = null;

const normalize = (v: Float32Array) => { let s = 0; for (const x of v) s += x * x; s = Math.sqrt(s) || 1; for (let i = 0; i < v.length; i++) v[i] /= s; return v; };

// Expected download sizes (MB), so progress moves smoothly from the first byte
const SIZES: Record<string, number> = { vision_fp16: 22.9, vision_fp32: 45.5, text: 42.8, small: 2.5, yunet: 0.23, sface: 9.9 };

async function cachedFetch(url: string, onBytes: (n: number) => void): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try { cache = await caches.open(MODEL_CACHE); const hit = await cache.match(url); if (hit) { const b = await hit.arrayBuffer(); onBytes(b.byteLength); return b; } } catch { cache = null; }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
  const reader = res.body.getReader(); const chunks: Uint8Array[] = []; let n = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); n += value.length; onBytes(value.length); }
  const out = new Uint8Array(n); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
  try { await cache?.put(url, new Response(out.slice().buffer, { headers: { 'Content-Type': 'application/octet-stream' } })); } catch { /* storage full: still works this session */ }
  return out.buffer;
}

async function embedTexts(texts: string[]): Promise<Float32Array> {
  const out = new Float32Array(texts.length * dim);
  for (let i = 0; i < texts.length; i += 32) {
    const batch = texts.slice(i, i + 32);
    const inputs = tokenizer(batch, { padding: 'max_length', truncation: true });
    const { text_embeds } = await textModel(inputs);
    dim = text_embeds.dims[1];
    for (let j = 0; j < batch.length; j++) out.set(normalize(Float32Array.from(text_embeds.data.slice(j * dim, (j + 1) * dim))), (i + j) * dim);
  }
  return out;
}

async function load(msg: Extract<WorkerIn, { type: 'load' }>) {
  T = await import('@huggingface/transformers');
  // transformers.js points the ONNX runtime at jsDelivr; the build already ships the runtime's wasm next to this worker
  // (hashed, same origin), so use that one: no third-party request, one copy.
  const onnxEnv = (T.env.backends as any)?.onnx;
  if (onnxEnv?.wasm && !(self as any).__BELLUH_ORT_CDN) onnxEnv.wasm.wasmPaths = undefined;
  T.env.allowLocalModels = false;
  T.env.useBrowserCache = true;
  const total = (msg.vision === 'fp16' ? SIZES.vision_fp16 : SIZES.vision_fp32) + SIZES.text + SIZES.small + (msg.faces ? SIZES.yunet + SIZES.sface : 0);
  const files = new Map<string, number>();
  let faceBytes = 0;
  const report = () => ctx.postMessage({ type: 'progress', loaded: ([...files.values()].reduce((a, b) => a + b, 0) + faceBytes) / 1e6, total } satisfies WorkerOut);
  const progress_callback = (p: any) => { if (p?.status === 'progress' && p.file) { files.set(p.file, p.loaded ?? 0); report(); } else if (p?.status === 'done' && p.file && p.total) { files.set(p.file, p.total); report(); } };
  const model_id = MODEL_ID;
  [tokenizer, processor] = await Promise.all([T.AutoTokenizer.from_pretrained(model_id, { progress_callback }), T.AutoProcessor.from_pretrained(model_id, { progress_callback })]);
  textModel = await T.CLIPTextModelWithProjection.from_pretrained(model_id, { dtype: 'q8', device: 'wasm', progress_callback });
  let vision = msg.vision;
  try { visionModel = await T.CLIPVisionModelWithProjection.from_pretrained(model_id, { dtype: vision, device: 'wasm', progress_callback }); }
  catch (e) {
    if (vision !== 'fp16') throw e;
    // Some browsers' WASM backends can't run the half-precision tower: fall back to full precision
    vision = 'fp32';
    visionModel = await T.CLIPVisionModelWithProjection.from_pretrained(model_id, { dtype: 'fp32', device: 'wasm', progress_callback });
  }
  if (msg.faces) await loadFaces(n => { faceBytes += n; report(); });
  nPrompts = msg.prompts.length;
  promptMatrix = msg.promptCache && msg.promptCache.length === nPrompts * dim ? msg.promptCache : await embedTexts(msg.prompts);
  const sensPrompts = msg.sensitive.flatMap(s => s.prompts.map(p => `a photo of ${p}.`));
  nSens = sensPrompts.length;
  sensMatrix = msg.sensCache && msg.sensCache.length === nSens * dim ? msg.sensCache : await embedTexts(sensPrompts);
  ctx.postMessage({ type: 'loaded', promptMatrix, dim, vision } satisfies WorkerOut);
}

async function loadFaces(onBytes: (n: number) => void) {
  if (yunet && sface) return;
  ort = await import('onnxruntime-web');
  const [d, e] = await Promise.all([cachedFetch(FACE_MODELS.detector, onBytes), cachedFetch(FACE_MODELS.embedder, onBytes)]);
  yunet = await ort.InferenceSession.create(new Uint8Array(d), { executionProviders: ['wasm'], logSeverityLevel: 3 });
  sface = await ort.InferenceSession.create(new Uint8Array(e), { executionProviders: ['wasm'], logSeverityLevel: 3 });
}

function pixels(bitmap: ImageBitmap, w: number, h: number): ImageData {
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext('2d')!;
  g.drawImage(bitmap, 0, 0, w, h);
  return g.getImageData(0, 0, w, h);
}

const matVec = (m: Float32Array, rows: number, v: Float32Array) => {
  const out = new Float32Array(rows);
  for (let r = 0; r < rows; r++) { let s = 0; const o = r * dim; for (let i = 0; i < dim; i++) s += m[o + i] * v[i]; out[r] = s; }
  return out;
};

async function image(msg: Extract<WorkerIn, { type: 'image' }>) {
  const { bitmap } = msg;
  // The processor resizes and crops to the model's 256 px; a 320 px copy is plenty to start from
  const s = Math.min(1, 320 / Math.min(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * s)), h = Math.max(1, Math.round(bitmap.height * s));
  const data = pixels(bitmap, w, h);
  const raw = new T!.RawImage(new Uint8ClampedArray(data.data), w, h, 4).rgb();
  const { image_embeds } = await visionModel(await processor(raw));
  const vec = normalize(Float32Array.from(image_embeds.data));
  const sims = matVec(promptMatrix!, nPrompts, vec);
  const sens = matVec(sensMatrix!, nSens, vec);
  let faces: { box: [number, number, number, number]; score: number; emb: Float32Array }[] = [];
  if (msg.faces) {
    if (!yunet) await loadFaces(() => {});
    faces = await detectFaces(bitmap);
  }
  bitmap.close();
  ctx.postMessage({ type: 'image', id: msg.id, vec, sims, sens, faces } satisfies WorkerOut, [vec.buffer, sims.buffer, sens.buffer, ...faces.map(f => f.emb.buffer)]);
}

// ---- Faces: YuNet (640x640 letterbox, BGR 0-255) then SFace on a 112x112 crop aligned to the ArcFace template ----
const YN = 640;
const TEMPLATE = [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]];

async function detectFaces(bitmap: ImageBitmap) {
  const scale = YN / Math.max(bitmap.width, bitmap.height);
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const c = new OffscreenCanvas(YN, YN); const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, YN, YN); g.drawImage(bitmap, 0, 0, w, h);
  const px = g.getImageData(0, 0, YN, YN).data;
  const input = new Float32Array(3 * YN * YN);
  for (let i = 0, n = YN * YN; i < n; i++) { input[i] = px[i * 4 + 2]; input[n + i] = px[i * 4 + 1]; input[2 * n + i] = px[i * 4]; }
  const out = await yunet.run({ input: new ort!.Tensor('float32', input, [1, 3, YN, YN]) });
  const dets: { x: number; y: number; w: number; h: number; s: number; kps: number[][] }[] = [];
  for (const stride of [8, 16, 32]) {
    const cols = YN / stride, rows = YN / stride;
    const cls = out[`cls_${stride}`].data as Float32Array, obj = out[`obj_${stride}`].data as Float32Array;
    const bbox = out[`bbox_${stride}`].data as Float32Array, kps = out[`kps_${stride}`].data as Float32Array;
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const i = r * cols + col;
      const score = Math.sqrt(Math.min(1, Math.max(0, cls[i])) * Math.min(1, Math.max(0, obj[i])));
      if (score < 0.8) continue;
      const cx = (col + bbox[i * 4]) * stride, cy = (r + bbox[i * 4 + 1]) * stride;
      const bw = Math.exp(bbox[i * 4 + 2]) * stride, bh = Math.exp(bbox[i * 4 + 3]) * stride;
      const k: number[][] = [];
      for (let n = 0; n < 5; n++) k.push([(kps[i * 10 + 2 * n] + col) * stride / scale, (kps[i * 10 + 2 * n + 1] + r) * stride / scale]);
      dets.push({ x: (cx - bw / 2) / scale, y: (cy - bh / 2) / scale, w: bw / scale, h: bh / scale, s: score, kps: k });
    }
  }
  // Non-maximum suppression
  dets.sort((a, b) => b.s - a.s);
  const keep: typeof dets = [];
  const iou = (a: typeof dets[0], b: typeof dets[0]) => {
    const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y), x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    return inter / (a.w * a.h + b.w * b.h - inter);
  };
  for (const d of dets) if (keep.every(k => iou(k, d) < 0.3)) keep.push(d);
  const minSide = Math.min(bitmap.width, bitmap.height) * 0.04;
  const faces: { box: [number, number, number, number]; score: number; emb: Float32Array }[] = [];
  for (const d of keep.slice(0, 8)) {
    if (d.w < Math.max(20, minSide)) continue;   // too small to tell who it is
    const emb = await embedFace(bitmap, d.kps);
    const W = bitmap.width, H = bitmap.height;
    faces.push({ box: [Math.max(0, d.x / W), Math.max(0, d.y / H), Math.min(1, d.w / W), Math.min(1, d.h / H)], score: d.s, emb });
  }
  return faces;
}

async function embedFace(bitmap: ImageBitmap, kps: number[][]): Promise<Float32Array> {
  // Similarity transform (rotation, scale, shift) from the 5 landmarks to the template, least squares
  const mean = (pts: number[][]) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const [sx, sy] = mean(kps), [dx, dy] = mean(TEMPLATE);
  let re = 0, im = 0, den = 0;
  for (let i = 0; i < 5; i++) {
    const px = kps[i][0] - sx, py = kps[i][1] - sy, qx = TEMPLATE[i][0] - dx, qy = TEMPLATE[i][1] - dy;
    re += px * qx + py * qy; im += px * qy - py * qx; den += px * px + py * py;
  }
  const a = re / den, b = im / den;
  const tx = dx - (a * sx - b * sy), ty = dy - (b * sx + a * sy);
  const c = new OffscreenCanvas(112, 112); const g = c.getContext('2d')!;
  g.setTransform(a, b, -b, a, tx, ty);
  g.drawImage(bitmap, 0, 0);
  const px = g.getImageData(0, 0, 112, 112).data;
  const n = 112 * 112, input = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) { input[i] = px[i * 4]; input[n + i] = px[i * 4 + 1]; input[2 * n + i] = px[i * 4 + 2]; }
  const out = await sface.run({ data: new ort!.Tensor('float32', input, [1, 3, 112, 112]) });
  return normalize(Float32Array.from(out[Object.keys(out)[0]].data as Float32Array));
}

ctx.onmessage = async (e: MessageEvent<WorkerIn>) => {
  const msg = e.data;
  try {
    if (msg.type === 'load') await load(msg);
    else if (msg.type === 'image') await image(msg);
    else if (msg.type === 'text') {
      const vec = (await embedTexts([msg.text])).slice(0, dim);
      ctx.postMessage({ type: 'text', id: msg.id, vec } satisfies WorkerOut, [vec.buffer]);
    }
  } catch (err: any) {
    ctx.postMessage({ type: 'error', id: (msg as any).id, message: String(err?.message ?? err) } satisfies WorkerOut);
  }
};
