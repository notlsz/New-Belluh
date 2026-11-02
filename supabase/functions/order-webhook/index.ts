// Shops tell Belluh when an order Bella got ready is placed (UCP's order capability; the webhook URL is in Belluh's
// agent profile at /ucp/agent-profile.json). Every delivery is signed by the shop (RFC 9421, ES256); Belluh checks the
// signature with the shop's own published key, takes each event once, and only confirms a checkout Bella opened at
// that same shop. Then Bella marks it ordered with the order number and delivery day and tells them herself.
// Deploy with: supabase functions deploy order-webhook --no-verify-jwt   (shops can't send a Supabase JWT)

import { verifyOrderWebhook } from '../_shared/ucpsig.ts';
import { parseOrder } from '../_shared/confirms.ts';
import { confirmOrder } from '../_shared/agentcore.ts';
import { db } from '../_shared/agentdb.ts';

const PATH = '/functions/v1/order-webhook';

async function fetchProfile(url: string): Promise<unknown> {
  const r = await fetch(url, { headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`profile ${r.status}`);
  const text = await r.text();
  if (text.length > 200_000) throw new Error('profile too large');
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();
  if (raw.length > 500_000) return new Response('Too large', { status: 413 });
  const h = (k: string) => req.headers.get(k);
  const authority = new URL(Deno.env.get('SUPABASE_URL') ?? req.url).host;
  const v = await verifyOrderWebhook({
    method: req.method, authority, path: PATH, body: raw,
    headers: { 'ucp-agent': h('ucp-agent'), 'content-digest': h('content-digest'), 'content-type': h('content-type'), 'signature-input': h('signature-input'), signature: h('signature'), 'webhook-id': h('webhook-id'), 'webhook-timestamp': h('webhook-timestamp') },
  }, fetchProfile);
  if (!v.ok) { console.error('order webhook refused', v.why); return new Response('Unauthorized', { status: 401 }); }

  // Shops retry: each event once
  const id = (h('webhook-id') ?? '').slice(0, 200);
  if (id) {
    const { error } = await db.from('order_events').insert({ webhook_id: id });
    if (error) return Response.json({ ok: true, duplicate: true });
  }
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }
  const conf = parseOrder(body);
  if (!conf) return Response.json({ ok: true });
  try {
    return Response.json({ ok: true, result: await confirmOrder(conf, { profile: v.profile }) });
  } catch (e) {
    console.error('order webhook failed', conf.orderId, e);
    if (id) await db.from('order_events').delete().eq('webhook_id', id);   // let the shop's retry try again
    return new Response('Error', { status: 500 });
  }
});
