// Bella confirms bookings herself: the call's result, the shop's order confirmation, one follow-up when nothing can
// come back, and never a purchase without the person's yes for that item at that price.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  confirmVia, decideCall, callLine, parseOrder, sameShop, spendAllowed, followUpDue, followUpAsk, readAnswer,
  readConfirmation, matchBooking, doneHeadline, discreetLine, partnerLine,
} from '../supabase/functions/_shared/confirms.ts';
import { parseCallReport } from '../supabase/functions/_shared/vapi.ts';
import { spendGuard, checkoutOrder } from '../supabase/functions/_shared/shopcheckout.ts';
import { verifyOrderWebhook, agentProfile } from '../supabase/functions/_shared/ucpsig.ts';
import { keptWhatMatters } from '../supabase/functions/_shared/localize.ts';

const TZ = 'America/New_York';
const table = { kind: 'table', title: 'Dinner in Williamsburg', place: 'Lilia', starts_at: '2026-10-24T23:45:00.000Z', people: 2, surprise: false };   // 7:45 PM

test('Call booked: booked with the confirmed time, party size and reference, said plainly', () => {
  const o = parseCallReport({ message: { type: 'end-of-call-report', endedReason: 'customer-ended-call', call: { id: 'c1', metadata: { booking_id: 'b1' } },
    analysis: { structuredData: { booked: true, confirmed_time: '20:00', party_size: 2, confirmation: '#4KD9' } } } })!;
  assert.equal(o.people, 2);
  assert.equal(o.ref, '4KD9');
  const d = decideCall(table, o, TZ);
  assert.equal(d.state, 'booked');
  if (d.state !== 'booked') return;
  assert.equal(d.starts_at, '2026-10-25T00:00:00.000Z', 'the time they confirmed, same day');
  assert.equal(d.movedMinutes, 15);
  assert.equal(d.people, 2);
  assert.equal(d.ref, '4KD9');
  assert.match(callLine(table, d, TZ, '', null), /couldn't do 7:45 PM, so I took 8:00 PM\./);
  assert.doesNotMatch(callLine(table, d, TZ, '', null), /somewhere else/, 'within half an hour, no second guess');
  const head = doneHeadline(table, { by: 'bella', people: d.people, ref: d.ref }, 'Sat, Oct 24 at 8:00 PM', 'Mia', 'Dan');
  assert.equal(head, 'Booked by Bella: Lilia, Sat, Oct 24 at 8:00 PM, table for 2 under Dan, ref 4KD9.');
  assert.equal(confirmVia({ kind: 'table', phone: '+17185763095', call_status: 'ready' }), 'call');
});

test('Call booked at a time well off what was asked: she says so and offers to look again', () => {
  const d = decideCall(table, { booked: true, time: '21:30', people: 4, ref: null, alternative: null, notes: null, reason: 'ended' }, TZ);
  assert.equal(d.state, 'booked');
  const line = callLine(table, d, TZ, '', null);
  assert.match(line, /so I took 9:30 PM/);
  assert.match(line, /look for 7:45 PM somewhere else\?/);
  assert.match(line, /down for 4, not 2/);
});

test('Call failed: nothing is booked, she says why and offers the next option', () => {
  const o = parseCallReport({ message: { type: 'end-of-call-report', endedReason: 'customer-ended-call', call: { id: 'c2' }, analysis: { structuredData: { booked: false, alternative: '9:15', confirmed_time: '21:15', confirmation: 'X123' } } } })!;
  const d = decideCall(table, o, TZ);
  assert.deepEqual(d, { state: 'failed', alternative: '9:15', offerNext: true });
  const line = callLine(table, d, TZ, "they couldn't do that time", null);
  assert.match(line, /nothing is booked/);
  assert.match(line, /find another spot, or take 9:15 there\?/);
  assert.doesNotMatch(line, /Booked/);
  // A booked: true that isn't strictly true is never a booking
  assert.equal(decideCall(table, { ...o, booked: 'yes' as any }, TZ).state, 'failed');
  assert.equal(confirmVia({ kind: 'table', phone: '+17185763095', call_status: 'failed' }), 'ask', 'after a failed call, the tap comes back');
});

test('Order confirmed by the shop: ordered with the order number and delivery day', () => {
  const event = { id: 'gid://shopify/Order/5551042', checkout_id: 'co_abc', label: '#1042', line_items: [{ id: 'l1', status: 'processing' }],
    fulfillment: { expectations: [{ id: 'e1', description: 'Local delivery', estimated_delivery: { earliest: '2026-10-23T09:00:00Z', latest: '2026-10-24T18:00:00Z' } }], events: [] }, totals: [] };
  assert.deepEqual(parseOrder(event), { orderId: 'gid://shopify/Order/5551042', checkoutId: 'co_abc', ref: '1042', deliveryOn: '2026-10-24', canceled: false });
  assert.equal(parseOrder({ order: event })?.ref, '1042', 'wrapped as { order }');
  // The checkout Bella opened, coming back completed from Shop
  const done = { result: { structuredContent: { id: 'co_abc', status: 'completed', order: { id: 'gid://shopify/Order/77', permalink_url: 'https://shop/o/77' } } } };
  assert.deepEqual(parseOrder(done), { orderId: 'gid://shopify/Order/77', checkoutId: 'co_abc', ref: '77', deliveryOn: null, canceled: false });
  assert.equal(parseOrder({ ...event, adjustments: [{ type: 'cancellation', status: 'completed' }] })?.canceled, true);
  const flowers = { kind: 'flowers', title: 'Peonies for Mia', place: null, surprise: true };
  assert.equal(doneHeadline(flowers, { by: 'bella', ref: '1042', seller: 'Bloom & Co' }, 'Sat, Oct 24', 'Mia', 'Dan'), 'Ordered and confirmed by Bloom & Co: Peonies for Mia, arriving Sat, Oct 24, order 1042.');
  assert.equal(discreetLine(flowers, 'Ordered: Peonies for Mia'), 'Your surprise is confirmed. The details are in Belluh.', 'nothing on a lock screen gives a surprise away');
  assert.equal(confirmVia({ kind: 'flowers', checkout: true }), 'checkout');
});

test('Order webhook: only a signed, fresh event from the shop the checkout was opened at', async () => {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
  const profileUrl = 'https://bloomandco.com/.well-known/ucp';
  const body = JSON.stringify({ id: 'gid://shopify/Order/1', checkout_id: 'co_abc', label: '#1001' });
  const digest = `sha-256=:${Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))).toString('base64')}:`;
  const now = 1_800_000_000_000, created = now / 1000;
  const params = `("@method" "@authority" "@path" "content-digest" "content-type");created=${created};keyid="store-2026";alg="ecdsa-p256-sha256"`;
  const base = [`"@method": POST`, `"@authority": abc.supabase.co`, `"@path": /functions/v1/order-webhook`, `"content-digest": ${digest}`, `"content-type": application/json`, `"@signature-params": ${params}`].join('\n');
  const sig = Buffer.from(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, new TextEncoder().encode(base))).toString('base64');
  const headers = { 'ucp-agent': `profile="${profileUrl}"`, 'content-digest': digest, 'content-type': 'application/json', 'signature-input': `sig1=${params}`, signature: `sig1=:${sig}:`, 'webhook-id': 'evt_1', 'webhook-timestamp': String(created) };
  const fetchProfile = async (u: string) => { assert.equal(u, profileUrl); return { ucp: { version: '2026-08-25' }, signing_keys: [{ ...jwk, kid: 'store-2026' }] }; };
  const delivery = { method: 'POST', authority: 'abc.supabase.co', path: '/functions/v1/order-webhook', headers, body };
  const ok = await verifyOrderWebhook(delivery, fetchProfile, now);
  assert.deepEqual(ok, { ok: true, profile: profileUrl });
  assert.equal((await verifyOrderWebhook({ ...delivery, body: body.replace('1001', '9999') }, fetchProfile, now)).ok, false, 'a changed body');
  assert.equal((await verifyOrderWebhook(delivery, fetchProfile, now + 20 * 60_000)).ok, false, 'a replay later');
  assert.equal((await verifyOrderWebhook({ ...delivery, path: '/other' }, fetchProfile, now)).ok, false);
  const other = await crypto.subtle.exportKey('jwk', (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])).publicKey);
  assert.equal((await verifyOrderWebhook(delivery, async () => ({ signing_keys: [{ ...other, kid: 'store-2026' }] }), now)).ok, false, 'someone else\'s key');
  // A valid signature from another shop still can't confirm this checkout
  assert.equal(sameShop(profileUrl, 'bloomandco.com'), true);
  assert.equal(sameShop('https://shop.bloomandco.com/.well-known/ucp', 'bloomandco.com'), true);
  assert.equal(sameShop('https://evil.example/.well-known/ucp', 'bloomandco.com'), false);
  assert.equal(sameShop('https://bloomandco.com.evil.example/x', 'bloomandco.com'), false);
  assert.equal(sameShop('http://bloomandco.com/x', 'bloomandco.com'), false);
  assert.equal(agentProfile('profile="https://a.com/p"'), 'https://a.com/p');
});

