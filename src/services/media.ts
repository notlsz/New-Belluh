import { supabase } from '../lib/supabaseClient';

// Voice notes and photos live in a private bucket at <your id>/<kind>/<file>.
// Entries store a reference ("sb://journal-private/<path>") that is turned into a short-lived link when loaded.
const BUCKET = 'journal-private';
const PREFIX = `sb://${BUCKET}/`;
const LINK_SECONDS = 60 * 60 * 24;

export const isPrivateRef = (u?: string | null): u is string => !!u && u.startsWith(PREFIX);

export async function uploadPrivate(kind: 'voice' | 'photos', file: Blob, ext: string, contentType: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const path = `${user.id}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext.replace(/[^a-z0-9]/gi, '') || 'bin'}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) { console.error('Upload failed:', error.message); return null; }
  return PREFIX + path;
}

/** Old entries saved one-hour signed links to the public bucket; turn those back into permanent public links. */
export function repairLegacyUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const m = /^(https:\/\/[^/]+\/storage\/v1\/object)\/sign\/(journal-media\/[^?]+)\?token=/.exec(u);
  return m ? `${m[1]}/public/${m[2]}` : u;
}

/** Resolves private references to viewable links in one request. Anything else passes through. */
export async function resolveMedia(urls: (string | null | undefined)[]): Promise<Map<string, string>> {
  const refs = [...new Set(urls.filter(isPrivateRef))];
  const out = new Map<string, string>();
  if (!refs.length) return out;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(refs.map(r => r.slice(PREFIX.length)), LINK_SECONDS);
  if (error || !data) return out;
  data.forEach((d, i) => { if (d.signedUrl) out.set(refs[i], d.signedUrl); });
  return out;
}
