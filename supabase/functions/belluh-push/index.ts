// Push setup: hands out Belluh's public VAPID key (web) and sends a test notification to the caller's browsers and
// phones. The iOS and Android apps register their APNs or FCM token with the register_native_push RPC (RLS-checked).
// Deploy with: supabase functions deploy belluh-push   (checks the sign-in itself)
//
// POST body: { action: 'key' }    → { publicKey }
//            { action: 'test' }   → sends "Notifications are on" to the caller's browsers and phones
//            { action: 'status' } → { web: true, ios: bool, android: bool } which kinds the server can send

import { db } from '../_shared/agentdb.ts';
import { vapidKeys } from '../_shared/pushkeys.ts';
import { pushTo } from '../_shared/notify.ts';
import { apnsConfig, fcmAccount } from '../_shared/nativepush.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Bad JSON' }, 400); }
  switch (body.action) {
    case 'key': return json({ publicKey: (await vapidKeys()).publicKey });
    case 'test': return json({ sent: await pushTo(user.id, { title: 'Belluh', body: "Notifications are on. I'll only message you when it matters.", url: '/', tag: 'test' }) });
    case 'status': return json({ web: true, ios: !!apnsConfig(), android: !!fcmAccount() });
    default: return json({ error: 'Unknown action' }, 400);
  }
});
