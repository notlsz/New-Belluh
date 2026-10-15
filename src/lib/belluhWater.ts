// Belluh's body: a raymarched body of light-blue water (a WebGL shader) whose motion shows what Belluh is doing:
//   idle       slow breathing, rings drifting across the surface
//   listening  every keystroke sends a small ring up the front, the surface tightens toward you
//   thinking   ripple sources orbit fast, the water draws in and glows from inside
//   talking    every word sends a ring from the front and swells the water toward you
// and it can take shapes (heart, star, cat, bunny, butterfly, drop) while staying water.
const FRAG = `
precision highp float;
uniform float t; uniform vec2 res;
uniform float think, talk, listen, shapeA, shapeB, morphK, rotY, rotX;
uniform vec4 pulse[6];
uniform float pamp[6];
uniform sampler2D texA, texB;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }

vec3 src(float k){
  float a = t * (0.21 + 0.05 * k) + k * 2.4;
  float b = t * (0.15 - 0.03 * k) + k * 1.7;
  vec3 s = normalize(vec3(cos(a) * cos(b), sin(b) * 0.9 + 0.15 * sin(k), sin(a) * cos(b)));
  float o = t * 1.7 + k * 1.5708;
  vec3 orbit = normalize(vec3(cos(o), 0.35 * sin(t * 0.9 + k), sin(o)));
  s = normalize(mix(s, orbit, think));
  return normalize(mix(s, normalize(vec3(0.3 * sin(k * 2.0), -0.35, 1.0)), listen * 0.55));
}
float rings(vec3 n){
  float h = 0.0;
  for (int i = 0; i < 4; i++) {
    float k = float(i);
    float d = acos(clamp(dot(n, src(k)), -1.0, 1.0));
    float f = 26.0 + 5.0 * k + think * 12.0 + listen * 6.0;
    h += sin(d * f - t * (4.2 + 0.6 * k) + k * 1.9) * exp(-d * 0.9) * (0.75 + 0.25 * sin(t * 0.7 + k));
  }
  return h;
}
float pulses(vec3 n){
  float h = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 P = pulse[i];
    if (P.w < 6.0) {
      float d = acos(clamp(dot(n, normalize(P.xyz)), -1.0, 1.0));
      float x = d - P.w * 1.9;
      h += pamp[i] * sin(x * 21.0) * exp(-x * x * 10.0) * exp(-P.w * 1.2) * smoothstep(0.0, 0.08, P.w);
    }
  }
  return h;
}
float morph(vec3 n){
  return (noise(n * 1.05 + vec3(0.0, t * 0.30, t * 0.20)) - 0.5) * 0.22
       + (noise(n * 1.9 - vec3(t * 0.26, 0.0, t * 0.18)) - 0.5) * 0.06;
}
float grain(vec3 n){
  vec3 q = n * 5.0 + vec3(0.0, t * 0.6, 0.0);
  q += vec3(noise(q + 3.1), noise(q + 7.7), noise(q + 1.3)) * 1.2;
  return noise(q) - 0.5;
}

// The shape someone asked for: a signed distance field of its silhouette (texA / texB), inflated into soft 3D water.
float outline(vec2 p, sampler2D tex){
  vec2 uv = vec2(0.5 + p.x / 2.2, 0.5 - p.y / 2.2);
  float d = (texture2D(tex, clamp(uv, 0.0, 1.0)).r * 255.0 - 128.0) / 200.0;
  vec2 o = abs(p) - 1.1;
  return max(d, max(o.x, o.y));
}
float shape(vec3 p, float kind, sampler2D tex){
  if (kind < 0.5) return length(p) - 0.80;
  float d2 = outline(p.xy, tex);
  return max(d2, abs(p.z) - 0.62 * sqrt(max(-d2, 0.0)));
}

float sdf(vec3 p){
  float cy = cos(rotY), sy = sin(rotY);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  float cx = cos(rotX), sx = sin(rotX);
  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  vec3 n = normalize(p);
  float base = mix(shape(p, shapeA, texA), shape(p, shapeB, texB), morphK);
  float water = (shapeA < 0.5 ? 1.0 - morphK : 0.0) + (shapeB < 0.5 ? morphK : 0.0);
  float splash = sin(morphK * 3.14159);
  float disp = morph(n) * mix(0.3, 1.0, water) + splash * 0.16 * (noise(n * 2.6 + t * 1.3) - 0.5);
  disp += 0.017 * rings(n) * mix(0.55, 1.0, water) + 0.007 * grain(n) + 0.022 * pulses(n);
  disp += 0.014 * sin(t * 1.1) * (1.0 - think) - 0.05 * think;
  disp += talk * 0.075 * smoothstep(-0.3, 1.0, n.z) + listen * 0.02 * smoothstep(0.0, 1.0, n.z);
  return (base - disp) * 0.55;
}

vec3 env(vec3 d){
  float y = d.y * 0.5 + 0.5;
  vec3 c = mix(vec3(0.58, 0.74, 0.81), vec3(0.97, 0.99, 1.0), smoothstep(0.0, 1.0, y));
  c += vec3(1.0) * 1.3 * smoothstep(0.55, 0.85, dot(d, normalize(vec3(-0.6, 0.7, 0.45))));
  c += vec3(0.9, 0.97, 1.0) * 0.7 * smoothstep(0.9, 0.97, dot(d, normalize(vec3(0.85, 0.15, 0.5))));
  c += vec3(0.80, 0.92, 0.97) * 0.35 * smoothstep(-0.2, -0.8, d.y);
  return c;
}

void main(){
  vec2 uv = (gl_FragCoord.xy / res) * 2.0 - 1.0;
  float px = 2.0 / res.x;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv * 1.17, -3.0));
  float tt = 1.5, minD = 1e3, hit = 0.0;
  for (int i = 0; i < 80; i++) {
    float d = sdf(ro + rd * tt);
    minD = min(minD, d / (tt * 0.39));
    if (d < 0.0007) { hit = 1.0; break; }
    tt += d;
    if (tt > 4.5) break;
  }
  float cover = hit > 0.5 ? 1.0 : 1.0 - smoothstep(0.0, px * 1.4, minD);
  if (cover <= 0.0) { gl_FragColor = vec4(0.0); return; }

  vec3 p = ro + rd * tt;
  vec2 e = vec2(0.0025, 0.0);
  vec3 N = normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
  if (hit < 0.5) N = normalize(vec3(uv, 0.05));
  vec3 V = -rd;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float F = 0.06 + 0.94 * pow(1.0 - ndv, 4.0);

  vec3 refl = env(reflect(rd, N));
  vec3 rr = refract(rd, N, 1.0 / 1.33);
  float thick = 2.0 * max(dot(-rr, normalize(p)), 0.0) * 0.8;
  vec3 tint = exp(-thick * vec3(0.70, 0.30, 0.20));
  vec3 exitN = normalize(p + rr * thick);
  vec3 through = env(refract(rr, -exitN, 1.33)) * tint;

  float cr = rings(exitN) + grain(exitN) * 1.2;
  float caustic = pow(1.0 - abs(sin(cr * 1.6)), 5.0) * smoothstep(0.1, 0.9, ndv);
  vec3 body = through + vec3(0.85, 0.96, 1.0) * caustic * (0.32 + 0.25 * think);
  body += vec3(0.75, 0.90, 0.96) * 0.35 * smoothstep(0.2, -0.9, N.y) * (1.0 - ndv);
  body += vec3(0.82, 0.94, 1.0) * think * 0.22 * (0.6 + 0.4 * sin(t * 2.6)) * ndv;
  body = mix(body, vec3(0.61, 0.75, 0.80), 0.18);

  vec3 col = mix(body, refl, F);
  vec3 L1 = normalize(vec3(-0.55, 0.65, 0.55)), L2 = normalize(vec3(0.7, -0.2, 0.6));
  vec3 R = reflect(rd, N);
  col += vec3(1.0) * (pow(max(dot(R, L1), 0.0), 140.0) * 1.6 + pow(max(dot(R, L2), 0.0), 60.0) * 0.35);
  col += vec3(0.9, 0.97, 1.0) * pow(1.0 - ndv, 3.0) * 0.35;
  col += vec3(0.9, 0.97, 1.0) * talk * 0.07;
  col = clamp(col, 0.0, 1.0);
  float a = cover * (0.90 + 0.10 * F);
  gl_FragColor = vec4(col * a, a);
}`;

