// The one-minute film, after OpenAI's and Anthropic's launch films: one wide frame, the poster still until you choose
// to watch, then it plays with sound and its own controls. Nothing autoplays and nothing downloads until then.
import React, { useRef, useState } from 'react';
import { useUi } from '../i18n';
import strings from '../i18n/ui/film';

const BelluhFilm: React.FC = () => {
  const T = useUi(strings);
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const play = () => { setPlaying(true); requestAnimationFrame(() => { ref.current?.play().catch(() => {}); }); };
  return (
    <section className="relative z-10 px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-[2.1rem] md:text-[3.4rem] leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance]">{T.title}</h2>
          <p className="mt-5 text-[17px] md:text-lg text-slate-500 leading-relaxed [text-wrap:pretty]">{T.sub}</p>
        </div>
        <div className="mt-10 md:mt-14 relative w-full aspect-video rounded-[20px] md:rounded-[28px] overflow-hidden bg-[#fdfaf8] shadow-[0_40px_90px_-50px_rgba(15,23,42,0.55)]">
          {playing ? (
            <video ref={ref} src="/film/belluh-film.mp4" poster="/film/belluh-film-poster.jpg" controls playsInline preload="auto" aria-label={T.label} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <button type="button" onClick={play} aria-label={T.label} className="group absolute inset-0 w-full h-full">
              <img src="/film/belluh-film-poster.jpg" alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
              <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2.5 md:gap-3 whitespace-nowrap h-11 md:h-16 px-5 md:px-9 rounded-full bg-white/95 text-slate-900 text-[14px] md:text-[17px] font-bold shadow-xl group-hover:bg-white transition-colors">
                <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" className="shrink-0"><path d="M2 1.5v15l13-7.5z" fill="currentColor" /></svg>
                {T.watch}<span className="font-medium text-slate-400">{T.length}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default BelluhFilm;
