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

let token;

test('1. strangers and logged-out visitors see nothing', async () => {
  const { data: profs } = await eve.from('profiles').select('id, email');
  assert.deepEqual(profs.map(p => p.id), [EVE], 'Eve sees only her own profile, no one else\'s email');
  const { data: a, error: ae } = await anon.from('profiles').select('id');
  assert.ok(ae || a.length === 0, 'logged-out visitors read no profiles');
  const { data: found } = await eve.rpc('find_user_by_email', { p_email: '%' });
  assert.equal(found, null, 'wildcard email search finds nobody');
  const { data: exact } = await eve.rpc('find_user_by_email', { p_email: ' DAN@test.com ' });
  assert.equal(exact, DAN, 'exact email lookup works for inviting');
});

test('2. invite link: forging is blocked, the real flow asks then connects', async () => {
  const { error: forge } = await eve.from('partner_connections').insert({ user_id: MAYA, partner_id: EVE, status: 'pending' });
  assert.ok(forge, 'Eve cannot create a request on Maya\'s behalf');
  const { error: forge2 } = await eve.from('partner_connections').insert({ user_id: EVE, partner_id: MAYA, status: 'connected' });
  assert.ok(forge2, 'Eve cannot create an accepted connection');

  ({ data: token } = await maya.rpc('create_partner_invite'));
  assert.ok(token && token.length >= 20);
  const { data: name } = await dan.rpc('preview_partner_invite', { p_token: token });
  assert.equal(name, 'Maya', 'Dan is asked "Connect with Maya?"');
  const { data: inviter, error } = await dan.rpc('accept_partner_invite', { p_token: token });
  assert.ifError(error); assert.equal(inviter, MAYA);
  const { error: reuse } = await eve.rpc('accept_partner_invite', { p_token: token });
  assert.ok(reuse, 'a used link cannot be reused by someone else');
  const { data: conns } = await maya.from('partner_connections').select('status');
  assert.deepEqual(conns.map(c => c.status), ['connected']);
  const { data: profs } = await dan.from('profiles').select('full_name').order('full_name');
  assert.deepEqual(profs.map(p => p.full_name), ['Dan Reyes', 'Maya Chen'], 'partners see each other, not Eve');
});

test('3. shared vs private entries, likes and edits', async () => {
  const rows = [
    [maya, MAYA, 'Maya shared: Dan went quiet at dinner again.', true],
    [maya, MAYA, 'MAYA PRIVATE: nervous about meeting his parents.', false],
    [dan, DAN, 'Dan shared: brutal day, said nothing at dinner.', true],
    [dan, DAN, 'DAN PRIVATE: thinking about the job offer in Denver.', false],
  ];
  for (const [c, uid, content, shared] of rows) {
    const { error } = await c.from('journal_entries').insert({ user_id: uid, content, is_shared: shared, type: 'Freeform', tags: ['circle:c1'] });
    assert.ifError(error);
  }
  const { error: spoof } = await eve.from('journal_entries').insert({ user_id: MAYA, content: 'fake', is_shared: true });
  assert.ok(spoof, 'nobody can write as someone else');

  const { data: danSees } = await dan.from('journal_entries').select('content').eq('user_id', MAYA);
  assert.deepEqual(danSees.map(r => r.content), ['Maya shared: Dan went quiet at dinner again.']);
  const { data: eveSees } = await eve.from('journal_entries').select('id');
  assert.equal(eveSees.length, 0);

  const { data: liked, error: likeErr } = await dan.from('journal_entries').update({ is_favorite: true }).eq('user_id', MAYA).select('id');
  assert.ifError(likeErr); assert.equal(liked.length, 1, 'Dan can heart Maya\'s shared entry');
  const { error: editErr } = await dan.from('journal_entries').update({ content: 'changed' }).eq('user_id', MAYA);
  assert.ok(editErr, 'Dan cannot change what Maya wrote');
  const { data: del } = await dan.from('journal_entries').delete().eq('user_id', MAYA).select('id');
  assert.equal(del.length, 0, 'Dan cannot delete Maya\'s entries');
});

