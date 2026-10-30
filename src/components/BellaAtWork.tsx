import React, { useEffect, useRef, useState } from 'react';
import { Car, Check, Flower2, Gift, Loader2, Lock, MapPin, PenLine, TrainFront, UtensilsCrossed, Wallet, Ban } from 'lucide-react';
import BelluhOrb from './BelluhOrb';
import { useI18n, type Country } from '../i18n';

/**
 * Bella at work: the night you forgot, handled while you watch. One request, then each thing Bella gets ready lands
 * against a running clock, with where it came from and what it's waiting on (nothing reaches the partner or costs
 * money without a yes). The same panic in four cities shows that Bella knows how love works where you live.
 */

type SceneKey = keyof ReturnType<typeof useI18n>['d']['scenes'];
const ICONS: Record<string, React.ElementType> = { table: UtensilsCrossed, flowers: Flower2, note: PenLine, ride: Car, train: TrainFront, gift: Gift, place: MapPin, money: Wallet, skip: Ban };

/** The four cities shown: where the reader lives first, then the places couples there would recognize. */
export function citiesFor(country: Country, lang: string): SceneKey[] {
  switch (country) {
    case 'GB': return ['london', 'newyork', 'paris', 'tokyo'];
    case 'CA': return lang === 'fr' ? ['montreal', 'paris', 'newyork', 'tokyo'] : ['toronto', 'newyork', 'paris', 'tokyo'];
    case 'AU': return ['sydney', 'tokyo', 'london', 'newyork'];
    case 'JP': return ['tokyo', 'paris', 'newyork', 'rome'];
    case 'FR': return ['paris', 'rome', 'tokyo', 'newyork'];
    case 'IT': return ['rome', 'paris', 'tokyo', 'newyork'];
    case 'BR': return ['saopaulo', 'newyork', 'paris', 'tokyo'];
    case 'CN': return ['shanghai', 'tokyo', 'paris', 'newyork'];
    case 'CH': return ['zurich', 'paris', 'rome', 'tokyo'];
    default: return ['newyork', 'tokyo', 'paris', 'rome'];
  }
}

const STEP_MS = 1000, FIRST_MS = 900;
const doneAt = (s: { steps: unknown[] }) => FIRST_MS + s.steps.length * STEP_MS + 300;
const clock = (ms: number) => `0:${String(Math.min(59, Math.floor(ms / 1000))).padStart(2, '0')}`;

