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

// ---------- weekly loop ----------
const SERVICE = jwt('service_role');
const service = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const runWeekly = async (force, user) => {
  const r = await fetch(`${URL_}/functions/v1/belluh-weekly?force=${force}${user ? `&user=${user}` : ''}`, { method: 'POST', headers: { 'x-cron-secret': 'cron-test' } });
  return { status: r.status, body: r.status === 200 ? await r.json() : null };
};
const agent = (c, body) => c.functions.invoke('belluh-agent', { body: { timezone: 'America/New_York', ...body } });
const schemaReqs = (prop) => geminiRequests().filter(r => r.body?.generationConfig?.responseSchema?.properties?.[prop]);

test('9. Sunday: one shared thing to try, a private insight each, posted once', async () => {
  const bad = await fetch(`${URL_}/functions/v1/belluh-weekly?force=weekly`, { method: 'POST' });
  assert.equal(bad.status, 403, 'the job only runs with the cron secret');

  const { body } = await runWeekly('weekly');
  assert.equal(body.weekly_sent, 2, 'Maya and Dan each got their Sunday message');
  const again = await runWeekly('weekly');
  assert.equal(again.body.weekly_already, 2, 'running twice never posts twice');

  const { data: mh } = await agent(maya, { action: 'history' });
  const { data: dh } = await agent(dan, { action: 'history' });
  const mw = mh.messages.find(m => m.meta?.kind === 'weekly');
  const dw = dh.messages.find(m => m.meta?.kind === 'weekly');
  assert.match(mw.body, /Dinner came up/);
  assert.equal(mw.meta.action_id, dw.meta.action_id, 'they share one action');
  assert.equal(mh.week.action, 'Take a twenty-minute walk after dinner, phones at home.');
  assert.equal(mh.week.partner_name, 'Dan');
  const { data: eveSees } = await eve.from('weekly_actions').select('id');
  assert.equal(eveSees.length, 0, 'nobody else can see it');
  const { error: forge } = await maya.from('weekly_actions').insert({ user_a: MAYA, user_b: DAN, week_start: '2026-01-04', action: 'fake' });
  assert.ok(forge, 'only Belluh writes actions');
});

test('10. privacy: the shared action uses shared entries only; no request mixes both private journals', () => {
  const action = JSON.stringify(schemaReqs('action'));
  assert.equal(schemaReqs('action').length, 1, 'the couple\'s action was written once');
  assert.ok(!action.includes('PRIVATE'), 'no private entry from either person');
  assert.ok(action.includes('Dan shared: brutal day') && action.includes('Maya shared'));
  const insights = schemaReqs('insight').map(r => JSON.stringify(r));
  assert.equal(insights.length, 2);
  assert.ok(insights.every(t => !(t.includes('MAYA PRIVATE') && t.includes('DAN PRIVATE'))));
  assert.ok(insights.some(t => t.includes('MAYA PRIVATE')) && insights.some(t => t.includes('DAN PRIVATE')), 'each insight is private to its reader');
});

test('11. one-tap check-in, visible to the partner, and only yours to change', async () => {
  const { data: h } = await agent(maya, { action: 'history' });
  const id = h.week.id;
  const { data: r, error } = await agent(maya, { action: 'checkin', action_id: id, status: 'done' });
  assert.ifError(error);
  assert.equal(r.week.mine, 'done'); assert.equal(r.week.partner, null);
  assert.match(r.messages[0].body, /build on it next Sunday/);
  const { data: r2 } = await agent(maya, { action: 'checkin', action_id: id, status: 'done' });
  assert.equal(r2.messages.length, 0, 'tapping twice does not repeat Belluh');

  const { data: dv } = await agent(dan, { action: 'history' });
  assert.equal(dv.week.partner, 'done', 'Dan sees that Maya did it');
  const { error: eveTap } = await agent(eve, { action: 'checkin', action_id: id, status: 'skipped' });
  assert.ok(eveTap, 'Eve cannot check in on their action');
  const { error: eveInsert } = await eve.from('weekly_checkins').insert({ action_id: id, user_id: EVE, status: 'done' });
  assert.ok(eveInsert);
  const { data: changed } = await dan.from('weekly_checkins').update({ status: 'skipped' }).eq('user_id', MAYA).select('user_id');
  assert.equal(changed.length, 0, 'Dan cannot change Maya\'s answer');
  const { error: badStatus } = await agent(maya, { action: 'checkin', action_id: id, status: 'maybe' });
  assert.ok(badStatus);
});

test('11b. the app saves your time zone with no setup, and only yours', async () => {
  const { error } = await eve.from('agent_settings').upsert({ user_id: EVE, timezone: 'Europe/Paris' }, { onConflict: 'user_id' });
  assert.ifError(error);
  const { error: other } = await eve.from('agent_settings').upsert({ user_id: MAYA, timezone: 'Asia/Tokyo' }, { onConflict: 'user_id' });
  assert.ok(other, 'Eve cannot change Maya\'s settings');
  const { data } = await maya.from('agent_settings').select('timezone');
  assert.deepEqual(data, [{ timezone: 'America/New_York' }]);
});

