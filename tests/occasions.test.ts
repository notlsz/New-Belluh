import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  verifyMetaSignature, parseCommand, toE164, nextOccurrence, daysBetween, reminderStage,
  normalizeExtracted, localDateParts, savedReply, listReply, reminderParams, buildExtractionPrompt,
  type StoredOccasion,
} from '../supabase/functions/_shared/occasions.ts';

test('signature: accepts Meta HMAC, rejects tampering and junk', async () => {
  const body = '{"entry":[]}';
  const sig = 'sha256=' + createHmac('sha256', 'secret').update(body).digest('hex');
  assert.equal(await verifyMetaSignature(body, sig, 'secret'), true);
  assert.equal(await verifyMetaSignature(body + ' ', sig, 'secret'), false);
  assert.equal(await verifyMetaSignature(body, sig, 'other'), false);
  assert.equal(await verifyMetaSignature(body, null, 'secret'), false);
  assert.equal(await verifyMetaSignature(body, 'sha256=zz', 'secret'), false);
  assert.equal(await verifyMetaSignature(body, sig, ''), false);
});

test('commands', () => {
  assert.deepEqual(parseCommand('LINK ab3k9z'), { type: 'link', code: 'AB3K9Z' });
  assert.deepEqual(parseCommand(' list '), { type: 'list' });
  assert.deepEqual(parseCommand('forget Maya’s birthday'), { type: 'forget', query: 'Maya’s birthday' });
  assert.deepEqual(parseCommand('STOP'), { type: 'stop' });
  assert.deepEqual(parseCommand('start'), { type: 'start' });
  assert.deepEqual(parseCommand('help'), { type: 'help' });
  assert.deepEqual(parseCommand('hi'), { type: 'capture', text: 'hi' }, 'a hello goes to Belluh');
  assert.deepEqual(parseCommand('SEND'), { type: 'send_note' });
  assert.deepEqual(parseCommand("don't send"), { type: 'discard_note' });
  assert.deepEqual(parseCommand('2'), { type: 'pick', option: 2 });
  assert.deepEqual(parseCommand('option 1.'), { type: 'pick', option: 1 });
  assert.deepEqual(parseCommand('NONE'), { type: 'none', note: '' });
  assert.deepEqual(parseCommand('none of these work, next week?'), { type: 'none', note: 'next week?' });
  assert.deepEqual(parseCommand('Did it!'), { type: 'checkin', status: 'done' });
  assert.deepEqual(parseCommand('not yet'), { type: 'checkin', status: 'not_yet' });
  assert.deepEqual(parseCommand('4'), { type: 'capture', text: '4' });
  assert.equal(parseCommand('nonetheless I love him').type, 'capture');
  assert.deepEqual(parseCommand("Maya's birthday is May 12"), { type: 'capture', text: "Maya's birthday is May 12" });
  assert.equal(parseCommand('link to the photos from our trip').type, 'capture');
  assert.equal(toE164('15551234567'), '+15551234567');
});

test('next occurrence: this year, next year, today, leap day, one-offs', () => {
  const today = { y: 2026, m: 10, d: 12 };
  const yearly = { year: null, repeats_yearly: true };
  assert.deepEqual(nextOccurrence({ ...yearly, month: 12, day: 25 }, today), { y: 2026, m: 12, d: 25 });
  assert.deepEqual(nextOccurrence({ ...yearly, month: 5, day: 12 }, today), { y: 2027, m: 5, d: 12 });
  assert.deepEqual(nextOccurrence({ ...yearly, month: 10, day: 12 }, today), { y: 2026, m: 10, d: 12 });
  assert.deepEqual(nextOccurrence({ ...yearly, month: 2, day: 29 }, today), { y: 2027, m: 2, d: 28 });
  assert.deepEqual(nextOccurrence({ ...yearly, month: 2, day: 29 }, { y: 2027, m: 3, d: 1 }), { y: 2028, m: 2, d: 29 });
  assert.deepEqual(nextOccurrence({ month: 11, day: 3, year: 2026, repeats_yearly: false }, today), { y: 2026, m: 11, d: 3 });
  assert.equal(nextOccurrence({ month: 1, day: 3, year: 2026, repeats_yearly: false }, today), null);
  assert.equal(daysBetween({ y: 2026, m: 12, d: 31 }, { y: 2027, m: 1, d: 7 }), 7);
});

