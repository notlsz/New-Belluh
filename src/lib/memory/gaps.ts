// "Fill the gaps between dates", after Rollup's gaps between visits: what happened since the couple's last date,
// read on this device from the photos the person indexed (a trip, a place they went, something new they keep
// photographing), as a few dated moments and one short text summary. The summary is the only thing that leaves the
// phone, and only when Memory is on and AI answers are allowed; Bella uses it to make the next-date idea personal.
// Pure, so it's unit-tested.

import type { IndexedItem, Interest } from './types.ts';

export interface DateMark { at: string; title: string | null }

interface PlanLike { status: string; title: string; chosen_option: string | null; options: { id: string; starts_at: string }[] }
interface BookingLike { kind: string; status: string; title: string; starts_at: string | null }
/** Kinds of booking that are a date together (not flowers, a gift or dinner delivered) */
const DATE_KINDS = new Set(['table', 'experience', 'trip']);

/** The couple's last date before now: a plan both said yes to, or a table, tickets or trip they booked */
export function lastDateOf(plans: PlanLike[], bookings: BookingLike[], now: number): DateMark | null {
  const marks: DateMark[] = [];
  for (const p of plans ?? []) {
    if (p.status !== 'confirmed') continue;
    const o = p.options?.find(x => x.id === p.chosen_option);
    if (o?.starts_at) marks.push({ at: o.starts_at, title: p.title || null });
  }
  for (const b of bookings ?? []) if (b.status === 'booked' && DATE_KINDS.has(b.kind) && b.starts_at) marks.push({ at: b.starts_at, title: b.title || null });
  const past = marks.filter(m => { const t = Date.parse(m.at); return Number.isFinite(t) && t <= now; }).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return past[0] ?? null;
}

export type MomentKind = 'trip' | 'place' | 'moment';
export interface GapMoment { day: string; kind: MomentKind; name: string; days: number; id: string }
export interface Gaps {
  /** YYYY-MM-DD of the last date, or of the start of the window when no date is known */
  since: string;
  lastTitle: string | null;
  /** No date on record: the window is the last few weeks */
  noDate: boolean;
  moments: GapMoment[];
  newInterests: string[];
  /** The text Bella gets (English, short); never ids or coordinates */
  summary: string;
}

export const GAP_DEFAULT_DAYS = 30;
export const GAP_SUMMARY_MAX = 700;
const LABEL_SURE = 0.3;
/** Labels that say nothing about what they did */
const DULL = new Set(['screenshot', 'document', 'text', 'receipt', 'selfie', 'person', 'people', 'indoor', 'room', 'wall', 'ceiling', 'floor', 'sky', 'phone', 'screen', 'computer', 'paper']);

const day = (iso: string | null) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : null);
const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => ymd(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000);
const mostOf = (xs: (string | null | undefined)[]) => { const m = new Map<string, number>(); for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null; };

/** Where they live, judged from every located photo: the city that shows up most */
export const homeCityOf = (items: IndexedItem[]) => mostOf(items.filter(i => !i.sensitivity).map(i => i.location?.city));

/**
 * The moments between the last date and now, from indexed items (sensitive ones and screenshots left out). Trips away
 * from home come first, then places they went, then what a day mostly showed. At most `max` moments, oldest first.
 */
