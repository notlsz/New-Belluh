import React, { useEffect, useRef, useState } from 'react';
import { Car, CakeSlice, Check, Flower2, Gem, Gift, Loader2, Lock, MapPin, PenLine, TrainFront, UtensilsCrossed, Wallet, Ban } from 'lucide-react';
import BelluhOrb from './BelluhOrb';

/**
 * Bella at work: the night you forgot, handled while you watch. One request, then each thing Bella gets ready lands
 * against a running clock, with where it came from and what it's waiting on (nothing reaches the partner or costs
 * money without a yes). The same panic in four cities shows that Bella knows how love works where you live.
 */

type Step = { icon: React.ElementType; title: string; detail: string; status: string; yours?: boolean };
type Scene = { city: string; via: string; couple: [string, string]; ask: string; askEn?: string; steps: Step[]; reply: string };

const SCENES: Scene[] = [
  {
    city: 'New York', via: 'OpenTable, UrbanStems and Uber', couple: ['Maya', 'Dan'],
    ask: 'Our anniversary is tonight and I completely forgot.',
    steps: [
      { icon: UtensilsCrossed, title: 'Table for two at 8, Lilia', detail: 'The pasta Dan still talks about, on OpenTable', status: 'Ready to book' },
      { icon: Flower2, title: 'Peonies by 6', detail: 'His favorite, from UrbanStems, $79', status: 'Ready to pay' },
      { icon: PenLine, title: 'A note in your words', detail: '“I lost track this week. Tonight is yours. Lilia at 8?”', status: 'Your yes sends it', yours: true },
      { icon: Car, title: 'Uber at 7:35', detail: 'From home, about 18 minutes', status: 'Ready' },
    ],
    reply: 'Breathe. The peonies land by 6, the table is one tap away, and the note is yours to send.',
  },
  {
    city: 'Tokyo', via: 'Tabelog, Rakuten and the trains', couple: ['Yui', 'Ren'],
    ask: 'クリスマスイブ、何も予約してない…', askEn: "It's Christmas Eve and I haven't booked anything",
    steps: [
      { icon: UtensilsCrossed, title: 'Counter seats at 7 in Ebisu', detail: 'A yakitori place found on Tabelog', status: 'Ready to book' },
      { icon: Gift, title: 'Pair mugs, gift-wrapped', detail: 'From Rakuten, wrapped the way it should be', status: 'Ready to pay' },
      { icon: MapPin, title: 'The illuminations after', detail: 'Ebisu Garden Place, a five-minute walk', status: 'Planned' },
      { icon: TrainFront, title: 'Home before the last train', detail: 'A reminder at 11:30', status: 'Reminder set' },
    ],
    reply: 'Christmas Eve is the night for two here. Counter seats keep it close, and the mugs come wrapped, the way Ren would.',
  },
  {
    city: 'Shanghai', via: 'Dianping, WeChat and JD', couple: ['Lin', 'Wei'],
    ask: '520 is tomorrow and I have nothing.',
    steps: [
      { icon: UtensilsCrossed, title: 'Rooftop dinner on the Bund, 7:30', detail: 'Found on Dianping, the queue opens at 5', status: 'Ready to book' },
      { icon: Wallet, title: 'A ¥520 red packet', detail: 'Drafted for WeChat, to send at 5:20', status: 'Your yes sends it', yours: true },
      { icon: Flower2, title: 'Eleven red roses', detail: 'One heart, one mind. From JD, by noon', status: 'Ready to pay' },
      { icon: Ban, title: 'Skipped the clock', detail: 'The one gift never to give', status: 'Avoided' },
    ],
    reply: '520 is handled. Eleven roses say one heart, and the red packet goes out at 5:20 on the dot.',
  },
  {
    city: 'Seoul', via: 'Naver Map, Coupang and KakaoTalk', couple: ['Jiwoo', 'Minjun'],
    ask: 'Day 100 is Saturday!',
    steps: [
      { icon: Gem, title: 'Couple rings', detail: 'Three picks from Coupang under ₩200,000', status: 'Ready to pay' },
      { icon: UtensilsCrossed, title: 'Pasta in Seongsu at 7', detail: 'On Naver Map, Catch Table opens at 10', status: 'Reminder set' },
      { icon: CakeSlice, title: 'A cake for the morning', detail: 'A KakaoTalk gift, delivered at 9', status: 'Your yes sends it', yours: true },
      { icon: PenLine, title: 'A day 100 note', detail: '“A hundred days, and I would do every one again.”', status: 'Your yes sends it', yours: true },
    ],
    reply: 'Day 100 is a big one here. Order the rings first, they take two days.',
  },
];

