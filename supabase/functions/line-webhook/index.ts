// LINE webhook: Belluh's text line on LINE, the same as WhatsApp, SMS and Telegram (same Bella, thread, memory and tools).
// Deploy with: supabase functions deploy line-webhook --no-verify-jwt
// (LINE can't send a Supabase JWT; every request is checked against x-line-signature, signed with LINE_CHANNEL_SECRET.)

import { parseLineEvents, validLineSignature, rememberReplyToken } from '../_shared/line.ts';
import { handleInbound } from '../_shared/textline.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();
  if (raw.length > 100000) return new Response('Too large', { status: 413 });
  if (!(await validLineSignature(Deno.env.get('LINE_CHANNEL_SECRET') ?? '', raw, req.headers.get('x-line-signature')))) {
    return new Response('Forbidden', { status: 403 });
  }
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new Response('ok'); }
  // LINE's "Verify" button sends an empty events list: answer 200
  const work = Promise.all(parseLineEvents(body).map(m => {
    rememberReplyToken(m.userId, m.replyToken);
    return handleInbound({ channel: 'line', id: `line-${m.eventId}`, phone: `line:${m.userId}`, sentAt: new Date(m.at).toISOString(), text: m.text, kind: m.kind })
      .catch(e => console.error('line failed', m.eventId, e));
  }));
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(work);
  else await work;
  return new Response('ok');
});
