// More ways to dress a profile, in the spirit of Discord's avatar decorations and profile effects, drawn fresh for
// Belluh: things worn around the picture (ears, a halo, horns, a crown, headphones, rings that glow or glitch, a
// little planet in orbit), effects that play over the whole profile (confetti, petals, rain, fireflies and more),
// and a pad for writing your name in your own hand.
import React, { useMemo, useRef, useState } from 'react';
import { Emoji } from '../lib/emoji3d';
import type { Effect, ProfileFx, NameInk } from '../services/look';

export const DECOS: { id: Effect; e: string }[] = [
  { id: 'catears', e: '🐱' }, { id: 'bunny', e: '🐰' }, { id: 'halo', e: '😇' }, { id: 'horns', e: '😈' }, { id: 'crown', e: '👑' },
  { id: 'headphones', e: '🎧' }, { id: 'rainbow', e: '🌈' }, { id: 'neon', e: '💡' }, { id: 'glitch', e: '👾' }, { id: 'orbit', e: '🪐' },
];
export const PFX: { id: ProfileFx; e: string }[] = [
  { id: 'none', e: '🚫' }, { id: 'confetti', e: '🎉' }, { id: 'petals', e: '🌸' }, { id: 'hearts', e: '💗' }, { id: 'rain', e: '🌧️' }, { id: 'fireflies', e: '🌟' },
  { id: 'leaves', e: '🍁' }, { id: 'snow', e: '❄️' }, { id: 'bubbles', e: '🫧' }, { id: 'stars', e: '✨' }, { id: 'butterflies', e: '🦋' },
];
export const isDeco = (e: Effect) => DECOS.some(d => d.id === e);

export const FX_CSS = `
@keyframes dfx-spin { to { transform: rotate(360deg); } } .dfx-spin { animation: dfx-spin 6s linear infinite; }
@keyframes dfx-pulse { 0%, 100% { opacity: .7; } 50% { opacity: 1; } } .dfx-pulse { animation: dfx-pulse 1.6s ease-in-out infinite; }
@keyframes dfx-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } } .dfx-float { animation: dfx-float 3s ease-in-out infinite; }
@keyframes dfx-wiggle { 0%, 100% { rotate: 0deg; } 50% { rotate: -6deg; } } .dfx-wiggle { animation: dfx-wiggle 2.4s ease-in-out infinite; transform-origin: bottom center; }
@keyframes dfx-glitch { 0%, 100% { translate: 0 0; } 20% { translate: -2px 1px; } 40% { translate: 2px -1px; } 60% { translate: -1px -2px; } 80% { translate: 1px 2px; } } .dfx-glitch { animation: dfx-glitch .35s steps(2) infinite; }
@keyframes pe-fall { from { transform: translate3d(0, -40px, 0) rotate(0deg); } to { transform: translate3d(var(--dx, 30px), var(--h, 900px), 0) rotate(var(--rot, 540deg)); } }
@keyframes pe-rise { from { transform: translate3d(0, 0, 0); opacity: 0; } 10% { opacity: 1; } to { transform: translate3d(var(--dx, 20px), calc(var(--h, 900px) * -1), 0); opacity: 0; } }
@keyframes pe-drift { 0%, 100% { transform: translate(0, 0); opacity: .2; } 50% { transform: translate(var(--dx, 24px), -18px); opacity: 1; } }
@keyframes pe-twinkle { 0%, 100% { opacity: 0; scale: .5; } 50% { opacity: 1; scale: 1; } }
.pe { position: absolute; pointer-events: none; will-change: transform; }
@media (prefers-reduced-motion: reduce) { .dfx-spin, .dfx-pulse, .dfx-float, .dfx-wiggle, .dfx-glitch, .pe { animation: none !important; } }
`;

