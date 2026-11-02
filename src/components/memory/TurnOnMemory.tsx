// Turn on Memory, after Rollup's index options: what Memory is, what it may read (places and text on, faces off unless
// the person agrees to biometric grouping), the photos to add, then indexing with pause and resume.
import React, { useRef, useState } from 'react';
import { useI18n, useUi } from '../../i18n';
import strings from '../../i18n/ui/passport';
import type { IndexingState, MemoryEngine } from '../../lib/memory/types';
import { setMemoryConsent } from '../../lib/memory/consent';
import { Switch } from '../PrivacyCenter';
import { Emoji } from '../../lib/emoji3d';
import { card, btnDark, btnSoft, fillT } from './bits';

/** The file picker every Memory screen uses: the web can only read the photos the person picks. */
export const PickPhotos: React.FC<{ engine: MemoryEngine; label: string; className?: string; onPicked?: () => void }> = ({ engine, label, className = btnDark, onPicked }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*,video/*" multiple hidden onChange={e => { const f = e.target.files; if (f?.length) { void engine.addFiles(f); onPicked?.(); } e.target.value = ''; }} />
      <button type="button" className={className} onClick={() => ref.current?.click()}><Emoji e="📷" size={18} />{label}</button>
    </>
  );
};

/** Where indexing is: model download (with its size when the engine knows it), progress, pause and resume. */
export const IndexStatus: React.FC<{ engine: MemoryEngine; state: IndexingState }> = ({ engine, state }) => {
  const T = useUi(strings).onboarding;
  const { num } = useI18n();
  const mb = Math.round(Number((engine as any).modelDownloadBytes ?? 0) / 1e6);
  let line = '', sub = '', fraction: number | null = null, action: React.ReactNode = null;
  if (state.type === 'downloadingModels') { line = mb ? fillT(T.modelsSize, { mb: num(mb) }) : T.models; fraction = state.fraction; }
  else if (state.type === 'indexing') {
    const p = state.progress;
    line = T.steps[p.step]; fraction = p.total ? p.indexed / p.total : null;
    sub = [fillT(T.reading, { n: num(p.indexed), total: num(p.total) }), p.secondsLeft != null ? (p.secondsLeft < 60 ? T.leftSoon : fillT(T.left, { n: num(Math.ceil(p.secondsLeft / 60)) })) : ''].filter(Boolean).join('. ');
    action = <button type="button" className={btnSoft} onClick={() => engine.pause()}><Emoji e="⏸️" size={16} />{T.pause}</button>;
  } else if (state.type === 'paused') { line = fillT(T.paused, { n: num(state.summary.photos + state.summary.videos + state.summary.screenshots) }); action = <button type="button" className={btnDark} onClick={() => engine.resume()}>{T.resume}</button>; }
  else if (state.type === 'ready') { line = fillT(T.ready, { n: num(state.summary.photos + state.summary.videos + state.summary.screenshots) }); action = <PickPhotos engine={engine} label={T.addMore} className={btnSoft} />; }
  else if (state.type === 'unfinished') { line = fillT(T.unfinished, { reason: state.reason }); action = <button type="button" className={btnDark} onClick={() => engine.resume()}>{T.resume}</button>; }
  else if (state.type === 'failed') line = T.failed;
  return (
    <div>
      <div className="flex items-center justify-between gap-4 min-h-12">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 leading-snug">{line}</p>
          {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {fraction != null && <div className="mt-3 h-2 rounded-full bg-[#eaf2f5] overflow-hidden"><div className="h-full rounded-full bg-[#9bbecb] transition-[width] duration-500" style={{ width: `${Math.max(3, Math.min(100, fraction * 100))}%` }} /></div>}
      {state.type === 'indexing' && state.progress.searchable && <p className="mt-3 text-sm text-[#3f7486]">{T.searchable}</p>}
    </div>
  );
};

const TurnOnMemory: React.FC<{ engine: MemoryEngine | null; state: IndexingState | null }> = ({ engine, state }) => {
  const T = useUi(strings).onboarding;
  const [step, setStep] = useState<'intro' | 'options' | 'pick'>('intro');
  const [places, setPlaces] = useState(engine?.options.places ?? true);
  const [readText, setReadText] = useState(engine?.options.readText ?? true);
  const [people, setPeople] = useState(false);
  const [agree, setAgree] = useState(false);

  if (!engine) return (
    <div className={`${card} p-6 flex items-center gap-4`}><Emoji e="📷" size={34} className="shrink-0" /><p className="text-slate-600">{T.unsupported}</p></div>
  );
  if (state && state.type !== 'notStarted') return <div className={`${card} p-6`}><IndexStatus engine={engine} state={state} /></div>;

  const next = async () => {
    await engine.setOptions({ places, readText, people: people && agree });
    setMemoryConsent({ places, people: people && agree });
    setStep('pick');
  };
  const row = (emoji: string, title: string, body: string, on: boolean, set: (v: boolean) => void) => (
    <div className="flex items-center gap-4 py-3">
      <Emoji e={emoji} size={28} className="shrink-0" />
      <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 leading-snug">{title}</p><p className="text-sm text-slate-500 leading-relaxed mt-0.5">{body}</p></div>
      <Switch on={on} onChange={set} label={title} />
    </div>
  );

  return (
    <div className={`${card} p-6 sm:p-8`}>
      {step === 'intro' && <>
        <Emoji e="🧠" size={44} />
        <h2 className="font-serif text-2xl text-slate-900 mt-4">{T.title}</h2>
        <p className="text-[15px] text-slate-600 leading-relaxed mt-2 max-w-prose">{T.body}</p>
        <p className="flex items-center gap-2 text-sm font-semibold text-[#3f7486] mt-4"><Emoji e="🔒" size={16} />{T.private}</p>
        <button type="button" className={`${btnDark} mt-6`} onClick={() => setStep('options')}>{T.start}</button>
      </>}
      {step === 'options' && <>
        <h2 className="font-serif text-2xl text-slate-900">{T.options}</h2>
        <div className="mt-3">
          {row('📍', T.places, T.placesBody, places, setPlaces)}
          {row('📄', T.readText, T.readTextBody, readText, setReadText)}
          {row('🙂', T.people, T.peopleBody, people, v => { setPeople(v); if (!v) setAgree(false); })}
          {people && (
            <label className="flex items-center gap-3 ml-11 mt-1 mb-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="w-5 h-5 accent-slate-900 shrink-0" />
              <span>{T.peopleAgree}</span>
            </label>
          )}
        </div>
        <button type="button" className={`${btnDark} mt-5`} disabled={people && !agree} onClick={next}>{T.next}</button>
      </>}
      {step === 'pick' && <>
        <Emoji e="📷" size={44} />
        <h2 className="font-serif text-2xl text-slate-900 mt-4">{T.pick}</h2>
        <p className="text-[15px] text-slate-600 leading-relaxed mt-2 max-w-prose">{T.pickBody}</p>
        <div className="mt-6"><PickPhotos engine={engine} label={T.pick} /></div>
      </>}
    </div>
  );
};
export default TurnOnMemory;
