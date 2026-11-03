// Events, after Rollup's `events` option: the concerts, festivals, games, shows and races the person went to, found on
// the device from visits to venues (the venue's kind comes from memory-places when places are on), what the photos
// show (a stage, a crowd, a stadium) and tickets read from screenshots and photos (OCR, already in the index).
//
// An event is kept only when the photos support it: a label that shows one, a ticket for that day, or, with the lookup
// on, a listing at the venue plus photos taken at the venue itself over a while. A walk past an arena on a game night
// does not count.
//
// The lookup is opt-in (IndexOptions.events, needs places): for each visit that looks like an event, only the 0.01
// degree cell it is in (one of the cells places already sends), the names of event venues in it and the visit's local
// start and end times go to Belluh's memory-events function. Never coordinates, photos, labels or text.
//
// Pure (no IndexedDB, no network), so it is unit-tested.

import type { ToolResult } from './types.ts';
import { dayOf, LABEL_MIN, usable, type Rec } from './logic.ts';
import { cellOf, KIND_WORDS } from './geo.ts';

export type EventKind = 'concert' | 'festival' | 'game' | 'show' | 'race';
export const EVENT_KINDS: EventKind[] = ['concert', 'festival', 'game', 'show', 'race'];

/** What a lookup found for a visit (memory-events) */
export interface EventHit { name: string; kind: EventKind; genre?: string | null; performers?: string[]; venue?: string | null; source?: string }
/** What an item in an event's visit carries, on the device */
export interface ItemEvent { name: string | null; kind: EventKind; venue: string | null; genre?: string | null }

export interface EventRec {
  key: string;
  day: string;               // YYYY-MM-DD, the evening it belongs to (a 1 am encore counts for the night before)
  start: number | null; end: number | null;   // wall-clock ms
  kind: EventKind;
  name: string | null;       // the artist, teams, festival or race, when a lookup or a ticket says
  venue: string | null; city: string | null;
  genre: string | null;
  performers: string[];
  source: 'photos' | 'ticket' | 'lookup';
  ticket: boolean;
  upcoming: boolean;         // a ticket for a day still to come
  ids: string[];
}

/** One visit: photos close in time in one ~1 km cell (or with no place, one evening) */
export interface Visit {
  key: string;               // `${day}|${cell}`: stable across runs, so lookups are asked once
  day: string; cell: string | null;
  start: number; end: number;
  venue: { name: string; kind: string } | null;
  ids: string[];
  labelKind: EventKind | null; labelHits: number;
  atVenue: number;           // photos matched to an event venue itself
  city: string | null;
}

// Venues whose kind makes a visit worth a look, and what they usually hold
const VENUE_KIND: Record<string, EventKind> = { stadium: 'game', music_venue: 'concert', theatre: 'show', arts_centre: 'show', ice_rink: 'game' };
export const isEventVenue = (kind: string | null | undefined) => !!kind && kind in VENUE_KIND;
// Labels that show an event, and which kind
const LABEL_KIND: Record<string, EventKind> = { concert: 'concert', 'music festival': 'festival', stadium: 'game', 'baseball game': 'game', 'football game': 'game', 'theater show': 'show' };
// Shown at a sports venue, these mean a game too
const AT_VENUE_LABEL: Record<string, EventKind> = { basketball: 'game', soccer: 'game', 'ice skating': 'game', nightclub: 'concert' };

const EVENING_SHIFT = 5 * 3_600_000;
export const eventDay = (wall: number) => dayOf(wall - EVENING_SHIFT)!;
const GAP = 3 * 3_600_000;

