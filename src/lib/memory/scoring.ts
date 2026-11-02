// From the image model's similarities to labels and sensitivity marks, on the device. Pure, so it's unit-tested.
// Calibrated on MobileCLIP-S0 (fp16 image tower, q8 text tower) with 80 real photos from SUN397 and Food-101:
// matching labels sit at cosine 0.22 to 0.32, unrelated ones below 0.2.

import type { Sensitivity } from './types.ts';
import { LABELS, SENSITIVE } from './vocab.ts';

/** MobileCLIP's logit scale */
const SCALE = 100;
/** Below this cosine a label is not believed, whatever its share */
export const LABEL_GATE = 0.17;

export function labelsFrom(sims: ArrayLike<number>, names: string[] = LABELS.map(l => l.name), keep = 6): { name: string; p: number }[] {
  let mx = -Infinity; for (let i = 0; i < sims.length; i++) mx = Math.max(mx, sims[i]);
  let z = 0; const ex = new Float64Array(sims.length);
  for (let i = 0; i < sims.length; i++) { ex[i] = Math.exp((sims[i] - mx) * SCALE); z += ex[i]; }
  const out: { name: string; p: number }[] = [];
  for (let i = 0; i < sims.length; i++) {
    const gate = Math.max(0, Math.min(1, (sims[i] - LABEL_GATE) / 0.04));
    const p = (ex[i] / z) * gate;
    if (p >= 0.05) out.push({ name: names[i], p: Math.round(p * 100) / 100 });
  }
  return out.sort((a, b) => b.p - a.p).slice(0, keep);
}

// Conservative: a kind is marked only when its best prompt beats every everyday label and clears a floor. A museum
// portrait scored 0.234 for "ID card" in calibration, so the floors sit above that. Text read from the image
// (sensitiveText in vocab.ts) marks what the image model misses.
export const SENS_FLOOR: Record<Sensitivity, number> = { id: 0.245, payment: 0.245, credential: 0.24, health: 0.245, nudity: 0.26 };

export function sensitivityFrom(sens: ArrayLike<number>, sims: ArrayLike<number>): { kind: Sensitivity | null; candidate: boolean } {
  let top = -Infinity; for (let i = 0; i < sims.length; i++) top = Math.max(top, sims[i]);
  let o = 0, best: { kind: Sensitivity; s: number } | null = null, near = false;
  for (const g of SENSITIVE) {
    let s = -Infinity; for (let i = 0; i < g.prompts.length; i++) s = Math.max(s, sens[o + i]);
    o += g.prompts.length;
    if (s >= SENS_FLOOR[g.kind] && s >= top && (!best || s > best.s)) best = { kind: g.kind, s };
    if (s >= 0.2 && s >= top - 0.02) near = true;
  }
  // Near misses get their text read (when reading text is on), so the words can decide
  return { kind: best?.kind ?? null, candidate: !best && near };
}
