// The landing's camera-roll story, after tryrollup.com's strongest ideas, in Belluh's words: a journal that starts blank
// while years of a couple's life already sit on their phones. Five parts, placed apart on the page:
//   RollSteps      photos scattered around three steps that light up one at a time as you scroll
//   RollLearns     a big list of what the photos hold (one lit) next to a stacked photo card and a small snippet
//   RollPrivacy    the phone in airplane mode, reading on the device: the photos never leave it
//   RollGaps       dated columns between two dates, ending in Bella's faded suggestion for the next
//   RollEverywhere sources on the left, thin curves into one shared couple card, then into Bella on the phone
// Photos are the real ones in public/milestones; the rest are solid tiles with a 3D emoji, like a camera roll seen
// from afar. Everything is an example and marked so. Motion stops under prefers-reduced-motion.
import React, { useEffect, useRef, useState } from 'react';
import { useI18n, useUi } from '../i18n';
import roll from '../i18n/ui/cameraRoll';
import { emojiSrc } from '../lib/emoji3d';
import BelluhOrb from './BelluhOrb';

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

type Snap = { src?: string; e?: string; bg?: string; pos?: string };
const P = (name: string, pos = 'center'): Snap => ({ src: `/milestones/${name}.webp`, pos });
const M = (name: string, pos = 'center'): Snap => ({ src: `/moments/${name}.webp`, pos });
const E = (e: string, bg: string): Snap => ({ e, bg });

/** One camera-roll picture: a real photo, or a solid tile with a 3D emoji standing in for one. */
const SnapTile: React.FC<{ s: Snap; className?: string; style?: React.CSSProperties; eager?: boolean }> = ({ s, className = '', style, eager }) => {
  if (s.src) return <img src={s.src} alt="" loading={eager ? undefined : 'lazy'} decoding="async" draggable={false} className={`object-cover select-none bg-slate-100 ${className}`} style={{ objectPosition: s.pos, ...style }} />;
  const src = emojiSrc(s.e);
  return (
    <div className={`flex items-center justify-center select-none ${className}`} style={{ background: s.bg, ...style }}>
      {src ? <img src={src} alt="" draggable={false} className="w-[46%] h-auto" /> : <span className="text-[2rem] leading-none">{s.e}</span>}
    </div>
  );
};

/** Lights the step whose middle crosses the middle of the screen, one at a time as you scroll. */
function useScrollStep(count: number) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
    }, { rootMargin: '-48% 0px -48% 0px' });
    refs.current.slice(0, count).forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [count]);
  return { refs, active };
}

// Where each picture sits: m on phones (null: hidden), d from md up; left and top in % of the field
type Spot = { s: Snap; m: [number, number, number] | null; d: [number, number, number]; r: number; blur?: number };
const SCATTER: Spot[] = [
  { s: P('first-date', '60% center'), m: [3, 0, 92], d: [2, 2, 150], r: -6 },
  { s: M('sun-on-the-rocks', 'center 85%'), m: [39, 3, 62], d: [22, 6, 86], r: 4, blur: 1 },
  { s: M('river-walk'), m: [30, 15, 50], d: [38, 1, 70], r: -3, blur: 2.5 },
  { s: P('78th-trip'), m: [67, 0, 96], d: [53, 5, 124], r: 5 },
  { s: M('paris-seine'), m: [79, 16, 58], d: [73, 10, 98], r: -4, blur: 1.5 },
  { s: P('just-married'), m: null, d: [86, 30, 138], r: 6 },
  { s: M('couch-hug'), m: null, d: [63, 37, 76], r: -6, blur: 2.5 },
  { s: P('first-kiss', '40% center'), m: [4, 80, 88], d: [67, 56, 132], r: -3 },
  { s: M('neon-kiss'), m: null, d: [86, 72, 92], r: 5 },
  { s: P('30th-anniversary'), m: [66, 79, 100], d: [50, 80, 116], r: 4, blur: 1 },
  { s: E('🍜', '#fde7d9'), m: [38, 86, 62], d: [30, 84, 88], r: -5 },
  { s: M('bus-ride'), m: null, d: [4, 86, 96], r: 3, blur: 2.5 },
];

