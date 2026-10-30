import React, { useEffect, useState } from 'react';
import { X, Gift, Heart, Sparkles, Star, CalendarClock, Target, Eye, Compass, Plus, ArrowUpRight, PiggyBank, Wallet, PhoneOff, Ticket, UtensilsCrossed, Flower2, ShoppingBasket, Car, BookOpen, CalendarPlus, Check } from 'lucide-react';
import { belluhAgent, type Idea, type CoupleGoal, type BellaWatch } from '../services/belluhAgent';
import { current } from '../../supabase/functions/_shared/goals';
import { useI18n } from '../i18n';
import { LOCAL_APPS, RESEARCH_SOURCES, type AppCategory } from '../lib/localApps';
import WhatsAppDates from './WhatsAppDates';
import { trackEvent } from '../services/analytics';

export type PlateView = 'ideas' | 'goals' | 'apps';

const IDEA_ICON: Record<Idea['kind'], React.ElementType> = {
  occasion: Gift, love_day: Heart, milestone: Sparkles, wish: Star, plan_waiting: CalendarClock, goal: Target, watching: Eye, novelty: Compass,
};
const CAT_ICON: Record<AppCategory, React.ElementType> = { table: UtensilsCrossed, gifts: Flower2, food: ShoppingBasket, rides: Car, tickets: Ticket };

const localNow = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; };

/**
 * What Bella can take off their plate (ideas from what she knows), the goals the two of them share and what she's
 * watching for, and the apps she works with where they live. Tapping an idea asks Bella to do it.
 */
