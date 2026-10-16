import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { parseTelegramUpdate, sameToken, webhookSecret, telegramChat, quickReplies } from '../supabase/functions/_shared/telegram.ts';
import { validateReminder, tableLinks, giftLinks } from '../supabase/functions/_shared/actions.ts';
import { occasionToOffer, offerFallback, offerAsk, plansToNudge, plansJustHappened, daytime, type NudgePlan, type OfferOccasion } from '../supabase/functions/_shared/nudges.ts';
import { parseCommand } from '../supabase/functions/_shared/occasions.ts';
import { validateToolCall } from '../supabase/functions/_shared/agent.ts';

const NY = 'America/New_York';

test('Telegram: only private chats from people; text, voice and photos are told apart', () => {
  const base = { update_id: 7, message: { message_id: 1, chat: { id: 42, type: 'private' }, from: { id: 42, is_bot: false }, text: 'hi' } };
  assert.deepEqual(parseTelegramUpdate(base), { updateId: 7, chatId: '42', text: 'hi', kind: 'text' });
  assert.equal(parseTelegramUpdate({ ...base, message: { ...base.message, chat: { id: -5, type: 'group' } } }), null);
  assert.equal(parseTelegramUpdate({ ...base, message: { ...base.message, from: { id: 9, is_bot: true } } }), null);
  assert.equal(parseTelegramUpdate({ update_id: 8, edited_message: base.message }), null, 'edits are not new messages');
  assert.equal(parseTelegramUpdate({ update_id: 9, message: { ...base.message, text: undefined, voice: {} } })?.kind, 'voice');
  assert.equal(parseTelegramUpdate(null), null);
});

test("Telegram: the webhook secret comes from the bot token (same as the deploy script's openssl) and is checked exactly", async () => {
  const s = await webhookSecret('123:abc');
  const shell = crypto.createHash('sha256').update('belluh-telegram:123:abc').digest('hex').slice(0, 48);
  assert.equal(s, shell);
  assert.ok(sameToken(s, s));
  assert.ok(!sameToken(s.slice(0, -1) + 'x', s));
  assert.ok(!sameToken(null, s));
  assert.ok(!sameToken('', ''));
  assert.equal(telegramChat('tg:42'), '42');
  assert.equal(telegramChat('+15551230000'), null);
});

test('Telegram: one-tap answers appear as buttons for notes, plans, check-ins and offers', () => {
  assert.deepEqual(quickReplies('Note to Dan:\n"hi"\n\nReply SEND to send it, or DISCARD.'), ['SEND', 'DISCARD']);
  assert.deepEqual(quickReplies('Pick a time:\n1) ...\n2) ...\n\nReply 1, 2, or NONE if none work.'), ['1', '2', 'NONE']);
  assert.deepEqual(quickReplies('Reply DID IT, NOT YET or SKIP.'), ['DID IT', 'NOT YET', 'SKIP']);
  assert.deepEqual(quickReplies("Dan's birthday is in 12 days.\n\nReply PLAN IT or NOT NOW."), ['PLAN IT', 'NOT NOW']);
  assert.equal(quickReplies('Just a reply.'), null);
});

test('Commands: Telegram links with /start <code>, its menu commands work, and offers can be answered by text', () => {
  assert.deepEqual(parseCommand('/start ab3k9z'), { type: 'link', code: 'AB3K9Z' });
  assert.deepEqual(parseCommand('/help'), { type: 'help' });
  assert.deepEqual(parseCommand('/list@BelluhBot'), { type: 'list' });
  assert.deepEqual(parseCommand('/stop'), { type: 'stop' });
  assert.deepEqual(parseCommand('/start'), { type: 'start' });
  assert.deepEqual(parseCommand('PLAN IT'), { type: 'offer', accept: true });
  assert.deepEqual(parseCommand('not now'), { type: 'offer', accept: false });
  assert.deepEqual(parseCommand('plan it for friday at 7 please'), { type: 'capture', text: 'plan it for friday at 7 please' });
  assert.deepEqual(parseCommand('LINK ab3k9z'), { type: 'link', code: 'AB3K9Z' }, 'WhatsApp and SMS linking unchanged');
});

