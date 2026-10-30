import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpots, cityOf, spotQueries, wantsFood, findSpots } from '../supabase/functions/_shared/places.ts';
import { shopStyle } from '../supabase/functions/_shared/shopcheckout.ts';
import { validateToolCall } from '../supabase/functions/_shared/agent.ts';

const place = (o: Record<string, unknown>) => ({ category: 'amenity', type: 'restaurant', lat: '37.79', lon: '-122.40', extratags: {}, address: { city: 'San Francisco' }, ...o });

test('Spots: real places in the city that was asked for, food only when food was asked for', () => {
  assert.equal(cityOf('Mission District, San Francisco'), 'san francisco');
  assert.equal(cityOf('Brooklyn, NY'), 'brooklyn');
  assert.deepEqual(spotQueries('ramen', 'San Francisco').slice(0, 2), ['ramen, San Francisco', 'ramens in San Francisco']);
  assert.equal(wantsFood('wine bar'), true);
  assert.equal(wantsFood('museum'), false);
  const s = parseSpots([
    place({ name: 'Ramen Hiroshi', extratags: { cuisine: 'ramen;japanese', phone: '+1 415-997-0997', opening_hours: 'Mo-Su 11:30-21:00' }, address: { house_number: '322', road: 'Kearny Street', suburb: 'Union Square', city: 'San Francisco' } }),
    place({ name: 'Ramen Hiroshi', extratags: { cuisine: 'ramen' }, address: { house_number: '322', road: 'Kearny Street', city: 'San Francisco' } }),   // same place twice
    place({ name: 'Frog Wine Bar', type: 'bar', address: { city: 'Rochester' } }),                                                                  // wrong city
    place({ name: 'Economy Restaurant Fixtures', category: 'shop', type: 'kitchen' }),                                                               // not food
    place({ name: '', extratags: {} }),
  ], 'san francisco', 6, true);
  assert.equal(s.length, 1);
  assert.deepEqual({ ...s[0], map: undefined }, { name: 'Ramen Hiroshi', kind: 'Ramen', address: '322 Kearny Street, Union Square, San Francisco', phone: '+14159970997', website: null, hours: 'Mo-Su 11:30-21:00', map: undefined, bookable: true });
  assert.match(s[0].map, /^https:\/\/www\.google\.com\/maps\/search\//);
  const museums = parseSpots([place({ name: 'de Young Museum', category: 'tourism', type: 'museum' })], 'san francisco', 6, false);
  assert.equal(museums[0].kind, 'Museum');
  assert.equal(museums[0].bookable, false);
});

test('Spots: stops asking once it has enough, and gives up quietly when the map is down', async () => {
  let calls = 0;
  const many = Array.from({ length: 5 }, (_, i) => place({ name: `Spot ${i}`, address: { road: `Road ${i}`, city: 'San Francisco' } }));
  const ok: typeof fetch = async () => { calls++; return new Response(JSON.stringify(many)); };
  assert.equal((await findSpots('ramen', 'San Francisco', ok)).length, 5);
  assert.equal(calls, 1);
  const down: typeof fetch = async () => { throw new Error('offline'); };
  assert.deepEqual(await findSpots('ramen', 'San Francisco', down), []);
});

test('Shop a look: two real options per piece, in the style, under the budget, in order', async () => {
  const asked: string[] = [];
  const fake: typeof fetch = async (_u, init) => {
    const a = JSON.parse(String(init?.body)).params.arguments.catalog;
    asked.push(a.query);
    const n = asked.length;
    const products = [0, 1, 2].map(i => ({ title: `${a.query} ${i}`, variants: [{ id: `gid://shopify/ProductVariant/${n}${i}`, price: { amount: 10000 * (i + 1), currency: 'USD' }, seller: { name: `Shop ${n}`, domain: `s${n}.myshopify.com` }, checkout_url: `https://s${n}.com/cart/${i}` }] }));
    return new Response(JSON.stringify({ result: { structuredContent: { products } } }));
  };
  const r = await shopStyle(['sofa', 'lounge chair'], { style: 'mid-century', maxCentsEach: 25000 }, fake);
  assert.deepEqual(asked.sort(), ['mid-century lounge chair', 'mid-century sofa']);
  assert.equal(r.length, 4);
  assert.ok(r.every(p => /^\$(100|200)$/.test(p.price)));   // the $300 option is over budget
  assert.deepEqual(r.map(p => p.piece), ['sofa', 'sofa', 'lounge chair', 'lounge chair']);
});

test('Tool calls: shop_style and find_spots are checked before Bella acts', () => {
  assert.deepEqual(validateToolCall('shop_style', { pieces: ['sofa', '', 'lounge chair', 'rug', 'lamp', 'desk'], style: 'mid-century', budget_each: 800 }),
    { name: 'shop_style', pieces: ['sofa', 'lounge chair', 'rug', 'lamp'], style: 'mid-century', budgetEach: 800 });
  assert.equal(validateToolCall('shop_style', { pieces: [] }), null);
  assert.deepEqual(validateToolCall('find_spots', { what: 'ramen', where: 'Mission, San Francisco' }), { name: 'find_spots', what: 'ramen', where: 'Mission, San Francisco' });
  assert.equal(validateToolCall('find_spots', { what: 'ramen' }), null);
});
