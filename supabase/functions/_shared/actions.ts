// Things Belluh does, not just suggests: reminders it sets and sends itself, a table ready to book, a trip ready to
// book, flowers ready to order, gift ideas ready to buy. Pure logic (unit-tested in Node). Anything that reaches the partner or costs money still needs the person's tap:
// Belluh prepares the booking or the basket, the person finishes it.

import { zonedToUtc } from './plans.ts';

export interface ActionLink { label: string; url: string }

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** "remind me to call his mom Sunday at 5": a short reminder at a future local time (within a year). */
export function validateReminder(raw: unknown, timeZone: string, now = new Date()): { body: string; due_at: string } | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const body = clean(r.text, 300);
  if (body.length < 2) return null;
  const due = typeof r.at === 'string' ? zonedToUtc(r.at, timeZone) : null;
  if (!due) return null;
  const t = new Date(due).getTime();
  if (t < now.getTime() + 60_000 || t > now.getTime() + 366 * 86_400_000) return null;
  return { body, due_at: due };
}

/**
 * A table, ready to book: OpenTable with the date, time and party size filled in, and Google Maps for the place itself.
 * Belluh can't book on the person's behalf (no restaurant API takes bookings from a third party), so it gets them one tap away.
 */
export function tableLinks(raw: unknown, timeZone: string): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const what = clean(r.what, 80) || 'dinner';
  const where = clean(r.where, 80);
  const people = Math.min(20, Math.max(1, Math.round(Number(r.people ?? 2)) || 2));
  const start = typeof r.start === 'string' && zonedToUtc(r.start, timeZone) ? /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(r.start.trim()) : null;
  const term = [what, where].filter(Boolean).join(' ');
  const ot = new URL('https://www.opentable.com/s');
  if (start) ot.searchParams.set('dateTime', `${start[1]}T${start[2]}:00`);
  ot.searchParams.set('covers', String(people));
  ot.searchParams.set('term', term);
  const maps = new URL('https://www.google.com/maps/search/');
  maps.searchParams.set('api', '1');
  maps.searchParams.set('query', where ? `${what} near ${where}` : what);
  return [
    { label: 'Book a table on OpenTable', url: ot.toString() },
    { label: 'See it on Google Maps', url: maps.toString() },
  ];
}

/** Gift ideas drawn from what the partner has said they love or wished for, each one tap from a store. */
export function giftLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const ideas = (Array.isArray(r.ideas) ? r.ideas : []).map(i => clean(i, 80)).filter(i => i.length >= 2).slice(0, 3);
  return ideas.map(idea => {
    const u = new URL('https://www.amazon.com/s');
    u.searchParams.set('k', idea);
    return { label: idea.charAt(0).toUpperCase() + idea.slice(1), url: u.toString() };
  });
}

const dateOnly = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null);
const travelers = (v: unknown) => Math.min(10, Math.max(1, Math.round(Number(v ?? 2)) || 2));

/**
 * A trip (a honeymoon, an anniversary weekend, a getaway): flights, a place to stay and an Airbnb, each search with
 * the dates and travelers filled in. Belluh can't pay for anything, so the person books from here in a tap or two.
 */
export function tripLinks(raw: unknown, today = new Date()): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const to = clean(r.to, 80);
  if (to.length < 2) return [];
  const from = clean(r.from, 80);
  const todayIso = today.toISOString().slice(0, 10);
  let depart = dateOnly(r.depart), back = dateOnly(r.return);
  if (depart && depart < todayIso) { depart = null; back = null; }
  if (back && (!depart || back <= depart)) back = null;
  const people = travelers(r.people);
  const flights = new URL('https://www.google.com/travel/flights');
  flights.searchParams.set('q', `Flights to ${to}${from ? ` from ${from}` : ''}${depart ? ` on ${depart}` : ''}${back ? ` through ${back}` : ''}`);
  const stay = new URL('https://www.booking.com/searchresults.html');
  stay.searchParams.set('ss', to);
  if (depart && back) { stay.searchParams.set('checkin', depart); stay.searchParams.set('checkout', back); }
  stay.searchParams.set('group_adults', String(people));
  stay.searchParams.set('no_rooms', '1');
  const home = new URL(`https://www.airbnb.com/s/${encodeURIComponent(to)}/homes`);
  if (depart && back) { home.searchParams.set('checkin', depart); home.searchParams.set('checkout', back); }
  home.searchParams.set('adults', String(people));
  return [
    { label: `Flights to ${to}`, url: flights.toString() },
    { label: `Hotels in ${to}`, url: stay.toString() },
    { label: `Airbnbs in ${to}`, url: home.toString() },
  ];
}

/** Flowers: florists near where they're going, and the arrangement to order for delivery. */
export function flowerLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const what = clean(r.what, 60) || 'flowers';
  const where = clean(r.where, 80);
  const shop = new URL('https://www.google.com/search');
  shop.searchParams.set('tbm', 'shop');
  shop.searchParams.set('q', `${what} delivery${where ? ` ${where}` : ''}`);
  const maps = new URL('https://www.google.com/maps/search/');
  maps.searchParams.set('api', '1');
  maps.searchParams.set('query', where ? `florist near ${where}` : 'florist near me');
  return [
    { label: `Order ${what} for delivery`, url: shop.toString() },
    { label: where ? `Florists near ${where}` : 'Florists near you', url: maps.toString() },
  ];
}