test('No confirmation: it stays prepared, and Bella asks once whether it went through', () => {
  // An outside link gives nothing back: the tap stays
  assert.equal(confirmVia({ kind: 'experience' }), 'ask');
  // A checkout that isn't paid yet is no order
  assert.equal(parseOrder({ result: { structuredContent: { id: 'co_1', status: 'ready_for_complete' } } }), null);
  assert.equal(parseOrder({ result: { structuredContent: { id: 'co_1', status: 'completed' } } }), null, 'completed without an order is not trusted');
  assert.equal(parseOrder(null), null);
  const made = new Date('2026-10-20T12:00:00Z');
  const tickets = { kind: 'experience', title: 'Phoebe Bridgers', status: 'prepared', confirm_via: 'ask' as const, created_at: made.toISOString(), starts_at: '2026-10-30T00:00:00Z', follow_up_at: null };
  const at = (h: number) => new Date(made.getTime() + h * 3600_000);
  assert.equal(followUpDue(tickets, at(2)), false, 'not straight away');
  assert.equal(followUpDue(tickets, at(19)), false);
  assert.equal(followUpDue(tickets, at(21)), true, 'the next day');
  assert.equal(followUpDue({ ...tickets, follow_up_at: at(21).toISOString() }, at(30)), false, 'only once');
  assert.equal(followUpDue({ ...tickets, status: 'booked' }, at(21)), false);
  assert.equal(followUpDue({ ...tickets, status: 'dismissed' }, at(21)), false);
  assert.equal(followUpDue({ ...tickets, starts_at: at(8).toISOString() }, at(5)), true, 'sooner when it is coming up');
  assert.equal(followUpDue({ ...tickets, starts_at: at(4).toISOString() }, at(2)), false, 'never before three hours');
  assert.equal(followUpDue({ ...tickets, call_status: 'calling' }, at(21)), false, 'not while Bella is on the phone');
  assert.equal(followUpDue({ ...tickets, confirm_via: 'checkout' }, at(21)), false, 'a shop order waits a day for the shop');
  assert.equal(followUpDue({ ...tickets, confirm_via: 'checkout' }, at(25)), true);
  assert.equal(followUpDue(tickets, at(8 * 24)), false, 'never over a week later');
  assert.equal(followUpAsk(tickets, false), "Did the tickets for Phoebe Bridgers go through? Tell me if it did and I'll add it to your calendar and set a reminder.");
  assert.match(followUpAsk({ kind: 'gift', title: 'Le Labo Santal 33' }, true), /Reply ORDERED if it did/);
  assert.equal(followUpAsk({ kind: 'gift', title: 'Le Labo Santal 33', surprise: true }, true).startsWith('Did your surprise go through?'), true);
  assert.ok(keptWhatMatters('Reply BOOKED if it did', 'Réponds BOOKED si c’est bon'));
  assert.ok(!keptWhatMatters('Reply BOOKED if it did', 'Réponds RÉSERVÉ si c’est bon'), 'the reply word survives translation');
  assert.equal(readAnswer('Yes! it went through'), 'yes');
  assert.equal(readAnswer('not yet'), 'not_yet');
  assert.equal(readAnswer("No, we didn't go"), 'no');
  assert.equal(readAnswer('what time is it'), null);
});

