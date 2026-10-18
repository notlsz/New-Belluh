// Belluh's restaurant calls report back here (Vapi end-of-call-report): booked → it's in their calendar with a
// reminder and their partner hears; not booked → Belluh says why and offers another spot.
// Deploy with: supabase functions deploy vapi-webhook --no-verify-jwt
// (Vapi can't send a Supabase JWT; every delivery must carry the secret Belluh gave Vapi when it placed the call.)

import { parseCallReport, vapiSecret, sameSecret } from '../_shared/vapi.ts';
import { finishCall } from '../_shared/agentcore.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!Deno.env.get('VAPI_API_KEY') || !sameSecret(req.headers.get('x-vapi-secret'), await vapiSecret())) return new Response('Unauthorized', { status: 401 });
  const raw = await req.text();
  if (raw.length > 500_000) return new Response('Too large', { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }
  const outcome = parseCallReport(body);
  if (!outcome) return Response.json({ ok: true });
  try {
    return Response.json({ ok: true, result: await finishCall(outcome) });
  } catch (e) {
    console.error('call report failed', outcome.callId, e);
    return new Response('Error', { status: 500 });
  }
});
