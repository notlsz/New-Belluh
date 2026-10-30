// Spots near you: real places for a date (dinner, a wine bar, a museum, a park) from OpenStreetMap, free and keyless.
// Nominatim matches names and categories ("ramen, San Francisco", "restaurants in Mission District, San Francisco"),
// so a few phrasings are tried and only places in the city that was asked for are kept: the same name exists in
// many towns. Each spot carries what's needed to choose and book it: kind, address, phone, website, hours, a map.

import { toE164 } from './vapi.ts';

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };
const OSM = () => env('OSM_SEARCH_BASE') || 'https://nominatim.openstreetmap.org';

export interface Spot {
  name: string;
  kind: string;            // "Ramen", "Wine bar", "Museum"
  address: string | null;
  phone: string | null;    // E.164, so Bella can call to book
  website: string | null;
  hours: string | null;    // as the place lists them, e.g. "Mo-Su 17:00-22:00"
  map: string;
  bookable: boolean;       // a restaurant, cafe or bar: a table can be booked
}

const EAT = /^(restaurant|cafe|bar|pub|biergarten|fast_food|food_court|ice_cream)$/;
const GOOD = /^(amenity|leisure|tourism|shop)$/;
const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/** "Mission District, San Francisco" → "san francisco": the place's address must be in this city. */
export function cityOf(where: string): string | null {
  const parts = where.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const last = parts[parts.length - 1] ?? '';
  // "SF, CA" / "Brooklyn, NY": a state code isn't the city
  const city = /^[a-z]{2}$/.test(last) && parts.length > 1 ? parts[parts.length - 2] : last;
  return city && city.length >= 3 ? city : null;
}

/** Nominatim results as spots: named places that are somewhere to go, in the right city, without repeats. */
/** Asking for food or drinks (a cuisine, dinner, a bar) rather than a museum, a park or a show. */
export const wantsFood = (what: string) => !/museum|park|gallery|beach|garden|trail|hike|theat|cinema|movie|view|zoo|aquarium|book|shop|store|market|spa|bowling|arcade|concert|music|comedy|class|studio|climb|skat|golf|kayak|boat|tour/i.test(what);

export function parseSpots(json: unknown, city: string | null, limit = 6, foodOnly = false, us = true): Spot[] {
  const out: Spot[] = [];
  const seen = new Set<string>();
  for (const p of (Array.isArray(json) ? json : []) as any[]) {
    const name = typeof p?.name === 'string' ? p.name.trim() : '';
    if (!name || !GOOD.test(String(p?.category ?? ''))) continue;
    if (foodOnly && !(p.category === 'amenity' && EAT.test(String(p.type ?? '')))) continue;
    const a = p.address ?? {};
    const town = [a.city, a.town, a.village, a.borough, a.suburb, a.city_district, a.neighbourhood].filter(Boolean).join(' | ').toLowerCase();
    if (city && !town.includes(city)) continue;
    const key = `${name.toLowerCase()}|${a.road ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const t = p.extratags ?? {};
    const type = String(p.type ?? '');
    const cuisine = typeof t.cuisine === 'string' ? t.cuisine.split(';')[0] : '';
    const kind = EAT.test(type) && cuisine ? titleCase(cuisine) + (type === 'restaurant' ? '' : ` ${type === 'bar' || type === 'pub' ? 'bar' : titleCase(type).toLowerCase()}`) : titleCase(type);
    const rawPhone = String(t.phone ?? t['contact:phone'] ?? '').split(';')[0].trim();
    const digits = rawPhone.replace(/\D/g, '');
    // Outside the US a number without its country code can't be dialed from here, so only full international ones count
    const phone = toE164(rawPhone.startsWith('+') ? rawPhone : !us ? '' : digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `+${digits}` : '');
    const web = String(t.website ?? t['contact:website'] ?? '').trim();
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const address = [street, a.suburb ?? a.neighbourhood, a.city ?? a.town ?? a.village].filter(Boolean).join(', ') || null;
    const lat = Number(p.lat), lon = Number(p.lon);
    const map = new URL('https://www.google.com/maps/search/');
    map.searchParams.set('api', '1');
    map.searchParams.set('query', Number.isFinite(lat) && Number.isFinite(lon) ? `${name} ${lat},${lon}` : `${name} ${address ?? ''}`.trim());
    out.push({
      name: name.slice(0, 80), kind: kind.slice(0, 40), address: address ? address.slice(0, 120) : null, phone,
      website: /^https?:\/\//.test(web) ? web.slice(0, 200) : null,
      hours: typeof t.opening_hours === 'string' ? t.opening_hours.slice(0, 80) : null,
      map: map.toString(), bookable: p.category === 'amenity' && EAT.test(type),
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** The phrasings Nominatim understands, best first. */
export function spotQueries(what: string, where: string): string[] {
  const w = what.trim(), at = where.trim();
  const plural = /s$/i.test(w) ? w : `${w}s`;
  return [...new Set([`${w}, ${at}`, `${plural} in ${at}`, `${w} in ${at}`, `${w} near ${at}`])];
}

/** Real places for what they asked (a cuisine, a kind of place) in where they are. Nominatim asks for at most one
 *  request a second, so phrasings are tried one after another and it stops as soon as it has enough. */
export async function findSpots(what: string, where: string, fetchImpl: typeof fetch = fetch, limit = 6, country = 'us'): Promise<Spot[]> {
  const w = what.replace(/\s+/g, ' ').trim().slice(0, 60), at = where.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (w.length < 2 || at.length < 2) return [];
  const city = country === 'us' ? cityOf(at) : cityOf(at.replace(/,\s*[a-z]{2}$/i, ''));
  const found: Spot[] = [];
  let first = true;
  for (const q of spotQueries(w, at)) {
    if (!first) await new Promise(r => setTimeout(r, 1100));
    first = false;
    try {
      const u = new URL(`${OSM()}/search`);
      for (const [k, v] of Object.entries({ q, format: 'jsonv2', extratags: '1', addressdetails: '1', limit: '12', countrycodes: /^[a-z]{2}$/.test(country) ? country : 'us' })) u.searchParams.set(k, v);
      const r = await fetchImpl(u.toString(), { headers: { 'User-Agent': 'Belluh/1.0 (https://belluh.com; hello@belluh.com)', 'Accept-Language': 'en' }, signal: AbortSignal.timeout(6000) });
      if (!r.ok) continue;
      for (const s of parseSpots(await r.json(), city, limit, wantsFood(w), country === 'us')) if (!found.some(f => f.name === s.name && f.address === s.address)) found.push(s);
    } catch { /* try the next phrasing */ }
    if (found.length >= Math.min(limit, 4)) break;
  }
  return found.slice(0, limit);
}
