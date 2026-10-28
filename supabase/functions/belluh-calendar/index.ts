// A private calendar feed: subscribe once in Google, Apple or Outlook Calendar and Belluh's
// confirmed plans and saved dates stay in sync. The link carries a secret token; resetting it in
// the app revokes the old link.
// Deploy with: supabase functions deploy belluh-calendar --no-verify-jwt   (calendar apps can't sign in)

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { icsCalendar, localDateOf, type CalDate, type CalEvent, type PlanOption } from '../_shared/plans.ts';
import { serverKey } from '../_shared/keys.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return new Response('Not found', { status: 404 });
  const { data: feed } = await db.from('calendar_feeds').select('user_id').eq('token', token).maybeSingle();
  if (!feed) return new Response('Not found', { status: 404 });
  const me = feed.user_id as string;

  const [{ data: plans }, { data: occ }, { data: booked }, { data: settings }] = await Promise.all([
    db.from('plans').select('id, title, details, options, chosen_option').eq('status', 'confirmed').or(`created_by.eq.${me},partner_id.eq.${me}`),
    db.from('occasions').select('id, label, month, day, year, repeats_yearly, source_message').eq('user_id', me),
    // What either of you booked through Belluh, except surprises meant for you
    db.from('bookings').select('id, user_id, kind, title, place, url, starts_at, ends_at, all_day, surprise').eq('status', 'booked').not('starts_at', 'is', null)
      .or(`user_id.eq.${me},and(partner_id.eq.${me},surprise.eq.false)`),
    db.from('agent_settings').select('timezone').eq('user_id', me).maybeSingle(),
  ]);
  const tz = settings?.timezone ?? 'America/New_York';
  const ymd = (iso: string, plusDays = 0) => { const d = localDateOf(new Date(new Date(iso).getTime() + plusDays * 86_400_000).toISOString(), tz); return `${d.y}${String(d.m).padStart(2, '0')}${String(d.d).padStart(2, '0')}`; };
  const events: CalEvent[] = (plans ?? []).flatMap(p => {
    const o = (p.options as PlanOption[]).find(x => x.id === p.chosen_option);
    return o ? [{ uid: `plan-${p.id}`, title: p.title, starts_at: o.starts_at, minutes: o.minutes, details: p.details ?? 'Planned together in Belluh' }] : [];
  });
  for (const b of booked ?? []) {
    const details = [b.place, b.url, 'Booked through Belluh'].filter(Boolean).join('\n');
    events.push(b.all_day
      ? { uid: `booking-${b.id}`, title: b.title, starts_at: b.starts_at, minutes: 1440, details, days: { start: ymd(b.starts_at), end: ymd(b.ends_at ?? b.starts_at, 1) } }
      : { uid: `booking-${b.id}`, title: b.title, starts_at: b.starts_at, minutes: 120, details });
  }
  // Plans already appear as timed events; don't repeat them as all-day dates
  const dates: CalDate[] = (occ ?? []).filter(o => o.source_message !== 'Planned together in Belluh')
    .map(o => ({ uid: `date-${o.id}`, title: o.label, month: o.month, day: o.day, year: o.year, repeats_yearly: o.repeats_yearly }));

  return new Response(icsCalendar('Belluh', events, dates), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=900', 'Content-Disposition': 'inline; filename="belluh.ics"' },
  });
});