test('Reminders Belluh sets: a short note at a future local time, within a year', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  assert.deepEqual(validateReminder({ text: 'Call his mom', at: '2026-10-18T17:00' }, NY, now), { body: 'Call his mom', due_at: '2026-10-18T21:00:00.000Z' });
  assert.equal(validateReminder({ text: 'Call his mom', at: '2026-10-14T17:00' }, NY, now), null, 'past');
  assert.equal(validateReminder({ text: 'Call', at: '2028-01-01T09:00' }, NY, now), null, 'too far');
  assert.equal(validateReminder({ text: ' ', at: '2026-10-18T17:00' }, NY, now), null);
  assert.equal(validateReminder({ text: 'x y', at: 'Sunday at 5' }, NY, now), null);
});

test('A table, ready to book: OpenTable with time and party size, plus Maps; nothing claims to be booked', () => {
  const [ot, maps] = tableLinks({ what: 'ramen', where: 'Japantown San Jose', start: '2026-10-16T19:00', people: 2 }, NY);
  const u = new URL(ot.url);
  assert.equal(u.origin + u.pathname, 'https://www.opentable.com/s');
  assert.equal(u.searchParams.get('dateTime'), '2026-10-16T19:00:00');
  assert.equal(u.searchParams.get('covers'), '2');
  assert.equal(u.searchParams.get('term'), 'ramen Japantown San Jose');
  assert.equal(new URL(maps.url).searchParams.get('query'), 'ramen near Japantown San Jose');
  assert.ok(!/booked/i.test(ot.label));
  const [noTime] = tableLinks({ what: 'Nopa', people: 99 }, NY);
  assert.equal(new URL(noTime.url).searchParams.get('dateTime'), null);
  assert.equal(new URL(noTime.url).searchParams.get('covers'), '20');
});

test('Gift ideas: up to three, each a link to buy it', () => {
  const l = giftLinks({ ideas: ['film camera', 'Le Creuset dutch oven', 'x', 'poetry books', 'tea'] });
  assert.equal(l.length, 3);
  assert.equal(l[0].label, 'Film camera');
  assert.equal(new URL(l[1].url).searchParams.get('k'), 'Le Creuset dutch oven');
  assert.deepEqual(giftLinks({ ideas: [] }), []);
});

test('New tools are validated before Belluh acts', () => {
  assert.deepEqual(validateToolCall('write_entry', { text: '  Ramen was perfect  ', shared: true }), { name: 'write_entry', text: 'Ramen was perfect', shared: true });
  assert.deepEqual(validateToolCall('write_entry', { text: 'Private by default' }), { name: 'write_entry', text: 'Private by default', shared: false });
  assert.equal(validateToolCall('write_entry', { text: '' }), null);
  assert.equal(validateToolCall('remind_me', { text: 'x' }), null);
  assert.equal(validateToolCall('gift_ideas', { ideas: [] }), null);
  assert.ok(validateToolCall('find_table', { what: 'ramen' }));
});

const occ = (o: Partial<OfferOccasion>): OfferOccasion => ({ id: 'o1', label: "Dan's birthday", kind: 'birthday', month: 10, day: 27, year: null, repeats_yearly: true, mentioned_at: '2026-01-01', ...o } as OfferOccasion);
const plan = (p: Partial<NudgePlan>): NudgePlan => ({ id: 'p1', created_by: 'maya', partner_id: 'dan', title: 'Ramen night', status: 'proposed', options: [{ id: 'a', starts_at: '2026-10-20T23:00:00Z', minutes: 120 }], chosen_option: null, created_at: '2026-10-13T12:00:00Z', ...p });

