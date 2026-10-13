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
import { localDateParts } from '../_shared/occasions.ts';
import {
  weekStart, previousWeekStart, isWeeklyDue, isCheckinDue, pairOf, pairActionPrompt, personalInsightInstruction,
  validateAction, checkinMessage, ACTION_SCHEMA, INSIGHT_SCHEMA, type LastWeek, type CheckinStatus,
} from '../_shared/weekly.ts';
import { sameSecret } from '../_shared/secret.ts';
import { db, loadCtx, buildSystem, addMessage, weekAction, type Ctx, type WeekAction } from '../_shared/agentdb.ts';

const ACTIVE_DAYS = 14; // only people who've written recently get a weekly insight

async function alreadyPosted(userId: string, kind: 'weekly' | 'checkin', week: string) {
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
  return msg ? 'sent' : 'already';
}

Deno.serve(async (req) => {
  if (!(await sameSecret(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET')))) return new Response('Forbidden', { status: 403 });

  const url = new URL(req.url);
  const force = url.searchParams.get('force');
  const onlyUser = url.searchParams.get('user');

  let q = db.from('agent_settings').select('user_id, timezone').eq('weekly_enabled', true);
  if (onlyUser) q = q.eq('user_id', onlyUser);
  const { data: people, error } = await q;
  if (error) return new Response(error.message, { status: 500 });

  const now = new Date();
  const results: Record<string, number> = {};
  for (const p of people ?? []) {
    let local;
    try { local = localDateParts(now, p.timezone); } catch { local = localDateParts(now, 'America/New_York'); }
    const doWeekly = force === 'weekly' || (!force && isWeeklyDue(local));
    const doCheckin = force === 'checkin' || (!force && isCheckinDue(local));
    if (!doWeekly && !doCheckin) continue;
    try {
      const ctx = await loadCtx(p.user_id, p.timezone);
      const ws = weekStart(local);
      const r = doWeekly ? `weekly_${await weekly(ctx, ws)}` : `checkin_${await checkin(ctx, ws)}`;
      results[r] = (results[r] ?? 0) + 1;
    } catch (e) {
      console.error('belluh-weekly', p.user_id, e);
      results.error = (results.error ?? 0) + 1;
    }
  }
  return Response.json({ people: people?.length ?? 0, ...results });
});
