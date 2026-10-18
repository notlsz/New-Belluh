// iMessage through Linq (linqapp.com): Belluh gets a real iPhone number, people text it from Messages and see blue
// bubbles, and it falls back to SMS for Android on its own. Poke, Lindy and (reportedly) Instinct run on Linq.
// Docs: https://docs.linqapp.com (API v3; webhooks signed with Standard Webhooks).

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };
const BASE = () => env('LINQ_API_BASE') || 'https://api.linqapp.com/api/partner';

/** Sends a text by iMessage (Linq picks the service; SMS when the person isn't on iMessage). Returns the message id. */
export async function sendLinq(to: string, body: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const key = env('LINQ_API_KEY');
  if (!key) { console.error('Missing secret LINQ_API_KEY'); return null; }
  try {
    const res = await fetchImpl(`${BASE()}/v3/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({
        to: [to],
        ...(env('LINQ_FROM') ? { from: env('LINQ_FROM') } : {}),
        message: { parts: [{ type: 'text', value: body.slice(0, 4000) }] },
      }),
    });
    if (!res.ok) { console.error('Linq send failed', res.status, (await res.text()).slice(0, 300)); return null; }
    const json = await res.json().catch(() => ({}));
    return json?.message?.id ?? json?.id ?? 'linq';
  } catch (e) {
    console.error('Linq send failed', e);
    return null;
  }
}

const b64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), c => c.charCodeAt(0));

/**
 * Standard Webhooks: HMAC-SHA256 over "{webhook-id}.{webhook-timestamp}.{raw body}" with the secret (after "whsec_",
 * base64-decoded); the header holds one or more "v1,<base64>" values. Deliveries older than 5 minutes are refused.
 */
export async function verifyLinq(raw: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, secret: string, now = Date.now()): Promise<boolean> {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;
  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 300) return false;
  let keyBytes: Uint8Array<ArrayBuffer>;
  try { keyBytes = unb64(secret.replace(/^whsec_/, '')); } catch { return false; }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = b64(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${headers.id}.${headers.timestamp}.${raw}`)));
  return headers.signature.split(' ').some(s => {
    const [v, sig] = s.split(',');
    if (v !== 'v1' || !sig || sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

export interface LinqInbound { id: string; from: string; text: string; kind: 'text' | 'media' }

/** A Linq delivery as an inbound text, or null for anything else (our own sends, delivery receipts, reactions). */
export function parseLinqEvent(event: any): LinqInbound | null {
  if (event?.event_type !== 'message.received') return null;
  const d = event.data ?? {};
  if (d.direction && d.direction !== 'inbound') return null;
  if (d.is_from_me === true || d.sender_handle?.is_me === true) return null;
  const from = String(d.sender_handle?.handle ?? d.from ?? '').trim();
  if (!from || !d.id) return null;
  const parts = Array.isArray(d.parts) ? d.parts : [];
  const text = parts.filter((p: any) => p?.type === 'text' && typeof p.value === 'string').map((p: any) => p.value).join('\n').trim();
  const media = parts.some((p: any) => p?.type === 'media');
  // Phone numbers come in E.164; an Apple ID email is kept as is
  const handle = /^\+[1-9]\d{6,14}$/.test(from) ? from : /@/.test(from) ? from.toLowerCase() : null;
  if (!handle) return null;
  return { id: String(d.id), from: handle, text: text.slice(0, 2000), kind: text ? 'text' : media ? 'media' : 'text' };
}
