// Hourly job: from 9am in each user's own time zone (retrying hourly that day if a send fails), send WhatsApp or SMS reminders
// a week before and on the day of every saved occasion.
// Deploy with: supabase functions deploy occasion-reminders --no-verify-jwt
// Called by pg_cron with the x-cron-secret header (see docs/whatsapp-occasions.md).

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  localDateParts, nextOccurrence, daysBetween, reminderStage, reminderParams, isoDate, type StoredOccasion,
} from '../_shared/occasions.ts';
import { sendTemplate } from '../_shared/whatsapp.ts';
import { sendSms, smsReminder } from '../_shared/sms.ts';
import { sendTelegram, telegramChat } from '../_shared/telegram.ts';
import { sendLine, lineUser } from '../_shared/line.ts';
import { sendLinq } from '../_shared/linq.ts';
import { sameSecret } from '../_shared/secret.ts';
import { serverKey } from '../_shared/keys.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), {
  auth: { persistSession: false },
});

const SEND_HOUR = Number(Deno.env.get('REMINDER_LOCAL_HOUR') ?? 9);
const TEMPLATE = Deno.env.get('WHATSAPP_REMINDER_TEMPLATE') ?? 'occasion_reminder';
const TEMPLATE_LANG = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') ?? 'en_US';

Deno.serve(async (req) => {
  if (!(await sameSecret(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET')))) return new Response('Forbidden', { status: 403 });

  // ?force=1 ignores the 9am check, for testing
  const force = new URL(req.url).searchParams.get('force') === '1';
  const now = new Date();

  const { data: links, error } = await db.from('whatsapp_links')
    .select('user_id, phone_e164, timezone, channel').not('phone_e164', 'is', null).eq('reminders_enabled', true);
  if (error) return new Response(error.message, { status: 500 });

  // One person's bad time zone must never stop everyone else's reminders
  const localNow = (tz: string) => { try { return localDateParts(now, tz); } catch { return localDateParts(now, 'America/New_York'); } };
  const due = (links ?? []).filter(l => force || localNow(l.timezone).hour >= SEND_HOUR);
  let sent = 0, failed = 0;

  for (const link of due) {
    const today = localNow(link.timezone);
    const { data: occasions } = await db.from('occasions')
      .select('id, label, kind, month, day, year, repeats_yearly, mentioned_at').eq('user_id', link.user_id);

    for (const o of (occasions ?? []) as StoredOccasion[]) {
      const next = nextOccurrence(o, today);
      if (!next) continue;
      const stage = reminderStage(daysBetween(today, next));
      if (!stage) continue;

      // Claim the reminder first, so overlapping runs never double-send
      const { error: claimErr } = await db.from('reminders_sent')
        .insert({ occasion_id: o.id, occurs_on: isoDate(next), stage });
      if (claimErr) continue; // already sent (or being sent)

      // Reminders go wherever they last texted Belluh from
      const params = reminderParams(o, stage, link.timezone);
      const tg = telegramChat(link.phone_e164), ln = lineUser(link.phone_e164);
      const chatText = smsReminder(params).replace(' Reply STOP to pause reminders.', ' Send STOP to pause reminders.');
      const id = tg ? await sendTelegram(tg, chatText)
        : ln ? await sendLine(ln, chatText, null)
        : link.channel === 'imessage' ? await sendLinq(link.phone_e164, smsReminder(params))
        : link.channel === 'sms' ? await sendSms(link.phone_e164, smsReminder(params)) : await sendTemplate(link.phone_e164, TEMPLATE, params, TEMPLATE_LANG);
      if (id) {
        sent++;
        await db.from('reminders_sent').update({ wa_message_id: id })
          .eq('occasion_id', o.id).eq('occurs_on', isoDate(next)).eq('stage', stage);
        await db.from('whatsapp_messages').insert({
          user_id: link.user_id, direction: 'out', wa_message_id: id, phone_e164: link.phone_e164,
          body: `[reminder] ${o.label} ${stage}`, channel: link.channel ?? 'whatsapp',
        });
      } else {
        failed++;
        // Release the claim so the next hourly run can retry
        await db.from('reminders_sent').delete()
          .eq('occasion_id', o.id).eq('occurs_on', isoDate(next)).eq('stage', stage);
      }
    }
  }

  return Response.json({ users_checked: due.length, sent, failed });
});
