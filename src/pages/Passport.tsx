// Our Locket (first called Our Passport): Rollup Passport for a couple. Tabs: You (your page, filled by profile() from your photos, every line
// editable or removable, the photos behind each line), Us (both approved passports, only what each shares), Timeline
// (trips and months, read on this device), Sharing (partner and Bella per section, a file, a text for ChatGPT or
// Claude, a QR code) and Activity (when Bella or your partner used it). Above them: Ask your photos and Search.
// Only approved words are saved to Belluh; photos and the index stay on this device.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n, useUi } from '../i18n';
import strings from '../i18n/ui/passport';
import type { IndexingState, MemoryEngine } from '../lib/memory/types';
import { createMemoryAgent, type Transport } from '../lib/memory/agent';
import { aiAllowed } from '../lib/memory/consent';
import { loadEngine } from '../lib/memory/engineRef';
import {
  PASSPORT_SCHEMA, SECTION_KEYS, SECTION_EMOJI, draftFromProfile, draftFromStored, storedFromDraft, evidenceMap, mergePassports,
  toMarkdown, toJson, forAssistant, type PassportDraft, type SectionKey, type StoredPassport, type SharedPassport,
} from '../lib/memory/passport';
import { qrMatrix, qrPath } from '../lib/qr';
import { Emoji } from '../lib/emoji3d';
import { Switch } from '../components/PrivacyCenter';
import MemoryConsent from '../components/memory/MemoryConsent';
import TurnOnMemory from '../components/memory/TurnOnMemory';
import AskPhotos from '../components/memory/AskPhotos';
import MemorySettings from '../components/memory/MemorySettings';
import { AiBadge, Segmented, Thumb, card, btnDark, btnSoft, btnQuiet, fillT } from '../components/memory/bits';
import type { PassportActivity } from '../services/passportStore';

export interface PassportStoreLike {
  mine(): Promise<StoredPassport | null>;
  save(p: StoredPassport): Promise<boolean>;
  remove(): Promise<boolean>;
  partner(): Promise<SharedPassport | null>;
  activity(): Promise<PassportActivity[]>;
  photos(): Record<string, string[]>;
  setPhotos(m: Record<string, string[]>): void;
}

interface Props {
  userName: string;
  partnerName: string | null;
  hasPartner: boolean;
  /** For tests and the dev harness; the app uses the real ones */
  store?: PassportStoreLike;
  transport?: Transport;
  engineLoader?: () => Promise<MemoryEngine | null>;
  initialTab?: Tab;
}
type Tab = 'you' | 'us' | 'timeline' | 'sharing' | 'activity';
const notReady: Transport = async function* () { yield { type: 'error', code: 'agent_unavailable', message: 'Loading' }; };
const NO_SHARE = () => Object.fromEntries(SECTION_KEYS.map(k => [k, false])) as Record<SectionKey, boolean>;

