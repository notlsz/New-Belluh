// Belluh Memory, after Rollup: Keep adding from a folder (desktop Chrome and Edge only), run reports with the choice to
// share them, the photos just indexed, and the Events block of the Timeline. Emoji icons, solid colors, aligned rows.
import React, { useCallback, useEffect, useState } from 'react';
import { useI18n, useUi } from '../../i18n';
import strings from '../../i18n/ui/memoryMore';
import type { MemoryEngine } from '../../lib/memory/types';
import type { RunReport } from '../../lib/memory/reports';
import type { EventRec } from '../../lib/memory/events';
import { getMemoryConsent, setMemoryConsent } from '../../lib/memory/consent';
import { canStore, openPrivacyCenter, CONSENT_EVENT } from '../../lib/consent';
import { Switch } from '../PrivacyCenter';
import { Emoji } from '../../lib/emoji3d';
import { Thumb, card, btnSoft, btnQuiet, fillT } from './bits';
import { folderSupported } from '../../lib/memory/folder';

const Text: React.FC<{ title: string; body?: React.ReactNode }> = ({ title, body }) => (
  <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 leading-snug">{title}</p>{body && <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{body}</p>}</div>
);

/** Keep adding: pick a folder once; new photos in it are read each time the person comes back. Null where unsupported. */
export const KeepAdding: React.FC<{ engine: MemoryEngine | null; supported?: boolean }> = ({ engine, supported }) => {
  const T = useUi(strings).keep;
  const { num } = useI18n();
  const [ok] = useState(() => supported ?? folderSupported());
  const [folder, setFolder] = useState<{ name: string; permission: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const f = await import('../../lib/memory/folder');
    const kept = await f.savedFolder();
    setFolder(kept ? { name: kept.state.name, permission: await f.permissionOf(kept.handle) } : null);
  }, []);
  useEffect(() => {
    if (!ok) return;
    void load();
    let off = () => {};
    import('../../lib/memory/keepAdding').then(m => { off = m.onFolderChange(() => void load()); });
    return () => off();
  }, [ok, load]);
  if (!ok || !engine) return null;

  const scan = async (interactive: boolean) => {
    setBusy(true); setNote(null);
    try {
      const m = await import('../../lib/memory/keepAdding');
      const r = await m.runKeepAdding({ interactive, force: true });
      if (r && r.permission === 'granted') setNote(r.added ? fillT(T.added, { n: num(r.added) }) : T.none);
    } finally { setBusy(false); void load(); }
  };
  const choose = async () => {
    const f = await import('../../lib/memory/folder');
    const name = await f.chooseFolder();
    if (!name) return;
    const { setMemoryEnabled } = await import('../../lib/memory');
    setMemoryEnabled(true);
    void (await import('../../lib/memory/keepAdding')).startKeepAdding();
    await scan(true);
  };
  const stop = async () => { await (await import('../../lib/memory/folder')).forgetFolder(); setNote(null); void load(); };

  const btn = `${btnSoft} h-10 px-4 text-sm`;
  return (
    <div className="py-3">
      <div className="flex items-center gap-4">
        <Emoji e="🖼️" size={26} className="shrink-0" />
        <Text title={T.title} body={note ?? (!folder ? T.body : folder.permission === 'granted' ? fillT(T.on, { name: folder.name }) : fillT(T.allowBody, { name: folder.name }))} />
      </div>
      <div className="mt-3 ml-[42px] flex flex-wrap items-center gap-2">
        {!folder && <button type="button" className={btn} onClick={choose}>{T.choose}</button>}
        {folder && folder.permission !== 'granted' && <button type="button" className={btn} disabled={busy} onClick={() => scan(true)}>{T.allow}</button>}
        {folder && folder.permission === 'granted' && <button type="button" className={btn} disabled={busy} onClick={() => scan(true)}>{T.now}</button>}
        {folder && <button type="button" className={btnQuiet} onClick={stop}>{T.stop}</button>}
      </div>
    </div>
  );
};

