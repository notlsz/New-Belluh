// The app's side of ideas, goals and watches: what Bella could take on now, adding to a goal with a tap, and stopping
// a goal or a watch. Every call checks the goal or watch belongs to this person (or, for goals, to their partner too).

import { db, type Ctx } from './agentdb.ts';
import { localDateParts } from './occasions.ts';
import { buildIdeas, type Idea } from './ideas.ts';
import { logProgress, type Goal, type Step } from './goals.ts';
import { proactivityOf } from './activity.ts';

export async function ideasFor(ctx: Ctx): Promise<{ ideas: Idea[] }> {
  const today = localDateParts(new Date(), ctx.timezone);
  const pair = `created_by.eq.${ctx.userId},partner_id.eq.${ctx.userId}`;
  const [occ, mem, plans, goals, watches, lastOut] = await Promise.all([
    db.from('occasions').select('label, kind, month, day, year, repeats_yearly').eq('user_id', ctx.userId),
    db.from('agent_memories').select('fact').eq('user_id', ctx.userId).order('created_at', { ascending: false }).limit(60),
    // Plans waiting on this person's answer
    db.from('plans').select('id, title').eq('partner_id', ctx.userId).eq('status', 'proposed').limit(3),
    db.from('couple_goals').select('id, kind, title, target, progress, currency, period, period_key, due_on, status, steps').eq('status', 'active').or(pair).limit(12),
    db.from('watches').select('id, what').eq('user_id', ctx.userId).eq('status', 'watching').limit(5),
    db.from('bookings').select('starts_at').eq('status', 'booked').or(`user_id.eq.${ctx.userId},partner_id.eq.${ctx.userId}`)
      .lte('starts_at', new Date().toISOString()).order('starts_at', { ascending: false }).limit(1),
  ]);
  return { ideas: buildIdeas({
    country: ctx.country,
    occasions: (occ.data ?? []) as any,
    memories: (mem.data ?? []).map(m => m.fact),
    waitingPlans: (plans.data ?? []) as any,
    goals: (goals.data ?? []) as Goal[],
    watches: (watches.data ?? []) as any,
    lastTogether: lastOut.data?.[0]?.starts_at ?? null,
  }, today) };
}

async function ownGoal(ctx: Ctx, id: string) {
  const { data } = await db.from('couple_goals').select('*').eq('id', id).maybeSingle();
  return data && (data.created_by === ctx.userId || data.partner_id === ctx.userId) ? data as Goal & { id: string } : null;
}

/** One more date night, 50 more toward Kyoto: from a tap in the app. */
export async function goalLog(ctx: Ctx, id: string, amount: number) {
  const g = await ownGoal(ctx, id);
  if (!g || g.status !== 'active') return { status: 404, body: { error: 'Goal not found' } };
  const next = logProgress(g, amount, localDateParts(new Date(), ctx.timezone));
  if (!next) return { status: 400, body: { error: 'That amount does not work for this goal.' } };
  const { data } = await db.from('couple_goals').update({ progress: next.progress, period_key: next.period_key, ...(next.done ? { status: 'done' } : {}), updated_at: new Date().toISOString() })
    .eq('id', id).select('*').single();
  return { status: 200, body: { goal: data, reached: next.done } };
}

export async function goalStop(ctx: Ctx, id: string) {
  const g = await ownGoal(ctx, id);
  if (!g) return { status: 404, body: { error: 'Goal not found' } };
  await db.from('couple_goals').update({ status: 'stopped', updated_at: new Date().toISOString() }).eq('id', id);
  return { status: 200, body: { ok: true } };
}

export async function watchStop(ctx: Ctx, id: string) {
  const { data } = await db.from('watches').update({ status: 'stopped' }).eq('id', id).eq('user_id', ctx.userId).select('id');
  return data?.length ? { status: 200, body: { ok: true } } : { status: 404, body: { error: 'Watch not found' } };
}

/** Tick a step of a goal's action plan (or untick it). */
export async function goalStep(ctx: Ctx, id: string, index: number, done: boolean) {
  const g = await ownGoal(ctx, id);
  if (!g || g.status !== 'active') return { status: 404, body: { error: 'Goal not found' } };
  const steps = [...((g.steps ?? []) as Step[])];
  if (!Number.isInteger(index) || index < 0 || index >= steps.length) return { status: 400, body: { error: 'No such step' } };
  steps[index] = { ...steps[index], done };
  const { data } = await db.from('couple_goals').update({ steps, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  return { status: 200, body: { goal: data } };
}

/**
 * Everything Bella did for this person (newest first) and everything she has lined up: reminders she'll send,
 * things she's watching for, plans waiting on their partner. Plus how often she reaches out on her own.
 */
export async function activityFor(ctx: Ctx) {
  const [done, reminders, watches, plans, settings] = await Promise.all([
    db.from('agent_activity').select('id, action, detail, ok, channel, created_at').eq('user_id', ctx.userId).order('created_at', { ascending: false }).limit(60),
    db.from('personal_reminders').select('id, body, due_at').eq('user_id', ctx.userId).eq('status', 'scheduled').order('due_at').limit(20),
    db.from('watches').select('id, what, until_on').eq('user_id', ctx.userId).eq('status', 'watching').limit(10),
    db.from('plans').select('id, title').eq('created_by', ctx.userId).eq('status', 'proposed').limit(10),
    db.from('agent_settings').select('proactivity, reminders_enabled').eq('user_id', ctx.userId).maybeSingle(),
  ]);
  const planned = [
    ...(reminders.data ?? []).map(r => ({ kind: 'reminder' as const, id: r.id, detail: r.body, at: r.due_at })),
    ...(watches.data ?? []).map(w => ({ kind: 'watch' as const, id: w.id, detail: w.what, at: `${w.until_on}T12:00:00Z` })),
    ...(plans.data ?? []).map(p => ({ kind: 'plan' as const, id: p.id, detail: p.title, at: null })),
  ];
  return { done: done.data ?? [], planned, proactivity: settings.data?.reminders_enabled === false ? 'quiet' : proactivityOf(settings.data?.proactivity) };
}