test('12. Wednesday: only the person who has not answered gets a check-in', async () => {
  const { body } = await runWeekly('checkin');
  assert.equal(body.checkin_answered, 1, 'Maya already answered');
  assert.equal(body.checkin_sent, 1, 'Dan is asked');
  const { data: dh } = await agent(dan, { action: 'history' });
  const c = dh.messages.find(m => m.meta?.kind === 'checkin');
  assert.match(c.body, /did you and Maya get to try this\? "Take a twenty-minute walk/);
  assert.equal((await runWeekly('checkin')).body.checkin_already, 1, 'and only once');
  await agent(dan, { action: 'checkin', action_id: dh.week.id, status: 'skipped' });
});

test('13. next Sunday builds on what happened', async () => {
  // Move this week into the past, as if a week had gone by
  const { data: h } = await agent(maya, { action: 'history' });
  const prev = new Date(`${h.week.week_start}T00:00:00Z`); prev.setUTCDate(prev.getUTCDate() - 7);
  const { error } = await service.from('weekly_actions').update({ week_start: prev.toISOString().slice(0, 10) }).eq('id', h.week.id);
  assert.ifError(error);
  await service.from('agent_messages').delete().in('meta->>kind', ['weekly', 'checkin']);

  const { body } = await runWeekly('weekly');
  assert.equal(body.weekly_sent, 2);
  assert.equal(body.weekly_inactive, 1, 'Eve has not written lately, so Belluh stays quiet');
  const latest = JSON.stringify(schemaReqs('action').at(-1));
  assert.match(latest, /Last week's thing to try was \\"Take a twenty-minute walk after dinner, phones at home\.\\"/);
  assert.match(latest, /Maya did it/); assert.match(latest, /Dan skipped it/);
  const { data: h2 } = await agent(maya, { action: 'history' });
  assert.notEqual(h2.week.id, h.week.id, 'a new week, a new thing to try');
  assert.equal(h2.week.mine, null);
});

// ---------- security audit regressions (Oct 13) ----------

test('14. a removed partner cannot reconnect with an old invite link', async () => {
  const { data: t } = await maya.rpc('create_partner_invite');
  const { error: e1 } = await eve.rpc('accept_partner_invite', { p_token: t });
  assert.ifError(e1);
  await maya.from('partner_connections').delete().eq('partner_id', EVE);
  const { error: again } = await eve.rpc('accept_partner_invite', { p_token: t });
  assert.ok(again, 'the old link no longer works');
  const { data: seen } = await eve.from('journal_entries').select('id').eq('user_id', MAYA);
  assert.equal(seen.length, 0);

  // and a stranger can't wipe Maya's other links by sending and withdrawing a request
  const { data: t2 } = await maya.rpc('create_partner_invite');
  await eve.from('partner_connections').insert({ user_id: EVE, partner_id: MAYA, status: 'pending' });
  await eve.from('partner_connections').delete().eq('user_id', EVE).eq('partner_id', MAYA);
  const { data: who } = await dan.rpc('preview_partner_invite', { p_token: t2 });
  assert.equal(who, 'Maya', "Maya's new link still works");
});

test('15. nobody can hand their entry to someone else', async () => {
  const { data: mine } = await maya.from('journal_entries').select('id').eq('user_id', MAYA).limit(1);
  const { error } = await maya.from('journal_entries').update({ user_id: DAN, content: 'forged', is_shared: true }).eq('id', mine[0].id);
  assert.ok(error, 'changing the owner is refused');
  const { data: danEntries } = await dan.from('journal_entries').select('content').eq('content', 'forged');
  assert.equal(danEntries.length, 0);
});

test('16. profile emails follow the login; invites by email cannot be hijacked', async () => {
  await eve.from('profiles').update({ email: 'newperson@test.com', full_name: 'Sam' }).eq('id', EVE);
  const { data: eveRow } = await eve.from('profiles').select('email').eq('id', EVE).single();
  assert.equal(eveRow.email, 'eve@test.com', 'the email snaps back to the login email');
  const { data: found } = await maya.rpc('find_user_by_email', { p_email: 'newperson@test.com' });
  assert.equal(found, null);
});

test('17. a stranger cannot read your profile by sending a request or tagging you', async () => {
  await eve.from('partner_connections').insert({ user_id: EVE, partner_id: DAN, status: 'pending' });
  await eve.from('journal_entries').insert({ user_id: EVE, content: 'circle', is_shared: false, tags: ['system_circle_member', `member:${MAYA}`] });
  const { data: profs } = await eve.from('profiles').select('id').in('id', [MAYA, DAN]);
  assert.equal(profs.length, 0, 'Eve still sees neither Maya nor Dan');
  const { data: danSees } = await dan.from('profiles').select('full_name').eq('id', EVE);
  assert.equal(danSees.length, 1, 'but Dan, who received the request, can see who sent it');
  const { data: coupled } = await eve.rpc('are_partners', { a: MAYA, b: DAN });
  assert.equal(coupled, false, 'and Eve cannot ask whether two other people are a couple');
  const { data: ours } = await maya.rpc('are_partners', { a: MAYA, b: DAN });
  assert.equal(ours, true);
  await eve.from('partner_connections').delete().eq('user_id', EVE); // leave Eve unconnected for the browser checks
});

test('18. a bad time zone is ignored instead of breaking jobs', async () => {
  await eve.from('agent_settings').upsert({ user_id: EVE, timezone: 'Not/AZone' }, { onConflict: 'user_id' });
  const { data } = await eve.from('agent_settings').select('timezone').single();
  assert.equal(data.timezone, 'America/New_York');
  const { status } = await runWeekly('checkin');
  assert.equal(status, 200);
});

test('19. analytics and conflict logs are private', async () => {
  await maya.from('conflict_logs').insert({ user_id: MAYA, original_input: 'MAYA FIGHT TEXT', ai_suggestion: 'x' });
  await maya.from('analytics_events').insert({ user_id: MAYA, event_name: 'entry_created', properties: { mood: 'Anxious' } });
  const { data: logs } = await eve.from('conflict_logs').select('id');
  assert.equal(logs.length, 0, 'Eve cannot read Maya\'s argument');
  const { data: ev } = await eve.from('analytics_events').select('id');
  assert.equal(ev.length, 0, 'only the admin reads analytics');
  const { error: spoof } = await eve.from('conflict_logs').insert({ user_id: MAYA, original_input: 'fake' });
  assert.ok(spoof);
  const { data: own } = await maya.from('conflict_logs').select('original_input');
  assert.equal(own.length, 1);
});

test('20. old public photos and voice notes move to private storage, once', async () => {
  const { execFileSync } = await import('node:child_process');
  const pub = (p) => `${URL_}/storage/v1/object/public/journal-media/${p}`;
  const put = (p, body) => fetch(`${URL_}/storage/v1/object/journal-media/${p}`, { method: 'POST', headers: { Authorization: `Bearer ${SERVICE}`, 'content-type': 'audio/webm' }, body });
  await put('voice-notes/old1.webm', 'MAYA OLD VOICE');
  await put('photos/old2.jpg', 'DAN OLD PHOTO');
  await put('avatars/x-1.png', 'avatar');
  const { data: [e1] } = await service.from('journal_entries').insert({ user_id: MAYA, content: 'old voice', is_shared: false, audio_url: pub('voice-notes/old1.webm') }).select('id');
  const { data: [e2] } = await service.from('journal_entries').insert({ user_id: DAN, content: 'old photo', is_shared: true, photo_url: `${URL_}/storage/v1/object/sign/journal-media/photos/old2.jpg?token=abc` }).select('id');
  assert.equal((await fetch(pub('voice-notes/old1.webm'))).status, 200, 'before: anyone with the link can open it');

  const runIt = () => execFileSync(process.execPath, [new URL('../../scripts/migrate-legacy-media.mjs', import.meta.url).pathname], {
    env: { ...process.env, SUPABASE_URL: URL_, SUPABASE_SERVICE_ROLE_KEY: SERVICE }, encoding: 'utf8' });
  assert.match(runIt(), /2 found, 2 moved, 0 missing, 0 failed/);

  const { data: rows } = await service.from('journal_entries').select('id, audio_url, photo_url').in('id', [e1.id, e2.id]).order('content', { ascending: false });
  assert.equal(rows.find(r => r.id === e1.id).audio_url, `sb://journal-private/${MAYA}/voice/legacy-old1.webm`);
  assert.equal(rows.find(r => r.id === e2.id).photo_url, `sb://journal-private/${DAN}/photos/legacy-old2.jpg`);
  assert.equal((await fetch(pub('voice-notes/old1.webm'))).status, 404, 'after: the public link is dead');
  const keys = await (await fetch(`${URL_}/__storage`)).json();
  assert.ok(keys.includes(`journal-private/${MAYA}/voice/legacy-old1.webm`));
  assert.ok(keys.includes('journal-media/avatars/x-1.png'), 'profile photos are left alone');
  assert.match(runIt(), /0 found, 0 moved/, 'running again changes nothing');
});

test('21. everything WhatsApp does with dates also works inside Belluh', async () => {
  // A date one week out, in Maya's time zone
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  d.setDate(d.getDate() + 7);
  const { error } = await service.from('occasions').insert({ user_id: MAYA, label: 'Lisbon trip', kind: 'trip', month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear(), repeats_yearly: false, source: 'whatsapp', mentioned_at: '2026-03-03T15:00:00Z' });
  assert.ifError(error);

  const r1 = await runWeekly('reminders', MAYA);
  assert.ok(r1.body.reminders_sent >= 1, 'a week before, Belluh reminds you in the app');
  assert.equal((await runWeekly('reminders', MAYA)).body.reminders_sent, 0, 'and only once');
  const { data: h } = await agent(maya, { action: 'history' });
  const rem = h.messages.find(m => m.meta?.kind === 'reminder' && m.body.includes('Lisbon'));
  assert.match(rem.body, /Lisbon trip is in one week, .* You first told me about it on Mar 3, 2026/);

  await agent(maya, { action: 'chat', message: 'Please pause reminders for a while' });
  const { data: st } = await maya.from('agent_settings').select('reminders_enabled').single();
  assert.equal(st.reminders_enabled, false, 'pausing works like STOP');
  assert.equal((await runWeekly('reminders', MAYA)).body.reminders_sent, undefined, 'paused means no reminders');

  await agent(maya, { action: 'chat', message: 'Please remove the date Lisbon trip' });
  const { data: left } = await maya.from('occasions').select('label').eq('label', 'Lisbon trip');
  assert.equal(left.length, 0, 'FORGET works in the app too');
});

test('22. WhatsApp end to end: one-tap link, text a date, get the reply and the reminder', async () => {
  const hook = async (text, from = '15551230000') => {
    const body = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from, id: 'wamid.in.' + Math.random(), timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: text } }] } }] }] });
    const sig = 'sha256=' + crypto.createHmac('sha256', 'wa-secret').update(body).digest('hex');
    return fetch(`${URL_}/functions/v1/whatsapp-webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig }, body });
  };
  const sent = () => geminiRequests().filter(r => r.whatsapp).map(r => r.whatsapp);

  // Meta's one-time webhook check
  const v = await fetch(`${URL_}/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=wa-verify&hub.challenge=42`);
  assert.equal(await v.text(), '42');
  // Forged messages are rejected
  const forged = await fetch(`${URL_}/functions/v1/whatsapp-webhook`, { method: 'POST', headers: { 'x-hub-signature-256': 'sha256=' + '0'.repeat(64) }, body: '{}' });
  assert.equal(forged.status, 401);

  // The app makes a code; the Connect button opens WhatsApp with "LINK <code>" typed in
  const { data: code } = await maya.rpc('request_whatsapp_link', { p_timezone: 'America/New_York' });
  assert.match(code, /^[A-Z2-9]{6}$/);
  assert.equal((await hook(`LINK ${code}`)).status, 200);
  const { data: link } = await maya.from('whatsapp_links').select('phone_e164').single();
  assert.equal(link.phone_e164, '+15551230000', 'linked with one message');
  assert.match(sent().at(-1).text.body, /connected/);

  await hook("Dan's birthday is October 20");
  // Texting Belluh is talking to Belluh: the agent saves dates, and knows Maya already told it this one in the app (scenario 4)
  assert.match(sent().at(-1).text.body, /already had that one saved/);
  const { data: occ } = await maya.from('occasions').select('label');
  assert.equal(occ.filter(o => o.label === "Dan's birthday").length, 1, 'no duplicate');

  await hook('LIST');
  assert.match(sent().at(-1).text.body, /Dan's birthday/);

  // A date one week out gets the approved reminder template
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); d.setDate(d.getDate() + 7);
  await service.from('occasions').insert({ user_id: MAYA, label: 'Paris trip', kind: 'trip', month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear(), repeats_yearly: false, source: 'whatsapp' });
  const r = await fetch(`${URL_}/functions/v1/occasion-reminders?force=1`, { method: 'POST', headers: { 'x-cron-secret': 'cron-test' } });
  const out = await r.json();
  assert.ok(out.sent >= 1, JSON.stringify(out));
  const tpl = sent().filter(m => m.type === 'template');
  assert.ok(tpl.some(m => m.template.name === 'occasion_reminder' && m.template.components[0].parameters[0].text === 'Paris trip'));

  // Someone else's number gets nothing
  await hook('LIST', '15559999999');
  assert.match(sent().at(-1).text.body, /isn't connected|not connected|Connect/i);
});

test('23. plan together: Belluh proposes times, the partner picks one, it lands in both calendars', async () => {
  const { data: out } = await agent(maya, { action: 'chat', message: 'Can you plan a dinner with Dan this week?' });
  assert.ok(out.messages.some(m => m.role === 'plan'), 'Maya sees the plan in her thread');
  const { data: plans } = await maya.from('plans').select('*').eq('status', 'proposed');
  assert.equal(plans.length, 1);
  const plan = plans[0];
  assert.equal(plan.partner_id, DAN);
  assert.equal(plan.options.length, 2, 'a time in the past is dropped');
  assert.ok(plan.options.every(o => new Date(o.starts_at) > new Date()));

  // Dan sees it too; Eve does not; nobody can write plans directly
  const { data: dh } = await agent(dan, { action: 'history' });
  assert.ok(dh.messages.some(m => m.role === 'plan' && m.meta.plan_id === plan.id && m.meta.from_name === 'Maya'));
  assert.equal((await eve.from('plans').select('id')).data.length, 0, 'strangers see no plans');
  const { error: direct } = await dan.from('plans').update({ status: 'confirmed', chosen_option: 'a' }).eq('id', plan.id).select();
  const { data: still } = await maya.from('plans').select('status').eq('id', plan.id).single();
  assert.equal(still.status, 'proposed', 'only Belluh changes plans' + (direct ? '' : ''));

  // Only the partner can answer; Maya can't pick for Dan
  const { error: wrong } = await agent(maya, { action: 'plan_respond', plan_id: plan.id, option_id: 'a' });
  assert.ok(wrong, 'the person who proposed it cannot answer it');

  const { data: picked } = await agent(dan, { action: 'plan_respond', plan_id: plan.id, option_id: 'b', note: 'Saturday is perfect' });
  assert.equal(picked.plan.status, 'confirmed');
  assert.equal(picked.plan.chosen_option, 'b');
  const { error: twice } = await agent(dan, { action: 'plan_respond', plan_id: plan.id, option_id: 'a' });
  assert.ok(twice, 'answered once only');

  // Both get it as a date with reminders, and Maya hears back
  for (const c of [maya, dan]) {
    const { data: occ } = await c.from('occasions').select('label, repeats_yearly').eq('label', 'Dinner at the Thai place');
    assert.equal(occ.length, 1); assert.equal(occ[0].repeats_yearly, false);
  }
  const { data: mh } = await agent(maya, { action: 'history' });
  assert.match(mh.messages.at(-1).body, /Dan picked .* for "Dinner at the Thai place".*Saturday is perfect/);

  // Belluh knows about it next time either of them talks to it
  await agent(dan, { action: 'chat', message: 'what are we up to this week?' });
  const sys = geminiRequests().at(-1).body.systemInstruction.parts[0].text;
  assert.match(sys, /Dinner at the Thai place/);

  // Calendar feed: private link, confirmed plan as a timed event, dates as all-day events, no duplicate
  const { data: tok } = await dan.rpc('my_calendar_token', { p_reset: false });
  assert.match(tok, /^[A-Za-z0-9_-]{32}$/);
  const ics = await (await fetch(`${URL_}/functions/v1/belluh-calendar?token=${tok}`)).text();
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Dinner at the Thai place\r\nDESCRIPTION:The one you both wrote about./);
  assert.equal(ics.match(/SUMMARY:Dinner at the Thai place/g).length, 1, 'the plan is not repeated as an all-day date');
  assert.equal((await fetch(`${URL_}/functions/v1/belluh-calendar?token=wrongwrongwrongwrongwrong`)).status, 404);
  const { data: newTok } = await dan.rpc('my_calendar_token', { p_reset: true });
  assert.notEqual(newTok, tok);
  assert.equal((await fetch(`${URL_}/functions/v1/belluh-calendar?token=${tok}`)).status, 404, 'a reset link stops working');
  assert.equal((await anon.rpc('my_calendar_token', { p_reset: false })).data, null, 'signed-out visitors get no link');

  // "None of these work" and "call it off"
  await agent(maya, { action: 'chat', message: 'plan a dinner again please' });
  const { data: p2 } = await maya.from('plans').select('id').eq('status', 'proposed').single();
  const { data: no } = await agent(dan, { action: 'plan_respond', plan_id: p2.id, option_id: null, note: 'Next week?' });
  assert.equal(no.plan.status, 'declined');
  const { data: mh2 } = await agent(maya, { action: 'history' });
  assert.match(mh2.messages.at(-1).body, /can't make those times.*Next week\?/);
  await agent(maya, { action: 'chat', message: 'plan a dinner one more time' });
  const { data: p3 } = await maya.from('plans').select('id').eq('status', 'proposed').single();
  assert.ok((await agent(dan, { action: 'plan_cancel', plan_id: p3.id })).error, 'only the person who proposed it can call it off');
  const { data: off } = await agent(maya, { action: 'plan_cancel', plan_id: p3.id });
  assert.equal(off.plan.status, 'cancelled');
});

test('24. SMS works exactly like WhatsApp: one-tap link, dates, STOP/START, reminders by text', async () => {
  const SMS_URL = `${URL_}/functions/v1/sms-webhook`;
  const sms = async (text, from = '+15557770000', sid = 'SM' + Math.random().toString(36).slice(2)) => {
    const params = { From: from, To: '+15550001111', Body: text, MessageSid: sid, NumMedia: '0' };
    const data = SMS_URL + Object.keys(params).sort().map(k => k + params[k]).join('');
    const sig = crypto.createHmac('sha1', 'tw-token').update(data).digest('base64');
    return fetch(SMS_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': sig }, body: new URLSearchParams(params) });
  };
  const texts = () => geminiRequests().filter(r => r.sms);

  // Forged requests are rejected
  const forged = await fetch(SMS_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': 'nope' }, body: 'From=%2B15557770000&Body=LIST&MessageSid=SMx' });
  assert.equal(forged.status, 401);

  // Not connected yet: Belluh says how, by text
  await sms('hello');
  assert.match(texts().at(-1).sms.Body, /Connect by text/);
  assert.equal(texts().at(-1).sms.To, '+15557770000');
  assert.match(texts().at(-1).auth, /^Basic /, 'sent through Twilio with the account credentials');

  // One tap in the app opens Messages with "LINK <code>" typed in
  const { data: code } = await dan.rpc('request_whatsapp_link', { p_timezone: 'America/Los_Angeles' });
  const r = await sms(`LINK ${code}`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /<Response><\/Response>/);
  const { data: link } = await dan.from('whatsapp_links').select('phone_e164, channel').single();
  assert.deepEqual(link, { phone_e164: '+15557770000', channel: 'sms' });
  assert.match(texts().at(-1).sms.Body, /connected/);

  // Twilio retries are counted once
  const sid = 'SMdup' + Date.now();
  await sms("Maya's birthday is October 20", undefined, sid);
  const before = texts().length;
  await sms("Maya's birthday is October 20", undefined, sid);
  assert.equal(texts().length, before, 'a retried delivery is not answered twice');
  const { data: occ } = await dan.from('occasions').select('label, source').eq('source', 'sms');
  assert.equal(occ.length, 1, 'the date is saved, marked as texted');
  assert.match(texts().at(-1).sms.Body, /^Done\./, 'Belluh answers by text');

  await sms('STOP');
  assert.equal((await dan.from('whatsapp_links').select('reminders_enabled').single()).data.reminders_enabled, false);
  await sms('START');
  assert.equal((await dan.from('whatsapp_links').select('reminders_enabled').single()).data.reminders_enabled, true);
  await sms('LIST');
  assert.match(texts().at(-1).sms.Body, /Dan's birthday/);

  // Reminders arrive by SMS for people who linked by SMS
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })); d.setDate(d.getDate() + 7);
  await service.from('occasions').insert({ user_id: DAN, label: 'Tahoe weekend', kind: 'trip', month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear(), repeats_yearly: false, source: 'sms' });
  const out = await (await fetch(`${URL_}/functions/v1/occasion-reminders?force=1`, { method: 'POST', headers: { 'x-cron-secret': 'cron-test' } })).json();
  assert.ok(out.sent >= 1, JSON.stringify(out));
  assert.ok(texts().some(t => /^Belluh reminder: Tahoe weekend is in one week, .*Reply STOP to pause reminders\.$/.test(t.sms.Body)));
  // Maya, linked on WhatsApp, still gets the WhatsApp template
  assert.equal((await maya.from('whatsapp_links').select('channel').single()).data.channel, 'whatsapp');
});

test('25. Belluh itself works over WhatsApp and SMS: same thread and memory, notes, plans, weekly check-in, STOP', async () => {
  const hook = async (text, from = '15551230000') => {
    const body = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from, id: 'wamid.in.' + Math.random(), timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: text } }] } }] }] });
    const sig = 'sha256=' + crypto.createHmac('sha256', 'wa-secret').update(body).digest('hex');
    return fetch(`${URL_}/functions/v1/whatsapp-webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig }, body });
  };
  const SMS_URL = `${URL_}/functions/v1/sms-webhook`;
  const sms = async (text, from = '+15557770000') => {
    const params = { From: from, To: '+15550001111', Body: text, MessageSid: 'SM' + Math.random().toString(36).slice(2), NumMedia: '0' };
    const sig = crypto.createHmac('sha1', 'tw-token').update(SMS_URL + Object.keys(params).sort().map(k => k + params[k]).join('')).digest('base64');
    return fetch(SMS_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': sig }, body: new URLSearchParams(params) });
  };
  const toMaya = () => geminiRequests().filter(r => r.whatsapp?.to === '15551230000').map(r => r.whatsapp);
  const toDan = () => geminiRequests().filter(r => r.sms?.To === '+15557770000').map(r => r.sms.Body);

  // Maya (WhatsApp) talks to Belluh: the reply comes back on WhatsApp, and it's the same thread as the app
  await hook('Please remember that Dan likes quiet mornings');
  const last = geminiRequests().filter(r => r.body?.systemInstruction).at(-1).body;
  assert.match(last.systemInstruction.parts[0].text, /texting you from their phone/, 'Belluh knows to keep it short');
  assert.match(last.systemInstruction.parts[0].text, /by text you can only help with things between them/, "stays Belluh, not a general chatbot (WhatsApp's terms)");
  assert.match(last.systemInstruction.parts[0].text, /Plans together|Dinner at the Thai place/, 'with all of its context');
  assert.doesNotMatch(JSON.stringify(last), /DAN PRIVATE/, "Dan's private entries never reach it, on any channel");
  assert.match(toMaya().at(-1).text.body, /^Done\./);
  const { data: h } = await agent(maya, { action: 'history' });
  const fromPhone = h.messages.filter(m => m.meta?.channel === 'whatsapp');
  assert.ok(fromPhone.some(m => m.body === 'Please remember that Dan likes quiet mornings'), 'the WhatsApp message is in her app thread');
  const { data: mem } = await maya.from('agent_memories').select('fact');
  assert.ok(mem.length >= 1, 'memory saved from WhatsApp');

  // A note: drafted on WhatsApp, sent with one word, delivered to Dan by SMS and in his app
  await hook('Can you tell dan I miss him');
  assert.match(toMaya().at(-1).text.body, /Note to Dan:\n"I miss you. Saturday coffee, phones away\?"\n\nReply SEND to send it, or DISCARD\./);
  await hook('SEND');
  assert.match(toMaya().at(-1).text.body, /Sent to Dan ✓/);
  assert.match(toDan().at(-1), /^From Maya, via Belluh:\n"I miss you. Saturday coffee, phones away\?"/);
  const { data: dh } = await agent(dan, { action: 'history' });
  assert.ok(dh.messages.some(m => m.role === 'partner_note' && m.body.startsWith('I miss you')), 'and in his app');
  await hook('SEND');
  assert.doesNotMatch(toMaya().at(-1).text.body, /Sent to Dan/, 'nothing is sent twice');

  // A plan: Maya asks on WhatsApp, Dan picks by texting "2", Maya hears back on WhatsApp
  await hook('plan a dinner with Dan this week please');
  assert.match(toDan().at(-1), /^Maya wants to plan "Dinner at the Thai place" with you\. Pick a time:\n1\) .*\n2\) \w{3}, \w{3} \d+ at \d+:\d\d [AP]M( \(Saturday\))?\n\nReply 1, 2, or NONE/);
  await sms('2');
  assert.match(toDan().at(-1), /^It's set: "Dinner at the Thai place"/);
  assert.match(toMaya().at(-1).text.body, /^Dan picked .* for "Dinner at the Thai place"/);
  const { data: picked } = await dan.from('plans').select('status, chosen_option').order('created_at', { ascending: false }).limit(1).single();
  assert.deepEqual(picked, { status: 'confirmed', chosen_option: 'b' });
  await sms('3');
  assert.doesNotMatch(toDan().at(-1), /It's set/, 'no open plan: a number is just a message to Belluh');

  // This week's thing to try, answered by text
  await sms('did it');
  const { data: wk } = await agent(dan, { action: 'history' });
  assert.equal(wk.week.mine, 'done');

  // STOP pauses everything Belluh starts; replies still work
  await sms('STOP');
  const before = toDan().length;
  await hook('tell dan good night');
  await hook('SEND');
  assert.equal(toDan().length, before, 'paused means no texts to Dan');
  const { data: dh2 } = await agent(dan, { action: 'history' });
  assert.ok(dh2.messages.some(m => m.role === 'partner_note' && m.body.startsWith('I miss you')), 'the note still reaches his app');
  await sms('START');
});

