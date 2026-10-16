import React, { useEffect, useRef, useState } from 'react';
import { Check, Lock, CalendarCheck, ExternalLink } from 'lucide-react';
import BelluhOrb from './BelluhOrb';
import BelluhSpeech from './BelluhSpeech';

// Belluh doing real things, played out on the landing page the way it happens in the app. Each demo starts when it
// scrolls into view and plays once; with reduced motion (or no IntersectionObserver) it shows the finished state.

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** How far a demo has played: its first message is there from the start (never an empty stage), then it counts up
 *  through the rest of its steps on a schedule once it's on screen. */
function useScript(times: number[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') { setStep(times.length); return; }
    let timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      timers = times.slice(1).map((t, i) => setTimeout(() => setStep(i + 2), Math.max(200, t - times[0] - 300)));
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, []);
  return { ref, step };
}

const Appear: React.FC<{ on: boolean; children: React.ReactNode; className?: string }> = ({ on, children, className = '' }) => (
  <div className={`transition-all duration-500 ease-out ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'} ${className}`}>{children}</div>
);

const BelluhLine: React.FC<{ on: boolean; text: string; children?: React.ReactNode }> = ({ on, text, children }) => (
  <Appear on={on} className="flex gap-3 items-start">
    <div className="shrink-0 pt-0.5"><BelluhOrb size={26} /></div>
    <div className="min-w-0 flex-1">
      <p className="font-serif text-[15px] md:text-base leading-relaxed text-slate-800">{on ? <BelluhSpeech text={text} pace={1.6} /> : text}</p>
      {children}
    </div>
  </Appear>
);

const Stage: React.FC<{ children: React.ReactNode; tint?: 'blue' | 'pink' }> = ({ children }) => (
  <div className="p-5 md:p-7 min-h-[430px] md:min-h-[460px] flex flex-col gap-4">{children}</div>
);

// 1. Plans a date both of you say yes to
const PlanDemo: React.FC = () => {
  const { ref, step } = useScript([300, 1300, 4600, 6400, 7600]);
  return (
    <div ref={ref}>
      <Stage>
        <Appear on={step >= 1} className="self-end max-w-[80%] rounded-3xl rounded-br-lg bg-slate-100 px-4 py-2.5 text-[15px] text-slate-800">
          Belluh, plan us something easy this weekend
        </Appear>
        <BelluhLine on={step >= 2} text="You both miss the ramen place on 5th, and Dan's week has been loud. Something close and easy:">
          <Appear on={step >= 3} className="mt-3 rounded-3xl border border-[#f0addd]/40 bg-[#fdf2f9]/60 p-4">
            <p className="inline-block rounded-full bg-[#f0addd]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#c06ba5]">Plan for you &amp; Dan</p>
            <p className="mt-2 font-serif text-lg text-slate-900">Ramen, then the night market</p>
            <div className="mt-3 space-y-2 text-sm">
              {['Friday at 7:00 PM', 'Saturday at 6:00 PM'].map((t, i) => (
                <div key={t} className={`flex items-center justify-between rounded-2xl px-3 py-2 transition-all duration-500 ${step >= 4 && i === 0 ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500'}`}>
                  <span>{t}</span>
                  {step >= 4 && i === 0 && <span className="text-xs font-bold text-[#3f7486] flex items-center gap-1"><Check size={14} /> Dan picked this</span>}
                </div>
              ))}
            </div>
          </Appear>
        </BelluhLine>
        <Appear on={step >= 5} className="mt-auto flex items-center gap-2 rounded-2xl bg-[#F4FAFC] px-4 py-3 text-sm text-slate-700">
          <CalendarCheck size={16} className="text-[#3f7486] shrink-0" /> In both of your calendars, with a reminder the day before
        </Appear>
      </Stage>
    </div>
  );
};

