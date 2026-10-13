// Server-side Gemini for the app's existing AI features (patterns, forecast, letters, transcription...).
// The browser never holds the API key. Signed-in users only, allowlisted models, size and hourly limits.
// Deploy with: supabase functions deploy gemini-proxy   (JWT verification ON)

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { buildGeminiBody, MAX_BODY_BYTES } from '../_shared/proxy.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const HOURLY_LIMIT = Number(Deno.env.get('AI_HOURLY_LIMIT') ?? 120);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413);

  // Fails closed: if the counter can't be read, no AI call is made
  const { data: allowed, error: limitError } = await db.rpc('ai_take_call', {
    p_user: user.id, p_limit: HOURLY_LIMIT, p_kind: 'proxy', p_global_limit: Number(Deno.env.get('AI_GLOBAL_HOURLY_LIMIT') ?? 3000),
  });
  if (limitError || allowed !== true) return json({ error: 'RESOURCE_EXHAUSTED: hourly AI limit reached' }, 429);

  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return json({ error: 'Bad JSON' }, 400); }
  const built = buildGeminiBody(parsed as Record<string, unknown>);
  if ('error' in built) return json({ error: built.error }, 400);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return json({ error: 'AI is not configured' }, 503);
  const res = await fetch(`${Deno.env.get('GEMINI_API_BASE') ?? 'https://generativelanguage.googleapis.com'}/v1beta/models/${built.model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(built.body),
  });
  if (!res.ok) {
    console.error('Gemini error', res.status, (await res.text()).slice(0, 300));
    return json({ error: res.status === 429 ? 'RESOURCE_EXHAUSTED' : 'AI request failed' }, res.status === 429 ? 429 : 502);
  }
  const out = await res.json();
  const text = (out?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
  return json({ text });
});