test("26. show Belluh a photo in chat: it sees yours, never someone else's", async () => {
  // A tiny real PNG in Maya's own private folder (the app uploads it the same way)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const put = (path) => fetch(`${URL_}/storage/v1/object/journal-private/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${SERVICE}`, 'content-type': 'image/png' }, body: png });
  await put(`${MAYA}/photos/chat1.png`);
  await put(`${DAN}/photos/dan-secret.png`);

  const { data: out } = await agent(maya, { action: 'chat', message: 'What do you think of this?', photo: `sb://journal-private/${MAYA}/photos/chat1.png` });
  assert.equal(out.messages[0].meta.photo, `sb://journal-private/${MAYA}/photos/chat1.png`, 'the photo stays on her message');
  const sent = geminiRequests().filter(r => r.body?.contents).at(-1).body.contents;
  const parts = sent.at(-1).parts.length ? sent.at(-1).parts : sent.at(-2).parts;
  assert.ok(JSON.stringify(sent).includes(png.toString('base64')), 'Belluh is sent the actual image');

  // A path in someone else's folder is ignored
  await agent(maya, { action: 'chat', message: 'And this one?', photo: `sb://journal-private/${DAN}/photos/dan-secret.png` });
  const sent2 = geminiRequests().filter(r => r.body?.contents).at(-1).body;
  assert.ok(!JSON.stringify(sent2.contents.at(-1)).includes('inlineData'), "Dan's photo never reaches Maya's Belluh");
  assert.ok(parts.length >= 1);
});

