// Where photos were taken, on the device. Without `places`: the country (offline world map) and the nearest city of
// 15,000 people or more within 75 km (GeoNames cities15000, bundled as a lazy asset). With `places`: only 0.01 degree
// cells (about 1 km) go to Belluh's memory-places function, never a photo's coordinates or time; venues come back and
// each photo is matched to the nearest one within about 60 m on the device. Pure, so it's unit-tested.

import { km } from '../photoStory.ts';

/** The 0.01 degree cell a point falls in, named by its south-west corner ("35.66,139.70"). */
export function cellOf(lat: number, lng: number): string {
  const f = (x: number) => (Math.floor(x * 100 + 1e-9) / 100).toFixed(2);
  return `${f(lat)},${f(lng)}`;
}
export const CELL_RE = /^-?\d{1,2}\.\d{2},-?\d{1,3}\.\d{2}$/;

/** Cells to ask about: deduped, sorted (so the order says nothing about when photos were taken), never per photo. */
export function cellsFor(points: { lat: number; lng: number }[]): string[] {
  return [...new Set(points.map(p => cellOf(p.lat, p.lng)))].sort();
}

/** Rounded to 3 decimals (about 100 m), what a Location carries; exact coordinates stay on the device */
export const r3 = (x: number) => Math.round(x * 1000) / 1000;

export interface Cities {
  name: string[]; cc: string[]; lat: Float32Array; lng: Float32Array; pop: Uint32Array;
  grid: Map<string, number[]>;
}

/** Parses the compact table: "#CC" lines, then "name<TAB>lat*100<TAB>lng*100<TAB>population/1000" */
export function parseCities(text: string): Cities {
  const lines = text.split('\n');
  const n = lines.filter(l => l && l[0] !== '#').length;
  const c: Cities = { name: [], cc: [], lat: new Float32Array(n), lng: new Float32Array(n), pop: new Uint32Array(n), grid: new Map() };
  let cc = '', i = 0;
  for (const l of lines) {
    if (!l) continue;
    if (l[0] === '#') { cc = l.slice(1); continue; }
    const [name, la, ln, p] = l.split('\t');
    c.name.push(name); c.cc.push(cc);
    c.lat[i] = +la / 100; c.lng[i] = +ln / 100; c.pop[i] = +p * 1000;
    const key = `${Math.floor(c.lat[i])},${Math.floor(c.lng[i])}`;
    const b = c.grid.get(key); if (b) b.push(i); else c.grid.set(key, [i]);
    i++;
  }
  return c;
}

export function nearestCity(c: Cities, lat: number, lng: number, maxKm = 75): { name: string; cc: string; km: number } | null {
  const dLng = Math.min(180, Math.ceil(maxKm / (111 * Math.max(0.05, Math.cos(lat * Math.PI / 180)))));
  let best = -1, bestKm = Infinity;
  for (let a = Math.floor(lat) - 1; a <= Math.floor(lat) + 1; a++) {
    for (let b = Math.floor(lng) - dLng; b <= Math.floor(lng) + dLng; b++) {
      const wrapped = ((b + 180) % 360 + 360) % 360 - 180;
      for (const i of c.grid.get(`${a},${wrapped}`) ?? []) {
        const d = km({ lat, lng }, { lat: c.lat[i], lng: c.lng[i] });
        if (d < bestKm) { bestKm = d; best = i; }
      }
    }
  }
  return best >= 0 && bestKm <= maxKm ? { name: c.name[best], cc: c.cc[best], km: bestKm } : null;
}

/** What memory-places returns for one cell */
export interface CellPlaces {
  cell: string;
  neighborhood?: string | null; city?: string | null; metro?: string | null; country?: string | null; countryCode?: string | null;
  venues: Venue[];
}
export interface Venue { name: string; kind: string; cuisine?: string | null; lat: number; lng: number }

// Which labels make which kinds of venue a better fit, so a dinner photo goes to the restaurant, not the bank next door
const FIT: Record<string, string[]> = {
  food: ['restaurant', 'fast_food', 'cafe', 'food_court', 'bakery', 'ice_cream', 'pub', 'bar', 'biergarten', 'marketplace'],
  drink: ['cafe', 'bar', 'pub', 'biergarten', 'nightclub', 'restaurant', 'wine_bar', 'winery', 'brewery'],
  music: ['music_venue', 'nightclub', 'theatre', 'arts_centre', 'stadium', 'bar', 'pub', 'karaoke_box'],
  sport: ['stadium', 'sports_centre', 'fitness_centre', 'golf_course', 'park', 'pitch', 'swimming_pool', 'ice_rink'],
  nature: ['park', 'beach', 'garden', 'viewpoint', 'nature_reserve'],
  city: ['museum', 'gallery', 'arts_centre', 'marketplace', 'mall', 'attraction', 'books', 'cafe', 'restaurant', 'bar'],
  activity: ['zoo', 'aquarium', 'theme_park', 'cinema', 'bowling_alley', 'park', 'camp_site', 'marina'],
};

/**
 * The venue a photo was taken at: the nearest within maxM metres, preferring one whose kind fits what the photo shows
 * (a better fit can be up to 35 m further away: phone GPS is often 20 to 30 m off indoors); a venue that doesn't fit what
 * the photo shows counts only within 25 m. Null when nothing is close enough.
 */
export function matchVenue(at: { lat: number; lng: number }, venues: Venue[], groups: string[] = [], maxM = 60): Venue | null {
  let best: Venue | null = null, bestScore = Infinity;
  const fits = new Set(groups.flatMap(g => FIT[g] ?? []));
  for (const v of venues) {
    const m = km(at, v) * 1000;
    if (m > maxM) continue;
    // A photo that clearly shows something (skiing, a beach) only goes to a venue of another kind when right at it
    if (fits.size && !fits.has(v.kind) && m > 25) continue;
    const score = m - (fits.has(v.kind) ? 35 : 0);
    if (score < bestScore) { bestScore = score; best = v; }
  }
  return best;
}

/** Kinds of venue in words, for search and tool text */
export const KIND_WORDS: Record<string, string> = {
  restaurant: 'restaurant', fast_food: 'fast food', cafe: 'cafe', bar: 'bar', pub: 'pub', biergarten: 'beer garden', nightclub: 'nightclub',
  music_venue: 'music venue', theatre: 'theater', cinema: 'cinema', arts_centre: 'arts center', museum: 'museum', gallery: 'gallery',
  park: 'park', garden: 'garden', beach: 'beach', viewpoint: 'viewpoint', attraction: 'attraction', zoo: 'zoo', aquarium: 'aquarium',
  theme_park: 'theme park', stadium: 'stadium', sports_centre: 'sports center', fitness_centre: 'gym', golf_course: 'golf course',
  marina: 'marina', camp_site: 'campsite', hotel: 'hotel', mall: 'mall', marketplace: 'market', bakery: 'bakery', ice_cream: 'ice cream shop',
  books: 'bookstore', winery: 'winery', wine_bar: 'wine bar', brewery: 'brewery', karaoke_box: 'karaoke', bowling_alley: 'bowling alley',
  ice_rink: 'ice rink', swimming_pool: 'pool', nature_reserve: 'nature reserve', aerodrome: 'airport', food_court: 'food court', garden_centre: 'garden center',
};
