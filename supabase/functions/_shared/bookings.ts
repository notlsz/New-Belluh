// What Belluh gets ready (a table, a trip, flowers, a gift, dinner, tickets) becomes part of the couple's story once
// they've done it. Each prepared thing gets an "I booked it" / "I ordered it" tap: that puts it in the calendar,
// sets a reminder, tells the partner (unless it's a surprise), remembers it so Belluh never suggests the same gift
// twice, and afterwards asks how it went so the moment lands in the journal. Pure helpers here; storage in agentcore.

import { zonedToUtc, formatOption } from './plans.ts';

export type BookingKind = 'table' | 'trip' | 'flowers' | 'gift' | 'dinner' | 'experience';
export interface BookingDraft {
  kind: BookingKind;
  title: string;
  starts_at: string | null;   // exact instant (UTC)
  ends_at: string | null;
  all_day: boolean;           // a date without a time (a trip, a delivery day, tickets on a day)
  place: string | null;
  url: string | null;
  surprise: boolean;          // flowers and gifts stay hidden from the partner
  phone?: string | null;      // a table Belluh can call to book (the restaurant's number, from Google Places)
  people?: number | null;
  call_status?: 'ready' | 'calling' | 'booked' | 'failed' | null;
}
export interface Booking extends BookingDraft { id: string; user_id: string; partner_id: string | null; status: 'prepared' | 'booked' | 'dismissed' }

const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const dayStart = (d: unknown, tz: string) => (typeof d === 'string' && DAY.test(d.slice(0, 10)) ? zonedToUtc(`${d.slice(0, 10)}T00:00`, tz) : null);

/** The thing a tool call got ready, as a booking to confirm later. Null for tools that aren't bookings. */
export function bookingFromTool(name: string, args: Record<string, unknown>, tz: string, partnerName: string | null, firstUrl: string | null, productTitle?: string | null): BookingDraft | null {
  const partner = partnerName || 'your partner';
  const base = { url: firstUrl && firstUrl.startsWith('https://') ? firstUrl : null, place: null as string | null, ends_at: null as string | null, all_day: false, surprise: false };
  switch (name) {
    case 'find_table': {
      const what = clean(args.what, 60), where = clean(args.where, 60);
      if (!what && !where) return null;
      const start = typeof args.start === 'string' ? zonedToUtc(args.start, tz) : null;
      return { ...base, kind: 'table', title: cap(what || 'Dinner') + (where ? ` in ${where}` : ''), starts_at: start, place: where || null };
    }
    case 'plan_trip': {
      const to = clean(args.to, 60);
      if (!to) return null;
      const s = dayStart(args.depart, tz), e = dayStart(args.return, tz);
      return { ...base, kind: 'trip', title: `Trip to ${to}`, starts_at: s, ends_at: e && s && e > s ? e : null, all_day: !!s, place: to };
    }
    case 'send_flowers': {
      const what = clean(args.what, 60) || 'flowers';
      return { ...base, kind: 'flowers', title: `${cap(what)} for ${partner}`, starts_at: dayStart(args.deliver_on, tz), all_day: true, place: clean(args.where, 80) || null, surprise: true };
    }
    case 'buy_item': {
      const item = clean(productTitle, 80) || clean(args.item, 80);
      return item ? { ...base, kind: 'gift', title: cap(item), starts_at: null, surprise: true } : null;
    }
    case 'gift_ideas': {
      const first = Array.isArray(args.ideas) ? clean(args.ideas[0], 80) : '';
      const item = clean(productTitle, 80) || first;
      return item ? { ...base, kind: 'gift', title: cap(item), starts_at: null, surprise: true } : null;
    }
    case 'order_food': {
      const what = clean(args.what, 60);
      return what ? { ...base, kind: 'dinner', title: cap(what), starts_at: null, place: clean(args.where, 60) || null } : null;
    }
    case 'find_experience': {
      const what = clean(args.what, 60);
      if (!what) return null;
      const s = dayStart(args.on, tz);
      return { ...base, kind: 'experience', title: cap(what), starts_at: s, all_day: !!s, place: clean(args.where, 60) || null };
    }
    default: return null;
  }
}