test('27. notifications: a browser that turned them on gets an encrypted push only it can read', async () => {
  // Dan's browser (a key pair it keeps), subscribed to a stand-in push service
  const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
  const authSecret = crypto.randomBytes(16);
  const b64u = (b) => Buffer.from(b).toString('base64url');
  const endpoint = 'http://127.0.0.1:3002/push/dan-laptop';
  const { error } = await dan.from('push_subscriptions').insert({ user_id: DAN, endpoint, p256dh: b64u(ua.getPublicKey()), auth: b64u(authSecret) });
  assert.ifError(error);
  assert.ok((await maya.from('push_subscriptions').insert({ user_id: DAN, endpoint: 'http://127.0.0.1:3002/push/x', p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) })).error, 'nobody can add a browser to someone else');
  assert.equal((await maya.from('push_subscriptions').select('id')).data.length, 0, "and nobody sees anyone else's");
  // A subscription aimed somewhere that isn't a push service is never called
  await dan.from('push_subscriptions').insert({ user_id: DAN, endpoint: 'http://169.254.169.254/latest', p256dh: b64u(ua.getPublicKey()), auth: b64u(authSecret) });

  const { data: key } = await dan.functions.invoke('belluh-push', { body: { action: 'key' } });
  assert.equal(Buffer.from(key.publicKey, 'base64url').length, 65, 'Belluh made its own VAPID key');
  const { data: again } = await maya.functions.invoke('belluh-push', { body: { action: 'key' } });
  assert.equal(again.publicKey, key.publicKey, 'one key for everyone');
  assert.equal((await anon.from('app_keys').select('*')).data?.length ?? 0, 0);
  assert.equal((await maya.from('app_keys').select('*')).data?.length ?? 0, 0, 'the private key is never readable');

  // Maya plans something: Dan's browser gets it
  const pushes = () => geminiRequests().filter(r => r.push !== undefined);
  const before = pushes().length;
  await agent(maya, { action: 'chat', message: 'plan a dinner for Friday please' });
  const p = pushes().slice(before).filter(x => x.url === '/push/dan-laptop').at(-1);
  assert.ok(p, 'a push went to Dan');
  assert.equal(p.headers.encoding, 'aes128gcm');
  assert.match(p.headers.authorization, new RegExp(`^vapid t=[\\w-]+\\.[\\w-]+\\.[\\w-]+, k=${key.publicKey}$`));
  assert.ok(!geminiRequests().some(r => (r.url ?? '').includes('169.254')), 'the fake endpoint was never called');

  // Decrypt it the way Dan's browser would
  const body = Buffer.from(p.push, 'base64');
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
  const h = (s, k, i, n) => Buffer.from(crypto.hkdfSync('sha256', k, s, i, n));
  const ikm = h(authSecret, ua.computeSecret(asPub), Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPub]), 32);
  const d = crypto.createDecipheriv('aes-128-gcm', h(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), h(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12));
  d.setAuthTag(ct.subarray(ct.length - 16));
  const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  const msg = JSON.parse(plain.subarray(0, plain.length - 1).toString());
  assert.equal(msg.body, 'Maya wants to plan "Dinner at the Thai place". Tap to pick a time.');
  assert.equal(msg.url, '/?tab=belluh');

  // A browser that unsubscribed (the service answers 410) is forgotten
  await service.from('push_subscriptions').insert({ user_id: DAN, endpoint: 'http://127.0.0.1:3002/push/gone-phone', p256dh: b64u(ua.getPublicKey()), auth: b64u(authSecret) });
  const { data: t } = await dan.functions.invoke('belluh-push', { body: { action: 'test' } });
  assert.equal(t.sent, 1, 'the test notification reached the working browser');
  const { data: left } = await dan.from('push_subscriptions').select('endpoint');
  assert.deepEqual(left.map(x => x.endpoint), [endpoint], 'dead and bogus subscriptions are cleaned up');
});

