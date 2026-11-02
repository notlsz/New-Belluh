// Bella closes the loop herself. A table she phoned for is booked when the restaurant says so on the call; an order is
// ordered when the shop confirms it (its order webhook, or the checkout coming back completed). Only then is it marked
// done, with what was actually confirmed: the time, the party size, the reference, the delivery day. When nothing
// machine-readable will ever come back (a link to an outside site), the "I booked it" tap stays, and Bella asks once
// whether it went through. She never spends money: the person pays on the shop's own page, and anything that could
// charge them needs their explicit yes for that item at that price. Pure rules here, unit-tested; storage in agentcore.

import type { BookingKind } from './bookings.ts';
import { zonedToUtc } from './plans.ts';

/** How a booking gets confirmed: Bella's call, the shop's own confirmation, or asking the person. */
export type ConfirmVia = 'call' | 'checkout' | 'ask';

export function confirmVia(b: { kind: BookingKind | string; phone?: string | null; call_status?: string | null; checkout?: boolean }): ConfirmVia {
  if (b.kind === 'table' && b.phone && b.call_status && b.call_status !== 'failed') return 'call';
  if (b.checkout) return 'checkout';
  return 'ask';
}

// ---------- Calls ----------

export interface CallReport { booked: boolean; time: string | null; people: number | null; ref: string | null; alternative: string | null; notes: string | null; reason: string }

export type CallDecision =
  | { state: 'booked'; starts_at: string | null; people: number | null; ref: string | null; movedMinutes: number; peopleChanged: boolean }
  | { state: 'failed'; alternative: string | null; offerNext: true };

/**
 * What a finished call means for the booking. Booked only when the restaurant confirmed it on the call; the booking
 * then follows what they confirmed (the time they gave on the same day, the party size they said), and how far that
 * moved from what was asked is kept so Bella says so. Anything else is not booked, and Bella offers the next option.
 */
export function decideCall(b: { starts_at: string | null; people: number | null }, o: CallReport, tz: string): CallDecision {
  if (o.booked !== true) return { state: 'failed', alternative: o.alternative, offerNext: true };
  let startsAt = b.starts_at;
  if (o.time && b.starts_at) {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(b.starts_at));
    startsAt = zonedToUtc(`${day}T${o.time}`, tz) ?? startsAt;
  }
  const moved = startsAt && b.starts_at ? Math.round((new Date(startsAt).getTime() - new Date(b.starts_at).getTime()) / 60_000) : 0;
  const people = o.people ?? b.people ?? null;
  return { state: 'booked', starts_at: startsAt, people, ref: o.ref, movedMinutes: moved, peopleChanged: !!(o.people && b.people && o.people !== b.people) };
}

const timeIn = (iso: string, tz: string) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(iso));

/** What Bella says after the call: exactly what she got (and what changed), or why not and what's next. English; localized on send. */
export function callLine(b: { place: string | null; title: string; starts_at: string | null; people: number | null }, d: CallDecision, tz: string, why: string, notes: string | null): string {
  const place = b.place || b.title;
  if (d.state === 'failed') {
    return `I called ${place}, but ${why}, so nothing is booked.${notes ? ` ${notes}` : ''} Want me to find another spot${d.alternative ? `, or take ${d.alternative} there` : ''}?`;
  }
  const out: string[] = [];
  if (d.movedMinutes && b.starts_at && d.starts_at) {
    out.push(`They couldn't do ${timeIn(b.starts_at, tz)}, so I took ${timeIn(d.starts_at, tz)}.`);
    if (Math.abs(d.movedMinutes) > 30) out.push(`That's further from what you asked than I'd like. Want me to look for ${timeIn(b.starts_at, tz)} somewhere else?`);
  }
  if (d.peopleChanged && d.people) out.push(`Heads up: they have it down for ${d.people}, not ${b.people}.`);
  return out.join(' ');
}

// ---------- Orders ----------

