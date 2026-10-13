import React, { useEffect, useState } from 'react';
import { X, Check, Minus, Clock, CalendarCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { belluhAgent, type Plan } from '../services/belluhAgent';
import { formatOption } from '../../supabase/functions/_shared/plans';

interface Week { id: string; action: string; why: string | null; week_start: string }
interface Checkin { action_id: string; user_id: string; status: 'done' | 'not_yet' | 'skipped' }

const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/New_York'; } };
const WORDS = { done: 'did it', not_yet: 'not yet', skipped: 'skipped' } as const;

// What you've actually tried together, week by week, and the plans you've made. Real history, no made-up scores.
const OurWeeks: React.FC<{ onClose: () => void; partnerName?: string | null }> = ({ onClose, partnerName }) => {
  const [weeks, setWeeks] = useState<Week[] | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setMe(await belluhAgent.myId());
      const { data: w } = await supabase.from('weekly_actions').select('id, action, why, week_start').order('week_start', { ascending: false }).limit(12);
      const list = (w ?? []) as Week[];
      setWeeks(list);
      if (list.length) {
        const { data: c } = await supabase.from('weekly_checkins').select('action_id, user_id, status').in('action_id', list.map(x => x.id));
        setCheckins((c ?? []) as Checkin[]);
      }
      const { data: p } = await supabase.from('plans').select('*').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(8);
      setPlans((p ?? []) as Plan[]);
    })();
  }, []);

  const other = partnerName || 'Partner';
  const did = (mine: boolean) => (weeks ?? []).filter(w => checkins.some(c => c.action_id === w.id && c.status === 'done' && (c.user_id === me) === mine)).length;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg rounded-t-[2rem] md:rounded-[2rem] max-h-[88vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-50">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-belluh-500">Belluh</p>
            <h2 className="font-serif text-2xl text-slate-900 mt-1">Our weeks</h2>
            {weeks && weeks.length > 0 && <p className="text-sm text-slate-500 mt-1">Of {weeks.length} {weeks.length === 1 ? 'suggestion' : 'suggestions'}, you did {did(true)} and {other} did {did(false)}.</p>}
          </div>
          <button aria-label="Close" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {weeks === null && <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />}
          {weeks && weeks.length === 0 && (
            <p className="text-sm text-slate-500 leading-relaxed">Every Sunday, Belluh suggests one small thing for the two of you to try, based on what you share. Your weeks will collect here.</p>
          )}

          {plans.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Plans you made</h3>
              <ul className="space-y-2">
                {plans.map(p => {
                  const o = p.options.find(x => x.id === p.chosen_option);
                  return (
                    <li key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#f7d8ee]/30">
                      <CalendarCheck size={16} className="text-[#831843] shrink-0" />
                      <div className="min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>{o && <p className="text-xs text-slate-500">{formatOption(o, tz())}</p>}</div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {weeks && weeks.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Week by week</h3>
              <ol className="space-y-3">
                {weeks.map(w => {
                  const mine = checkins.find(c => c.action_id === w.id && c.user_id === me)?.status;
                  const theirs = checkins.find(c => c.action_id === w.id && c.user_id !== me)?.status;
                  const icon = (s?: string) => s === 'done' ? <Check size={12} /> : s === 'skipped' ? <Minus size={12} /> : <Clock size={12} />;
                  return (
                    <li key={w.id} className="p-4 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400">Week of {new Date(`${w.week_start}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="font-serif text-[16px] text-slate-800 leading-snug mt-1">{w.action}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${mine === 'done' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>{icon(mine)} You: {mine ? WORDS[mine] : 'no answer'}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${theirs === 'done' ? 'bg-[#CDE9F2] text-[#3d6b7b]' : 'bg-slate-50 text-slate-500'}`}>{icon(theirs)} {other}: {theirs ? WORDS[theirs] : 'no answer'}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default OurWeeks;
