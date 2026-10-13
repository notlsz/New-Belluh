// Moves voice notes and photos that older versions of Belluh saved in the PUBLIC "journal-media" bucket
// into the private "journal-private" bucket, and points each entry at the private copy.
// After this, a partner can only open them if the entry is shared, and nobody can open them by URL.
// Profile photos (avatars/) stay where they are.
//
// Safe to re-run: already-moved entries are skipped; uploads overwrite an identical copy.
// Order per file: copy → repoint the entry → delete the public original (only after the entry points at the copy).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DRY_RUN=1 to only report.
// Node 18+ (uses fetch). No dependencies.

const BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DRY = process.env.DRY_RUN === '1';
if (!BASE || !KEY) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(2); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

/** "https://x.supabase.co/storage/v1/object/public/journal-media/voice-notes/a.webm?t=1" -> "voice-notes/a.webm" */
export function legacyPath(url) {
  if (typeof url !== 'string') return null;
  const m = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/journal-media\/([^?#]+)/.exec(url);
  if (!m) return null;
  const path = decodeURIComponent(m[1]);
  if (path.startsWith('avatars/') || path.includes('..')) return null;
  return path;
}

/** Where the private copy lives: <owner>/<voice|photos>/<file name> */
export function privatePath(ownerId, field, path) {
  const name = path.split('/').pop().replace(/[^\w.\-]/g, '_') || 'file';
  return `${ownerId}/${field === 'audio_url' ? 'voice' : 'photos'}/legacy-${name}`;
}

async function rest(path, init = {}) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, { ...init, headers: { ...H, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`REST ${init.method || 'GET'} ${path.split('?')[0]}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function moveOne(entry, field, stats) {
  const path = legacyPath(entry[field]);
  if (!path) return;
  const dest = privatePath(entry.user_id, field, path);
  stats.found++;
  if (DRY) { console.log(`would move ${path} -> journal-private/${dest}`); return; }

  // 1. copy (if the public original is already gone, a previous run copied it; check the copy exists)
  const got = await fetch(`${BASE}/storage/v1/object/journal-media/${enc(path)}`, { headers: H });
  if (got.ok) {
    const body = Buffer.from(await got.arrayBuffer());
    const put = await fetch(`${BASE}/storage/v1/object/journal-private/${enc(dest)}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': got.headers.get('content-type') || 'application/octet-stream', 'x-upsert': 'true' },
      body,
    });
    if (!put.ok) { stats.failed++; console.error(`copy failed for entry ${entry.id}: ${put.status} ${await put.text()}`); return; }
  } else {
    const exists = await fetch(`${BASE}/storage/v1/object/journal-private/${enc(dest)}`, { headers: H });
    if (!exists.ok) { stats.missing++; console.warn(`entry ${entry.id}: ${path} not found anywhere; left as is`); return; }
  }

  // 2. repoint the entry, but only if it still holds the same old link
  const updated = await rest(`journal_entries?id=eq.${entry.id}&${field}=eq.${encodeURIComponent(entry[field])}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ [field]: `sb://journal-private/${dest}` }),
  });
  if (!updated?.length) { stats.failed++; console.error(`entry ${entry.id} changed while moving; will retry next run`); return; }

  // 3. remove the public original
  const del = await fetch(`${BASE}/storage/v1/object/journal-media/${enc(path)}`, { method: 'DELETE', headers: H });
  if (!del.ok && del.status !== 404) console.warn(`entry ${entry.id}: moved, but couldn't delete public ${path} (${del.status})`);
  stats.moved++;
}

export async function run() {
  const stats = { found: 0, moved: 0, missing: 0, failed: 0 };
  let after = '00000000-0000-0000-0000-000000000000';
  for (;;) {
    const page = await rest(`journal_entries?select=id,user_id,audio_url,photo_url&or=(audio_url.like.*journal-media*,photo_url.like.*journal-media*)&id=gt.${after}&order=id&limit=200`);
    if (!page.length) break;
    for (const e of page) {
      for (const field of ['audio_url', 'photo_url']) await moveOne(e, field, stats);
    }
    after = page[page.length - 1].id;
  }
  console.log(`${DRY ? '[dry run] ' : ''}legacy media: ${stats.found} found, ${stats.moved} moved, ${stats.missing} missing, ${stats.failed} failed`);
  return stats;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().then(s => process.exit(s.failed ? 1 : 0)).catch(e => { console.error(e.message); process.exit(1); });
}