export const RollSteps: React.FC = () => {
  const T = useUi(roll);
  const { refs, active } = useScrollStep(T.roll.steps.length);
  return (
    <section id="camera-roll" className="relative z-10 px-6 pt-16 md:pt-24 overflow-hidden scroll-mt-24">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-[2.2rem] md:text-[3.4rem] leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance] [word-break:auto-phrase]">{T.roll.title}</h2>
        <p className="mt-5 text-[17px] md:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto [text-wrap:pretty]">{T.roll.sub}</p>
      </div>
      <div className="relative max-w-6xl mx-auto h-[780px] md:h-[900px] mt-6 md:mt-10">
        {SCATTER.map((p, i) => (
          <div key={i} aria-hidden
            className={`absolute ${p.m ? '' : 'hidden md:block'} left-[var(--ml)] top-[var(--mt)] w-[var(--mw)] md:left-[var(--dl)] md:top-[var(--dt)] md:w-[var(--dw)]`}
            style={{ '--ml': `${p.m?.[0] ?? 0}%`, '--mt': `${p.m?.[1] ?? 0}%`, '--mw': `${p.m?.[2] ?? 0}px`, '--dl': `${p.d[0]}%`, '--dt': `${p.d[1]}%`, '--dw': `${p.d[2]}px`, transform: `rotate(${p.r}deg)`, filter: p.blur ? `blur(${p.blur}px)` : undefined } as React.CSSProperties}>
            <SnapTile s={p.s} className="w-full aspect-[4/5] rounded-[6px] shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)]" />
          </div>
        ))}
        <ol className="absolute inset-x-0 top-[25%] md:top-[30%] md:left-[4%] md:right-auto md:w-[54%] flex flex-col">
          {T.roll.steps.map((s, i) => (
            <li key={i} ref={el => { refs.current[i] = el; }} data-step={i} className="flex items-baseline gap-4 md:gap-5 py-5 md:py-7">
              <span className={`w-4 shrink-0 text-sm font-bold tabular-nums transition-colors duration-500 motion-reduce:transition-none ${active === i ? 'text-[#f0addd]' : 'text-slate-300'}`}>{i + 1}</span>
              <p className={`font-serif text-[1.65rem] md:text-[2.5rem] leading-[1.12] tracking-tight [text-wrap:balance] transition-colors duration-500 motion-reduce:transition-none ${active === i ? 'text-slate-900' : 'text-slate-300'}`}>{s}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

// What each category shows: an emoji beside its name, and the picture on the card
const LEARN_LOOK: { e: string; snap: Snap }[] = [
  { e: '✈️', snap: M('paris-seine') },
  { e: '🍜', snap: E('🍜', '#fde7d9') }, // the spot you keep going back to
  { e: '📍', snap: M('couch-hug') },
  { e: '💞', snap: P('first-date', '62% center') },
  { e: '🗓️', snap: M('bus-ride') },
];

export const RollLearns: React.FC = () => {
  const T = useUi(roll);
  const items = T.learns.items;
  const [on, setOn] = useState(0);
  const [held, setHeld] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // Walk through the categories while the section is on screen, until someone picks one
  useEffect(() => {
    if (held || reducedMotion() || typeof IntersectionObserver === 'undefined') return;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(() => setOn(n => (n + 1) % items.length), 2800);
    }, { threshold: 0.4 });
    if (box.current) io.observe(box.current);
    return () => { io.disconnect(); window.clearInterval(timer); };
  }, [held, items.length]);
  const it = items[on];
  const behind = [(on + 1) % items.length, (on + 2) % items.length];
  return (
    <section className="relative z-10 px-6 py-20 md:py-28">
      <div ref={box} className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <h2 className="font-serif text-[2.2rem] md:text-[3.2rem] leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance] [word-break:auto-phrase]">{T.learns.title}</h2>
          <p className="mt-5 text-[17px] md:text-lg text-slate-500 leading-relaxed [text-wrap:pretty]">{T.learns.sub}</p>
        </div>
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-12 md:gap-16">
          <ul className="flex flex-col gap-1 md:gap-2">
            {items.map((x, i) => (
              <li key={i}>
                <button onClick={() => { setHeld(true); setOn(i); }} aria-pressed={on === i}
                  className={`group flex items-center gap-4 md:gap-5 text-left transition-colors duration-300 motion-reduce:transition-none ${on === i ? 'text-slate-900' : 'text-slate-200 hover:text-slate-400'}`}>
                  <img src={emojiSrc(LEARN_LOOK[i].e) ?? undefined} alt="" className={`w-8 h-8 md:w-11 md:h-11 shrink-0 transition-[filter,opacity] duration-300 ${on === i ? '' : 'grayscale opacity-30'}`} />
                  <span className="font-serif text-[2.4rem] md:text-[4.2rem] leading-[1.1] tracking-tight">{x.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mx-auto w-[272px] md:w-[300px]">
            <div className="relative w-full aspect-[4/5]">
              {behind.map((b, k) => (
                <SnapTile key={`${b}-${k}`} s={LEARN_LOOK[b].snap} className="absolute inset-0 w-full h-full rounded-[10px] opacity-90 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)]"
                  style={{ transform: `rotate(${k ? 7 : -5}deg) translateX(${k ? 14 : -12}px) scale(.94)` }} />
              ))}
              <SnapTile key={on} s={LEARN_LOOK[on].snap} className="absolute inset-0 w-full h-full rounded-[10px] shadow-[0_30px_60px_-28px_rgba(15,23,42,0.55)] animate-[fadeUp_.45s_ease-out] motion-reduce:animate-none" />
            </div>
            <div className="mt-7 min-h-[176px]">
              <p className="font-serif text-[1.35rem] leading-snug text-slate-900 [text-wrap:balance]">{it.insight}</p>
              <dl className="mt-4 rounded-2xl bg-white border border-slate-100 px-4 py-3 font-mono text-[12.5px] leading-6 text-slate-500">
                {it.facts.map(f => (
                  <div key={f.k} className="flex items-baseline justify-between gap-4">
                    <dt className="text-slate-400 truncate">{f.k}</dt>
                    <dd className="text-slate-800 text-right truncate">{f.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-slate-400">{T.learns.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// The thumbnails on the phone in airplane mode
const GRID: Snap[] = [P('first-date', '60% center'), M('sun-on-the-rocks', 'center 85%'), P('78th-trip'), E('🍜', '#fde7d9'), M('curtain-kiss'), M('paris-seine'), P('30th-anniversary'), M('couch-kiss'), M('rainy-campus'), M('neon-kiss'), P('first-kiss', '40% center'), M('river-walk')];
const PHOTO_COUNT = 3912;

export const RollPrivacy: React.FC = () => {
  const T = useUi(roll);
  const { f, tag } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') { setN(PHOTO_COUNT); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / 2600); setN(Math.round(PHOTO_COUNT * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const num = (() => { try { return new Intl.NumberFormat(tag).format(n); } catch { return String(n); } })();
  const lit = Math.min(GRID.length, Math.floor((n / PHOTO_COUNT) * GRID.length));
  return (
    <section className="relative z-10 px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-20">
        <div className="text-center md:text-left">
          <h2 className="font-serif text-[2.2rem] md:text-[3.2rem] leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance] [word-break:auto-phrase]">{T.device.title}</h2>
          <p className="mt-5 text-[17px] md:text-lg text-slate-500 leading-relaxed max-w-lg mx-auto md:mx-0 [text-wrap:pretty]">{T.device.body}</p>
        </div>
        <div ref={ref} className="mx-auto w-full max-w-[320px]">
          <div className="rounded-[2.8rem] bg-[#0f172a] p-3 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.55)]">
            <div className="relative rounded-[2.2rem] bg-white overflow-hidden px-4 pb-5">
              <div className="h-12 flex items-center justify-between px-2 text-[13px] font-semibold text-slate-900">
                <span className="tabular-nums">9:41</span>
                <span className="w-[86px] h-[26px] rounded-full bg-black" aria-hidden />
                <span className="inline-flex items-center gap-1.5 text-[#f59e0b]"><img src={emojiSrc('✈️') ?? undefined} alt="" className="w-4 h-4" /><span className="sr-only">{T.device.status}</span></span>
              </div>
              <p className="mt-1 text-center text-[11px] font-semibold text-[#b45309]">{T.device.status}</p>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {GRID.map((s, i) => (
                  <SnapTile key={i} s={s} className={`w-full aspect-square rounded-md transition-[filter,opacity] duration-500 motion-reduce:transition-none ${i < lit ? '' : 'grayscale opacity-40'}`} />
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900"><BelluhOrb size={18} />{T.device.reading}</span>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#9bbecb]" style={{ width: `${(n / PHOTO_COUNT) * 100}%` }} />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-3 text-[12px] text-slate-500">
                <span className="tabular-nums">{f(T.device.count, { n: num })}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#3f7486]"><img src={emojiSrc('🔒') ?? undefined} alt="" className="w-3.5 h-3.5" />{T.device.uploaded}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// The four days between dates, each a tile standing in for that day's photo
const GAP_SNAPS: Snap[] = [M('river-walk'), E('🎂', '#fbe3f2'), E('🌻', '#eef3e6'), M('sun-on-the-rocks', 'center 85%')];

export const RollGaps: React.FC = () => {
  const T = useUi(roll);
  const g = T.gaps;
  const col = 'w-[148px] md:w-auto shrink-0 snap-start';
  return (
    <section className="relative z-10 px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-[2.2rem] md:text-[3.2rem] leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance] [word-break:auto-phrase]">{g.title}</h2>
        <p className="mt-5 text-[17px] md:text-lg text-slate-500 leading-relaxed max-w-xl [text-wrap:pretty]">{g.sub}</p>
        <div className="mt-12 -mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          <div className="flex md:grid md:grid-cols-6 gap-4 md:gap-5 w-max md:w-auto">
            <div className={col}>
              <p className="text-xs font-semibold tabular-nums text-[#3f7486] h-5">{g.last.date}</p>
              <div className="mt-3 pt-4 border-t border-slate-200">
                <p className="font-serif text-[1.45rem] leading-tight text-slate-900">{g.last.title}</p>
                <p className="mt-2 text-[14px] leading-snug text-slate-500">{g.last.note}</p>
              </div>
            </div>
            {g.moments.map((m, i) => (
              <div key={i} className={col}>
                <p className="text-xs font-semibold tabular-nums text-slate-400 h-5">{m.date}</p>
                <div className="mt-3 pt-4 border-t border-slate-200">
                  <SnapTile s={GAP_SNAPS[i]} className="w-full aspect-[4/5] rounded-[6px] grayscale opacity-60" />
                  <p className="mt-3 text-[13px] leading-snug text-slate-400">{m.text}</p>
                </div>
              </div>
            ))}
            <div className={col}>
              <p className="text-xs font-semibold tabular-nums text-[#e58fc9] h-5">{g.next.date}</p>
              <div className="mt-3 pt-4 border-t border-[#f0addd]/40">
                <p className="font-serif text-[1.45rem] leading-tight text-[#e58fc9]/70">{g.next.title}</p>
                <p className="mt-2 text-[14px] leading-snug text-[#c06ba5]/60">{g.next.note}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SOURCE_EMOJI = ['📸', '📅', '💬', '✏️', '🗺️', '🍽️'];
// Desktop layout of the diagram, in px: the field is H tall, the six sources are ROW apart and centred
const H = 440, ROW = 64, TOP = (H - ROW * 6) / 2;

export const RollEverywhere: React.FC = () => {
  const T = useUi(roll);
  const s = T.story;
  const srcY = s.sources.map((_, i) => TOP + ROW * i + ROW / 2);
  const cardY = s.sources.map((_, i) => 150 + (i * 140) / (s.sources.length - 1));
  const outY = [176, 220, 264];
  const curve = (y1: number, y2: number) => `M0 ${y1} C 50 ${y1}, 50 ${y2}, 100 ${y2}`;
  const Wire = ({ paths }: { paths: string[] }) => (
    <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="hidden md:block w-full h-full" aria-hidden>
      {paths.map((p, i) => <path key={i} d={p} fill="none" stroke="#cbd5e1" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
  return (
    <section id="everywhere" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-[2.2rem] md:text-[3.2rem] leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance] [word-break:auto-phrase]">{s.title}</h2>
          <p className="mt-5 text-[17px] md:text-lg text-slate-500 leading-relaxed [text-wrap:pretty]">{s.sub}</p>
        </div>
        <div className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(40px,110px)_280px_minmax(40px,110px)_250px] lg:grid-cols-[minmax(0,1fr)_120px_300px_120px_260px] items-center gap-10 md:gap-0 md:h-[440px]">
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-x-6 md:gap-0 md:h-full md:py-[28px]">
            {s.sources.map((x, i) => (
              <li key={i} className="h-14 md:h-16 flex items-center gap-3 min-w-0">
                <img src={emojiSrc(SOURCE_EMOJI[i]) ?? undefined} alt="" className="w-8 h-8 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-slate-800 leading-tight truncate">{x.name}</span>
                  <span className="block text-[13px] text-slate-400 leading-snug truncate">{x.ex}</span>
                </span>
              </li>
            ))}
          </ul>
          <Wire paths={srcY.map((y, i) => curve(y, cardY[i]))} />
          <div className="mx-auto w-full max-w-[300px] md:max-w-none rounded-[1.75rem] bg-white border border-slate-100 shadow-[0_30px_70px_-36px_rgba(15,23,42,0.4)] px-6 py-6">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 shrink-0 rounded-full overflow-hidden"><img src="/milestones/first-date.webp" alt="" className="w-full h-full object-cover object-[62%_center]" /></span>
              <span className="font-serif text-xl text-slate-900 truncate">{s.couple}</span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {s.knows.map(k => <li key={k} className="text-[14px] leading-snug text-slate-500">{k}</li>)}
            </ul>
          </div>
          <Wire paths={outY.map((y, i) => curve(196 + i * 24, y))} />
          <div className="mx-auto w-full max-w-[260px]">
            <p className="text-center text-xs font-semibold text-slate-400 mb-3">{s.phoneLabel}</p>
            <div className="rounded-[2.4rem] bg-[#0f172a] p-2.5 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.55)]">
              <div className="rounded-[1.9rem] bg-white overflow-hidden h-[280px] md:h-[340px] flex flex-col">
                <div className="pt-4 pb-3 flex flex-col items-center bg-[#f8f8fa]">
                  <BelluhOrb size={28} />
                  <span className="mt-1 text-[11px] font-semibold text-slate-700">{T.bella}</span>
                </div>
                <div className="flex-1 px-3 py-4 flex flex-col justify-end gap-2">
                  <p className="self-start max-w-[88%] rounded-[1.1rem] rounded-bl-md bg-[#e9e9eb] px-3 py-2 text-[13px] leading-snug text-slate-900">{s.bellaSays}</p>
                  <p className="self-end rounded-[1.1rem] rounded-br-md bg-[#0a84ff] px-3 py-2 text-[13px] leading-snug text-white">{s.you}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-400">{s.note}</p>
      </div>
    </section>
  );
};
