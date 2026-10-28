// The server key the functions use to reach the database. Supabase's new secret keys (sb_secret_...) come first, so
// the legacy service_role key and the JWT secret behind it can be revoked without anything here breaking; the legacy
// key is only the fallback until then.
export function serverKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    const k = keys?.default ?? Object.values(keys ?? {})[0];
    if (typeof k === 'string' && k.length > 20) return k;
  } catch { /* not set */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}