export type WaterState = 'idle' | 'listening' | 'thinking' | 'talking';
/** What the water becomes: an emoji's silhouette, SVG path data in a 100x100 box, or text. */
export type ShapeSpec = { emoji?: string; path?: string; text?: string };

const BELLUH_SPEED: Record<WaterState, number> = { idle: 1, listening: 1.25, thinking: 2.3, talking: 1.5 };
const SDF_GRID = 128;

/** Squared distance transform (Felzenszwalb and Huttenlocher), in place over a grid of 0 (feature) and 1e20. */
function belluhEdt(g: Float64Array, n: number) {
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const pass = (get: (i: number) => number, set: (i: number, v: number) => void) => {
    for (let q = 0; q < n; q++) f[q] = get(q);
    let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
    for (let q = 1; q < n; q++) {
      let sx = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (sx <= z[k]) { k--; sx = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = sx; z[k + 1] = 1e20;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    for (let q = 0; q < n; q++) set(q, d[q]);
  };
  for (let x = 0; x < n; x++) pass(y => g[y * n + x], (y, val) => { g[y * n + x] = val; });
  for (let y = 0; y < n; y++) pass(x => g[y * n + x], (x, val) => { g[y * n + x] = val; });
  return g;
}

/**
 * Turns anything drawable into the water's shape: draw(ctx, 256) paints it on a transparent canvas, and this
 * returns a 128x128 signed distance field (bytes, 128 = the edge) of its silhouette, scaled to fit, or null.
 */
export function belluhSilhouette(draw: (x: CanvasRenderingContext2D, n: number) => void): Uint8Array | null {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d', { willReadFrequently: true });
  draw(x, 256);
  const a = x.getImageData(0, 0, 256, 256).data;
  let x0 = 256, y0 = 256, x1 = -1, y1 = -1;
  for (let y = 0; y < 256; y++) for (let i = 0; i < 256; i++) if (a[(y * 256 + i) * 4 + 3] > 90) {
    if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0 || (x1 - x0) * (y1 - y0) < 40) return null;
  const N = SDF_GRID;
  const g = document.createElement('canvas'); g.width = g.height = N;
  const gx = g.getContext('2d', { willReadFrequently: true });
  const w = x1 - x0 + 1, h = y1 - y0 + 1, sc = 104 / Math.max(w, h);
  gx.drawImage(c, x0, y0, w, h, (N - w * sc) / 2, (N - h * sc) / 2, w * sc, h * sc);
  const ga = gx.getImageData(0, 0, N, N).data;
  const inner = new Float64Array(N * N), outer = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) { const inside = ga[i * 4 + 3] > 100; inner[i] = inside ? 1e20 : 0; outer[i] = inside ? 0 : 1e20; }
  belluhEdt(inner, N); belluhEdt(outer, N);
  let sd = new Float32Array(N * N);
  const px = 2.2 / N;
  for (let i = 0; i < N * N; i++) sd[i] = (outer[i] > 0 ? Math.sqrt(outer[i]) - 0.5 : -(Math.sqrt(inner[i]) - 0.5)) * px;
  for (let pass = 0; pass < 2; pass++) {
    const b = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let i = 0; i < N; i++) {
      let sum = 0, cnt = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = i + dx;
        if (yy >= 0 && yy < N && xx >= 0 && xx < N) { sum += sd[yy * N + xx]; cnt++; }
      }
      b[y * N + i] = sum / cnt;
    }
    sd = b;
  }
  const out = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) out[i] = Math.max(0, Math.min(255, Math.round(128 + sd[i] * 200)));
  return out;
}

