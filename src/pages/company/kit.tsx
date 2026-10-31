// The kit behind Belluh's company pages (Mission, Impact, Research, Careers), after hinge.co's: a warm off-white page,
// big serif statements with a small colored label above them, photos that run off the edge of the screen, numbered
// ideas in rows, near-black bands for the things we believe, hand-drawn arrows and swashes in Belluh blue, and a
// share bar and a hiring line at the end of every page.
import React, { useEffect, useRef, useState } from 'react';
import SiteNav, { type SitePage } from '../../components/SiteNav';
import SiteFooter from '../../components/SiteFooter';
import { go } from '../../lib/go';

export const INK = '#1a1a1a', PAPER = '#fffefd', BLUE = '#3f7486';
export interface PageProps { onGetStarted: () => void; onLogin: () => void; onShowLegal: (t: 'tos' | 'privacy') => void }

export const Shell: React.FC<PageProps & { current: SitePage; title: string; children: React.ReactNode }> = ({ current, title, children, onGetStarted, onLogin, onShowLegal }) => {
  useEffect(() => { const before = document.title; document.title = `${title} | Belluh`; return () => { document.title = before; }; }, [title]);
  return (
    <div className="min-h-screen text-[#1a1a1a] overflow-x-clip" style={{ background: PAPER }}>
      <SiteNav current={current} onHome={() => go('/')} onLogin={onLogin} onGetStarted={onGetStarted} />
      <main className="pt-[72px]">{children}</main>
      <SiteFooter onTop={() => go('/')} onSection={id => { go('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 400); }}
        onGetStarted={onGetStarted} onLogin={onLogin} onShowLegal={onShowLegal} onGoToAbout={() => go('/about')} onGoToCareers={() => go('/careers')} />
    </div>
  );
};

// Fades up once, as it comes into view
export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    if (reduce || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: '0px 0px -60px 0px' });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${seen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
};

export const Wrap: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => <div className={`max-w-[1440px] mx-auto px-5 md:px-20 ${className}`}>{children}</div>;
export const Eyebrow: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => <p className={`mb-5 text-[15px] ${dark ? 'text-white/75' : ''}`} style={dark ? undefined : { color: BLUE }}>{children}</p>;
export const Big: React.FC<{ children: React.ReactNode; as?: 'h1' | 'h2'; className?: string }> = ({ children, as = 'h2', className = '' }) =>
  React.createElement(as, { className: `font-serif text-[2.5rem] leading-[1.08] md:text-[4rem] md:leading-[1.06] tracking-[-0.02em] [text-wrap:balance] ${className}` }, children);
export const Body: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => <p className={`text-[17px] leading-[1.6] ${className}`}>{children}</p>;

export const Photo: React.FC<{ src: string; alt: string; className?: string; bleed?: 'left' | 'right' }> = ({ src, alt, className = '', bleed }) => (
  <img src={src} alt={alt} loading="lazy" className={`w-full h-full object-cover ${bleed === 'left' ? 'rounded-r-md' : bleed === 'right' ? 'rounded-l-md' : 'rounded-md'} ${className}`} />
);

// Half photo, half statement. The photo runs off its side of the screen.
export const SplitHero: React.FC<{ photo: string; alt: string; side: 'left' | 'right'; children: React.ReactNode }> = ({ photo, alt, side, children }) => (
  <section className="grid grid-cols-1 md:grid-cols-2 items-center md:min-h-[min(760px,calc(100svh-72px))]">
    <div className={`h-[52svh] md:h-[calc(100%-48px)] md:max-h-[680px] ${side === 'right' ? 'md:order-2 md:pl-0' : ''}`}>
      <Photo src={photo} alt={alt} bleed={side} className="md:rounded-none md:[border-radius:0] md:shadow-none" />
    </div>
    <div className={`px-5 md:px-20 py-14 md:py-0 ${side === 'right' ? 'md:order-1' : ''}`}><Reveal>{children}</Reveal></div>
  </section>
);

// Hand-drawn marks, in Belluh blue
export const Arrow: React.FC<{ className?: string; flip?: boolean }> = ({ className = '', flip }) => (
  <svg viewBox="0 0 80 90" className={`w-14 h-16 ${className}`} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
    <path d="M6 4c4 30 18 58 58 74" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M44 80l21-1-9-18" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Swash: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="relative inline-block whitespace-nowrap">{children}
    <svg viewBox="0 0 220 24" preserveAspectRatio="none" className="absolute left-[-4%] -bottom-3 w-[108%] h-5" fill="none" aria-hidden>
      <path d="M3 12c50-9 160-11 212-3M18 19c45-5 120-6 170-1" stroke={BLUE} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  </span>
);
export const Ring: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="relative inline-block whitespace-nowrap px-1">{children}
    <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="absolute -inset-x-2 -inset-y-1.5 w-[calc(100%+16px)] h-[calc(100%+12px)]" fill="none" aria-hidden>
      <path d="M150 8C96-2 18 6 6 36c-10 26 50 40 112 38 58-2 86-18 76-38C184 12 132 4 90 8" stroke={BLUE} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  </span>
);

// Numbered ideas in a row: giant numerals (on a dark band) or colored ones. Scrolls sideways on phones.
export const Numbered: React.FC<{ items: { title: string; body: string }[]; dark?: boolean; giant?: boolean; start?: number }> = ({ items, dark, giant, start = 1 }) => (
  <div className="-mx-5 px-5 md:mx-0 md:px-0 flex md:grid gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] md:overflow-visible" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}>
    {items.map((it, i) => (
      <Reveal key={it.title} delay={i * 90} className="shrink-0 w-[78%] sm:w-[46%] md:w-auto snap-start">
        <p className={`font-serif leading-none tracking-[-0.03em] ${giant ? 'text-[6.5rem] md:text-[8.5rem]' : 'text-[3.25rem] md:text-[3.5rem]'}`} style={{ color: dark ? '#fff' : BLUE }}>{String(i + start).padStart(2, '0')}</p>
        <h3 className={`mt-6 md:mt-10 ${giant ? 'font-serif text-[2rem] md:text-[2.4rem] tracking-tight' : 'text-[20px] font-semibold'} ${dark ? 'text-white' : ''}`}>{it.title}</h3>
        <p className={`mt-3 md:mt-5 text-[15px] leading-[1.6] ${dark ? 'text-white/80' : 'text-[#1a1a1a]/75'}`}>{it.body}</p>
      </Reveal>
    ))}
  </div>
);