// 2. Comes to you by text, and does the legwork
const TextDemo: React.FC = () => {
  const { ref, step } = useScript([300, 3600, 4600, 7400]);
  return (
    <div ref={ref}>
      <Stage tint="pink">
        <Appear on={step >= 1} className="max-w-[85%] rounded-3xl rounded-bl-lg bg-[#F4FAFC] px-4 py-3 text-[15px] leading-relaxed text-slate-800">
          {step >= 1 ? <BelluhSpeech text="Dan's birthday is in 12 days. He wrote that he misses shooting film. Want me to plan it?" pace={1.6} /> : null}
        </Appear>
        <Appear on={step >= 2} className="self-end rounded-3xl rounded-br-lg bg-[#fdf2f9] px-4 py-2.5 text-[15px] font-bold text-[#c06ba5]">
          PLAN IT
        </Appear>
        <Appear on={step >= 3} className="max-w-[85%] rounded-3xl rounded-bl-lg bg-[#F4FAFC] px-4 py-3 text-[15px] leading-relaxed text-slate-800">
          {step >= 3 ? <BelluhSpeech text="Here's a start. A table near you Saturday at 7, and two gifts from what he's said he loves." pace={1.6} /> : null}
        </Appear>
        <Appear on={step >= 4} className="flex flex-wrap gap-2">
          {['Table for 2, Saturday 7:00 PM', 'Film camera', 'Polaroid photo album'].map(l => (
            <span key={l} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">{l} <ExternalLink size={12} className="text-slate-400" /></span>
          ))}
        </Appear>
        <Appear on={step >= 4} className="mt-auto text-xs text-slate-400">Belluh gets it ready. You make the booking or the purchase.</Appear>
      </Stage>
    </div>
  );
};

// 3. Every Sunday: one insight, one thing to try
const WeekDemo: React.FC = () => {
  const { ref, step } = useScript([300, 900, 4300, 6000]);
  return (
    <div ref={ref}>
      <Stage>
        <Appear on={step >= 1} className="flex items-center gap-2.5">
          <BelluhOrb size={26} />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Your week, from Belluh</p>
        </Appear>
        <Appear on={step >= 2}>
          <p className="font-serif text-xl md:text-2xl leading-snug text-slate-900">
            {step >= 2 ? <BelluhSpeech text="Dinner came up for both of you this week, and both times it went quiet." pace={1.5} /> : null}
          </p>
        </Appear>
        <Appear on={step >= 3} className="rounded-3xl bg-[#F4FAFC] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3f7486]">This week, together</p>
          <p className="mt-1.5 font-serif text-lg text-slate-900">A twenty-minute walk after dinner, phones at home.</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white">Did it</span>
            <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-500">Not yet</span>
          </div>
        </Appear>
        <Appear on={step >= 4} className="mt-auto flex items-center gap-2 text-sm font-bold text-[#3f7486]">
          <Check size={16} /> Dan: did it
        </Appear>
      </Stage>
    </div>
  );
};

// 4. Private when you want it
const PrivacyDemo: React.FC = () => {
  const { ref, step } = useScript([300, 1500, 2700]);
  const on = step >= 2;
  return (
    <div ref={ref}>
      <Stage tint="pink">
        <Appear on={step >= 1}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Today</p>
          <p className="mt-2 font-serif text-xl leading-relaxed text-slate-800">I'm nervous about meeting his parents. I don't want him to think I'm not excited.</p>
        </Appear>
        <Appear on={step >= 1} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><Lock size={15} className={on ? 'text-[#c06ba5]' : 'text-slate-400'} /> Just me</span>
          <span className={`relative h-7 w-12 rounded-full transition-colors duration-500 ${on ? 'bg-[#f0addd]' : 'bg-slate-200'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-500 ${on ? 'left-6' : 'left-1'}`}></span>
          </span>
        </Appear>
        <BelluhLine on={step >= 3} text="Only you can read this one. I won't bring it up with Dan, and his Belluh can't see it." />
      </Stage>
    </div>
  );
};

const ROWS: { label: string; title: string; text: string; where: string; demo: () => React.ReactNode }[] = [
  { label: 'Plans', where: 'You & Dan', title: 'The date nobody gets around to planning.', text: 'Everyone says "we should go out." Belluh finds times that fit both your weeks, your partner picks one with a tap, and it lands in both calendars.', demo: () => <PlanDemo /> },
  { label: 'Comes to you', where: 'WhatsApp', title: 'The birthday that sneaks up on you.', text: 'Birthdays, anniversaries, the plan nobody answered. Belluh texts you on WhatsApp, SMS or Telegram days ahead, with the table, the flowers and the gift ideas ready.', demo: () => <TextDemo /> },
  { label: 'Notices', where: 'Sunday', title: 'The quiet drift you never notice.', text: 'Couples rarely fall apart in one night. Every Sunday Belluh reads both sides of your week and brings one insight and one small thing to try together.', demo: () => <WeekDemo /> },
  { label: 'Private', where: 'Today', title: 'Some things are just for you.', text: "Every entry is shared or Just me, your call. Your partner never sees your private entries, and neither does their Belluh.", demo: () => <PrivacyDemo /> },
];

const SLIDE_MS = 11000;

