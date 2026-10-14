// Hourly job for Belluh's weekly loop, run in each person's own time zone.
//   Sunday from 9am:   one small thing for the couple to try together (written only from SHARED entries,
//                      because both see it), plus a private insight for each person in their Belluh thread.
//   Wednesday from 6pm: a one-tap check-in, unless they've already answered.
// Next Sunday's suggestion builds on how last week went.
//
// Deploy with: supabase functions deploy belluh-weekly --no-verify-jwt
// Called by pg_cron with the x-cron-secret header (see docs/belluh-agent.md).
// Testing: ?force=weekly|checkin&user=<uuid> ignores the day and hour.

import { cleanReply, visibleEntries, factsBlock, type EntryRow } from '../_shared/agent.ts';
import { jsonAnswer } from '../_shared/gemini.ts';
import { localDateParts, nextOccurrence, daysBetween, reminderStage, reminderParams, isoDate, type StoredOccasion } from '../_shared/occasions.ts';
import {
  weekStart, previousWeekStart, isWeeklyDue, isCheckinDue, pairOf, pairActionPrompt, personalInsightInstruction,
  validateAction, checkinMessage, ACTION_SCHEMA, INSIGHT_SCHEMA, type LastWeek, type CheckinStatus,
} from '../_shared/weekly.ts';
import { sameSecret } from '../_shared/secret.ts';
import { db, loadCtx, buildSystem, addMessage, weekAction, type Ctx, type WeekAction } from '../_shared/agentdb.ts';
import { notify } from '../_shared/notify.ts';

const ACTIVE_DAYS = 14; // only people who've written recently get a weekly insight

async function alreadyPosted(userId: string, kind: 'weekly' | 'checkin' | 'reminder', week: string) {
  const { count } = await db.from('agent_messages').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('meta->>kind', kind).eq('meta->>week', week);
  return (count ?? 0) > 0;
}

async function lastWeekFor(ctx: Ctx, ws: string): Promise<LastWeek | null> {
  const { action, checkins } = await weekAction(ctx, previousWeekStart(ws));
  if (!action) return null;
  const name = (id: string) => (id === ctx.userId ? ctx.myName : ctx.partnerName ?? 'Partner');
  return { action: action.action, checkins: checkins.map(c => ({ name: name(c.user_id), status: c.status as CheckinStatus })) };
}

/** The couple's shared action for the week: made once by whichever partner's Sunday comes first. */
async function ensurePairAction(ctx: Ctx, ws: string, lastWeek: LastWeek | null): Promise<WeekAction | null> {
  const existing = await weekAction(ctx, ws);
  if (existing.action) return existing.action;

  const since = new Date(Date.now() - ACTIVE_DAYS * 864e5).toISOString();
  const ids = ctx.partnerId ? [ctx.userId, ctx.partnerId] : [ctx.userId];
  const { data: rows } = await db.from('journal_entries').select('id, user_id, content, title, is_shared, tags, created_at')
    .in('user_id', ids).eq('is_shared', true).gte('created_at', since).order('created_at', { ascending: false }).limit(60);
  const { data: factRows } = await db.from('journal_entries').select('id, user_id, content, is_shared, tags, created_at')
    .in('user_id', ids).eq('is_shared', true).contains('tags', ['system_facts']).limit(2);
  const names: Record<string, string> = { [ctx.userId]: ctx.myName };
  if (ctx.partnerId) names[ctx.partnerId] = ctx.partnerName ?? 'Partner';

  // Shared entries only (both of them see the result); system rows like circle settings never count as writing
  const entries = visibleEntries(ctx.userId, ctx.partnerId ? [ctx.partnerId] : [], (rows ?? []) as EntryRow[]).filter(e => e.is_shared === true);
  const prompt = pairActionPrompt({ names, entries, lastWeek, today: ws, facts: factsBlock((factRows ?? []) as EntryRow[], names) });
  const picked = validateAction(await jsonAnswer('You are Belluh. Answer with JSON only.', prompt, ACTION_SCHEMA));
  if (!picked) return null;

  const { error } = await db.from('weekly_actions').insert({ ...pairOf(ctx.userId, ctx.partnerId), week_start: ws, ...picked });
  if (error && error.code !== '23505') { console.error('weekly action insert', error); return null; }
  return (await weekAction(ctx, ws)).action; // the partner's run may have won the race; use whichever exists
}

