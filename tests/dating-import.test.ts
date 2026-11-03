// "Bring your story from the app you met on": the export parsers, picking the match, letting go of the others, the
// partner's approval, discreet mode, and the screenshot path. Every fixture here is synthetic: made-up people, made-up
// messages, shaped like the formats documented in docs/growth/research/dating-apps.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { listZip, isZip } from '../src/lib/zip.ts';
import { parseTinder, parseHinge, parseGeneric, parseExportJson, readExport, rankMatches, keepOnly, firstPlanLine, openingLines, chapterRows, showAppByDefault, toTime, unescapeHtml, FROM_DATING_APP } from '../src/lib/datingImport.ts';
import { appsFor, appById, datingCountry, appInText, LOCAL_DATING, DATING_APPS } from '../src/lib/datingApps.ts';
import { discreetOn, DISCREET_DEFAULT } from '../src/lib/discreet.ts';
import { canDecide, decide, inSharedStory, approvalsFor, type StoryApproval } from '../src/lib/storyApproval.ts';
import { readDatingShot, storyFromShots, pastDay } from '../src/lib/datingShots.ts';

// ------------------------------------------------------------------------------------------------ synthetic exports

const TINDER = {
  Usage: { app_opens: { '2023-03-01': 4 }, swipes_likes: { '2023-03-01': 10 }, swipes_passes: { '2023-03-01': 30 }, matches: { '2023-03-01': 2 }, messages_sent: {}, messages_received: {} },
  User: { gender: 'X', create_date: '2022-01-01T00:00:00.000Z' },
  Messages: [
    { match_id: 'Match 1', messages: [
      { to: 0, from: 'You', message: 'hey there', sent_date: 'Thu, 05 Jan 2023 20:00:00 GMT' },
    ] },
    { match_id: 'Match 2', messages: [
      { to: 1, from: 'You', message: 'Hi Robin! Your dog photo made my day', sent_date: 'Thu, 02 Mar 2023 19:10:00 GMT' },
      { to: 1, from: 'You', message: 'https://media.giphy.com/x.gif', sent_date: 'Thu, 02 Mar 2023 19:11:00 GMT', type: 'gif', fixed_height: 'https://media.giphy.com/x.gif' },
      { to: 1, from: 'You', message: 'I don&rsquo;t usually do this, but drinks on Saturday?', sent_date: 'Fri, 03 Mar 2023 18:00:00 GMT' },
      { to: 1, from: 'You', message: 'See you at 8', sent_date: 'Sat, 04 Mar 2023 12:00:00 GMT' },
    ] },
    { match_id: 'Match 3', messages: [] },
  ],
  Photos: [],
};

const HINGE = [
  { like: [{ timestamp: '2024-05-10 10:00:00', like: [{ timestamp: '2024-05-10 10:00:00', comment: 'Best taco take I have read' }] }],
    match: [{ timestamp: '2024-05-10 21:30:00' }],
    chats: [{ body: 'So where are these tacos', timestamp: '2024-05-11 09:00:00' }, { body: 'Coffee on Sunday?', timestamp: '2024-05-12 09:00:00' }],
    we_met: [{ timestamp: '2024-05-20 12:00:00', did_meet_subject: 'Yes', was_my_type: 'Yes' }] },
  { like: [{ timestamp: '2024-04-01 10:00:00', like: [{ timestamp: '2024-04-01 10:00:00' }] }] },          // never matched
  { match: [{ timestamp: '2024-04-02 10:00:00' }], block: [{ block_type: 'remove', timestamp: '2024-04-03 10:00:00' }] },
];

const GENERIC = { conversations: [
  { conversation_id: 'c-7', messages: [
    { text: 'Hello from the generic side', sent_at: '2022-07-01T10:00:00Z', direction: 'sent' },
    { text: 'Hi back', sent_at: '2022-07-01T11:00:00Z', direction: 'received' },
  ] },
] };

/** A real ZIP (deflate) made in memory, like the ones the apps email out */
function zip(files: Record<string, string>): Uint8Array {
  const parts: Buffer[] = [], central: Buffer[] = [];
  let off = 0;
  for (const [name, body] of Object.entries(files)) {
    const raw = Buffer.from(body), comp = zlib.deflateRawSync(raw), n = Buffer.from(name);
    const loc = Buffer.alloc(30); loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(20, 4); loc.writeUInt16LE(8, 8);
    loc.writeUInt32LE(comp.length, 18); loc.writeUInt32LE(raw.length, 22); loc.writeUInt16LE(n.length, 26);
    const cen = Buffer.alloc(46); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(8, 10);
    cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(raw.length, 24); cen.writeUInt16LE(n.length, 28); cen.writeUInt32LE(off, 42);
    parts.push(loc, n, comp); central.push(cen, n);
    off += 30 + n.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...parts, cd, end]));
}