const STEP_MS = 1000, FIRST_MS = 900;
const doneAt = (s: Scene) => FIRST_MS + s.steps.length * STEP_MS + 300;
const clock = (ms: number) => `0:${String(Math.min(59, Math.floor(ms / 1000))).padStart(2, '0')}`;

const BellaAtWork: React.FC = () => {
  const [scene, setScene] = useState(0);
  const [t, setT] = useState(0);            // ms since this scene started
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const s = SCENES[scene];
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
    <section id="at-work" ref={ref} className="relative z-10 px-6 py-24 md:py-36 scroll-mt-24">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="min-w-0 lg:col-span-5 lg:sticky lg:top-28">
          <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.02]">
            <span className="text-slate-900">It's tonight.</span><br />
            <span className="text-[#f0addd] italic">You forgot.</span>
          </h2>
          <p className="mt-6 text-lg text-slate-500 font-light leading-relaxed max-w-md">
            Everyone has a night like this. Bella turns it around in seconds: the table, the flowers, the words, the way home. And it knows how love works where you live.
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-[#3f7486]">
            <Lock size={15} className="shrink-0" />
            Nothing reaches your partner or costs a cent until you say yes.
          </p>

          <div className="mt-10 flex flex-row lg:flex-col gap-4 sm:gap-6 lg:gap-0 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Choose a city">
            {SCENES.map((x, i) => {
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

        <div className="min-w-0 lg:col-span-7" role="tabpanel" aria-label={`Bella in ${s.city}`}>
          <div className="rounded-[2rem] bg-white border border-slate-100 shadow-[0_30px_80px_-30px_rgba(63,116,134,0.35)] overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 sm:px-6 h-16 border-b border-slate-100">
              <BelluhOrb size={24} />
              <span className="font-serif text-[17px] text-slate-900">Bella</span>
              <span className="hidden sm:inline text-sm text-slate-400">with {s.couple[0]} in {s.city}</span>
              <span className="ml-auto flex items-center gap-1.5 text-sm text-slate-500" aria-live="polite">
                {done ? <Check size={15} className="text-[#3f7486]" /> : <Loader2 size={15} className="animate-spin text-[#9bbecb]" />}
                <span>{done ? 'Done in' : 'Working'}</span>
                <span className="tabular-nums text-slate-400 w-9 text-right">{clock(Math.min(t, total))}</span>
              </span>
            </div>

            <div className="px-4 sm:px-6 pt-6 pb-7 min-h-[600px] sm:min-h-[520px]">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-slate-100 px-4 py-3">
                  <p className="text-[15px] text-slate-800">{s.ask}</p>
                  {s.askEn && <p className="mt-1 text-xs text-slate-400">{s.askEn}</p>}
                </div>
              </div>

              <ul className="mt-6 flex flex-col gap-1">
                {s.steps.map((st, i) => {
                  const here = i < shown, next = i === shown && !done && started;
                  const Icon = st.icon;
                  return (
                    <li key={`${scene}-${i}`} className={`flex items-center gap-3 sm:gap-4 rounded-2xl px-3 py-3 transition-all duration-500 ${here ? 'opacity-100 translate-y-0' : next ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                      <Icon size={20} strokeWidth={1.75} className={`shrink-0 ${here ? 'text-[#3f7486]' : 'text-slate-300'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-slate-900 leading-snug">{st.title}</span>
                        <span className="block text-sm text-slate-500 leading-snug sm:truncate">{here || !next ? st.detail : 'Finding it'}</span>
                        <span className={`sm:hidden mt-1 block text-xs font-semibold ${here ? (st.yours ? 'text-[#c4589f]' : 'text-[#3f7486]') : 'text-transparent'}`}>{st.status}</span>
                      </span>
                      <span className={`hidden sm:block shrink-0 text-xs font-semibold whitespace-nowrap ${here ? (st.yours ? 'text-[#c4589f]' : 'text-[#3f7486]') : 'text-transparent'}`}>{st.status}</span>
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
          <p className="mt-4 text-center text-xs text-slate-400">Sample couples. Bella prepares; you tap to book, pay or send.</p>
        </div>
      </div>
    </section>
  );
};

export default BellaAtWork;