async function weekly(ctx: Ctx, ws: string) {
  if (await alreadyPosted(ctx.userId, 'weekly', ws)) return 'already';
  const since = new Date(Date.now() - ACTIVE_DAYS * 864e5).toISOString();
  const { count } = await db.from('journal_entries').select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.userId).gte('created_at', since);
  if (!count) return 'inactive';

  const lastWeek = await lastWeekFor(ctx, ws);
  const action = await ensurePairAction(ctx, ws, lastWeek);
  const out = await jsonAnswer(await buildSystem(ctx), personalInsightInstruction(action?.action ?? null, lastWeek), INSIGHT_SCHEMA) as { insight?: unknown } | null;
  let insight = cleanReply(typeof out?.insight === 'string' ? out.insight : '').slice(0, 1200);
  if (insight.length < 20) {
    if (!action) return 'failed';
    insight = "Here's one small thing to try together this week.";
  }
  const msg = await addMessage(ctx.userId, 'belluh', insight, {
    kind: 'weekly', week: ws, ...(action ? { action_id: action.id, action: action.action, why: action.why } : {}),
  });
  if (msg) await notify(ctx.userId, action ? `${insight}\n\nThis week, together: "${action.action}"\nReply DID IT once you have.` : insight, { title: 'Your week, from Belluh', push: insight, tag: 'weekly' });
  return msg ? 'sent' : 'already';
}

async function checkin(ctx: Ctx, ws: string) {
  const { action, checkins } = await weekAction(ctx, ws);
  if (!action) return 'no_action';
  if (checkins.some(c => c.user_id === ctx.userId && c.status !== 'not_yet')) return 'answered';
  if (await alreadyPosted(ctx.userId, 'checkin', ws)) return 'already';
  const msg = await addMessage(ctx.userId, 'belluh', checkinMessage(action.action, ctx.partnerName), {
    kind: 'checkin', week: ws, action_id: action.id, action: action.action,
  });
  if (msg) await notify(ctx.userId, `${checkinMessage(action.action, ctx.partnerName)}\nReply DID IT, NOT YET or SKIP.`, { push: checkinMessage(action.action, ctx.partnerName), tag: 'checkin' });
  return msg ? 'sent' : 'already';
}

const REMINDER_HOUR = Number(Deno.env.get('REMINDER_LOCAL_HOUR') ?? 9);

/** In-app date reminders, a week before and on the day: the same schedule and wording as WhatsApp. */
async function reminders(ctx: Ctx, local: ReturnType<typeof localDateParts>): Promise<number> {
  const { data: occ } = await db.from('occasions')
    .select('id, label, kind, month, day, year, repeats_yearly, mentioned_at').eq('user_id', ctx.userId);
  let sent = 0;
  for (const o of (occ ?? []) as (StoredOccasion & { id: string })[]) {
    const next = nextOccurrence(o, local);
    if (!next) continue;
    const stage = reminderStage(daysBetween(local, next));
    if (!stage) continue;
    const key = `${o.id}:${isoDate(next)}:${stage}`;
    if (await alreadyPosted(ctx.userId, 'reminder', key)) continue;
    const [label, when, date, told] = reminderParams(o, stage, ctx.timezone);
    const body = stage === 'day_of'
      ? `${label} is today. You first told me about it on ${told}. Want a hand with something small for it?`
      : `${label} is ${when}, ${date}. You first told me about it on ${told}. Want a few ideas?`;
    if (await addMessage(ctx.userId, 'belluh', body, { kind: 'reminder', week: key, occasion_id: o.id })) { sent++; await notify(ctx.userId, body, { pushOnly: true, tag: 'reminder' }); }
  }
  return sent;
}

Deno.serve(async (req) => {
  if (!(await sameSecret(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET')))) return new Response('Forbidden', { status: 403 });

  const url = new URL(req.url);
  const force = url.searchParams.get('force');
  const onlyUser = url.searchParams.get('user');

  let q = db.from('agent_settings').select('user_id, timezone, weekly_enabled, reminders_enabled');
  if (onlyUser) q = q.eq('user_id', onlyUser);
  const { data: people, error } = await q;
  if (error) return new Response(error.message, { status: 500 });

  const now = new Date();
  const results: Record<string, number> = {};
  for (const p of people ?? []) {
    let local;
    try { local = localDateParts(now, p.timezone); } catch { local = localDateParts(now, 'America/New_York'); }
    const weeklyOn = p.weekly_enabled !== false;
    const doWeekly = weeklyOn && (force === 'weekly' || (!force && isWeeklyDue(local)));
    const doCheckin = weeklyOn && (force === 'checkin' || (!force && isCheckinDue(local)));
    const doReminders = p.reminders_enabled !== false && (force === 'reminders' || (!force && local.hour >= REMINDER_HOUR));
    if (!doWeekly && !doCheckin && !doReminders) continue;
    try {
      const ctx = await loadCtx(p.user_id, p.timezone);
      const ws = weekStart(local);
      if (doWeekly || doCheckin) {
        const r = doWeekly ? `weekly_${await weekly(ctx, ws)}` : `checkin_${await checkin(ctx, ws)}`;
        results[r] = (results[r] ?? 0) + 1;
      }
      if (doReminders) results.reminders_sent = (results.reminders_sent ?? 0) + await reminders(ctx, local);
    } catch (e) {
      console.error('belluh-weekly', p.user_id, e);
      results.error = (results.error ?? 0) + 1;
    }
  }
  return Response.json({ people: people?.length ?? 0, ...results });
});