// --------------------------------------------------------------------------------------------------------- parsing

test('Tinder data.json: one thread per match with words, gifs dropped, HTML unescaped, empty matches skipped', () => {
  const t = parseTinder(TINDER);
  assert.equal(t.length, 2);
  const robin = t[1];
  assert.deepEqual(robin.lines.map(l => l.text), ['Hi Robin! Your dog photo made my day', 'I don’t usually do this, but drinks on Saturday?', 'See you at 8']);
  assert.ok(robin.lines.every(l => l.mine === true), 'the export only holds the person’s own messages');
  assert.equal(robin.matchedAt, null, 'Tinder gives no match date per match');
  assert.equal(robin.lines[0].at, Date.UTC(2023, 2, 2, 19, 10));
});

test('Hinge matches.json: matched threads only, like comments and chats are the person’s, we met is read', () => {
  const t = parseHinge(HINGE);
  assert.equal(t.length, 2, 'the like that never matched is not a story');
  assert.equal(t[0].matchedAt, Date.UTC(2024, 4, 10, 21, 30));
  assert.deepEqual(t[0].lines.map(l => l.text), ['Best taco take I have read', 'So where are these tacos', 'Coffee on Sunday?']);
  assert.equal(t[0].weMet, Date.UTC(2024, 4, 20, 12));
  assert.equal(t[1].lines.length, 0);
});

test('An unverified format is tried generically, and a side is only trusted when the export says so', () => {
  const t = parseGeneric(GENERIC);
  assert.equal(t.length, 1);
  assert.deepEqual(t[0].lines.map(l => [l.text, l.mine]), [['Hello from the generic side', true], ['Hi back', null]]);
  assert.equal(parseExportJson(TINDER)?.app, 'tinder');
  assert.equal(parseExportJson(HINGE)?.app, 'hinge');
  assert.equal(parseExportJson(GENERIC)?.app, 'generic');
  assert.equal(parseExportJson({ User: { name: 'x' } }), null);
});

test('Times and text from exports', () => {
  assert.equal(toTime('2024-05-10 21:30:00'), Date.UTC(2024, 4, 10, 21, 30));
  assert.equal(toTime('Tue, 30 Nov 2021 05:08:21 GMT'), Date.UTC(2021, 10, 30, 5, 8, 21));
  assert.equal(toTime(1_600_000_000), 1_600_000_000_000);
  assert.equal(toTime('soon'), null);
  assert.equal(unescapeHtml('it&#39;s <b>you</b> &amp; me'), "it's you & me");
});

test('A dropped ZIP is opened on the device: the Tinder file inside is found and read', async () => {
  const z = zip({ 'index.html': '<html></html>', 'photos/readme.txt': 'x', 'data.json': JSON.stringify(TINDER) });
  assert.ok(isZip(z));
  assert.deepEqual(listZip(z).map(e => e.name), ['index.html', 'photos/readme.txt', 'data.json']);
  const r = await readExport([{ name: 'export.zip', bytes: z }]);
  assert.equal(r?.app, 'tinder');
  assert.equal(r?.threads.length, 2);
  const h = await readExport([{ name: 'hinge.zip', bytes: zip({ 'export/user.json': '{"profile":{}}', 'export/matches.json': JSON.stringify(HINGE) }) }]);
  assert.equal(h?.app, 'hinge');
  const plain = await readExport([{ name: 'matches.json', bytes: new TextEncoder().encode(JSON.stringify(HINGE)) }]);
  assert.equal(plain?.app, 'hinge');
  assert.equal(await readExport([{ name: 'notes.json', bytes: new TextEncoder().encode('not json') }]), null);
});

// ------------------------------------------------------------------------------------------------- picking the match

test('The partner’s match comes first: their name in the person’s lines, the day they remember, Hinge’s we met', () => {
  const threads = parseTinder(TINDER);
  assert.equal(rankMatches(threads, { partnerName: 'Robin Ito' })[0].id, threads[1].id);
  assert.equal(rankMatches(threads, { around: Date.UTC(2023, 0, 5), partnerName: 'Nobody' })[0].id, threads[0].id);
  assert.equal(rankMatches(threads, { words: 'dog photo' })[0].id, threads[1].id);
  const h = parseHinge(HINGE);
  const top = rankMatches(h)[0];
  assert.equal(top.id, h[0].id);
  assert.equal(top.weMet, true);
  assert.equal(top.preview, 'Best taco take I have read');
});