const BellaAtWork: React.FC = () => {
  const { d, lang, country, f } = useI18n();
  const t_ = d.atWork;
  const keys = citiesFor(country, lang);
  const scenes = keys.map(k => d.scenes[k]);
  const [scene, setScene] = useState(0);
  const [t, setT] = useState(0);            // ms since this scene started
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const s = scenes[scene] ?? scenes[0];
  const total = doneAt(s);

  // Plays once when it comes into view; picking a city replays it there
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setStarted(true); setT(10_000); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!started || t >= total) return;
    const id = window.setTimeout(() => setT(x => x + 100), 100);
    return () => window.clearTimeout(id);
  }, [started, t, total]);

  const pick = (i: number) => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setScene(i); setStarted(true); setT(reduced ? 10_000 : 0);
  };
  const shown = Math.max(0, Math.min(s.steps.length, Math.floor((t - FIRST_MS) / STEP_MS) + 1));
  const done = t >= total;

  return (
    <section id="at-work" ref={ref} className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="min-w-0 lg:col-span-5 lg:sticky lg:top-28">
          <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.02]">
            <span className="text-slate-900">{t_.line1}</span><br />
            <span className="text-slate-900">{t_.line2}</span>
          </h2>
          <p className="mt-6 text-lg text-slate-500 font-light leading-relaxed max-w-md">
            {t_.body}
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-[#3f7486]">
            <Lock size={15} className="shrink-0" />
            {t_.lock}
          </p>

          <div className="mt-10 flex flex-row lg:flex-col gap-4 sm:gap-6 lg:gap-0 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label={t_.chooseCity}>
            {scenes.map((x, i) => {
              const on = i === scene;
              return (
                <button key={x.city} role="tab" aria-selected={on} onClick={() => pick(i)}
                  className="group shrink-0 text-left py-2 lg:py-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9bbecb] rounded-lg">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className={`font-serif text-lg sm:text-xl lg:text-2xl transition-colors ${on ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>{x.city}</span>
                    <span className={`hidden lg:inline text-sm transition-colors ${on ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-500'}`}>{x.via}</span>
                  </span>
                  <span className="mt-2 lg:mt-3 block h-[2px] rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                    <span className="block h-full bg-[#9bbecb]" style={{ width: on ? `${Math.min(100, (t / total) * 100)}%` : '0%', transition: on && t > 0 ? 'width 100ms linear' : 'none' }} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 lg:col-span-7" role="tabpanel" aria-label={s.city}>
          <div className="rounded-[2rem] bg-white border border-slate-100 shadow-[0_30px_80px_-30px_rgba(63,116,134,0.35)] overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 sm:px-6 h-16 border-b border-slate-100">
              <BelluhOrb size={24} />
              <span className="font-serif text-[17px] text-slate-900">Bella</span>
              <span className="hidden sm:inline text-sm text-slate-400">{f(t_.withIn, { name: s.couple[0], city: s.city })}</span>
              <span className="ml-auto flex items-center gap-1.5 text-sm text-slate-500" aria-live="polite">
                {done ? <Check size={15} className="text-[#3f7486]" /> : <Loader2 size={15} className="animate-spin text-[#9bbecb]" />}
                <span>{done ? t_.doneIn : t_.working}</span>
                <span className="tabular-nums text-slate-400 w-9 text-right">{clock(Math.min(t, total))}</span>
              </span>
            </div>

            <div className="px-4 sm:px-6 pt-6 pb-7 min-h-[600px] sm:min-h-[520px]">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-slate-100 px-4 py-3">
                  <p className="text-[15px] text-slate-800">{s.ask}</p>
                  {s.askLang !== lang && s.gloss && s.gloss !== s.ask && <p className="mt-1 text-xs text-slate-400">{s.gloss}</p>}
                </div>
              </div>

              <ul className="mt-6 flex flex-col gap-1">
                {s.steps.map((st, i) => {
                  const here = i < shown, next = i === shown && !done && started;
                  const Icon = ICONS[st.icon] ?? PenLine;
                  return (
                    <li key={`${scene}-${i}`} className={`flex items-center gap-3 sm:gap-4 rounded-2xl px-3 py-3 transition-all duration-500 ${here ? 'opacity-100 translate-y-0' : next ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                      <Icon size={20} strokeWidth={1.75} className={`shrink-0 ${here ? 'text-[#3f7486]' : 'text-slate-300'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-slate-900 leading-snug">{st.title}</span>
                        <span className="block text-sm text-slate-500 leading-snug sm:truncate">{here || !next ? st.detail : t_.finding}</span>
                        <span className={`sm:hidden mt-1 block text-xs font-semibold ${here ? ('yours' in st && st.yours ? 'text-[#c4589f]' : 'text-[#3f7486]') : 'text-transparent'}`}>{st.status}</span>
                      </span>
                      <span className={`hidden sm:block shrink-0 text-xs font-semibold whitespace-nowrap ${here ? ('yours' in st && st.yours ? 'text-[#c4589f]' : 'text-[#3f7486]') : 'text-transparent'}`}>{st.status}</span>
                    </li>
                  );
                })}
              </ul>

              <div className={`mt-6 flex items-start gap-3 transition-opacity duration-700 ${done ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!done}>
                <div className="shrink-0 pt-0.5"><BelluhOrb size={24} /></div>
                <p className="font-serif text-[17px] leading-relaxed text-slate-800">{s.reply}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">{t_.footnote}</p>
        </div>
      </div>
    </section>
  );
};

export default BellaAtWork;
