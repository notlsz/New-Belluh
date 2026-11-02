// Skip the blank page: a couple picks photos of the two of them and Belluh turns them into places, trips and firsts,
// the way Rollup reads a camera roll. All of it runs on the phone, on what the photos already say about themselves
// (when and where they were taken). No photo leaves the device and no model looks at them. Pure, so it's unit-tested;
// the screen is src/components/PhotoStory.tsx.

/** One photo, reduced to what its EXIF says. t is the local time it was taken (ms), lat and lng where. */
export interface Shot { id: string; t: number | null; lat: number | null; lng: number | null }

export interface Place {
  id: string;
  lat: number; lng: number;          // the middle of the photos taken there
  count: number;                     // photos
  days: number;                      // different days they were there
  visits: number;                    // separate times they came back (days in a row count once)
  first: number | null; last: number | null;
  shots: string[];
  country: string | null;            // English name from the offline world map
}

export interface Trip {
  id: string;
  start: number; end: number;        // first and last photo
  days: number;                      // calendar days, both ends counted
  lat: number; lng: number;          // the place with the most photos on the trip
  country: string | null;
  countries: string[];
  count: number;
  shots: string[];
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';
export interface Rhythm {
  total: number; dated: number; located: number;
  first: number | null; last: number | null;
  topMonths: { year: number; month: number; count: number }[];   // month 1 to 12
  favorite: { weekend: boolean; part: DayPart; share: number } | null;
  recurring: Place[];                // the same spot, gone back to 3 or more times (home left out)
}

export interface Story { places: Place[]; home: Place | null; trips: Trip[]; rhythm: Rhythm }

export interface StoryOptions {
  countryOf?: (lng: number, lat: number) => string | null;
  radiusKm?: number;   // photos this close together are one place
  awayKm?: number;     // this far from home is away
}

const DAY = 86_400_000;
const okCoord = (lat: unknown, lng: unknown): lat is number => typeof lat === 'number' && typeof lng === 'number'
  && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/** Kept to 3 decimals (about 100 m): enough for a pin, not a doorstep. */
export const round3 = (x: number) => Math.round(x * 1000) / 1000;

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The local calendar day of a time, as a number of days (so two days can be subtracted). */
export const dayIndex = (t: number) => { const d = new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY); };

/** Photos within radiusKm of a place's middle join it; the middle moves as photos join. Biggest places first. */
export function clusterPlaces(shots: Shot[], radiusKm = 1, countryOf?: StoryOptions['countryOf']): Place[] {
  const located = shots.filter(s => okCoord(s.lat, s.lng)).sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
  const groups: { lat: number; lng: number; members: Shot[] }[] = [];
  for (const s of located) {
    let best: (typeof groups)[number] | null = null, bestKm = Infinity;
    for (const g of groups) {
      // cheap box test before the real distance
      if (Math.abs(g.lat - s.lat!) > radiusKm / 100) continue;
      const d = km(g, { lat: s.lat!, lng: s.lng! });
      if (d <= radiusKm && d < bestKm) { best = g; bestKm = d; }
    }
    if (!best) { groups.push({ lat: s.lat!, lng: s.lng!, members: [s] }); continue; }
    best.members.push(s);
    const n = best.members.length;
    best.lat += (s.lat! - best.lat) / n;
    best.lng += (s.lng! - best.lng) / n;
  }
  return groups.map((g, i) => {
    const times = g.members.map(m => m.t).filter((t): t is number => t != null);
    const dayList = [...new Set(times.map(dayIndex))].sort((a, b) => a - b);
    return {
      id: `p${i + 1}`,
      lat: g.lat, lng: g.lng,
      count: g.members.length,
      days: dayList.length,
      visits: dayList.filter((d, j) => j === 0 || d - dayList[j - 1] > 1).length,
      first: times.length ? Math.min(...times) : null,
      last: times.length ? Math.max(...times) : null,
      shots: g.members.map(m => m.id),
      country: countryOf ? countryOf(g.lng, g.lat) : null,
    };
  }).sort((a, b) => b.days - a.days || b.count - a.count);
}

/** Home is the place they were on the most different days, if it clearly stands out. */
export function homeOf(places: Place[], locatedDays: number): Place | null {
  const top = places[0];
  if (!top || top.days < 3) return null;
  return top.days / Math.max(1, locatedDays) >= 0.25 ? top : null;
}

