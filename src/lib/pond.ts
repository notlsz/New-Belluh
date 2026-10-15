// Belluh's water: a small ripple simulation (the 2D wave equation) shaded as light-blue water, with the pond floor
// bending through the moving surface and highlights on the crests. One simulation is drawn into every Belluh sphere.
export interface Pond { canvas: HTMLCanvasElement; tick(now: number): void }

export function createPond(N = 110, interval = 2000): Pond {
  let cur = new Float32Array(N * N), prev = new Float32Array(N * N);
  const canvas = document.createElement('canvas'); canvas.width = N; canvas.height = N;
  const ctx = canvas.getContext('2d')!; const img = ctx.createImageData(N, N);
  let nextDrop = 0;
  const R0 = N / 2 - 1, C0 = N / 2 - 0.5;
  // The pond carries on past the edge: waves fade out near the rim instead of bouncing back
  const damp = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const q = Math.hypot(x - C0, y - C0) / R0;
    damp[y * N + x] = q < 0.72 ? 0.994 : q < 1 ? 0.994 - (q - 0.72) / 0.28 * 0.16 : 0;
  }
  const drop = (cx: number, cy: number, r: number, amp: number) => {
    for (let y = Math.max(1, cy - r); y < Math.min(N - 1, cy + r); y++) for (let x = Math.max(1, cx - r); x < Math.min(N - 1, cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy); if (d < r) cur[y * N + x] += amp * Math.cos((d / r) * Math.PI / 2);
    }
  };
  const step = () => {
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const i = y * N + x;
      prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - N] + cur[i + N]) * 0.5 - prev[i]) * damp[i];
    }
    const t = cur; cur = prev; prev = t;
  };
  const R = N / 2 - 1, C = N / 2 - 0.5;
  const render = () => {
    const d = img.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const o = (y * N + x) * 4, dx = x - C, dy = y - C, dist = Math.hypot(dx, dy);
      if (dist > R + 1) { d[o + 3] = 0; continue; }
      const i = y * N + x;
      const hx = (x > 0 && x < N - 1) ? cur[i + 1] - cur[i - 1] : 0;
      const hy = (y > 0 && y < N - 1) ? cur[i + N] - cur[i - N] : 0;
      // Refraction: the pond floor (light center, deeper blue edge) seen through the moving surface
      const sx = dx + hx * 5, sy = dy + hy * 5;
      const rr = Math.min(1, Math.hypot(sx, sy) / R), k = Math.pow(rr, 1.6);
      let r = 222 + (138 - 222) * k, g = 241 + (182 - 241) * k, b = 247 + (199 - 247) * k;
      // Light from the top left: crests brighten, troughs darken, and the steepest crests sparkle
      const light = (-hx - hy) * 0.5;
      const shade = Math.max(-38, Math.min(48, light * 70));
      const spec = light > 0 ? Math.min(160, light * light * 260) : 0;
      r += shade + spec; g += shade + spec; b += shade * 0.8 + spec;
      // A soft rim, like the edge of a drop of water
      const rim = Math.max(0, (dist / R) - 0.82) * 2.2;
      r -= rim * 30; g -= rim * 18; b -= rim * 6;
      d[o] = Math.max(0, Math.min(255, r)); d[o + 1] = Math.max(0, Math.min(255, g)); d[o + 2] = Math.max(0, Math.min(255, b));
      d[o + 3] = Math.max(0, Math.min(255, (R + 1 - dist) * 255));
    }
    ctx.putImageData(img, 0, 0);
  };
  return {
    canvas,
    tick(now: number) {
      if (now >= nextDrop) {
        // A stone near the middle: a ring, then a softer second ring right behind it, like a real splash.
        // Now and then a smaller stone lands off-center, so the rings cross.
        const cx = Math.round(C + (Math.random() - 0.5) * N * 0.1), cy = Math.round(C + (Math.random() - 0.5) * N * 0.1);
        drop(cx, cy, 5, 7);
        setTimeout(() => drop(cx, cy, 4, -3.5), 160);
        if (Math.random() < 0.4) setTimeout(() => drop(Math.round(C + (Math.random() - 0.5) * N * 0.5), Math.round(C + (Math.random() - 0.5) * N * 0.5), 3, 3.5), interval * 0.45);
        nextDrop = now + interval * (0.85 + Math.random() * 0.3);
      }
      step(); step(); render();
    },
  };
}
