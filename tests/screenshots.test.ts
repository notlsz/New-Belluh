import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyScreenshot, screenshotPlans, shotForBella, subjectOf, looksPrivate, INTENT_KIND } from '../src/lib/memory/screenshots.ts';
import { screenshotIn, screenshotContext } from '../supabase/functions/_shared/devicetools.ts';
import { bookingFromTool } from '../supabase/functions/_shared/bookings.ts';
import type { IndexedItem } from '../src/lib/memory/types.ts';

const shot = (id: string, date: string, text: string | null, extra: Partial<IndexedItem> = {}): IndexedItem => ({
  id, date, mediaType: 'screenshot', places: [], cuisines: [], labels: [], text, sensitivity: null, people: [], ...extra,
});

test('Screenshots are sorted into a table, a gift, tickets or a trip, in every language Belluh speaks', () => {
  const cases: [string, string][] = [
    ['9:41\nHinata Sushi\n4.8 (1,203 reviews)\nOmakase dinner\nReserve a table\nParty of 2, Sat 7:30 PM', 'dine'],
    ['Crochet Beach Bag\n$48.00\nSelect size\nAdd to cart\nFree shipping on orders over $50', 'buy'],
    ['Lakehouse Jazz\nFri Oct 24, doors at 7pm\nGet tickets\nGeneral admission $35', 'attend'],
    ['Casa Lisboa Boutique Hotel\nCheck-in Fri 14 Nov\nCheck-out Sun 16 Nov\n2 nights, 2 guests', 'trip'],
    ['すし匠\n食べログ 3.9\nコース料理\n席を予約する', 'dine'],
    ['北欧ブランケット\n¥5,800 税込\n送料無料\nカートに入れる', 'buy'],
    ['海边民宿\n入住 11月14日 退房 11月16日\n携程', 'trip'],
    ['아이유 콘서트\n티켓 예매\n공연 11월 22일', 'attend'],
    ['Le Comptoir\nRéserver une table\nCarte des vins', 'dine'],
    ['Osteria da Fortunata\nPrenota un tavolo\nMenù del giorno', 'dine'],
    ['Strickpullover\n59,95 €\nIn den Warenkorb\nKostenloser Versand', 'buy'],
    ['Concierto en el Palacio\nEntradas desde 30 €\nComprar entradas', 'attend'],
    ['Pousada do Mar\nChegada 14 nov\nPartida 16 nov\n2 noites', 'trip'],
  ];
  for (const [text, intent] of cases) assert.equal(classifyScreenshot(text).intent, intent, text.split('\n')[0]);
});

test('A screenshot with no clear signal, a chat or a note, is other; so is one with a card number or a code', () => {
  assert.equal(classifyScreenshot('lol see you at 8\nok!').intent, 'other');
  assert.equal(classifyScreenshot('Grocery list\nmilk\neggs\nbread').intent, 'other');
  assert.equal(classifyScreenshot('').intent, 'other');
  assert.equal(classifyScreenshot('Hotel Nova\nCheck-in Fri\nCard 4111 1111 1111 1111').intent, 'other');
  assert.equal(classifyScreenshot('Your verification code is 482913\nRestaurant Lumi reservation').intent, 'other');
  assert.ok(looksPrivate('パスワード: hunter2'));
  assert.ok(!looksPrivate('Hinata Sushi, Reserve a table'));
});

test('The name of the thing skips phone chrome, buttons, prices and sentences', () => {
  assert.equal(subjectOf('9:41\n87%\nHinata Sushi\nReserve a table'), 'Hinata Sushi');
  assert.equal(subjectOf('Back\nAdd to cart\n$48.00\nCrochet Beach Bag'), 'Crochet Beach Bag');
  assert.equal(subjectOf('www.example.com\nThis is a very long sentence that describes the dish in great detail\nLakehouse Jazz'), 'Lakehouse Jazz');
  assert.equal(subjectOf('すし匠\n席を予約する'), 'すし匠');
});

test('Suggestions: screenshots only, newest first, never sensitive or private, one per name, each with its booking kind', () => {
  const items = [
    shot('s1', '2026-10-01T10:00:00Z', 'Hinata Sushi\nOmakase\nReserve a table'),
    shot('s2', '2026-10-05T10:00:00Z', 'Lakehouse Jazz\nGet tickets\nDoors at 7pm'),
    shot('s3', '2026-10-06T10:00:00Z', 'Hinata Sushi\nOmakase\nReserve a table\nParty of 2'),   // same place again
    shot('s4', '2026-10-07T10:00:00Z', 'Pharmacy\nAdd to cart\nFree shipping', { sensitivity: 'health' }),
    shot('s5', '2026-10-08T10:00:00Z', 'Hotel Aurora\nCheck-in\nPassword: abc123'),
    shot('s6', '2026-10-09T10:00:00Z', 'Hello\nsee you soon'),
    { ...shot('p1', '2026-10-10T10:00:00Z', 'Hinata Ramen\nReserve a table'), mediaType: 'photo' as const },
    shot('s7', '2026-10-02T10:00:00Z', null),
  ];
  const plans = screenshotPlans(items);
  assert.deepEqual(plans.map(p => [p.id, p.intent, p.kind, p.subject]), [
    ['s3', 'dine', 'table', 'Hinata Sushi'],
    ['s2', 'attend', 'experience', 'Lakehouse Jazz'],
  ]);
  assert.deepEqual(INTENT_KIND, { dine: 'table', buy: 'gift', attend: 'experience', trip: 'trip' });
});

test('What Bella gets after the yes: the intent, the name and the words read from the screenshot, never the image or an id', () => {
  const [p] = screenshotPlans([shot('s1', '2026-10-01T10:00:00Z', 'Hinata Sushi\n\n\n\nOmakase    dinner\nReserve a table')]);
  const body = shotForBella(p)!;
  assert.deepEqual(Object.keys(body).sort(), ['intent', 'subject', 'text']);
  assert.equal(body.text, 'Hinata Sushi\n\nOmakase dinner\nReserve a table');
  assert.ok(!JSON.stringify(body).includes('s1'));
  assert.equal(shotForBella({ ...p, text: 'Card 4111 1111 1111 1111' }), null);
  // The server takes only those fields, capped, and tells Bella which tool makes it a booking draft
  const s = screenshotIn({ ...body, image: 'data:image/png;base64,AAAA', id: 's1', text: body.text + 'x'.repeat(2000) })!;
  assert.deepEqual(Object.keys(s).sort(), ['intent', 'subject', 'text']);
  assert.equal(s.text.length, 1000);
  assert.equal(screenshotIn({ intent: 'steal', text: 'hello there' }), null);
  const ctx = screenshotContext(s, 'Ana');
  assert.match(ctx, /find_table/);
  assert.match(ctx, /never the image/);
  assert.ok(!ctx.includes('base64'));
  // and the tool Bella calls becomes the existing BookingDraft kind
  assert.equal(bookingFromTool('find_table', { what: 'Hinata Sushi', where: 'San Francisco' }, 'America/Los_Angeles', 'Sam', null)?.kind, 'table');
  assert.equal(bookingFromTool('find_experience', { what: 'Lakehouse Jazz' }, 'America/Los_Angeles', 'Sam', null)?.kind, 'experience');
});
