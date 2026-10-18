// iMessage (Linq) signatures and events, and what comes back from a restaurant call (Vapi).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyLinq, parseLinqEvent } from '../supabase/functions/_shared/linq.ts';
import { parseCallReport, whyNot, toE164, okToCallNow, callPrompt } from '../supabase/functions/_shared/vapi.ts';
import { parseCommand } from '../supabase/functions/_shared/occasions.ts';

const SECRET = 'whsec_' + Buffer.from('a-signing-secret-for-tests').toString('base64');
const sign = (id: string, ts: string, body: string) => 'v1,' + crypto.createHmac('sha256', Buffer.from(SECRET.slice(6), 'base64')).update(`${id}.${ts}.${body}`).digest('base64');

test('Linq: only a fresh delivery signed with our secret is accepted', async () => {
  const now = 1_800_000_000_000, ts = String(now / 1000), body = '{"event_type":"message.received"}';
  const h = { id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body) };
  assert.equal(await verifyLinq(body, h, SECRET, now), true);
  assert.equal(await verifyLinq(body, { ...h, signature: `v1,bogus ${h.signature}` }, SECRET, now), true, 'any listed signature may match');
  assert.equal(await verifyLinq(body + ' ', h, SECRET, now), false, 'a changed body fails');
  assert.equal(await verifyLinq(body, { ...h, id: 'msg_2' }, SECRET, now), false);
  assert.equal(await verifyLinq(body, h, SECRET, now + 6 * 60_000), false, 'older than five minutes fails');
  assert.equal(await verifyLinq(body, h, '', now), false, 'no secret, no entry');
  assert.equal(await verifyLinq(body, { ...h, signature: null }, SECRET, now), false);
});

test('Linq: inbound texts only, from a phone number or an Apple ID', () => {
  const ev = (data: object, event_type = 'message.received') => ({ event_type, data: { id: 'm1', direction: 'inbound', parts: [{ type: 'text', value: ' hi ' }], ...data } });
  assert.deepEqual(parseLinqEvent(ev({ sender_handle: { handle: '+15551234567' } })), { id: 'm1', from: '+15551234567', text: 'hi', kind: 'text' });
  assert.equal(parseLinqEvent(ev({ sender_handle: { handle: 'Ana@iCloud.com' } }))?.from, 'ana@icloud.com');
  assert.equal(parseLinqEvent(ev({ sender_handle: { handle: '+15551234567' }, direction: 'outbound' })), null, 'our own sends');
  assert.equal(parseLinqEvent(ev({ sender_handle: { handle: '+15551234567', is_me: true } })), null);
  assert.equal(parseLinqEvent(ev({ sender_handle: { handle: '+15551234567' } }, 'message.delivered')), null);
  assert.equal(parseLinqEvent(ev({ sender_handle: { handle: 'not a number' } })), null);
  assert.equal(parseLinqEvent(ev({ sender_handle: { handle: '+15551234567' }, parts: [{ type: 'media', url: 'https://x' }] }))?.kind, 'media');
});

test('Calls: the report says booked, the time, or why not', () => {
  const r = parseCallReport({ message: { type: 'end-of-call-report', endedReason: 'customer-ended-call', call: { id: 'c1', metadata: { booking_id: 'b1' } }, analysis: { structuredData: { booked: true, confirmed_time: '19:30', notes: 'Card needed to hold it' } } } });
  assert.deepEqual(r, { callId: 'c1', bookingId: 'b1', booked: true, time: '19:30', alternative: null, notes: 'Card needed to hold it', reason: 'customer-ended-call' });
  assert.equal(parseCallReport({ message: { type: 'end-of-call-report', call: { id: 'c1', analysis: { structuredData: { booked: true, confirmed_time: '7:30pm' } } } } })?.time, null, 'odd times are dropped');
  assert.equal(parseCallReport({ message: { type: 'status-update', call: { id: 'c1' } } }), null);
  assert.equal(parseCallReport({ message: { type: 'end-of-call-report', call: { id: 'c1' } } })?.booked, false, 'no data means not booked');
  assert.equal(whyNot({ reason: 'customer-did-not-answer', alternative: null }), 'nobody picked up');
  assert.equal(whyNot({ reason: 'voicemail', alternative: null }), 'it went to voicemail');
  assert.equal(whyNot({ reason: 'customer-ended-call', alternative: '9:15' }), "they couldn't do that time (closest was 9:15)");
});

test('Calls: numbers, hours and an honest opening line', () => {
  assert.equal(toE164('+1 408-555-0134'), '+14085550134');
  assert.equal(toE164('(408) 555-0134'), null, 'local numbers are not guessed');
  const noonNY = new Date('2026-10-20T16:00:00Z'), lateNY = new Date('2026-10-21T03:00:00Z');
  assert.equal(okToCallNow('America/New_York', noonNY), true);
  assert.equal(okToCallNow('America/New_York', lateNY), false, 'not at 11pm');
  const p = callPrompt({ bookingId: 'b', restaurant: 'Lilia', phone: '+1', name: 'Dan', people: 2, day: 'Saturday, October 24', time: '7:00 PM' });
  assert.match(p.first, /^Hi, this is Belluh, an AI assistant calling for Dan\./);
  assert.match(p.system, /Never pretend to be human/);
  assert.match(p.system, /credit card/);
});

test('Texting: CALL asks Belluh to phone the place', () => {
  for (const t of ['CALL', 'call them', 'Call for me', 'call it!']) assert.deepEqual(parseCommand(t), { type: 'call' }, t);
  assert.notDeepEqual(parseCommand('call mom tomorrow'), { type: 'call' });
});
