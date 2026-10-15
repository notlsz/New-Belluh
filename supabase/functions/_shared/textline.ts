// Belluh by text, shared by WhatsApp and SMS. After a one-tap link, texting Belluh is talking to the same Belluh as in the app
// (same thread, memory and tools), plus short replies: SEND/DISCARD a note, 1-3/NONE for a plan, DID IT/NOT YET/SKIP,
// LIST/FORGET dates, STOP/START. Each webhook verifies its provider's signature, then hands every message here.

import {
  parseCommand, localDateParts, listReply, HELP_TEXT, NOT_LINKED_TEXT, NOT_LINKED_SMS_TEXT, type StoredOccasion,
} from './occasions.ts';
import { sendText } from './whatsapp.ts';
import { sendSms } from './sms.ts';
import { db, loadCtx, weekAction } from './agentdb.ts';
import { chat, sendNote, planRespond, checkin } from './agentcore.ts';

export type Channel = 'whatsapp' | 'sms';
export interface Inbound { channel: Channel; id: string; phone: string; sentAt: string; text: string; kind: string }

interface Link { user_id: string; timezone: string; reminders_enabled: boolean }

const CONNECT_AGAIN: Record<Channel, string> = { whatsapp: 'Connect WhatsApp', sms: 'Connect by text' };

async function reply_(m: Inbound, userId: string | null, body: string) {
  const id = m.channel === 'sms' ? await sendSms(m.phone, body) : await sendText(m.phone, body);
  await db.from('whatsapp_messages').insert({ user_id: userId, direction: 'out', wa_message_id: id, phone_e164: m.phone, body, channel: m.channel });
}

async function handleLink(m: Inbound, code: string) {
  const { data: link } = await db.from('whatsapp_links').select('user_id, link_code_expires').eq('link_code', code).maybeSingle();
  if (!link || new Date(link.link_code_expires) < new Date()) {
    return reply_(m, null, `That code has expired or is wrong. Open Belluh, go to Me → Settings, and tap ${CONNECT_AGAIN[m.channel]} again.`);
  }
  // A number belongs to one account: release it from any earlier one first
  await db.from('whatsapp_links').update({ phone_e164: null }).eq('phone_e164', m.phone).neq('user_id', link.user_id);
  await db.from('whatsapp_links').update({
    phone_e164: m.phone, channel: m.channel, linked_at: new Date().toISOString(), last_inbound_at: new Date().toISOString(),
    link_code: null, link_code_expires: null,
  }).eq('user_id', link.user_id);
  await db.from('whatsapp_messages').update({ user_id: link.user_id }).eq('phone_e164', m.phone).is('user_id', null);
  return reply_(m, link.user_id, "You're connected ✓\n\n" + HELP_TEXT);
}

/** Anything that isn't a short command is a message to Belluh: same thread, memory and tools as the app. */
async function talk(m: Inbound, link: Link, text: string) {
  const ctx = await loadCtx(link.user_id, link.timezone);
  const { messages } = await chat(ctx, text, 'chat', m.channel) as { messages: any[] };
  const reply = [...messages].reverse().find(x => x?.role === 'belluh')?.body ?? "I'm having trouble thinking right now. Try me again in a moment.";
  const draft = messages.find(x => x?.role === 'note_draft');
  const extra = draft ? `\n\nNote to ${ctx.partnerName ?? 'your partner'}:\n"${draft.body}"\n\nReply SEND to send it, or DISCARD.` : '';
  return reply_(m, link.user_id, reply + extra);
}

/** SEND / DISCARD: the note Belluh just drafted. */
async function noteAction(m: Inbound, link: Link, send: boolean) {
  const { data: d } = await db.from('agent_messages').select('id, meta').eq('user_id', link.user_id).eq('role', 'note_draft')
    .eq('meta->>status', 'draft').gte('created_at', new Date(Date.now() - 2 * 864e5).toISOString())
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!d) return talk(m, link, m.text);
  if (!send) {
    await db.from('agent_messages').update({ meta: { ...(d.meta as object), status: 'discarded' } }).eq('id', d.id);
    return reply_(m, link.user_id, "Okay, I won't send it.");
  }
  const ctx = await loadCtx(link.user_id, link.timezone);
  const r = await sendNote(ctx, d.id);
  return reply_(m, link.user_id, r.status === 200 ? `Sent to ${ctx.partnerName ?? 'your partner'} ✓` : (r.body?.error ?? "Couldn't send it. Try again in the app."));
}