function labelKindOf(r: Rec, venueKind: string | null): EventKind | null {
  for (const l of r.labels) {
    if (l.p < LABEL_MIN) continue;
    if (LABEL_KIND[l.name]) return LABEL_KIND[l.name];
    if (venueKind && isEventVenue(venueKind) && AT_VENUE_LABEL[l.name]) return VENUE_KIND[venueKind] === 'game' ? 'game' : AT_VENUE_LABEL[l.name];
  }
  return null;
}
const cellFor = (r: Rec) => r.exact ? cellOf(r.exact.lat, r.exact.lng) : r.location ? cellOf(r.location.lat, r.location.lng) : null;
const most = <T,>(xs: T[], key: (x: T) => string): T | null => {
  const m = new Map<string, { x: T; n: number }>();
  for (const x of xs) { const k = key(x); const e = m.get(k); if (e) e.n++; else m.set(k, { x, n: 1 }); }
  return [...m.values()].sort((a, b) => b.n - a.n)[0]?.x ?? null;
};

/** Photos grouped into visits: one evening, one cell, no gap of more than three hours. Sensitive items never count. */
export function visitsOf(items: Rec[]): Visit[] {
  const pool = items.filter(r => usable(r) && r.wall != null && r.mediaType !== 'screenshot').sort((a, b) => a.wall! - b.wall!);
  const groups = new Map<string, Rec[][]>();
  for (const r of pool) {
    const k = `${eventDay(r.wall!)}|${cellFor(r) ?? ''}`;
    const runs = groups.get(k) ?? [];
    const last = runs[runs.length - 1];
    if (last && r.wall! - last[last.length - 1].wall! <= GAP) last.push(r); else runs.push([r]);
    groups.set(k, runs);
  }
  const out: Visit[] = [];
  for (const [k, runs] of groups) {
    // One visit per evening and cell: the run with the most photos (others are coming and going)
    const rs = runs.sort((a, b) => b.length - a.length)[0];
    const [day, cell] = k.split('|');
    const venues = rs.flatMap(r => r.places[0] ? [r.places[0]] : []);
    const ev = venues.filter(v => isEventVenue(v.kind));
    const venue = most(ev.length ? ev : venues, v => v.name);
    const kinds = rs.map(r => labelKindOf(r, r.places[0]?.kind ?? venue?.kind ?? null)).filter((x): x is EventKind => !!x);
    out.push({
      key: `${day}|${cell}`, day, cell: cell || null, start: rs[0].wall!, end: rs[rs.length - 1].wall!,
      venue: venue ? { name: venue.name, kind: venue.kind } : null,
      ids: rs.map(r => r.id), labelKind: most(kinds, x => x), labelHits: kinds.length,
      atVenue: ev.length,
      city: most(rs.map(r => r.location?.city).filter((x): x is string => !!x), x => x),
    });
  }
  return out.sort((a, b) => b.start - a.start);
}

/** Visits worth asking the lookup about: photos that look like an event, or an event venue in the cell */
export function lookupCandidates(visits: Visit[], venuesNear: (v: Visit) => { name: string; kind: string }[] = () => []): { visit: Visit; venues: string[] }[] {
  const out: { visit: Visit; venues: string[] }[] = [];
  for (const v of visits) {
    if (!v.cell) continue;
    const near = venuesNear(v).filter(x => isEventVenue(x.kind)).map(x => x.name);
    const names = [...new Set([...(v.venue && isEventVenue(v.venue.kind) ? [v.venue.name] : []), ...near])].slice(0, 5);
    if (!v.labelHits && !names.length) continue;
    out.push({ visit: v, venues: names });
  }
  return out;
}

/** What one visit sends, when the person turned the lookup on: the cell, venue names and local times. Nothing else. */
export function lookupRequest(c: { visit: Visit; venues: string[] }): { cell: string; venues: string[]; start: string; end: string } {
  const iso = (w: number) => new Date(w).toISOString().slice(0, 16);
  return { cell: c.visit.cell!, venues: c.venues, start: iso(c.visit.start), end: iso(Math.max(c.visit.end, c.visit.start + 3_600_000)) };
}

// ------------------------------------------------------------------------------------------------------------ tickets