test('28. Us: one thread for both of them and Belluh, built only from what both can see', async () => {
  // Fresh daily-question lock check: Dan answers today's question; Maya hasn't
  await dan.from('journal_entries').insert({ user_id: DAN, content: 'DAN DAILY ANSWER today', title: 'Us test question', is_shared: true });

  const { data: h0 } = await agent(maya, { action: 'us_history' });
  assert.equal(h0.partner_name, 'Dan');
  const { data: s1 } = await agent(maya, { action: 'us_send', message: 'Hey you, dinner tonight?', ask_belluh: false });
  assert.equal(s1.messages.length, 1, 'just a message to Dan; Belluh stays quiet unless asked');

  const before = geminiRequests().length;
  const { data: s2 } = await agent(maya, { action: 'us_send', message: 'Belluh, plan a dinner for us this week?' });
  const roles = s2.messages.map(m => m.role);
  assert.ok(roles.includes('plan') && roles.at(-1) === 'belluh', JSON.stringify(roles));
  const sent = geminiRequests().slice(before).filter(r => r.body?.systemInstruction);
  const sys = sent[0].body.systemInstruction.parts[0].text;
  assert.match(sys, /three-way chat with Maya and Dan/);
  for (const secret of ['MAYA PRIVATE', 'DAN PRIVATE', 'DAN DAILY ANSWER', 'Dan likes quiet mornings', 'I miss you. Saturday coffee']) {
    assert.ok(!JSON.stringify(sent).includes(secret), `the shared thread never sees: ${secret}`);
  }
  assert.match(JSON.stringify(sent[0].body.contents), /Maya: Hey you, dinner tonight\?/, 'messages are labelled by who wrote them');
  assert.deepEqual(sent[0].body.tools[0].functionDeclarations.map(t => t.name), ['plan_with_partner', 'find_table', 'plan_trip', 'order_food', 'find_experience'], 'planning and booking only: no memory, note or journal tools in the shared thread');

  // Dan sees the same thread and picks a time; the answer lands in the thread
  const { data: dh } = await agent(dan, { action: 'us_history' });
  assert.ok(dh.messages.some(m => m.body === 'Hey you, dinner tonight?' && m.author === MAYA));
  const planMsg = dh.messages.find(m => m.role === 'plan');
  await agent(dan, { action: 'plan_respond', plan_id: planMsg.meta.plan_id, option_id: 'a' });
  const { data: mh } = await agent(maya, { action: 'us_history' });
  assert.match(mh.messages.at(-1).body, /^Dan picked .* It's set: "Dinner at the Thai place"/);

  // Nobody can write the thread directly, and strangers can't read it
  assert.ok((await maya.from('us_messages').insert({ user_a: MAYA < DAN ? MAYA : DAN, user_b: MAYA < DAN ? DAN : MAYA, author: DAN, role: 'user', body: 'forged' })).error);
  assert.equal((await eve.from('us_messages').select('id')).data.length, 0);
  assert.ok((await maya.from('us_messages').select('id')).data.length >= 4);
  const { data: eh } = await agent(eve, { action: 'us_send', message: 'hi' });
  assert.equal(eh, null, 'no partner, no shared thread');
});

test('29. Telegram: one tap links it, then it is the same Belluh as WhatsApp and SMS, with buttons for quick answers', async () => {
  const TG_URL = `${URL_}/functions/v1/telegram-webhook`;
  const secret = crypto.createHash('sha256').update('belluh-telegram:tg-token').digest('hex').slice(0, 48);
  let n = 1000 + Math.floor(Math.random() * 1e6);
  const tg = (text, chat = 777, headers = { 'x-telegram-bot-api-secret-token': secret }) => fetch(TG_URL, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ update_id: ++n, message: { message_id: n, chat: { id: chat, type: 'private' }, from: { id: chat, is_bot: false }, text } }),
  });
  const toEve = () => geminiRequests().filter(r => r.telegram?.chat_id === '777').map(r => r.telegram);

  assert.equal((await tg('hi', 777, {})).status, 403, 'unsigned updates are refused');
  assert.equal((await tg('hi', 777, { 'x-telegram-bot-api-secret-token': 'wrong' })).status, 403);

  await tg('hello?');
  assert.match(toEve().at(-1).text, /tap Connect Telegram/, 'a stranger is told how to connect');

  // Eve taps Connect Telegram: the bot opens with /start <code>, and that's it
  const { data: code } = await eve.rpc('request_whatsapp_link', { p_timezone: 'America/New_York' });
  await tg(`/start ${code}`);
  assert.match(toEve().at(-1).text, /You're connected ✓/);
  const { data: link } = await eve.from('whatsapp_links').select('phone_e164, channel').single();
  assert.deepEqual(link, { phone_e164: 'tg:777', channel: 'telegram' });

  // Then it's Belluh: a date by text, LIST from the menu, a reminder Belluh sets itself
  await tg('My sister Ana has her birthday on Oct 20');
  await tg('/list');
  assert.match(toEve().at(-1).text, /Dan's birthday/, 'LIST works from the Telegram menu');
  await tg('remind me to call Ana on Saturday');
  assert.match(toEve().at(-1).text, /^Done\./);
  const { data: rem } = await eve.from('personal_reminders').select('body, status');
  assert.deepEqual(rem.map(r => [r.body, r.status]), [['Call his mom', 'scheduled']], 'the reminder is saved, and only Eve can see it');
  assert.equal((await maya.from('personal_reminders').select('id')).data.length, 0);
  assert.ok((await eve.from('personal_reminders').insert({ user_id: EVE, body: 'forged', due_at: new Date().toISOString() })).error, 'nobody writes reminders directly');

  // Duplicate deliveries count once; group chats are ignored
  const before = toEve().length;
  const dup = JSON.stringify({ update_id: n, message: { message_id: n, chat: { id: 777, type: 'private' }, from: { id: 777, is_bot: false }, text: '/list' } });
  await fetch(TG_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret }, body: dup });
  await fetch(TG_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify({ update_id: ++n, message: { message_id: n, chat: { id: -9, type: 'group' }, from: { id: 5 }, text: '/list' } }) });
  assert.equal(toEve().length, before);
});

