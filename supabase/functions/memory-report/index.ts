// Belluh Memory run reports: counts and timings of one indexing run on a person's device, after Rollup's run reports.
// The app sends one only when the person turned on "Share run reports" in Memory settings and allows "Improving Belluh"
// in the Privacy Center. Deploy with: supabase functions deploy memory-report --no-verify-jwt (it checks the sign-in).
//
// POST <RunReport>  → { ok: true }
//
// It needs a signed-in person (so it can't be spammed) but stores nothing about who sent it: the row has no user or
// device column, and the report is cut to the known count, timing and outcome fields (cleanReport) before it is kept.
// Rows older than 90 days are deleted. Rate limits are counted in memory by a hash of the user id and forgotten.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { serverKey } from '../_shared/keys.ts';
import { cleanReport } from '../_shared/memoryreport.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });
const MAX_BODY = 4 * 1024, KEEP_DAYS = 90;

const WINDOW_MS = 60 * 60_000, PER_USER = 60;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'Too large' }, 413);
  let body: any; try { body = JSON.parse(raw); } catch { return json({ error: 'Bad JSON' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'A report object' }, 400);
  if (await limited(user.id)) return json({ error: 'Too many reports' }, 429);
  const report = cleanReport(body);
  const { error } = await db.from('memory_run_reports').insert({ report });
  if (error) return json({ error: 'Could not keep the report' }, 500);
  // Keep 90 days at most (best effort)
  await db.from('memory_run_reports').delete().lt('received_at', new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString());
  return json({ ok: true });
});
