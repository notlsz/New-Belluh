// Space behind the globe when you zoom all the way out: a starlight sky like a Rolls-Royce headliner (hundreds of tiny
// points of light at different brightness, a few twinkling), and the other seven planets of our solar system drawn as
// flat cartoon planets (Earth is the globe itself), plus the Moon, a satellite, a rocket and a comet. Everything sits at
// a depth and slides as the globe turns, nearer things faster, so spinning the Earth spins the sky with it.
import React, { useEffect, useMemo, useRef } from 'react';
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

// Where each thing sits in the sky (x %, y %), how big, and how near (nearer things slide more as the globe turns)
const SKY: { k: string; x: number; y: number; s: number; d: number }[] = [
  { k: 'mercury', x: 12, y: 18, s: 26, d: 0.9 },
  { k: 'venus', x: 30, y: 9, s: 40, d: 0.8 },
  { k: 'moon', x: 72, y: 14, s: 58, d: 1.2 },
  { k: 'mars', x: 86, y: 34, s: 34, d: 0.85 },
  { k: 'jupiter', x: 8, y: 52, s: 84, d: 0.55 },
  { k: 'saturn', x: 78, y: 72, s: 62, d: 0.5 },
  { k: 'uranus', x: 34, y: 84, s: 40, d: 0.35 },
  { k: 'neptune', x: 58, y: 92, s: 36, d: 0.3 },
  { k: 'satellite', x: 62, y: 28, s: 38, d: 1.4 },
  { k: 'ufo', x: 20, y: 72, s: 40, d: 1.1 },
];

// Hundreds of tiny stars, drawn once into a tile that repeats across the sky
function starTile(): string {
  const n = 512, c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d')!;
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 420; i++) {
    const big = r() > 0.94, a = big ? 0.9 : 0.25 + r() * 0.6, rad = big ? 1.1 + r() * 0.7 : 0.35 + r() * 0.55;
    x.beginPath(); x.arc(r() * n, r() * n, rad, 0, Math.PI * 2);
    x.fillStyle = `rgba(${235 + Math.round(r() * 20)},${235 + Math.round(r() * 20)},255,${a})`;
    if (big) { x.shadowColor = 'rgba(200,215,255,0.9)'; x.shadowBlur = 6; } else x.shadowBlur = 0;
    x.fill();
  }
  return c.toDataURL();
}

export interface SolarSystemHandle { turn: (lng: number, lat: number) => void }

const SolarSystem = React.forwardRef<SolarSystemHandle, { visible: boolean }>(({ visible }, ref) => {
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);
  const tile = useMemo(() => (typeof document === 'undefined' ? '' : starTile()), []);
  // A few brighter stars twinkle on top of the field
  const twinkles = useMemo(() => Array.from({ length: 26 }, (_, i) => { const r = (n: number) => { const v = Math.sin(i * 91.7 + n * 47.3) * 43758.5453; return v - Math.floor(v); }; return [r(1) * 100, r(2) * 100, r(3) * 4]; }), []);

  React.useImperativeHandle(ref, () => ({
    turn: (lng, lat) => {
      const el = box.current; if (!el) return;
      const w = el.clientWidth || 1;
      el.style.backgroundPosition = `${(-lng * 2.2).toFixed(1)}px ${(lat * 1.4).toFixed(1)}px, ${(-lng * 1.1).toFixed(1)}px ${(lat * 0.7).toFixed(1)}px`;
      SKY.forEach((o, i) => {
        const n = items.current[i]; if (!n) return;
        // Slide with the globe and wrap around the sky, so the planets come back round as it turns
        const px = ((o.x / 100) * w - (lng / 360) * w * 2.4 * o.d) % (w * 1.3);
        n.style.transform = `translate(${(px < -w * 0.15 ? px + w * 1.3 : px).toFixed(1)}px, ${(lat * 0.9 * o.d).toFixed(1)}px)`;
      });
    },
  }), []);

  useEffect(() => { /* place things before the first turn */ (ref as any)?.current?.turn?.(10, 25); }, [ref]);

  return (
    <div ref={box} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: '#0b0a1d', backgroundImage: `url(${tile}), url(${tile})`, backgroundSize: '512px 512px, 340px 340px' }}>
      <style>{`
        @keyframes ss-twinkle { 0%, 100% { opacity: .15; transform: scale(.7); } 50% { opacity: 1; transform: scale(1); } }
        .ss-tw { animation: ss-twinkle 3.6s ease-in-out infinite; box-shadow: 0 0 8px 2px rgba(210,225,255,.75); }
        @keyframes ss-rocket { 0% { transform: translate(-12vw, 108vh); } 100% { transform: translate(112vw, -22vh); } }
        .ss-rocket { left: 0; top: 0; animation: ss-rocket 18s linear infinite; animation-delay: -6s; }
        /* The comet flies head first: its head is at the lower left, its tail streams up and to the right */
        @keyframes ss-comet { 0% { transform: translate(105vw, -12vh); opacity: 0; } 8% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(-18vw, 62vh); opacity: 0; } }
        .ss-comet { left: 0; top: 0; animation: ss-comet 10s ease-in infinite; animation-delay: -2s; }
        @media (prefers-reduced-motion: reduce) { .ss-tw, .ss-rocket, .ss-comet { animation: none; } }
      `}</style>
      {twinkles.map(([l, t, d], i) => <span key={i} className="ss-tw absolute rounded-full bg-white" style={{ left: `${l}%`, top: `${t}%`, width: 2.5, height: 2.5, animationDelay: `-${d}s` }} />)}
      {SKY.map((o, i) => (
        <span key={o.k} ref={n => { items.current[i] = n; }} className="absolute left-0 will-change-transform" style={{ top: `${o.y}%` }}>
          <span className="block belluh-float" style={{ animationDuration: `${6 + (i % 4)}s`, animationDelay: `-${i}s` }}>
            {o.k === 'moon' ? <Emoji e="🌕" size={o.s} /> : o.k === 'satellite' ? <Emoji e="🛰️" size={o.s} /> : o.k === 'ufo' ? <Emoji e="🛸" size={o.s} /> : <Planet kind={o.k} size={o.s} />}
          </span>
        </span>
      ))}
      <span className="ss-rocket absolute"><Emoji e="🚀" size={56} /></span>
      <span className="ss-comet absolute"><Emoji e="☄️" size={48} /></span>
    </div>
  );
});
SolarSystem.displayName = 'SolarSystem';
export default SolarSystem;
