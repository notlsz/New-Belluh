// Clarity: the private page for one partner (see _shared/clarity.ts). Deploy with:
//   supabase functions deploy belluh-clarity --no-verify-jwt   (it checks the sign-in itself)
//
// POST { action: 'status' | 'on' | 'off' | 'view' | 'open' | 'answer' | 'forget' | 'talk', ... }
//
// Reads only the signed-in person's own writing: their journal entries and their own messages to Bella. Never the
// partner's entries or private notes. Keeps only the person's answers and their talk with Bella here (owner-only RLS),
// and "off" deletes both. Nothing is sent by text, shared, or added to Bella's memory or the couple's context.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { serverKey } from '../_shared/keys.ts';
import { handleClarity, type ClarityStore } from '../_shared/clarityapi.ts';
import { countryOf } from '../_shared/region.ts';
import { geminiFirst, thinkingFor } from '../_shared/gemini.ts';
import type { ClarityItem } from '../_shared/clarity.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } });

const entry = (r: any): ClarityItem => ({ kind: 'entry', id: r.id, owner: r.user_id, text: [r.title, r.content].filter(Boolean).join('\n'), at: r.created_at });
const chat = (r: any): ClarityItem => ({ kind: 'chat', id: r.id, owner: r.user_id, text: r.body ?? '', at: r.created_at });

const store: ClarityStore = {
  async isOn(uid) {
    const { data } = await db.from('clarity_settings').select('user_id').eq('user_id', uid).maybeSingle();
    return !!data;
  },
  async turnOn(uid) {
    await db.from('clarity_settings').upsert({ user_id: uid, turned_on_at: new Date().toISOString() });
  },
  async wipe(uid) {
    await db.from('clarity_talk').delete().eq('user_id', uid);
    await db.from('clarity_reflections').delete().eq('user_id', uid);
    await db.from('clarity_settings').delete().eq('user_id', uid);
  },
  async writing(uid, since) {
    const [{ data: es }, { data: ms }] = await Promise.all([
      db.from('journal_entries').select('id, user_id, title, content, created_at').eq('user_id', uid).gte('created_at', since).order('created_at', { ascending: false }).limit(600),
      db.from('agent_messages').select('id, user_id, body, created_at').eq('user_id', uid).eq('role', 'user').gte('created_at', since).order('created_at', { ascending: false }).limit(600),
    ]);
    return [...(es ?? []).map(entry), ...(ms ?? []).map(chat)];
  },
  async item(uid, kind, id) {
    if (kind === 'entry') {
      const { data } = await db.from('journal_entries').select('id, user_id, title, content, created_at').eq('id', id).eq('user_id', uid).maybeSingle();
      return data ? entry(data) : null;
    }
    const { data } = await db.from('agent_messages').select('id, user_id, body, created_at').eq('id', id).eq('user_id', uid).eq('role', 'user').maybeSingle();
    return data ? chat(data) : null;
  },
  async reflections(uid) {
    const { data } = await db.from('clarity_reflections').select('id, key, text, created_at').eq('user_id', uid).order('created_at').limit(200);
    return data ?? [];
  },
  async addReflection(uid, key, text) {
    const { data, error } = await db.from('clarity_reflections').insert({ user_id: uid, key, text }).select('id, key, text, created_at').single();
    if (error) throw error;
    return data;
  },
  async deleteReflection(uid, id) {
    await db.from('clarity_reflections').delete().eq('id', id).eq('user_id', uid);
  },
  async talk(uid) {
    const { data } = await db.from('clarity_talk').select('id, role, body, created_at').eq('user_id', uid).order('created_at').limit(200);
    return data ?? [];
  },
  async addTalk(uid, role, body) {
    const { data, error } = await db.from('clarity_talk').insert({ user_id: uid, role, body }).select('id, role, body, created_at').single();
    if (error) throw error;
    return data;
  },
  async profile(uid) {
    const [{ data: p }, { data: s }] = await Promise.all([
      db.from('profiles').select('full_name').eq('id', uid).maybeSingle(),
      db.from('agent_settings').select('country, timezone').eq('user_id', uid).maybeSingle(),
    ]);
    return { name: String(p?.full_name ?? '').trim().split(/\s+/)[0] || 'there', country: countryOf(s?.country, s?.timezone ?? 'UTC') };
  },
};

const model = async (system: string, turns: { role: 'user' | 'model'; text: string }[]) => {
  const r = await geminiFirst(m => ({
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map(t => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: { maxOutputTokens: 1024, ...thinkingFor(m) },
  }));
  return r?.content?.parts?.map(p => p.text ?? '').join('').trim() || null;
};

// Talking to Bella here: at most 30 messages an hour per person, counted in memory
const hits = new Map<string, number[]>();
function limited(uid: string): boolean {
  const now = Date.now(), list = (hits.get(uid) ?? []).filter(t => now - t < 3600_000);
  if (list.length >= 30) return true;
  list.push(now); hits.set(uid, list);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);
  let body: any; try { body = await req.json(); } catch { return json({ error: 'Bad JSON' }, 400); }
  if (body?.action === 'talk' && limited(user.id)) return json({ error: 'Let\'s pause for a bit. Try again soon.' }, 429);
  try {
    const out = await handleClarity(store, user.id, body, model);
    return json(out.body, out.status);
  } catch (e) {
    console.error('clarity failed', (e as Error)?.message);
    return json({ error: 'Something went wrong' }, 500);
  }
});
