import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import DragonflyMark from './DragonflyMark';
import LegalModal from './LegalModal';
import { useUi } from '../i18n';
import strings from '../i18n/ui/privacyCenter';
import { getConsent, setConsent, honorsGpc, loadFromAccount, openPrivacyCenter, PRIVACY_CENTER_EVENT, type Choices } from '../lib/consent';
import { go } from '../lib/go';

export { openPrivacyCenter };

/** Opens the Privacy Preference Center; for buttons and footer links ("Your privacy choices"). */
export function usePrivacyCenter(): () => void {
  return useCallback(() => openPrivacyCenter(), []);
}

export const Switch: React.FC<{ on: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean }> = ({ on, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange?.(!on)}
    className={`shrink-0 w-12 h-7 rounded-full relative transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${on ? 'bg-slate-900' : 'bg-slate-200'}`}>
    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
  </button>
);

type RowId = 'necessary' | 'preferences' | 'usage' | 'sale';

interface Props {
  /** Show the Privacy Policy your own way; without it the center opens the policy itself. */
  onShowPolicy?: () => void;
}

/**
 * The Privacy Preference Center: what Belluh keeps, what you can turn off, and the US "sale or sharing" opt out.
 * Mount once near the root; it opens whenever window receives 'belluh:privacy-center' (see openPrivacyCenter).
 */
const PrivacyCenter: React.FC<Props> = ({ onShowPolicy }) => {
  const T = useUi(strings);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [policy, setPolicy] = useState(false);
  const [draft, setDraft] = useState<Choices>(() => { const c = getConsent(); return { preferences: c.preferences, usage: c.usage, saleOptOut: c.saleOptOut }; });
  const [expanded, setExpanded] = useState<RowId | null>(null);
  const [saved, setSaved] = useState(false);
  const gpc = honorsGpc();
  const closeBtn = useRef<HTMLButtonElement>(null);

  const sync = () => { const c = getConsent(); setDraft({ preferences: c.preferences, usage: c.usage, saleOptOut: c.saleOptOut }); };

  useEffect(() => {
    const show = () => { sync(); setSaved(false); setExpanded(null); setOpen(true); loadFromAccount().then(c => { if (c) sync(); }); };
    window.addEventListener(PRIVACY_CENTER_EVENT, show);
    return () => window.removeEventListener(PRIVACY_CENTER_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    setTimeout(() => closeBtn.current?.focus(), 0);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const save = (choices: Choices) => {
    setConsent(choices, 'center');
    setDraft({ ...choices, saleOptOut: gpc ? true : choices.saleOptOut });
    setSaved(true);
    setTimeout(() => setOpen(false), 700);
  };

  const showPolicy = () => { if (onShowPolicy) { setOpen(false); onShowPolicy(); } else setPolicy(true); };

  if (policy) return <LegalModal type="privacy" onClose={() => setPolicy(false)} />;
  if (!open) return null;

  const rows: { id: RowId; title: string; body: string; right: React.ReactNode; note?: string }[] = [
    { id: 'necessary', title: T.necessaryTitle, body: T.necessaryBody, right: <span className="text-sm font-semibold text-[#2f6578] whitespace-nowrap">{T.alwaysOn}</span> },
    { id: 'preferences', title: T.preferencesTitle, body: T.preferencesBody, right: <Switch on={draft.preferences} label={T.preferencesTitle} onChange={v => setDraft(d => ({ ...d, preferences: v }))} /> },
    { id: 'usage', title: T.usageTitle, body: T.usageBody, right: <Switch on={draft.usage} label={T.usageTitle} onChange={v => setDraft(d => ({ ...d, usage: v }))} /> },
    { id: 'sale', title: T.saleTitle, body: T.saleBody, note: gpc ? T.gpc : undefined,
      right: <Switch on={!draft.saleOptOut} label={T.saleTitle} disabled={gpc} onChange={v => setDraft(d => ({ ...d, saleOptOut: !v }))} /> },
  ];

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-[2px] p-0 sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <span className="flex items-center gap-2">
            <DragonflyMark size={28} rippleOnMount={false} />
            <span className="font-serif text-xl text-slate-900 leading-none">Belluh</span>
          </span>
          <button ref={closeBtn} type="button" onClick={() => setOpen(false)} aria-label={T.close}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <h2 id={titleId} className="font-serif text-2xl text-slate-900 mt-1">{T.title}</h2>
          <p className="text-[15px] text-slate-600 leading-relaxed mt-3">{T.intro}</p>
          <p className="text-[15px] text-slate-600 leading-relaxed mt-3">{T.noAds}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
            <button type="button" onClick={showPolicy} className="text-[#2f6578] underline underline-offset-4 decoration-[#9bbecb] hover:text-slate-900">{T.policyLink}</button>
            <button type="button" onClick={() => { setOpen(false); go('/cookies'); }} className="text-[#2f6578] underline underline-offset-4 decoration-[#9bbecb] hover:text-slate-900">{T.cookiesLink}</button>
          </p>

          <h3 className="font-serif text-lg text-slate-900 mt-7 mb-2">{T.manage}</h3>
          <div className="rounded-2xl bg-[#F8FAFB]">
            {rows.map(r => {
              const isOpen = expanded === r.id;
              const bodyId = `${titleId}-${r.id}`;
              return (
                <div key={r.id} className="px-4">
                  <div className="flex items-center gap-3 min-h-[60px]">
                    <button type="button" onClick={() => setExpanded(isOpen ? null : r.id)} aria-expanded={isOpen} aria-controls={bodyId}
                      className="flex-1 min-w-0 flex items-center gap-3 py-3 text-left">
                      <Plus size={18} className={`shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
                      <span className="font-medium text-slate-900 leading-snug">{r.title}</span>
                    </button>
                    {r.right}
                  </div>
                  {r.note && <p className="pl-[30px] -mt-1 pb-3 text-sm font-semibold text-[#2f6578]">{r.note}</p>}
                  {isOpen && <p id={bodyId} className="pl-[30px] pb-4 text-sm text-slate-600 leading-relaxed">{r.body}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pt-3 pb-6 flex items-center gap-3">
          <button type="button" onClick={() => save({ preferences: false, usage: false, saleOptOut: true })}
            className="flex-1 h-12 rounded-full border border-slate-300 text-slate-900 font-semibold hover:bg-slate-50 transition-colors">
            {T.rejectAll}
          </button>
          <button type="button" onClick={() => save(draft)}
            className="flex-1 h-12 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors">
            {saved ? T.saved : T.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyCenter;
