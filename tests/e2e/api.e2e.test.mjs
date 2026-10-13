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