const TRANSPORT = /\b(boarding pass|boarding|flight|airline|gate closes|train|rail|platform|carriage|coach \d|departure|depart|arrival|bus|ferry|metro|subway|parking)\b|搭乗|航班|登机|列车|탑승|기차|embarquement|imbarco|einsteigen|embarque/i;
const TICKET = /\b(tickets?|e-?tickets?|mobile ticket|admission|general admission|seat|row|sec(tion)?|gate|doors( open)?|entry|entrance|ticketmaster|live nation|axs|dice|eventbrite|seatgeek|stubhub|see tickets|ticketek|eventim|ticketone|fnac spectacles)\b|チケット|入場|座席|开场|门票|入场|座位|티켓|입장|좌석|\b(billets?|biglietto|biglietti|eintrittskarte|karte|entrada|entradas|ingresso|ingressos|bilhete|boleto)\b/i;
const KIND_WORDS_RE: [EventKind, RegExp][] = [
  ['race', /\b(marathon|half marathon|10k|5k|grand prix|formula 1|f1|nascar|indycar|motogp|derby|stakes|horse rac\w*|triathlon|ironman|tour de france)\b|マラソン|马拉松|마라톤|\b(maratón|maratona|gran premio)\b/i],
  ['festival', /\b(festival|fest)\b|フェス|音乐节|페스티벌|\bfestivals?\b/i],
  ['game', /\b(vs\.?|v\.)\s|\b(game|match|matchday|kickoff|kick-off|tip-?off|first pitch|playoffs?|season ticket|stadium|ballpark)\b|試合|比赛|球赛|경기|\b(partido|partita|spiel|jogo)\b/i],
  ['show', /\b(theatre|theater|musical|broadway|west end|opera|ballet|comedy|stand-?up|play|circus|cirque)\b|劇場|ミュージカル|剧场|话剧|音乐剧|뮤지컬|연극|\b(théâtre|teatro|spectacle|spettacolo|espectáculo|espetáculo)\b/i],
  ['concert', /\b(concert|tour|live|gig|world tour|in concert|dj set)\b|ライブ|コンサート|公演|演唱会|音乐会|콘서트|공연|\b(concierto|concerto|konzert)\b/i],
];
const MONTHS: Record<string, number> = {};
[
  ['jan', 'january', 'janvier', 'janv', 'gennaio', 'gen', 'januar', 'enero', 'ene', 'janeiro'],
  ['feb', 'february', 'février', 'fevrier', 'févr', 'febbraio', 'februar', 'febrero', 'fevereiro', 'fev'],
  ['mar', 'march', 'mars', 'marzo', 'märz', 'marz', 'março', 'marco'],
  ['apr', 'april', 'avril', 'avr', 'aprile', 'abril', 'abr'],
  ['may', 'mai', 'maggio', 'mag', 'mayo', 'maio'],
  ['jun', 'june', 'juin', 'giugno', 'giu', 'juni', 'junio', 'junho'],
  ['jul', 'july', 'juillet', 'juil', 'luglio', 'lug', 'juli', 'julio', 'julho'],
  ['aug', 'august', 'août', 'aout', 'agosto', 'ago'],
  ['sep', 'sept', 'september', 'septembre', 'settembre', 'set', 'septiembre', 'setembro'],
  ['oct', 'october', 'octobre', 'ottobre', 'ott', 'oktober', 'okt', 'octubre', 'outubro', 'out'],
  ['nov', 'november', 'novembre', 'noviembre', 'novembro'],
  ['dec', 'december', 'décembre', 'decembre', 'déc', 'dicembre', 'dic', 'dezember', 'dez', 'diciembre', 'dezembro'],
].forEach((names, i) => names.forEach(n => { MONTHS[n] = i + 1; }));
const MON = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const p2 = (n: number) => String(n).padStart(2, '0');

