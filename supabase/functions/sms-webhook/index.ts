// SMS webhook (Twilio): the same date line as WhatsApp, for people who'd rather just text.
// Deploy with: supabase functions deploy sms-webhook --no-verify-jwt
// (Twilio can't send a Supabase JWT; every POST is checked against Twilio's signature instead.)

import { verifyTwilioSignature, smsE164 } from '../_shared/sms.ts';
import { handleInbound } from '../_shared/textline.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

// Twilio signs the exact public URL it called
const PUBLIC_URL = Deno.env.get('SMS_WEBHOOK_URL') ?? `${Deno.env.get('SUPABASE_URL')}/functions/v1/sms-webhook`;
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();
  if (raw.length > 20000) return new Response('Too large', { status: 413 });
  const params = Object.fromEntries(new URLSearchParams(raw));
  if (!(await verifyTwilioSignature(PUBLIC_URL, params, req.headers.get('x-twilio-signature'), Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''))) {
    return new Response('Bad signature', { status: 401 });
  }
  const phone = smsE164(params.From ?? '');
  if (!phone || !params.MessageSid) return new Response(EMPTY_TWIML, { headers: { 'Content-Type': 'text/xml' } });

  const work = handleInbound({
    channel: 'sms', id: params.MessageSid, phone, sentAt: new Date().toISOString(),
    text: String(params.Body ?? '').slice(0, 2000), kind: Number(params.NumMedia ?? 0) > 0 ? 'media' : 'text',
  }).catch(e => console.error('sms failed', params.MessageSid, e));
  // Answer Twilio right away and finish in the background; replies go out through the API
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(work);
  else await work;
  return new Response(EMPTY_TWIML, { headers: { 'Content-Type': 'text/xml' } });
});
