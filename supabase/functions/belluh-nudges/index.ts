// Belluh reaching out on its own. Every 5 minutes:
//   reminders Belluh set when someone asked ("remind me to call his mom Sunday at 5"), sent when they're due;
//   hourly, the things Bella is watching for (tickets going on sale, a price drop), told the first time they're there;
//   and, checked hourly in the daytime (each sent once), an offer to plan a birthday or anniversary 10 to 14 days out, one nudge on a plan
//   waiting for your answer, and "how was it?" the day after a plan you made together.
// Everything lands in the Belluh tab and on Home, as a notification, and by text if they connected a phone or Telegram.
//
// Deploy with: supabase functions deploy belluh-nudges --no-verify-jwt
// Called by pg_cron with the x-cron-secret header (see docs/belluh-agent.md).
// Testing: ?force=daily&user=<uuid> ignores the time of day.

import { readyForFollowUp, followUpText } from '../_shared/bookings.ts';
import { cleanReply } from '../_shared/agent.ts';
import { jsonAnswer } from '../_shared/gemini.ts';
import { localDateParts, type StoredOccasion } from '../_shared/occasions.ts';
import { sameSecret } from '../_shared/secret.ts';
import { db, loadCtx, buildSystem, addMessage, type Ctx } from '../_shared/agentdb.ts';
import { notify } from '../_shared/notify.ts';
import { countryOf } from '../_shared/region.ts';
import { searchShopify } from '../_shared/shopify.ts';
import { parseTicketmaster, eventFound, priceFound, ticketmasterUrl, foundText, type Watch } from '../_shared/watches.ts';
import { planChoices, logActivity } from '../_shared/agentcore.ts';
import { proactivityOf, offerWindow, type Proactivity } from '../_shared/activity.ts';
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
    await logActivity(r.user_id, 'sent_reminder', r.body);
    sent++;
  }
  return sent;
}

/**
 * Things Bella is watching for (tickets going on sale, a price dropping), checked once an hour, oldest check first.
 * The first time one is there, Bella tells them and stops watching it. Ticketmaster allows 5 calls a second.
 */
async function checkWatches(onlyUser: string | null): Promise<{ checked: number; found: number }> {
  const today = new Date().toISOString().slice(0, 10);
  await db.from('watches').update({ status: 'expired' }).eq('status', 'watching').lt('until_on', today);
  let q = db.from('watches').select('id, user_id, kind, what, place, max_cents, until_on').eq('status', 'watching')
    .order('checked_at', { ascending: true, nullsFirst: true }).limit(150);
  if (onlyUser) q = q.eq('user_id', onlyUser);
  const { data } = await q;
  const key = Deno.env.get('TICKETMASTER_API_KEY');
  let checked = 0, found = 0;
  for (const w of (data ?? []) as (Watch & { id: string; user_id: string })[]) {
    let hit = null;
    try {
      if (w.kind === 'event') {
        if (!key) continue;
        const { data: st } = await db.from('agent_settings').select('timezone, country').eq('user_id', w.user_id).maybeSingle();
        const r = await fetch(ticketmasterUrl(w, countryOf(st?.country ?? null, st?.timezone ?? 'America/New_York'), key), { signal: AbortSignal.timeout(8000) });
        if (!r.ok) { if (r.status === 429) break; continue; }
        hit = eventFound(w, parseTicketmaster(await r.json()));
        await new Promise(res => setTimeout(res, 220));
      } else {
        hit = priceFound(w, await searchShopify(w.what, w.max_cents ? w.max_cents / 100 : null, 8));
      }
    } catch (e) { console.error('watch', w.id, e); continue; }
    checked++;
    if (!hit) { await db.from('watches').update({ checked_at: new Date().toISOString() }).eq('id', w.id); continue; }
    // Claim it, so two overlapping runs can't both send it
    const { data: claimed } = await db.from('watches').update({ status: 'found', found: hit, checked_at: new Date().toISOString() }).eq('id', w.id).eq('status', 'watching').select('id');
    if (!claimed?.length) continue;
    const body = foundText(w, hit);
    await addMessage(w.user_id, 'belluh', body.replace(/ Here it is: \S+$| here is the link: \S+$/, ''), { kind: 'watch_found', week: w.id, watch_id: w.id, links: [{ label: hit.title.slice(0, 80), url: hit.url }] });
    await logActivity(w.user_id, 'watch_found', hit.title);
    await notify(w.user_id, body, { title: 'Bella found it', push: body.replace(/ https:\S+$/, ''), tag: `watch-${w.id}` });
    found++;
  }
  return { checked, found };
}

async function plansFor(ctx: Ctx): Promise<NudgePlan[]> {
  const { data } = await db.from('plans').select('id, created_by, partner_id, title, status, options, chosen_option, created_at')
    .or(`created_by.eq.${ctx.userId},partner_id.eq.${ctx.userId}`).order('created_at', { ascending: false }).limit(30);
  return (data ?? []) as NudgePlan[];
}

