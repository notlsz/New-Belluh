// Belluh Memory places: venues, neighborhood, city and metro for 0.01 degree cells (about 1 km), from OpenStreetMap.
// Deploy with: supabase functions deploy memory-places --no-verify-jwt   (it checks the sign-in itself, as memory-agent does)
//
// POST { cells: ["35.66,139.70", ...] }  → { cells: [{ cell, neighborhood, city, metro, country, countryCode, venues: [{ name, kind, cuisine, lat, lng }] }] }
//
// What it sees and keeps: only cells, the south-west corner of a ~1 km square, rounded to 2 decimals; never a photo,
// its coordinates or when it was taken. It needs a signed-in person (so it can't be used as a free OSM proxy) but stores
// nothing about who asked: the cache table holds cells and public map data only, with no user column, and only the
// service role can read it. Rate limits are counted in memory, per instance, by a hash of the user id, and forgotten.
//
// Data: OpenStreetMap via the Overpass API (venues and administrative areas in one query per batch), falling back to
// Photon (komoot) reverse geocoding for the neighborhood and city when Overpass is busy. A proper User-Agent is sent,
// requests are batched, and results are cached for 30 days, per the services' usage policies. © OpenStreetMap
// contributors, ODbL.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { serverKey } from '../_shared/keys.ts';
import { CELL_RE, bbox, overpassQuery, parseOverpass, type CellPlaces } from '../_shared/memoryplaces.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });
const UA = 'Belluh/1.0 (https://belluh.com; hello@belluh.com) memory-places';
const OVERPASS = (Deno.env.get('OVERPASS_URL') || 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter').split(',');
const PHOTON = Deno.env.get('PHOTON_URL') || 'https://photon.komoot.io';

const MAX_CELLS = 64, MAX_BODY = 8 * 1024, TTL_DAYS = 30;

// Per instance, per user (hashed), per 10 minutes. Kept in memory only.
const WINDOW_MS = 10 * 60_000, PER_USER = 30;
const hits = new Map<string, number[]>();
async function limited(uid: string): Promise<boolean> {
  const key = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(uid))).slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (list.length >= PER_USER) { hits.set(key, list); return true; }
  list.push(now); hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW_MS)) hits.delete(k);
  return false;
}

async function overpass(cells: string[]): Promise<CellPlaces[] | null> {
  const body = 'data=' + encodeURIComponent(overpassQuery(cells));
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: 'POST', body, headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(55_000) });
      if (!r.ok) continue;
      const j = await r.json();
      return parseOverpass(j.elements ?? []);
    } catch { /* try the next mirror */ }
  }
  return null;
}

/** Areas only, one cell at a time, when Overpass can't answer */
async function photon(cell: string): Promise<CellPlaces> {
  const [s, w, n, e] = bbox(cell);
  const u = `${PHOTON}/reverse?lat=${((s + n) / 2).toFixed(4)}&lon=${((w + e) / 2).toFixed(4)}&lang=en&limit=1`;
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    const p = (await r.json())?.features?.[0]?.properties ?? {};
    return { cell, neighborhood: p.district ?? p.locality ?? null, city: p.city ?? null, metro: p.county ?? p.state ?? null, country: p.country ?? null, countryCode: p.countrycode ? String(p.countrycode).toUpperCase() : null, venues: [] };
  } catch { return { cell, neighborhood: null, city: null, metro: null, country: null, countryCode: null, venues: [] }; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);
  if (+(req.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'Too large' }, 413);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'Too large' }, 413);
  let body: any; try { body = JSON.parse(raw); } catch { return json({ error: 'Bad JSON' }, 400); }
  const cells: string[] = Array.isArray(body?.cells) ? [...new Set(body.cells.filter((c: unknown) => typeof c === 'string' && CELL_RE.test(c)))] as string[] : [];
  if (!cells.length) return json({ error: 'cells: a list of "lat,lng" cells with 2 decimals' }, 400);
  if (cells.length > MAX_CELLS) return json({ error: `At most ${MAX_CELLS} cells` }, 413);
  if (await limited(user.id)) return json({ error: 'Too many requests, try again in a few minutes' }, 429);

  const since = new Date(Date.now() - TTL_DAYS * 86_400_000).toISOString();
  const { data: cached } = await db.from('memory_place_cells').select('cell, data').in('cell', cells).gte('fetched_at', since);
  const have = new Map<string, CellPlaces>((cached ?? []).map((r: any) => [r.cell, r.data]));
  const missing = cells.filter(c => !have.has(c));
  for (let i = 0; i < missing.length; i += 16) {
    const batch = missing.slice(i, i + 16);
    let got = await overpass(batch);
    if (!got) got = await Promise.all(batch.map(photon));   // areas without venues; not cached, so a later call tries Overpass again
    else await db.from('memory_place_cells').upsert(got.map(c => ({ cell: c.cell, data: c, fetched_at: new Date().toISOString() })));
    got.forEach(c => have.set(c.cell, c));
  }
  return json({ cells: cells.map(c => have.get(c)).filter(Boolean), attribution: '© OpenStreetMap contributors' });
});
