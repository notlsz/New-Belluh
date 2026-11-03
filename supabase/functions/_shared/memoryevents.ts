// Pure parts of memory-events (Belluh Memory's opt-in event lookup, after Rollup's `events`): checking what a device
// sent, the queries to the listings, reading their answers and picking the event a visit was for. Shared with tests.
//
// What a request holds, per visit: the 0.01 degree cell (about 1 km, one the places download already sends), the names
// of event venues in it, and the visit's local start and end ("2026-05-14T19:30"). Never coordinates, photos or ids.
//
// Sources: setlist.fm (concerts by venue and date; SETLISTFM_API_KEY), Ticketmaster Discovery (concerts, games, shows
// near the cell on the day; TICKETMASTER_API_KEY) and Wikidata (no key: races, tournaments, festivals and finals that
// have an item with a place and a date, Belluh's calendar of the big ones). Each is skipped without its key.

export type EventKind = 'concert' | 'festival' | 'game' | 'show' | 'race';
export interface VisitIn { cell: string; venues: string[]; start: string; end: string }
export interface Hit { name: string; kind: EventKind; genre: string | null; performers: string[]; venue: string | null; source: 'setlistfm' | 'ticketmaster' | 'wikidata' }

export const MAX_VISITS = 20;
export const CELL_RE = /^-?\d{1,2}\.\d{2},-?\d{1,3}\.\d{2}$/;
const TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Keeps only well-formed visits, at most MAX_VISITS; venue names short, at most five. Null when nothing is usable. */
export function cleanVisits(body: unknown): VisitIn[] | null {
  const list = (body && typeof body === 'object' && Array.isArray((body as any).visits)) ? (body as any).visits as unknown[] : null;
  if (!list || !list.length || list.length > MAX_VISITS) return null;
  const out: VisitIn[] = [];
  for (const v of list) {
    const x = v as any;
    if (!x || typeof x.cell !== 'string' || !CELL_RE.test(x.cell)) return null;
    if (typeof x.start !== 'string' || typeof x.end !== 'string' || !TIME_RE.test(x.start) || !TIME_RE.test(x.end) || x.end < x.start) return null;
    const venues = (Array.isArray(x.venues) ? x.venues : []).filter((n: unknown) => typeof n === 'string').map((n: string) => n.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 80)).filter(Boolean).slice(0, 5);
    out.push({ cell: x.cell, venues, start: x.start, end: x.end });
  }
  return out;
}