test('30. Belluh acts: reminders it sends itself, a table ready to book, gift ideas, and your words kept in your journal', async () => {
  // A reminder Belluh set, sent when due: in the app, and on Telegram with no extra setup
  await service.from('personal_reminders').update({ due_at: new Date(Date.now() - 60_000).toISOString() }).eq('user_id', EVE);
  const run = () => fetch(`${URL_}/functions/v1/belluh-nudges?user=${EVE}`, { headers: { 'x-cron-secret': 'cron-test' } }).then(r => r.json());
  assert.equal((await fetch(`${URL_}/functions/v1/belluh-nudges`)).status, 403, 'only the scheduler can run it');
  assert.equal((await run()).reminders_sent, 1);
  assert.equal((await run()).reminders_sent, 0, 'sent once');
  const tgEve = geminiRequests().filter(r => r.telegram?.chat_id === '777').map(r => r.telegram.text);
  assert.equal(tgEve.at(-1), 'Reminder: Call his mom');
  const { data: eh } = await agent(eve, { action: 'history' });
  assert.ok(eh.messages.some(m => m.body === 'Reminder: Call his mom' && m.meta?.kind === 'remind'));

  // A table: booking links under the reply, never "booked"
  const { data: t } = await agent(maya, { action: 'chat', message: 'Can you book a table for us Friday?' });
  const reply = t.messages.at(-1);
  const ot = new URL(reply.meta.links[0].url);
  assert.equal(ot.hostname, 'www.opentable.com');
  assert.equal(ot.searchParams.get('covers'), '2');
  assert.match(ot.searchParams.get('dateTime'), /^\d{4}-\d{2}-\d{2}T19:00:00$/);
  assert.equal(new URL(reply.meta.links[1].url).hostname, 'www.google.com');

  // In the shared thread too
  const { data: us } = await agent(maya, { action: 'us_send', message: 'Belluh, book a table near us for Friday' });
  assert.equal(new URL(us.messages.at(-1).meta.links[0].url).hostname, 'www.opentable.com');

  // Your own words, kept in your journal (private unless you say so); Belluh can't write anything you didn't say
  await agent(maya, { action: 'chat', message: 'journal this: Ramen night was perfect, we walked home the long way' });
  const { data: e } = await maya.from('journal_entries').select('content, is_shared, tags').eq('content', 'Ramen night was perfect, we walked home the long way');
  assert.equal(e.length, 1);
  assert.equal(e[0].is_shared, false, 'private by default');
  assert.ok(e[0].tags.includes('via:app'));
  assert.equal((await dan.from('journal_entries').select('id').eq('content', 'Ramen night was perfect, we walked home the long way')).data.length, 0, "Dan can't see it");
  await agent(maya, { action: 'chat', message: 'sneaky test' });
  assert.equal((await service.from('journal_entries').select('id').like('content', '%terrible partner%')).data.length, 0, 'words Maya never said are refused');
});

