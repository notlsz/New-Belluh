// The footer's mark, after ditto.ai: a text bubble from Bella over the wordmark. The bubble shows one real thing
// Bella does for a couple and changes on every visit (never the same line twice in a row).
import React, { useState } from 'react';
import { useUi } from '../i18n';
import bubble from '../i18n/ui/footerBubble';
import DragonflyMark from './DragonflyMark';
import { canStore } from '../lib/consent';
import { go } from '../lib/go';

const KEY = 'belluh_footer_line';

const pick = (n: number) => {
  let last = -1;
  try { last = Number(localStorage.getItem(KEY) ?? -1); } catch { /* storage off */ }
  let i = Math.floor(Math.random() * n);
  if (n > 1 && i === last) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
  try { if (canStore('preferences')) localStorage.setItem(KEY, String(i)); } catch { /* storage off */ }
  return i;
};

const FooterBubble: React.FC<{ dark?: boolean; label: string; onHome?: () => void }> = ({ dark = false, label, onHome }) => {
  const T = useUi(bubble);
  const [i] = useState(() => pick(T.lines.length));
  const line = T.lines[i % T.lines.length];
  const fill = dark ? '#ffffff' : '#0f172a';
  return (
    <div className="flex flex-col items-start">
      <p className={`relative max-w-[340px] rounded-[24px] px-5 py-3.5 font-sans text-[19px] md:text-[21px] leading-[1.28] tracking-[-0.005em] [text-wrap:pretty] ${dark ? 'bg-white text-[#0f172a]' : 'bg-[#0f172a] text-white'}`} aria-live="off">
        {line}
        <svg aria-hidden="true" viewBox="0 0 20 18" className="absolute -left-[7px] -bottom-[5px] w-[22px] h-[20px]"><path d="M14 0C14 7 11 13 1 17.5C9 17.5 15 15 20 10L20 0Z" fill={fill} /></svg>
      </p>
      <a href="/" onClick={e => { e.preventDefault(); if (onHome) onHome(); else go('/'); }} aria-label={label}
        className={`mt-6 inline-flex items-center gap-2 ${dark ? 'text-white' : 'text-[#0f172a]'}`}>
        <DragonflyMark size={34} rippleOnMount={false} />
        <span className="font-serif text-[40px] leading-none font-bold tracking-tight">Belluh</span>
      </a>
    </div>
  );
};

export default FooterBubble;
