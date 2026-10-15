import React, { useEffect, useRef, useState } from 'react';
import { belluh } from '../lib/belluhPresence';

/**
 * Belluh saying something out loud: the words appear one by one and every word moves the water, so it reads as
 * talking. With reduced motion the whole line appears at once. Change `text` (or `id`) to say something new.
 */
const BelluhSpeech: React.FC<{ text: string; className?: string; delay?: number; pace?: number; onDone?: () => void }> = ({ text, className = '', delay = 0, pace = 1, onDone }) => {
  const words = text.split(/\s+/).filter(Boolean);
  const [shown, setShown] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* default motion */ }
    if (reduced) { setShown(words.length); done.current?.(); return; }
    setShown(0);
    let i = 0, stop: (() => void) | null = null, t: ReturnType<typeof setTimeout>;
    const next = () => {
      if (i >= words.length) { t = setTimeout(() => { stop?.(); stop = null; done.current?.(); }, 300); return; }
      const w = words[i++];
      belluh.word(w);
      setShown(i);
      t = setTimeout(next, (110 + Math.min(10, w.length) * 26 + (/[.,!?;:]$/.test(w) ? 220 : 0)) / pace);
    };
    t = setTimeout(() => { stop = belluh.talk(); next(); }, delay);
    return () => { clearTimeout(t); stop?.(); };
  }, [text]);
  return (
    <span className={className} aria-label={text}>
      {words.map((w, k) => (
        <React.Fragment key={k}>
          <span aria-hidden="true" className={`inline-block transition-all duration-300 ease-out ${k < shown ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-1 blur-[2px]'}`}>{w}</span>
          {k < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

export default BelluhSpeech;