test('After picking, every other match is let go: nothing of them is left in what the import held', () => {
  const r = parseExportJson(TINDER)!;
  const want = r.threads[1].id;
  const kept = keepOnly(r, want)!;
  assert.equal(kept.id, want);
  assert.equal(r.threads.length, 0, 'the other matches are dropped from memory');
  assert.ok(!JSON.stringify(kept).includes('hey there'), 'another match’s words are not carried along');
  assert.equal(keepOnly(parseExportJson(TINDER)!, 'missing'), null);
});

test('First-date planning and the opening lines', () => {
  const t = parseTinder(TINDER)[1];
  assert.equal(firstPlanLine(t.lines)?.text, 'I don’t usually do this, but drinks on Saturday?');
  assert.equal(firstPlanLine([{ at: 1, text: '今度ご飯行きませんか', mine: null }])?.text, '今度ご飯行きませんか');
  assert.equal(firstPlanLine([{ at: 1, text: '周末一起喝咖啡吗', mine: null }])?.text, '周末一起喝咖啡吗');
  assert.equal(firstPlanLine([{ at: 1, text: 'nice to meet', mine: null }]), null);
  assert.equal(openingLines(t.lines, 1).length, 2, 'the plan line joins the first lines');
});

// ---------------------------------------------------------------------------------------------------------- saving

test('The chapter: own lines in the entry, anything else waits for the partner, the day we matched for Bella', () => {
  const app = appById('hinge')!;
  const rows = chapterRows({ userId: 'u1', circleId: 'c1', shared: true, app, showApp: true, matchedDay: '2024-05-10', title: 'How we met', text: 'We matched on Hinge on 10 May 2024.', dayLabel: 'The day we matched',
    lines: [{ at: 1, text: 'So where are these tacos', mine: true }, { at: 2, text: 'Right behind you', mine: null }] });
  assert.deepEqual(rows.entry.tags, ['circle:c1', FROM_DATING_APP, 'dating_app:hinge']);
  assert.ok(rows.entry.content.includes('“So where are these tacos”'));
  assert.ok(!rows.entry.content.includes('Right behind you'), 'the partner’s words never go straight into the story');
  assert.deepEqual(rows.pending?.lines, ['Right behind you']);
  assert.deepEqual(rows.occasion, { user_id: 'u1', kind: 'anniversary', label: 'The day we matched', month: 5, day: 10, year: 2024, repeats_yearly: true, source: 'app' });
  assert.equal(rows.entry.date, '2024-05-10T12:00:00.000Z');
  const mineOnly = chapterRows({ userId: 'u1', circleId: 'c1', shared: false, app, showApp: true, matchedDay: null, title: 't', text: 'x', dayLabel: 'd', lines: [{ at: Date.UTC(2024, 0, 2, 12), text: 'hi', mine: true }] });
  assert.equal(mineOnly.pending, null);
  assert.equal(mineOnly.occasion, null);
  assert.equal(mineOnly.entry.is_shared, false);
});

test('Discreet mode: the app’s name stays out of the story unless they show it, and Grindr-like apps never by default', () => {
  const tinder = appById('tinder')!, grindr = appById('grindr')!, blued = appById('blued')!;
  assert.equal(showAppByDefault(tinder, false), true);
  assert.equal(showAppByDefault(tinder, true), false);
  assert.equal(showAppByDefault(grindr, false), false);
  assert.equal(showAppByDefault(blued, false), false);
  const hidden = chapterRows({ userId: 'u', circleId: 'c1', shared: true, app: grindr, showApp: false, matchedDay: '2023-01-02', title: 'How we met', text: 'We matched on 2 January 2023.', dayLabel: 'The day we matched', lines: [] });
  assert.ok(!JSON.stringify(hidden).toLowerCase().includes('grindr'), 'no trace of the app anywhere in what is saved');
  assert.deepEqual(hidden.entry.tags, ['circle:c1', FROM_DATING_APP]);
  assert.equal(discreetOn('AE', null), true);
  assert.equal(discreetOn('AE', 'off'), false);
  assert.equal(discreetOn('US', null), false);
  assert.equal(discreetOn('US', 'on'), true);
  assert.equal(DISCREET_DEFAULT.size, 22);
});