const BELLUH_EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
/** A shape request as a drawing: {emoji}, {path} (SVG path data in a 100x100 box) or {text}. */
function belluhDrawFor(spec: ShapeSpec): ((x: CanvasRenderingContext2D, n: number) => void) | null {
  if (spec.emoji) return (x, n) => { x.font = `${n * 0.78}px ${BELLUH_EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(spec.emoji, n / 2, n * 0.54); };
  if (spec.path) return (x, n) => { x.scale(n / 100, n / 100); x.fillStyle = '#000'; x.fill(new Path2D(spec.path)); };
  if (spec.text) return (x, n) => {
    x.font = `900 ${n * 0.5}px Merriweather, Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#000';
    const w = x.measureText(spec.text).width; const s = Math.min(1, (n * 0.95) / w);
    x.translate(n / 2, n / 2); x.scale(s, s); x.fillText(spec.text, 0, 0);
  };
  return null;
}

export interface BelluhWater {
  canvas: HTMLCanvasElement;
  readonly size: number;
  readonly state: WaterState;
  readonly shape: string;
  resize(n: number): void;
  setState(st: WaterState): void;
  key(): void;
  word(w: string): void;
  setShape(spec: ShapeSpec | 'water', label?: string): boolean;
  frame(dt: number, draw?: boolean): void;
}

