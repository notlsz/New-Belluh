// The language picker in the footers: your flag and language on a pill, and a list that opens above it with every
// language and its flag. A country that writes a language its own way shows its own flag (Mexico, Portugal, the UK).
import React, { useEffect, useRef, useState } from 'react';
import { useI18n, LANGS, type Lang } from '../i18n';

const FLAG: Record<Lang, string> = { en: 'us', ja: 'jp', fr: 'fr', it: 'it', pt: 'br', es: 'es', zh: 'cn', de: 'de', ko: 'kr' };
const flagFor = (lang: Lang, country?: string) =>
  lang === 'es' && country === 'MX' ? 'mx' : lang === 'pt' && country === 'PT' ? 'pt' : lang === 'en' && country === 'GB' ? 'gb' : FLAG[lang];
const Flag: React.FC<{ code: string }> = ({ code }) => <img src={`/flags/${code}.svg`} alt="" loading="lazy" className="w-[22px] h-[15px] rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />;

const LangPicker: React.FC<{ dark?: boolean; label: string }> = ({ dark, label }) => {
  const { lang, setLang, country } = useI18n() as ReturnType<typeof useI18n> & { country?: string };
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', off); window.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', off); window.removeEventListener('keydown', key); };
  }, [open]);
  const cur = LANGS.find(l => l.id === lang) ?? LANGS[0];
  return (
    <div ref={box} className="relative inline-block">
      <button type="button" onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${cur.name}`}
        className={`h-11 pl-3 pr-3.5 rounded-full inline-flex items-center gap-2.5 text-[14px] font-semibold transition-colors ${dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300'}`}>
        <Flag code={flagFor(lang, country)} />
        <span>{cur.name}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute bottom-full left-0 mb-2 z-50 w-[220px] max-h-[60vh] overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] border border-slate-100">
          {LANGS.map(l => (
            <li key={l.id} role="option" aria-selected={l.id === lang}>
              <button type="button" onClick={() => { setLang(l.id); setOpen(false); }}
                className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 text-left text-[15px] transition-colors ${l.id === lang ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}>
                <Flag code={flagFor(l.id, l.id === lang ? country : undefined)} />
                <span className="flex-1">{l.name}</span>
                {l.id === lang && <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LangPicker;
