// Deletes the caller's Belluh account and everything in it (GDPR right to erasure, CCPA right to delete).
// Deploy with: supabase functions deploy delete-account   (JWT verification ON)
//
// POST body: { confirm: true }  → { deleted: true }
// Order: their files in storage, then rows in the older tables that may not cascade, then the auth user, which
// cascades to every table that references auth.users on delete cascade (occasions, plans, guides, privacy_consent...).

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { serverKey } from '../_shared/keys.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });

/** Every file path under a folder in a bucket, one level of subfolders deep (how journal media is laid out). */
async function filesUnder(bucket: string, folder: string): Promise<string[]> {
  const out: string[] = [];
  const { data } = await db.storage.from(bucket).list(folder, { limit: 1000 });
  for (const f of data ?? []) {
    const path = `${folder}/${f.name}`;
    if (f.id) out.push(path);
    else {
      const { data: inner } = await db.storage.from(bucket).list(path, { limit: 1000 });
      for (const g of inner ?? []) if (g.id) out.push(`${path}/${g.name}`);
    }
  }
  return out;
}

async function removeFiles(uid: string) {
  try {
    const priv = await filesUnder('journal-private', uid);
    for (let i = 0; i < priv.length; i += 100) await db.storage.from('journal-private').remove(priv.slice(i, i + 100));
  } catch (e) { console.warn('delete-account: private files', e); }
  try {
    const { data } = await db.storage.from('journal-media').list('avatars', { limit: 1000, search: `${uid}-` });
    const mine = (data ?? []).filter(f => f.name.startsWith(`${uid}-`)).map(f => `avatars/${f.name}`);
    if (mine.length) await db.storage.from('journal-media').remove(mine);
  } catch (e) { console.warn('delete-account: avatars', e); }
}

// Tables from before the migrations folder, which may not cascade from auth.users
const OWNED: [string, string][] = [
  ['journal_entries', 'user_id'], ['conflict_logs', 'user_id'], ['analytics_events', 'user_id'],
  ['partner_connections', 'user_id'], ['partner_connections', 'partner_id'], ['profiles', 'id'],
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Bad JSON' }, 400); }
  if (body?.confirm !== true) return json({ error: 'Confirmation required' }, 400);

  await removeFiles(user.id);
  for (const [table, col] of OWNED) {
    const { error } = await db.from(table).delete().eq(col, user.id);
    if (error && !/does not exist|schema cache/i.test(error.message)) console.warn(`delete-account: ${table}.${col}`, error.message);
  }
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);
  return json({ deleted: true });
});