test('Plan ahead: Belluh offers 10 to 14 days before a birthday or anniversary, unless something is already planned', () => {
  const today = { y: 2026, m: 10, d: 15 };
  const pick = occasionToOffer([occ({}), occ({ id: 'o2', label: 'Trip', kind: 'trip', day: 26 })], [], today, NY)!;
  assert.equal(pick.key, 'o1:2026-10-27');
  assert.equal(pick.days, 12);
  assert.equal(occasionToOffer([occ({ day: 20 })], [], today, NY), null, '5 days out is the reminder\'s job');
  assert.equal(occasionToOffer([occ({ day: 31 })], [], today, NY), null, '16 days out is too early');
  const planned = plan({ status: 'confirmed', chosen_option: 'a', options: [{ id: 'a', starts_at: '2026-10-26T23:00:00Z', minutes: 120 }] });
  assert.equal(occasionToOffer([occ({})], [planned], today, NY), null, 'already planned around it');
  assert.match(offerFallback("Dan's birthday", 12, pick.date), /^Dan's birthday is in 12 days, on October 27\. Want me to help plan it\?/);
  assert.equal(offerAsk("Dan's birthday", pick.date), "Help me plan something for Dan's birthday on October 27: somewhere to go and a few gift ideas.");
});

test('Follow up: a plan waiting on you for 36 hours gets one nudge; not before, not after a week, not if the times have passed', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  assert.deepEqual(plansToNudge([plan({})], 'dan', now).map(p => p.id), ['p1']);
  assert.deepEqual(plansToNudge([plan({})], 'maya', now), [], 'only the person who has to pick');
  assert.deepEqual(plansToNudge([plan({ created_at: '2026-10-14T12:00:00Z' })], 'dan', now), [], 'too soon');
  assert.deepEqual(plansToNudge([plan({ created_at: '2026-10-01T12:00:00Z' })], 'dan', now), [], 'too old');
  assert.deepEqual(plansToNudge([plan({ options: [{ id: 'a', starts_at: '2026-10-15T13:00:00Z', minutes: 60 }] })], 'dan', now), [], 'times already passed');
});

test('The morning after: both of them get "how was it?" 8 to 48 hours after a plan ends', () => {
  const done = plan({ status: 'confirmed', chosen_option: 'a', options: [{ id: 'a', starts_at: '2026-10-14T23:00:00Z', minutes: 120 }] });
  const now = new Date('2026-10-15T14:00:00Z'); // 13h after it ended
  assert.equal(plansJustHappened([done], 'maya', now).length, 1);
  assert.equal(plansJustHappened([done], 'dan', now).length, 1);
  assert.equal(plansJustHappened([done], 'eve', now).length, 0);
  assert.equal(plansJustHappened([done], 'maya', new Date('2026-10-15T03:00:00Z')).length, 0, 'too soon');
  assert.equal(plansJustHappened([plan({})], 'maya', now).length, 0, 'never happened');
  assert.ok(daytime(10) && daytime(20) && !daytime(21) && !daytime(7));
});

test('Trips: flights, hotels and an Airbnb, with the dates and travelers filled in; past dates are dropped', async () => {
  const { tripLinks } = await import('../supabase/functions/_shared/actions.ts');
  const now = new Date('2026-10-15T12:00:00Z');
  const l = tripLinks({ to: 'Lisbon', from: 'San Francisco', depart: '2027-05-10', return: '2027-05-17', people: 2 }, now);
  assert.deepEqual(l.map(x => x.label), ['Flights to Lisbon', 'Hotels in Lisbon', 'Airbnbs in Lisbon']);
  assert.match(new URL(l[0].url).searchParams.get('q')!, /^Flights to Lisbon from San Francisco on 2027-05-10 through 2027-05-17$/);
  const b = new URL(l[1].url);
  assert.equal(b.hostname, 'www.booking.com');
  assert.equal(b.searchParams.get('checkin'), '2027-05-10');
  assert.equal(b.searchParams.get('checkout'), '2027-05-17');
  assert.equal(b.searchParams.get('group_adults'), '2');
  assert.equal(new URL(l[2].url).searchParams.get('checkout'), '2027-05-17');
  const past = tripLinks({ to: 'Rome', depart: '2020-01-01', return: '2020-01-05' }, now);
  assert.equal(new URL(past[1].url).searchParams.get('checkin'), null, 'no dates in the past');
  assert.deepEqual(tripLinks({ to: '' }, now), []);
  assert.equal(validateToolCall('plan_trip', { to: 'Kyoto' })?.name, 'plan_trip');
  assert.equal(validateToolCall('plan_trip', {}), null);
});

test('Flowers: an order for delivery and florists near where they should go', async () => {
  const { flowerLinks } = await import('../supabase/functions/_shared/actions.ts');
  const l = flowerLinks({ what: 'peonies', where: 'Brooklyn', deliver_on: '2026-10-20' });
  assert.equal(l[0].label, 'Order peonies for delivery');
  assert.equal(new URL(l[0].url).searchParams.get('q'), 'peonies delivery Brooklyn');
  assert.equal(new URL(l[1].url).searchParams.get('query'), 'florist near Brooklyn');
  assert.equal(flowerLinks({})[0].label, 'Order flowers for delivery');
});

