// Belluh on Telegram: the same text line as WhatsApp and SMS, with no business number, carrier registration or
// template approval. Someone taps "Connect Telegram" in Belluh, which opens t.me/<bot>?start=<code>, and they're linked.
// The parsing and secret check are pure, so they're unit-tested in Node.

export interface TelegramInbound { updateId: number; chatId: string; text: string; kind: string }

/** The parts of a Telegram update Belluh uses. Only private chats with a person count; groups and channels are ignored. */
export function parseTelegramUpdate(update: unknown): TelegramInbound | null {
  const u = (update ?? {}) as Record<string, any>;
  const msg = u.message; // edits would arrive as a second message, so they're ignored
  if (typeof u.update_id !== 'number' || !msg || msg.chat?.type !== 'private' || msg.from?.is_bot) return null;
  const chatId = msg.chat?.id;
  if (typeof chatId !== 'number' && typeof chatId !== 'string') return null;
  const text = typeof msg.text === 'string' ? msg.text.slice(0, 2000) : '';
  const kind = text ? 'text' : msg.voice ? 'voice' : msg.photo ? 'photo' : 'other';
  return { updateId: u.update_id, chatId: String(chatId), text, kind };
}

/** Telegram sends back the secret token we registered the webhook with; compare in constant time. */
export function sameToken(given: string | null, expected: string): boolean {
  if (!given || !expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

/** The webhook secret is derived from the bot token, so there's no second secret to manage. */
export async function webhookSecret(botToken: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`belluh-telegram:${botToken}`)));
  return Array.from(hash.slice(0, 24), b => b.toString(16).padStart(2, '0')).join('');
}

export const telegramChat = (stored: string) => (stored.startsWith('tg:') ? stored.slice(3) : null);

/** Short replies shown as buttons under a message, so answering is one tap (they send the same words a person would type). */
export function quickReplies(text: string): string[] | null {
  if (/Reply SEND to send it/i.test(text)) return ['SEND', 'DISCARD'];
  const pick = /Reply ((?:\d, )*\d),? or NONE/i.exec(text);
  if (pick) return [...pick[1].split(/,\s*/), 'NONE'];
  if (/Reply DID IT, NOT YET or SKIP/i.test(text)) return ['DID IT', 'NOT YET', 'SKIP'];
  if (/Reply DID IT/i.test(text)) return ['DID IT'];
  if (/Reply PLAN IT/i.test(text)) return ['PLAN IT', 'NOT NOW'];
  return null;
}

/** Sends one message. Returns Telegram's message id, or null if it failed. */
export async function sendTelegram(chatId: string, text: string): Promise<string | null> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) { console.error('Telegram is not configured'); return null; }
  const base = Deno.env.get('TELEGRAM_API_BASE') ?? 'https://api.telegram.org';
  const buttons = quickReplies(text);
  const res = await fetch(`${base}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId, text: text.slice(0, 4000), link_preview_options: { is_disabled: true },
      reply_markup: buttons
        ? { keyboard: [buttons.map(b => ({ text: b }))], one_time_keyboard: true, resize_keyboard: true }
        : { remove_keyboard: true },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) { console.error('Telegram send failed', res.status, JSON.stringify(json).slice(0, 300)); return null; }
  return `tg-out-${chatId}-${json.result?.message_id ?? crypto.randomUUID()}`;
}
