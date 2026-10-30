// End-to-end test against a local Supabase stand-in: real Postgres + migrations + PostgREST + edge functions.
// Gemini is a scripted stand-in that records every request Belluh sends it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const URL_ = 'http://127.0.0.1:3000';
const SECRET = 'belluh-local-test-secret-0123456789abcdef';
const GEMINI_LOG = process.env.GEMINI_LOG;
const jwt = (role, sub = '', email = '') => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const h = b({ alg: 'HS256', typ: 'JWT' });
  const p = b({ role, ...(sub ? { sub, email } : {}), aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
};
const ANON = jwt('anon');
const as = (sub, email) => createClient(URL_, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${jwt('authenticated', sub, email)}` } },
});
const MAYA = '11111111-1111-1111-1111-111111111111', DAN = '22222222-2222-2222-2222-222222222222', EVE = '33333333-3333-3333-3333-333333333333';
const maya = as(MAYA, 'maya@test.com'), dan = as(DAN, 'dan@test.com'), eve = as(EVE, 'eve@test.com');
const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
test('the app saves the language they read Belluh in; nonsense is refused', async () => {
  assert.equal((await maya.from('agent_settings').upsert({ user_id: MAYA, lang: 'pt-PT' }, { onConflict: 'user_id' })).error, null);
  assert.equal((await maya.from('agent_settings').select('lang').eq('user_id', MAYA).single()).data.lang, 'pt-PT');
  assert.ok((await maya.from('agent_settings').upsert({ user_id: MAYA, lang: 'portuguese please' }, { onConflict: 'user_id' })).error);
  assert.ok((await dan.from('agent_settings').upsert({ user_id: MAYA, lang: 'ja-JP' }, { onConflict: 'user_id' })).error, "Dan can't set Maya's");
  await maya.from('agent_settings').upsert({ user_id: MAYA, lang: 'en-US' }, { onConflict: 'user_id' });
});
