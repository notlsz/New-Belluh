// Saves a gift someone gives from the landing page (a year of Duo for a couple). Public: givers don't need an
// account. Validates everything, allows a few gifts per visitor per ten minutes, and keeps no raw IP.
// Deploy with: supabase functions deploy belluh-gift --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { serverKey } from '../_shared/keys.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });
const ORIGINS = ['https://belluh.com', 'https://www.belluh.com', 'http://localhost:5173', 'http://localhost:4173'];
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && (ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) ? origin : ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
  'Vary': 'Origin',
});
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const DELIVERY: Record<string, string> = { email: 'email', them: 'card_to_them', me: 'card_to_giver' };

export async function hashIp(ip: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`belluh-gift:${ip}`));
  return Array.from(new Uint8Array(h).slice(0, 12), b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get('origin')), 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  let b: any;
  try { b = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers }); }

  const gift = {
    partner_one: text(b?.partnerOne, 60), partner_two: text(b?.partnerTwo, 60),
    recipient_email: text(b?.recipientEmail, 200).toLowerCase(),
    giver_name: text(b?.giverName, 60), giver_email: text(b?.giverEmail, 200).toLowerCase(),
    occasion: text(b?.occasion, 40), note: text(b?.note, 200),
    delivery: DELIVERY[b?.delivery as string] ?? '',
    mailing_address: text(b?.address, 240) || null,
    deliver_on: typeof b?.deliverOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.deliverOn) ? b.deliverOn : null,
  };
  const ok = gift.partner_one && gift.partner_two && gift.giver_name && gift.occasion && gift.note && gift.delivery
    && isEmail(gift.recipient_email) && isEmail(gift.giver_email)
    && (gift.delivery === 'email' || (gift.mailing_address?.length ?? 0) >= 8);
  if (!ok) return new Response(JSON.stringify({ error: 'Missing details' }), { status: 400, headers });
  if (gift.delivery === 'email') gift.mailing_address = null;

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const ip_hash = await hashIp(ip);
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await db.from('gift_orders').select('id', { count: 'exact', head: true }).eq('ip_hash', ip_hash).gte('created_at', since);
  if ((count ?? 0) >= 5) return new Response(JSON.stringify({ error: 'Too many gifts at once. Try again in a few minutes.' }), { status: 429, headers });

  const { data, error } = await db.from('gift_orders').insert({ ...gift, ip_hash }).select('id').single();
  if (error) { console.error('gift insert failed', error.message); return new Response(JSON.stringify({ error: 'Could not save the gift' }), { status: 500, headers }); }
  return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200, headers });
});