// Worn around the picture. Sizes are for the 112 to 128px avatar.
export const Decoration: React.FC<{ effect: Effect; accent: string }> = ({ effect, accent }) => {
  const ear = (side: 1 | -1, long = false) => (
    <svg viewBox="0 0 60 90" className="dfx-wiggle absolute top-0" style={{ width: long ? 34 : 44, height: long ? 74 : 50, left: side < 0 ? (long ? '18%' : '6%') : undefined, right: side > 0 ? (long ? '18%' : '6%') : undefined, marginTop: long ? -58 : -22, transform: `rotate(${side * (long ? 12 : 18)}deg)`, animationDelay: side > 0 ? '-1.2s' : '0s' }} aria-hidden>
      {long ? <><path d="M30 88C10 88 6 40 14 14 18 2 42 2 46 14c8 26 4 74-16 74z" fill={accent} /><path d="M30 78c-10 0-12-34-8-54 2-8 14-8 16 0 4 20 2 54-8 54z" fill="#ffd6e7" /></>
        : <><path d="M4 88L18 8l40 80z" fill={accent} strokeLinejoin="round" /><path d="M18 78l8-48 20 48z" fill="#ffd6e7" /></>}
    </svg>
  );
  const ring = (style: React.CSSProperties, cls = '') => <span aria-hidden className={`absolute -inset-[7px] rounded-full pointer-events-none ${cls}`} style={style} />;
  switch (effect) {
    case 'catears': return <span aria-hidden className="absolute inset-0 pointer-events-none">{ear(-1)}{ear(1)}</span>;
    case 'bunny': return <span aria-hidden className="absolute inset-0 pointer-events-none">{ear(-1, true)}{ear(1, true)}</span>;
    case 'halo': return <svg viewBox="0 0 120 30" className="dfx-float absolute left-1/2 -translate-x-1/2 -top-7 w-[86%] pointer-events-none" aria-hidden style={{ filter: 'drop-shadow(0 0 8px #ffe48f)' }}><ellipse cx="60" cy="15" rx="52" ry="10" fill="none" stroke="#f5c542" strokeWidth="7" /></svg>;
    case 'horns': return <span aria-hidden className="absolute inset-0 pointer-events-none">{[-1, 1].map(s => <svg key={s} viewBox="0 0 40 60" className="absolute -top-6" style={{ width: 30, height: 46, left: s < 0 ? '14%' : undefined, right: s > 0 ? '14%' : undefined, transform: `scaleX(${s})` }}><path d="M30 58C10 50 2 30 10 2c4 16 14 26 26 32z" fill="#5b3fa0" /></svg>)}</span>;
    case 'crown': return <span aria-hidden className="dfx-float absolute left-1/2 -top-10 -translate-x-1/2 -rotate-[10deg] pointer-events-none"><Emoji e="👑" size={56} /></span>;
    case 'headphones': return (
      <svg viewBox="0 0 140 140" className="absolute -inset-3 pointer-events-none" aria-hidden>
        <path d="M18 78C18 30 44 10 70 10s52 20 52 68" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" />
        <rect x="4" y="68" width="24" height="40" rx="11" fill={accent} /><rect x="112" y="68" width="24" height="40" rx="11" fill={accent} />
      </svg>
    );
    case 'rainbow': return ring({ background: 'conic-gradient(#ff7a90, #ffb347, #ffe48f, #8fe0a0, #7fc8f8, #b39cff, #ff7a90)', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))' }, 'dfx-spin');
    case 'neon': return ring({ boxShadow: `0 0 0 3px ${accent}, 0 0 14px 4px ${accent}, inset 0 0 12px 2px ${accent}` }, 'dfx-pulse');
    case 'glitch': return <>{ring({ boxShadow: '-3px 0 0 3px #00e5ff' }, 'dfx-glitch')}{ring({ boxShadow: '3px 0 0 3px #ff3ec8', animationDelay: '-.17s' }, 'dfx-glitch')}</>;
    case 'orbit': return <span aria-hidden className="dfx-spin absolute -inset-5 pointer-events-none" style={{ animationDuration: '9s' }}><span className="absolute left-1/2 -top-2 -translate-x-1/2"><Emoji e="🪐" size={30} /></span><span className="absolute inset-0 rounded-full border border-dashed" style={{ borderColor: accent }} /></span>;
    default: return null;
  }
};

// Plays over the whole profile
export const ProfileEffect: React.FC<{ fx: ProfileFx; accent: string }> = ({ fx, accent }) => {
  const bits = useMemo(() => Array.from({ length: fx === 'rain' ? 46 : fx === 'confetti' ? 40 : 22 }, (_, i) => ({ l: (i * 37 + 11) % 100, d: (i * 0.53) % 7, s: 0.7 + ((i * 7) % 5) / 8, dx: ((i * 13) % 60) - 30, t: (i * 29) % 90 })), [fx]);
  if (fx === 'none') return null;
  const fall = (dur: number, node: (i: number) => React.ReactNode, rot = '540deg') => bits.map((b, i) => <span key={i} className="pe" style={{ left: `${b.l}%`, top: -40, animation: `pe-fall ${dur / b.s}s linear ${-b.d * dur / 7}s infinite`, ['--dx' as any]: `${b.dx}px`, ['--rot' as any]: rot }}>{node(i)}</span>);
  const rise = (dur: number, node: (i: number) => React.ReactNode) => bits.map((b, i) => <span key={i} className="pe" style={{ left: `${b.l}%`, bottom: -40, animation: `pe-rise ${dur / b.s}s ease-in ${-b.d * dur / 7}s infinite`, ['--dx' as any]: `${b.dx}px` }}>{node(i)}</span>);
  const CONF = ['#ff7a90', '#ffd166', '#7fc8f8', '#8fe0a0', '#b39cff', accent];
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none z-[35]" style={{ ['--h' as any]: '1400px' }}>
      {fx === 'confetti' && fall(7, i => <span className="block w-2 h-3.5 rounded-[2px]" style={{ background: CONF[i % CONF.length] }} />, '720deg')}
      {fx === 'petals' && fall(11, i => <Emoji e="🌸" size={14 + (i % 3) * 6} />, '360deg')}
      {fx === 'leaves' && fall(12, i => <Emoji e="🍁" size={16 + (i % 3) * 6} />, '420deg')}
      {fx === 'snow' && fall(13, i => <span className="block rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,.9)]" style={{ width: 4 + (i % 4) * 2, height: 4 + (i % 4) * 2 }} />, '0deg')}
      {fx === 'rain' && fall(1.6, () => <span className="block w-[2px] h-6 rounded-full bg-[#7fb2d6]/70" />, '0deg')}
      {fx === 'hearts' && rise(9, i => <Emoji e="💗" size={14 + (i % 3) * 7} />)}
      {fx === 'bubbles' && rise(10, i => <Emoji e="🫧" size={16 + (i % 3) * 8} />)}
      {fx === 'butterflies' && rise(16, i => <Emoji e="🦋" size={18 + (i % 2) * 8} />)}
      {fx === 'fireflies' && bits.map((b, i) => <span key={i} className="pe rounded-full" style={{ left: `${b.l}%`, top: `${b.t}%`, width: 6, height: 6, background: '#ffe48f', boxShadow: '0 0 10px 4px rgba(255,228,143,.8)', animation: `pe-drift ${4 + b.s * 3}s ease-in-out ${-b.d}s infinite`, ['--dx' as any]: `${b.dx}px` }} />)}
      {fx === 'stars' && bits.map((b, i) => <span key={i} className="pe" style={{ left: `${b.l}%`, top: `${b.t}%`, animation: `pe-twinkle ${2 + b.s * 2}s ease-in-out ${-b.d}s infinite` }}><Emoji e="✨" size={12 + (i % 3) * 6} /></span>)}
    </div>
  );
};

