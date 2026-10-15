import React, { useEffect, useRef, useState } from 'react';
import { Check, Lock, CalendarCheck, ExternalLink } from 'lucide-react';
import BelluhOrb from './BelluhOrb';
import BelluhSpeech from './BelluhSpeech';

// Belluh doing real things, played out on the landing page the way it happens in the app. Each demo starts when it
// scrolls into view and plays once; with reduced motion (or no IntersectionObserver) it shows the finished state.

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** How far a demo has played: 0 until it's on screen, then counts up through its steps on a schedule. */
function useScript(times: number[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') { setStep(times.length); return; }
    let timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
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

const Stage: React.FC<{ children: React.ReactNode; tint?: 'blue' | 'pink' }> = ({ children, tint = 'blue' }) => (
  <div className="relative">
    <div className={`absolute -inset-6 md:-inset-10 rounded-[3rem] blur-3xl opacity-70 pointer-events-none ${tint === 'blue' ? 'bg-[#CDE9F2]/70' : 'bg-[#f0addd]/25'}`}></div>
    <div className="relative rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] p-5 md:p-7 min-h-[360px] flex flex-col gap-4">
      {children}
    </div>
  </div>
);

// 1. Plans a date both of you say yes to
const PlanDemo: React.FC = () => {
  const { ref, step } = useScript([300, 1300, 4600, 6400, 7600]);
  return (
    <div ref={ref}>
      <Stage>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">You &amp; Dan</p>
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
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <BelluhOrb size={28} />
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Belluh</p>
            <p className="text-xs text-slate-400">on WhatsApp, SMS or Telegram</p>
          </div>
        </div>
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

const ROWS: { label: string; title: string; text: string; demo: React.ReactNode }[] = [
  { label: 'Plans', title: 'Plans the date you both say yes to.', text: 'From date night to the honeymoon. Ask in your shared thread: Belluh suggests times from what it knows about your week, your partner picks one with a tap, it lands in both calendars, and the reservation or the trip is a tap from booked.', demo: <PlanDemo /> },
  { label: 'Comes to you', title: 'Texts you before the big days.', text: "Birthdays, anniversaries, the plan nobody answered. Belluh reaches out on WhatsApp, SMS or Telegram and gets the table, the flowers and the gift ideas ready.", demo: <TextDemo /> },
  { label: 'Notices', title: 'Sees what you might miss.', text: 'Every Sunday it reads both sides of your week and brings one insight and one small thing to try together. You each check it off with one tap.', demo: <WeekDemo /> },
  { label: 'Private', title: 'Private when you want it.', text: "Every entry is shared or Just me, your call. Your partner never sees your private entries, and neither does their Belluh. Encrypted in storage and in transit, and never sold.", demo: <PrivacyDemo /> },
];

const LandingDemos: React.FC<{ onShowPrivacy: () => void }> = ({ onShowPrivacy }) => (
  <section id="features" className="relative z-10 px-6 py-24 md:py-32 scroll-mt-24">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl mb-16 md:mb-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-4">What Belluh does</p>
        <h2 className="text-4xl md:text-6xl font-serif tracking-tight leading-[1.05] text-slate-900">Not a chatbot. <span className="text-[#9bbecb]">It does things.</span></h2>
        <p className="mt-5 text-lg md:text-xl text-slate-500 font-light leading-relaxed">Planning, remembering, reminding. Anything that reaches your partner or costs money waits for your yes.</p>
      </div>
      <div className="space-y-24 md:space-y-36">
        {ROWS.map((r, i) => (
          <div key={r.label} className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className={i % 2 ? 'md:order-2' : ''}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f0addd] mb-3">{r.label}</p>
              <h3 className="text-3xl md:text-[2.6rem] font-serif tracking-tight leading-[1.1] text-slate-900">{r.title}</h3>
              <p className="mt-4 text-lg text-slate-500 font-light leading-relaxed max-w-md">{r.text}</p>
              {r.label === 'Private' && (
                <p className="mt-4 text-sm text-slate-400 max-w-md">
                  Belluh's replies are written by Google's Gemini models, which process your entries to write them.{' '}
                  <button onClick={onShowPrivacy} className="font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800">Privacy policy</button>
                </p>
              )}
            </div>
            <div className={i % 2 ? 'md:order-1' : ''}>{r.demo}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LandingDemos;
