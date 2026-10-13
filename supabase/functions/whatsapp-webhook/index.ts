// WhatsApp webhook: users text Belluh their dates; Belluh saves them and confirms.
// Deploy with: supabase functions deploy whatsapp-webhook --no-verify-jwt
// (Meta can't send a Supabase JWT; every POST is checked against the app secret instead.)

import { verifyMetaSignature, toE164 } from '../_shared/occasions.ts';
import { handleInbound } from '../_shared/textline.ts';
import { sameSecret } from '../_shared/secret.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

function handleMessage(msg: Record<string, any>) {
  return handleInbound({
    channel: 'whatsapp', id: String(msg.id), phone: toE164(msg.from),
    sentAt: new Date(Number(msg.timestamp) * 1000 || Date.now()).toISOString(),
    text: msg.type === 'text' ? String(msg.text?.body ?? '') : '', kind: String(msg.type ?? 'unknown'),
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Meta's one-time verification handshake when you register the webhook
  if (req.method === 'GET') {
    const ok = url.searchParams.get('hub.mode') === 'subscribe'
      && await sameSecret(url.searchParams.get('hub.verify_token'), Deno.env.get('WHATSAPP_VERIFY_TOKEN'));
    return ok ? new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 }) : new Response('Forbidden', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const raw = await req.text();
  if (!(await verifyMetaSignature(raw, req.headers.get('x-hub-signature-256'), Deno.env.get('WHATSAPP_APP_SECRET') ?? ''))) {
    return new Response('Bad signature', { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  const work = (async () => {
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const msg of change?.value?.messages ?? []) {
          try { await handleMessage(msg); }
          catch (e) { console.error('message failed', msg?.id, e); }
        }
      }
    }
  })();
  // Answer Meta right away (it retries slow webhooks) and finish the work in the background
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(work);
  else await work;
  return new Response('ok', { status: 200 });
});