export interface OrderConfirmation { orderId: string; checkoutId: string | null; ref: string; deliveryOn: string | null; canceled: boolean }

const DATE = /^(\d{4}-\d{2}-\d{2})/;
const str = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/** The latest delivery date anywhere in the order's fulfillment (an expectation, an estimated delivery), as YYYY-MM-DD. */
function deliveryDate(f: unknown): string | null {
  let best: string | null = null;
  const walk = (x: unknown, key: string, depth: number) => {
    if (depth > 5 || x == null) return;
    if (typeof x === 'string') {
      const m = DATE.exec(x);
      if (m && /deliver|arriv|latest|expected|fulfillable/i.test(key) && (!best || m[1] > best)) best = m[1];
      return;
    }
    if (Array.isArray(x)) { for (const y of x.slice(0, 20)) walk(y, key, depth + 1); return; }
    if (typeof x === 'object') for (const [k, v] of Object.entries(x as object)) walk(v, /deliver|arriv/i.test(key) ? `${key}.${k}` : k, depth + 1);
  };
  walk(f, '', 0);
  return best;
}

/**
 * A confirmed order, from the shop's order webhook (the order itself, or wrapped as { order }) or from a checkout that
 * came back completed with its order. Null when there is no order yet: nothing is ever marked ordered on a guess.
 */
