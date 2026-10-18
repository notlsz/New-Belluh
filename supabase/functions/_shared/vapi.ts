// Belluh calls the restaurant: once someone taps "Call for me" on a table Belluh found, a Vapi voice agent phones the
// place, says up front that it's an AI calling for them, asks for the table, and reports back. The number comes from
// Google Places. Nothing is recorded; only the outcome (booked or not, the time, any alternative) comes back.
// Docs: https://docs.vapi.ai (POST /call; end-of-call-report webhook), https://developers.google.com/maps/documentation/places/web-service/text-search

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };
const VAPI = () => env('VAPI_API_BASE') || 'https://api.vapi.ai';
const PLACES = () => env('GOOGLE_PLACES_BASE') || 'https://places.googleapis.com';

/** Calls are on only with all three keys: Vapi, the number Vapi calls from, and Places to find the restaurant's number. */
export const callsOn = () => !!(env('VAPI_API_KEY') && env('VAPI_PHONE_NUMBER_ID') && env('GOOGLE_PLACES_API_KEY'));

export interface FoundPlace { name: string; phone: string; address: string | null }

/** The best match for "Lilia Brooklyn" (or "ramen in Mission"), with a callable number in E.164. */
export async function findPlace(query: string, fetchImpl: typeof fetch = fetch): Promise<FoundPlace | null> {
  const key = env('GOOGLE_PLACES_API_KEY');
  const q = query.replace(/\s+/g, ' ').trim().slice(0, 160);
  if (!key || q.length < 2) return null;
  try {
    const r = await fetchImpl(`${PLACES()}/v1/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.displayName,places.internationalPhoneNumber,places.formattedAddress',
      },
      body: JSON.stringify({ textQuery: q, includedType: 'restaurant', pageSize: 3 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) { console.error('Places search failed', r.status); return null; }
    const places = (await r.json())?.places ?? [];
    for (const p of places) {
      const phone = toE164(p?.internationalPhoneNumber);
      const name = typeof p?.displayName?.text === 'string' ? p.displayName.text.trim().slice(0, 120) : '';
      if (phone && name) return { name, phone, address: typeof p.formattedAddress === 'string' ? p.formattedAddress.slice(0, 200) : null };
    }
    return null;
  } catch (e) {
    console.error('Places search failed', e);
    return null;
  }
}

/** "+1 415-555-0134" → "+14155550134"; anything that isn't an international number → null. */
export function toE164(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim().startsWith('+')) return null;
  const d = v.replace(/\D/g, '');
  return d.length >= 7 && d.length <= 15 && d[0] !== '0' ? `+${d}` : null;
}

/** The secret Vapi sends back on every webhook. Derived from the key, so there's nothing extra to store. */
export async function vapiSecret(): Promise<string> {
  const key = env('VAPI_API_KEY') ?? '';
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`belluh-vapi:${key}`));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}

export function sameSecret(a: string | null, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Restaurants answer the phone between late morning and the dinner rush; Belluh doesn't call outside that (CALL_HOURS, default 10-21). */
export function okToCallNow(tz: string, now = new Date(), hours = env('CALL_HOURS') || '10-21'): boolean {
  const [from, to] = hours.split('-').map(Number);
  const h = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now));
  return Number.isFinite(from) && Number.isFinite(to) ? h >= from && h < to : h >= 10 && h < 21;
}

export interface CallRequest {
  bookingId: string;
  restaurant: string;
  phone: string;
  name: string;        // whose name the table is under (first name is enough)
  people: number;
  day: string;         // "Saturday, October 24"
  time: string;        // "7:00 PM"
  notes?: string | null;
}

/** The voice agent's instructions: honest that it's an AI, brief, and never commits to anything it wasn't asked to. */
export function callPrompt(c: CallRequest): { system: string; first: string } {
  const first = `Hi, this is Belluh, an AI assistant calling for ${c.name}. I'd like to book a table for ${c.people} on ${c.day} at ${c.time}. Do you have anything?`;
  const system = [
    `You are Belluh, an AI assistant on a phone call to ${c.restaurant} to book a table for ${c.name}.`,
    `The request: ${c.people} ${c.people === 1 ? 'person' : 'people'}, ${c.day}, at ${c.time}, under the name ${c.name}.${c.notes ? ` Mention if it fits naturally: ${c.notes}.` : ''}`,
    'You already said you are an AI calling on their behalf. If asked again, say so plainly. Never pretend to be human.',
    'Speak like a polite regular: short sentences, one thing at a time, warm, no filler.',
    'Any time within 30 minutes of the request is fine: accept it. If they offer something further off, do not book it; thank them, ask what the closest time is, and remember it.',
    `Give only the name ${c.name} and the party size. If they ask for a phone number, credit card or deposit, say ${c.name} will call back to give it, and don't book unless they can hold it without one.`,
    'If you reach voicemail, an automated menu you cannot get through, or they say they only book online, end the call politely without leaving a message.',
    'Before hanging up, repeat back the day, time, party size and name once. Then thank them and end the call.',
  ].join('\n');
  return { system, first };
}

/** What the call should come back with. */
const OUTCOME = {
  type: 'object',
  properties: {
    booked: { type: 'boolean', description: 'True only if the restaurant confirmed a reservation on this call.' },
    confirmed_time: { type: 'string', description: 'The confirmed time as HH:mm in 24-hour time, if booked.' },
    name: { type: 'string', description: 'The name the reservation is under.' },
    alternative: { type: 'string', description: 'If not booked, the closest time they offered, in their words.' },
    notes: { type: 'string', description: 'Anything the guests need to know (a deposit, a time limit, call back to confirm), in one short sentence.' },
  },
  required: ['booked'],
};

/** Places the call. Returns Vapi's call id, or null if it couldn't be placed. */
export async function startCall(c: CallRequest, webhookUrl: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const key = env('VAPI_API_KEY'), from = env('VAPI_PHONE_NUMBER_ID');
  if (!key || !from) return null;
  const { system, first } = callPrompt(c);
  try {
    const r = await fetchImpl(`${VAPI()}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        phoneNumberId: from,
        customer: { number: c.phone, name: c.restaurant.slice(0, 40) },
        assistant: {
          name: 'Belluh',
          firstMessage: first,
          firstMessageMode: 'assistant-waits-for-user',   // let the host say hello first
          model: { provider: 'google', model: env('VAPI_MODEL') || 'gemini-2.5-flash', messages: [{ role: 'system', content: system }], tools: [{ type: 'endCall' }] },
          maxDurationSeconds: 240,
          silenceTimeoutSeconds: 20,
          voicemailDetection: { provider: 'vapi' },
          artifactPlan: { recordingEnabled: false },
          analysisPlan: { structuredDataPlan: { enabled: true, schema: OUTCOME } },
          server: { url: webhookUrl, secret: await vapiSecret() },
          serverMessages: ['end-of-call-report'],
        },
        metadata: { booking_id: c.bookingId },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) { console.error('Vapi call failed', r.status, (await r.text()).slice(0, 300)); return null; }
    const json = await r.json().catch(() => ({}));
    return typeof json?.id === 'string' ? json.id : null;
  } catch (e) {
    console.error('Vapi call failed', e);
    return null;
  }
}

export interface CallOutcome {
  callId: string;
  bookingId: string | null;
  booked: boolean;
  time: string | null;          // "19:30"
  alternative: string | null;
  notes: string | null;
  reason: string;               // why it ended, e.g. "customer-did-not-answer"
}

const str = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/** An end-of-call-report as an outcome; null for every other webhook (status updates, transcripts). */
export function parseCallReport(body: any): CallOutcome | null {
  const m = body?.message;
  if (m?.type !== 'end-of-call-report') return null;
  const call = m.call ?? {};
  if (typeof call.id !== 'string') return null;
  const data = m.analysis?.structuredData ?? call.analysis?.structuredData ?? {};
  const t = str(data.confirmed_time, 5);
  return {
    callId: call.id,
    bookingId: str(call.metadata?.booking_id ?? m.metadata?.booking_id, 64),
    booked: data.booked === true,
    time: t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : null,
    alternative: str(data.alternative),
    notes: str(data.notes),
    reason: str(m.endedReason ?? call.endedReason, 80) ?? 'ended',
  };
}

/** Why a call that didn't book ended, in plain words. */
export function whyNot(o: Pick<CallOutcome, 'reason' | 'alternative'>): string {
  if (/voicemail/.test(o.reason)) return 'it went to voicemail';
  if (/did-not-answer|no-answer|busy/.test(o.reason)) return o.reason.includes('busy') ? 'the line was busy' : 'nobody picked up';
  if (/error|failed|fault/.test(o.reason)) return "the call didn't go through";
  return o.alternative ? `they couldn't do that time (closest was ${o.alternative})` : "they couldn't fit you in";
}