/**
 * Trips: runs of days away from home (more than awayKm), allowing up to 3 days without a located photo inside a run.
 * Without a clear home (only holiday photos were picked, say), each run of days with photos is its own trip.
 */
export function findTrips(shots: Shot[], places: Place[], home: Place | null, opts: StoryOptions = {}): Trip[] {
  const awayKm = opts.awayKm ?? 50;
  const placeOf = new Map<string, Place>();
  places.forEach(p => p.shots.forEach(id => placeOf.set(id, p)));
  const byDay = new Map<number, Shot[]>();
  shots.filter(s => s.t != null && okCoord(s.lat, s.lng)).forEach(s => {
    const k = dayIndex(s.t!); byDay.set(k, [...(byDay.get(k) ?? []), s]);
  });
  const days = [...byDay.keys()].sort((a, b) => a - b);
  const away = (k: number) => {
    if (!home) return true;
    const list = byDay.get(k)!;
    return list.filter(s => km(home, { lat: s.lat!, lng: s.lng! }) > awayKm).length * 2 >= list.length;
  };
  const runs: number[][] = [];
  let run: number[] = [];
  for (const k of days) {
    if (!away(k)) { if (run.length) runs.push(run); run = []; continue; }
    if (run.length && k - run[run.length - 1] > 3) { runs.push(run); run = []; }
    run.push(k);
  }
  if (run.length) runs.push(run);

  const trips: Trip[] = [];
  runs.forEach(r => {
    const list = r.flatMap(k => byDay.get(k)!).filter(s => !home || km(home, { lat: s.lat!, lng: s.lng! }) > awayKm);
    const span = r[r.length - 1] - r[0] + 1;
    if (list.length < 3 && span < 2) return;     // one stray photo out of town isn't a trip
    const tally = new Map<Place, number>();
    list.forEach(s => { const p = placeOf.get(s.id); if (p) tally.set(p, (tally.get(p) ?? 0) + 1); });
    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    const main = ranked[0]?.[0];
    if (!main) return;
    const byCountry = new Map<string, number>();
    ranked.forEach(([p, n]) => { if (p.country) byCountry.set(p.country, (byCountry.get(p.country) ?? 0) + n); });
    const countries = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const times = list.map(s => s.t!);
    trips.push({
      id: `t${trips.length + 1}`,
      start: Math.min(...times), end: Math.max(...times), days: span,
      lat: main.lat, lng: main.lng,
      country: countries[0] ?? main.country, countries,
      count: list.length, shots: list.map(s => s.id),
    });
  });
  return trips;
}

const partOf = (h: number): DayPart => h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night';

export function rhythmOf(shots: Shot[], places: Place[], home: Place | null): Rhythm {
  const times = shots.map(s => s.t).filter((t): t is number => t != null).sort((a, b) => a - b);
  const months = new Map<string, { year: number; month: number; count: number }>();
  const slots = new Map<string, number>();
  for (const t of times) {
    const d = new Date(t);
    const mk = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.get(mk) ?? { year: d.getFullYear(), month: d.getMonth() + 1, count: 0 };
    m.count++; months.set(mk, m);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const sk = `${weekend ? 1 : 0}:${partOf(d.getHours())}`;
    slots.set(sk, (slots.get(sk) ?? 0) + 1);
  }
  const topMonths = [...months.values()].sort((a, b) => b.count - a.count || a.year - b.year || a.month - b.month).slice(0, 3);
  let favorite: Rhythm['favorite'] = null;
  const best = [...slots.entries()].sort((a, b) => b[1] - a[1])[0];
  if (best && times.length >= 10 && best[1] / times.length >= 0.25) {
    const [w, part] = best[0].split(':');
    favorite = { weekend: w === '1', part: part as DayPart, share: best[1] / times.length };
  }
  return {
    total: shots.length,
    dated: times.length,
    located: shots.filter(s => okCoord(s.lat, s.lng)).length,
    first: times[0] ?? null,
    last: times[times.length - 1] ?? null,
    topMonths,
    favorite,
    recurring: places.filter(p => p !== home && p.visits >= 3).sort((a, b) => b.visits - a.visits).slice(0, 5),
  };
}