/** The centre of a cell */
export const centre = (cell: string) => { const [a, b] = cell.split(',').map(Number); return { lat: +(a + 0.005).toFixed(3), lng: +(b + 0.005).toFixed(3) }; };
/** The evening a visit belongs to (a 1 am encore counts for the night before) */
export function eveningOf(start: string): string {
  const d = new Date(`${start}:00Z`);
  return new Date(d.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
}

const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\b(the|arena|stadium|theatre|theater|hall|center|centre|club|venue|park|field)\b/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
/** Do two venue names mean the same place ("The Fillmore" and "Fillmore Auditorium")? */
export function sameVenue(a: string, b: string): boolean {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const xs = new Set(x.split(' ')), ys = y.split(' ');
  const common = ys.filter(w => w.length > 2 && xs.has(w)).length;
  return common >= Math.min(2, Math.min(xs.size, ys.length));
}

// ---------- setlist.fm ----------

export const setlistUrl = (venue: string, day: string) => `https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(venue)}&date=${day.slice(8, 10)}-${day.slice(5, 7)}-${day.slice(0, 4)}`;
/** The show at the venue that evening: the headliner (most songs) first, support acts after */
export function readSetlists(j: any, venue: string): Hit | null {
  const list = (Array.isArray(j?.setlist) ? j.setlist : []).filter((s: any) => s?.artist?.name && (!s.venue?.name || sameVenue(s.venue.name, venue)));
  if (!list.length) return null;
  const songs = (s: any) => (s.sets?.set ?? []).reduce((n: number, x: any) => n + (x.song?.length ?? 0), 0);
  list.sort((a: any, b: any) => songs(b) - songs(a));
  const performers = [...new Set(list.map((s: any) => String(s.artist.name).slice(0, 80)))] as string[];
  return { name: performers[0], kind: /festival|fest\b/i.test(list[0].tour?.name ?? '') ? 'festival' : 'concert', genre: null, performers: performers.slice(0, 6), venue: list[0].venue?.name ?? venue, source: 'setlistfm' };
}

// ---------- Ticketmaster Discovery ----------

export function ticketmasterUrl(key: string, cell: string, day: string): string {
  const c = centre(cell);
  const next = new Date(Date.parse(`${day}T00:00:00Z`) + 2 * 86_400_000).toISOString().slice(0, 10);
  return `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${encodeURIComponent(key)}&latlong=${c.lat},${c.lng}&radius=2&unit=km&startDateTime=${day}T00:00:00Z&endDateTime=${next}T00:00:00Z&size=50&sort=date,asc`;
}
const SEGMENT: Record<string, EventKind> = { Music: 'concert', Sports: 'game', 'Arts & Theatre': 'show' };
/** The listing on that evening at one of the venues the device named (or, with none named, the only one nearby) */
export function readTicketmaster(j: any, day: string, venues: string[]): Hit | null {
  const evs = (j?._embedded?.events ?? []) as any[];
  const cands = evs.filter(e => e?.name && e.dates?.start?.localDate === day).map(e => {
    const v = e._embedded?.venues?.[0]?.name ?? null;
    const c = e.classifications?.[0] ?? {};
    const seg = c.segment?.name ?? '';
    const genre = [c.subGenre?.name, c.genre?.name].find((g: unknown) => typeof g === 'string' && g && !/^(undefined|other|miscellaneous)$/i.test(g)) ?? null;
    let kind: EventKind = SEGMENT[seg] ?? 'show';
    if (/festival/i.test(e.name)) kind = 'festival';
    if (seg === 'Sports' && /(motorsports|racing|marathon|running|equestrian)/i.test(`${c.genre?.name} ${c.subGenre?.name}`)) kind = 'race';
    const performers = ((e._embedded?.attractions ?? []) as any[]).map(a => a?.name).filter(Boolean).slice(0, 6) as string[];
    return { e, v, hit: { name: kind === 'game' || !performers.length ? String(e.name).slice(0, 100) : performers[0], kind, genre, performers, venue: v, source: 'ticketmaster' as const } };
  }).filter(x => !/parking|vip package|upgrade|tour package/i.test(x.e.name));
  const named = venues.length ? cands.filter(x => x.v && venues.some(n => sameVenue(n, x.v!))) : cands;
  const pick = named.length ? named : (!venues.length && cands.length === 1 ? cands : []);
  return pick[0]?.hit ?? null;
}

// ---------- Wikidata ----------

/** Events with a place within 3 km of the cell whose date covers the evening: races, tournaments, festivals, finals */
export function wikidataQuery(cell: string, day: string): string {
  const c = centre(cell);
  return `SELECT ?e ?eLabel ?typeLabel ?start ?end WHERE {
  SERVICE wikibase:around { ?place wdt:P625 ?loc . bd:serviceParam wikibase:center "Point(${c.lng} ${c.lat})"^^geo:wktLiteral ; wikibase:radius "3" . }
  ?e wdt:P276 ?place .
  OPTIONAL { ?e wdt:P585 ?t . } OPTIONAL { ?e wdt:P580 ?s . } OPTIONAL { ?e wdt:P582 ?f . }
  BIND(COALESCE(?t, ?s) AS ?start) BIND(COALESCE(?f, ?t, ?s) AS ?end)
  FILTER(BOUND(?start) && ?start <= "${day}T23:59:59Z"^^xsd:dateTime && ?end >= "${day}T00:00:00Z"^^xsd:dateTime)
  ?e wdt:P31 ?type .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 20`;
}
export function kindFromType(t: string): EventKind | null {
  if (/grand prix|race|marathon|rally|derby|stakes|triathlon|tour de|cycling|motor/i.test(t)) return 'race';
  if (/festival/i.test(t)) return 'festival';
  if (/tournament|championship|open|match|final|game|cup|bowl|series|league season/i.test(t)) return 'game';
  if (/concert|tour/i.test(t)) return 'concert';
  if (/opera|ballet|theatre|theater|performance|musical/i.test(t)) return 'show';
  return null;
}
export function readWikidata(j: any): Hit | null {
  const rows = (j?.results?.bindings ?? []) as any[];
  for (const r of rows) {
    const name = r.eLabel?.value as string | undefined, type = (r.typeLabel?.value ?? '') as string;
    if (!name || /^Q\d+$/.test(name)) continue;
    const kind = kindFromType(`${type} ${name}`);
    if (kind) return { name: name.slice(0, 100), kind, genre: null, performers: [], venue: null, source: 'wikidata' };
  }
  return null;
}

/** setlist.fm (exact venue and date) wins, then Ticketmaster at a named venue, then Wikidata's calendar */
export const best = (...hits: (Hit | null)[]) => hits.find(Boolean) ?? null;
