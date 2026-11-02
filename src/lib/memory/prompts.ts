// The vocabulary's text embeddings, computed once with the same model (scripts/memory-prompts.mjs) and shipped as a small
// lazy asset (int8 per row, with a scale), so the first run doesn't spend half a minute embeddings 300 prompts in WASM.
// If the vocabulary or the model changes, the key no longer matches and the worker computes them itself.

import { LABELS, SENSITIVE, promptOf } from './vocab.ts';
import { MODEL_ID } from './constants.ts';

export const labelPrompts = () => LABELS.map(promptOf);
export const sensitivePrompts = () => SENSITIVE.flatMap(s => s.prompts.map(p => `a photo of ${p}.`));

/** Changes whenever the model or any prompt does */
export function vocabKey(): string {
  let h = 2166136261;
  const s = [MODEL_ID, ...labelPrompts(), '|', ...sensitivePrompts()].join('\n');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

const b64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export function encodePrompts(key: string, dim: number, rows: Float32Array): string {
  const n = rows.length / dim, q = new Int8Array(rows.length), scales = new Float32Array(n);
  for (let r = 0; r < n; r++) {
    let mx = 0; for (let i = 0; i < dim; i++) mx = Math.max(mx, Math.abs(rows[r * dim + i]));
    scales[r] = mx / 127 || 1;
    for (let i = 0; i < dim; i++) q[r * dim + i] = Math.round(rows[r * dim + i] / scales[r]);
  }
  return [key, `${dim} ${n}`, b64(new Uint8Array(q.buffer)), b64(new Uint8Array(scales.buffer))].join('\n');
}

export function decodePrompts(text: string): { key: string; dim: number; rows: Float32Array } | null {
  const [key, shape, qs, ss] = text.trim().split('\n');
  if (!key || !shape || !qs || !ss) return null;
  const [dim, n] = shape.split(' ').map(Number);
  const q = new Int8Array(unb64(qs).buffer), scales = new Float32Array(unb64(ss).buffer);
  if (q.length !== dim * n || scales.length !== n) return null;
  const rows = new Float32Array(dim * n);
  for (let r = 0; r < n; r++) {
    let s = 0;
    for (let i = 0; i < dim; i++) { const v = q[r * dim + i] * scales[r]; rows[r * dim + i] = v; s += v * v; }
    s = Math.sqrt(s) || 1; for (let i = 0; i < dim; i++) rows[r * dim + i] /= s;
  }
  return { key, dim, rows };
}
