// Belluh reaching out on its own. Every 5 minutes:
//   reminders Belluh set when someone asked ("remind me to call his mom Sunday at 5"), sent when they're due;
//   and, checked hourly in the daytime (each sent once), an offer to plan a birthday or anniversary 10 to 14 days out, one nudge on a plan
//   waiting for your answer, and "how was it?" the day after a plan you made together.
// Everything lands in the Belluh tab and on Home, as a notification, and by text if they connected a phone or Telegram.
//
// Deploy with: supabase functions deploy belluh-nudges --no-verify-jwt
// Called by pg_cron with the x-cron-secret header (see docs/belluh-agent.md).
// Testing: ?force=daily&user=<uuid> ignores the time of day.

import { cleanReply } from '../_shared/agent.ts';
import { jsonAnswer } from '../_shared/gemini.ts';
import { localDateParts, type StoredOccasion } from '../_shared/occasions.ts';
import { sameSecret } from '../_shared/secret.ts';
import { db, loadCtx, buildSystem, addMessage, type Ctx } from '../_shared/agentdb.ts';
import { notify } from '../_shared/notify.ts';
import { planChoices } from '../_shared/agentcore.ts';
import {
  occasionToOffer, offerFallback, offerAsk, plansToNudge, plansJustHappened, daytime, type NudgePlan, type OfferOccasion,
} from '../_shared/nudges.ts';

async function posted(userId: string, kind: string, key: string) {
  const { count } = await db.from('agent_messages').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('meta->>kind', kind).eq('meta->>week', key);
  return (count ?? 0) > 0;
}

/** Reminders that are due, each sent once even if two runs overlap. */
async function dueReminders(onlyUser: string | null): Promise<number> {
  let q = db.from('personal_reminders').select('id, user_id, body, due_at').eq('status', 'scheduled')
    .lte('due_at', new Date().toISOString()).order('due_at').limit(200);
  if (onlyUser) q = q.eq('user_id', onlyUser);
  const { data } = await q;
  let sent = 0;
  for (const r of data ?? []) {
    const { data: claimed } = await db.from('personal_reminders').update({ status: 'sending' }).eq('id', r.id).eq('status', 'scheduled').select('id');
    if (!claimed?.length) continue;
    const body = `Reminder: ${r.body}`;
    await addMessage(r.user_id, 'belluh', body, { kind: 'remind', week: r.id, reminder_id: r.id });
    await notify(r.user_id, body, { title: 'Belluh reminder', push: r.body, tag: `remind-${r.id}` });
    await db.from('personal_reminders').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', r.id);
    sent++;
  }
  return sent;
}

async function plansFor(ctx: Ctx): Promise<NudgePlan[]> {
  const { data } = await db.from('plans').select('id, created_by, partner_id, title, status, options, chosen_option, created_at')
    .or(`created_by.eq.${ctx.userId},partner_id.eq.${ctx.userId}`).order('created_at', { ascending: false }).limit(30);
  return (data ?? []) as NudgePlan[];
}

/** Offer to plan a birthday or anniversary, in one specific line drawn from their journal when Belluh has one. */
async function offer(ctx: Ctx, plans: NudgePlan[], today: ReturnType<typeof localDateParts>): Promise<boolean> {
  const { data: occ } = await db.from('occasions').select('id, label, kind, month, day, year, repeats_yearly, mentioned_at').eq('user_id', ctx.userId);
  const pick = occasionToOffer((occ ?? []) as OfferOccasion[], plans, today, ctx.timezone);
  if (!pick || await posted(ctx.userId, 'offer', pick.key)) return false;
  const fallback = offerFallback(pick.occasion.label, pick.days, pick.date);
  const out = await jsonAnswer(await buildSystem(ctx),
    `${pick.occasion.label} is in ${pick.days} days. In one or two short sentences, offer to help plan it. Mention one specific thing from their journal or what you remember that would make it personal (a place, something ${ctx.partnerName ?? 'their partner'} said they love). If you know nothing specific, return an empty string. No questions about logistics. Return JSON: {"line": string}.`,
    { type: 'OBJECT', properties: { line: { type: 'STRING' } }, required: ['line'] }).catch(() => null) as { line?: string } | null;
  const line = cleanReply(out?.line ?? '');
  const body = line.length >= 20 ? line : fallback;
  const msg = await addMessage(ctx.userId, 'belluh', body, {
    kind: 'offer', week: pick.key, status: 'open', occasion_id: pick.occasion.id, ask: offerAsk(pick.occasion.label, pick.date),
    actions: ['Help me plan it', 'Not now'],
  });
  if (msg) await notify(ctx.userId, `${body}\n\nReply PLAN IT or NOT NOW.`, { push: body, tag: 'offer' });
  return !!msg;
}