export function createBelluhWater(initialSize: number): BelluhWater | null {
  let size = initialSize;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  let gl: WebGLRenderingContext | null;
  try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true }); } catch { gl = null; }
  if (!gl) return null;
  const sh = (type: number, src: string) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['t', 'res', 'think', 'talk', 'listen', 'shapeA', 'shapeB', 'morphK', 'rotY', 'rotX', 'pulse', 'pamp', 'texA', 'texB']) u[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(u.texA, 0); gl.uniform1i(u.texB, 1);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const makeTex = (data: Uint8Array, n: number) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, n, n, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };
  const blank = makeTex(new Uint8Array([255]), 1);
  type Slot = { kind: number; tex: WebGLTexture; label: string };
  const water: Slot = { kind: 0, tex: blank, label: 'water' };

  const s = {
    state: 'idle' as WaterState, clock: 7, think: 0, listen: 0, talk: 0, listenUntil: 0,
    a: water as Slot, b: water as Slot, morphK: 0, morphing: false, morphStart: 0,
    pulses: new Float32Array(24).fill(0), pamp: new Float32Array(6), next: 0, now: 0,
  };
  for (let i = 0; i < 6; i++) s.pulses[i * 4 + 3] = 9;
  const pulseAt = (x: number, y: number, z: number, amp: number) => { const i = s.next++ % 6; s.pulses.set([x, y, z, 0], i * 4); s.pamp[i] = amp; };
  const j = (r: number) => (Math.random() * 2 - 1) * r;
  const showing = () => (s.morphing && s.morphK > 0.5 ? s.b : s.a);
  const free = (slot: Slot) => { if (slot.tex !== blank && slot !== s.a && slot !== s.b) gl.deleteTexture(slot.tex); };

  return {
    canvas,
    get size() { return size; },
    resize(n: number) { size = Math.max(64, Math.round(n)); canvas.width = canvas.height = size; },
    get state() { return s.state; },
    get shape() { return (s.morphing ? s.b : s.a).label; },
    setState(st: WaterState) { s.state = st; },
    /** Someone typed: a small ring runs up the front of the water. */
    key() { s.listenUntil = s.now + 1.4; pulseAt(j(0.35), -0.55 + j(0.1), 0.8, 0.45); },
    /** Belluh said a word: a ring from the front, and the water swells toward you. */
    word(w: string) {
      const len = Math.min(10, String(w || '').replace(/[^\p{L}\p{N}]/gu, '').length || 3);
      s.talk = Math.max(s.talk, 0.45 + len * 0.055);
      pulseAt(j(0.3), j(0.22), 1, 0.55 + len * 0.06);
    },
    /** Become anything: 'water', or {emoji}, {path} or {text}. Returns false if it couldn't be drawn. */
    setShape(spec: ShapeSpec | 'water', label?: string) {
      let next: Slot = water;
      if (spec !== 'water') {
        const draw = belluhDrawFor(spec);
        const field = draw && belluhSilhouette(draw);
        if (!field) return false;
        next = { kind: 1, tex: makeTex(field, SDF_GRID), label: label || spec.emoji || spec.text || 'shape' };
      }
      const cur = showing();
      if (cur === water && next === water) return true;
      const old = [s.a, s.b];
      s.a = cur; s.b = next; s.morphK = 0; s.morphing = true; s.morphStart = s.now;
      old.forEach(free);
      pulseAt(0, 1, 0.2, 0.9); pulseAt(0.9, -0.3, 0.3, 0.8); pulseAt(-0.9, -0.3, 0.3, 0.8);
      return true;
    },
    frame(dt: number, draw = true) {
      dt = Math.min(0.1, Math.max(0, dt));
      s.now += dt;
      const st = s.state;
      s.clock += dt * (BELLUH_SPEED[st] || 1);
      const ease = (v: number, target: number, rate: number) => v + (target - v) * (1 - Math.exp(-dt * rate));
      s.think = ease(s.think, st === 'thinking' ? 1 : 0, 3.2);
      s.listen = ease(s.listen, st === 'listening' || s.now < s.listenUntil ? 1 : 0, 4);
      s.talk *= Math.exp(-dt * 6.5);
      for (let i = 0; i < 6; i++) s.pulses[i * 4 + 3] += dt;
      if (s.morphing) {
        const k = Math.min(1, (s.now - s.morphStart) / 1.3);
        s.morphK = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        if (k >= 1) { const old = s.a; s.a = s.b; s.morphK = 0; s.morphing = false; free(old); }
      }
      if (!draw) return;
      const shaped = s.a.kind || s.b.kind;
      const rotY = (shaped ? 0.4 : 0.15) * Math.sin(s.clock * 0.33);
      const rotX = 0.08 * Math.sin(s.clock * 0.27) - s.talk * 0.06;
      gl.viewport(0, 0, size, size);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.a.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, s.b.tex);
      gl.uniform1f(u.t, s.clock); gl.uniform2f(u.res, size, size);
      gl.uniform1f(u.think, s.think); gl.uniform1f(u.talk, Math.min(1, s.talk)); gl.uniform1f(u.listen, s.listen);
      gl.uniform1f(u.shapeA, s.a.kind); gl.uniform1f(u.shapeB, s.b.kind); gl.uniform1f(u.morphK, s.morphK);
      gl.uniform1f(u.rotY, rotY); gl.uniform1f(u.rotX, rotX);
      gl.uniform4fv(u.pulse, s.pulses); gl.uniform1fv(u.pamp, s.pamp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
