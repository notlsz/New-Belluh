// A private calendar feed: subscribe once in Google, Apple or Outlook Calendar and Belluh's
// confirmed plans and saved dates stay in sync. The link carries a secret token; resetting it in
// the app revokes the old link.
// Deploy with: supabase functions deploy belluh-calendar --no-verify-jwt   (calendar apps can't sign in)

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { icsCalendar, type CalDate, type CalEvent, type PlanOption } from '../_shared/plans.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return new Response('Not found', { status: 404 });
  const { data: feed } = await db.from('calendar_feeds').select('user_id').eq('token', token).maybeSingle();
  if (!feed) return new Response('Not found', { status: 404 });
  const me = feed.user_id as string;

  const [{ data: plans }, { data: occ }] = await Promise.all([
    db.from('plans').select('id, title, details, options, chosen_option').eq('status', 'confirmed').or(`created_by.eq.${me},partner_id.eq.${me}`),
    db.from('occasions').select('id, label, month, day, year, repeats_yearly, source_message').eq('user_id', me),
  ]);
  const events: CalEvent[] = (plans ?? []).flatMap(p => {
    const o = (p.options as PlanOption[]).find(x => x.id === p.chosen_option);
    return o ? [{ uid: `plan-${p.id}`, title: p.title, starts_at: o.starts_at, minutes: o.minutes, details: p.details ?? 'Planned together in Belluh' }] : [];
  });
  // Plans already appear as timed events; don't repeat them as all-day dates
  const dates: CalDate[] = (occ ?? []).filter(o => o.source_message !== 'Planned together in Belluh')
    .map(o => ({ uid: `date-${o.id}`, title: o.label, month: o.month, day: o.day, year: o.year, repeats_yearly: o.repeats_yearly }));

  return new Response(icsCalendar('Belluh', events, dates), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=900', 'Content-Disposition': 'inline; filename="belluh.ics"' },
  });
});