/** The date a ticket is for, as YYYY-MM-DD. A date without a year is the next one on or after the screenshot (less a month). */
export function ticketDate(text: string, takenWall: number | null): string | null {
  const t = text.toLowerCase();
  const ok = (y: number, m: number, d: number) => y > 1990 && y < 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${p2(m)}-${p2(d)}` : null;
  const yearFor = (m: number, d: number) => {
    const ref = takenWall ?? Date.now();
    const y = new Date(ref).getUTCFullYear();
    return Date.UTC(y, m - 1, d) < ref - 30 * 86_400_000 ? y + 1 : y;
  };
  let m: RegExpMatchArray | null;
  if ((m = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/))) return ok(+m[1], +m[2], +m[3]);
  if ((m = t.match(/(\d{4})\s*[年년]\s*(\d{1,2})\s*[月월]\s*(\d{1,2})/))) return ok(+m[1], +m[2], +m[3]);
  if ((m = t.match(/(\d{1,2})\s*[月월]\s*(\d{1,2})\s*[日일]/))) return ok(yearFor(+m[1], +m[2]), +m[1], +m[2]);
  if ((m = t.match(new RegExp(`\\b(${MON})\\.?\\s+(\\d{1,2})(?!\\d)(?:st|nd|rd|th)?,?\\s*(\\d{4})?`, 'i')))) { const mo = MONTHS[m[1]], d = +m[2]; return ok(m[3] ? +m[3] : yearFor(mo, d), mo, d); }
  if ((m = t.match(new RegExp(`\\b(\\d{1,2})(?:er|º|\\.)?\\s+(?:de\\s+)?(${MON})\\b\\.?(?:\\s+(?:de\\s+)?(\\d{4}))?`, 'i')))) { const mo = MONTHS[m[2]], d = +m[1]; return ok(m[3] ? +m[3] : yearFor(mo, d), mo, d); }
  if ((m = t.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/))) {
    let a = +m[1], b = +m[2]; const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    if (a > 12) [a, b] = [b, a];               // 25/12/2026: day first
    return ok(y, a, b);
  }
  return null;
}

const BOILER = /^(tickets?|admission|general admission|ga|seat|row|sec(tion)?|gate|doors|entry|order|barcode|qr|price|total|fees?|tax|date|time|venue|presented by|live nation presents|scan|mobile ticket|e-?ticket|ticketmaster|axs|dice|eventbrite)\b/i;
/** A ticket in an image's text: the kind of event, its day and, when it can tell, its name. Null for anything else. */
export function parseTicket(text: string | null | undefined, takenWall: number | null): { kind: EventKind | null; day: string; name: string | null } | null {
  if (!text || text.length < 12) return null;
  if (!TICKET.test(text) || TRANSPORT.test(text)) return null;
  // Without a word for the kind ("ticket, Sat May 16"), it can still name the event the photos show that day
  const kind = KIND_WORDS_RE.find(([, re]) => re.test(text))?.[0] ?? null;
  const day = ticketDate(text, takenWall);
  if (!day) return null;
  const lines = text.split(/\n+/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const looksLikeName = (l: string) => l.length >= 3 && l.length <= 60 && /\p{L}{3}/u.test(l) && !BOILER.test(l) && !ticketDate(l, takenWall) && !/[$€£¥₩]\s?\d|\d{4,}/.test(l);
  const name = lines.find(l => /\s(vs\.?|v\.|@)\s/i.test(l) && looksLikeName(l)) ?? lines.slice(0, 6).find(looksLikeName) ?? null;
  return { kind, day, name };
}

// ------------------------------------------------------------------------------------------------------------- events

export interface DetectOptions {
  now: number;
  /** Lookup results by visit key; a key with null was looked up and nothing was found */
  lookups?: Map<string, EventHit | null> | Record<string, EventHit | null>;
}

/** The events in the index: from what photos show, tickets, and (when on) lookups, newest first */
export function detectEvents(items: Rec[], o: DetectOptions): EventRec[] {
  const lookups = o.lookups instanceof Map ? o.lookups : new Map(Object.entries(o.lookups ?? {}));
  const today = dayOf(o.now)!;
  const out: EventRec[] = [];
  const byDay = new Map<string, EventRec[]>();
  for (const v of visitsOf(items)) {
    const hit = lookups.get(v.key) ?? null;
    const span = v.end - v.start;
    const photosSupport = v.labelHits > 0 || (!!hit && (v.atVenue >= 2 || (v.atVenue >= 1 && span >= 30 * 60_000)));
    if (!photosSupport) continue;
    const kind: EventKind = hit?.kind ?? v.labelKind ?? (v.venue ? VENUE_KIND[v.venue.kind] : null) ?? 'concert';
    const e: EventRec = {
      key: v.key, day: v.day, start: v.start, end: v.end, kind,
      name: hit?.name ?? null, venue: hit?.venue ?? v.venue?.name ?? null, city: v.city,
      genre: hit?.genre ?? null, performers: hit?.performers ?? [], source: hit ? 'lookup' : 'photos', ticket: false, upcoming: false, ids: v.ids,
    };
    out.push(e);
    byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  }
  // Tickets: name the event of that day, or stand for one on their own
  const seen = new Set<string>();
  for (const r of items) {
    if (!usable(r) || !r.text) continue;
    const t = parseTicket(r.text, r.wall);
    if (!t) continue;
    const sameDay = byDay.get(t.day);
    if (sameDay?.length) {
      const e = sameDay[0];
      e.ticket = true;
      if (!e.name && t.name) e.name = t.name;
      if (e.source === 'photos' && !e.name && t.kind) e.kind = t.kind;
      if (!e.ids.includes(r.id)) e.ids.push(r.id);
      continue;
    }
    if (!t.kind) continue;
    const k = `${t.day}|${(t.name ?? t.kind).toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ key: `ticket|${k}`, day: t.day, start: null, end: null, kind: t.kind, name: t.name, venue: null, city: null, genre: null, performers: [], source: 'ticket', ticket: true, upcoming: t.day > today, ids: [r.id] });
  }
  return out.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

