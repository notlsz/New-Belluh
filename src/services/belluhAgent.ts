import { supabase, supabaseUrl } from '../lib/supabaseClient';
import type { PlanOption } from '../../supabase/functions/_shared/plans';

export type AgentRole = 'user' | 'belluh' | 'partner_note' | 'note_draft' | 'plan';

export interface Plan {
  id: string; created_by: string; partner_id: string; title: string; details: string | null;
  options: PlanOption[]; status: 'proposed' | 'confirmed' | 'declined' | 'cancelled';
  chosen_option: string | null; partner_note: string | null; created_at: string;
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  body: string;
  meta: Record<string, any>;
  created_at: string;
}

export type CheckinStatus = 'done' | 'not_yet' | 'skipped';

/** This week's one thing to try together, and where each of you is with it. */
export interface WeekView {
  id: string;
  action: string;
  why: string | null;
  week_start: string;
  mine: CheckinStatus | null;
  partner: CheckinStatus | null;
  partner_name: string | null;
}

/** The Sunday that starts this week, in the person's own time zone. */
export function localWeekStart(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SEEN_KEY = 'belluh_seen_at';

const tz = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/New_York'; }
};

/** Calls the belluh-agent edge function. Returns null when it isn't deployed or fails, so callers can fall back. */
async function call<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke('belluh-agent', { body: { ...body, timezone: tz() } });
    if (error || !data || (data as any).error) return null;
    return data as T;
  } catch {
    return null;
  }
}

export const belluhAgent = {
  history: () => call<{ messages: AgentMessage[]; partner_name: string | null; week: WeekView | null }>({ action: 'history' }),
  planRespond: (planId: string, optionId: string | null, note = '') => call<{ plan: Plan; messages: AgentMessage[] }>({ action: 'plan_respond', plan_id: planId, option_id: optionId, note }),
  planCancel: (planId: string) => call<{ plan: Plan }>({ action: 'plan_cancel', plan_id: planId }),
  checkin: (actionId: string, status: CheckinStatus) => call<{ messages: AgentMessage[]; week: WeekView | null }>({ action: 'checkin', action_id: actionId, status }),
  chat: (message: string, mode: 'chat' | 'mediate' = 'chat') => call<{ messages: AgentMessage[] }>({ action: 'chat', message, mode }),
  react: (entryId: string) => call<{ message: AgentMessage | null }>({ action: 'react', entry_id: entryId }),
  sendNote: (draftId: string, text?: string) => call<{ ok: boolean }>({ action: 'send_note', draft_id: draftId, text }),
  discardNote: (draftId: string) => call<{ ok: boolean }>({ action: 'discard_note', draft_id: draftId }),

  async memories(): Promise<{ id: string; fact: string }[]> {
    const { data, error } = await supabase.from('agent_memories').select('id, fact').order('created_at', { ascending: false });
    return error ? [] : (data ?? []);
  },
  async forget(id: string): Promise<boolean> {
    const { error } = await supabase.from('agent_memories').delete().eq('id', id);
    return !error;
  },
  async unreadNotes(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { count, error } = await supabase.from('partner_notes').select('id', { count: 'exact', head: true })
      .eq('to_user', user.id).is('read_at', null);
    return error ? 0 : (count ?? 0);
  },
  /** This week's shared action, read directly (row-level security limits it to the couple). */
  async thisWeek(myId: string, partnerName: string | null): Promise<WeekView | null> {
    const { data: a, error } = await supabase.from('weekly_actions').select('id, action, why, week_start, user_a, user_b')
      .eq('week_start', localWeekStart()).or(`user_a.eq.${myId},user_b.eq.${myId}`)
      .order('user_b', { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
    if (error || !a) return null;
    const { data: cs } = await supabase.from('weekly_checkins').select('user_id, status').eq('action_id', a.id);
    const partnerId = a.user_a === myId ? a.user_b : a.user_a;
    const status = (id: string | null) => (id ? (cs ?? []).find(c => c.user_id === id)?.status ?? null : null) as CheckinStatus | null;
    return { id: a.id, action: a.action, why: a.why, week_start: a.week_start, mine: status(myId), partner: status(partnerId), partner_name: partnerId ? partnerName : null };
  },
  async myId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  },
  async plan(id: string): Promise<Plan | null> {
    const { data, error } = await supabase.from('plans').select('*').eq('id', id).maybeSingle();
    return error ? null : (data as Plan | null);
  },
  /** Plans waiting for you to pick a time, and confirmed plans coming up, for the top of Home. */
  async homePlans(): Promise<Plan[]> {
    const me = await this.myId();
    if (!me) return [];
    const { data, error } = await supabase.from('plans').select('*').in('status', ['proposed', 'confirmed'])
      .order('created_at', { ascending: false }).limit(10);
    if (error || !data) return [];
    const now = Date.now();
    return (data as Plan[]).filter(p => p.status === 'proposed'
      ? p.partner_id === me
      : (() => { const o = p.options.find(x => x.id === p.chosen_option); return !!o && new Date(o.starts_at).getTime() > now && new Date(o.starts_at).getTime() - now < 14 * 86400000; })());
  },
  /** Your private calendar feed (Google, Apple, Outlook). Reset revokes the old link. */
  async calendarFeed(reset = false): Promise<{ https: string; webcal: string; google: string } | null> {
    const { data, error } = await supabase.rpc('my_calendar_token', { p_reset: reset });
    if (error || !data) return null;
    const https = `${supabaseUrl}/functions/v1/belluh-calendar?token=${data}`;
    const webcal = https.replace(/^https?:/, 'webcal:');
    return { https, webcal, google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}` };
  },
  /** Belluh's latest word to you, for the top of Home. `live` is false before Belluh's server is set up. */
  async latest(): Promise<{ live: boolean; message: AgentMessage | null }> {
    const { data, error } = await supabase.from('agent_messages').select('id, role, body, meta, created_at')
      .eq('role', 'belluh').order('created_at', { ascending: false }).limit(1);
    if (error) return { live: false, message: null };
    return { live: true, message: (data?.[0] as AgentMessage) ?? null };
  },
  /** True when Belluh has posted a weekly insight or check-in since you last opened the Belluh tab. */
  async hasNewFromBelluh(): Promise<boolean> {
    let since = '';
    try { since = localStorage.getItem(SEEN_KEY) ?? ''; } catch { /* ignore */ }
    let q = supabase.from('agent_messages').select('id', { count: 'exact', head: true })
      .or('role.eq.plan,and(role.eq.belluh,meta->>kind.in.(weekly,checkin,reminder,plan_confirmed,plan_declined,plan_cancelled))');
    if (since) q = q.gt('created_at', since);
    const { count, error } = await q;
    return !error && (count ?? 0) > 0;
  },
  /** Saves your time zone so Belluh's Sunday and Wednesday arrive at the right local time. Silent, no setup. */
  async saveTimeZone(userId: string): Promise<void> {
    const timezone = tz();
    try {
      if (localStorage.getItem('belluh_tz') === `${userId}:${timezone}`) return;
    } catch { /* ignore */ }
    const { error } = await supabase.from('agent_settings').upsert({ user_id: userId, timezone, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (!error) { try { localStorage.setItem('belluh_tz', `${userId}:${timezone}`); } catch { /* ignore */ } }
  },
  markBelluhSeen() {
    try { localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch { /* ignore */ }
  },
  async markNotesRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('partner_notes').update({ read_at: new Date().toISOString() }).eq('to_user', user.id).is('read_at', null);
  },
};
