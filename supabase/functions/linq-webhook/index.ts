// iMessage webhook (Linq): texts to Belluh's iPhone number land here and go to the same Belluh as the app.
// Deploy with: supabase functions deploy linq-webhook --no-verify-jwt
// (Linq can't send a Supabase JWT; every delivery is checked against Linq's signature instead.)
// Subscribe in Linq to message.received at this URL with ?version=2026-02-03, and set LINQ_WEBHOOK_SECRET.

import { verifyLinq, parseLinqEvent } from '../_shared/linq.ts';
import { handleInbound } from '../_shared/textline.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();
  if (raw.length > 100_000) return new Response('Too large', { status: 413 });
  const ok = await verifyLinq(raw, {
    id: req.headers.get('webhook-id'), timestamp: req.headers.get('webhook-timestamp'), signature: req.headers.get('webhook-signature'),
  }, Deno.env.get('LINQ_WEBHOOK_SECRET') ?? '');
  if (!ok) return new Response('Bad signature', { status: 401 });

  let event: unknown;
  try { event = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }
  const m = parseLinqEvent(event);
  if (!m) return new Response('ok');

  const work = handleInbound({ channel: 'imessage', id: `linq:${m.id}`, phone: m.from, sentAt: new Date().toISOString(), text: m.text, kind: m.kind })
    .catch(e => console.error('imessage failed', m.id, e));
  // Linq wants an answer within 10 seconds; the reply goes out through the API
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(work);
  else await work;
  return new Response('ok');
});
