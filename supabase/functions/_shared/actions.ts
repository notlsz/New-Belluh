// Things Belluh does, not just suggests: reminders it sets and sends itself, a table ready to book, gift ideas ready
// to buy. Pure logic (unit-tested in Node). Anything that reaches the partner or costs money still needs the person's tap:
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