test('The partner approves their own words; the person who brought them can’t, and a no forgets them', () => {
  const a: StoryApproval = { id: 'a1', owner_id: 'u1', partner_id: null, title: 'How we met', lines: ['Right behind you'], day: '2024-05-10', status: 'pending' };
  assert.equal(inSharedStory(a), false);
  assert.equal(canDecide(a, 'u1', 'u2'), false, 'not the owner');
  assert.equal(canDecide(a, 'u3', 'u2'), false, 'not a stranger');
  assert.equal(canDecide(a, 'u2', 'u2'), true);
  assert.throws(() => decide(a, 'u1', 'u2', true));
  const yes = decide(a, 'u2', 'u2', true, new Date('2024-06-01T00:00:00Z'));
  assert.equal(yes.status, 'approved');
  assert.equal(inSharedStory(yes), true);
  assert.equal(yes.partner_id, 'u2');
  assert.equal(canDecide(yes, 'u2', 'u2'), false, 'only once');
  const no = decide(a, 'u2', 'u2', false);
  assert.equal(no.status, 'declined');
  assert.deepEqual(no.lines, []);
  assert.equal(inSharedStory(no), false);
  const views = approvalsFor([a], 'u2', () => 'u2');
  assert.equal(views.toDecide.length, 1);
  assert.equal(approvalsFor([a], 'u1', () => 'u2').waiting.length, 1);
});

// ------------------------------------------------------------------------------------------------------ screenshots

test('A match screenshot: the app, the day, and the chat lines without the phone’s chrome', () => {
  const taken = Date.UTC(2025, 2, 20, 12);
  const r = readDatingShot(['9:41', '87%', 'Tinder', "It's a Match!", 'You and Sam liked each other', 'Mar 18', 'Hey! Love your hiking photos', 'Type a message', 'Send'], taken);
  assert.equal(r.app?.id, 'tinder');
  assert.equal(r.isMatch, true);
  assert.equal(r.day, '2025-03-18');
  assert.deepEqual(r.lines, ['Hey! Love your hiking photos'], 'the match banner is the app talking, not them');
  const cn = readDatingShot(['探探', '配对成功', '周末一起喝咖啡吗'], taken);
  assert.equal(cn.app?.id, 'tantan');
  assert.equal(cn.isMatch, true);
  assert.deepEqual(cn.lines, ['周末一起喝咖啡吗']);
  assert.equal(readDatingShot(['Pairs', 'マッチングしました'], taken).app?.id, 'pairs');
  assert.equal(readDatingShot(['verification code 123456'], taken).lines.length, 0);
  assert.equal(pastDay('Dec 30', Date.UTC(2025, 0, 5)), '2024-12-30', 'a chat date is in the past');
});

test('Several screenshots make one story; every line from a screenshot waits for the partner', () => {
  const s = storyFromShots([
    { lines: ['Soul', 'Morning! Did you sleep well', 'Want to grab lunch'], takenAt: Date.UTC(2024, 9, 2, 9) },
    { lines: ['Soul', '灵魂匹配', '配对成功'], takenAt: Date.UTC(2024, 9, 1, 22) },
  ]);
  assert.equal(s.app?.id, 'soul');
  const local = new Date(Date.UTC(2024, 9, 1, 22));
  assert.equal(s.matchedDay, `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`, 'the match screen was taken that day');
  assert.ok(s.lines.every(l => l.mine === null));
  const rows = chapterRows({ userId: 'u', circleId: 'c1', shared: true, app: s.app, showApp: true, matchedDay: s.matchedDay, title: 'How we met', text: 'x', dayLabel: 'd', lines: s.lines });
  assert.equal(rows.pending?.lines.length, 2);
});

// ------------------------------------------------------------------------------------------------- the localized list

test('The apps where the reader lives come first; every listed app exists; local names', () => {
  assert.deepEqual(appsFor('JP').slice(0, 3).map(x => x.name), ['Pairs', 'タップル', 'with']);
  assert.deepEqual(appsFor('CN').slice(0, 3).map(x => x.id), ['momo', 'soul', 'tantan']);
  assert.equal(appsFor('ZZ')[0].id, 'tinder');
  assert.equal(appsFor('US').length, DATING_APPS.length, 'every app is still reachable');
  for (const [c, ids] of Object.entries(LOCAL_DATING)) for (const id of ids) assert.ok(appById(id), `${c} lists unknown ${id}`);
  assert.equal(new Set(DATING_APPS.map(x => x.id)).size, DATING_APPS.length);
  assert.equal(datingCountry(['en-US'], 'Asia/Kolkata'), 'IN');
  assert.equal(datingCountry(['en-SG'], ''), 'SG');
  assert.equal(datingCountry(['en'], '', 'OTHER'), 'WORLD');
  assert.equal(datingCountry(['en-US'], 'Asia/Riyadh'), 'SA', 'discreet mode finds the markets where it is the default');
  assert.equal(discreetOn(datingCountry(['ar'], 'Asia/Kuala_Lumpur'), null), true);
  assert.equal(appsFor('SA')[0].id, 'tinder');
  assert.equal(appInText('matched on Bumble'), appById('bumble'));
  assert.equal(appInText('nothing here'), null);
});