// A grid of short ideas, each under a hairline
export const Lined: React.FC<{ items: { title: string; body: string; link?: { label: string; href?: string; onClick?: () => void } }[]; dark?: boolean }> = ({ items, dark }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
    {items.map((it, i) => (
      <Reveal key={it.title} delay={(i % 3) * 80}>
        <div className={`pt-6 border-t ${dark ? 'border-white/20' : 'border-[#1a1a1a]/15'}`}>
          <h3 className={`text-[17px] font-semibold ${dark ? 'text-white' : ''}`}>{it.title}</h3>
          <p className={`mt-4 text-[15px] leading-[1.6] ${dark ? 'text-white/75' : 'text-[#1a1a1a]/75'}`}>{it.body}</p>
          {it.link && (it.link.href
            ? <a href={it.link.href} target={it.link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="mt-5 inline-block text-[15px] underline underline-offset-4">{it.link.label}</a>
            : <button onClick={it.link.onClick} className="mt-5 inline-block text-[15px] underline underline-offset-4">{it.link.label}</button>)}
        </div>
      </Reveal>
    ))}
  </div>
);

export const Dark: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => <section className={`text-white py-20 md:py-28 ${className}`} style={{ background: INK }}>{children}</section>;

export const Pill: React.FC<{ children: React.ReactNode; onClick?: () => void; href?: string; light?: boolean }> = ({ children, onClick, href, light }) => {
  const cls = `inline-flex h-11 items-center gap-2 px-5 rounded-full text-[15px] font-semibold transition-colors ${light ? 'bg-white text-[#1a1a1a] hover:bg-white/85' : 'bg-[#1a1a1a] text-white hover:bg-black'}`;
  return href ? <a href={href} className={cls}>{children}</a> : <button onClick={onClick} className={cls}>{children}</button>;
};

// Share this page, the way hinge.co ends theirs
export const ShareBar: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : 'https://belluh.com';
  const btn = 'w-11 h-11 rounded-full inline-flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors';
  return (
    <div className="flex items-center justify-center gap-2 py-14">
      <span className="mr-3 text-[17px] font-semibold">Share this page:</span>
      <a className={btn} aria-label="Share on X" target="_blank" rel="noopener noreferrer" href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.8 6.3L18.9 2zm-1.2 18h1.9L6.4 3.9H4.4L17.7 20z" /></svg>
      </a>
      <a className={btn} aria-label="Share on Facebook" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
      </a>
      <button className={btn} aria-label="Copy link" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* the address bar has it */ } }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
      </button>
      <span role="status" className={`text-[14px] transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>Link copied!</span>
    </div>
  );
};

// Every company page ends on the same question
export const HiringLine: React.FC<{ eyebrow?: string; line?: string; cta?: string; to?: string }> = ({ eyebrow = 'Our job openings', line = 'Want to build this with us?', cta = 'We’re hiring', to = '/careers' }) => (
  <Dark className="!py-20 md:!py-24">
    <Wrap>
      <Reveal><Eyebrow dark>{eyebrow}</Eyebrow><Big>{line}</Big><div className="mt-8"><Pill light onClick={() => go(to)}>{cta}</Pill></div></Reveal>
    </Wrap>
  </Dark>
);

export { go };