test('4. Belluh agent: memory, dates, note drafting and delivery', async () => {
  const call = (c, body) => c.functions.invoke('belluh-agent', { body: { timezone: 'America/New_York', ...body } });

  const { data: h0, error: e0 } = await call(maya, { action: 'history' });
  assert.ifError(e0); assert.equal(h0.partner_name, 'Dan'); assert.equal(h0.messages.length, 0);

  const { data: r1 } = await call(maya, { action: 'chat', message: 'Please remember that Dan needs time after work.' });
  assert.equal(r1.messages.at(-1).role, 'belluh');
  const { data: mem } = await maya.from('agent_memories').select('fact');
  assert.deepEqual(mem.map(m => m.fact), ['Dan needs ten minutes to himself after work.']);
  const { data: danMem } = await dan.from('agent_memories').select('fact');
  assert.equal(danMem.length, 0, 'Dan cannot read Maya\'s memories');

  await call(maya, { action: 'chat', message: "Dan's birthday is October 20" });
  const { data: occ } = await maya.from('occasions').select('label, month, day');
  assert.deepEqual(occ, [{ label: "Dan's birthday", month: 10, day: 20 }]);

  const { data: r2 } = await call(maya, { action: 'chat', message: 'Help me tell Dan I miss him' });
  const draft = r2.messages.find(m => m.role === 'note_draft');
  assert.ok(draft, 'a draft note is created, not sent');
  assert.equal(draft.meta.to_name, 'Dan');
  const { data: before } = await call(dan, { action: 'history' });
  assert.equal(before.messages.length, 0, 'nothing reaches Dan before Maya approves');

  const { data: sent, error: sendErr } = await call(maya, { action: 'send_note', draft_id: draft.id, text: 'I miss you. Saturday coffee, phones away? ❤️' });
  assert.ifError(sendErr); assert.equal(sent.ok, true);
  const { error: again } = await call(maya, { action: 'send_note', draft_id: draft.id });
  assert.ok(again, 'the same note cannot be sent twice');

  const { data: danH } = await call(dan, { action: 'history' });
  const note = danH.messages.find(m => m.role === 'partner_note');
  assert.equal(note.body, 'I miss you. Saturday coffee, phones away? ❤️');
  assert.equal(note.meta.from_name, 'Maya');
  const { count } = await dan.from('partner_notes').select('id', { count: 'exact', head: true }).is('read_at', null);
  assert.equal(count, 1, 'Dan has one unread note');
  const { data: eveNotes } = await eve.from('partner_notes').select('id');
  assert.equal(eveNotes.length, 0);

  const { error: eveSend } = await call(eve, { action: 'send_note', draft_id: draft.id });
  assert.ok(eveSend, 'Eve cannot send Maya\'s drafts');
});

test('5. a vague "forget" cannot wipe memories', async () => {
  const call = (body) => maya.functions.invoke('belluh-agent', { body });
  await call({ action: 'chat', message: 'forget everything with the letter e' });
  const { data: mem } = await maya.from('agent_memories').select('fact');
  assert.equal(mem.length, 1, 'the one-letter forget request was refused');
});

test('6. Belluh replies after an entry, only for the author', async () => {
  const { data: mine } = await maya.from('journal_entries').select('id').eq('user_id', MAYA).limit(1);
  const { data: r } = await maya.functions.invoke('belluh-agent', { body: { action: 'react', entry_id: mine[0].id } });
  assert.match(r.message.body, /quiet dinner/);
  const { data: theirs } = await eve.functions.invoke('belluh-agent', { body: { action: 'react', entry_id: mine[0].id } });
  assert.equal(theirs.message, null, 'nobody else can trigger replies on Maya\'s entries');
});

test("7. privacy end to end: Dan's private entry never reaches the model in Maya's conversations", () => {
  const reqs = geminiRequests().filter(r => r.url.includes('generateContent'));
  assert.ok(reqs.length >= 5);
  const all = JSON.stringify(reqs);
  assert.ok(!all.includes('DAN PRIVATE'), "Dan's private entry was never sent");
  assert.ok(all.includes('Dan shared: brutal day'), "Dan's shared entry was used");
  assert.ok(all.includes('MAYA PRIVATE') && all.includes('[private: only you can see this]'), "Maya's own private entry is labelled for Belluh");
  assert.ok(reqs.every(r => r.key === 'test-key'), 'the key is sent from the server only');
});

test('8. app AI features run through the server proxy', async () => {
  const { data, error } = await maya.functions.invoke('gemini-proxy', { body: { model: 'gemini-3-flash-preview', contents: 'Summarize: we had coffee.' } });
  assert.ifError(error); assert.equal(data.text, 'Plain reply from the model.');
  const { error: bad } = await maya.functions.invoke('gemini-proxy', { body: { contents: 42 } });
  assert.ok(bad, 'malformed requests are rejected');
  const r = await fetch(`${URL_}/functions/v1/gemini-proxy`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"contents":"hi"}' });
  assert.equal(r.status, 401, 'no login, no AI');
});
