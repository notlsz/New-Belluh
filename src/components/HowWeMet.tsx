// Bring your story from the app you met on. The person picks the app (the ones popular where they live first), then
// drops the app's data download (ZIP or JSON) or picks screenshots, or just sets the day. Everything is read on this
// device: the file is opened in memory, every other match is let go the moment they pick theirs, and screenshots are
// read with on-device OCR. Only what they tick is saved: a "How we met" entry, the day they matched for Bella, and any
// line that may be the partner's words as a pending approval the partner says yes to first. Which app it was is saved
// only when they choose to name it (never by default in discreet mode or for apps that hint at sexuality), and never
// reaches analytics. Loaded only when opened.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n, useUi } from '../i18n';
import ui from '../i18n/ui/howWeMet';
import { Emoji } from '../lib/emoji3d';
import { appsFor, browserDatingCountry, LOCAL_DATING, type DatingApp } from '../lib/datingApps';
import { readExport, rankMatches, keepOnly, openingLines, firstPlanLine, chapterRows, showAppByDefault, dayOf, type ImportResult, type MatchThread, type ChatLine, type ChapterRows } from '../lib/datingImport';
import { storyFromShots, shotReader } from '../lib/datingShots';
import { readDiscreet } from '../lib/discreet';

interface Props {
  userId: string;
  circleId: string;
  partnerName?: string;
  onClose: () => void;
  /** Saves the rows; resolves to true when saved */
  onSave: (rows: ChapterRows) => Promise<boolean>;
  /** For the dev harness and tests */
  country?: string;
}