/** The button: things you reserve are booked, things you buy are ordered. */
export const doneLabel = (k: BookingKind) => (k === 'table' || k === 'trip' || k === 'experience' ? 'I booked it' : 'I ordered it');

/** "Sat, Oct 24 at 7:00 PM", or "Sat, Oct 24" for a whole day; null without a date. */
export function whenText(b: Pick<BookingDraft, 'starts_at' | 'all_day'>, tz: string): string | null {
  if (!b.starts_at) return null;
  const full = formatOption({ starts_at: b.starts_at }, tz);
  return b.all_day ? full.replace(/ at .*$/, '') : full;
}

/** What Belluh remembers once it's done, so it never suggests the same gift twice and knows what they've tried. */
export function memoryFor(b: BookingDraft, partnerName: string | null, tz: string, now = new Date()): string {
  const partner = partnerName || 'their partner';
  const when = whenText(b, tz);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: tz }).format(b.starts_at ? new Date(b.starts_at) : now);
  switch (b.kind) {
    case 'gift': return `Bought ${partner} a gift: ${b.title} (${month}).`;
    case 'flowers': return `Sent ${b.title.toLowerCase().startsWith('flowers') ? 'flowers' : b.title.replace(/ for .*$/, '').toLowerCase()} to ${partner}${when ? ` for ${when}` : ` (${month})`}.`;
    case 'dinner': return `Ordered ${b.title} in (${month}).`;
    case 'trip': return `Booked a trip: ${b.title.replace(/^Trip to /, '')}${when ? `, leaving ${when}` : ''}.`;
    default: return `Booked ${b.title}${when ? ` for ${when}` : ''}.`;
  }
}

/** One reminder before it happens: the evening before (6pm) when it's more than a day away, else two hours before. */
export function reminderFor(b: BookingDraft, tz: string, now = new Date()): { due_at: string; body: string } | null {
  if (!b.starts_at) return null;
  const start = new Date(b.starts_at).getTime();
  if (start <= now.getTime() + 30 * 60_000) return null;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(start - 86_400_000));
  const eveBefore = zonedToUtc(`${day}T18:00`, tz);
  const useEve = !!eveBefore && new Date(eveBefore).getTime() > now.getTime() + 30 * 60_000 && start - now.getTime() > 26 * 3600_000;
  const due = useEve ? eveBefore! : new Date(Math.max(now.getTime() + 15 * 60_000, start - 2 * 3600_000)).toISOString();
  const time = b.all_day ? '' : ` at ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(start))}`;
  const lead = useEve ? 'Tomorrow' : 'Today';
  const body = b.kind === 'flowers' ? `${lead}: the ${b.title.toLowerCase()} arrive. Have the card message ready.`
    : b.kind === 'trip' ? `${lead}: ${b.title}. Passports, chargers, and the good snacks.`
    : `${lead}: ${b.title}${time}.`;
  return { due_at: due, body };
}

/** Whether to ask "How was it?" now: 8 to 48 hours after it ended. Gifts and dinner in don't get asked. */
export function readyForFollowUp(b: Pick<BookingDraft, 'kind' | 'starts_at' | 'ends_at' | 'all_day'>, now = new Date()): boolean {
  if (!b.starts_at || b.kind === 'gift' || b.kind === 'dinner') return false;
  const end = b.ends_at ? new Date(b.ends_at).getTime() + 86_400_000 : new Date(b.starts_at).getTime() + (b.all_day ? 86_400_000 : 2 * 3600_000);
  const since = now.getTime() - end;
  return since >= 8 * 3600_000 && since <= 48 * 3600_000;
}

/** The question afterwards, in Belluh's voice. */
export function followUpText(b: Pick<BookingDraft, 'kind' | 'title'>, partnerName: string | null): string {
  if (b.kind === 'flowers') return `Did ${partnerName || 'they'} love the ${b.title.replace(/ for .*$/, '').toLowerCase()}? Tell me how it landed and I'll keep it in your journal.`;
  if (b.kind === 'trip') return `Welcome back. How was the ${b.title.replace(/^Trip/, 'trip')}? Give me the moment you'll still talk about, and I'll keep it in your journal.`;
  return `How was ${b.title}? Tell me a line or two while it's fresh and I'll keep it in your journal.`;
}
