// Memory settings: the index on this device, AI answers on or off (stops every call when off), places, text and faces,
// delete the index, reset Memory, delete the saved Afterglow. Each delete asks once more.
import React, { useState } from 'react';
import { useUi } from '../../i18n';
import strings from '../../i18n/ui/passport';
import type { IndexingState, MemoryEngine } from '../../lib/memory/types';
import { getMemoryConsent, setMemoryConsent } from '../../lib/memory/consent';
import { Switch } from '../PrivacyCenter';
import { Emoji } from '../../lib/emoji3d';
import { Sheet, btnSoft } from './bits';
import { IndexStatus } from './TurnOnMemory';
import { KeepAdding, RunReports } from './MemoryMore';
import moreStrings from '../../i18n/ui/memoryMore';

interface Props { engine: MemoryEngine | null; state: IndexingState | null; onClose: () => void; onDeletePassport: () => Promise<boolean> }

const MemorySettings: React.FC<Props> = ({ engine, state, onClose, onDeletePassport }) => {
  const T = useUi(strings);
  const S = T.settingsSheet, O = T.onboarding;
  const E = useUi(moreStrings).events;
  const [c, setC] = useState(getMemoryConsent);
  const [opts, setOpts] = useState(() => engine?.options ?? null);
  const [confirm, setConfirm] = useState<null | 'index' | 'reset' | 'passport'>(null);
  const [done, setDone] = useState<string | null>(null);
  // Faces are biometric: turning them on here asks for the same agreement as in Turn on Memory
  const [askFaces, setAskFaces] = useState(false);
  const set = (k: 'ai' | 'places' | 'people' | 'events', v: boolean) => setC(setMemoryConsent({ [k]: v }));
  const setOpt = async (k: 'places' | 'readText' | 'people' | 'events', v: boolean) => {
    if (!engine) return;
    // The event lookup needs places: turning places off turns it off too
    await engine.setOptions(k === 'places' && !v ? { places: false, events: false } : { [k]: v });
    setOpts({ ...engine.options });
    if (k !== 'readText') set(k, v);
    if (k === 'places' && !v) set('events', false);
  };

  const toggle = (emoji: string, title: string, body: string, on: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center gap-4 py-3">
      <Emoji e={emoji} size={26} className="shrink-0" />
      <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 leading-snug">{title}</p><p className="text-sm text-slate-500 leading-relaxed mt-0.5">{body}</p></div>
      <Switch on={on} onChange={onChange} label={title} />
    </div>
  );
  const danger = (id: 'index' | 'reset' | 'passport', emoji: string, title: string, body: string, run: () => Promise<unknown>) => (
    <div className="py-3">
      <div className="flex items-center gap-4">
        <Emoji e={emoji} size={26} className="shrink-0" />
        <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 leading-snug">{title}</p><p className="text-sm text-slate-500 leading-relaxed mt-0.5">{done === id ? S.deleted : body}</p></div>
        {confirm !== id && <button type="button" onClick={() => setConfirm(id)} className="shrink-0 h-10 px-4 rounded-full bg-[#fde8f5] text-[#9d3f7a] text-sm font-semibold">{S.yes}</button>}
      </div>
      {confirm === id && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-sm text-slate-500 mr-auto">{S.confirm}</span>
          <button type="button" onClick={() => setConfirm(null)} className="h-10 px-4 rounded-full text-sm font-semibold text-slate-500 hover:bg-slate-100">{S.cancel}</button>
          <button type="button" onClick={async () => { await run().catch(() => {}); setConfirm(null); setDone(id); }} className="h-10 px-4 rounded-full bg-[#9d3f7a] text-white text-sm font-semibold">{S.yes}</button>
        </div>
      )}
    </div>
  );

  return (
    <Sheet title={T.settings} onClose={onClose} closeLabel={S.close} footer={<button type="button" className={`w-full ${btnSoft}`} onClick={onClose}>{S.close}</button>}>
      {engine && state && state.type !== 'notStarted' && (
        <div className="rounded-2xl bg-[#f4f8fa] p-4 mb-2">
          <p className="text-xs font-bold text-slate-400 mb-2">{S.index}</p>
          <IndexStatus engine={engine} state={state} />
        </div>
      )}
      {toggle('✨', S.aiAnswers, S.aiAnswersBody, c.ai, v => set('ai', v))}
      {opts && toggle('📍', O.places, O.placesBody, opts.places, v => setOpt('places', v))}
      {opts && toggle('🎟️', E.lookup, opts.places ? E.lookupBody : `${E.lookupBody} ${E.needsPlaces}`, !!opts.events && opts.places, v => { if (opts.places || !v) void setOpt('events', v); })}
      {opts && toggle('📄', O.readText, O.readTextBody, opts.readText, v => setOpt('readText', v))}
      {opts && toggle('🙂', O.people, O.peopleBody, opts.people && c.people, v => { if (v) setAskFaces(true); else { setAskFaces(false); void setOpt('people', false); } })}
      {askFaces && (
        <label className="flex items-center gap-3 ml-[42px] mb-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={false} onChange={e => { if (e.target.checked) { setAskFaces(false); void setOpt('people', true); } }} className="w-5 h-5 accent-slate-900 shrink-0" />
          <span>{O.peopleAgree}</span>
        </label>
      )}
      <KeepAdding engine={engine} />
      <RunReports engine={engine} />
      {engine && danger('index', '🗑️', S.deleteIndex, S.deleteIndexBody, () => engine.deleteIndex().then(() => import('../../lib/memory/devicechat').then(m => m.clearCites())))}
      {engine && danger('reset', '🔄', S.reset, S.resetBody, () => engine.reset().then(() => import('../../lib/memory/devicechat').then(m => m.clearCites())))}
      {danger('passport', '🌅', S.deletePassport, S.deletePassportBody, onDeletePassport)}
    </Sheet>
  );
};
export default MemorySettings;