/** What each item in an event carries, for search ("the Phoenix show") and results */
export function itemEvents(events: EventRec[]): Map<string, ItemEvent> {
  const m = new Map<string, ItemEvent>();
  for (const e of events) if (!e.upcoming) for (const id of e.ids) m.set(id, { name: e.name, kind: e.kind, venue: e.venue, genre: e.genre });
  return m;
}

// ---------------------------------------------------------------------------------------------------------------- tool

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PLURAL: Record<EventKind, string> = { concert: 'concerts', festival: 'festivals', game: 'games', show: 'shows', race: 'races' };

export function eventLine(e: EventRec): string {
  const when = `${e.day} ${WEEKDAY[new Date(`${e.day}T12:00:00Z`).getUTCDay()]}`;
  const what = [e.kind, e.name ? `${e.name}` : '', e.venue ? `at ${e.venue}${e.city ? `, ${e.city}` : ''}` : e.city ? `in ${e.city}` : ''].filter(Boolean).join(' ');
  const extra = [e.genre ? `genre: ${e.genre}` : '', e.performers.length > 1 ? `with ${e.performers.slice(1, 4).join(', ')}` : '', e.ticket ? 'ticket in photos' : '', e.ids.length && !e.upcoming ? `${e.ids.length} ${e.ids.length === 1 ? 'photo' : 'photos'}` : ''].filter(Boolean).join('; ');
  return `${when}: ${what}${extra ? ` (${extra})` : ''}`;
}

/** The `events` agent tool: events with dates, kinds, names and venues, as text; upcoming tickets listed apart */
export function eventsTool(events: EventRec[], a: Record<string, unknown>, cap: (head: string, lines: string[], ids: string[][]) => ToolResult): ToolResult {
  const kind = typeof a.kind === 'string' ? a.kind.toLowerCase().replace(/s$/, '') : null;
  const from = typeof a.from === 'string' ? a.from.slice(0, 10) : null, to = typeof a.to === 'string' ? a.to.slice(0, 10) : null;
  const limit = Math.max(1, Math.min(60, Math.floor(Number(a.limit) || 40)));
  const list = events.filter(e => (!kind || e.kind === kind || (kind === 'gig' && e.kind === 'concert') || (kind === 'match' && e.kind === 'game'))
    && (!from || e.day >= from) && (!to || e.day <= to));
  if (!list.length) return { text: kind ? `No ${PLURAL[kind as EventKind] ?? `${kind} events`} found in the photos.` : 'No concerts, festivals, games, shows or races found in the photos.', ids: [] };
  const past = list.filter(e => !e.upcoming).slice(0, limit), soon = list.filter(e => e.upcoming).reverse().slice(0, 10);
  const counts = EVENT_KINDS.map(k => [k, past.filter(e => e.kind === k).length] as const).filter(([, n]) => n).map(([k, n]) => `${n} ${n === 1 ? k : PLURAL[k]}`).join(', ');
  const lines = past.map(eventLine), ids = past.map(e => e.ids.slice(0, 3));
  if (soon.length) { lines.push(`Upcoming, from tickets: ${soon.map(e => `${e.day} ${e.kind}${e.name ? ` ${e.name}` : ''}`).join('; ')}`); ids.push(soon.flatMap(e => e.ids.slice(0, 1))); }
  return cap(past.length ? `${past.length} ${past.length === 1 ? 'event' : 'events'} (newest first): ${counts}.` : 'No past events found.', lines, ids);
}

