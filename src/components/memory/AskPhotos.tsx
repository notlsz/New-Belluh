// Ask your photos (Rollup's queryUpdates: progress lines, the answer as it is written, then the final answer with the
// photos behind it, marked as AI) and Search (on this device, nothing sent, a grid of results).
import React, { useEffect, useRef, useState } from 'react';
import { useI18n, useUi } from '../../i18n';
import strings from '../../i18n/ui/passport';
import type { Answer, MemoryEngine, SearchResult } from '../../lib/memory/types';
import type { MemoryAgent } from '../../lib/memory/agent';
import { QUESTION_MAX } from '../../../supabase/functions/_shared/memoryrules';
import { Emoji } from '../../lib/emoji3d';
import { AiBadge, Segmented, Thumb, card, fillT } from './bits';

interface Props {
  engine: MemoryEngine | null;
  searchable: boolean;
  agent: MemoryAgent;
  /** Runs fn once the person has allowed AI answers (shows the permission screen first if needed) */
  withConsent: (fn: () => void) => void;
  initialMode?: 'ask' | 'search';
  initialQuestion?: string;
}

const AskPhotos: React.FC<Props> = ({ engine, searchable, agent, withConsent, initialMode = 'ask', initialQuestion = '' }) => {
  const T = useUi(strings);
  const A = T.ask;
  const { num, date } = useI18n();
  const [mode, setMode] = useState<'ask' | 'search'>(initialMode);
  const [text, setText] = useState(initialQuestion);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [partial, setPartial] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const stop = useRef<AbortController | null>(null);
  useEffect(() => () => stop.current?.abort(), []);

  const ask = (q: string) => withConsent(async () => {
    stop.current?.abort();
    const ctrl = new AbortController(); stop.current = ctrl;
    setBusy(true); setProgress([]); setPartial(''); setAnswer(null); setError(null);
    try {
      for await (const u of agent.queryUpdates(q, { signal: ctrl.signal })) {
        if (u.type === 'progress') setProgress(p => [...p, u.text]);
        else if (u.type === 'partialAnswer') setPartial(u.text);
        else { setAnswer(u.answer); setPartial(''); }
      }
    } catch (e: any) {
      if (e?.code !== 'cancelled') setError(e?.code === 'rateLimited' ? A.rate : e?.code === 'network' ? A.offline : e?.code === 'notStarted' || e?.code === 'noIndex' ? A.notReady : A.error);
    } finally { setBusy(false); if (stop.current === ctrl) stop.current = null; }
  });

  const search = async (q: string) => {
    if (!engine) return;
    setBusy(true); setError(null);
    try { const r = await engine.search(q, { limit: 60 }); setResults(r.results.filter(x => !x.sensitivity)); }
    catch { setError(A.error); } finally { setBusy(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    if (!searchable) { setError(A.notReady); return; }
    if (mode === 'ask') { if ([...q].length > QUESTION_MAX) { setError(A.tooLong); return; } ask(q); } else void search(q);
  };

  const shownText = answer?.text ?? partial;
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <Segmented label={A.ask} value={mode} onChange={m => { setMode(m); setError(null); }} options={[{ id: 'ask', label: A.ask, emoji: '💬' }, { id: 'search', label: A.search, emoji: '🔍' }]} />
      </div>
      <form onSubmit={submit} className="mt-4 flex items-center gap-2">
        <input value={text} onChange={e => setText(e.target.value)} maxLength={mode === 'ask' ? QUESTION_MAX + 50 : 200}
          placeholder={mode === 'ask' ? A.placeholder : A.searchPlaceholder} aria-label={mode === 'ask' ? A.placeholder : A.searchPlaceholder}
          className="flex-1 min-w-0 h-12 px-5 rounded-full bg-[#f4f8fa] text-[16px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#cfe3ea]" />
        {busy && mode === 'ask'
          ? <button type="button" onClick={() => stop.current?.abort()} className="shrink-0 h-12 px-5 rounded-full bg-[#eaf2f5] text-slate-900 font-semibold">{A.stop}</button>
          : <button type="submit" disabled={!text.trim()} aria-label={mode === 'ask' ? A.ask : A.search} className="shrink-0 h-12 w-12 sm:w-auto sm:px-6 rounded-full bg-slate-900 text-white font-semibold disabled:opacity-30 flex items-center justify-center gap-2">
              <span className="sm:hidden text-lg leading-none">↑</span><span className="hidden sm:inline">{mode === 'ask' ? A.ask : A.search}</span>
            </button>}
      </form>
      {mode === 'search' && <p className="flex items-center gap-2 mt-3 text-sm text-slate-500"><Emoji e="🔒" size={14} />{A.onDevice}</p>}
      {error && <p role="alert" className="mt-4 text-sm font-semibold text-[#9d3f7a]">{error}</p>}

      {mode === 'ask' && (busy || answer || partial) && (
        <div className="mt-5" aria-live="polite">
          {!shownText && progress.length > 0 && (
            <p className="flex items-center gap-2 text-[15px] text-slate-500"><Emoji e="⏳" size={16} className="animate-pulse" />{progress[progress.length - 1]}</p>
          )}
          {!shownText && !progress.length && busy && <p className="flex items-center gap-2 text-[15px] text-slate-500"><Emoji e="⏳" size={16} className="animate-pulse" />{T.progress.thinking}</p>}
          {shownText && (
            <div>
              {answer && !answer.declined && <AiBadge label={T.aiShort} title={T.ai} />}
              <p className={`font-serif text-[17px] leading-relaxed text-slate-900 ${answer && !answer.declined ? 'mt-3' : ''}`}>{shownText}</p>
            </div>
          )}
          {answer && answer.assetIdentifiers.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">{A.evidence}</p>
              <div className="mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {answer.assetIdentifiers.slice(0, 8).map(id => <Thumb key={id} engine={engine} id={id} className="w-16 h-16 rounded-2xl" />)}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'search' && results && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-500">{results.length === 1 ? A.result1 : results.length ? fillT(A.results, { n: num(results.length) }) : A.noResults}</p>
          {results.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {results.map(r => (
                <figure key={r.id} className="min-w-0">
                  <Thumb engine={engine} id={r.id} className="w-full aspect-square rounded-2xl" alt={r.places[0]?.name ?? r.location?.city ?? ''} />
                  <figcaption className="mt-1 text-[11px] leading-tight text-slate-500 truncate">
                    {[r.date ? date(new Date(r.date), { month: 'short', year: 'numeric' }) : null, r.places[0]?.name ?? r.location?.city].filter(Boolean).join(', ')}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
export default AskPhotos;
