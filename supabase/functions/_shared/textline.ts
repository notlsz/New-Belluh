// Belluh's date line, shared by WhatsApp and SMS: link with a code, text a date, LIST, FORGET, STOP/START.
// Each webhook verifies its provider's signature, then hands every message here.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  parseCommand, localDateParts, buildExtractionPrompt, normalizeExtracted, EXTRACTION_SCHEMA, savedReply, listReply,
  HELP_TEXT, NOT_LINKED_TEXT, NOT_LINKED_SMS_TEXT, NO_DATE_TEXT, type StoredOccasion, type ExtractedOccasion,
} from './occasions.ts';
import { sendText, geminiJson } from './whatsapp.ts';
import { sendSms } from './sms.ts';

export type Channel = 'whatsapp' | 'sms';
export interface Inbound { channel: Channel; id: string; phone: string; sentAt: string; text: string; kind: string }

export const db: SupabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

interface Link { user_id: string; timezone: string; reminders_enabled: boolean }

const CONNECT_AGAIN: Record<Channel, string> = { whatsapp: 'Connect WhatsApp', sms: 'Connect by text' };

async function reply(m: Inbound, userId: string | null, body: string) {
  const id = m.channel === 'sms' ? await sendSms(m.phone, body) : await sendText(m.phone, body);
  await db.from('whatsapp_messages').insert({ user_id: userId, direction: 'out', wa_message_id: id, phone_e164: m.phone, body, channel: m.channel });
}

async function handleLink(m: Inbound, code: string) {
  const { data: link } = await db.from('whatsapp_links').select('user_id, link_code_expires').eq('link_code', code).maybeSingle();
  if (!link || new Date(link.link_code_expires) < new Date()) {
    return reply(m, null, `That code has expired or is wrong. Open Belluh, go to Me → Settings, and tap ${CONNECT_AGAIN[m.channel]} again.`);
  }
  // A number belongs to one account: release it from any earlier one first
  await db.from('whatsapp_links').update({ phone_e164: null }).eq('phone_e164', m.phone).neq('user_id', link.user_id);
  await db.from('whatsapp_links').update({
    phone_e164: m.phone, channel: m.channel, linked_at: new Date().toISOString(), last_inbound_at: new Date().toISOString(),
    link_code: null, link_code_expires: null,
  }).eq('user_id', link.user_id);
  await db.from('whatsapp_messages').update({ user_id: link.user_id }).eq('phone_e164', m.phone).is('user_id', null);
  return reply(m, link.user_id, "You're connected ✓\n\n" + HELP_TEXT);
}

async function handleCapture(m: Inbound, link: Link, text: string) {
  const today = localDateParts(new Date(), link.timezone);
  const found = normalizeExtracted(await geminiJson(buildExtractionPrompt(text, today), EXTRACTION_SCHEMA));
  if (!found.length) return reply(m, link.user_id, NO_DATE_TEXT);

  const { data: existing } = await db.from('occasions').select('label, month, day, mentioned_at').eq('user_id', link.user_id);
  const saved: ExtractedOccasion[] = [];
  const known: { label: string; mentioned_at: string }[] = [];
  for (const o of found) {
    const dup = existing?.find(e => e.month === o.month && e.day === o.day && e.label.toLowerCase() === o.label.toLowerCase());
    if (dup) { known.push(dup); continue; }
    const { error } = await db.from('occasions').insert({
      user_id: link.user_id, ...o, source: m.channel, source_message: text.slice(0, 2000), mentioned_at: m.sentAt,
    });
    if (error) console.error('occasion insert failed', error.message);
    else saved.push(o);
  }
  return reply(m, link.user_id, savedReply(saved, known, link.timezone));
}

async function handleForget(m: Inbound, link: Link, query: string) {
  const { data: matches } = await db.from('occasions')
    .select('id, label, month, day').eq('user_id', link.user_id).ilike('label', `%${query.replace(/[%_\\]/g, '')}%`);
  if (!matches?.length) return reply(m, link.user_id, `I couldn't find "${query}". Text LIST to see everything I remember.`);
  if (matches.length > 1) {
    const names = matches.slice(0, 10).map(x => `• ${x.label}`).join('\n');
    return reply(m, link.user_id, `A few dates match "${query}":\n${names}\n\nSend FORGET with the full name of the one to remove.`);
  }
  await db.from('occasions').delete().eq('id', matches[0].id);
  return reply(m, link.user_id, `Forgotten: ${matches[0].label}.`);
}

export async function handleInbound(m: Inbound) {
  // Providers retry deliveries; the unique message id makes each one count once
  const { error: dupErr } = await db.from('whatsapp_messages').insert({
    direction: 'in', wa_message_id: m.id, phone_e164: m.phone, body: m.text || `[${m.kind}]`, channel: m.channel,
  });
  if (dupErr) return; // already handled

  const cmd = parseCommand(m.text);
  if (cmd.type === 'link') return handleLink(m, cmd.code);

  const { data: link } = await db.from('whatsapp_links')
    .select('user_id, timezone, reminders_enabled').eq('phone_e164', m.phone).maybeSingle<Link>();
  if (!link) return reply(m, null, m.channel === 'sms' ? NOT_LINKED_SMS_TEXT : NOT_LINKED_TEXT);

  // Replies and reminders go to whichever app they texted from last
  await db.from('whatsapp_links').update({ last_inbound_at: new Date().toISOString(), channel: m.channel }).eq('user_id', link.user_id);
  await db.from('whatsapp_messages').update({ user_id: link.user_id }).eq('wa_message_id', m.id);

  if (!m.text) return reply(m, link.user_id, 'I can only read text for now. Type the date and what it is, like "Maya\'s birthday is May 12".');

  switch (cmd.type) {
    case 'help': return reply(m, link.user_id, HELP_TEXT);
    case 'stop':
      await db.from('whatsapp_links').update({ reminders_enabled: false }).eq('user_id', link.user_id);
      return reply(m, link.user_id, "Reminders paused. I'll still save dates you send. Text START to turn reminders back on.");
    case 'start':
      await db.from('whatsapp_links').update({ reminders_enabled: true }).eq('user_id', link.user_id);
      return reply(m, link.user_id, "Reminders are on. I'll message you a week before and on the day.");
    case 'list': {
      const { data } = await db.from('occasions')
        .select('id, label, kind, month, day, year, repeats_yearly, mentioned_at').eq('user_id', link.user_id);
      return reply(m, link.user_id, listReply((data ?? []) as StoredOccasion[], localDateParts(new Date(), link.timezone), link.timezone));
    }
    case 'forget': return handleForget(m, link, cmd.query);
    case 'capture': return handleCapture(m, link, cmd.text);
  }
}
