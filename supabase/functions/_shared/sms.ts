// Plain SMS through Twilio: the same Belluh date line as WhatsApp, for people who'd rather text.
// The signature check is pure (Web Crypto), so it is unit-tested in Node.

/**
 * Twilio signs each webhook: base64(HMAC-SHA1(auth token, full URL + every POST field as key+value, keys sorted)).
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export async function twilioSignature(url: string, params: Record<string, string>, authToken: string): Promise<string> {
  const data = url + Object.keys(params).sort().map(k => k + params[k]).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
  let bin = '';
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function verifyTwilioSignature(url: string, params: Record<string, string>, header: string | null, authToken: string): Promise<boolean> {
  if (!header || !authToken) return false;
  const expected = await twilioSignature(url, params, authToken);
  if (expected.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

/** "+1 (555) 123-0000" → "+15551230000". Anything that isn't a plausible number → null. */
export function smsE164(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return '+' + digits;
}

/** SMS is short: keep replies to a few segments. */
export function smsBody(text: string): string {
  const t = text.replace(/\n{3,}/g, '\n\n').trim();
  return t.length > 600 ? t.slice(0, 597) + '...' : t;
}

/** The plain-text reminder (WhatsApp uses an approved template with the same words). */
export function smsReminder(params: string[]): string {
  const [label, when, date, told] = params;
  return `Belluh reminder: ${label} is ${when}, ${date}. You first told me about it on ${told}. Reply STOP to pause reminders.`;
}

/** Sends one SMS. Returns Twilio's message id, or null if it failed. */
export async function sendSms(toE164: string, body: string): Promise<string | null> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID'), token = Deno.env.get('TWILIO_AUTH_TOKEN'), from = Deno.env.get('TWILIO_FROM');
  if (!sid || !token || !from) { console.error('SMS is not configured'); return null; }
  const base = Deno.env.get('TWILIO_API_BASE') ?? 'https://api.twilio.com';
  const form = new URLSearchParams({ To: toE164, Body: smsBody(body) });
  // TWILIO_FROM is either a phone number or a Messaging Service (MG...), which US 10DLC needs
  form.set(from.startsWith('MG') ? 'MessagingServiceSid' : 'From', from);
  const res = await fetch(`${base}/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${sid}:${token}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('SMS send failed', res.status, JSON.stringify(json).slice(0, 300)); return null; }
  return json?.sid ?? null;
}
