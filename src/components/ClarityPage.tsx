import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useI18n, useUi } from '../i18n';
import strings from '../i18n/ui/clarity';
import { Emoji } from '../lib/emoji3d';
import { clarityApi, type ClarityApi, type ClarityView, type PatternKey, type StepKey, type QuestionKey, type ClarityTalk } from '../services/clarity';

// Clarity: one partner's private page. A full-screen sheet over their own Me tab, never in the shared story. Patterns
// from their own writing with their own words, a few honest questions, next steps, and a private talk with Bella.

const ICON: Record<PatternKey, string> = {
  criticism: '🌧️', contempt: '❄️', defensiveness: '🛡️', stonewalling: '🔕', unheard: '💭', lonely: '🌙', sameFight: '🔄',
  kids: '🧸', place: '🗺️', money: '💳', faith: '🙏', ambition: '📈', repair: '🫂', warm: '☀️', hard: '🌧️',
};
const NOTE: Record<PatternKey, 'conflict' | 'felt' | 'again' | 'goals' | 'repair' | null> = {
  criticism: 'conflict', contempt: 'conflict', defensiveness: 'conflict', stonewalling: 'conflict', unheard: 'felt', lonely: 'felt', sameFight: 'again',
  kids: 'goals', place: 'goals', money: 'goals', faith: 'goals', ambition: 'goals', repair: 'repair', warm: null, hard: null,
};
const STEP_ICON: Record<StepKey, string> = { talk: '💬', checkin: '🧭', counsel: '🫶', part: '🌷', safety: '📞', support: '🫂' };