// One stage, four things Belluh does: pick one on the left (or let it play through) and watch it happen on the right
const LandingDemos: React.FC<{ onShowPrivacy: () => void }> = ({ onShowPrivacy }) => {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !seen || reducedMotion()) return;
    const t = setTimeout(() => setActive(a => (a + 1) % ROWS.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [active, auto, seen]);
  const pick = (i: number) => { setAuto(false); setActive(i); };
  const row = ROWS[active];
  return (
    <section id="features" className="relative z-10 px-6 py-24 md:py-32 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-4">What Belluh does</p>
          <h2 className="text-4xl md:text-6xl font-serif tracking-tight leading-[1.05] text-slate-900">Everyone says <span className="italic text-[#f0addd] whitespace-nowrap">we should.</span><br /><span className="text-[#9bbecb]">Nobody does.</span></h2>
          <p className="mt-5 text-lg md:text-xl text-slate-500 font-light leading-relaxed [text-wrap:pretty]">The date night nobody booked, the birthday that snuck up. Belluh catches what falls through, and anything that reaches your partner or costs money waits for your yes.</p>
        </div>

        <div ref={box} className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-14 items-start">
          {/* The four, as tabs: a row of chips on phones, a list with the story on laptops */}
          <div role="tablist" aria-label="What Belluh does" className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0 lg:gap-1">
            {ROWS.map((r, i) => (
              <button key={r.label} role="tab" aria-selected={active === i} onClick={() => pick(i)}
                className={`group relative shrink-0 text-left rounded-full lg:rounded-[1.5rem] transition-all duration-300 h-10 px-4 lg:h-auto lg:px-6 lg:py-5 ${active === i ? 'bg-slate-900 text-white lg:bg-white lg:text-slate-900 lg:shadow-[0_20px_50px_-24px_rgba(15,23,42,0.3)]' : 'bg-white/70 text-slate-500 lg:bg-transparent hover:text-slate-900 lg:hover:bg-white/60'}`}>
                <span className="lg:hidden text-sm font-semibold whitespace-nowrap">{r.label}</span>
                <span className="hidden lg:block">
                  <span className={`block text-[11px] font-bold uppercase tracking-[0.16em] ${active === i ? 'text-[#e58fc9]' : 'text-slate-400'}`}>{r.label}</span>
                  <span className={`mt-1.5 block font-serif text-2xl tracking-tight ${active === i ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'}`}>{r.title}</span>
                  {active === i && <span className="mt-2 block text-[15px] font-light leading-relaxed text-slate-500 animate-fade-in">{r.text}</span>}
                  {active === i && r.label === 'Private' && (
                    <span className="mt-3 block text-sm text-slate-400">Replies are written by Google's Gemini models, which process your entries to write them. <span role="link" tabIndex={0} onClick={e => { e.stopPropagation(); onShowPrivacy(); }} className="font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800 cursor-pointer">Privacy policy</span></span>
                  )}
                  {/* Time left on this one, while it plays through on its own */}
                  {active === i && auto && seen && (
                    <span className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-[#CDE9F2] overflow-hidden" aria-hidden="true">
                      <span key={active} className="block w-full bg-[#9bbecb] rounded-full" style={{ height: '100%', transformOrigin: 'top', animation: `demoFill ${SLIDE_MS}ms linear both` }} />
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div>
            <p className="lg:hidden mb-5 text-[15px] font-light leading-relaxed text-slate-500"><span className="font-serif text-xl text-slate-900 block mb-1">{row.title}</span>{row.text}</p>
            <div role="tabpanel" aria-label={row.label} className="relative">
              <div className="absolute -inset-6 md:-inset-10 rounded-[3rem] bg-gradient-to-br from-[#CDE9F2]/70 via-white/0 to-[#f0addd]/30 blur-3xl pointer-events-none" />
              <div className="relative rounded-[2rem] bg-white border border-white shadow-[0_40px_100px_-40px_rgba(15,23,42,0.35)] overflow-hidden">
                <div className="flex items-center gap-2.5 px-6 h-14 bg-[#F8FAFB]">
                  <BelluhOrb size={22} />
                  <span className="text-sm font-bold text-slate-900">Belluh</span>
                  <span className="ml-auto text-xs font-semibold text-slate-400">{row.where}</span>
                </div>
                <div key={active} className="animate-fade-in">{row.demo()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes demoFill { from { transform: scaleY(0); } to { transform: scaleY(1); } }`}</style>
    </section>
  );
};

export default LandingDemos;
