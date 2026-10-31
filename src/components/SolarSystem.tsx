// Space behind the globe, like Google Earth's: a real sky sphere of stars (a Rolls-Royce headliner of tiny lights) with
// the other seven planets and the Moon fixed on it, so turning the Earth sweeps the sky past. Plus a satellite circling
// the Earth, a rocket and a comet.
import React, { useEffect, useRef } from 'react';
import { Emoji } from '../lib/emoji3d';

// Flat cartoon planets: a solid body, a darker side, a soft highlight, and their own details
const Planet: React.FC<{ kind: string; size: number }> = ({ kind, size }) => {
  const P: Record<string, { body: string; shade: string; hi: string }> = {
    mercury: { body: '#b9b2aa', shade: '#958d85', hi: '#d8d2cb' },
    venus: { body: '#f2c879', shade: '#d9a650', hi: '#fbe3b2' },
    mars: { body: '#e3714f', shade: '#bf5236', hi: '#f39b7e' },
    jupiter: { body: '#e8c29a', shade: '#c99a6e', hi: '#f6e0c6' },
    saturn: { body: '#f0d58f', shade: '#d4b264', hi: '#faecc6' },
    uranus: { body: '#9fe2e3', shade: '#74c3c6', hi: '#cdf3f3' },
    neptune: { body: '#5f86ea', shade: '#4467c9', hi: '#94afff' },
  };
  const c = P[kind];
  const ring = kind === 'saturn' || kind === 'uranus';
  const w = ring ? size * 1.9 : size, h = ring && kind === 'saturn' ? size * 1.15 : size;
  return (
    <svg width={w} height={kind === 'uranus' ? size * 1.5 : h} viewBox={`${-w / 2} ${-(kind === 'uranus' ? size * 0.75 : h / 2)} ${w} ${kind === 'uranus' ? size * 1.5 : h}`} style={{ overflow: 'visible' }}>
      <defs><clipPath id={`clip-${kind}`}><circle r={size / 2} /></clipPath></defs>
      {kind === 'saturn' && <ellipse rx={size * 0.92} ry={size * 0.26} fill="none" stroke="#e7c97a" strokeWidth={size * 0.09} transform="rotate(-14)" />}
      {kind === 'uranus' && <ellipse rx={size * 0.2} ry={size * 0.72} fill="none" stroke="#c8f0f0" strokeWidth={size * 0.05} transform="rotate(8)" />}
      <circle r={size / 2} fill={c.body} />
      <g clipPath={`url(#clip-${kind})`}>
        {kind === 'jupiter' && [-0.28, -0.08, 0.14, 0.32].map((y, i) => <rect key={i} x={-size} y={y * size} width={size * 2} height={size * (i % 2 ? 0.07 : 0.1)} fill={i % 2 ? '#d7a77c' : '#c58f63'} />)}
        {kind === 'jupiter' && <ellipse cx={size * 0.14} cy={size * 0.2} rx={size * 0.11} ry={size * 0.065} fill="#d9654a" />}
        {(kind === 'mercury' || kind === 'mars') && [[-0.15, -0.12, 0.09], [0.16, 0.08, 0.06], [-0.05, 0.22, 0.05]].map(([x, y, r], i) => <circle key={i} cx={x * size} cy={y * size} r={r * size} fill={c.shade} opacity={0.7} />)}
        {kind === 'neptune' && <ellipse cx={-size * 0.12} cy={size * 0.12} rx={size * 0.12} ry={size * 0.06} fill="#3550a8" opacity={0.8} />}
        <circle cx={size * 0.2} cy={size * 0.2} r={size * 0.5} fill={c.shade} opacity={0.55} />
        <ellipse cx={-size * 0.2} cy={-size * 0.22} rx={size * 0.13} ry={size * 0.07} fill={c.hi} opacity={0.9} transform={`rotate(-35 ${-size * 0.2} ${-size * 0.22})`} />
      </g>
      {kind === 'saturn' && <path d={`M ${-size * 0.89} ${size * 0.22} A ${size * 0.92} ${size * 0.26} -14 0 0 ${size * 0.89} ${-size * 0.22}`} fill="none" stroke="#e7c97a" strokeWidth={size * 0.09} transform="rotate(0)" />}
    </svg>
  );
};

// Where each thing sits on the sky sphere (sky longitude and latitude in degrees, like stars on a star chart) and how
// big it is. The sky is fixed, like Google Earth's: turning the globe sweeps it past behind the Earth.
const SKY: { k: string; lon: number; lat: number; s: number }[] = [
  { k: 'moon', lon: 200, lat: 12, s: 64 },
  { k: 'mercury', lon: 150, lat: -6, s: 26 },
  { k: 'venus', lon: 245, lat: 20, s: 42 },
  { k: 'mars', lon: 300, lat: -18, s: 36 },
  { k: 'jupiter', lon: 20, lat: 26, s: 92 },
  { k: 'saturn', lon: 80, lat: -22, s: 70 },
  { k: 'uranus', lon: 120, lat: 34, s: 44 },
  { k: 'neptune', lon: 350, lat: -38, s: 40 },
  { k: 'ufo', lon: 40, lat: -48, s: 40 },
];

const rad = Math.PI / 180;
const vec = (lon: number, lat: number) => [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)];

