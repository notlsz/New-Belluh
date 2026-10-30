import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { belluhAgent, type CheckinStatus, type WeekView } from '../services/belluhAgent';
import type { AgentMessage } from '../services/belluhAgent';
import { trackEvent } from '../services/analytics';
import { useI18n, useUi } from '../i18n';
import storyUi from '../i18n/ui/story';


// This week's one thing to try together. Shown on the home feed and under Belluh's Sunday message.
const WeeklyCard: React.FC<{
  week: WeekView;
  onChange: (week: WeekView, messages: AgentMessage[]) => void;
  compact?: boolean;
}> = ({ week, onChange, compact }) => {
  const [busy, setBusy] = useState<CheckinStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const { f } = useI18n();
  const T = useUi(storyUi);
  const OPTIONS: { status: CheckinStatus; label: string }[] = [
    { status: 'done', label: T.optDone },
    { status: 'not_yet', label: T.optNotYet },
    { status: 'skipped', label: T.optSkip },
  ];
  const WORDS: Record<CheckinStatus, string> = { done: T.done, not_yet: T.notYet, skipped: T.skipped };

  const answer = async (status: CheckinStatus) => {
    if (busy) return;
    setBusy(status);
    setFailed(false);
    const res = await belluhAgent.checkin(week.id, status);
    setBusy(null);
    if (!res?.week) { setFailed(true); return; }
    trackEvent('weekly_checkin', { status });
    setEditing(false);
    onChange(res.week, res.messages ?? []);
  };

  const partnerLine = week.partner_name
    ? (week.partner ? f(T.statusOf, { name: week.partner_name, status: WORDS[week.partner] }) : f(T.notCheckedIn, { name: week.partner_name }))
    : null;

  // Once you've answered, the card folds down to one line so it stays out of the way
  if ((week.mine === 'done' || week.mine === 'skipped') && !editing) {
    return (
      <div className="w-full rounded-[2rem] border border-[#CDE9F2] bg-[#CDE9F2]/20 px-5 py-4 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${week.mine === 'done' ? 'bg-slate-900 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
          <Check size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[15px] text-slate-700 truncate">{week.action}</p>
          <p className="text-xs text-slate-400 mt-0.5">{partnerLine ? f(T.andThen, { a: f(T.statusOf, { name: T.you, status: WORDS[week.mine] }), b: partnerLine }) : f(T.statusOf, { name: T.you, status: WORDS[week.mine] })}</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs font-bold text-slate-400 hover:text-slate-700 shrink-0">{T.change}</button>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-[2rem] border border-[#CDE9F2] bg-gradient-to-br from-white to-[#CDE9F2]/30 ${compact ? 'p-5' : 'p-5 md:p-7'} shadow-sm`}>
      <span className="bg-[#CDE9F2]/70 text-[#3d6b7b] px-3 py-1 rounded-full text-[12px] font-semibold">
        {week.partner_name ? T.thisWeekTogether : T.thisWeek}
      </span>
      <h3 className={`font-serif text-slate-800 leading-snug mt-4 ${compact ? 'text-lg' : 'text-xl md:text-2xl'}`}>{week.action}</h3>
      {week.why && <p className="text-sm text-slate-500 leading-relaxed mt-2">{week.why}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-1">
        {OPTIONS.map(o => {
          const on = week.mine === o.status;
          return (
            <button
              key={o.status}
              disabled={!!busy}
              onClick={() => answer(o.status)}
              aria-pressed={on}
              className={`px-3 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-60 ${
                on ? 'bg-slate-900 text-white' : o.status === 'done' ? 'bg-white border border-slate-200 text-slate-800 hover:border-slate-400' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {on && <Check size={14} />}{busy === o.status ? T.saving : o.status === 'done' && week.partner_name ? T.weDidIt : o.label}
            </button>
          );
        })}
      </div>

      {(partnerLine || failed) && (
        <p className="mt-4 text-xs text-slate-400">{failed ? T.saveFailed : partnerLine}</p>
      )}
    </div>
  );
};

export default WeeklyCard;
