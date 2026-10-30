// Things Bella keeps watching so they don't have to: tickets for a show or a game going on sale (Ticketmaster, in the
// US, Canada, the UK, Ireland, Australia, New Zealand, Mexico and much of Europe), or something they want dropping to a
// price (independent shops on Shopify, US). Checked hourly; the first time it's there, Bella tells them and stops.
// Parsing and deciding are pure, so they're unit-tested in Node.

import type { LocalDate } from './occasions.ts';
import type { ShopProduct } from './shopify.ts';

export interface Watch { id?: string; kind: 'event' | 'price'; what: string; place: string | null; max_cents: number | null; until_on: string }
export interface EventHit { title: string; url: string; date: string | null; venue: string | null; onSale: boolean; saleStarts: string | null; minPrice: number | null; currency: string | null }
export interface Found { title: string; url: string; price: string | null; on_sale: string | null }

// Where Ticketmaster sells tickets: the only places an event watch can be checked
export const TICKETMASTER_COUNTRIES = ['US', 'CA', 'MX', 'GB', 'IE', 'AU', 'NZ', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ'];

const iso = (x: LocalDate) => `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;
const addDays = (x: LocalDate, n: number) => { const t = new Date(Date.UTC(x.y, x.m - 1, x.d + n)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const words = (s: string) => (s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').match(/[\p{L}\p{N}]+/gu) ?? []).filter(w => w.length > 1 && !/^(the|and|for|tickets?|show|concert|live|tour|at|in|of|a)$/.test(w));

/** A watch from what Bella was asked: up to a year, two months unless they said. */
export function validateWatch(a: Record<string, unknown>, today: LocalDate): Watch | null {
  const kind = a.kind === 'event' || a.kind === 'price' ? a.kind : null;
  const what = typeof a.what === 'string' ? a.what.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  if (!kind || what.length < 2 || !words(what).length) return null;
  const place = typeof a.place === 'string' && a.place.trim() ? a.place.trim().slice(0, 80) : null;
  const max = Number(a.max_price);
  const max_cents = Number.isFinite(max) && max > 0 && max < 1_000_000 ? Math.round(max * 100) : null;
  if (kind === 'price' && !max_cents) return null;     // "tell me when it's cheaper" needs a price to beat
  const last = addDays(today, 365);
  let until = iso(addDays(today, 60));
  if (typeof a.until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.until) && a.until > iso(today) && a.until <= iso(last)) until = a.until;
  return { kind, what, place, max_cents, until_on: until };
}

/** Ticketmaster's Discovery API event search, cut down to what matters for a watch. */
export function parseTicketmaster(json: unknown, now = new Date()): EventHit[] {
  const ev = (json as any)?._embedded?.events;
  return (Array.isArray(ev) ? ev : []).flatMap((e: any): EventHit[] => {
    if (typeof e?.name !== 'string' || typeof e?.url !== 'string' || !e.url.startsWith('https://')) return [];
    const code = e?.dates?.status?.code;
    const start = e?.sales?.public?.startDateTime ?? null, end = e?.sales?.public?.endDateTime ?? null;
    const started = !start || new Date(start).getTime() <= now.getTime();
    const ended = end && new Date(end).getTime() < now.getTime();
    const pr = Array.isArray(e?.priceRanges) ? e.priceRanges[0] : null;
    return [{
      title: e.name, url: e.url, date: e?.dates?.start?.localDate ?? null, venue: e?._embedded?.venues?.[0]?.name ?? null,
      onSale: code === 'onsale' && started && !ended, saleStarts: start,
      minPrice: Number.isFinite(Number(pr?.min)) ? Number(pr.min) : null, currency: typeof pr?.currency === 'string' ? pr.currency : null,
    }];
  });
}

/** The event they're waiting for, once tickets are on sale (and within their price, if they gave one). */
export function eventFound(w: Watch, events: EventHit[]): Found | null {
  const want = words(w.what);
  const hit = events.find(e => {
    const have = new Set(words(e.title));
    return e.onSale && want.filter(x => have.has(x)).length >= Math.ceil(want.length * 0.6)
      && (!w.max_cents || e.minPrice == null || e.minPrice * 100 <= w.max_cents);
  });
  if (!hit) return null;
  const price = hit.minPrice != null ? `from ${hit.minPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${hit.currency ?? ''}`.trim() : null;
  return { title: [hit.title, hit.venue, hit.date].filter(Boolean).join(', '), url: hit.url, price, on_sale: hit.saleStarts };
}

const cents = (price: string) => { const n = Number(price.replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null; };

/** The thing they want, at or under their price, from the shops that carry it. The cheapest that really is it. */
export function priceFound(w: Watch, products: ShopProduct[]): Found | null {
  const want = words(w.what);
  const ok = products.map(p => ({ p, c: cents(p.price) }))
    .filter(x => x.c != null && w.max_cents != null && x.c <= w.max_cents)
    .filter(x => { const have = new Set(words(x.p.title)); return want.filter(y => have.has(y)).length >= Math.ceil(want.length * 0.6); })
    .sort((a, b) => a.c! - b.c!);
  return ok.length ? { title: `${ok[0].p.title} at ${ok[0].p.seller}`, url: ok[0].p.url, price: ok[0].p.price, on_sale: null } : null;
}

/** Ticketmaster's event search for a watch, soonest first. */
export function ticketmasterUrl(w: Watch, country: string, key: string): string {
  const p = new URLSearchParams({ apikey: key, keyword: w.what, size: '20', sort: 'date,asc' });
  if (w.place) p.set('city', w.place);
  if (TICKETMASTER_COUNTRIES.includes(country)) p.set('countryCode', country);
  return `https://app.ticketmaster.com/discovery/v2/events.json?${p}`;
}

/** What Bella says when it turns up (the link goes with it, separately). */
export function foundText(w: Watch, f: Found): string {
  return w.kind === 'event'
    ? `Tickets are on sale: ${f.title}${f.price ? `, ${f.price}` : ''}. They can go fast.`
    : `${f.title} is ${f.price}, under the price you wanted.`;
}