test('Dinner delivered: DoorDash and Uber Eats with the dish and the address', async () => {
  const { foodLinks } = await import('../supabase/functions/_shared/actions.ts');
  const l = foodLinks({ what: 'pho', where: 'San Jose' });
  assert.equal(l.length, 2);
  assert.ok(l[0].url.startsWith('https://www.doordash.com/search/store/pho/'));
  assert.equal(new URL(l[1].url).searchParams.get('q'), 'pho');
  assert.equal(new URL(l[1].url).searchParams.get('pl'), 'San Jose');
  assert.deepEqual(foodLinks({}), []);
});

test('Buying something: Amazon under the budget, Target, and a price comparison', async () => {
  const { buyLinks } = await import('../supabase/functions/_shared/actions.ts');
  const l = buyLinks({ item: 'film camera', max_price: 150 });
  assert.equal(l.length, 3);
  assert.equal(new URL(l[0].url).searchParams.get('k'), 'film camera');
  assert.equal(new URL(l[0].url).searchParams.get('rh'), 'p_36:-15000');
  assert.equal(new URL(l[1].url).searchParams.get('searchTerm'), 'film camera');
  assert.equal(new URL(l[2].url).searchParams.get('q'), 'film camera under $150');
  assert.deepEqual(buyLinks({ item: 'x' }), []);
});

test('Groceries, rides and things to do', async () => {
  const { groceryLinks, rideLinks, experienceLinks, } = await import('../supabase/functions/_shared/actions.ts');
  const { validateToolCall } = await import('../supabase/functions/_shared/agent.ts');
  const g = groceryLinks({ items: ['basil', 'fresh pasta', '', 'parmesan', 'a', 'lemons', 'butter', 'wine'] });
  assert.deepEqual(g.map(x => x.label), ['Add basil', 'Add fresh pasta', 'Add parmesan', 'Add lemons', 'Add butter']);
  const r = rideLinks({ to: 'Nopa, San Francisco' });
  assert.equal(new URL(r[0].url).searchParams.get('dropoff[formatted_address]'), 'Nopa, San Francisco');
  assert.equal(new URL(r[1].url).searchParams.get('destination[address]'), 'Nopa, San Francisco');
  const e = experienceLinks({ what: 'cooking class', where: 'San Jose', on: '2026-11-07' });
  assert.ok(e[0].url.startsWith('https://www.eventbrite.com/d/san-jose/cooking-class/'));
  assert.equal(new URL(e[0].url).searchParams.get('start_date'), '2026-11-07');
  assert.equal(new URL(e[1].url).searchParams.get('query'), 'cooking class');
  for (const n of ['order_food', 'buy_item', 'order_groceries', 'book_ride', 'find_experience']) assert.equal(validateToolCall(n, { what: 'x' })?.name, n);
});

test('Shopify: only dollar-priced products with a real checkout link, priced plainly', async () => {
  const { parseCatalog, searchShopify } = await import('../supabase/functions/_shared/shopify.ts');
  const fixture = JSON.parse((await import('node:fs')).readFileSync(new URL('./fixtures-shopify-catalog.json', import.meta.url), 'utf8'));
  const got = parseCatalog(fixture, 'USD', 5);
  assert.equal(got.length, 2, 'the pound-priced camera is left out');
  assert.deepEqual(got.map(p => p.price), ['$69', '$6']);
  assert.ok(got.every(p => p.url.startsWith('https://') && p.seller && p.title));
  assert.equal(parseCatalog(fixture, 'USD', 1).length, 1);
  assert.deepEqual(parseCatalog(null), []);
  assert.deepEqual(parseCatalog({ result: { structuredContent: { products: [{ title: 'x', price_range: { min: { amount: 500, currency: 'USD' } }, variants: [{ checkout_url: 'javascript:alert(1)' }] }] } } }), []);
  // A failing or slow catalog means no Shopify results, never an error
  assert.deepEqual(await searchShopify('film camera', 100, 3, (async () => { throw new Error('down'); }) as any), []);
  let sent: any = null;
  const ok = await searchShopify('film camera', 100, 3, (async (_u: string, init: any) => { sent = JSON.parse(init.body); return new Response(JSON.stringify(fixture)); }) as any);
  assert.equal(ok.length, 2);
  assert.equal(sent.params.name, 'search_catalog');
  assert.equal(sent.params.arguments.catalog.query, 'film camera');
  assert.equal(sent.params.arguments.catalog.filters.price.max, 10000, 'the budget goes in cents');
});