test('A forwarded confirmation: the number, time and party size, and which booking it is', () => {
  const email = 'Your reservation is confirmed! Lilia, Saturday October 24 at 8:00 PM, party of 2. Confirmation number: 4KD9-22. See you soon.';
  assert.deepEqual(readConfirmation(email), { ref: '4KD9-22', time: '20:00', people: 2 });
  assert.deepEqual(readConfirmation('Order #10423 placed. Arrives Friday.'), { ref: '10423', time: null, people: null });
  assert.deepEqual(readConfirmation('Booked for 7pm, 4 guests'), { ref: null, time: '19:00', people: 4 });
  assert.equal(readConfirmation('Thanks for your order, see you').ref, null, 'no number is made up');
  const waiting = [{ id: 'a', title: 'Dinner in Williamsburg', place: 'Lilia' }, { id: 'b', title: 'Phoebe Bridgers', place: 'Forest Hills' }];
  assert.equal(matchBooking(email, waiting)?.id, 'a');
  assert.equal(matchBooking('Tickets: Phoebe Bridgers, Sec 104', waiting)?.id, 'b');
  assert.equal(matchBooking('confirmed!', waiting), null, 'ambiguous: ask which');
  assert.equal(matchBooking('confirmed!', [waiting[0]])?.id, 'a', 'the only one waiting');
  const done = doneHeadline({ kind: 'table', title: 'Dinner in Williamsburg', place: 'Lilia', surprise: false }, { by: 'person', ref: '4KD9-22', people: 2 }, 'Sat, Oct 24 at 8:00 PM', 'Mia', 'Dan');
  assert.equal(done, 'Booked: Lilia, Sat, Oct 24 at 8:00 PM, table for 2, ref 4KD9-22.', 'they booked it; Bella does not take the credit');
  assert.equal(partnerLine({ kind: 'table', title: 'Dinner', place: 'Lilia' }, { by: 'bella' }, 'Sat, Oct 24 at 8:00 PM', 'Dan'), "Bella booked Lilia for you and Dan, Sat, Oct 24 at 8:00 PM. It's in both your calendars and I'll remind you both.");
});