// ------------------------------------------------------------------------------------------------------------- profile

export interface EventWords {
  kinds: Record<EventKind, string>;      // plural, "Concerts"
  /** The kind after a genre, lower case where the language does: English says "House shows" */
  genreKinds: Record<EventKind, string>;
  withGenre: string;                     // "{genre} {kinds}" (English: "House shows")
  thisYear: string;                      // "{what}, {n} this year"
  since: string;                         // "{what}, {n} since {year}"
  latest: string;                        // "Most recently {name}, {date}"
}
const SPELL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/**
 * The Events lines of Our Afterglow, on the device: "House shows, nine this year", "Warriors games, 3 this year".
 * Grouped by genre (with the lookup) or kind; this year first, else since the first one. English spells small numbers.
 */
export function eventLines(events: EventRec[], now: number, W: EventWords, o: { lang?: string; num?: (n: number) => string; date?: (day: string) => string; max?: number } = {}): { text: string; ids: string[] }[] {
  const past = events.filter(e => !e.upcoming);
  if (!past.length) return [];
  const year = String(new Date(now).getUTCFullYear());
  const n = (k: number) => (o.lang ?? 'en') === 'en' && k <= 12 ? SPELL[k] : (o.num ?? String)(k);
  const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  const groups = new Map<string, { what: string; list: EventRec[] }>();
  for (const e of past) {
    const kindWord = W.kinds[e.kind];
    const genre = e.genre && e.kind !== 'race' ? e.genre.replace(/\s*\/.*$/, '').trim() : '';
    const k = `${e.kind}|${genre.toLowerCase()}`;
    const what = genre ? fill(W.withGenre, { genre: genre[0].toUpperCase() + genre.slice(1), kinds: W.genreKinds[e.kind] }) : kindWord;
    const g = groups.get(k) ?? { what: what[0].toUpperCase() + what.slice(1), list: [] };
    g.list.push(e); groups.set(k, g);
  }
  const lines: { text: string; ids: string[] }[] = [];
  const photos = (list: EventRec[]) => list.flatMap(e => e.ids.slice(0, 1)).slice(0, 3);
  const sorted = [...groups.values()].sort((a, b) => b.list.filter(e => e.day.startsWith(year)).length - a.list.filter(e => e.day.startsWith(year)).length || b.list.length - a.list.length);
  for (const g of sorted) {
    const thisYear = g.list.filter(e => e.day.startsWith(year)).length;
    if (thisYear) lines.push({ text: fill(W.thisYear, { what: g.what, n: n(thisYear) }), ids: photos(g.list.filter(e => e.day.startsWith(year))) });
    else lines.push({ text: fill(W.since, { what: g.what, n: n(g.list.length), year: g.list[g.list.length - 1].day.slice(0, 4) }), ids: photos(g.list) });
  }
  const named = past.find(e => e.name);
  if (named) lines.push({ text: fill(W.latest, { name: named.name! + (named.venue ? ` (${named.venue})` : ''), date: o.date ? o.date(named.day) : named.day }), ids: named.ids.slice(0, 3) });
  return lines.slice(0, o.max ?? 4);
}

export const kindWord = (k: string) => KIND_WORDS[k] ?? k;