/** 1 / 2 / 3 / NONE: answering the plan your partner sent. */
async function planAnswer(m: Inbound, link: Link, option: number | null, note: string) {
  const { data: p } = await db.from('plans').select('id, options').eq('partner_id', link.user_id).eq('status', 'proposed')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!p) return talk(m, link, m.text);
  const opts = p.options as { id: string }[];
  if (option !== null && !opts[option - 1]) return reply_(m, link.user_id, `Reply a number from 1 to ${opts.length}, or NONE.`);
  const ctx = await loadCtx(link.user_id, link.timezone);
  const r = await planRespond(ctx, p.id, option === null ? null : opts[option - 1].id, note);
  const text = (r.body?.messages ?? []).map((x: any) => x?.body).filter(Boolean).join('\n') || r.body?.error || 'Done.';
  return reply_(m, link.user_id, text);
}

/** DID IT / NOT YET / SKIP: this week's thing to try together. */
async function weekAnswer(m: Inbound, link: Link, status: string) {
  const ctx = await loadCtx(link.user_id, link.timezone);
  const { action } = await weekAction(ctx).catch(() => ({ action: null }));
  if (!action) return talk(m, link, m.text);
  const r = await checkin(ctx, action.id, status);
  const text = (r.body?.messages ?? []).map((x: any) => x?.body).filter(Boolean).join('\n') || 'Got it ✓';
  return reply_(m, link.user_id, text);
}

async function handleForget(m: Inbound, link: Link, query: string) {
  const { data: matches } = await db.from('occasions')
    .select('id, label, month, day').eq('user_id', link.user_id).ilike('label', `%${query.replace(/[%_\\]/g, '')}%`);
  if (!matches?.length) return talk(m, link, m.text); // not a date: maybe a memory, which Belluh handles
  if (matches.length > 1) {
    const names = matches.slice(0, 10).map(x => x.label).join('\n');
    return reply_(m, link.user_id, `A few dates match "${query}":\n${names}\n\nSend FORGET with the full name of the one to remove.`);
  }
  await db.from('occasions').delete().eq('id', matches[0].id);
  return reply_(m, link.user_id, `Forgotten: ${matches[0].label}.`);
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
  if (!link) return reply_(m, null, m.channel === 'sms' ? NOT_LINKED_SMS_TEXT : NOT_LINKED_TEXT);

  // Replies and reminders go to whichever app they texted from last
  await db.from('whatsapp_links').update({ last_inbound_at: new Date().toISOString(), channel: m.channel }).eq('user_id', link.user_id);
  await db.from('whatsapp_messages').update({ user_id: link.user_id }).eq('wa_message_id', m.id);

  if (!m.text) return reply_(m, link.user_id, 'I can only read text for now. Type the date and what it is, like "Maya\'s birthday is May 12".');

  switch (cmd.type) {
    case 'help': return reply_(m, link.user_id, HELP_TEXT);
    case 'stop':
      await db.from('whatsapp_links').update({ reminders_enabled: false }).eq('user_id', link.user_id);
      return reply_(m, link.user_id, "Paused. I won't message you first (reminders, plans, notes) until you text START. You can still text me anytime.");
    case 'start':
      await db.from('whatsapp_links').update({ reminders_enabled: true }).eq('user_id', link.user_id);
      return reply_(m, link.user_id, "I'm back on: reminders a week before and on the day, plus plans and notes from your partner.");
    case 'list': {
      const { data } = await db.from('occasions')
        .select('id, label, kind, month, day, year, repeats_yearly, mentioned_at').eq('user_id', link.user_id);
      return reply_(m, link.user_id, listReply((data ?? []) as StoredOccasion[], localDateParts(new Date(), link.timezone), link.timezone));
    }
    case 'forget': return handleForget(m, link, cmd.query);
    case 'send_note': return noteAction(m, link, true);
    case 'discard_note': return noteAction(m, link, false);
    case 'pick': return planAnswer(m, link, cmd.option, '');
    case 'none': return planAnswer(m, link, null, cmd.note);
    case 'checkin': return weekAnswer(m, link, cmd.status);
    case 'capture': return talk(m, link, cmd.text);
  }
}