const mins = (s: number) => s >= 90;
/** The last runs on this device, counts and timings only, and the switch to share them */
export const RunReports: React.FC<{ engine: MemoryEngine | null }> = ({ engine }) => {
  const T = useUi(strings).reports;
  const { num, date } = useI18n();
  const [list, setList] = useState<RunReport[] | null>(null);
  const [share, setShare] = useState(() => getMemoryConsent().diagnostics);
  const [usage, setUsage] = useState(() => canStore('usage'));
  useEffect(() => { void engine?.reports?.().then(setList).catch(() => setList([])); }, [engine]);
  useEffect(() => { const f = () => setUsage(canStore('usage')); window.addEventListener(CONSENT_EVENT, f); return () => window.removeEventListener(CONSENT_EVENT, f); }, []);
  if (!engine?.reports) return null;
  const time = (s: number) => mins(s) ? fillT(T.minutes, { n: num(Math.round(s / 60)) }) : fillT(T.seconds, { n: num(Math.max(1, Math.round(s))) });
  return (
    <div className="py-3">
      <div className="flex items-center gap-4">
        <Emoji e="📊" size={26} className="shrink-0" />
        <Text title={T.title} body={T.body} />
      </div>
      <div className="mt-3 ml-[42px] flex flex-col gap-2">
        {list && !list.length && <p className="text-sm text-slate-400">{T.none}</p>}
        {(list ?? []).slice(0, 5).map((r, i) => (
          <div key={`${r.at}${i}`} className="rounded-2xl bg-[#f4f8fa] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">{date(new Date(`${r.at}:00Z`), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              <span className="text-sm text-slate-500">{fillT(T.time, { time: time(r.seconds), outcome: T.outcomes[r.outcome] })}</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{fillT(T.line, { read: num(r.read), skipped: num(r.skipped), located: num(r.located), labels: num(r.labels) })}</p>
            {r.modelMB > 0 && <p className="text-sm text-slate-500 mt-0.5">{fillT(T.models, { mb: num(r.modelMB) })}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4">
        <Emoji e="📤" size={26} className="shrink-0" />
        <Text title={T.share} body={<>{T.shareBody}{!usage && <> {T.needsUsage} <button type="button" onClick={openPrivacyCenter} className="font-semibold text-[#3f7486] hover:underline">{T.privacy}</button></>}</>} />
        <Switch on={share && usage} disabled={!usage} label={T.share} onChange={v => { setMemoryConsent({ diagnostics: v }); setShare(v); }} />
      </div>
    </div>
  );
};

/** The photos that just became searchable, as they are indexed (Rollup's IndexedBatch) */
export const JustIndexed: React.FC<{ engine: MemoryEngine }> = ({ engine }) => {
  const T = useUi(strings);
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => engine.onBatch?.(b => setIds(prev => [...b.ids, ...prev].slice(0, 8))) ?? undefined, [engine]);
  if (!ids.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-slate-400 mb-2">{T.justIndexed}</p>
      <div className="flex items-center gap-2 overflow-hidden">{ids.map(id => <Thumb key={id} engine={engine} id={id} className="w-11 h-11 rounded-xl" />)}</div>
    </div>
  );
};

/** The Timeline's Events: concerts, games, shows, festivals and races found on this device, and tickets to come */
export const EventsBlock: React.FC<{ engine: MemoryEngine }> = ({ engine }) => {
  const T = useUi(strings).events;
  const { date } = useI18n();
  const [list, setList] = useState<EventRec[] | null>(null);
  useEffect(() => { void engine.events?.().then(setList).catch(() => setList([])); }, [engine]);
  if (!engine.events || !list) return null;
  const past = list.filter(e => !e.upcoming), soon = list.filter(e => e.upcoming).reverse();
  const day = (d: string) => date(new Date(`${d}T12:00:00`), { month: 'short', day: 'numeric', year: 'numeric' });
  const EMOJI: Record<string, string> = { concert: '🎵', festival: '🎉', game: '🏟️', show: '🎭', race: '🏆' };
  const row = (e: EventRec) => (
    <div key={e.key} className="flex items-center gap-3 min-h-[56px]">
      {e.ids[0] ? <Thumb engine={engine} id={e.ids[0]} className="w-11 h-11 rounded-xl" /> : <span className="w-11 shrink-0 flex justify-center"><Emoji e={EMOJI[e.kind]} size={24} /></span>}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-slate-800 leading-snug truncate">{e.name ?? T.one[e.kind]}{e.venue ? `, ${e.venue}` : ''}</p>
        <p className="text-sm text-slate-500">{[day(e.day), e.name ? T.one[e.kind] : null, e.genre].filter(Boolean).join(', ')}</p>
      </div>
    </div>
  );
  return (
    <div className={`${card} p-5 sm:p-6`}>
      <h3 className="flex items-center gap-2 font-serif text-lg text-slate-900"><Emoji e="🎟️" size={22} />{T.title}</h3>
      {!past.length && !soon.length && <p className="mt-3 text-[15px] text-slate-400">{T.none}</p>}
      <div className="mt-2 flex flex-col">{past.slice(0, 24).map(row)}</div>
      {soon.length > 0 && <>
        <p className="mt-4 text-xs font-bold text-slate-400">{T.upcoming}</p>
        <div className="mt-1 flex flex-col">{soon.slice(0, 6).map(row)}</div>
      </>}
    </div>
  );
};
