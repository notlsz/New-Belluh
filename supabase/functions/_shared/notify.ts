// Reaches a person for things that happen while they're away (a plan to pick, a note from their partner, an answer,
// Sunday's suggestion): a notification on every browser and phone app they turned on, and a text on the phone they connected.
// STOP pauses the texts; turning notifications off in Settings stops the pushes.

import { db } from './agentdb.ts';
import { sendText, sendTemplate } from './whatsapp.ts';
import { sendSms } from './sms.ts';
import { sendTelegram, telegramChat, quickReplies } from './telegram.ts';
import { sendLine, lineUser } from './line.ts';
import { sendLinq } from './linq.ts';
import { sendPush } from './webpush.ts';
import { vapidKeys, PUSH_SUBJECT, PUSH_EXTRA_HOSTS } from './pushkeys.ts';
import { apnsConfig, fcmAccount, sendApns, sendFcm } from './nativepush.ts';

// WhatsApp only allows free-form messages within 24 hours of the person's last message; after that, an approved template
const UPDATE_TEMPLATE = Deno.env.get('WHATSAPP_UPDATE_TEMPLATE') ?? 'belluh_update';
const TEMPLATE_LANG = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') ?? 'en_US';
const WINDOW_MS = 23.5 * 3600 * 1000;

/** Pushes to every browser and every phone with the app where the person turned notifications on; forgets the ones
 *  that unsubscribed or uninstalled. Returns how many got it. */
export async function pushTo(userId: string, message: { title: string; body: string; url?: string; tag?: string }): Promise<number> {
  let ok = 0;
  try {
    const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId).limit(10);
    if (subs?.length) {
      const keys = await vapidKeys();
      for (const s of subs) {
        const r = await sendPush(s, message, keys, PUSH_SUBJECT(), PUSH_EXTRA_HOSTS());
        if (r === 'ok') { ok++; await db.from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).eq('id', s.id); }
        if (r === 'gone') await db.from('push_subscriptions').delete().eq('id', s.id);
      }
    }
  } catch (e) {
    console.error('push failed', e);
  }
  return ok + await pushToApps(userId, message);
}

/** The iOS and Android apps (APNs and FCM), when their keys are set */
async function pushToApps(userId: string, message: { title: string; body: string; url?: string; tag?: string }): Promise<number> {
  const apns = apnsConfig(), fcm = fcmAccount();
  if (!apns && !fcm) return 0;
  try {
    const { data: rows, error } = await db.from('native_push_tokens').select('id, platform, token, environment').eq('user_id', userId).limit(10);
    if (error || !rows?.length) return 0;
    let ok = 0;
    for (const t of rows) {
      let r: 'ok' | 'gone' | 'failed' = 'failed';
      const patch: Record<string, unknown> = {};
      if (t.platform === 'ios' && apns) {
        const s = await sendApns(t.token, message, apns, t.environment === 'sandbox' ? 'sandbox' : 'production');
        r = s.result;
        if (s.result === 'ok' && s.env !== t.environment) patch.environment = s.env;
      } else if (t.platform === 'android' && fcm) r = await sendFcm(t.token, message, fcm);
      else continue;
      if (r === 'ok') { ok++; await db.from('native_push_tokens').update({ ...patch, last_ok_at: new Date().toISOString() }).eq('id', t.id); }
      if (r === 'gone') await db.from('native_push_tokens').delete().eq('id', t.id);
    }
    return ok;
  } catch (e) {
    console.error('app push failed', e);
    return 0;
  }
}

export async function notify(userId: string | null, text: string, opts: { pushOnly?: boolean; title?: string; tag?: string; push?: string } = {}): Promise<boolean> {
  if (!userId) return false;
  const pushed = await pushTo(userId, { title: opts.title ?? 'Belluh', body: (opts.push ?? text).replace(/\s+/g, ' ').slice(0, 300), url: '/?tab=belluh', tag: opts.tag });
  if (opts.pushOnly) return pushed > 0;
  try {
    const { data: link } = await db.from('whatsapp_links')
      .select('phone_e164, channel, last_inbound_at, reminders_enabled').eq('user_id', userId).maybeSingle();
    if (!link?.phone_e164 || !link.reminders_enabled) return pushed > 0;
    let id: string | null;
    if (link.channel === 'telegram' || telegramChat(link.phone_e164)) { const tg = telegramChat(link.phone_e164); id = tg ? await sendTelegram(tg, text) : null; }
    else if (link.channel === 'line' || lineUser(link.phone_e164)) { const ln = lineUser(link.phone_e164); id = ln ? await sendLine(ln, text, quickReplies(text)) : null; }
    else if (link.channel === 'sms') id = await sendSms(link.phone_e164, text);
    else if (link.channel === 'imessage') id = await sendLinq(link.phone_e164, text);
    else {
      const open = link.last_inbound_at && Date.now() - new Date(link.last_inbound_at).getTime() < WINDOW_MS;
      // Template parameters can't hold line breaks
      id = open ? await sendText(link.phone_e164, text) : await sendTemplate(link.phone_e164, UPDATE_TEMPLATE, [text.replace(/\s+/g, ' ').slice(0, 900)], TEMPLATE_LANG);
    }
    if (id) await db.from('whatsapp_messages').insert({ user_id: userId, direction: 'out', wa_message_id: id, phone_e164: link.phone_e164, body: text, channel: link.channel });
    return !!id || pushed > 0;
  } catch (e) {
    console.error('notify failed', e);
    return pushed > 0;
  }
}