type Stage = 'apps' | 'way' | 'reading' | 'pick' | 'review' | 'empty' | 'saved';
interface Tick { line: ChatLine; on: boolean }
const isImage = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|heic|heif|png|webp)$/i.test(f.name);
const okDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const HowWeMet: React.FC<Props> = ({ userId, circleId, partnerName, onClose, onSave, country: countryIn }) => {
  const T = useUi(ui);
  const { f, date, num, lang, country: uiCountry } = useI18n();
  const country = useMemo(() => countryIn ?? browserDatingCountry(uiCountry), [countryIn, uiCountry]);
  const discreet = useMemo(() => readDiscreet(country), [country]);
  const partner = (partnerName || '').trim().split(' ')[0];
  const apps = useMemo(() => appsFor(country), [country]);
  const localCount = (LOCAL_DATING[country] ?? LOCAL_DATING.WORLD).length;

  const [stage, setStage] = useState<Stage>('apps');
  const [allApps, setAllApps] = useState(false);
  const [app, setApp] = useState<DatingApp | null>(null);
  const [source, setSource] = useState<'export' | 'shots' | 'manual'>('export');
  const [emptyKind, setEmptyKind] = useState<'file' | 'shots'>('file');
  const [progress, setProgress] = useState({ n: 0, total: 0 });
  // The whole download lives here only while they pick; keepOnly empties it
  const result = useRef<ImportResult | null>(null);
  const [version, setVersion] = useState(0);
  const [around, setAround] = useState('');
  const [words, setWords] = useState('');
  const [letGo, setLetGo] = useState(false);
  const [matchedDay, setMatchedDay] = useState('');
  const [firstDay, setFirstDay] = useState<string | null>(null);
  const [planDay, setPlanDay] = useState<string | null>(null);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [showApp, setShowApp] = useState(false);
  const [remember, setRemember] = useState(true);
  const [shared, setShared] = useState(true);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pendingSaved, setPendingSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const shotInput = useRef<HTMLInputElement>(null);

  // Nothing read from a file outlives this sheet
  useEffect(() => () => { result.current = null; }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose, saving]);

  const longDay = (d: string) => { const [y, m, dd] = d.split('-').map(Number); return date(new Date(y, m - 1, dd), { year: 'numeric', month: 'long', day: 'numeric' }); };
  const shortDay = (t: number | null) => t == null ? '' : date(new Date(t), { year: 'numeric', month: 'short', day: 'numeric' });

  const chooseApp = (a: DatingApp) => { setApp(a); setShowApp(showAppByDefault(a, discreet)); setStage('way'); };

  const toReview = (lines: ChatLine[], matched: string | null, first: string | null) => {
    const plan = firstPlanLine(lines);
    const opening = openingLines(lines);
    setTicks(opening.map((line, i) => ({ line, on: i < 4 || line === plan })));
    setMatchedDay(matched ?? first ?? '');
    setFirstDay(first);
    setPlanDay(plan?.at != null ? dayOf(plan.at) : null);
    setStage('review');
  };

  const pickThread = (id: string) => {
    if (!result.current) return;
    const kept: MatchThread | null = keepOnly(result.current, id);
    result.current = null;
    setVersion(v => v + 1);
    setLetGo(true);
    if (!kept) return;
    const firstAt = kept.lines.find(l => l.at != null)?.at ?? null;
    toReview(kept.lines, kept.matchedAt != null ? dayOf(kept.matchedAt) : null, firstAt != null ? dayOf(firstAt) : null);
  };

  const onFile = async (list: FileList | null) => {
    const files = [...(list ?? [])];
    if (!files.length) return;
    setSource('export'); setStage('reading'); setProgress({ n: 0, total: 0 });
    let r: ImportResult | null = null;
    try { r = await readExport(await Promise.all(files.map(async x => ({ name: x.name, bytes: new Uint8Array(await x.arrayBuffer()) })))); } catch { r = null; }
    if (!r || !r.threads.length) { setEmptyKind('file'); setStage('empty'); return; }
    result.current = r;
    setVersion(v => v + 1);
    if (r.threads.length === 1) { pickThread(r.threads[0].id); return; }
    setStage('pick');
  };

  const onShots = async (list: FileList | null) => {
    const files = [...(list ?? [])].filter(isImage).slice(0, 12);
    if (!files.length) return;
    setSource('shots'); setStage('reading'); setProgress({ n: 0, total: files.length });
    const shots: { lines: string[]; takenAt: number | null }[] = [];
    try {
      const reader = await shotReader(lang, country);
      for (let i = 0; i < files.length; i++) {
        shots.push({ lines: await reader.read(files[i]).catch(() => []), takenAt: files[i].lastModified || null });
        setProgress({ n: i + 1, total: files.length });
      }
      await reader.close();
    } catch { /* falls through to empty */ }
    const s = storyFromShots(shots, LOCAL_DATING[country] ?? []);
    if (!s.lines.length && !s.matchedDay) { setEmptyKind('shots'); setStage('empty'); return; }
    if (!app && s.app) { setApp(s.app); setShowApp(showAppByDefault(s.app, discreet)); }
    toReview(s.lines, s.matchedDay, s.firstDay);
  };

  const manual = () => { setSource('manual'); toReview([], null, null); };

  const candidates = useMemo(() => {
    const r = result.current;
    if (!r) return [];
    const t = okDay(around) ? Date.parse(`${around}T12:00:00Z`) : null;
    return rankMatches(r.threads, { partnerName, around: t, words });
  }, [version, around, words, partnerName]);

  const toggle = (i: number) => setTicks(list => list.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  const kept = ticks.filter(x => x.on).map(x => x.line);
  const theirs = kept.filter(l => l.mine !== true).length;
  const named = showApp && !!app;

  const save = async () => {
    if (saving) return;
    setSaving(true); setFailed(false);
    const day = okDay(matchedDay) ? matchedDay : null;
    const lead = day ? f(named ? T.chapterApp : T.chapterNoApp, { app: app?.name ?? '', date: longDay(day) }) : (named ? f(T.chapterAppNoDate, { app: app!.name }) : T.chapterNoAppNoDate);
    const text = [lead, firstDay && firstDay !== day ? f(T.chapterFirst, { date: longDay(firstDay) }) : null, planDay ? f(T.chapterPlan, { date: longDay(planDay) }) : null].filter(Boolean).join(' ');
    const rows = chapterRows({ userId, circleId, shared, app: named ? app : null, showApp: named, matchedDay: day, title: T.entryTitle, text, lines: kept, dayLabel: T.dayLabel });
    if (!remember) rows.occasion = null;
    const ok = await onSave(rows).catch(() => false);
    setSaving(false);
    if (!ok) { setFailed(true); return; }
    setPendingSaved(!!rows.pending);
    setTicks([]);
    setStage('saved');
  };

  const steps = !app ? [] : app.export === 'tinder' ? T.stepsTinder : app.export === 'hinge' ? T.stepsHinge : app.export === 'generic' ? T.stepsGeneric.map(s => f(s, { app: app.name })) : [];

  const btnDark = 'h-12 px-6 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-40';
  const btnSoft = 'h-12 px-6 rounded-full bg-[#eef5f7] hover:bg-[#e2eef2] text-slate-900 font-bold text-[15px] inline-flex items-center justify-center gap-2';
  const appButton = (a: DatingApp) => (
    <button key={a.id} type="button" onClick={() => chooseApp(a)} data-testid={`app-${a.id}`}
      className="h-14 px-4 rounded-2xl bg-white border border-slate-200 hover:border-[#9bbecb] hover:bg-[#f6fafb] flex items-center gap-3 text-left transition-colors">
      <Emoji e="💌" size={24} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-900">{a.name}</span>
    </button>
  );
  const sw = (on: boolean, set: (v: boolean) => void, label: string, emoji: string, note?: string | null, testid?: string) => (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
      <button type="button" role="switch" aria-checked={on} onClick={() => set(!on)} data-testid={testid} className="w-full min-h-[44px] flex items-center gap-3 text-left">
        <Emoji e={emoji} size={24} className="shrink-0" />
        <span className="flex-1 min-w-0 text-[15px] font-bold text-slate-900 leading-snug">{label}</span>
        <span className={`shrink-0 w-11 h-7 rounded-full p-0.5 transition-colors ${on ? 'bg-[#9bbecb]' : 'bg-slate-300'}`}><span className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} /></span>
      </button>
      {note && <p className="pl-9 pb-1 text-[13px] leading-snug text-slate-500">{note}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/40 flex items-end md:items-center justify-center md:p-6 animate-fade-in" role="dialog" aria-modal="true" aria-label={T.title}>
      <div className="relative w-full md:max-w-[680px] h-[100svh] md:h-auto md:max-h-[90vh] bg-white md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 h-16 px-4 md:px-6 flex items-center justify-between gap-2">
          {(stage === 'way' || stage === 'empty') ? (
            <button type="button" onClick={() => setStage(stage === 'empty' ? 'way' : 'apps')} className="h-11 -ml-2 px-2 text-[14px] font-bold text-slate-500 hover:text-slate-900">{T.back}</button>
          ) : (
            <span className="text-[13px] font-semibold text-[#5e9db3] inline-flex items-center gap-2"><Emoji e="🔒" size={16} />{T.privateShort}</span>
          )}
          <button type="button" onClick={onClose} disabled={saving} aria-label={T.close} className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
        </div>
        <input ref={fileInput} type="file" accept=".zip,.json,application/zip,application/json" multiple className="hidden" data-testid="export-input" onChange={e => { onFile(e.target.files); e.target.value = ''; }} />
        <input ref={shotInput} type="file" accept="image/*" multiple className="hidden" data-testid="shots-input" onChange={e => { onShots(e.target.files); e.target.value = ''; }} />

        {stage === 'apps' && (
          <div className="flex-1 overflow-y-auto px-5 md:px-10 pb-10 pt-2" data-testid="dating-apps">
            <div className="flex flex-col items-center text-center">
              <Emoji e="💞" size={80} style={{ transform: 'rotate(-6deg)' }} />
              <h2 className="mt-5 font-serif text-[1.7rem] md:text-[2.1rem] leading-tight text-slate-900 max-w-lg">{T.title}</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">{T.sub}</p>
              <p className="mt-5 w-full max-w-md rounded-2xl bg-[#eef5f7] px-4 py-3 text-[14px] leading-snug text-slate-700 flex items-center gap-3 text-left"><Emoji e="🔒" size={22} className="shrink-0" />{T.private}</p>
            </div>
            <h3 className="mt-8 font-serif text-lg text-slate-900">{T.whichApp}</h3>
            <p className="mt-1 text-[13px] font-semibold text-slate-400">{T.local}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">{apps.slice(0, localCount).map(appButton)}</div>
            {!allApps ? (
              <button type="button" onClick={() => setAllApps(true)} className="mt-3 h-11 text-[14px] font-bold text-[#5e9db3] hover:text-slate-900">{T.all}</button>
            ) : (
              <>
                <p className="mt-6 text-[13px] font-semibold text-slate-400">{T.all}</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">{apps.slice(localCount).map(appButton)}</div>
              </>
            )}
          </div>
        )}

        {stage === 'way' && app && (
          <div className="flex-1 overflow-y-auto px-5 md:px-10 pb-10 pt-2" data-testid="dating-way">
            <div className="flex items-center gap-3">
              <Emoji e="💌" size={44} className="shrink-0" />
              <h2 className="font-serif text-[1.6rem] md:text-[2rem] leading-tight text-slate-900">{f(T.wayTitle, { app: app.name })}</h2>
            </div>
            {steps.length > 0 ? (
              <>
                <ol className="mt-6 space-y-2">
                  {steps.map((s, i) => (
                    <li key={i} className="min-h-[56px] rounded-2xl bg-slate-50 px-4 py-3 flex items-center gap-4">
                      <span className="shrink-0 w-6 text-center font-serif text-xl text-[#5e9db3]">{num(i + 1)}</span>
                      <span className="flex-1 text-[15px] leading-snug text-slate-800">{s}</span>
                    </li>
                  ))}
                </ol>
                {(app.export === 'tinder' || app.export === 'hinge') && partner && <p className="mt-3 text-[13px] leading-snug text-slate-500 flex items-center gap-2"><Emoji e="💬" size={16} className="shrink-0" />{f(T.exportOnly, { name: partner })}</p>}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" onClick={() => fileInput.current?.click()} className={btnDark}><Emoji e="📄" size={20} />{T.chooseFile}</button>
                  <button type="button" onClick={() => shotInput.current?.click()} className={btnSoft}><Emoji e="📸" size={20} />{T.useShots}</button>
                </div>
                <p className="mt-2 text-center text-[13px] text-slate-400">{T.fileTypes}</p>
              </>
            ) : (
              <>
                <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-[15px] leading-relaxed text-slate-700">{f(T.noExport, { app: app.name })}</p>
                <p className="mt-4 text-[14px] leading-snug text-slate-500">{T.shotsSub}</p>
                <div className="mt-6 grid grid-cols-1">
                  <button type="button" onClick={() => shotInput.current?.click()} className={btnDark}><Emoji e="📸" size={20} />{T.chooseShots}</button>
                </div>
              </>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5">
              {app.help && <a href={app.help} target="_blank" rel="noopener noreferrer" className="h-11 inline-flex items-center text-[14px] font-bold text-[#5e9db3] hover:text-slate-900">{f(T.help, { app: app.name })}</a>}
              <button type="button" onClick={manual} className="h-11 inline-flex items-center text-[14px] font-bold text-slate-500 hover:text-slate-900">{T.justDate}</button>
            </div>
          </div>
        )}

        {stage === 'reading' && (
          <div className="flex-1 px-6 md:px-10 pb-16 flex flex-col items-center justify-center text-center">
            <Emoji e={source === 'shots' ? '📸' : '📄'} size={64} className="animate-pulse-slow" />
            <p className="mt-6 font-serif text-xl text-slate-900">{source === 'shots' && progress.total ? f(T.readingShot, { n: num(Math.max(1, progress.n)), total: num(progress.total) }) : T.reading}</p>
            {source === 'shots' && progress.total > 0 && (
              <div className="mt-5 w-full max-w-xs h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.n}>
                <div className="h-full rounded-full bg-[#9bbecb] transition-[width] duration-300" style={{ width: `${(progress.n / progress.total) * 100}%` }} />
              </div>
            )}
            <p className="mt-4 text-[13px] text-slate-500">{T.readingNote}</p>
          </div>
        )}

        {stage === 'empty' && (
          <div className="flex-1 px-6 md:px-10 pb-16 flex flex-col items-center justify-center text-center">
            <Emoji e="🔍" size={64} />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-slate-600">{emptyKind === 'file' ? T.nothing : T.nothingShots}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => shotInput.current?.click()} className={btnDark}><Emoji e="📸" size={20} />{T.chooseShots}</button>
              <button type="button" onClick={manual} className={btnSoft}>{T.justDate}</button>
            </div>
          </div>
        )}

        {stage === 'pick' && (
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8" data-testid="dating-pick">
            <h2 className="font-serif text-[1.6rem] md:text-[2rem] leading-tight text-slate-900">{partner ? f(T.pickTitle, { name: partner }) : T.pickTitleNoName}</h2>
            <p className="mt-2 text-[14px] leading-snug text-slate-500">{T.pickSub}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="h-[72px] rounded-2xl bg-slate-50 px-4 flex flex-col justify-center">
                <span className="text-[12px] font-semibold text-slate-500">{T.around}</span>
                <input type="date" value={around} onChange={e => setAround(e.target.value)} className="mt-0.5 bg-transparent text-[15px] font-bold text-slate-900 focus:outline-none" />
              </label>
              <label className="h-[72px] rounded-2xl bg-slate-50 px-4 flex flex-col justify-center">
                <span className="text-[12px] font-semibold text-slate-500">{T.words}</span>
                <input value={words} onChange={e => setWords(e.target.value)} maxLength={60} className="mt-0.5 bg-transparent text-[15px] font-bold text-slate-900 focus:outline-none" />
              </label>
            </div>
            <ul className="mt-4 space-y-2">
              {candidates.map(c => (
                <li key={c.id}>
                  <button type="button" onClick={() => pickThread(c.id)} className="w-full min-h-[76px] rounded-2xl border border-slate-200 hover:border-[#9bbecb] hover:bg-[#f6fafb] px-4 py-3 flex items-center gap-3 text-left transition-colors">
                    <Emoji e="💬" size={30} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 text-[13px] font-semibold text-slate-500">
                        <span>{shortDay(c.matchedAt ?? c.firstAt)}</span>
                        <span>{c.count === 1 ? T.message1 : f(T.messages, { n: num(c.count) })}</span>
                        {c.weMet && <span className="text-[#c76fa9]">{T.weMet}</span>}
                      </span>
                      <span className="mt-0.5 block text-[15px] font-bold text-slate-900 leading-snug truncate">{c.preview}</span>
                    </span>
                    <span className="shrink-0 h-9 px-4 rounded-full bg-slate-900 text-white text-[13px] font-bold inline-flex items-center">{T.thisIsUs}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === 'review' && (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 pb-6" data-testid="dating-review">
              <div className="flex items-center gap-3">
                <Emoji e="💞" size={40} className="shrink-0" />
                <h2 className="font-serif text-[1.7rem] md:text-[2rem] leading-tight text-slate-900">{T.storyTitle}</h2>
              </div>
              {letGo && <p className="mt-3 rounded-2xl bg-[#eef5f7] px-4 py-3 text-[14px] leading-snug text-slate-700 flex items-center gap-3"><Emoji e="🔒" size={20} className="shrink-0" />{T.letGo}</p>}

              <div className={`mt-4 grid grid-cols-1 gap-2 ${[firstDay, planDay].filter(Boolean).length === 2 ? 'sm:grid-cols-3' : [firstDay, planDay].some(Boolean) ? 'sm:grid-cols-2' : ''}`}>
                <label className="h-[64px] sm:h-[76px] rounded-2xl bg-[#fdf1ec] px-3 flex items-center gap-3">
                  <Emoji e="📅" size={28} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold text-slate-500 leading-snug">{T.matchedOn}</span>
                    <input type="date" value={matchedDay} onChange={e => setMatchedDay(e.target.value)} data-testid="matched-day" className="block w-full h-6 p-0 bg-transparent text-[15px] leading-6 font-bold text-slate-900 focus:outline-none" />
                  </span>
                </label>
                {[firstDay ? { e: '💬', label: T.firstMessage, day: firstDay } : null, planDay ? { e: '🍷', label: T.planned, day: planDay } : null].filter((x): x is { e: string; label: string; day: string } => !!x).map(x => (
                  <div key={x.label} className="h-[64px] sm:h-[76px] rounded-2xl bg-[#fdf1ec] px-3 flex items-center gap-3">
                    <Emoji e={x.e} size={28} className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-slate-500 leading-snug">{x.label}</span>
                      <span className="block h-6 text-[15px] leading-6 font-bold text-slate-900 truncate">{longDay(x.day)}</span>
                    </span>
                  </div>
                ))}
              </div>

              {ticks.length > 0 && (
                <section className="mt-7">
                  <h3 className="h-7 flex items-center gap-2 text-[16px] font-bold text-slate-900"><Emoji e="💬" size={20} />{T.linesTitle}</h3>
                  <p className="text-[13px] leading-snug text-slate-500">{partner ? f(T.linesSub, { name: partner }) : T.linesSubNoName}</p>
                  <ul className="mt-2.5 space-y-2">
                    {ticks.map((x, i) => (
                      <li key={i} className={`min-h-[60px] rounded-2xl px-3 py-2.5 flex items-center gap-3 transition-colors ${x.on ? 'bg-[#eef5f7]' : 'bg-slate-50'}`}>
                        <button type="button" role="checkbox" aria-checked={x.on} aria-label={x.line.text} onClick={() => toggle(i)}
                          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[15px] font-black transition-colors ${x.on ? 'bg-[#9bbecb] text-white' : 'bg-white border-2 border-slate-200 text-transparent'}`}>✓&#xFE0E;</button>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] text-slate-900 leading-snug break-words">{x.line.text}</span>
                          {x.line.at != null && <span className="block text-[12px] text-slate-400">{shortDay(x.line.at)}</span>}
                        </span>
                        <span className={`shrink-0 h-7 px-2.5 rounded-full text-[12px] font-bold inline-flex items-center ${x.line.mine === true ? 'bg-white text-slate-500' : 'bg-[#fbe3f1] text-[#a24f86]'}`}>{x.line.mine === true ? T.yours : (partner ? f(T.waitsFor, { name: partner }) : T.waitsForNoName)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mt-7 space-y-2">
                {app && sw(showApp, setShowApp, f(T.showApp, { app: app.name }), '👀', discreet ? T.discreetNote : app.sensitive ? T.sensitiveNote : null, 'show-app')}
                {sw(remember, setRemember, T.bella, '🔔', null, 'remember')}
              </section>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 md:px-6 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {failed && <p className="mb-2 text-[13px] text-rose-600">{T.failed}</p>}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div role="radiogroup" aria-label={T.whoSees} className="h-12 p-1 rounded-full bg-slate-100 grid grid-cols-2 sm:flex-1 min-w-0 text-[13px] font-bold">
                  {[false, true].map(v => (
                    <button key={String(v)} type="button" role="radio" aria-checked={shared === v} onClick={() => setShared(v)}
                      className={`h-10 px-2 rounded-full truncate ${shared === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                      {v ? (partner ? f(T.bothNamed, { name: partner }) : T.both) : T.justMe}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={save} disabled={saving} data-testid="save-chapter" className="shrink-0 h-12 px-6 rounded-full bg-slate-900 hover:bg-black text-white text-[14px] font-bold disabled:opacity-40">
                  {saving ? T.saving : T.save}
                </button>
              </div>
            </div>
          </>
        )}

        {stage === 'saved' && (
          <div className="flex-1 px-6 md:px-10 pb-16 flex flex-col items-center justify-center text-center">
            <Emoji e="✅" size={64} />
            <h2 className="mt-6 font-serif text-2xl text-slate-900">{T.saved}</h2>
            <p className="mt-2 max-w-sm text-[15px] text-slate-600">{T.savedSub}</p>
            {pendingSaved && <p className="mt-2 max-w-sm text-[14px] text-slate-500">{partner ? f(T.savedPending, { name: partner }) : T.savedPendingNoName}</p>}
            <button type="button" onClick={onClose} className={`mt-8 ${btnDark}`}>{T.done}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowWeMet;
