// Database helpers shared by the Belluh agent and its weekly job. Uses the service role,
// so every query here applies the privacy rule itself (see visibleEntries).

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  visibleEntries, entriesBlock, occasionsBlock, systemPrompt, type EntryRow, type OccasionRow,
} from './agent.ts';
import { localDateParts, isoDate } from './occasions.ts';
import { weekStart, pairOf, type CheckinStatus } from './weekly.ts';

export const db: SupabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

export interface Ctx {
  userId: string;
  myName: string;
  partnerId: string | null;
  partnerName: string | null;
  partnerIds: string[];
  timezone: string;
}

const first = (n?: string | null) => (n ?? '').trim().split(/\s+/)[0] || null;

export async function loadCtx(userId: string, timezone: string): Promise<Ctx> {
  const { data: conns } = await db.from('partner_connections')
    .select('user_id, partner_id, created_at').eq('status', 'connected').or(`user_id.eq.${userId},partner_id.eq.${userId}`)
    .order('created_at', { ascending: true });
  const partnerIds = [...new Set((conns ?? []).map(c => (c.user_id === userId ? c.partner_id : c.user_id)))];
  const { data: profiles } = await db.from('profiles').select('id, full_name, partner_name').in('id', [userId, ...partnerIds]);
  const me = profiles?.find(p => p.id === userId);
  const partnerId = partnerIds[0] ?? null;
  const partnerProfile = profiles?.find(p => p.id === partnerId);
  return {
    userId, partnerIds, partnerId, timezone,
    myName: first(me?.full_name) ?? 'there',
    partnerName: first(partnerProfile?.full_name) ?? first(me?.partner_name) ?? null,
  };
}

export interface WeekAction { id: string; action: string; why: string | null; week_start: string }

/** This week's shared action for the person and their partner, with who has checked in. */
export async function weekAction(ctx: Ctx, start?: string): Promise<{ action: WeekAction | null; checkins: { user_id: string; status: CheckinStatus }[] }> {
  const ws = start ?? weekStart(localDateParts(new Date(), ctx.timezone));
  const pair = pairOf(ctx.userId, ctx.partnerId);
  let q = db.from('weekly_actions').select('id, action, why, week_start').eq('user_a', pair.user_a).eq('week_start', ws);
  q = pair.user_b ? q.eq('user_b', pair.user_b) : q.is('user_b', null);
  const { data: action } = await q.maybeSingle();
  if (!action) return { action: null, checkins: [] };
  const { data: checkins } = await db.from('weekly_checkins').select('user_id, status').eq('action_id', action.id);
  return { action, checkins: (checkins ?? []) as { user_id: string; status: CheckinStatus }[] };
}

/** What the app shows for this week: the shared action plus each person's check-in. */
export async function weekView(ctx: Ctx) {
  const { action, checkins } = await weekAction(ctx);
  if (!action) return null;
  const status = (id: string | null) => (id ? checkins.find(c => c.user_id === id)?.status ?? null : null);
  return { ...action, mine: status(ctx.userId), partner: status(ctx.partnerId), partner_name: ctx.partnerName };
}

export async function buildSystem(ctx: Ctx): Promise<string> {
  const today = localDateParts(new Date(), ctx.timezone);
  const { data: rows } = await db.from('journal_entries')
    .select('id, user_id, content, title, mood, is_shared, tags, created_at')
    .in('user_id', [ctx.userId, ...ctx.partnerIds])
    .order('created_at', { ascending: false }).limit(200);
  const entries = visibleEntries(ctx.userId, ctx.partnerIds, (rows ?? []) as EntryRow[]);
  const names: Record<string, string> = { [ctx.userId]: ctx.myName };
  if (ctx.partnerId && ctx.partnerName) names[ctx.partnerId] = ctx.partnerName;

  const { data: mem } = await db.from('agent_memories').select('fact').eq('user_id', ctx.userId).order('created_at').limit(60);
  const { data: occ } = await db.from('occasions').select('label, month, day, year, repeats_yearly').eq('user_id', ctx.userId);
  const wk = await weekAction(ctx).catch(() => ({ action: null, checkins: [] }));
  const words: Record<string, string> = { done: 'did it', not_yet: 'not yet', skipped: 'skipped' };
  const weekly = wk.action
    ? `"${wk.action.action}"` + (wk.checkins.length ? ` (${wk.checkins.map(c => `${names[c.user_id] ?? 'Partner'}: ${words[c.status]}`).join(', ')})` : ' (no check-ins yet)')
    : null;

  return systemPrompt({
    myName: ctx.myName,
    partnerName: ctx.partnerName,
    memories: (mem ?? []).map(m => m.fact),
    entries: entriesBlock(entries, names, ctx.userId),
    dates: occasionsBlock((occ ?? []) as OccasionRow[], today),
    today: isoDate(today),
    weekly,
  });
}

export async function addMessage(userId: string, role: string, body: string, meta: Record<string, unknown> = {}) {
  const { data } = await db.from('agent_messages').insert({ user_id: userId, role, body, meta }).select().single();
  return data;
}

export async function history(userId: string, limit = 60) {
  const { data } = await db.from('agent_messages').select('id, role, body, meta, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  return (data ?? []).reverse();
}