export function parseOrder(json: unknown): OrderConfirmation | null {
  const j = json as any;
  const checkout = j?.result?.structuredContent ?? (j?.status && j?.order ? j : null);
  const order = checkout?.order ?? j?.order ?? j;
  if (checkout && checkout.status !== undefined && checkout.status !== 'completed') return null;
  const orderId = str(order?.id, 120);
  if (!orderId) return null;
  const checkoutId = str(order?.checkout_id, 200) ?? str(checkout?.id, 200);
  const label = str(order?.label ?? order?.name ?? order?.order_number ?? order?.number, 40);
  const ref = (label ?? orderId.split('/').pop() ?? orderId).replace(/^#/, '').slice(0, 40);
  const events = [...(Array.isArray(order?.fulfillment?.events) ? order.fulfillment.events : []), ...(Array.isArray(order?.adjustments) ? order.adjustments : [])];
  const canceled = events.some((e: any) => /^cancel/.test(String(e?.type ?? '')) && (e?.status === undefined || e?.status === 'completed'))
    || (Array.isArray(order?.line_items) && order.line_items.length > 0 && order.line_items.every((l: any) => l?.status === 'removed'));
  return { orderId, checkoutId, ref, deliveryOn: deliveryDate(order?.fulfillment), canceled };
}

/** The profile a webhook says it came from must be the shop the checkout was opened at (or its subdomain). */
export function sameShop(profileUrl: string | null, shop: string | null): boolean {
  if (!profileUrl || !shop) return false;
  let host: string;
  try { const u = new URL(profileUrl); if (u.protocol !== 'https:') return false; host = u.hostname.toLowerCase(); } catch { return false; }
  const s = shop.toLowerCase();
  return host === s || host.endsWith(`.${s}`);
}

// ---------- Spending ----------

export interface SpendApproval { booking_id: string; item: string; cents: number; at: string }

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * Money is only ever spent with the person's explicit yes for this item at this price: the same booking, the same item,
 * no more than the price they saw, and given in the last 24 hours. Anything less is a no.
 */
export function spendAllowed(approval: SpendApproval | null | undefined, ask: { booking_id: string; item: string; cents: number }, now = new Date()): boolean {
  if (!approval || !ask || approval.booking_id !== ask.booking_id) return false;
  if (!(ask.cents > 0) || !(approval.cents > 0) || ask.cents > approval.cents) return false;
  if (!ask.item || norm(approval.item) !== norm(ask.item)) return false;
  const at = new Date(approval.at).getTime();
  return Number.isFinite(at) && at <= now.getTime() && now.getTime() - at < 24 * 3600_000;
}

/** Shop tools that would charge someone. Bella's code may call them only with an approval that passes spendAllowed. */
export const SPENDS = /^(complete_checkout|complete|pay|place_order|submit_order)$/;

// ---------- Asking once when nothing will come back ----------

export interface Pending { kind: BookingKind | string; status: string; confirm_via?: ConfirmVia | null; call_status?: string | null; created_at: string; starts_at: string | null; follow_up_at?: string | null }

/**
 * Whether to ask "Did it go through?" now. Once per booking, only while it's still waiting on them, for what Bella
 * can't confirm herself (or a shop order with no word from the shop after a day). About 20 hours after she got it
 * ready, sooner when it's coming up (three hours before), never before three hours have passed, and never once it's
 * a day past or over a week old.
 */
export function followUpDue(b: Pending, now = new Date()): boolean {
  if (b.status !== 'prepared' || b.follow_up_at) return false;
  if (b.call_status === 'calling' || b.call_status === 'booked') return false;
  const created = new Date(b.created_at).getTime(), t = now.getTime();
  if (!Number.isFinite(created) || t - created > 7 * 86_400_000) return false;
  const start = b.starts_at ? new Date(b.starts_at).getTime() : null;
  if (start !== null && t > start + 86_400_000) return false;
  let due = created + (b.confirm_via === 'checkout' ? 24 : 20) * 3600_000;
  if (start !== null) due = Math.min(due, start - 3 * 3600_000);
  due = Math.max(due, created + 3 * 3600_000);
  return t >= due;
}

const ORDERS = new Set(['flowers', 'gift', 'dinner']);
export const isOrder = (k: string) => ORDERS.has(k);

/** The one question, in Bella's voice. Texting adds the reply word the inbox understands. */
export function followUpAsk(b: { kind: string; title: string; surprise?: boolean }, texting: boolean): string {
  const t = b.title;
  const q = b.surprise && texting ? 'Did your surprise go through?'
    : b.kind === 'experience' ? `Did the tickets for ${t} go through?`
    : b.kind === 'trip' ? `Did ${t.replace(/^Trip/, 'the trip')} get booked?`
    : b.kind === 'table' ? `Did you get the table (${t})?`
    : b.kind === 'flowers' ? `Did the ${t.replace(/ for .*$/, '').toLowerCase()} order go through?`
    : b.kind === 'gift' ? `Did you order ${t}?`
    : `Did the ${t} order go through?`;
  return texting
    ? `${q} Reply ${isOrder(b.kind) ? 'ORDERED' : 'BOOKED'} if it did and I'll add it to your calendar, or tell me what happened.`
    : `${q} Tell me if it did and I'll add it to your calendar and set a reminder.`;
}

/** Their answer to "Did it go through?", from a tap or a short reply. */
export function readAnswer(text: string): 'yes' | 'not_yet' | 'no' | null {
  const s = text.toLowerCase().replace(/[’]/g, "'").trim();
  if (/^(no|nope|didn'?t|did not|not (doing|going)|we('re| are) not|cancel(led)?|forget it)\b/.test(s)) return 'no';
  if (/^(not yet|soon|later|still (need|have) to|haven'?t yet)\b/.test(s)) return 'not_yet';
  if (/^(yes|yep|yeah|yup|done|it did|it went through|booked|ordered|bought|we did|sure did)\b/.test(s)) return 'yes';
  return null;
}

// ---------- Reading a confirmation they forwarded ----------

export interface ReadConfirmation { ref: string | null; time: string | null; people: number | null }

/**
 * A confirmation email or screenshot text they passed on: the confirmation or order number, the time, the party size.
 * Only what is written there; anything missing stays null.
 */
export function readConfirmation(text: string): ReadConfirmation {
  const s = text.replace(/\s+/g, ' ').slice(0, 4000);
  // A reference has a digit in it ("4KD9-22", "#10423"); words after "confirmation" are not one
  const refs = [...s.matchAll(/\b(?:confirmation|conf\.?|booking|reservation|order|reference|ref\.?)\s*(?:number|no\.?|code|id|#)?\s*[:#]?\s*#?\s*([A-Z0-9][A-Z0-9-]{3,19})\b/gi), ...s.matchAll(/(?:^|\s)#\s?([A-Z0-9][A-Z0-9-]{3,19})\b/g)];
  const hit = refs.map(m => m[1]).find(r => /\d/.test(r));
  const ref = hit ? hit.toUpperCase() : null;
  const tm = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*([ap])\.?m\.?\b/i.exec(s) ?? /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(s);
  let time: string | null = null;
  if (tm) {
    let h = Number(tm[1]); const m = tm[2] ?? '00';
    if (tm[3]) { const pm = tm[3].toLowerCase() === 'p'; if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    time = `${String(h).padStart(2, '0')}:${m}`;
  }
  const pp = /\b(?:party of|table for|for)\s+(\d{1,2})\b(?!\s*(?:am|pm|:))/i.exec(s) ?? /\b(\d{1,2})\s+(?:people|guests|persons|covers|diners)\b/i.exec(s);
  const n = pp ? Number(pp[1]) : NaN;
  return { ref, time, people: n >= 1 && n <= 20 ? n : null };
}

/** Which of their waiting bookings a forwarded confirmation is about: the one whose name it mentions, or the only one. */
export function matchBooking<T extends { id: string; title: string; place: string | null }>(text: string, waiting: T[]): T | null {
  if (waiting.length === 1) return waiting[0];
  const words = (x: string) => new Set(norm(x).split(' ').filter(w => w.length >= 4));
  const said = words(text);
  const scored = waiting.map(b => ({ b, n: [...words(`${b.title} ${b.place ?? ''}`)].filter(w => said.has(w)).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
  return scored.length && (scored.length === 1 || scored[0].n > scored[1].n) ? scored[0].b : null;
}

// ---------- What it says once it's done ----------

export interface DoneDetail { by: 'bella' | 'person'; ref?: string | null; people?: number | null; deliveryOn?: string | null; seller?: string | null }

/** The first line of the confirmation: who confirmed it and exactly what was confirmed. */
export function doneHeadline(b: { kind: string; title: string; place: string | null; surprise: boolean }, d: DoneDetail, when: string | null, partner: string | null, myFirst: string | null): string {
  const order = isOrder(b.kind);
  const name = b.kind === 'table' && b.place ? b.place : b.title;
  const facts: string[] = [];
  if (when) facts.push(order && b.kind !== 'dinner' ? `arriving ${when}` : when);
  if (b.kind === 'table' && d.people) facts.push(`table for ${d.people}${d.by === 'bella' && myFirst ? ` under ${myFirst}` : ''}`);
  if (d.ref) facts.push(`${order ? 'order' : 'ref'} ${d.ref}`);
  const head = d.by === 'bella'
    ? (order ? `Ordered and confirmed${d.seller ? ` by ${d.seller}` : ''}: ${name}` : `Booked by Bella: ${name}`)
    : `${order ? 'Ordered' : 'Booked'}: ${name}`;
  return `${head}${facts.length ? `, ${facts.join(', ')}` : ''}.`;
}

/** What goes to their phone when it's a surprise: nothing on a lock screen gives it away. */
export function discreetLine(b: { surprise: boolean }, full: string): string {
  return b.surprise ? 'Your surprise is confirmed. The details are in Belluh.' : full;
}

/** The partner's line: Bella booked it for the two of them (never sent for a surprise). */
export function partnerLine(b: { title: string; place: string | null; kind: string }, d: DoneDetail, when: string | null, myName: string): string {
  const name = b.kind === 'table' && b.place ? b.place : b.title;
  const who = d.by === 'bella' ? `Bella booked ${name} for you and ${myName}` : `${myName} booked ${name}`;
  return `${who}${when ? `, ${when}` : ''}.${when ? " It's in both your calendars and I'll remind you both." : ''}`;
}