test('No spending without an explicit yes for that item at that price', async () => {
  const now = new Date('2026-10-20T12:00:00Z');
  const ask = { booking_id: 'b1', item: 'Peonies, a dozen', cents: 10646 };
  const yes = { booking_id: 'b1', item: 'peonies a dozen', cents: 10646, at: '2026-10-20T11:50:00Z' };
  assert.equal(spendAllowed(null, ask, now), false, 'no approval');
  assert.equal(spendAllowed(undefined, ask, now), false);
  assert.equal(spendAllowed(yes, ask, now), true, 'their yes for this item at this price');
  assert.equal(spendAllowed(yes, { ...ask, cents: 10647 }, now), false, 'a cent more than they saw');
  assert.equal(spendAllowed(yes, { ...ask, item: 'Roses, a dozen' }, now), false, 'a different item');
  assert.equal(spendAllowed(yes, { ...ask, booking_id: 'b2' }, now), false, 'a different booking');
  assert.equal(spendAllowed({ ...yes, at: '2026-10-18T11:50:00Z' }, ask, now), false, 'a stale yes');
  assert.equal(spendAllowed({ ...yes, at: '2026-10-20T13:00:00Z' }, ask, now), false, 'a yes from the future');
  // At the network boundary: nothing that charges goes out to Shop without that yes
  assert.equal(spendGuard('complete_checkout'), false);
  assert.equal(spendGuard('complete_checkout', { given: null, ask }, now), false);
  assert.equal(spendGuard('complete_checkout', { given: yes, ask }, now), true);
  assert.equal(spendGuard('get_checkout'), true, 'reading a checkout is fine');
  assert.equal(spendGuard('create_checkout'), true, 'a checkout the person pays for themselves is fine');
  // Checking on an order only reads it
  const calls: string[] = [];
  const fake: typeof fetch = async (_u, init) => { const b = JSON.parse(String(init?.body)); calls.push(b.params.name);
    return new Response(JSON.stringify({ result: { structuredContent: { id: 'co_abc', status: 'completed', order: { id: 'gid://shopify/Order/9', label: '#1009' } } } })); };
  assert.deepEqual(await checkoutOrder('bloomandco.com', 'co_abc', fake), { orderId: 'gid://shopify/Order/9', checkoutId: 'co_abc', ref: '1009', deliveryOn: null, canceled: false });
  assert.deepEqual(calls, ['get_checkout']);
  assert.equal(await checkoutOrder('bad shop/../', 'co_abc', fake), null);
});