export function gapsBetweenDates(items: IndexedItem[], o: { last: DateMark | null; now: number; interests?: Interest[]; home?: string | null; max?: number }): Gaps | null {
  const today = ymd(o.now);
  const noDate = !o.last;
  const since = (o.last && day(o.last.at)) || addDays(today, -GAP_DEFAULT_DAYS);
  const pool = items.filter(i => !i.sensitivity && i.mediaType !== 'screenshot');
  const home = o.home ?? homeCityOf(pool);
  // After the last date's own day, up to today
  const recent = pool.filter(i => { const d = day(i.date); return !!d && d > since && d <= today; }).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

  const byDay = new Map<string, IndexedItem[]>();
  for (const i of recent) { const d = day(i.date)!; byDay.set(d, [...(byDay.get(d) ?? []), i]); }

  // Trips: consecutive days away from home in the same city become one moment
  const trips: GapMoment[] = [];
  const places: GapMoment[] = [];
  const small: GapMoment[] = [];
  let open: GapMoment | null = null;
  for (const [d, rs] of byDay) {
    const away = home ? mostOf(rs.filter(r => r.location?.city && r.location.city !== home).map(r => r.location!.city)) : null;
    if (away) {
      if (open && open.name === away && addDays(open.day, open.days) === d) { open.days++; continue; }
      open = { day: d, kind: 'trip', name: away, days: 1, id: rs.find(r => r.location?.city === away)!.id };
      trips.push(open);
      continue;
    }
    open = null;
    const venue = rs.find(r => r.places[0]?.name);
    if (venue) { places.push({ day: d, kind: 'place', name: venue.places[0].name, days: 1, id: venue.id }); continue; }
    const labels = rs.flatMap(r => r.labels.filter(l => l.p >= LABEL_SURE && !DULL.has(l.name.toLowerCase())).map(l => ({ name: l.name, id: r.id })));
    const top = mostOf(labels.map(l => l.name));
    if (top) small.push({ day: d, kind: 'moment', name: top, days: 1, id: labels.find(l => l.name === top)!.id });
  }
  const max = o.max ?? 4;
  // One of each name; trips first, then places, then small moments, spread over the window
  const picked: GapMoment[] = [];
  const names = new Set<string>();
  for (const group of [trips, places, spread(small, max)]) for (const m of group) {
    if (picked.length >= max || names.has(m.name.toLowerCase())) continue;
    names.add(m.name.toLowerCase()); picked.push(m);
  }
  picked.sort((a, b) => a.day.localeCompare(b.day));

  const newInterests = (o.interests ?? [])
    .filter(i => (i.first > since) || (i.status === 'emerging' && i.last > since))
    .slice(0, 3).map(i => i.name);
  if (!picked.length && !newInterests.length) return null;

  const lastTitle = o.last?.title ?? null;
  const said = picked.map(m => `${m.day} ${m.kind === 'trip' ? `a trip to ${m.name}${m.days > 1 ? ` (${m.days} days)` : ''}` : m.kind === 'place' ? `went to ${m.name}` : `photos of ${m.name}`}`);
  let summary = `${noDate ? `In the last ${GAP_DEFAULT_DAYS} days (no date on record)` : `Since their last date on ${since}${lastTitle ? ` ("${lastTitle.slice(0, 60)}")` : ''}`}: ${said.join('; ') || 'nothing dated stands out'}.`;
  if (newInterests.length) summary += ` New lately: ${newInterests.join(', ')}.`;
  if (summary.length > GAP_SUMMARY_MAX) summary = summary.slice(0, GAP_SUMMARY_MAX - 3) + '...';
  return { since, lastTitle, noDate, moments: picked, newInterests, summary };
}

/** Up to n items spread evenly over the list, keeping their order */
function spread<T>(xs: T[], n: number): T[] {
  if (xs.length <= n) return xs;
  return Array.from({ length: n }, (_, i) => xs[Math.round((i * (xs.length - 1)) / (n - 1 || 1))]);
}

// Asking for a date, in each language: Bella gets the gaps summary with these (and with "Next date" in the app)
const DATE_ASK = /\b(date night|next date|plan (a|our|the) date|plan something (for|with) (us|her|him)|what should we do (this|on|for)|ideas? for (a|our) date|take (her|him|them) out)\b|デート|约会|約會|데이트|\b(rendez-vous|soirée en amoureux|sortir (avec|à deux))\b|\b(appuntamento|serata (romantica|a due))\b|\b(ein date|verabredung|abend zu zweit)\b|\b(cita|salir (juntos|a cenar)|noche de pareja)\b|\b(encontro|programa a dois|noite a dois)\b/iu;
export const looksLikeDateAsk = (text: string) => text.length <= 1000 && DATE_ASK.test(text);
