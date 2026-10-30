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
const geminiRequests = () => fs.readFileSync(GEMINI_LOG, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));

const service = createClient(URL_, jwt('service_role'), { auth: { persistSession: false } });
const agent = (c, body) => c.functions.invoke('belluh-agent', { body: { timezone: 'America/New_York', ...body } });

test('goals: both partners see them and tap to add; strangers see nothing and nobody writes directly', async () => {
  const { data: g, error } = await service.from('couple_goals').insert({ created_by: MAYA, partner_id: DAN, kind: 'habit', title: 'Date night', target: 1, period: 'week', period_key: '2020-W01' }).select('*').single();
  assert.equal(error, null);
  const seen = await dan.from('couple_goals').select('id, title').eq('id', g.id);
  assert.equal(seen.data.length, 1, 'Dan sees the goal Maya started');
  const stranger = await eve.from('couple_goals').select('id').eq('id', g.id);
  assert.equal(stranger.data.length, 0, 'Eve does not');
  const direct = await dan.from('couple_goals').update({ progress: 99 }).eq('id', g.id).select('id');
  assert.ok(direct.error || !direct.data?.length, 'no direct writes');
  // A tap from Dan: last week's count starts over, this week is 1
  const r = await agent(dan, { action: 'goal_log', goal_id: g.id, amount: 1 });
  assert.equal(r.data.goal.progress, 1);
  assert.notEqual(r.data.goal.period_key, '2020-W01');
  const half = await agent(dan, { action: 'goal_log', goal_id: g.id, amount: 0.5 });
  assert.ok(half.error, 'half a date night is refused');
  const eveTap = await agent(eve, { action: 'goal_log', goal_id: g.id, amount: 1 });
  assert.ok(eveTap.error, 'Eve cannot touch it');
  const stop = await agent(maya, { action: 'goal_stop', goal_id: g.id });
  assert.equal(stop.data.ok, true);
});

test('ideas: built from what Bella knows, as data the app says in their language', async () => {
  await service.from('couple_goals').insert({ created_by: MAYA, partner_id: DAN, kind: 'save', title: 'Kyoto trip', target: 3000, currency: 'USD' });
  await service.from('agent_memories').insert({ user_id: MAYA, fact: 'Dan wants to see the northern lights' });
  const r = await agent(maya, { action: 'ideas' });
  assert.equal(r.error, null);
  const kinds = r.data.ideas.map(i => i.kind);
  assert.ok(kinds.includes('goal'), JSON.stringify(kinds));
  assert.ok(kinds.includes('wish'));
  assert.ok(r.data.ideas.every(i => typeof i.key === 'string'));
  const danIdeas = await agent(dan, { action: 'ideas' });
  assert.ok(!danIdeas.data.ideas.some(i => i.kind === 'wish' && /northern lights/.test(i.fact)), "Maya's memories stay hers");
});

test('watches: only yours to see and stop', async () => {
  const { data: w } = await service.from('watches').insert({ user_id: MAYA, kind: 'event', what: 'Laufey', until_on: '2099-01-01' }).select('id').single();
  assert.equal((await dan.from('watches').select('id').eq('id', w.id)).data.length, 0);
  assert.equal((await maya.from('watches').select('id').eq('id', w.id)).data.length, 1);
  assert.ok((await agent(dan, { action: 'watch_stop', watch_id: w.id })).error);
  assert.equal((await agent(maya, { action: 'watch_stop', watch_id: w.id })).data.ok, true);
});

test('the hourly check runs watches and expires old ones', async () => {
  const { data: old } = await service.from('watches').insert({ user_id: MAYA, kind: 'event', what: 'Old show', until_on: '2020-01-01' }).select('id').single();
  const r = await fetch(`${URL_}/functions/v1/belluh-nudges?force=daily&user=${MAYA}`, { method: 'POST', headers: { 'x-cron-secret': 'cron-test' } });
  const body = await r.json();
  assert.equal(r.status, 200);
  assert.ok('watches_checked' in body, JSON.stringify(body));
  const { data } = await service.from('watches').select('status').eq('id', old.id).single();
  assert.equal(data.status, 'expired');
});

test('activity: everything Bella did is logged for its owner only, and what she has lined up', async () => {
  // The API suite above ran many tools for Maya; a reminder is lined up too
  await service.from('personal_reminders').insert({ user_id: MAYA, body: 'Call his mom', due_at: new Date(Date.now() + 86400000).toISOString() });
  const r = await agent(maya, { action: 'activity' });
  assert.equal(r.error, null);
  assert.ok(r.data.done.length > 0, 'Maya sees what Bella did');
  assert.ok(r.data.done.every(x => typeof x.action === 'string'));
  assert.ok(r.data.planned.some(p => p.kind === 'reminder' && p.detail === 'Call his mom'));
  assert.ok(!r.data.done.some(x => x.action === 'draft_note_to_partner' && x.detail), 'a note never shows its words');
  assert.equal((await dan.from('agent_activity').select('id').eq('user_id', MAYA)).data.length, 0, "Dan can't read Maya's log");
  const direct = await maya.from('agent_activity').insert({ user_id: MAYA, action: 'fake' });
  assert.ok(direct.error, 'nobody writes to the log directly');
});

test('proactivity: the person sets it, and quiet keeps Bella from reaching out on her own', async () => {
  const up = await maya.from('agent_settings').upsert({ user_id: MAYA, proactivity: 'quiet', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  assert.equal(up.error, null);
  assert.equal((await agent(maya, { action: 'activity' })).data.proactivity, 'quiet');
  const bad = await maya.from('agent_settings').upsert({ user_id: MAYA, proactivity: 'loud' }, { onConflict: 'user_id' });
  assert.ok(bad.error);
  const before = (await service.from('agent_messages').select('id', { count: 'exact', head: true }).eq('user_id', MAYA).in('meta->>kind', ['offer', 'plan_nudge', 'after_plan'])).count;
  await fetch(`${URL_}/functions/v1/belluh-nudges?force=daily&user=${MAYA}`, { method: 'POST', headers: { 'x-cron-secret': 'cron-test' } });
  const after = (await service.from('agent_messages').select('id', { count: 'exact', head: true }).eq('user_id', MAYA).in('meta->>kind', ['offer', 'plan_nudge', 'after_plan'])).count;
  assert.equal(after, before, 'nothing Bella thought of herself while quiet');
  await maya.from('agent_settings').upsert({ user_id: MAYA, proactivity: 'normal' }, { onConflict: 'user_id' });
});

test('a goal with an action plan: either partner ticks a step', async () => {
  const { data: g } = await service.from('couple_goals').insert({ created_by: MAYA, partner_id: DAN, kind: 'save', title: 'Lisbon', target: 2000, currency: 'USD', steps: [{ text: 'Pick a week', done: false }, { text: 'Book flights', done: false }] }).select('id').single();
  const r = await agent(dan, { action: 'goal_step', goal_id: g.id, index: 0, done: true });
  assert.deepEqual(r.data.goal.steps.map(s => s.done), [true, false]);
  assert.ok((await agent(dan, { action: 'goal_step', goal_id: g.id, index: 7, done: true })).error);
  assert.ok((await agent(eve, { action: 'goal_step', goal_id: g.id, index: 1, done: true })).error);
});
