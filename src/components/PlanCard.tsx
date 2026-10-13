import React, { useEffect, useState } from 'react';
import { CalendarPlus, Check, Clock, X } from 'lucide-react';
import { belluhAgent, type Plan } from '../services/belluhAgent';
import { formatOption, googleCalendarUrl, icsCalendar } from '../../supabase/functions/_shared/plans';
import { trackEvent } from '../services/analytics';

const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/New_York'; } };

/** Downloads one event as .ics, which Apple Calendar and Outlook open directly. */
function downloadIcs(plan: Plan, startsAt: string, minutes: number) {
  const ics = icsCalendar(plan.title, [{ uid: `plan-${plan.id}`, title: plan.title, starts_at: startsAt, minutes, details: plan.details ?? 'Planned together in Belluh' }]);
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url; a.download = `${plan.title.replace(/[^\w ]+/g, '').trim() || 'plan'}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// A plan Belluh made for the two of you. The partner picks a time; then it's in both calendars.
const PlanCard: React.FC<{ planId: string; partnerName?: string | null; onChanged?: () => void }> = ({ planId, partnerName, onChanged }) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noneOpen, setNoneOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let off = false;
    Promise.all([belluhAgent.plan(planId), belluhAgent.myId()]).then(([p, id]) => { if (!off) { setPlan(p); setMe(id); } });
    return () => { off = true; };
  }, [planId]);

  if (!plan || !me) return <div className="h-24 rounded-[1.75rem] bg-slate-50 animate-pulse" />;
  const mine = plan.created_by === me;
  const other = partnerName || 'your partner';
  const chosen = plan.options.find(o => o.id === plan.chosen_option);

  const respond = async (optionId: string | null) => {
    setBusy(optionId ?? 'none'); setFailed(false);
    const res = await belluhAgent.planRespond(plan.id, optionId, note);
    setBusy(null);
    if (!res?.plan) { setFailed(true); return; }
    trackEvent('plan_answered', { picked: !!optionId });
    setPlan(res.plan); onChanged?.();
  };
  const cancel = async () => {
    setBusy('cancel');
    const res = await belluhAgent.planCancel(plan.id);
    setBusy(null);
    if (res?.plan) { setPlan(res.plan); onChanged?.(); }
  };

  return (
    <div className="w-full rounded-[1.75rem] border border-[#f0addd]/60 bg-gradient-to-br from-white to-[#f7d8ee]/30 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="bg-[#f7d8ee] text-[#831843] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          {plan.status === 'confirmed' ? "It's a plan" : mine ? `Plan for you & ${other}` : `${other} wants to plan`}
        </span>
      </div>
      <h3 className="font-serif text-xl text-slate-800 leading-snug mt-3 text-balance">{plan.title}</h3>
      {plan.details && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{plan.details}</p>}

      {plan.status === 'proposed' && !mine && (
        <>
          <p className="text-xs font-bold text-slate-400 mt-4 mb-2">Pick a time that works</p>
          <div className="flex flex-col gap-2">
            {plan.options.map(o => (
              <button key={o.id} disabled={!!busy} onClick={() => respond(o.id)}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:border-[#f0addd] disabled:opacity-60 flex items-center justify-between gap-3">
                <span className="text-[15px] text-slate-800 font-medium">{o.label ? `${o.label} · ` : ''}{formatOption(o, tz())}</span>
                <span className="text-xs font-bold text-[#831843] shrink-0">{busy === o.id ? 'Saving…' : 'Pick'}</span>
              </button>
            ))}
          </div>
          {!noneOpen ? (
            <button onClick={() => setNoneOpen(true)} className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-700">None of these work</button>
          ) : (
            <div className="mt-3 flex gap-2">
              <input id={`plan-note-${plan.id}`} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional: what would work?"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#f0addd]" />
              <button disabled={!!busy} onClick={() => respond(null)} className="px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold disabled:opacity-60">Send</button>
            </div>
          )}
        </>
      )}

      {plan.status === 'proposed' && mine && (
        <div className="mt-4 space-y-1.5">
          {plan.options.map(o => <p key={o.id} className="text-sm text-slate-600 flex items-center gap-2"><Clock size={13} className="text-slate-300" />{o.label ? `${o.label} · ` : ''}{formatOption(o, tz())}</p>)}
          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">Waiting for {other} to pick</p>
            <button disabled={!!busy} onClick={cancel} className="text-xs font-bold text-slate-400 hover:text-slate-700">Call it off</button>
          </div>
        </div>
      )}

      {plan.status === 'confirmed' && chosen && (
        <>
          <p className="mt-3 text-[15px] font-medium text-slate-800 flex items-center gap-2"><Check size={16} className="text-[#831843]" />{formatOption(chosen, tz())}</p>
          {plan.partner_note && <p className="text-sm text-slate-500 mt-1">“{plan.partner_note}”</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={googleCalendarUrl({ uid: plan.id, title: plan.title, starts_at: chosen.starts_at, minutes: chosen.minutes, details: plan.details })} target="_blank" rel="noreferrer"
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-400 flex items-center gap-1.5"><CalendarPlus size={14} /> Google Calendar</a>
            <button onClick={() => downloadIcs(plan, chosen.starts_at, chosen.minutes)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-400 flex items-center gap-1.5"><CalendarPlus size={14} /> Apple or Outlook</button>
          </div>
        </>
      )}

      {plan.status === 'declined' && (
        <p className="mt-3 text-sm text-slate-500">{mine ? `${other} can't make those times.` : 'You said none of these work.'}{plan.partner_note ? ` “${plan.partner_note}”` : ''}</p>
      )}
      {plan.status === 'cancelled' && <p className="mt-3 text-sm text-slate-400 flex items-center gap-1.5"><X size={14} /> Called off</p>}
      {failed && <p className="mt-3 text-xs text-rose-500">Couldn't save that. Try again.</p>}
    </div>
  );
};

export default PlanCard;