test('31. Belluh reaches out: plans a birthday ahead, nudges a plan nobody answered, and asks how it went', async () => {
  // Maya's partner's birthday is 12 days out, with nothing planned around it
  const d = new Date(Date.now() + 12 * 86_400_000);
  const nyDate = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric' }).formatToParts(d);
  const [m, day] = ['month', 'day'].map(t => Number(nyDate.find(p => p.type === t).value));
  await service.from('occasions').insert({ user_id: MAYA, label: 'Dan turns 30', kind: 'birthday', month: m, day, repeats_yearly: true, source: 'app' });
  const run = (user) => fetch(`${URL_}/functions/v1/belluh-nudges?force=daily&user=${user}`, { headers: { 'x-cron-secret': 'cron-test' } }).then(r => r.json());
  // Maya paused reminders earlier (scenario 21), so Belluh doesn't reach out; once she turns them back on, it does
  assert.equal((await run(MAYA)).offers, undefined, 'paused means paused');
  await service.from('agent_settings').update({ reminders_enabled: true }).eq('user_id', MAYA);
  assert.equal((await run(MAYA)).offers, 1);
  assert.equal((await run(MAYA)).offers, undefined, 'offered once');
  const { data: h } = await agent(maya, { action: 'history' });
  const offer = h.messages.find(x => x.meta?.kind === 'offer');
  assert.match(offer.body, /misses shooting film/, 'in a line drawn from what Belluh knows');
  assert.equal(offer.meta.status, 'open');
  // It reached her phone too, with the one-word answer
  const wa = geminiRequests().filter(r => r.whatsapp?.to === '15551230000').at(-1).whatsapp;
  assert.match(JSON.stringify(wa), /Reply PLAN IT or NOT NOW/);

  // Saying yes runs it like a request: gift ideas, each one tap from buying
  const { data: yes } = await agent(maya, { action: 'offer_respond', message_id: offer.id, accept: true });
  assert.equal(yes.status, 'accepted');
  const ideas = yes.messages.at(-1).meta.links.filter(l => new URL(l.url).hostname === 'www.amazon.com');
  assert.deepEqual(ideas.map(l => l.label), ['Film camera', 'Poetry books']);
  // and a real product from an independent Shopify shop, its checkout one tap away
  assert.equal(yes.messages.at(-1).meta.products?.[0]?.seller, 'Retrospekt');
  const { data: again } = await agent(maya, { action: 'offer_respond', message_id: offer.id, accept: true });
  assert.deepEqual(again.messages, [], 'only once');
  assert.equal((await agent(dan, { action: 'offer_respond', message_id: offer.id, accept: true })).data, null, "only Maya's to answer");

  // A plan Dan hasn't answered in two days gets one nudge, by text with the times
  const { data: p } = await service.from('plans').insert({
    created_by: MAYA, partner_id: DAN, title: 'Sunday hike', timezone: 'America/New_York',
    options: [{ id: 'a', starts_at: new Date(Date.now() + 4 * 86_400_000).toISOString(), minutes: 180 }, { id: 'b', starts_at: new Date(Date.now() + 5 * 86_400_000).toISOString(), minutes: 180 }],
    created_at: new Date(Date.now() - 40 * 3600_000).toISOString(),
  }).select('id').single();
  assert.equal((await run(DAN)).plan_nudges, 1);
  assert.equal((await run(DAN)).plan_nudges, 0);
  const sms = geminiRequests().filter(r => r.sms?.To === '+15557770000').at(-1).sms.Body;
  assert.match(sms, /^Maya is still waiting on a time for "Sunday hike"\. Pick one:\n1\) .*\n2\) .*\n\nReply 1, 2, or NONE\.$/);
  assert.equal((await run(MAYA)).plan_nudges, 0, 'Maya, who proposed it, is not nudged');

  // The day after a plan they made together: "how was it?" for both
  await service.from('plans').update({ status: 'confirmed', chosen_option: 'a', options: [{ id: 'a', starts_at: new Date(Date.now() - 16 * 3600_000).toISOString(), minutes: 180 }] }).eq('id', p.id);
  assert.equal((await run(MAYA)).after_plans, 1);
  assert.equal((await run(DAN)).after_plans, 1);
  const { data: mh } = await agent(maya, { action: 'history' });
  const after = mh.messages.find(x => x.meta?.kind === 'after_plan');
  assert.match(after.body, /^How was "Sunday hike"\?/);
  assert.equal(after.meta.prompt, 'How was Sunday hike?');
});

test('32. Belluh takes any shape it is asked for: the shape rides on its reply, and bad shapes are refused', async () => {
  const { data } = await agent(eve, { action: 'chat', message: 'Can you become a lighthouse?' });
  const reply = data.messages.at(-1);
  assert.equal(reply.role, 'belluh');
  assert.deepEqual(reply.meta.shape, { label: 'lighthouse', path: 'M42 10 L58 10 L62 80 L70 80 L70 92 L30 92 L30 80 L38 80 Z' });
  const { data: bad } = await agent(eve, { action: 'chat', message: 'become a broken thing' });
  assert.equal(bad.messages.at(-1).meta.shape, undefined, 'markup is never passed on as a shape');
});

test('33. Belluh gets the honeymoon and the flowers ready: searches with dates filled in, never "booked"', async () => {
  const { data: t } = await agent(eve, { action: 'chat', message: 'Can you plan our honeymoon in Lisbon?' });
  const links = t.messages.at(-1).meta.links;
  assert.deepEqual(links.map(l => l.label), ['Flights to Lisbon', 'Hotels in Lisbon', 'Airbnbs in Lisbon']);
  assert.match(new URL(links[1].url).searchParams.get('checkin'), /^\d{4}-\d{2}-\d{2}$/);
  const { data: f } = await agent(eve, { action: 'chat', message: 'Please send flowers to my sister for her birthday week' });
  const fl = f.messages.at(-1).meta.links;
  assert.equal(fl[0].label, 'Order peonies for delivery');
  assert.equal(new URL(fl[1].url).hostname, 'www.google.com');
});

