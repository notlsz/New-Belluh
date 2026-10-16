// Server-side Gemini for the app's existing AI features (patterns, forecast, letters, transcription...).
// The browser never holds the API key. Signed-in users only, allowlisted models, size and hourly limits.
// Deploy with: supabase functions deploy gemini-proxy   (JWT verification ON)

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { buildGeminiBody, MAX_BODY_BYTES } from '../_shared/proxy.ts';
import { geminiFirst, MODELS, type GeminiContent } from '../_shared/gemini.ts';
import { backups, askBackup, toJsonSchema } from '../_shared/backups.ts';

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

  if (!Deno.env.get('GEMINI_API_KEY') && !backups().length) return json({ error: 'AI is not configured' }, 503);
  const body = built.body as { contents: GeminiContent[]; generationConfig: Record<string, unknown> };
  // The model the app asked for first, then the others; any one that answers wins
  const order = [built.model, ...MODELS().filter(m => m !== built.model)];
  const got = await geminiFirst(m => ({ ...body, generationConfig: m.startsWith('gemini-2.5') ? { ...body.generationConfig, thinkingConfig: { thinkingBudget: 0 } } : (({ thinkingConfig, ...g }) => g)(body.generationConfig as any) }), order);
  let text = (got?.content?.parts ?? []).filter((p: any) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('');
  // Gemini couldn't answer: text-only requests go to the backups (they can't hear voice notes or see photos)
  const textOnly = body.contents.every(c => c.parts.every(p => typeof p.text === 'string'));
  if (!got && textOnly) {
    const wantsJson = body.generationConfig.responseMimeType === 'application/json';
    const schema = body.generationConfig.responseSchema;
    const system = wantsJson ? `Answer with one JSON object only${schema ? `, matching this JSON Schema:\n${JSON.stringify(toJsonSchema(schema))}` : '.'}` : 'You are a helpful assistant inside Belluh, a journal for couples.';
    for (const b of backups()) {
      const c = await askBackup(b, { system, contents: body.contents, json: wantsJson, temperature: typeof body.generationConfig.temperature === 'number' ? body.generationConfig.temperature as number : 0.7 });
      const t = (c?.parts ?? []).map(p => p.text ?? '').join('').replace(/^```(?:json)?\s*|\s*```$/g, '');
      if (t) { text = t; break; }
    }
  }
  if (!text) return json({ error: 'RESOURCE_EXHAUSTED' }, 429);
  return json({ text });
});