const Passport: React.FC<Props> = ({ userName, partnerName, hasPartner, store: storeIn, transport: transportIn, engineLoader = loadEngine, initialTab = 'you' }) => {
  const T = useUi(strings);
  const { lang, date } = useI18n();
  const [store, setStore] = useState<PassportStoreLike | null>(storeIn ?? null);
  const [transport, setTransport] = useState<Transport | null>(() => transportIn ?? null);
  useEffect(() => {
    if (!storeIn) import('../services/passportStore').then(m => setStore(m.passportStore));
    if (!transportIn) import('../lib/memory/transport').then(m => setTransport(() => m.httpTransport));
  }, [storeIn, transportIn]);

  const [engine, setEngine] = useState<MemoryEngine | null | undefined>(undefined);
  const [state, setState] = useState<IndexingState | null>(null);
  useEffect(() => {
    let off = () => {};
    engineLoader().then(e => { setEngine(e); if (e) { setState(e.state()); off = e.onState(setState); } });
    return () => off();
  }, [engineLoader]);
  const searchable = !!state && (state.type === 'ready' || state.type === 'paused' || state.type === 'unfinished' || (state.type === 'indexing' && state.progress.searchable));

  const agent = useMemo(() => createMemoryAgent({
    engine: async () => engine ?? null,
    transport: (b, s) => (transport ?? notReady)(b, s),
    allowed: aiAllowed, lang, progress: T.progress,
  }), [engine, transport, lang, T.progress]);

  // Permission first, every time it matters (Rollup: before the first query or profile, and never once it's off)
  const [consentFor, setConsentFor] = useState<(() => void) | null>(null);
  const withConsent = useCallback((fn: () => void) => { if (aiAllowed()) fn(); else setConsentFor(() => fn); }, []);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [stored, setStored] = useState<StoredPassport | null>(null);
  const [draft, setDraft] = useState<PassportDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [partner, setPartner] = useState<SharedPassport | null>(null);
  const [activity, setActivity] = useState<PassportActivity[] | null>(null);
  const [making, setMaking] = useState<string[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    if (!store) return;
    store.mine().then(s => { setStored(s); if (s) setDraft(draftFromStored(s, store.photos())); });
    if (hasPartner) store.partner().then(setPartner);
  }, [store, hasPartner]);
  useEffect(() => { if (tab === 'activity' && store) store.activity().then(setActivity); }, [tab, store]);

  const make = () => withConsent(async () => {
    setMaking([]); setNote(null);
    try {
      const p = await agent.profile(PASSPORT_SCHEMA, { onProgress: l => setMaking(m => [...(m ?? []), l]) });
      setDraft(draftFromProfile(p)); setDirty(true);
    } catch (e: any) {
      setNote(e?.code === 'rateLimited' ? T.ask.rate : e?.code === 'network' ? T.ask.offline : e?.code === 'notStarted' || e?.code === 'noIndex' ? T.ask.notReady : T.ask.error);
    } finally { setMaking(null); }
  });

  const shares = { share_partner: stored?.share_partner ?? NO_SHARE(), share_bella: stored?.share_bella ?? NO_SHARE() };
  const save = async (d = draft, s = shares) => {
    if (!d || !store) return;
    const next = storedFromDraft(d, s);
    const ok = await store.save(next);
    if (ok) { setStored(next); setDirty(false); store.setPhotos(evidenceMap(d)); setNote(T.saved); setTimeout(() => setNote(n => (n === T.saved ? null : n)), 1600); }
    else setNote(T.saveFailed);
  };
  const setShare = (who: 'share_partner' | 'share_bella', k: SectionKey, v: boolean) => {
    if (!stored || !draft) return;
    const s = { ...shares, [who]: { ...shares[who], [k]: v } };
    setStored({ ...stored, ...s });
    void save(draft, s);
  };
  const editLine = (k: SectionKey, id: string, text: string | null) => {
    if (!draft) return;
    setDraft({ ...draft, sections: { ...draft.sections, [k]: text === null ? draft.sections[k].filter(l => l.id !== id) : draft.sections[k].map(l => (l.id === id ? { ...l, text } : l)) } });
    setDirty(true);
  };

  const pName = partnerName || T.sharing.partnerFallback;
  const sectionNames = (keys: string[]) => keys.filter(k => (SECTION_KEYS as readonly string[]).includes(k)).map(k => T.sections[k as SectionKey]).join(', ');
  const labels = { heading: T.export.heading, sections: T.sections, footer: T.export.footer, aiIntro: T.export.aiIntro };
  const download = (name: string, type: string, body: string) => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (!stored) return; try { await navigator.clipboard.writeText(forAssistant(stored, userName, labels)); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ } };
  const qr = useMemo(() => { const m = qrMatrix(`${typeof location !== 'undefined' ? location.origin : 'https://belluh.com'}/locket`); return m ? qrPath(m) : null; }, []);

  const hasLines = !!draft && SECTION_KEYS.some(k => draft.sections[k].length);
  const memoryOn = engine !== undefined && !!engine && !!state && state.type !== 'notStarted';

  // ---------- the Locket card ----------
  const passportCard = draft && (hasLines || draft.title) && (
    <article className={`${card} overflow-hidden`}>
      <div className="bg-[#9bbecb] px-6 pt-6 pb-5 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-white/90 text-xs font-bold tracking-wide uppercase"><Emoji e="📘" size={16} />{T.cardLabel}</span>
          <AiBadge label={T.aiShort} title={T.ai} />
        </div>
        <h2 className="font-serif text-[28px] sm:text-[34px] leading-tight text-white mt-4">{userName}</h2>
        {editing === 'title'
          ? <input autoFocus aria-label={T.titleLabel} value={draft.title} maxLength={120} onChange={e => { setDraft({ ...draft, title: e.target.value }); setDirty(true); }} onBlur={() => setEditing(null)} onKeyDown={e => { if (e.key === 'Enter') setEditing(null); }}
              className="mt-2 w-full bg-white/20 rounded-xl px-3 py-2 font-serif italic text-[17px] text-white placeholder:text-white/60 focus:outline-none" />
          : <button type="button" onClick={() => setEditing('title')} className="mt-1 text-left font-serif italic text-[17px] text-white/95 hover:underline decoration-white/50 underline-offset-4">{draft.title || T.titleLabel}</button>}
        <p className="text-white/80 text-sm mt-3">{fillT(T.issued, { date: date(new Date(stored?.updated_at ?? Date.now()), { day: 'numeric', month: 'short', year: 'numeric' }) })}</p>
      </div>
      <div className="px-6 py-5 sm:px-8 flex flex-col gap-6">
        {SECTION_KEYS.map(k => (
          <section key={k}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400"><Emoji e={SECTION_EMOJI[k]} size={18} />{T.sections[k]}</h3>
            {draft.sections[k].length === 0 && <p className="mt-2 text-[15px] text-slate-300">{T.nothingIn}</p>}
            <div className="mt-1 flex flex-col">
              {draft.sections[k].map(l => (
                <div key={l.id} className="group flex items-center gap-3 min-h-[52px] py-1.5">
                  {editing === l.id
                    ? <input autoFocus aria-label={fillT(T.lineLabel, { section: T.sections[k] })} value={l.text} maxLength={160} onChange={e => editLine(k, l.id, e.target.value)} onBlur={() => setEditing(null)} onKeyDown={e => { if (e.key === 'Enter') setEditing(null); }}
                        className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-[#f4f8fa] text-[16px] text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#cfe3ea]" />
                    : <button type="button" onClick={() => setEditing(l.id)} title={T.edit} className="flex-1 min-w-0 text-left text-[16px] text-slate-800 leading-snug hover:text-slate-950">{l.text}</button>}
                  {l.evidence.length > 0 && (
                    <span className="flex items-center -space-x-3 shrink-0" title={T.photosBehind} aria-label={T.photosBehind}>
                      {l.evidence.slice(0, 3).map(id => <Thumb key={id} engine={engine} id={id} className="w-10 h-10 rounded-xl ring-2 ring-white" />)}
                    </span>
                  )}
                  <button type="button" onClick={() => editLine(k, l.id, null)} aria-label={`${T.remove}: ${l.text}`} title={T.remove}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-slate-300 hover:text-[#9d3f7a] hover:bg-[#fde8f5] text-base leading-none">✕</button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );

  const youTab = (
    <div className="flex flex-col gap-4">
      {making ? (
        <div className={`${card} p-6`} aria-live="polite">
          <p className="font-serif text-xl text-slate-900">{T.making}</p>
          <p className="flex items-center gap-2 mt-3 text-[15px] text-slate-500"><Emoji e="⏳" size={16} className="animate-pulse" />{making[making.length - 1] ?? T.progress.thinking}</p>
        </div>
      ) : passportCard ? (
        <>
          {passportCard}
          {dirty && <p className="text-sm text-slate-500 px-2">{T.unsaved}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {dirty && <button type="button" className={btnDark} onClick={() => save()}>{T.save}</button>}
            <button type="button" className={btnSoft} disabled={!searchable} onClick={make}><Emoji e="🔄" size={16} />{T.regenerate}</button>
          </div>
        </>
      ) : (
        <div className={`${card} p-6 sm:p-8`}>
          <Emoji e="📘" size={44} />
          <h2 className="font-serif text-2xl text-slate-900 mt-4">{T.empty.title}</h2>
          <p className="text-[15px] text-slate-600 leading-relaxed mt-2 max-w-prose">{T.empty.body}</p>
          <button type="button" className={`${btnDark} mt-6`} disabled={!searchable} onClick={make}>{T.empty.make}</button>
        </div>
      )}
      {note && <p role="status" className="text-sm font-semibold text-[#3f7486] px-2">{note}</p>}
    </div>
  );

  const merged = useMemo(() => mergePassports(stored, partner), [stored, partner]);
  const usTab = !hasPartner ? <Empty emoji="💞" text={T.us.noPartner} /> : !Object.keys(merged.sections).length ? <Empty emoji="💞" text={fillT(T.us.none, { name: pName })} /> : (
    <article className={`${card} p-6 sm:p-8`}>
      <p className="text-xs font-bold text-slate-400">{T.us.sharedBy}</p>
      {merged.title && <h2 className="font-serif italic text-[22px] text-slate-900 mt-2">{merged.title}</h2>}
      <div className="mt-5 flex flex-col gap-6">
        {SECTION_KEYS.filter(k => merged.sections[k]).map(k => (
          <section key={k}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400"><Emoji e={SECTION_EMOJI[k]} size={18} />{T.sections[k]}</h3>
            {merged.sections[k]!.map(l => (
              <div key={l.text} className="flex items-center justify-between gap-3 min-h-[44px]">
                <span className="text-[16px] text-slate-800 leading-snug">{l.text}</span>
                <span className={`shrink-0 h-7 px-3 inline-flex items-center rounded-full text-xs font-bold ${l.who === 'both' ? 'bg-[#fde8f5] text-[#9d3f7a]' : l.who === 'me' ? 'bg-[#e3eef2] text-[#3f7486]' : 'bg-[#f1f5f9] text-slate-600'}`}>
                  {l.who === 'both' ? T.us.both : l.who === 'me' ? T.us.you : pName}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </article>
  );

  const sharingTab = !stored ? <Empty emoji="📘" text={T.sharing.needSave} /> : (
    <div className="flex flex-col gap-4">
      <div className={`${card} p-5 sm:p-6`}>
        <p className="text-[15px] text-slate-600 leading-relaxed">{fillT(T.sharing.intro, { name: pName })}</p>
        <div className="mt-4 flex items-center gap-3 min-h-8">
          <span className="flex-1" />
          <span className="w-14 text-center text-xs font-bold text-slate-400 truncate">{hasPartner ? pName : T.sharing.partnerFallback}</span>
          <span className="w-14 text-center text-xs font-bold text-slate-400">{T.sharing.bella}</span>
        </div>
        {SECTION_KEYS.map(k => (
          <div key={k} className="flex items-center gap-3 min-h-[52px]">
            <Emoji e={SECTION_EMOJI[k]} size={22} className="shrink-0" />
            <span className="flex-1 min-w-0 font-semibold text-slate-900">{T.sections[k]}</span>
            <span className="w-14 flex justify-center"><Switch on={!!shares.share_partner[k]} label={`${T.sections[k]}: ${pName}`} onChange={v => setShare('share_partner', k, v)} /></span>
            <span className="w-14 flex justify-center"><Switch on={!!shares.share_bella[k]} label={`${T.sections[k]}: ${T.sharing.bella}`} onChange={v => setShare('share_bella', k, v)} /></span>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`${card} p-5 sm:p-6 flex flex-col`}>
          <h3 className="flex items-center gap-2 font-serif text-lg text-slate-900"><Emoji e="📤" size={22} />{T.sharing.anywhere}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mt-1 flex-1">{T.sharing.anywhereBody}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className={btnSoft} onClick={() => download('belluh-locket.md', 'text/markdown', toMarkdown(stored, userName, labels))}>{T.sharing.markdown}</button>
            <button type="button" className={btnSoft} onClick={() => download('belluh-locket.json', 'application/json', toJson(stored, userName))}>{T.sharing.json}</button>
          </div>
        </div>
        <div className={`${card} p-5 sm:p-6 flex flex-col`}>
          <h3 className="flex items-center gap-2 font-serif text-lg text-slate-900"><Emoji e="💬" size={22} />{T.sharing.assistants}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mt-1 flex-1">{T.sharing.assistantsBody}</p>
          <div className="mt-4"><button type="button" className={btnSoft} onClick={copy}>{copied ? T.sharing.copied : T.sharing.copy}</button></div>
        </div>
      </div>
      {qr && (
        <div className={`${card} p-5 sm:p-6 flex items-center gap-5`}>
          <svg viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label={T.sharing.qrLabel} className="w-32 h-32 shrink-0 rounded-xl bg-white" shapeRendering="crispEdges"><path d={qr.d} fill="#0f172a" /></svg>
          <div className="min-w-0">
            <h3 className="font-serif text-lg text-slate-900">{T.sharing.qr}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mt-1">{fillT(T.sharing.qrBody, { name: pName })}</p>
          </div>
        </div>
      )}
    </div>
  );

  const activityTab = (
    <div className={`${card} p-5 sm:p-6`}>
      <p className="text-sm text-slate-500">{fillT(T.activity.intro, { name: pName })}</p>
      {activity && !activity.length && <p className="mt-4 text-[15px] text-slate-400">{T.activity.none}</p>}
      <div className="mt-3 flex flex-col">
        {(activity ?? []).map(a => (
          <div key={a.id} className="flex items-center gap-3 min-h-[56px]">
            <Emoji e={a.actor === 'bella' ? '✨' : '💞'} size={24} className="shrink-0" />
            <span className="flex-1 min-w-0 text-[15px] text-slate-800 leading-snug">{fillT(a.actor === 'bella' ? T.activity.bella : T.activity.partner, { name: pName, sections: sectionNames(a.sections) })}</span>
            <span className="shrink-0 text-sm text-slate-400">{date(new Date(a.created_at), { month: 'short', day: 'numeric' })}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-36 lg:pt-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-[30px] sm:text-[36px] leading-tight text-slate-900">{T.title}</h1>
        <button type="button" onClick={() => setSettings(true)} aria-label={T.settings} title={T.settings} className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full hover:bg-white"><Emoji e="⚙️" size={24} /></button>
      </header>
      <p className="text-[15px] text-slate-500 leading-relaxed mt-2 max-w-prose">{T.sub}</p>

      <div className="mt-6 flex flex-col gap-4">
        {engine !== undefined && !memoryOn && <TurnOnMemory engine={engine} state={state} />}
        {memoryOn && <AskPhotos engine={engine!} searchable={searchable} agent={agent} withConsent={withConsent} />}
      </div>

      <div className="mt-8"><Segmented<Tab> fill label={T.title} value={tab} onChange={setTab} options={[
        { id: 'you', label: T.tabs.you }, { id: 'us', label: T.tabs.us }, { id: 'timeline', label: T.tabs.timeline }, { id: 'sharing', label: T.tabs.sharing }, { id: 'activity', label: T.tabs.activity },
      ]} /></div>
      <div className="mt-4">
        {tab === 'you' && youTab}
        {tab === 'us' && usTab}
        {tab === 'timeline' && <TimelineTab engine={engine ?? null} searchable={searchable} />}
        {tab === 'sharing' && sharingTab}
        {tab === 'activity' && activityTab}
      </div>

      {consentFor && <MemoryConsent onClose={() => setConsentFor(null)} onAllow={() => { const f = consentFor; setConsentFor(null); f(); }} />}
      {settings && <MemorySettings engine={engine ?? null} state={state} onClose={() => setSettings(false)} onDeletePassport={async () => { const ok = await (store?.remove() ?? Promise.resolve(false)); if (ok) { setStored(null); setDraft(null); } return ok; }} />}
    </div>
  );
};

const Empty: React.FC<{ emoji: string; text: string }> = ({ emoji, text }) => (
  <div className={`${card} p-6 flex items-center gap-4`}><Emoji e={emoji} size={32} className="shrink-0" /><p className="text-[15px] text-slate-600 leading-relaxed">{text}</p></div>
);

/** Trips and months, straight from the index's own tools on this device; nothing is sent. */
const TimelineTab: React.FC<{ engine: MemoryEngine | null; searchable: boolean }> = ({ engine, searchable }) => {
  const T = useUi(strings).timeline;
  const [data, setData] = useState<{ trips: { text: string; id?: string }[]; months: { text: string; id?: string }[] } | null>(null);
  useEffect(() => {
    if (!engine || !searchable) return;
    const rows = (r: { text: string; ids: string[] }) => { const lines = r.text.split('\n').map(s => s.trim()).filter(Boolean); return lines.map((text, i) => ({ text, id: lines.length === r.ids.length ? r.ids[i] : undefined })); };
    Promise.all([engine.runTool({ name: 'trips', args: {} }), engine.runTool({ name: 'timeline', args: { granularity: 'month' } })])
      .then(([t, m]) => setData({ trips: rows(t), months: rows(m) })).catch(() => setData({ trips: [], months: [] }));
  }, [engine, searchable]);
  if (!engine || !searchable) return <Empty emoji="🗺️" text={T.none} />;
  const block = (emoji: string, title: string, items: { text: string; id?: string }[]) => (
    <div className={`${card} p-5 sm:p-6`}>
      <h3 className="flex items-center gap-2 font-serif text-lg text-slate-900"><Emoji e={emoji} size={22} />{title}</h3>
      {!items.length && <p className="mt-3 text-[15px] text-slate-400">{T.none}</p>}
      <div className="mt-2 flex flex-col">
        {items.slice(0, 24).map((r, i) => (
          <div key={i} className="flex items-center gap-3 min-h-[56px]">
            {r.id ? <Thumb engine={engine} id={r.id} className="w-11 h-11 rounded-xl" /> : <span className="w-11 shrink-0" />}
            <span className="flex-1 min-w-0 text-[15px] text-slate-800 leading-snug">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm text-slate-500 px-2"><Emoji e="🔒" size={14} />{T.local}</p>
      {data && block('✈️', T.trips, data.trips)}
      {data && block('📅', T.months, data.months)}
    </div>
  );
};

export default Passport;