test('34. Belluh gets dinner and a gift ready to order, never "ordered"', async () => {
  const { data: d } = await agent(eve, { action: 'chat', message: 'Can you order us dinner tonight?' });
  const dl = d.messages.at(-1).meta.links;
  assert.deepEqual(dl.map(l => l.label), ['Order pho on DoorDash', 'Order pho on Uber Eats']);
  const { data: g } = await agent(eve, { action: 'chat', message: 'buy a film camera for Dan, under 150' });
  const gm = g.messages.at(-1).meta;
  // Real products from Shopify brands first, in dollars, each straight to that shop's checkout
  assert.deepEqual(gm.products.map(p => [p.price, p.seller]), [['$69', 'Retrospekt'], ['$6', 'Analogue Shop']]);
  assert.ok(gm.products.every(p => p.url.startsWith('https://') && gm.links.some(l => l.url === p.url)));
  assert.match(gm.links[0].label, /, \$69 at Retrospekt$/);
  const amazon = gm.links.find(l => l.label === 'Buy film camera on Amazon');
  assert.equal(new URL(amazon.url).searchParams.get('rh'), 'p_36:-15000');
  // Belluh asked Shopify for the item, within budget (in cents), shipping to the US
  const asked = geminiRequests().filter(l => l.shopify).at(-1).shopify;
  assert.equal(asked.params.arguments.catalog.query, 'film camera');
  assert.equal(asked.params.arguments.catalog.filters.price.max, 15000);
});

test('35. Belluh runs on the newest model, falls back on its own, and always talks like a person', async () => {
  const before = geminiRequests().length;
  const { data: a } = await agent(eve, { action: 'chat', message: 'how are we doing this week?' });
  assert.ok(a.messages.at(-1).body.length > 0);
  const models = geminiRequests().slice(before).filter(r => r.url?.includes('generateContent')).map(r => r.url.match(/models\/([^:]+)/)?.[1]);
  assert.equal(models[0], 'gemini-3.8-flash', 'the agent asks the newest Flash first');
  assert.equal(geminiRequests().slice(before).find(r => r.url?.includes('gemini-3.8')).body.generationConfig.temperature, 1);

  const mid = geminiRequests().length;
  const { data: b } = await agent(eve, { action: 'chat', message: 'on an older key, are you there?' });
  const tried = geminiRequests().slice(mid).filter(r => r.url?.includes('generateContent')).map(r => r.url.match(/models\/([^:]+)/)?.[1]);
  assert.deepEqual(tried.slice(0, 2), ['gemini-3.8-flash', 'gemini-2.5-flash'], 'falls back when the newest model is missing');
  assert.ok(b.messages.at(-1).body.length > 0 && !/trouble thinking/.test(b.messages.at(-1).body));

  const { data: c } = await agent(eve, { action: 'chat', message: 'talk like a person please' });
  assert.equal(c.messages.at(-1).body, 'Sure! Here is the plan:\nRamen on 5th\nThen a walk, home');
});

test('36. When the model parrots tool output, Belluh asks again and answers like a person', async () => {
  const { data: a } = await agent(eve, { action: 'chat', message: 'order us dinner tonight, parrot' });
  const body = a.messages.at(-1).body;
  assert.equal(body, 'Pho is ready to order below, from the place you both loved. You just check out.');
  assert.doesNotMatch(body, /ok:|note:|true|\{/);
  const nudged = geminiRequests().filter(r => r.body?.toolConfig?.functionCallingConfig?.mode === 'NONE').at(-1);
  assert.ok(nudged, 'the retry asks for words only, no more tools');
  // and what the model sees after a tool is marked as private guidance, not something to repeat
  assert.ok(JSON.stringify(nudged.body.contents).includes('private_guidance'));
  // If it still can't find words, Belluh says what it did in a plain sentence
  const { data: b } = await agent(eve, { action: 'chat', message: 'order us dinner tonight, mute' });
  assert.equal(b.messages.at(-1).body, 'Dinner is ready to order below, you just check out.');
});

test('37. Groceries, a ride and something to do: each one ready, links that land, words without symbols', async () => {
  const run = async (m) => (await agent(eve, { action: 'chat', message: m })).data.messages.at(-1);
  const g = await run('Can you get groceries for scampi tonight?');
  assert.deepEqual(g.meta.links.map(l => l.label), ['Add shrimp', 'Add linguine', 'Add garlic']);
  assert.ok(g.meta.links.every(l => new URL(l.url).hostname === 'www.instacart.com'));
  const r = await run('get us a ride to dinner');
  assert.deepEqual(r.meta.links.map(l => new URL(l.url).hostname), ['m.uber.com', 'ride.lyft.com']);
  assert.equal(new URL(r.meta.links[0].url).searchParams.get('dropoff[formatted_address]'), 'Ramen Nagi, Palo Alto');
  const e = await run('find us something fun to do this weekend');
  assert.ok(e.meta.links[0].url.startsWith('https://www.eventbrite.com/d/ca--san-francisco/jazz-concert/'), e.meta.links[0].url);
  for (const m of [g, r, e]) assert.doesNotMatch(m.body, /[{}*#•·→]|ok:|note:|https?:/, m.body);
});

test('38. When Gemini is out of quota, a backup provider finishes the turn: tools, words and all', async () => {
  const before = geminiRequests().length;
  const { data } = await agent(eve, { action: 'chat', message: 'gemini is out today, order us dinner' });
  const m = data.messages.at(-1);
  assert.equal(m.body, 'Ramen is ready to order below. I picked the place you both keep mentioning.');
  assert.deepEqual(m.meta.links.map(l => l.label), ['Order ramen on DoorDash', 'Order ramen on Uber Eats']);
  const backup = geminiRequests().slice(before).filter(r => r.backup);
  assert.equal(backup.length, 2, 'one call to pick the tool, one to answer');
  assert.equal(backup[0].auth, 'Bearer groq-test');
  assert.equal(backup[0].backup.model, 'openai/gpt-oss-120b');
  const tool = backup[0].backup.tools.find(t => t.function.name === 'order_food');
  assert.equal(tool.function.parameters.type, 'object', 'Gemini schemas are translated to standard JSON Schema');
  assert.equal(backup[1].backup.messages.find(x => x.role === 'tool').tool_call_id, backup[1].backup.messages.find(x => x.tool_calls)?.tool_calls[0].id, 'the tool result is paired with its call');
});

test('39. The app\'s own AI features use the current model, and fall back to the backup when Gemini is out', async () => {
  const before = geminiRequests().length;
  const { data } = await maya.functions.invoke('gemini-proxy', { body: { model: 'gemini-3-flash-preview', contents: 'Summarize: we had coffee.' } });
  assert.ok(data.text);
  assert.match(geminiRequests().slice(before).find(r => r.url?.includes('generateContent')).url, /gemini-3\.8-flash/, 'the old preview name is never sent to Google');
  const mid = geminiRequests().length;
  const { data: d2, error } = await maya.functions.invoke('gemini-proxy', { body: { contents: 'gemini is out, write me one line' } });
  assert.equal(error, null);
  assert.equal(d2.text, 'Backup here, and listening.');
  const tried = geminiRequests().slice(mid).filter(r => r.url?.includes('generateContent')).map(r => r.url.match(/models\/([^:]+)/)[1]);
  assert.deepEqual(tried, ['gemini-3.8-flash', 'gemini-2.5-flash'], 'both Gemini models first, then the backup');
  // A JSON answer (a reply to a journal entry) falls back too
  const { data: j } = await maya.functions.invoke('gemini-proxy', { body: { contents: 'gemini is out, json please', config: { responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { reply: { type: 'STRING' } } } } } });
  assert.match(JSON.parse(j.text).reply, /Backup here/);
});
