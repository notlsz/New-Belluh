// Belluh Memory events: the concert, festival, game, show or race a visit at a venue was for, after Rollup's opt-in
// `events` lookup. Called only when the person turned on "Look up events" in Memory settings (needs Name places).
// Deploy with: supabase functions deploy memory-events --no-verify-jwt   (it checks the sign-in itself, like memory-places)
//
// POST { visits: [{ cell: "37.78,-122.44", venues: ["The Fillmore"], start: "2026-05-14T19:30", end: "2026-05-14T23:10" }] }
//   → { visits: [{ i: 0, hit: { name, kind, genre, performers, venue, source } | null }] }
//
// What it sees and keeps: per visit only a ~1 km cell, venue names and local times; never coordinates, photos or ids.
// It keeps no visit: nothing is written to the database, nothing is logged, and nothing says who asked. To ask the
// listings less often, each instance remembers a listing it received (by cell, venue and evening) in memory for up to
// 30 days; rate limits are counted in memory by a hash of the user id and forgotten.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { serverKey } from '../_shared/keys.ts';
import { best, cleanVisits, eveningOf, readSetlists, readTicketmaster, readWikidata, setlistUrl, ticketmasterUrl, wikidataQuery, type Hit } from '../_shared/memoryevents.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });
const UA = 'Belluh/1.0 (https://belluh.com; hello@belluh.com) memory-events';
const SETLIST = Deno.env.get('SETLISTFM_API_KEY') ?? '';
const TM = Deno.env.get('TICKETMASTER_API_KEY') ?? '';
const MAX_BODY = 8 * 1024, TTL = 30 * 86_400_000;

const WINDOW_MS = 10 * 60_000, PER_USER = 20;
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

// Listings received, by source, cell or venue, and evening: public data only
const cache = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, f: () => Promise<T>): Promise<T> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.v as T;
  const v = await f();
  cache.set(key, { at: Date.now(), v });
  if (cache.size > 20_000) for (const [k] of [...cache].slice(0, 5000)) cache.delete(k);
  return v;
}
async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  return r.json();
}

async function lookup(v: { cell: string; venues: string[]; start: string }): Promise<Hit | null> {
  const day = eveningOf(v.start);
  const sl = SETLIST ? await Promise.all(v.venues.slice(0, 3).map(n => cached(`sl|${n.toLowerCase()}|${day}`, () => getJson(setlistUrl(n, day), { 'x-api-key': SETLIST }).catch(() => null)).then(j => readSetlists(j, n)))) : [];
  const fromSetlist = best(...sl);
  if (fromSetlist) return fromSetlist;
  const tm = TM ? readTicketmaster(await cached(`tm|${v.cell}|${day}`, () => getJson(ticketmasterUrl(TM, v.cell, day)).catch(() => null)), day, v.venues) : null;
  if (tm) return tm;
  const wd = await cached(`wd|${v.cell}|${day}`, () => getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(wikidataQuery(v.cell, day))}`, { Accept: 'application/sparql-results+json' }).catch(() => null));
  return readWikidata(wd);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);
  if (+(req.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'Too large' }, 413);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'Too large' }, 413);
  let body: unknown; try { body = JSON.parse(raw); } catch { return json({ error: 'Bad JSON' }, 400); }
  const visits = cleanVisits(body);
  if (!visits) return json({ error: 'visits: 1 to 20 of { cell, venues, start, end }' }, 400);
  if (await limited(user.id)) return json({ error: 'Too many requests, try again in a few minutes' }, 429);
  const out = await Promise.all(visits.map(async (v, i) => ({ i, hit: await lookup(v).catch(() => null) })));
  return json({ visits: out, attribution: 'setlist.fm, Ticketmaster, Wikidata' });
});
