// Small pieces Our Afterglow and Belluh Memory share: photo thumbnails from the on-device index, the AI badge, a sheet,
// buttons and a segmented control. Solid colors, emoji icons, no circles behind icons.
import React, { useEffect, useId, useRef, useState } from 'react';
import type { MemoryEngine } from '../../lib/memory/types';
import { Emoji } from '../../lib/emoji3d';

export const BLUE = '#9bbecb';
export const PINK = '#f0addd';
export const card = 'rounded-[1.75rem] bg-white shadow-[0_18px_44px_-30px_rgba(15,23,42,0.4)]';
export const btnDark = 'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-slate-900 text-white text-[15px] font-semibold hover:bg-black disabled:opacity-40 transition-colors';
export const btnSoft = 'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-[#eaf2f5] text-slate-900 text-[15px] font-semibold hover:bg-[#dcebf1] disabled:opacity-40 transition-colors';
export const btnQuiet = 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors';

/** A photo from the index, as a small preview kept on the device. A soft square until it loads. */
export const Thumb: React.FC<{ engine: MemoryEngine | null | undefined; id: string; className?: string; alt?: string }> = ({ engine, id, className = 'w-12 h-12 rounded-xl', alt = '' }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true, made: string | null = null;
    engine?.thumbnail(id).then(b => { if (b && live) { made = URL.createObjectURL(b); setUrl(made); } }).catch(() => {});
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [engine, id]);
  return url ? <img src={url} alt={alt} className={`object-cover shrink-0 ${className}`} draggable={false} /> : <span aria-hidden className={`block shrink-0 bg-[#e3eef2] ${className}`} />;
};

/** Marks words written by AI (Rollup's guide asks apps to label them) */
export const AiBadge: React.FC<{ label: string; title?: string }> = ({ label, title }) => (
  <span title={title} className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#fde8f5] text-[#9d3f7a] text-xs font-bold leading-none">
    <Emoji e="✨" size={13} />{label}
  </span>
);

export function Segmented<T extends string>({ value, options, onChange, label, fill = false }: { value: T; options: { id: T; label: string; emoji?: string }[]; onChange: (v: T) => void; label: string; fill?: boolean }) {
  return (
    <div role="tablist" aria-label={label} className={`${fill ? 'flex w-full' : 'inline-flex'} items-center gap-0.5 sm:gap-1 p-1 rounded-full bg-[#eef4f7] overflow-x-auto no-scrollbar max-w-full`}>
      {options.map(o => (
        <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)}
          className={`${fill ? 'flex-1 justify-center px-2 sm:px-4' : 'shrink-0 px-4'} inline-flex items-center gap-1.5 h-9 rounded-full text-[13px] sm:text-sm font-semibold transition-colors whitespace-nowrap ${value === o.id ? 'bg-white text-slate-900 shadow-[0_4px_14px_-8px_rgba(15,23,42,0.35)]' : 'text-slate-500 hover:text-slate-800'}`}>
          {o.emoji && <Emoji e={o.emoji} size={16} />}{o.label}
        </button>
      ))}
    </div>
  );
}

/** A bottom sheet on phones, a centered card on laptops. Escape and the backdrop close it. */
export const Sheet: React.FC<{ title: string; onClose: () => void; closeLabel: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, onClose, closeLabel, children, footer }) => {
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); setTimeout(() => closeRef.current?.focus(), 0);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={id} className="w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-2">
          <h2 id={id} className="font-serif text-xl text-slate-900 leading-tight">{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={closeLabel} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 text-xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9bbecb]">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
        {footer && <div className="px-6 pt-3 pb-6">{footer}</div>}
      </div>
    </div>
  );
};

export const fillT = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
