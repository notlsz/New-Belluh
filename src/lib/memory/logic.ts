// Belluh Memory's reasoning over the index, on the device: search (filter by the plan, rank by the image model,
// labels, text in images and places), near-duplicate grouping, facets, interests against a typical adult, face
// grouping, and the agent's tools, which return short text only. Pure (no IndexedDB, no models), so it's unit-tested.

import type { Facet, IndexedItem, Interest, Person, SearchResult, SearchResults, ToolCall, ToolResult } from './types.ts';
import { textHas, type KnownPlaces, type PlanX } from './query.ts';
import { ACTIVITIES, LABEL_BY_NAME, TYPICAL_PHOTO_DAYS, type ActivityDef } from './vocab.ts';
import { KIND_WORDS } from './geo.ts';
import { buildStory, km, type Shot } from '../photoStory.ts';

/** One item as the index stores it on the device. Never leaves it. */
export interface Rec extends IndexedItem {
  /** When it was taken, as local wall-clock time encoded as UTC ms (so day and hour are where it was taken) */
  wall: number | null;
  /** Exact coordinates, kept only in this browser's IndexedDB */
  exact?: { lat: number; lng: number } | null;
  w?: number; h?: number;
  /** read: date, place and preview are in; understood: the image model has seen it */
  stage: 'read' | 'understood';
  textRead?: boolean;
  placesResolved?: boolean;
  addedAt: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const dayOf = (wall: number | null | undefined) => {
  if (wall == null) return null;
  const d = new Date(wall);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
/** "1 photo", "3 photos" */
const nOf = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`;
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const partOfDay = (wall: number) => { const h = new Date(wall).getUTCHours(); return h >= 5 && h < 12 ? 'morning' : h < 17 && h >= 12 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'late night'; };

export function dot(a: Float32Array, b: Float32Array): number {
  let s = 0; const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

/** A label counts as shown at or above this probability */
export const LABEL_MIN = 0.2;
/** Image-text similarity: below SIM_FLOOR nothing matches by image alone; within SIM_BAND of the best match it does */
export const SIM_FLOOR = 0.2, SIM_BAND = 0.045, SIM_HIGH = 0.26;
/** Near-duplicates: taken within a minute and this similar */
export const DUP_SIM = 0.9;

export const usable = (r: Rec) => !r.sensitivity;

/** What a photo clearly shows: its best label, or any label the model is fairly sure of (for facets and interests) */
export function shows(r: Rec, name: string): number {
  const l = r.labels.find(x => x.name === name);
  if (!l) return 0;
  const top = r.labels[0];
  return (top && top.name === name && l.p >= LABEL_MIN) || l.p >= 0.45 ? l.p : 0;
}

// Words people search with, and the labels and kinds of place that mean the same
const SEARCH_SYNONYMS: Record<string, { labels?: string[]; kinds?: string[] }> = {
  coffee: { labels: ['coffee', 'latte', 'cafe'], kinds: ['cafe'] },
  cafe: { labels: ['cafe', 'coffee', 'latte'], kinds: ['cafe'] },
  drinks: { labels: ['wine', 'cocktail', 'beer', 'champagne toast', 'bar'], kinds: ['bar', 'pub'] },
  cocktails: { labels: ['cocktail', 'bar'], kinds: ['bar'] },
  beer: { labels: ['beer'], kinds: ['pub', 'bar', 'biergarten', 'brewery'] },
  wine: { labels: ['wine'], kinds: ['wine_bar', 'winery'] },
  dinner: { labels: ['restaurant', 'candlelit dinner', 'fine dining'], kinds: ['restaurant'] },
  restaurant: { labels: ['restaurant', 'fine dining'], kinds: ['restaurant'] },
  concert: { labels: ['concert', 'music festival'], kinds: ['music_venue'] },
  concerts: { labels: ['concert', 'music festival'], kinds: ['music_venue'] },
  gig: { labels: ['concert'], kinds: ['music_venue'] },
  show: { labels: ['theater show', 'concert'], kinds: ['theatre', 'music_venue'] },
  museum: { labels: ['museum', 'art gallery'], kinds: ['museum', 'gallery'] },
  hike: { labels: ['hiking', 'mountains'] }, hiking: { labels: ['hiking', 'mountains'] },
  ski: { labels: ['skiing', 'snowboarding'] }, skiing: { labels: ['skiing', 'snowboarding'] },
  dog: { labels: ['dog', 'puppy'] }, cat: { labels: ['cat', 'kitten'] },
  flowers: { labels: ['bouquet of flowers', 'roses', 'flower field'] },
  beach: { labels: ['beach', 'ocean'], kinds: ['beach'] },
  park: { labels: ['park', 'garden'], kinds: ['park', 'garden'] },
  dessert: { labels: ['dessert', 'cake', 'ice cream', 'donuts', 'macarons', 'chocolate'], kinds: ['ice_cream', 'bakery'] },
  food: { labels: LABELS_BY_GROUP('food') },
};
function LABELS_BY_GROUP(g: string) { return [...LABEL_BY_NAME.values()].filter(l => l.group === g).map(l => l.name); }
function synonymsOf(visual: string) {
  const labels = new Set<string>(), kinds = new Set<string>();
  for (const w of visual.toLowerCase().split(/\s+/)) { const s = SEARCH_SYNONYMS[w] ?? SEARCH_SYNONYMS[w.replace(/s$/, '')]; s?.labels?.forEach(x => labels.add(x)); s?.kinds?.forEach(x => kinds.add(x)); }
  return { labels, kinds };
}
const hasLabel = (r: Rec, name: string, min = LABEL_MIN) => r.labels.some(l => l.name === name && l.p >= min);

export function knownPlaces(items: Rec[]): KnownPlaces {
  const s = { cities: new Set<string>(), neighborhoods: new Set<string>(), metros: new Set<string>(), countries: new Set<string>(), venues: new Set<string>(), cuisines: new Set<string>(), kinds: new Set<string>() };
  for (const r of items) {
    const l = r.location;
    if (l?.city) s.cities.add(l.city);
    if (l?.neighborhood) s.neighborhoods.add(l.neighborhood);
    if (l?.metro) s.metros.add(l.metro);
    if (l?.country) s.countries.add(l.country);
    for (const p of r.places) { s.venues.add(p.name); if (p.kind) s.kinds.add(KIND_WORDS[p.kind] ?? p.kind); if (p.cuisine) p.cuisine.split(';').forEach(c => s.cuisines.add(c.trim())); }
    r.cuisines.forEach(c => s.cuisines.add(c));
  }
  // Country aliases people type
  if (s.countries.has('United States of America') || s.countries.has('United States')) ['USA', 'US', 'America', 'United States'].forEach(a => s.countries.add(a));
  if (s.countries.has('United Kingdom')) ['UK', 'England', 'Britain'].forEach(a => s.countries.add(a));
  return { cities: [...s.cities], neighborhoods: [...s.neighborhoods], metros: [...s.metros], countries: [...s.countries], venues: [...s.venues], cuisines: [...s.cuisines], kinds: [...s.kinds] };
}

const ALIAS: Record<string, string[]> = { usa: ['United States of America', 'US'], us: ['United States of America', 'US'], america: ['United States of America', 'US'], 'united states': ['United States of America', 'US'], uk: ['United Kingdom', 'GB'], england: ['United Kingdom', 'GB'], britain: ['United Kingdom', 'GB'] };
function placeMatches(r: Rec, name: string): boolean {
  const n = name.toLowerCase();
  const l = r.location;
  const names = [l?.city, l?.neighborhood, l?.metro, l?.country, l?.countryCode, ...r.places.map(p => p.name)].filter(Boolean).map(x => x!.toLowerCase());
  return names.includes(n) || (ALIAS[n] ?? []).some(a => names.includes(a.toLowerCase()));
}
function kindMatches(r: Rec, kind: string): boolean {
  const k = kind.toLowerCase();
  return r.cuisines.some(c => c.toLowerCase() === k) || r.places.some(p => (KIND_WORDS[p.kind] ?? p.kind).toLowerCase() === k || p.kind === k || (p.cuisine ?? '').toLowerCase().split(';').map(x => x.trim()).includes(k));
}

function snippet(text: string, at: number, len: number, room = 40): string {
  const a = Math.max(0, at - room), b = Math.min(text.length, at + len + room);
  return (a > 0 ? '...' : '') + text.slice(a, b).replace(/\s+/g, ' ').trim() + (b < text.length ? '...' : '');
}

export interface RankInput {
  items: Rec[];
  vectors: Map<string, Float32Array>;
  plan: PlanX;
  query: string;
  /** The image model's embedding of the plan's visual text, when the text model is loaded */
  textVec?: Float32Array | null;
  /** Keep only items with every one of these people */
  people?: string[];
  limit?: number;
  /** Where home is (the place with the most located days), for each result's context */
  home?: { lat: number; lng: number } | null;
}

export interface SearchResultsX extends SearchResults {
  /** For count questions: photos (a shot once) and distinct days */
  count?: { photos: number; days: number } | null;
  seconds?: number;
}

export function rank(input: RankInput): SearchResultsX {
  const t0 = Date.now();
  const { plan, vectors, textVec } = input;
  const ranges = plan.dateRanges ?? (plan.dateRange ? [plan.dateRange] : []);
  let cands = input.items.filter(r => {
    if (plan.mediaType && r.mediaType !== plan.mediaType) return false;
    if (ranges.length) { const d = dayOf(r.wall); if (!d || !ranges.some(x => d >= x.from && d <= x.to)) return false; }
    if (plan.placeFilters?.length && !plan.placeFilters.every(p => placeMatches(r, p))) return false;
    if (input.people?.length && !input.people.every(p => r.people.includes(p))) return false;
    return true;
  });

  const visual = plan.visualText?.trim() || null;
  const quoted = plan.quoted?.trim() || null;
  const syn = visual ? synonymsOf(visual) : { labels: new Set<string>(), kinds: new Set<string>() };
  type Scored = { r: Rec; score: number; sim: number | null; reasons: string[]; matchedText: string | null };
  let scored: Scored[] = cands.map(r => {
    const reasons: string[] = [];
    if (ranges.length) reasons.push(plan.holiday ? 'holiday' : 'date');
    if (plan.placeFilters?.length) reasons.push('place');
    if (plan.mediaType) reasons.push('media');
    let sim: number | null = null, label = 0, text = 0, place = 0, matchedText: string | null = null;
    const v = vectors.get(r.id);
    if (visual && textVec && v) sim = dot(textVec, v);
    if (visual) {
      for (const l of r.labels) if (l.p >= 0.1 && (textHas(visual, l.name) || textHas(l.name, visual) || syn.labels.has(l.name))) label = Math.max(label, l.p);
      if (label) reasons.push('label');
      if (syn.kinds.size && r.places.some(p => syn.kinds.has(p.kind))) place = 1;
    }
    const needle = quoted ?? visual;
    if (needle && r.text) {
      const m = textHas(r.text, needle);
      if (m) { text = 1; matchedText = snippet(r.text, m.at, m.len); reasons.push('text'); }
    }
    if (plan.placeKinds?.length && plan.placeKinds.some(k => kindMatches(r, k))) place = 1;
    let event = 0;
    if (r.event && needle && eventMatches(r.event, needle)) { event = 1; reasons.push('event'); }
    if (place && !reasons.includes('place')) reasons.push('place');
    const c = sim == null ? 0 : Math.max(0, Math.min(1, (sim - 0.15) / (SIM_HIGH - 0.15)));
    const score = visual || quoted ? Math.min(1, 0.6 * c + 0.45 * label + 0.5 * text + 0.35 * place + 0.5 * event) : 1;
    return { r, score, sim, reasons, matchedText };
  });

  if (visual || quoted) {
    const best = Math.max(-1, ...scored.map(s => s.sim ?? -1));
    const cut = Math.max(SIM_FLOOR, best - SIM_BAND);
    scored = scored.filter(s => {
      const byImage = s.sim != null && s.sim >= cut;
      if (byImage) s.reasons.unshift('image');
      if (quoted) return s.reasons.includes('text') || s.reasons.includes('event');
      const byKind = (!!plan.placeKinds?.length && plan.placeKinds.some(k => kindMatches(s.r, k))) || (syn.kinds.size > 0 && s.r.places.some(p => syn.kinds.has(p.kind)));
      return byImage || s.reasons.includes('label') || s.reasons.includes('text') || s.reasons.includes('event') || byKind;
    });
  }

  const byTime = (a: Scored, b: Scored) => (b.r.wall ?? 0) - (a.r.wall ?? 0);
  scored.sort(plan.sort === 'newest' ? byTime : plan.sort === 'oldest' ? (a, b) => (a.r.wall ?? Infinity) - (b.r.wall ?? Infinity) : (a, b) => b.score - a.score || byTime(a, b));

  // Group other shots of the same moment into the best one
  const reps: { s: Scored; dups: string[] }[] = [];
  const byMinute = new Map<number, { s: Scored; dups: string[] }[]>();
  for (const s of scored) {
    const m = s.r.wall != null ? Math.floor(s.r.wall / 60000) : null;
    let home: { s: Scored; dups: string[] } | null = null;
    if (m != null) {
      const v = vectors.get(s.r.id);
      for (const k of [m - 1, m, m + 1]) for (const g of byMinute.get(k) ?? []) {
        if (home || Math.abs((g.s.r.wall ?? 0) - (s.r.wall ?? 0)) > 60000) continue;
        const gv = vectors.get(g.s.r.id);
        if (v && gv && dot(v, gv) >= DUP_SIM) home = g;
      }
    }
    if (home) { home.dups.push(s.r.id); continue; }
    const g = { s, dups: [] as string[] };
    reps.push(g);
    if (m != null) { const list = byMinute.get(m); if (list) list.push(g); else byMinute.set(m, [g]); }
  }

  const results: SearchResult[] = reps.slice(0, input.limit ?? 200).map(({ s, dups }) => ({
    ...publicItem(s.r),
    score: Math.round(s.score * 1000) / 1000,
    relevance: s.score >= 0.7 ? 'high' : s.score >= 0.4 ? 'medium' : 'low',
    matchedText: s.matchedText,
    matchReasons: [...new Set(s.reasons)],
    duplicates: dups,
    context: contextOf(s.r, input.home ?? null),
  }));
  const count = plan.operation === 'count' ? {
    photos: reps.length,
    days: new Set(reps.map(g => dayOf(g.s.r.wall)).filter(Boolean)).size,
  } : null;
  return { query: input.query, plan, results, count, seconds: (Date.now() - t0) / 1000 };
}

/** What leaves the engine for an item: the IndexedItem fields only (exact coordinates and wall time stay inside) */
export function publicItem(r: Rec): IndexedItem {
  return {
    id: r.id, date: r.date, timeZone: r.timeZone ?? null, mediaType: r.mediaType, isFavorite: r.isFavorite ?? false,
    location: r.location ? { ...r.location } : null, places: r.places, cuisines: r.cuisines, labels: r.labels,
    text: r.text ?? null, sensitivity: r.sensitivity, people: r.people, event: r.event ?? null,
  };
}

// Words people search events with
const EVENT_QUERY: Record<string, string[]> = {
  concert: ['concert', 'concerts', 'gig', 'gigs', 'show', 'shows', 'live music', 'live show'],
  festival: ['festival', 'festivals', 'fest'],
  game: ['game', 'games', 'match', 'matches', 'sports game'],
  show: ['show', 'shows', 'theater', 'theatre', 'musical', 'play', 'performance'],
  race: ['race', 'races', 'marathon', 'grand prix'],
};
/** A search for "the Phoenix show", "Warriors game", "concerts", or the event's genre or venue finds its photos */
export function eventMatches(e: NonNullable<IndexedItem['event']>, needle: string): boolean {
  const q = needle.toLowerCase().trim();
  if (!q) return false;
  for (const w of [e.name, e.genre].filter((x): x is string => !!x && x.length >= 3)) if (textHas(q, w) || textHas(w, q)) return true;
  return (EVENT_QUERY[e.kind] ?? []).some(w => q === w || textHas(q, w) != null && q.split(/\s+/).length <= 3);
}

const AWAY_KM = 50;
/** When and how a photo was taken (Rollup's SearchContext): away from home, with people, part of day, weekend */
export function contextOf(r: Rec, home: { lat: number; lng: number } | null): NonNullable<SearchResult['context']> {
  const at = r.exact ?? (r.location ? { lat: r.location.lat, lng: r.location.lng } : null);
  const day = r.wall != null ? new Date(r.wall).getUTCDay() : null;
  return {
    awayFromHome: home && at ? km(home, at) > AWAY_KM : null,
    withPeople: r.people.length > 0 || r.labels.some(l => l.p >= LABEL_MIN && LABEL_BY_NAME.get(l.name)?.group === 'people'),
    partOfDay: r.wall != null ? partOfDay(r.wall) as 'morning' | 'afternoon' | 'evening' | 'late night' : null,
    weekend: day == null ? null : day === 0 || day === 6,
  };
}

/** Items once per shot: near-duplicates (same minute, very similar) count once. Newest first. */
export function onePerShot(items: Rec[], vectors: Map<string, Float32Array>): Rec[] {
  const out: Rec[] = [];
  const sorted = items.slice().sort((a, b) => (b.wall ?? 0) - (a.wall ?? 0));
  for (const r of sorted) {
    const v = vectors.get(r.id);
    const dup = r.wall != null && v && out.slice(-12).some(o => o.wall != null && Math.abs(o.wall - r.wall!) <= 60000 && (() => { const ov = vectors.get(o.id); return !!ov && dot(ov, v) >= DUP_SIM; })());
    if (!dup) out.push(r);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------- facets

export function facets(items: Rec[], vectors: Map<string, Float32Array>, limit = 16, samples = 4): Facet[] {
  limit = Math.max(1, Math.min(64, limit)); samples = Math.max(0, Math.min(32, samples));
  const pool = onePerShot(items.filter(r => usable(r) && r.mediaType !== 'screenshot'), vectors);
  const groups = new Map<string, { f: Facet; ids: string[] }>();
  const add = (kind: Facet['kind'], name: string, r: Rec) => {
    const key = `${kind}:${name.toLowerCase()}`;
    let g = groups.get(key);
    if (!g) { g = { f: { kind, name, count: 0, samples: [] }, ids: [] }; groups.set(key, g); }
    if (g.ids[g.ids.length - 1] === r.id) return;
    g.f.count++; g.ids.push(r.id);
  };
  for (const r of pool) {
    let food = false;
    for (const l of r.labels) {
      if (!shows(r, l.name)) continue;
      const def = LABEL_BY_NAME.get(l.name);
      if (!def || def.group === 'baby' || def.group === 'people' || def.group === 'text') continue;   // not groups to show
      if (def.group === 'food' || def.group === 'drink') food = true;
      add('label', l.name, r);
    }
    if (food) add('food', 'Food', r);
    for (const c of r.cuisines) add('cuisine', c, r);
    for (const p of r.places) if (p.kind) add('placeType', KIND_WORDS[p.kind] ?? p.kind, r);
    if (r.location?.city) add('city', r.location.city, r);
    if (r.location?.country) add('country', r.location.country, r);
  }
  const n = pool.length;
  return [...groups.values()]
    // groups on most of the library, or on very few photos, say little
    .filter(g => g.f.count >= 2 && (n < 10 || g.f.count <= n * 0.8) && !(g.f.kind === 'country' && g.f.count === n))
    .sort((a, b) => b.f.count - a.f.count || a.f.name.localeCompare(b.f.name))
    .slice(0, limit)
    .map(g => ({ ...g.f, samples: g.ids.slice(0, samples) }));
}

// ------------------------------------------------------------------------------------------------------------- interests

export interface InterestX extends Interest {
  id: string;
  strength: number; lifetimeStrength: number;
  timesTypical: number; lifetimeTimesTypical: number;
  days: number; daysRecent: number;
  /** With includeAll: done no more than a typical adult (typical) or on one day only (moment) */
  typical?: boolean; moment?: boolean;
}

const RECENT_DAYS = 182;

function evidence(r: Rec, a: ActivityDef): number {
  let w = 0;
  for (const name of a.labels ?? []) w = Math.max(w, shows(r, name));
  if (a.venues?.length && r.places.some(p => a.venues!.includes(p.kind))) w = Math.max(w, 0.9);
  if (a.cuisines?.length && [...r.cuisines, ...r.places.map(p => p.cuisine ?? '')].some(c => a.cuisines!.some(x => c.toLowerCase().split(';').map(y => y.trim()).includes(x)))) w = Math.max(w, 0.9);
  return w;
}

export function interests(items: Rec[], now: number, window: 'now' | 'lifetime' = 'now', includeAll = false): InterestX[] {
  const pool = items.filter(r => usable(r) && r.wall != null && r.mediaType !== 'screenshot');
  if (!pool.length) return [];
  const today = Date.UTC(new Date(now).getFullYear(), new Date(now).getMonth(), new Date(now).getDate());
  const recentFrom = dayOf(today - RECENT_DAYS * 86_400_000)!;
  const allDays = new Set(pool.map(r => dayOf(r.wall)!));
  const recentDaysAll = [...allDays].filter(d => d >= recentFrom).length;
  const spanYears = Math.max(0.25, (Math.max(...pool.map(r => r.wall!)) - Math.min(...pool.map(r => r.wall!))) / (365.25 * 86_400_000));
  // How many photo-days the person has a year, against a typical adult's TYPICAL_PHOTO_DAYS
  const scaleAll = allDays.size / spanYears / TYPICAL_PHOTO_DAYS;
  const scaleRecent = recentDaysAll / (RECENT_DAYS / 365.25) / TYPICAL_PHOTO_DAYS;

  const out: InterestX[] = [];
  for (const a of ACTIVITIES) {
    const days = new Map<string, { w: number; id: string }>();
    for (const r of pool) {
      const w = evidence(r, a);
      if (!w) continue;
      const d = dayOf(r.wall)!;
      const cur = days.get(d);
      if (!cur || w > cur.w) days.set(d, { w, id: r.id });
    }
    if (!days.size) continue;
    const list = [...days.keys()].sort();
    const recent = list.filter(d => d >= recentFrom).length;
    const earlier = list.length - recent;
    // Expected days for someone who photographs as much as this person, over the same span
    const expAll = a.typical * Math.max(scaleAll, 0.05) * spanYears;
    const expRecent = a.typical * Math.max(scaleRecent, 0.05) * (RECENT_DAYS / 365.25);
    const lifetimeTimes = list.length / Math.max(expAll, 0.25);
    const recentTimes = recent / Math.max(expRecent, 0.25);
    const toStrength = (x: number) => Math.round((1 - Math.exp(-Math.max(0, x - 1) / 4)) * 100) / 100;
    const moment = list.length === 1;
    const typical = lifetimeTimes < 1.5 && recentTimes < 1.5;
    let status: Interest['status'];
    if (recent === 0) status = 'lapsed';
    else if (earlier === 0 || recent / list.length >= 0.8 && list.length >= 3 && earlier <= 1) status = 'emerging';
    else status = 'active';
    if (!includeAll && (moment || typical)) continue;
    if (!includeAll && status === 'emerging' && recent < 2) continue;
    if (!includeAll && status === 'lapsed' && list.length < 2) continue;
    const strongest = [...days.entries()].sort((x, y) => y[1].w - x[1].w || (y[0] < x[0] ? -1 : 1)).slice(0, 10).map(([, v]) => v.id);
    out.push({
      id: a.id, name: a.name, kind: a.kind, status,
      count: list.length, first: list[0], last: list[list.length - 1],
      vsTypical: Math.round(lifetimeTimes * 10) / 10,
      samples: strongest,
      strength: toStrength(recentTimes), lifetimeStrength: toStrength(lifetimeTimes),
      timesTypical: Math.round(recentTimes * 10) / 10, lifetimeTimesTypical: Math.round(lifetimeTimes * 10) / 10,
      days: list.length, daysRecent: recent,
      ...(includeAll ? { typical, moment } : {}),
    });
  }
  const keep = window === 'now' ? out.filter(i => includeAll || i.status !== 'lapsed') : out;
  return keep.sort(window === 'now'
    ? (x, y) => y.strength - x.strength || y.daysRecent - x.daysRecent || y.days - x.days
    : (x, y) => y.lifetimeStrength - x.lifetimeStrength || y.days - x.days);
}

// ---------------------------------------------------------------------------------------------------------------- people

export interface FaceRec { item: string; box: [number, number, number, number]; emb: Float32Array; score: number }
export interface Cluster { id: string; name?: string | null; centroid: Float32Array; faces: { item: string; box: [number, number, number, number]; score: number }[]; aliases?: string[] }

/** SFace matches the same person at cosine >= 0.363; a little above that keeps groups clean */
export const FACE_SIM = 0.42;

function normalize(v: Float32Array): Float32Array { let s = 0; for (const x of v) s += x * x; s = Math.sqrt(s) || 1; return Float32Array.from(v, x => x / s); }

/** Adds faces to the groups, online: a face joins the most similar group above FACE_SIM, or starts a new one. */
export function assignFaces(clusters: Cluster[], faces: FaceRec[], nextId: () => string): Cluster[] {
  for (const f of faces) {
    const e = normalize(f.emb);
    let best: Cluster | null = null, bestSim = FACE_SIM;
    for (const c of clusters) { const s = dot(c.centroid, e); if (s >= bestSim) { bestSim = s; best = c; } }
    if (!best) { clusters.push({ id: nextId(), centroid: e, faces: [{ item: f.item, box: f.box, score: f.score }] }); continue; }
    const n = best.faces.length;
    best.centroid = normalize(Float32Array.from(best.centroid, (x, i) => x * n + e[i]));
    best.faces.push({ item: f.item, box: f.box, score: f.score });
  }
  return clusters;
}

/** Merges groups whose centres turned out to be one person; the old id stays an alias */
export function mergeClusters(clusters: Cluster[]): Cluster[] {
  const out: Cluster[] = [];
  for (const c of clusters.slice().sort((a, b) => b.faces.length - a.faces.length)) {
    const into = out.find(o => dot(o.centroid, c.centroid) >= FACE_SIM + 0.08);
    if (!into) { out.push(c); continue; }
    const n = into.faces.length, m = c.faces.length;
    into.centroid = normalize(Float32Array.from(into.centroid, (x, i) => x * n + c.centroid[i] * m));
    into.faces.push(...c.faces);
    into.aliases = [...(into.aliases ?? []), c.id, ...(c.aliases ?? [])];
    if (!into.name && c.name) into.name = c.name;
  }
  return out;
}

export interface PersonX extends Person {
  face: { photo: string; x: number; y: number; width: number; height: number };
  firstSeen: string | null; lastSeen: string | null;
}

export function peopleOf(clusters: Cluster[], byId: Map<string, Rec>, includeAll = false): PersonX[] {
  const out: PersonX[] = [];
  for (const c of clusters) {
    const faces = c.faces.filter(f => { const r = byId.get(f.item); return r && usable(r); });
    const photos = [...new Set(faces.map(f => f.item))];
    if (!photos.length || (!includeAll && photos.length < 2)) continue;
    const best = faces.slice().sort((a, b) => b.score * b.box[2] - a.score * a.box[2])[0];
    const days = photos.map(id => dayOf(byId.get(id)!.wall)).filter((d): d is string => !!d).sort();
    out.push({
      id: c.id, name: c.name ?? null, photos: photos.length, cover: best.item,
      face: { photo: best.item, x: best.box[0], y: best.box[1], width: best.box[2], height: best.box[3] },
      firstSeen: days[0] ?? null, lastSeen: days[days.length - 1] ?? null,
    });
  }
  return out.sort((a, b) => b.photos - a.photos);
}

export function resolvePerson(clusters: Cluster[], id: string): Cluster | null {
  return clusters.find(c => c.id === id) ?? clusters.find(c => c.aliases?.includes(id)) ?? null;
}

// ----------------------------------------------------------------------------------------------------------------- tools

export const TOOL_MAX = 2000;

/** Where, in words: venue, neighborhood, city, country. Never coordinates. */
export function whereText(r: Rec): string {
  const l = r.location;
  const parts = [l?.neighborhood, l?.city, l?.country].filter(Boolean) as string[];
  const dedup = parts.filter((p, i) => parts.indexOf(p) === i);
  return dedup.join(', ');
}
function whenText(r: Rec): string {
  if (r.wall == null) return 'undated';
  return `${dayOf(r.wall)} ${WEEKDAY[new Date(r.wall).getUTCDay()]} ${partOfDay(r.wall)}`;
}
function venueText(r: Rec): string {
  const p = r.places[0];
  if (!p) return '';
  const kind = KIND_WORDS[p.kind] ?? p.kind;
  return `${p.name} (${[kind, p.cuisine].filter(Boolean).join(', ')})`;
}
function labelText(r: Rec, n = 4) { return r.labels.filter(l => l.p >= 0.15).slice(0, n).map(l => l.name).join(', '); }
const clip = (s: string, n: number) => s.length > n ? s.slice(0, n - 3) + '...' : s;

export function itemLine(r: Rec, _i?: number): string {
  const bits = [whenText(r), r.mediaType !== 'photo' ? r.mediaType : '', venueText(r), whereText(r), labelText(r) ? `shows: ${labelText(r)}` : '',
    r.text ? `text: "${clip(r.text.replace(/\s+/g, ' ').trim(), 80)}"` : ''].filter(Boolean);
  return bits.join(' | ');
}

/** Joins lines up to the cap, saying how many were left out */
export function capped(head: string, lines: string[], ids: string[][] = []): ToolResult {
  let text = head, used = 0;
  const keptIds: string[] = [];
  // The ids behind each line of the text (none for the heading), so an answer can cite one line, not the whole result
  const per: string[][] = head ? [[]] : [];
  for (let i = 0; i < lines.length; i++) {
    const next = (text ? '\n' : '') + lines[i];
    if (text.length + next.length > TOOL_MAX - 40) break;
    text += next; used++;
    keptIds.push(...(ids[i] ?? []));
    per.push(ids[i] ?? []);
  }
  if (used < lines.length) { text += `\n(${lines.length - used} more not shown)`; per.push([]); }
  return { text: scrub(text), ids: [...new Set(keptIds)], lines: per };
}

/** Last guard: nothing that looks like coordinates or a file name leaves in tool text */
export function scrub(text: string): string {
  return text
    .replace(/-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}/g, '[place]')
    .replace(/\b[\w-]+\.(jpe?g|png|heic|heif|webp|gif|tiff?|mov|mp4|m4v|avi|dng|raw)\b/gi, '[file]');
}

const inRange = (r: Rec, from?: unknown, to?: unknown) => {
  const d = dayOf(r.wall);
  if ((from || to) && !d) return false;
  if (typeof from === 'string' && d! < from.slice(0, 10)) return false;
  if (typeof to === 'string' && d! > to.slice(0, 10)) return false;
  return true;
};
const num = (x: unknown, d: number, max: number) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? Math.min(max, Math.floor(n)) : d; };

export interface ToolContext {
  items: Rec[];
  vectors: Map<string, Float32Array>;
  now: number;
  search: (query: string, limit: number) => Promise<SearchResultsX>;
  countryOf?: (lng: number, lat: number) => string | null;
}

/** Venue, else neighborhood and city, else city, else country: the place a visit is named by */
function placeKey(r: Rec, by: 'venue' | 'city' | 'country' = 'venue'): string | null {
  if (by === 'country') return r.location?.country ?? null;
  if (by === 'city') return r.location?.city ?? r.location?.country ?? null;
  if (r.places[0]) return `${venueText(r)}${r.location?.city ? `, ${r.location.city}` : ''}`;
  return r.location?.neighborhood && r.location?.city ? `${r.location.neighborhood}, ${r.location.city}` : r.location?.city ?? r.location?.country ?? null;
}

export async function runTool(call: ToolCall, ctx: ToolContext): Promise<ToolResult> {
  const a = call.args ?? {};
  const pool = ctx.items.filter(usable);
  const byId = new Map(pool.map(r => [r.id, r]));
  switch (call.name) {
    case 'search_photos': {
      const q = String(a.query ?? '').slice(0, 300);
      const limit = num(a.limit, 20, 50);
      const res = await ctx.search(q, limit * 2);
      const hits = res.results.filter(x => !x.sensitivity && byId.has(x.id)).slice(0, limit);
      if (!hits.length) return { text: `No photos match "${q}".`, ids: [] };
      const head = res.count ? `${nOf(res.count.photos, 'photo')} on ${nOf(res.count.days, 'day')} match "${q}".` : `${nOf(hits.length, 'photo')} match "${q}" (most relevant first):`;
      return capped(head, hits.map((h, i) => itemLine(byId.get(h.id)!, i + 1) + (h.duplicates.length ? ` (+${h.duplicates.length} similar)` : '')), hits.map(h => [h.id, ...h.duplicates.filter(d => byId.has(d))]));
    }
    case 'list_places': {
      const kind = typeof a.kind === 'string' ? a.kind.toLowerCase() : null;
      const city = typeof a.city === 'string' ? a.city.toLowerCase() : null;
      const by: 'venue' | 'city' | 'country' = kind === 'city' || kind === 'cities' ? 'city' : kind === 'country' || kind === 'countries' ? 'country' : 'venue';
      const groups = new Map<string, { days: Set<string>; ids: string[]; last: string }>();
      for (const r of pool) {
        if (!inRange(r, a.from, a.to)) continue;
        if (city && (r.location?.city ?? '').toLowerCase() !== city && (r.location?.metro ?? '').toLowerCase() !== city) continue;
        if (by === 'venue' && kind && !r.places.some(p => p.kind === kind || (KIND_WORDS[p.kind] ?? '').toLowerCase() === kind || (p.cuisine ?? '').toLowerCase().includes(kind)) && !r.cuisines.includes(kind)) continue;
        const key = placeKey(r, by);
        if (!key) continue;
        const g = groups.get(key) ?? { days: new Set<string>(), ids: [], last: '' };
        const d = dayOf(r.wall); if (d) { g.days.add(d); if (d > g.last) g.last = d; }
        g.ids.push(r.id); groups.set(key, g);
      }
      const list = [...groups.entries()].sort((x, y) => y[1].days.size - x[1].days.size || y[1].ids.length - x[1].ids.length).slice(0, num(a.limit, 25, 60));
      if (!list.length) return { text: 'No places found for that.', ids: [] };
      return capped(`${list.length} places (most visited first):`, list.map(([k, g]) => `${k}: ${g.days.size} ${g.days.size === 1 ? 'day' : 'days'}, ${nOf(g.ids.length, 'photo')}${g.last ? `, last ${g.last}` : ''}`), list.map(([, g]) => g.ids.slice(0, 3)));
    }
    case 'list_visits': {
      const place = String(a.place ?? '').toLowerCase().trim();
      if (!place) return { text: 'Say which place.', ids: [] };
      const hits = pool.filter(r => inRange(r, a.from, a.to) && (placeMatches(r, place) || r.places.some(p => p.name.toLowerCase().includes(place)) || kindMatches(r, place)));
      const days = new Map<string, Rec[]>();
      for (const r of hits) { const d = dayOf(r.wall) ?? 'undated'; days.set(d, [...(days.get(d) ?? []), r]); }
      const list = [...days.entries()].sort((x, y) => y[0] < x[0] ? -1 : 1);
      if (!list.length) return { text: `No visits to "${a.place}" found.`, ids: [] };
      return capped(`${list.length} ${list.length === 1 ? 'visit' : 'visits'} to ${a.place}:`, list.map(([d, rs]) => {
        const r = rs[0];
        const labels = [...new Set(rs.flatMap(x => x.labels.filter(l => l.p >= LABEL_MIN).map(l => l.name)))].slice(0, 4).join(', ');
        return `${d}${r.wall != null ? ` ${WEEKDAY[new Date(r.wall).getUTCDay()]} ${partOfDay(r.wall)}` : ''}: ${nOf(rs.length, 'photo')}${venueText(r) ? `, ${venueText(r)}` : ''}${labels ? `, shows ${labels}` : ''}`;
      }), list.map(([, rs]) => rs.map(r => r.id).slice(0, 3)));
    }
    case 'count_days': {
      let hits = pool.filter(r => inRange(r, a.from, a.to));
      if (typeof a.place === 'string' && a.place.trim()) { const p = a.place.toLowerCase().trim(); hits = hits.filter(r => placeMatches(r, p) || r.places.some(x => x.name.toLowerCase().includes(p)) || kindMatches(r, p)); }
      if (typeof a.query === 'string' && a.query.trim()) {
        const res = await ctx.search(a.query, 2000);
        const ok = new Set(res.results.flatMap(x => [x.id, ...x.duplicates]));
        hits = hits.filter(r => ok.has(r.id));
      }
      const days = [...new Set(hits.map(r => dayOf(r.wall)).filter((d): d is string => !!d))].sort();
      const desc = [a.query && `"${a.query}"`, a.place && `at ${a.place}`, a.from && `from ${a.from}`, a.to && `to ${a.to}`].filter(Boolean).join(' ');
      return scrubbed({ text: `${days.length} ${days.length === 1 ? 'day' : 'days'}${desc ? ` with ${desc}` : ''} (${nOf(hits.length, 'photo')}).${days.length ? ` Days: ${days.slice(-30).join(', ')}${days.length > 30 ? ` and ${days.length - 30} earlier` : ''}.` : ''}`, ids: hits.slice(0, 50).map(r => r.id) });
    }
    case 'timeline': {
      const week = a.granularity === 'week';
      const periods = new Map<string, Rec[]>();
      for (const r of pool) {
        if (r.wall == null || !inRange(r, a.from, a.to)) continue;
        let key = dayOf(r.wall)!.slice(0, 7);
        if (week) { const d = new Date(r.wall); const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7))); key = `week of ${dayOf(+mon)}`; }
        periods.set(key, [...(periods.get(key) ?? []), r]);
      }
      const list = [...periods.entries()].sort((x, y) => x[0] < y[0] ? 1 : -1);
      if (!list.length) return { text: 'Nothing in that period.', ids: [] };
      const top = (xs: (string | null | undefined)[], n: number) => { const m = new Map<string, number>(); xs.forEach(x => x && m.set(x, (m.get(x) ?? 0) + 1)); return [...m.entries()].sort((p, q) => q[1] - p[1]).slice(0, n).map(([k]) => k); };
      return capped(`${list.length} ${week ? 'weeks' : 'months'} (newest first):`, list.map(([k, rs]) => {
        const places = top(rs.map(r => r.places[0]?.name ?? r.location?.city), 3).join(', ');
        const shows = top(rs.flatMap(r => r.labels.filter(l => l.p >= LABEL_MIN).map(l => l.name)), 4).join(', ');
        const days = new Set(rs.map(r => dayOf(r.wall))).size;
        return `${k}: ${nOf(rs.length, 'photo')} on ${nOf(days, 'day')}${places ? `; places: ${places}` : ''}${shows ? `; shows: ${shows}` : ''}`;
      }), list.map(([, rs]) => rs.slice(0, 2).map(r => r.id)));
    }
    case 'facets': {
      const fs = facets(pool, ctx.vectors, num(a.limit, 16, 64), 3);
      if (!fs.length) return { text: 'Not enough photos to group yet.', ids: [] };
      return capped('Largest groups:', fs.map(f => `${f.name} (${f.kind}): ${nOf(f.count, 'photo')}`), fs.map(f => f.samples));
    }
    case 'interests': {
      const win = a.window === 'lifetime' ? 'lifetime' : 'now';
      const list = interests(pool, ctx.now, win);
      if (!list.length) return { text: 'No interests stand out yet.', ids: [] };
      return capped(`Interests (${win}), compared with a typical adult:`, list.map(i => `${i.name} (${i.kind}): ${i.status}, ${i.days} ${i.days === 1 ? 'day' : 'days'} from ${i.first} to ${i.last}, ${win === 'now' ? i.timesTypical : i.lifetimeTimesTypical}x typical`), list.map(i => i.samples.slice(0, 2)));
    }
    case 'trips': {
      const located = pool.filter(r => r.wall != null && (r.exact || r.location) && inRange(r, a.from, a.to));
      const shots: Shot[] = located.map(r => ({ id: r.id, t: r.wall, lat: r.exact?.lat ?? r.location!.lat, lng: r.exact?.lng ?? r.location!.lng }));
      // Home is judged on every located photo, so a trip window doesn't make the trip look like home
      const all: Shot[] = pool.filter(r => r.wall != null && (r.exact || r.location)).map(r => ({ id: r.id, t: r.wall, lat: r.exact?.lat ?? r.location!.lat, lng: r.exact?.lng ?? r.location!.lng }));
      const story = buildStory(all.length > shots.length ? all : shots, { countryOf: ctx.countryOf });
      const inWindow = new Set(shots.map(s => s.id));
      const trips = story.trips.filter(t => t.shots.some(id => inWindow.has(id))).sort((x, y) => y.start - x.start);
      if (!trips.length) return { text: 'No trips away from home found.', ids: [] };
      return capped(`${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} away from home (newest first):`, trips.map(t => {
        const rs = t.shots.map(id => byId.get(id)).filter((r): r is Rec => !!r);
        const cities = [...new Set(rs.map(r => r.location?.city).filter(Boolean))].slice(0, 4).join(', ');
        const countries = [...new Set(rs.map(r => r.location?.country).filter(Boolean))].join(', ') || t.countries.join(', ');
        const labelsTop = (() => { const m = new Map<string, number>(); rs.forEach(r => r.labels.filter(l => l.p >= LABEL_MIN).forEach(l => m.set(l.name, (m.get(l.name) ?? 0) + 1))); return [...m.entries()].sort((p, q) => q[1] - p[1]).slice(0, 4).map(([k]) => k).join(', '); })();
        return `${dayOf(t.start)} to ${dayOf(t.end)} (${t.days} ${t.days === 1 ? 'day' : 'days'}): ${[cities, countries].filter(Boolean).join('; ')}; ${nOf(t.count, 'photo')}${labelsTop ? `; shows: ${labelsTop}` : ''}`;
      }), trips.map(t => t.shots.slice(0, 3)));
    }
    default:
      return { text: `Unknown tool ${(call as any).name}.`, ids: [] };
  }
}
/** Items for list(): newest first, never sensitive, one kind of media and a date range when asked */
export function listItems(items: Rec[], o: { mediaType?: string | null; from?: string | null; to?: string | null; limit?: number } = {}): Rec[] {
  const limit = Math.max(1, Math.min(2000, Math.floor(Number(o.limit) || 200)));
  return items
    .filter(r => usable(r) && (!o.mediaType || r.mediaType === o.mediaType) && inRange(r, o.from ?? undefined, o.to ?? undefined))
    .sort((a, b) => (b.wall ?? b.addedAt ?? 0) - (a.wall ?? a.addedAt ?? 0))
    .slice(0, limit);
}
const scrubbed = (r: ToolResult): ToolResult => ({ text: scrub(r.text).slice(0, TOOL_MAX), ids: r.ids });