export default function ClarityPage({ onClose, onTurnedOff, api = clarityApi }: { onClose: () => void; onTurnedOff: () => void; api?: ClarityApi }) {
  const T = useUi(strings);
  const { date, f } = useI18n();
  const [view, setView] = useState<ClarityView | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<PatternKey | null>(null);
  const [full, setFull] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Partial<Record<QuestionKey, string>>>({});
  const [talk, setTalk] = useState<ClarityTalk[]>([]);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const day = (iso: string) => date(new Date(iso), { month: 'short', day: 'numeric' });

  useEffect(() => {
    let live = true;
    api.view().then(v => { if (!live) return; if (v) { setView(v); setTalk(v.talk); } else setFailed(true); });
    return () => { live = false; };
  }, [api]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [talk.length]);

  const readAll = async (kind: string, id: string) => {
    if (kind === 'answer' || full[id]) return;
    const r = await api.open(kind as 'entry' | 'chat', id);
    if (r) setFull(x => ({ ...x, [id]: r.text }));
  };
  const keep = async (key: QuestionKey) => {
    const text = (drafts[key] ?? '').trim();
    if (!text || !view) return;
    const r = await api.answer(key, text);
    if (r) { setView({ ...view, answers: [...view.answers, r.answer] }); setDrafts(d => ({ ...d, [key]: '' })); }
  };
  const forget = async (id: string) => {
    if (!view) return;
    if (await api.forget(id)) setView({ ...view, answers: view.answers.filter(a => a.id !== id) });
  };
  const send = async () => {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true); setMsg('');
    const r = await api.talk(text);
    setSending(false);
    if (r) setTalk(t => [...t, ...r.messages]); else setMsg(text);
  };
  const turnOff = async () => {
    if (!window.confirm(T.confirmOff)) return;
    if (await api.off()) onTurnedOff();
  };

  const concerns = view?.patterns.filter(p => p.key !== 'repair') ?? [];
  const strengths = view?.patterns.filter(p => p.key === 'repair') ?? [];

  return (
    <div className="fixed inset-0 z-[120] bg-[#fbf8f4] overflow-y-auto" role="dialog" aria-modal="true" aria-label={T.name}>
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8 pt-6 md:pt-12 pb-24">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <Emoji e="🫧" size={36} />
            <h1 className="font-serif text-3xl md:text-4xl text-slate-900 leading-none">{T.name}</h1>
          </div>
          <button onClick={onClose} aria-label={T.close} className="shrink-0 h-10 px-3 flex items-center gap-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white transition-colors">
            <X size={18} /><span className="text-sm font-semibold">{T.close}</span>
          </button>
        </div>
        <p className="text-[15px] text-slate-500 mb-10">{T.pageSub}</p>

        {failed && <p className="rounded-2xl bg-white border border-slate-100 p-5 text-slate-600">{T.error}</p>}
        {!view && !failed && <div className="h-40 rounded-3xl bg-white/70 animate-pulse" />}

        {view && (
          <>
            {view.safety.abuse && view.safety.dvLine && (
              <section className="mb-10 rounded-3xl bg-white border-2 border-[#f0addd] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-3"><Emoji e="📞" size={30} /><h2 className="font-serif text-2xl text-slate-900">{T.steps.safety.title}</h2></div>
                <p className="text-[15px] text-slate-600 mb-4">{T.steps.safety.body}</p>
                <p className="text-[16px] font-semibold text-slate-900 leading-relaxed">{view.safety.dvLine}</p>
              </section>
            )}
            {view.safety.crisis && view.safety.crisisLine && (
              <section className="mb-10 rounded-3xl bg-white border-2 border-[#9bbecb] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-3"><Emoji e="🤍" size={30} /><h2 className="font-serif text-2xl text-slate-900">{T.crisisTitle}</h2></div>
                <p className="text-[16px] font-semibold text-slate-900 leading-relaxed">{view.safety.crisisLine}</p>
              </section>
            )}

            <h2 className="font-serif text-2xl text-slate-900 mb-4">{T.noticed}</h2>
            {concerns.length === 0 && <p className="rounded-3xl bg-white border border-slate-100 p-6 text-[15px] text-slate-500 mb-4">{T.nothing}</p>}
            <div className="flex flex-col gap-3 mb-4">
              {[...concerns, ...strengths].map(p => {
                const note = NOTE[p.key];
                const isOpen = open === p.key;
                return (
                  <div key={p.key} className={`rounded-3xl border p-5 md:p-6 ${p.key === 'repair' ? 'bg-[#eef5f8] border-[#d6e7ee]' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <Emoji e={ICON[p.key]} size={36} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg text-slate-900 leading-snug">{T.labels[p.key]}</p>
                        <p className="text-sm text-slate-500">{f(T.times, { n: p.count })}{T.sep}{f(T.latest, { date: day(p.last) })}</p>
                      </div>
                      <button onClick={() => setOpen(isOpen ? null : p.key)} aria-expanded={isOpen}
                        className="hidden sm:inline-flex items-center shrink-0 h-9 px-4 rounded-xl text-sm font-semibold text-[#3f7486] bg-[#9bbecb]/15 hover:bg-[#9bbecb]/30 transition-colors">
                        {isOpen ? T.hideWords : T.words}
                      </button>
                    </div>
                    {note && <p className="mt-3 text-[13px] leading-relaxed text-slate-400">{T.notes[note]}</p>}
                    <button onClick={() => setOpen(isOpen ? null : p.key)} aria-expanded={isOpen}
                      className="sm:hidden mt-3 h-9 px-4 rounded-xl text-sm font-semibold text-[#3f7486] bg-[#9bbecb]/15">
                      {isOpen ? T.hideWords : T.words}
                    </button>
                    {isOpen && (
                      <div className="mt-4 flex flex-col gap-3">
                        {p.sources.map(s => (
                          <div key={`${s.kind}${s.id}`} className="rounded-2xl bg-[#fbf8f4] p-4">
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <span className="text-[12px] font-semibold text-slate-400">{day(s.at)}{T.sep}{T.kinds[s.kind]}</span>
                              {s.kind !== 'answer' && !full[s.id] && <button onClick={() => readAll(s.kind, s.id)} className="text-[12px] font-semibold text-[#3f7486] hover:text-slate-900">{T.readAll}</button>}
                            </div>
                            <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">{full[s.id] ?? `"${s.excerpt}"`}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {(view.balance.warm > 0 || view.balance.hard > 0) && (
              <div className="mb-12 px-1 flex items-center gap-3">
                <Emoji e="☀️" size={24} className="shrink-0" />
                <p className="text-sm text-slate-500">{f(T.balance, { warm: view.balance.warm, hard: view.balance.hard })} {T.balanceNote}</p>
              </div>
            )}

            <h2 className="font-serif text-2xl text-slate-900 mb-4 mt-12">{T.questionsTitle}</h2>
            <div className="flex flex-col gap-3 mb-12">
              {view.questions.map(q => (
                <div key={q} className="rounded-3xl bg-white border border-slate-100 p-5 md:p-6">
                  <p className="font-serif text-lg text-slate-900 mb-3">{T.questions[q]}</p>
                  {view.answers.filter(a => a.key === q).map(a => (
                    <div key={a.id} className="mb-3 rounded-2xl bg-[#fdf0f8] p-4">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-[12px] font-semibold text-[#9d3f78]/70">{day(a.created_at)}</span>
                        <button onClick={() => forget(a.id)} className="text-[12px] font-semibold text-slate-400 hover:text-slate-900">{T.remove}</button>
                      </div>
                      <p className="text-[15px] text-slate-700 whitespace-pre-wrap">{a.text}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <textarea value={drafts[q] ?? ''} onChange={e => setDrafts(d => ({ ...d, [q]: e.target.value }))} rows={2} placeholder={T.writeHere}
                      className="flex-1 min-w-0 resize-none rounded-2xl bg-[#fbf8f4] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
                    <button onClick={() => keep(q)} disabled={!(drafts[q] ?? '').trim()} className="shrink-0 h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-30">{T.keep}</button>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="font-serif text-2xl text-slate-900 mb-4">{T.stepsTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:auto-rows-fr gap-3 mb-12">
              {view.steps.filter(s => !(s === 'safety' && view.safety.abuse && view.safety.dvLine)).map(s => (
                <div key={s} className="h-full rounded-3xl bg-white border border-slate-100 p-5 md:p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-2"><Emoji e={STEP_ICON[s]} size={28} className="shrink-0" /><h3 className="font-serif text-lg text-slate-900 leading-snug">{T.steps[s].title}</h3></div>
                  <p className="text-[14px] leading-relaxed text-slate-600">{T.steps[s].body}</p>
                  {s === 'counsel' && (view.counselling
                    ? <a href={view.counselling.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 text-sm font-semibold text-[#3f7486] hover:text-slate-900">{f(T.findCounsel, { name: view.counselling.name })}{view.counselling.phone ? `${T.sep}${view.counselling.phone}` : ''}</a>
                    : <p className="mt-auto pt-3 text-sm text-slate-500">{T.findCounselElse}</p>)}
                </div>
              ))}
            </div>

            <h2 className="font-serif text-2xl text-slate-900 mb-1">{T.talkTitle}</h2>
            <p className="text-sm text-slate-500 mb-4">{T.talkNote}</p>
            <div className="rounded-3xl bg-white border border-slate-100 p-4 md:p-5 mb-12">
              {talk.length > 0 && (
                <div className="flex flex-col gap-2 mb-4 max-h-[420px] overflow-y-auto">
                  {talk.map(m => (
                    <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'self-end bg-[#9bbecb] text-slate-900' : 'self-start bg-[#fbf8f4] text-slate-700'}`}>{m.body}</div>
                  ))}
                  <div ref={end} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={1} placeholder={T.talkPlaceholder}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  className="flex-1 min-w-0 resize-none rounded-2xl bg-[#fbf8f4] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
                <button onClick={send} disabled={!msg.trim() || sending} className="shrink-0 h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-30">{T.send}</button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-1">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700">{T.offTitle}</p>
                <p className="text-[13px] text-slate-400">{T.offBody}</p>
              </div>
              <button onClick={turnOff} className="shrink-0 h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white">{T.turnOff}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