// A fixed starfield: 1,800 stars scattered evenly over the whole sky, a few of them big and bright
const STARS = (() => {
  let seed = 11; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  return Array.from({ length: 1800 }, () => {
    const z = r() * 2 - 1, t = r() * Math.PI * 2, q = Math.sqrt(1 - z * z);
    const big = r() > 0.965;
    return { v: [q * Math.cos(t), q * Math.sin(t), z], r: big ? 1.3 + r() * 0.9 : 0.4 + r() * 0.7, a: big ? 0.95 : 0.25 + r() * 0.65, tint: r() };
  });
})();

export interface SolarSystemHandle { turn: (lng: number, lat: number) => void }

const SolarSystem = React.forwardRef<SolarSystemHandle, { visible: boolean }>(({ visible }, ref) => {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);
  const view = useRef({ lng: 10, lat: 25 });
  const frame = useRef(0);

  // Look at the sky behind the Earth from where the camera is: the camera sits above (lng, lat), so the sky we see is in
  // the opposite direction. East is right, north is up, and a wide lens spreads the sky across the screen.
  const draw = () => {
    frame.current = 0;
    const el = box.current, cv = canvas.current; if (!el || !cv) return;
    const w = el.clientWidth, h = el.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const { lng, lat } = view.current;
    const cam = vec(lng, lat), f = cam.map(c => -c);
    const e = [-Math.sin(lng * rad), Math.cos(lng * rad), 0];
    const n = [-Math.sin(lat * rad) * Math.cos(lng * rad), -Math.sin(lat * rad) * Math.sin(lng * rad), Math.cos(lat * rad)];
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const focal = Math.max(w, h) * 0.55;
    const project = (v: number[]) => { const z = dot(v, f); if (z < 0.15) return null; return [w / 2 - dot(v, e) / z * focal, h / 2 - dot(v, n) / z * focal, z]; };
    const x = cv.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    for (const st of STARS) {
      const p = project(st.v); if (!p || p[0] < -4 || p[0] > w + 4 || p[1] < -4 || p[1] > h + 4) continue;
      x.globalAlpha = st.a;
      x.fillStyle = st.tint > 0.8 ? '#ffe9c4' : st.tint > 0.6 ? '#cfe0ff' : '#ffffff';
      x.beginPath(); x.arc(p[0], p[1], st.r, 0, Math.PI * 2); x.fill();
      if (st.r > 1.3) { x.globalAlpha = st.a * 0.25; x.beginPath(); x.arc(p[0], p[1], st.r * 3, 0, Math.PI * 2); x.fill(); }
    }
    x.globalAlpha = 1;
    SKY.forEach((o, i) => {
      const node = items.current[i]; if (!node) return;
      const p = project(vec(o.lon, o.lat));
      if (!p) { node.style.opacity = '0'; return; }
      node.style.opacity = '1';
      node.style.transform = `translate(${(p[0] - o.s / 2).toFixed(1)}px, ${(p[1] - o.s / 2).toFixed(1)}px)`;
    });
  };

  React.useImperativeHandle(ref, () => ({
    turn: (lng, lat) => { view.current = { lng, lat }; if (!frame.current) frame.current = requestAnimationFrame(draw); },
  }), []);

  useEffect(() => { draw(); const on = () => draw(); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);

  return (
    <div ref={box} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: '#0b0a1d' }}>
      <style>{`
        @keyframes ss-rocket { 0% { transform: translate(-12vw, 108vh); } 100% { transform: translate(112vw, -22vh); } }
        .ss-rocket { left: 0; top: 0; animation: ss-rocket 18s linear infinite; animation-delay: -6s; }
        /* The comet flies head first: its head is at the lower left, its tail streams up and to the right */
        @keyframes ss-comet { 0% { transform: translate(105vw, -12vh); opacity: 0; } 8% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(-18vw, 62vh); opacity: 0; } }
        .ss-comet { left: 0; top: 0; animation: ss-comet 10s ease-in infinite; animation-delay: -2s; }
        @keyframes ss-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ss-orbit { width: 0; height: 0; animation: ss-orbit 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .ss-rocket, .ss-comet, .ss-orbit { animation: none; } }
      `}</style>
      <canvas ref={canvas} className="absolute inset-0 w-full h-full" />
      {SKY.map((o, i) => (
        <span key={o.k} ref={node => { items.current[i] = node; }} className="absolute left-0 top-0 transition-opacity duration-300 will-change-transform" style={{ opacity: 0 }}>
          {o.k === 'moon' ? <Emoji e="🌕" size={o.s} /> : o.k === 'ufo' ? <Emoji e="🛸" size={o.s} /> : <Planet kind={o.k} size={o.s} />}
        </span>
      ))}
      {/* A satellite circling the Earth itself */}
      <span className="ss-orbit absolute left-1/2 top-1/2"><span className="absolute" style={{ left: 'min(36vw, 300px)', top: -18 }}><Emoji e="🛰️" size={36} /></span></span>
      <span className="ss-rocket absolute"><Emoji e="🚀" size={54} /></span>
      <span className="ss-comet absolute"><Emoji e="☄️" size={46} /></span>
    </div>
  );
});
SolarSystem.displayName = 'SolarSystem';
export default SolarSystem;
