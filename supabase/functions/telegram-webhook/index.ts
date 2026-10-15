// Telegram webhook: Belluh's text line on Telegram, the same as WhatsApp and SMS (same Belluh, thread, memory and tools).
// Deploy with: supabase functions deploy telegram-webhook --no-verify-jwt
// (Telegram can't send a Supabase JWT; every update is checked against the secret token the webhook was registered with,
// which is derived from TELEGRAM_BOT_TOKEN. The deploy workflow registers the webhook.)

import { parseTelegramUpdate, sameToken, webhookSecret } from '../_shared/telegram.ts';
import { handleInbound } from '../_shared/textline.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
  if (!token || !sameToken(req.headers.get('x-telegram-bot-api-secret-token'), await webhookSecret(token))) {
    return new Response('Forbidden', { status: 403 });
  }
  const raw = await req.text();
  if (raw.length > 50000) return new Response('Too large', { status: 413 });
  let update: unknown;
  try { update = JSON.parse(raw); } catch { return new Response('ok'); }
  const m = parseTelegramUpdate(update);
  if (!m) return new Response('ok'); // groups, bots, edits without text: nothing to do

  const work = handleInbound({
    channel: 'telegram', id: `tg-${m.updateId}`, phone: `tg:${m.chatId}`, sentAt: new Date().toISOString(), text: m.text, kind: m.kind,
  }).catch(e => console.error('telegram failed', m.updateId, e));
  // Answer Telegram right away and finish in the background; replies go out through the Bot API
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(work);
  else await work;
  return new Response('ok');
});