test('reminder stages', () => {
  assert.equal(reminderStage(7), 'week_before');
  assert.equal(reminderStage(0), 'day_of');
  assert.equal(reminderStage(3), null);
});

test('local date follows the time zone, not UTC', () => {
  const instant = new Date('2026-10-13T02:30:00Z'); // 10:30 pm Oct 12 in New York
  assert.deepEqual(localDateParts(instant, 'America/New_York'), { y: 2026, m: 10, d: 12, hour: 22 });
  assert.deepEqual(localDateParts(instant, 'Asia/Tokyo'), { y: 2026, m: 10, d: 13, hour: 11 });
});

test('extraction output is validated, never trusted', () => {
  const out = normalizeExtracted({
    occasions: [
      { label: "  Maya's   birthday ", kind: 'birthday', month: 5, day: 12, repeats_yearly: true },
      { label: 'Leap', kind: 'birthday', month: 2, day: 29, year: null, repeats_yearly: true },
      { label: 'Bad day', kind: 'other', month: 2, day: 30, repeats_yearly: true },
      { label: 'Bad month', kind: 'other', month: 13, day: 1, repeats_yearly: true },
      { label: '', kind: 'other', month: 1, day: 1, repeats_yearly: true },
      { label: 'Trip', kind: 'spaceship', month: 11, day: 3, year: 2026, repeats_yearly: false },
      { label: 'No year one-off', kind: 'trip', month: 11, day: 3, repeats_yearly: false },
    ],
  });
  assert.deepEqual(out.map(o => o.label), ["Maya's birthday", 'Leap', 'Trip', 'No year one-off']);
  assert.equal(out[2].kind, 'other');
  assert.equal(out[3].repeats_yearly, true);
  assert.deepEqual(normalizeExtracted(null), []);
  assert.deepEqual(normalizeExtracted({ occasions: 'nope' }), []);
});

const maya: StoredOccasion = {
  id: '1', label: "Maya's birthday", kind: 'birthday', month: 5, day: 12, year: null,
  repeats_yearly: true, mentioned_at: '2026-03-03T15:00:00Z',
};

test('replies say what was saved and when it was first mentioned', () => {
  const r = savedReply([maya], [{ label: 'Our anniversary', mentioned_at: '2026-01-20T15:00:00Z' }], 'America/New_York');
  assert.match(r, /Saved: Maya's birthday, May 12 ✓/);
  assert.match(r, /Already saved: Our anniversary \(you told me on Jan 20, 2026\)/);
  const l = listReply([maya, { ...maya, id: '2', label: 'Halloween', month: 10, day: 31 }], { y: 2026, m: 10, d: 12 }, 'America/New_York');
  assert.ok(l.indexOf('Halloween') < l.indexOf("Maya's birthday"), 'soonest first');
  assert.match(l, /You told me on Mar 3, 2026/);
  assert.match(listReply([], { y: 2026, m: 10, d: 12 }, 'UTC'), /don't have any dates yet/);
});

test('reminder template parameters', () => {
  assert.deepEqual(reminderParams(maya, 'week_before', 'America/New_York'), ["Maya's birthday", 'in one week', 'May 12', 'Mar 3, 2026']);
  assert.equal(reminderParams(maya, 'day_of', 'America/New_York')[1], 'today');
});

test('prompt anchors relative dates to today and caps length', () => {
  const p = buildExtractionPrompt('x'.repeat(5000), { y: 2026, m: 10, d: 12 });
  assert.match(p, /Today is 2026-10-12/);
  assert.ok(p.length < 3000);
});
