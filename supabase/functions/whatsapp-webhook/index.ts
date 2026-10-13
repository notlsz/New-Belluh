// WhatsApp webhook: users text Belluh their dates; Belluh saves them and confirms.
// Deploy with: supabase functions deploy whatsapp-webhook --no-verify-jwt
// (Meta can't send a Supabase JWT; every POST is checked against the app secret instead.)

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  verifyMetaSignature, parseCommand, toE164, localDateParts, buildExtractionPrompt, normalizeExtracted,
  EXTRACTION_SCHEMA, savedReply, listReply, HELP_TEXT, NOT_LINKED_TEXT, NO_DATE_TEXT,
  type StoredOccasion, type ExtractedOccasion,
} from '../_shared/occasions.ts';
import { sendText, geminiJson } from '../_shared/whatsapp.ts';
import { sameSecret } from '../_shared/secret.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const db: SupabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

interface Link { user_id: string; timezone: string; reminders_enabled: boolean }

async function reply(userId: string | null, phone: string, body: string) {
  const id = await sendText(phone, body);
  await db.from('whatsapp_messages').insert({ user_id: userId, direction: 'out', wa_message_id: id, phone_e164: phone, body });
}

async function handleLink(phone: string, code: string) {
  const { data: link } = await db.from('whatsapp_links')
    .select('user_id, link_code_expires').eq('link_code', code).maybeSingle();
  if (!link || new Date(link.link_code_expires) < new Date()) {
    return reply(null, phone, 'That code has expired or is wrong. Open Belluh, go to Profile, tap Connect WhatsApp, and send the new code.');
  }
  // A number belongs to one account: release it from any earlier one first
  await db.from('whatsapp_links').update({ phone_e164: null }).eq('phone_e164', phone).neq('user_id', link.user_id);
  await db.from('whatsapp_links').update({
    phone_e164: phone, linked_at: new Date().toISOString(), last_inbound_at: new Date().toISOString(),
    link_code: null, link_code_expires: null,
  }).eq('user_id', link.user_id);
  await db.from('whatsapp_messages').update({ user_id: link.user_id }).eq('phone_e164', phone).is('user_id', null);
  return reply(link.user_id, phone, "You're connected ✓\n\n" + HELP_TEXT);
}

async function handleCapture(link: Link, phone: string, text: string, sentAt: string) {
  const today = localDateParts(new Date(), link.timezone);
  const found = normalizeExtracted(await geminiJson(buildExtractionPrompt(text, today), EXTRACTION_SCHEMA));
  if (!found.length) return reply(link.user_id, phone, NO_DATE_TEXT);

  const { data: existing } = await db.from('occasions')
    .select('label, month, day, mentioned_at').eq('user_id', link.user_id);
  const saved: ExtractedOccasion[] = [];
  const known: { label: string; mentioned_at: string }[] = [];
  for (const o of found) {
    const dup = existing?.find(e => e.month === o.month && e.day === o.day && e.label.toLowerCase() === o.label.toLowerCase());
    if (dup) { known.push(dup); continue; }
    const { error } = await db.from('occasions').insert({
      user_id: link.user_id, ...o, source: 'whatsapp', source_message: text.slice(0, 2000), mentioned_at: sentAt,
    });
    if (error) console.error('occasion insert failed', error.message);
    else saved.push(o);
  }
  return reply(link.user_id, phone, savedReply(saved, known, link.timezone));
}

async function handleForget(link: Link, phone: string, query: string) {
  const { data: matches } = await db.from('occasions')
    .select('id, label, month, day').eq('user_id', link.user_id).ilike('label', `%${query.replace(/[%_\\]/g, '')}%`);
  if (!matches?.length) return reply(link.user_id, phone, `I couldn't find "${query}". Text LIST to see everything I remember.`);
  if (matches.length > 1) {
    const names = matches.slice(0, 10).map(m => `• ${m.label}`).join('\n');
    return reply(link.user_id, phone, `A few dates match "${query}":\n${names}\n\nSend FORGET with the full name of the one to remove.`);
  }
  await db.from('occasions').delete().eq('id', matches[0].id);
  return reply(link.user_id, phone, `Forgotten: ${matches[0].label}.`);
}

async function handleMessage(msg: Record<string, any>) {
  const phone = toE164(msg.from);
  const sentAt = new Date(Number(msg.timestamp) * 1000 || Date.now()).toISOString();
  const text: string = msg.type === 'text' ? String(msg.text?.body ?? '') : '';

  // Meta retries deliveries; the unique message id makes each one count once
  const { error: dupErr } = await db.from('whatsapp_messages').insert({
    direction: 'in', wa_message_id: msg.id, phone_e164: phone, body: text || `[${msg.type}]`,
  });
  if (dupErr) return; // already handled

  const cmd = parseCommand(text);
  if (cmd.type === 'link') return handleLink(phone, cmd.code);

  const { data: link } = await db.from('whatsapp_links')
    .select('user_id, timezone, reminders_enabled').eq('phone_e164', phone).maybeSingle<Link>();
  if (!link) return reply(null, phone, NOT_LINKED_TEXT);

  await db.from('whatsapp_links').update({ last_inbound_at: new Date().toISOString() }).eq('user_id', link.user_id);
  await db.from('whatsapp_messages').update({ user_id: link.user_id }).eq('wa_message_id', msg.id);

  if (!text) return reply(link.user_id, phone, 'I can only read text for now. Type the date and what it is, like "Maya\'s birthday is May 12".');

  switch (cmd.type) {
    case 'help': return reply(link.user_id, phone, HELP_TEXT);
    case 'stop':
      await db.from('whatsapp_links').update({ reminders_enabled: false }).eq('user_id', link.user_id);
      return reply(link.user_id, phone, "Reminders paused. I'll still save dates you send. Text START to turn reminders back on.");
    case 'start':
      await db.from('whatsapp_links').update({ reminders_enabled: true }).eq('user_id', link.user_id);
      return reply(link.user_id, phone, "Reminders are on. I'll message you a week before and on the day.");
    case 'list': {
      const { data } = await db.from('occasions')
        .select('id, label, kind, month, day, year, repeats_yearly, mentioned_at').eq('user_id', link.user_id);
      return reply(link.user_id, phone, listReply((data ?? []) as StoredOccasion[], localDateParts(new Date(), link.timezone), link.timezone));
    }
    case 'forget': return handleForget(link, phone, cmd.query);
    case 'capture': return handleCapture(link, phone, cmd.text, sentAt);
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Meta's one-time verification handshake when you register the webhook
  if (req.method === 'GET') {
    const ok = url.searchParams.get('hub.mode') === 'subscribe'
      && await sameSecret(url.searchParams.get('hub.verify_token'), Deno.env.get('WHATSAPP_VERIFY_TOKEN'));
    return ok ? new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 }) : new Response('Forbidden', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const raw = await req.text();
  if (!(await verifyMetaSignature(raw, req.headers.get('x-hub-signature-256'), Deno.env.get('WHATSAPP_APP_SECRET') ?? ''))) {
    return new Response('Bad signature', { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  const work = (async () => {
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const msg of change?.value?.messages ?? []) {
          try { await handleMessage(msg); }
          catch (e) { console.error('message failed', msg?.id, e); }
        }
      }
    }
  })();
  // Answer Meta right away (it retries slow webhooks) and finish the work in the background
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(work);
  else await work;
  return new Response('ok', { status: 200 });
});