async function nudgePlans(ctx: Ctx, plans: NudgePlan[]): Promise<number> {
  let n = 0;
  for (const p of plansToNudge(plans, ctx.userId)) {
    if (await posted(ctx.userId, 'plan_nudge', p.id)) continue;
    const { data: from } = await db.from('profiles').select('full_name').eq('id', p.created_by).maybeSingle();
    const name = (from?.full_name ?? '').trim().split(/\s+/)[0] || ctx.partnerName || 'Your partner';
    const body = `${name} is still waiting on a time for "${p.title}".`;
    const msg = await addMessage(ctx.userId, 'belluh', body, { kind: 'plan_nudge', week: p.id, plan_id: p.id });
    if (msg) {
      n++;
      await notify(ctx.userId, `${body} Pick one:\n${planChoices(p.options, ctx.timezone)}\n\nReply ${p.options.map((_, i) => i + 1).join(', ')}, or NONE.`, { push: `${body} Tap to pick.`, tag: 'plan' });
    }
  }
  return n;
}

async function afterPlans(ctx: Ctx, plans: NudgePlan[]): Promise<number> {
  let n = 0;
  for (const p of plansJustHappened(plans, ctx.userId)) {
    if (await posted(ctx.userId, 'after_plan', p.id)) continue;
    const body = `How was "${p.title}"? Tell me a line or two while it's fresh and I'll keep it in your journal.`;
    const msg = await addMessage(ctx.userId, 'belluh', body, { kind: 'after_plan', week: p.id, plan_id: p.id, prompt: `How was ${p.title}?` });
    if (msg) { n++; await notify(ctx.userId, body, { push: body, tag: 'after-plan' }); }
  }
  return n;
}

Deno.serve(async (req) => {
  if (!(await sameSecret(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET')))) return new Response('Forbidden', { status: 403 });
  const url = new URL(req.url);
  const force = url.searchParams.get('force');
  const onlyUser = url.searchParams.get('user');

  const results: Record<string, number> = { reminders_sent: await dueReminders(onlyUser) };

  let q = db.from('agent_settings').select('user_id, timezone, reminders_enabled');
  if (onlyUser) q = q.eq('user_id', onlyUser);
  const { data: people, error } = await q;
  if (error) return new Response(error.message, { status: 500 });
  const now = new Date();
  // The daily checks run once an hour (the job itself runs every 5 minutes for reminders)
  if (force !== 'daily' && now.getUTCMinutes() >= 5) return Response.json({ people: 0, ...results });
  for (const p of people ?? []) {
    if (p.reminders_enabled === false) continue;
    let local;
    try { local = localDateParts(now, p.timezone); } catch { local = localDateParts(now, 'America/New_York'); }
    if (force !== 'daily' && !daytime(local.hour)) continue;
    try {
      const ctx = await loadCtx(p.user_id, p.timezone);
      const plans = await plansFor(ctx);
      if (await offer(ctx, plans, local)) results.offers = (results.offers ?? 0) + 1;
      results.plan_nudges = (results.plan_nudges ?? 0) + await nudgePlans(ctx, plans);
      results.after_plans = (results.after_plans ?? 0) + await afterPlans(ctx, plans);
    } catch (e) {
      console.error('belluh-nudges', p.user_id, e);
      results.error = (results.error ?? 0) + 1;
    }
  }
  return Response.json({ people: people?.length ?? 0, ...results });
});