export function buildStory(shots: Shot[], opts: StoryOptions = {}): Story {
  const places = clusterPlaces(shots, opts.radiusKm ?? 1, opts.countryOf);
  const locatedDays = new Set(shots.filter(s => s.t != null && okCoord(s.lat, s.lng)).map(s => dayIndex(s.t!))).size;
  const home = homeOf(places, locatedDays);
  const trips = findTrips(shots, places, home, opts);
  return { places, home, trips, rhythm: rhythmOf(shots, places, home) };
}

// What Belluh offers to save. Nothing is saved until they tick it and press save; dates are never assumed, so the
// "is this when you got together?" kind start unticked.
export type Suggestion =
  | { id: string; kind: 'trip'; trip: Trip; on: boolean }
  | { id: string; kind: 'pin'; place: Place; on: boolean }
  | { id: string; kind: 'together'; t: number; on: boolean }
  | { id: string; kind: 'firstTrip'; trip: Trip; on: boolean };

export function suggest(story: Story, maxPins = 6): Suggestion[] {
  const out: Suggestion[] = [];
  story.trips.slice().sort((a, b) => b.start - a.start).slice(0, 12)
    .forEach(trip => out.push({ id: `trip:${trip.id}`, kind: 'trip', trip, on: true }));
  // Places they kept going back to. Home is never offered (it's a doorstep, not a memory), nor a trip's own place.
  const near = (p: Place) => story.trips.some(t => km(t, p) < 1);
  story.places.filter(p => p !== story.home && p.visits >= 2 && !near(p)).sort((a, b) => b.visits - a.visits || b.count - a.count).slice(0, maxPins)
    .forEach(place => out.push({ id: `pin:${place.id}`, kind: 'pin', place, on: true }));
  if (story.rhythm.first != null) out.push({ id: 'together', kind: 'together', t: story.rhythm.first, on: false });
  const firstTrip = story.trips[0];
  if (firstTrip) out.push({ id: 'firstTrip', kind: 'firstTrip', trip: firstTrip, on: false });
  return out;
}

// The rows that get saved: journal entries (each one a pin on the love map too) and dates for Bella. Only a caption
// they can edit, a date, and coordinates rounded to about 100 m. No photo, no file name, no camera, no exact time.
export interface EntryRow {
  user_id: string; content: string; type: 'Freeform'; is_shared: boolean; is_favorite: false;
  lat: number; lng: number; date: string; tags: string[];
}
export interface OccasionRow {
  user_id: string; kind: 'anniversary' | 'trip'; label: string; month: number; day: number; year: number;
  repeats_yearly: true; source: 'app'; source_message: string;
}
export const FROM_PHOTOS = 'from_photos';

/** Noon on the photo's local day, so a backdated entry never slips to the day before in another time zone. */
export const dayIso = (t: number) => { const d = new Date(t); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12)).toISOString(); };

export function rowsFor(
  picked: Suggestion[],
  ctx: { userId: string; circleId: string; shared: boolean; caption: (s: Suggestion) => string; label: (s: Suggestion) => string },
): { entries: EntryRow[]; occasions: OccasionRow[] } {
  const entries: EntryRow[] = [], occasions: OccasionRow[] = [];
  for (const s of picked) {
    if (!s.on) continue;
    if (s.kind === 'trip' || s.kind === 'pin') {
      const at = s.kind === 'trip' ? s.trip : s.place;
      const when = s.kind === 'trip' ? s.trip.start : (s.place.first ?? Date.now());
      const content = ctx.caption(s).trim().slice(0, 280);
      if (!content) continue;
      entries.push({
        user_id: ctx.userId, content, type: 'Freeform', is_shared: ctx.shared, is_favorite: false,
        lat: round3(at.lat), lng: round3(at.lng), date: dayIso(when), tags: [`circle:${ctx.circleId}`, FROM_PHOTOS],
      });
    } else {
      const t = s.kind === 'together' ? s.t : s.trip.start;
      const d = new Date(t);
      const label = ctx.label(s).trim().slice(0, 120);
      if (!label) continue;
      occasions.push({
        user_id: ctx.userId, kind: s.kind === 'together' ? 'anniversary' : 'trip', label,
        month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear(),
        repeats_yearly: true, source: 'app', source_message: FROM_PHOTOS,
      });
    }
  }
  return { entries, occasions };
}
