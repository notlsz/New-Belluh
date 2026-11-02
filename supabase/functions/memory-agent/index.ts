// Belluh Memory's server agent, after Rollup's query and profile. Stateless: the phone sends the question (or schema)
// and every round so far (the model's parts and the TEXT results of the tools it ran on the phone); this answers with
// the next tool calls or the answer, streamed as NDJSON lines. Photos, the index and device ids never come here.
// Nothing is stored or logged: no question, schema, tool result or answer. Only step and token counts are kept
// (memory_usage), for the rate limit and the monthly budget.
// Deploy: supabase functions deploy memory-agent --no-verify-jwt (the caller's sign-in is checked here)
//
// POST { kind: 'query', question, lang?, today?, consent: true, rounds?: Round[], ticket? }
//      { kind: 'profile', schema, lang?, today?, consent: true, rounds?: Round[], ticket? }
//   Round = { parts: Part[] (as returned by the last 'tools' line), results: { name, text }[] (one per call, in order) }
// Lines: { type: 'partial', text } | { type: 'tools', calls, parts, ticket } | { type: 'answer', text, cited, declined }
//        | { type: 'profile', json, evidence, refused } | { type: 'error', code, message, retryAfter? }

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { serverKey } from '../_shared/keys.ts';
import { handleMemory } from '../_shared/memoryhandler.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });

Deno.serve(req => handleMemory(req, {
  userId: async token => (await db.auth.getUser(token)).data.user?.id ?? null,
  rpc: (name, args) => db.rpc(name, args) as unknown as Promise<{ data: any; error: unknown }>,
  secret: serverKey(),
  stepsPer5Min: Number(Deno.env.get('MEMORY_STEPS_PER_5_MIN') ?? 300),
  monthlyTokens: Number(Deno.env.get('MEMORY_MONTHLY_TOKENS') ?? 2_000_000),
}));
