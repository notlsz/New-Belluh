// 404, laid out like hinge.co's: the number, one line set large, a way back, and a drawing on the right. The drawing
// is Belluh's own: a table for two, one candle lit, one chair still waiting.
import React from 'react';
import { useUi } from '../i18n';
import nf from '../i18n/ui/notFound';
import { Shell, Pill, go, type PageProps } from './company/kit';

const INK = '#1a1a1a', WASH = '#e9eef8', FLAME = '#f0addd';
const Drawing: React.FC<{ label: string }> = ({ label }) => (
  <svg viewBox="0 0 560 440" role="img" aria-label={label} className="w-full h-auto">
    <path d="M40 220c10-90 110-170 250-170s250 70 250 170-80 200-250 200S30 330 40 220z" fill={WASH} />
    {/* the table */}
    <ellipse cx="290" cy="250" rx="150" ry="34" fill="#fff" stroke={INK} strokeWidth="5" />
    <path d="M290 284v110M250 394h80" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    {/* the candle */}
    <rect x="280" y="186" width="20" height="58" rx="4" fill="#fff" stroke={INK} strokeWidth="4" />
    <path d="M290 186c-12-16-2-30 0-42 4 12 14 24 0 42z" fill={FLAME} stroke={INK} strokeWidth="3" strokeLinejoin="round" className="nf-flicker" />
    {/* two glasses, one with a sip gone */}
    <path d="M205 210h28l-4 34h-20z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" /><path d="M210 226h18" stroke={FLAME} strokeWidth="6" />
    <path d="M350 210h28l-4 34h-20z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    {/* the rose, waiting */}
    <path d="M330 250c18-6 34-2 46 8" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <circle cx="380" cy="257" r="10" fill={FLAME} stroke={INK} strokeWidth="3" />
    {/* two chairs, one pulled out */}
    <path d="M100 160v190M100 270h70v120M170 270v-8M100 160c0-20 50-20 50 0v110" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M478 140v190M478 250h-70v120M408 250v-8M478 140c0-20-50-20-50 0v110" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" transform="rotate(8 440 260)" />
    {/* a few dashes of ink, like a sketch */}
    <path d="M70 410h60M160 418h40M420 414h70" stroke={INK} strokeWidth="4" strokeLinecap="round" opacity=".7" />
    <style>{`@keyframes nf-flicker { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08, .94); } } .nf-flicker { transform-origin: 290px 186px; animation: nf-flicker 1.4s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .nf-flicker { animation: none; } }`}</style>
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
