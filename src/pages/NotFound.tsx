// 404, laid out like hinge.co's: the number, one line set large, a way back, and a drawing on the right. The drawing
// is Belluh's own: a table for two, one candle lit, one chair still waiting.
import React from 'react';
import { useUi } from '../i18n';
import nf from '../i18n/ui/notFound';
import { Shell, Pill, go, type PageProps } from './company/kit';

const INK = '#1a1a1a', WASH = '#e9eef8', PINK = '#f0addd', BLUE = '#9bbecb', GLOW = '#fff1c7';
const LINE = { fill: 'none', stroke: INK, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
// A four-point sparkle centered on (x, y)
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}z`;
const Drawing: React.FC<{ label: string }> = ({ label }) => (
  <svg viewBox="0 0 560 440" role="img" aria-label={label} className="w-full h-auto overflow-visible">
    <path d="M40 220c10-90 110-170 250-170s250 70 250 170-80 200-250 200S30 330 40 220z" fill={WASH} />
    {/* candlelight on the wall, breathing */}
    <g className="nf-glow">
      <circle cx="290" cy="166" r="96" fill={GLOW} opacity=".35" />
      <circle cx="290" cy="166" r="70" fill={GLOW} opacity=".55" />
      <circle cx="290" cy="166" r="44" fill={GLOW} opacity=".8" />
    </g>
    {/* a few stars come out */}
    <path d={sparkle(118, 92, 9)} fill={PINK} className="nf-twinkle" style={{ animationDelay: '0s' }} />
    <path d={sparkle(196, 58, 6)} fill={BLUE} className="nf-twinkle" style={{ animationDelay: '.8s' }} />
    <path d={sparkle(404, 62, 7)} fill={PINK} className="nf-twinkle" style={{ animationDelay: '1.6s' }} />
    <path d={sparkle(512, 176, 6)} fill={BLUE} className="nf-twinkle" style={{ animationDelay: '2.3s' }} />
    {/* the chair that's taken: tucked in */}
    <path d="M104 168v196M104 276h66v110M104 168c0-30 54-30 54 0v108M126 186v86M140 186v86" {...LINE} strokeWidth="6" />
    {/* the chair still waiting: pulled out, a little turned */}
    <g transform="rotate(8 440 262)">
      <path d="M478 146v196M478 254h-66v110M478 146c0-30-54-30-54 0v108M456 164v86M442 164v86" {...LINE} strokeWidth="6" />
    </g>
    {/* the table, laid with a cloth */}
    <path d="M298 300v92M254 394h88" {...LINE} strokeWidth="6" />
    <path d="M132 254c0 14 4 32 18 38 14 6 26 0 40 0s26 8 50 2 34-4 50 2 26 4 50-2 36-2 50-2 26 6 40 0 18-24 18-38" fill="#fff" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
    <ellipse cx="290" cy="254" rx="158" ry="36" fill="#fff" stroke={INK} strokeWidth="5" />
    {/* two plates */}
    <ellipse cx="216" cy="258" rx="34" ry="8" fill="#fff" stroke={INK} strokeWidth="3.5" />
    <ellipse cx="364" cy="258" rx="34" ry="8" fill="#fff" stroke={INK} strokeWidth="3.5" />
    {/* the candle: a drip of wax, a flame that moves */}
    <ellipse cx="290" cy="248" rx="20" ry="6" fill="#fff" stroke={INK} strokeWidth="3.5" />
    <rect x="281" y="190" width="18" height="56" rx="3" fill="#fff" stroke={INK} strokeWidth="4" />
    <path d="M282 196c6 2 8 10 6 16" {...LINE} strokeWidth="3" />
    <path d="M290 190v-8" {...LINE} strokeWidth="3" />
    <g className="nf-flicker">
      <path d="M290 182c-14-14-6-30 0-42 6 12 14 28 0 42z" fill={PINK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M290 176c-4-5-2-11 0-15 2 4 4 10 0 15z" fill="#fff" />
    </g>
    {/* two glasses, one with a sip gone */}
    <path d="M206 196c0 22 6 30 16 30s16-8 16-30z" fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M208.5 210c1 12 6 14 13.5 14s12.5-2 13.5-14z" fill={PINK} />
    <path d="M222 226v20M212 247h20" {...LINE} strokeWidth="3.5" />
    <path d="M342 196c0 22 6 30 16 30s16-8 16-30z" fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M358 226v20M348 247h20" {...LINE} strokeWidth="3.5" />
    {/* a rose, left at the empty seat */}
    <path d="M318 278c16-6 32-6 44-2" {...LINE} strokeWidth="3" />
    <path d="M334 274c2-9 10-13 17-12-1 7-9 12-17 12z" fill={BLUE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="372" cy="277" r="11" fill={PINK} stroke={INK} strokeWidth="3" />
    <path d="M372 271c-5 0-7 4-5 7s7 3 8-1-2-7-6-5" {...LINE} strokeWidth="2.2" />
    {/* Bella keeps the seat: a dragonfly hovering over it */}
    <g className="nf-hover">
      <g transform="translate(470 92)">
        <path d="M0 -14v34" {...LINE} strokeWidth="3.5" />
        <circle cx="0" cy="-17" r="4" fill={INK} />
        <g className="nf-wings">
          <ellipse cx="-14" cy="-6" rx="14" ry="5" fill={BLUE} fillOpacity=".55" stroke={INK} strokeWidth="2.2" transform="rotate(-12 -14 -6)" />
          <ellipse cx="14" cy="-6" rx="14" ry="5" fill={BLUE} fillOpacity=".55" stroke={INK} strokeWidth="2.2" transform="rotate(12 14 -6)" />
          <ellipse cx="-12" cy="4" rx="11" ry="4" fill={PINK} fillOpacity=".6" stroke={INK} strokeWidth="2.2" transform="rotate(10 -12 4)" />
          <ellipse cx="12" cy="4" rx="11" ry="4" fill={PINK} fillOpacity=".6" stroke={INK} strokeWidth="2.2" transform="rotate(-10 12 4)" />
        </g>
      </g>
    </g>
    {/* a few dashes of ink, like a sketch */}
    <path d="M70 410h60M160 418h40M420 414h70" {...LINE} strokeWidth="4" opacity=".7" />
    <style>{`
      @keyframes nf-flicker { 0%, 100% { transform: scale(1) rotate(0deg); } 30% { transform: scale(1.06, .95) rotate(-2deg); } 60% { transform: scale(.97, 1.05) rotate(2deg); } }
      @keyframes nf-glow { 0%, 100% { opacity: .8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
      @keyframes nf-twinkle { 0%, 100% { opacity: .2; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
      @keyframes nf-hover { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-6px, -8px); } }
      @keyframes nf-wings { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(.55); } }
      .nf-flicker { transform-box: fill-box; transform-origin: 50% 100%; animation: nf-flicker 1.6s ease-in-out infinite; }
      .nf-glow { transform-box: fill-box; transform-origin: center; animation: nf-glow 3.2s ease-in-out infinite; }
      .nf-twinkle { transform-box: fill-box; transform-origin: center; animation: nf-twinkle 3s ease-in-out infinite; }
      .nf-hover { animation: nf-hover 4s ease-in-out infinite; }
      .nf-wings { transform-box: fill-box; transform-origin: center; animation: nf-wings .18s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .nf-flicker, .nf-glow, .nf-twinkle, .nf-hover, .nf-wings { animation: none; } }
    `}</style>
  </svg>
);

const NotFound: React.FC<PageProps> = (p) => {
  const T = useUi(nf);
  return (
    <Shell {...p} title={T.title}>
      <section className="max-w-[1440px] mx-auto px-5 md:px-20 py-20 md:py-36 grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-16">
        <div>
          <p className="text-[4.5rem] md:text-[6rem] font-semibold leading-none tracking-[-0.03em]">404</p>
          <h1 className="mt-8 font-serif font-bold text-[2.4rem] md:text-[3.6rem] leading-[1.08] tracking-[-0.02em] max-w-[13ch] [text-wrap:balance]">{T.line}</h1>
          <p className="mt-5 text-[17px] leading-[1.6] text-[#1a1a1a]/70 max-w-[440px]">{T.sub}</p>
          <div className="mt-9"><Pill onClick={() => go('/')}>{T.back}</Pill></div>
        </div>
        <div className="md:-mr-20"><Drawing label={T.alt} /></div>
      </section>
    </Shell>
  );
};

export default NotFound;
