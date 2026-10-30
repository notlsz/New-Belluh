// Belluh on LINE, the app couples in Japan actually message on (about 100 million people there use it). The same text line
// as WhatsApp, SMS and Telegram: someone taps "Connect LINE" in Belluh, which opens a chat with Bella with
// "LINK <code>" ready to send, and they're linked. Replies use LINE's reply token when it's still fresh (free), and the
// push API otherwise. Parsing, the signature check and the message shape are pure, so they're unit-tested in Node.

export interface LineInbound { eventId: string; userId: string; text: string; kind: string; replyToken: string | null; at: number }

/** The 1:1 message events Belluh uses. Groups, rooms, follows and stickers without text are ignored. */
export function parseLineEvents(body: unknown): LineInbound[] {
  const events = ((body ?? {}) as Record<string, any>).events;
  if (!Array.isArray(events)) return [];
  const out: LineInbound[] = [];
  for (const e of events) {
    if (e?.type !== 'message' || e?.source?.type !== 'user' || typeof e?.source?.userId !== 'string') continue;
    if (e?.deliveryContext?.isRedelivery) continue; // LINE retries; the first delivery was already handled
    const m = e.message ?? {};
    const text = m.type === 'text' && typeof m.text === 'string' ? m.text.slice(0, 2000) : '';
    out.push({
      eventId: String(e.webhookEventId ?? m.id ?? `${e.source.userId}-${e.timestamp}`),
      userId: e.source.userId, text, kind: text ? 'text' : m.type === 'audio' ? 'voice' : m.type === 'image' ? 'photo' : 'other',
      replyToken: typeof e.replyToken === 'string' ? e.replyToken : null, at: Number(e.timestamp) || Date.now(),
    });
  }
  return out;
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

/** LINE signs the raw body with the channel secret (HMAC-SHA256, base64) in x-line-signature; compare in constant time. */
export async function validLineSignature(channelSecret: string, rawBody: string, header: string | null): Promise<boolean> {
  if (!channelSecret || !header) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(channelSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))));
  if (expected.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

export const lineUser = (stored: string) => (stored.startsWith('line:') ? stored.slice(5) : null);

/** One text message, with the same one-tap answers as Telegram (SEND, DISCARD, 1, 2, NONE...) as LINE quick replies. */
export function lineMessage(text: string, buttons: string[] | null) {
  return {
    type: 'text', text: text.slice(0, 5000),
    ...(buttons?.length ? { quickReply: { items: buttons.slice(0, 13).map(b => ({ type: 'action', action: { type: 'message', label: b.slice(0, 20), text: b } })) } } : {}),
  };
}

// A reply token is good for about a minute and only once; Bella usually answers in seconds, so most replies are free
const fresh = new Map<string, { token: string; until: number }>();
export function rememberReplyToken(userId: string, token: string | null, receivedAt = Date.now()) {
  if (token) fresh.set(userId, { token, until: receivedAt + 50_000 });
}
export function takeReplyToken(userId: string, now = Date.now()): string | null {
  const t = fresh.get(userId);
  fresh.delete(userId);
  return t && t.until > now ? t.token : null;
}

/** Sends one message: by reply token when there's a fresh one, else by push. Returns an id, or null if it failed. */
export async function sendLine(userId: string, text: string, buttons: string[] | null): Promise<string | null> {
  const token = (globalThis as any).Deno?.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) { console.error('LINE is not configured'); return null; }
  const base = (globalThis as any).Deno?.env.get('LINE_API_BASE') ?? 'https://api.line.me';
  const replyToken = takeReplyToken(userId);
  const res = await fetch(`${base}/v2/bot/message/${replyToken ? 'reply' : 'push'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(replyToken ? { replyToken, messages: [lineMessage(text, buttons)] } : { to: userId, messages: [lineMessage(text, buttons)] }),
  });
  if (!res.ok) { console.error('LINE send failed', res.status, (await res.text()).slice(0, 300)); return null; }
  return `line-out-${userId}-${crypto.randomUUID()}`;
}
