// "For every first, and every 78th.", after America.gov: a big photo of a moment with an ask bar laid over it, typing
// out what you could ask Bella for that moment. Tap a moment to switch, type your own, and Bella takes it from there
// once you've signed up (the question waits for you inside the app).
import React, { useEffect, useRef, useState } from 'react';
import { Emoji } from '../lib/emoji3d';

const SHOTS = ['just-married', 'first-date', 'first-kiss', 'first-baby', '78th-trip', '30th-anniversary'];
export const PENDING_ASK = 'belluh_pending_ask';

const AskMoments: React.FC<{ title: string; lead: string; names: string[]; asks: string[]; onAsk: (text: string) => void }> = ({ title, lead, names, asks, onAsk }) => {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [mine, setMine] = useState('');
  const [hold, setHold] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Type the moment's question out, letter by letter, then move to the next moment unless they're busy with it
  useEffect(() => {
    const full = asks[i] ?? ''; setTyped('');
    let n = 0; const t = setInterval(() => { n += 1; setTyped(full.slice(0, n)); if (n >= full.length) clearInterval(t); }, 28);
    return () => clearInterval(t);
  }, [i, asks]);
  useEffect(() => {
    if (hold || mine) return;
    const t = setTimeout(() => setI(x => (x + 1) % SHOTS.length), 7000);
    return () => clearTimeout(t);
  }, [i, hold, mine]);

  const send = () => onAsk((mine.trim() || asks[i] || '').slice(0, 500));

  return (
    <section id="firsts" className="relative z-10 py-20 md:py-28 px-3 md:px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-4xl md:text-6xl font-serif font-semibold text-slate-900 tracking-tighter [text-wrap:balance] [word-break:auto-phrase]">{title}</h2>
        <div className="mt-10 md:mt-14 mx-auto w-full max-w-[520px] relative rounded-[2rem] overflow-hidden aspect-[928/1152] bg-slate-900 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.6)]"
          onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
          {SHOTS.map((k, n) => (
            <img key={k} src={`/milestones/${k}.webp`} alt={names[n]} loading={n ? 'lazy' : 'eager'}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${n === i ? 'opacity-100' : 'opacity-0'}`} />
          ))}
          {/* The ask bar, like America.gov's: white, roomy, the question typing itself, attach, voice, and a round go button */}
          <form onSubmit={e => { e.preventDefault(); send(); }} className="absolute inset-x-2 top-2 sm:inset-x-3 sm:top-3 md:inset-x-5 md:top-5">
            <div className="h-16 rounded-full bg-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.55)] flex items-center gap-1 md:gap-2 pl-4 sm:pl-5 md:pl-7 pr-1.5 md:pr-2.5">
              <span className="hidden shrink-0 text-[13px] font-bold text-[#3f7486] mr-1">{lead}</span>
              <input ref={input} value={mine} onChange={e => setMine(e.target.value)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}
                placeholder={typed} aria-label={lead}
                className="min-w-0 flex-1 bg-transparent text-[14px] sm:text-[15px] md:text-[16px] text-slate-800 placeholder:text-slate-500 focus:outline-none" />
              <span aria-hidden className="hidden sm:flex w-10 h-10 items-center justify-center"><Emoji e="📎" size={22} /></span>
              <button type="button" aria-label="🎙️" onClick={() => input.current?.focus()} className="hidden sm:flex w-10 h-10 items-center justify-center"><Emoji e="🎙️" size={22} /></button>
              <button type="submit" aria-label={lead} className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#5e9db3] hover:bg-[#4f8ea4] text-white flex items-center justify-center text-2xl font-bold">→&#xFE0E;</button>
            </div>
          </form>
        </div>
        {/* The moments: tap one to see it and its question */}
        <div className="mt-5 flex gap-2 overflow-x-auto md:justify-center pb-2 [scrollbar-width:none]">
          {names.map((n, k) => (
            <button key={n} type="button" onClick={() => { setI(k); setMine(''); }} aria-pressed={k === i}
              className={`shrink-0 h-11 pl-1.5 pr-4 rounded-full inline-flex items-center gap-2 text-[14px] font-bold transition-colors ${k === i ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}>
              <img src={`/milestones/${SHOTS[k]}.webp`} alt="" className="w-8 h-8 rounded-full object-cover" />{n}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AskMoments;
