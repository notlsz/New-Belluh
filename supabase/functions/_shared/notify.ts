// Reaches a person on the phone they connected (WhatsApp or SMS), for things that happen while they're away:
// a plan to pick, a note from their partner, an answer, Sunday's suggestion. STOP pauses all of it.

import { db } from './agentdb.ts';
import { sendText, sendTemplate } from './whatsapp.ts';
import { sendSms } from './sms.ts';

// WhatsApp only allows free-form messages within 24 hours of the person's last message; after that, an approved template
const UPDATE_TEMPLATE = Deno.env.get('WHATSAPP_UPDATE_TEMPLATE') ?? 'belluh_update';
const TEMPLATE_LANG = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') ?? 'en_US';
const WINDOW_MS = 23.5 * 3600 * 1000;

export async function notify(userId: string | null, text: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data: link } = await db.from('whatsapp_links')
      .select('phone_e164, channel, last_inbound_at, reminders_enabled').eq('user_id', userId).maybeSingle();
    if (!link?.phone_e164 || !link.reminders_enabled) return false;
    let id: string | null;
    if (link.channel === 'sms') id = await sendSms(link.phone_e164, text);
    else {
      const open = link.last_inbound_at && Date.now() - new Date(link.last_inbound_at).getTime() < WINDOW_MS;
      // Template parameters can't hold line breaks
      id = open ? await sendText(link.phone_e164, text) : await sendTemplate(link.phone_e164, UPDATE_TEMPLATE, [text.replace(/\s+/g, ' ').slice(0, 900)], TEMPLATE_LANG);
    }
    if (id) await db.from('whatsapp_messages').insert({ user_id: userId, direction: 'out', wa_message_id: id, phone_e164: link.phone_e164, body: text, channel: link.channel });
    return !!id;
  } catch (e) {
    console.error('notify failed', e);
    return false;
  }
}
