// Bella in your messages: a phone showing a sample couple's thread with Bella in iMessage, drawn in HTML so it is
// sharp at every size and speaks every language. The bubbles arrive one by one when the phone scrolls into view.
import React, { useEffect, useRef, useState } from 'react';
import { useUi } from '../i18n';
import demo from '../i18n/ui/textingDemo';
import DragonflyMark from './DragonflyMark';

const TextingDemo: React.FC = () => {
  const T = useUi(demo);
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    if (reduce || typeof IntersectionObserver === 'undefined') { setShown(99); return; }
    let timers: number[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      [0, 900, 2200, 3000, 4400, 5400].forEach((ms, i) => timers.push(window.setTimeout(() => setShown(i + 1), ms)));
    }, { threshold: 0.35 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, []);
  const thread = T.thread;
  return (
    <section id="texting" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">
        <div className="text-center lg:text-left">
          <p className="text-[15px] font-semibold text-[#3f7486]">{T.eyebrow}</p>
          <h2 className="mt-3 font-serif text-[2.2rem] md:text-[3.2rem] leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance]">{T.title}</h2>
          <p className="mt-5 text-[17px] md:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 [text-wrap:pretty]">{T.sub}</p>
        </div>

        <div ref={ref} className="relative mx-auto w-full max-w-[360px]">
          {/* The phone */}
          <div className="relative rounded-[3rem] bg-[#0f172a] p-3 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.55)]">
            <div className="relative rounded-[2.4rem] bg-white overflow-hidden h-[660px] flex flex-col">
              <div className="absolute left-1/2 top-2.5 -translate-x-1/2 w-[110px] h-[30px] rounded-full bg-black z-10" aria-hidden />
              {/* Header: the contact */}
              <div className="pt-12 pb-3 flex flex-col items-center border-b border-slate-100 bg-[#f8f8fa]">
                <span className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center"><DragonflyMark size={30} /></span>
                <p className="mt-1.5 text-[12px] font-semibold text-slate-900">{T.contact}</p>
                <p className="text-[10px] text-slate-400">{T.status}</p>
              </div>
              {/* The thread */}
              <div className="flex-1 min-h-0 px-3 py-4 flex flex-col justify-end gap-1.5 overflow-hidden" aria-live="polite">
                <p className="text-center text-[10px] font-semibold text-slate-400 mb-1">{T.today}</p>
                {thread.map((m, i) => (
                  <React.Fragment key={i}>
                    <div className={`shrink-0 max-w-[78%] px-3.5 py-2 text-[14px] leading-snug transition-all duration-500 ${m.me ? 'self-end bg-[#0a84ff] text-white rounded-[18px] rounded-br-[6px]' : 'self-start bg-[#e9e9eb] text-slate-900 rounded-[18px] rounded-bl-[6px]'} ${shown > i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>{m.text}</div>
                    {i === 3 && (
                      <div className={`shrink-0 self-start w-[78%] rounded-[18px] overflow-hidden border border-slate-200 bg-white transition-all duration-500 ${shown > i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        <img src="/milestones/first-date.webp" alt="" className="w-full h-24 object-cover" />
                        <div className="px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">{T.card.label}</p>
                          <p className="text-[13px] font-semibold text-slate-900">{T.card.title}</p>
                          <p className="text-[11px] text-slate-500">{T.card.when}</p>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {shown >= thread.length && <p className="self-end text-[10px] text-slate-400 pr-1">{T.delivered}</p>}
              </div>
              {/* The composer */}
              <div className="px-3 pb-6 pt-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#e9e9eb] flex items-center justify-center text-slate-500 text-lg" aria-hidden>+</span>
                <span className="flex-1 h-8 rounded-full border border-slate-200 px-3 flex items-center text-[13px] text-slate-400">{T.input}</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[12px] text-slate-400">{T.note}</p>
        </div>
      </div>
    </section>
  );
};

export default TextingDemo;