/** Offer to plan a birthday or anniversary, in one specific line drawn from their journal when Belluh has one. */
async function offer(ctx: Ctx, plans: NudgePlan[], today: ReturnType<typeof localDateParts>, level: Proactivity): Promise<boolean> {
  const { data: occ } = await db.from('occasions').select('id, label, kind, month, day, year, repeats_yearly, mentioned_at').eq('user_id', ctx.userId);
  const pick = occasionToOffer((occ ?? []) as OfferOccasion[], plans, today, ctx.timezone, offerWindow(level));
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
  if (msg) { await notify(ctx.userId, `${body}\n\nReply PLAN IT or NOT NOW.`, { push: body, tag: 'offer' }); await logActivity(ctx.userId, 'offered_plan', pick.occasion.label); }
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
      await logActivity(ctx.userId, 'nudged_plan', p.title);
      await notify(ctx.userId, `${body} Pick one:\n${planChoices(p.options, ctx.timezone)}\n\nReply ${p.options.map((_, i) => i + 1).join(', ')}, or NONE.`, { push: `${body} Tap to pick.`, tag: 'plan' });
    }
  }
  return n;
}

/** After something they booked through Belluh: "How was it?", so the moment lands in the journal. */
async function afterBookings(ctx: Ctx): Promise<number> {
  let n = 0;
  const since = new Date(Date.now() - 10 * 86_400_000).toISOString();
  const { data } = await db.from('bookings').select('id, user_id, kind, title, starts_at, ends_at, all_day, surprise').eq('status', 'booked')
    .gte('starts_at', since).or(`user_id.eq.${ctx.userId},and(partner_id.eq.${ctx.userId},surprise.eq.false)`);
  for (const b of data ?? []) {
    if (!readyForFollowUp(b)) continue;
    if (await posted(ctx.userId, 'after_plan', b.id)) continue;
    const body = followUpText(b, b.user_id === ctx.userId ? ctx.partnerName : null);
    const msg = await addMessage(ctx.userId, 'belluh', body, { kind: 'after_plan', week: b.id, booking_id: b.id, prompt: `How was ${b.title}?` });
    if (msg) { n++; await logActivity(ctx.userId, 'asked_how_it_went', b.title); await notify(ctx.userId, body, { push: body, tag: 'after-plan' }); }
  }
  return n;
}

async function afterPlans(ctx: Ctx, plans: NudgePlan[]): Promise<number> {
  let n = 0;
  for (const p of plansJustHappened(plans, ctx.userId)) {
    if (await posted(ctx.userId, 'after_plan', p.id)) continue;
    const body = `How was "${p.title}"? Tell me a line or two while it's fresh and I'll keep it in your journal.`;
    const msg = await addMessage(ctx.userId, 'belluh', body, { kind: 'after_plan', week: p.id, plan_id: p.id, prompt: `How was ${p.title}?` });
    if (msg) { n++; await logActivity(ctx.userId, 'asked_how_it_went', p.title); await notify(ctx.userId, body, { push: body, tag: 'after-plan' }); }
  }
  return n;
}

Deno.serve(async (req) => {
  if (!(await sameSecret(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET')))) return new Response('Forbidden', { status: 403 });
  const url = new URL(req.url);
  const force = url.searchParams.get('force');
  const onlyUser = url.searchParams.get('user');

  const results: Record<string, number> = { reminders_sent: await dueReminders(onlyUser) };

  let q = db.from('agent_settings').select('user_id, timezone, reminders_enabled, proactivity');
  if (onlyUser) q = q.eq('user_id', onlyUser);
  const { data: people, error } = await q;
  if (error) return new Response(error.message, { status: 500 });
  const now = new Date();
  // The daily checks run once an hour (the job itself runs every 5 minutes for reminders)
  if (force !== 'daily' && now.getUTCMinutes() >= 5) return Response.json({ people: 0, ...results });
  { const w = await checkWatches(onlyUser); results.watches_checked = w.checked; results.watches_found = w.found; }
  for (const p of people ?? []) {
    // Quiet: only what they asked for (reminders and watches, above); nothing Bella thinks of herself
    const level = proactivityOf((p as any).proactivity);
    if (p.reminders_enabled === false || level === 'quiet') continue;
    let local;
    try { local = localDateParts(now, p.timezone); } catch { local = localDateParts(now, 'America/New_York'); }
    if (force !== 'daily' && !daytime(local.hour)) continue;
    try {
      const ctx = await loadCtx(p.user_id, p.timezone);
      const plans = await plansFor(ctx);
      if (await offer(ctx, plans, local, level)) results.offers = (results.offers ?? 0) + 1;
      results.plan_nudges = (results.plan_nudges ?? 0) + await nudgePlans(ctx, plans);
      results.after_plans = (results.after_plans ?? 0) + await afterPlans(ctx, plans);
      results.after_bookings = (results.after_bookings ?? 0) + await afterBookings(ctx);
    } catch (e) {
      console.error('belluh-nudges', p.user_id, e);
      results.error = (results.error ?? 0) + 1;
    }
  }
  return Response.json({ people: people?.length ?? 0, ...results });
});