const inkPath = (st: [number, number][]) => st.length === 1 ? `M${st[0][0]} ${st[0][1]} l0.1 0` : `M${st.map(p => p.join(' ')).join(' L')}`;
// A name in your own hand
export const InkName: React.FC<{ ink: NameInk; label: string }> = ({ ink, label }) => (
  <svg viewBox="0 0 600 160" className="w-[min(420px,86vw)] h-auto" role="img" aria-label={label}>
    {ink.strokes.map((s, i) => <path key={i} d={inkPath(s)} fill="none" stroke={ink.color} strokeWidth={ink.w} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>
);

export const NamePad: React.FC<{ color: string; initial?: NameInk | null; S: { writeHint: string; clear: string; save: string }; onSave: (ink: NameInk) => void; onClose: () => void }> = ({ color, initial, S, onSave, onClose }) => {
  const [strokes, setStrokes] = useState<[number, number][][]>(initial?.strokes ?? []);
  const [w, setW] = useState(initial?.w ?? 7);
  const box = useRef<SVGSVGElement>(null);
  const live = useRef<[number, number][] | null>(null);
  const pt = (e: React.PointerEvent): [number, number] => { const r = box.current!.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 600), Math.round((e.clientY - r.top) / r.height * 160)]; };
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[720px] rounded-[2rem] bg-white p-5 md:p-7 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.6)]" onClick={e => e.stopPropagation()}>
        <p className="text-[15px] font-semibold text-slate-500 text-center">{S.writeHint}</p>
        <svg ref={box} viewBox="0 0 600 160" className="mt-4 w-full aspect-[600/160] rounded-2xl bg-[#f6f8fa] cursor-crosshair" style={{ touchAction: 'none' }}
          onPointerDown={e => { (e.currentTarget as Element).setPointerCapture(e.pointerId); live.current = [pt(e)]; setStrokes(s => [...s, live.current!]); }}
          onPointerMove={e => { if (!live.current) return; live.current = [...live.current, pt(e)]; const cur = live.current; setStrokes(s => [...s.slice(0, -1), cur]); }}
          onPointerUp={() => { live.current = null; }} onPointerCancel={() => { live.current = null; }}>
          <line x1="30" y1="128" x2="570" y2="128" stroke="#dbe3ea" strokeWidth="2" strokeDasharray="6 8" />
          {strokes.map((s, i) => <path key={i} d={inkPath(s)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />)}
        </svg>
        <div className="mt-5 flex items-center gap-2">
          {[4, 7, 11].map(x => <button key={x} type="button" onClick={() => setW(x)} aria-label={`${x}`} className={`w-11 h-11 rounded-xl flex items-center justify-center ${w === x ? 'ring-2 ring-slate-900' : 'bg-slate-100'}`}><span className="rounded-full" style={{ width: x + 3, height: x + 3, background: color }} /></button>)}
          <button type="button" onClick={() => setStrokes([])} className="ml-auto h-11 px-5 rounded-full bg-slate-100 text-[15px] font-bold whitespace-nowrap text-slate-700">{S.clear}</button>
          <button type="button" disabled={!strokes.length} onClick={() => onSave({ strokes: strokes.map(s => s.length > 300 ? s.filter((_, i) => i % 2 === 0) : s), color, w })} className="h-11 px-5 rounded-full bg-slate-900 text-white text-[15px] font-bold whitespace-nowrap disabled:opacity-40">{S.save}</button>
        </div>
      </div>
    </div>
  );
};