const BellaPlate: React.FC<{
  view: PlateView; onView: (v: PlateView) => void; partnerName: string | null; onClose: () => void;
  onAsk: (text: string) => void; onPrefill: (text: string) => void; onShowToast: (m: string, t: 'success' | 'error' | 'info') => void;
}> = ({ view, onView, partnerName, onClose, onAsk, onPrefill, onShowToast }) => {
  const { d, f, tag, country, date, lang } = useI18n();
  // Names in a row the way people there write them: 食べログ、ホットペッパー; TheFork, Uber Eats
  const list = (xs: string[]) => xs.join(lang === 'ja' || lang === 'zh' ? '、' : ', ');
  const P = d.app.plate;
  const partner = partnerName ?? d.app.compose.yourPartner;
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [goals, setGoals] = useState<CoupleGoal[] | null>(null);
  const [watches, setWatches] = useState<BellaWatch[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [feed, setFeed] = useState<{ google: string; webcal: string } | null>(null);

  useEffect(() => { belluhAgent.ideas().then(r => setIdeas(r?.ideas ?? [])); }, []);
  useEffect(() => { if (view === 'goals' && goals === null) { belluhAgent.goals().then(setGoals); belluhAgent.watches().then(setWatches); } }, [view, goals]);
  useEffect(() => { if (view === 'apps' && !feed) belluhAgent.calendarFeed().then(x => x && setFeed(x)); }, [view, feed]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const money = (n: number, cur: string | null) => {
    if (!cur) return n.toLocaleString(tag);
    try { return new Intl.NumberFormat(tag, { style: 'currency', currency: cur, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); } catch { return `${n} ${cur}`; }
  };
  const when = (n: number) => (n === 0 ? P.today : n === 1 ? P.tomorrow : f(P.inDays, { n }));
  const day = (iso: string) => date(new Date(`${iso}T12:00:00`), { month: 'short', day: 'numeric' });

  const ideaText = (i: Idea): { title: string; body: string; ask: string | null } => {
    switch (i.kind) {
      case 'occasion': return { title: f(P.occasionTitle, { label: i.label }), body: f(P.occasionBody, { when: when(i.inDays) }), ask: f(P.occasionAsk, { label: i.label }) };
      case 'love_day': { const name = lang !== 'en' && i.local ? i.local : i.name; return { title: f(P.loveTitle, { name }), body: f(P.loveBody, { when: when(i.inDays) }), ask: f(P.loveAsk, { name }) }; }
      case 'milestone': return { title: f(P.milestoneTitle, { day: i.day.toLocaleString(tag) }), body: f(P.milestoneBody, { when: when(i.inDays) }), ask: f(P.milestoneAsk, { day: i.day.toLocaleString(tag) }) };
      case 'wish': return { title: f(P.wishTitle, { partner }), body: f(P.wishBody, { fact: i.fact }), ask: f(P.wishAsk, { partner, fact: i.fact }) };
      case 'plan_waiting': return { title: f(P.planTitle, { partner }), body: f(P.planBody, { title: i.title }), ask: f(P.planAsk, { title: i.title }) };
      case 'goal': {
        const v = { now: money(i.now, i.currency), target: money(i.target, i.currency) };
        return { title: f(P.goalTitle, { title: i.title }), body: f(i.goalKind === 'habit' ? P.goalHabit : i.goalKind === 'save' ? P.goalSave : P.goalBudget, v), ask: f(P.goalAsk, { title: i.title }) };
      }
      case 'watching': return { title: f(P.watchTitle, { what: i.what }), body: P.watchBody, ask: null };
      case 'novelty': return { title: P.noveltyTitle, body: i.days == null ? P.noveltyFirst : P.noveltyBody, ask: P.noveltyAsk };
    }
  };

  const log = async (g: CoupleGoal, n: number) => {
    if (!Number.isFinite(n) || n === 0) return;
    setBusy(g.id);
    const r = await belluhAgent.goalLog(g.id, n);
    setBusy(null); setAdding(null); setAmount('');
    if (r?.goal) setGoals(gs => (gs ?? []).map(x => (x.id === g.id ? r.goal : x)));
    trackEvent('goal_logged', { kind: g.kind });
  };
  const stopGoal = async (g: CoupleGoal) => { setBusy(g.id); const r = await belluhAgent.goalStop(g.id); setBusy(null); if (r) setGoals(gs => (gs ?? []).filter(x => x.id !== g.id)); };
  const stopWatch = async (w: BellaWatch) => { setBusy(w.id); const r = await belluhAgent.watchStop(w.id); setBusy(null); if (r) setWatches(ws => ws.filter(x => x.id !== w.id)); };

  const goalLine = (g: CoupleGoal) => {
    const today = localNow();
    const now = current(g, today);
    const v = { now: g.kind === 'habit' ? now.toLocaleString(tag) : money(now, g.currency), target: g.kind === 'habit' ? g.target.toLocaleString(tag) : money(g.target, g.currency) };
    const line = g.kind === 'save' ? f(P.saved, v) : g.kind === 'habit' ? f(g.period === 'month' ? P.thisMonth : P.thisWeek, v) : f(g.period === 'month' ? P.spentMonth : P.spentWeek, v);
    return { line: g.kind === 'save' && g.due_on ? f(P.withDate, { line, by: f(P.by, { date: day(g.due_on) }) }) : line, pct: Math.min(100, (now / g.target) * 100), over: g.kind === 'budget' && now > g.target };
  };

  const STARTS: { icon: React.ElementType; label: string; text: string; send: boolean }[] = [
    { icon: Heart, label: P.startDates, text: P.startDatesAsk, send: true },
    { icon: PiggyBank, label: P.startSave, text: P.startSaveAsk, send: false },
    { icon: Wallet, label: P.startBudget, text: P.startBudgetAsk, send: false },
    { icon: PhoneOff, label: P.startPhones, text: P.startPhonesAsk, send: true },
    { icon: Ticket, label: P.startWatch, text: P.startWatchAsk, send: false },
  ];

  const tabBtn = (v: PlateView, label: string) => (
    <button role="tab" aria-selected={view === v} onClick={() => onView(v)}
      className={`h-8 px-3.5 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${view === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>
  );
  const sectionTitle = (t: string) => <h3 className="text-[13px] font-semibold text-slate-400 mb-3">{t}</h3>;

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-label={P.open} onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg h-[92vh] sm:h-[84vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 px-5 pt-5 pb-3 flex items-center gap-3">
          <div role="tablist" aria-label={P.open} className="flex items-center bg-slate-100 rounded-full p-0.5">
            {tabBtn('ideas', P.ideas)}{tabBtn('goals', P.goals)}{tabBtn('apps', P.apps)}
          </div>
          <button onClick={onClose} aria-label={d.app.acts.dismiss} className="ml-auto w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={18} /></button>
        </div>

        <div key={view} className="flex-1 overflow-y-auto px-5 pb-8">
          {view === 'ideas' && (
            <>
              <p className="mt-2 font-serif text-2xl text-slate-900 leading-snug">{P.ideasLead}</p>
              {ideas === null && <div className="mt-6 space-y-5">{[0, 1, 2].map(i => <div key={i} className="h-14 rounded-2xl bg-slate-50 animate-pulse" />)}</div>}
              {ideas?.length === 0 && <p className="mt-6 text-[15px] text-slate-500 leading-relaxed">{P.noIdeas}</p>}
              <div className="mt-5 space-y-1">
                {ideas?.map(i => {
                  const t = ideaText(i), Icon = IDEA_ICON[i.kind];
                  return (
                    <button key={i.key} onClick={() => { trackEvent('idea_tapped', { kind: i.kind }); if (t.ask) onAsk(t.ask); else onView('goals'); }}
                      className="w-full text-left flex items-start gap-3.5 -mx-3 px-3 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
                      <Icon size={20} className="mt-0.5 shrink-0 text-[#9bbecb]" />
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-slate-900 leading-snug">{t.title}</span>
                        <span className="mt-1 block text-sm text-slate-500 leading-relaxed">{t.body}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === 'goals' && (
            <>
              <p className="mt-2 font-serif text-2xl text-slate-900 leading-snug">{P.goalsLead}</p>
              {goals === null && <div className="mt-6 space-y-4">{[0, 1].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-50 animate-pulse" />)}</div>}
              {goals?.length === 0 && <p className="mt-4 text-[15px] text-slate-500 leading-relaxed">{P.noGoals}</p>}
              <div className="mt-5 space-y-3">
                {goals?.map(g => {
                  const { line, pct, over } = goalLine(g);
                  return (
                    <div key={g.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[15px] font-semibold text-slate-900 truncate">{g.title}</p>
                        {g.status === 'done' && <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#3f7486]"><Check size={13} /> {P.reached}</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{line}</p>
                      <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${over ? 'bg-[#e58bbf]' : 'bg-[#9bbecb]'}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      {g.status === 'active' && (adding === g.id ? (
                        <form className="mt-3 flex items-center gap-2" onSubmit={e => { e.preventDefault(); log(g, Number(amount.replace(',', '.'))); }}>
                          <input autoFocus inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder={P.howMuch} aria-label={P.howMuch}
                            className="min-w-0 flex-1 h-10 px-4 rounded-full bg-slate-50 border border-slate-100 text-sm outline-none focus:border-slate-300" />
                          <button type="submit" disabled={busy === g.id || !amount} className="h-10 px-4 rounded-full bg-slate-900 text-white text-xs font-bold disabled:opacity-50">{P.add}</button>
                          <button type="button" onClick={() => { setAdding(null); setAmount(''); }} aria-label={d.app.acts.dismiss} className="w-10 h-10 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700"><X size={16} /></button>
                        </form>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          <button disabled={busy === g.id} onClick={() => (g.kind === 'habit' ? log(g, 1) : setAdding(g.id))}
                            className="h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
                            {g.kind === 'habit' ? <><Check size={13} /> {P.didIt}</> : <><Plus size={13} /> {P.add}</>}
                          </button>
                          <button disabled={busy === g.id} onClick={() => stopGoal(g)} className="h-9 px-2 text-xs font-bold text-slate-400 hover:text-slate-700">{P.stop}</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {watches.length > 0 && (
                <div className="mt-8">
                  {sectionTitle(P.watching)}
                  <div className="space-y-1">
                    {watches.map(w => (
                      <div key={w.id} className="flex items-center gap-3.5 py-2.5">
                        <Eye size={18} className="shrink-0 text-[#9bbecb]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-slate-900 truncate">{w.what}</p>
                          <p className="text-xs text-slate-500 truncate">{w.status === 'found' && w.found ? f(P.foundOf, { title: w.found.title }) : f(P.until, { date: day(w.until_on) })}</p>
                        </div>
                        {w.status === 'found' && w.found
                          ? <a href={w.found.url} target="_blank" rel="noopener noreferrer" className="shrink-0 h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1">{P.see} <ArrowUpRight size={13} /></a>
                          : <button disabled={busy === w.id} onClick={() => stopWatch(w)} className="shrink-0 h-9 px-2 text-xs font-bold text-slate-400 hover:text-slate-700">{P.stop}</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                {sectionTitle(P.start)}
                <div className="space-y-1">
                  {STARTS.map(s => (
                    <button key={s.label} onClick={() => (s.send ? onAsk(s.text) : onPrefill(s.text))}
                      className="w-full flex items-center gap-3.5 -mx-3 px-3 py-3 rounded-2xl hover:bg-slate-50 text-left">
                      <s.icon size={18} className="shrink-0 text-[#9bbecb]" />
                      <span className="flex-1 text-[15px] text-slate-800">{s.label}</span>
                      <Plus size={16} className="shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === 'apps' && (
            <>
              <div className="mt-2"><WhatsAppDates onShowToast={onShowToast} compact /></div>

              <div className="mt-8">
                {sectionTitle(P.calendar)}
                <p className="text-sm text-slate-500 leading-relaxed">{P.calendarBody}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={feed?.google ?? '#'} target="_blank" rel="noopener noreferrer" aria-disabled={!feed} className={`h-10 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 hover:border-slate-400 ${feed ? '' : 'pointer-events-none opacity-50'}`}><CalendarPlus size={15} /> {P.addGoogle}</a>
                  <a href={feed?.webcal ?? '#'} aria-disabled={!feed} className={`h-10 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 hover:border-slate-400 ${feed ? '' : 'pointer-events-none opacity-50'}`}><CalendarPlus size={15} /> {P.addOther}</a>
                </div>
              </div>

              <div className="mt-8">
                {sectionTitle(P.books)}
                <p className="text-sm text-slate-500 leading-relaxed">{P.booksBody}</p>
                <div className="mt-3 space-y-1">
                  {(Object.keys(CAT_ICON) as AppCategory[]).map(c => {
                    const Icon = CAT_ICON[c];
                    return (
                      <div key={c} className="flex items-center gap-3.5 py-2.5">
                        <Icon size={18} className="shrink-0 text-[#9bbecb]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-slate-900">{P[`cat_${c}` as const]}</p>
                          <p className="text-xs text-slate-500 truncate">{list(LOCAL_APPS[country][c])}</p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#3f7486]"><Check size={13} /> {P.ready}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8">
                {sectionTitle(P.studies)}
                <div className="flex items-center gap-3.5 py-1">
                  <BookOpen size={18} className="shrink-0 text-[#9bbecb]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-slate-900">{RESEARCH_SOURCES.join(', ')}</p>
                    <p className="text-xs text-slate-500">{P.studiesBody}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BellaPlate;
