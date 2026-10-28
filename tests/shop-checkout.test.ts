import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseUsAddress, parseOffers, blockedReason, readyOrder, NOT_FRESH_FLOWERS } from '../supabase/functions/_shared/shopcheckout.ts';

const search = JSON.parse(readFileSync(new URL('./fixtures-shop-search.json', import.meta.url), 'utf8'));
const blocked = JSON.parse(readFileSync(new URL('./fixtures-shop-checkout.json', import.meta.url), 'utf8'));

test('Addresses: a full US address becomes checkout fields; anything vaguer asks instead of guessing', () => {
  const a = parseUsAddress('350 Clement St, Apt 2, San Francisco, CA 94118', 'Sam Lee');
  assert.deepEqual(a, { first_name: 'Sam', last_name: 'Lee', street_address: '350 Clement St', extended_address: 'Apt 2', address_locality: 'San Francisco', address_region: 'CA', postal_code: '94118', address_country: 'US' });
  assert.equal(parseUsAddress('200 E 10th St, New York, New York 10003, USA', 'Dan')?.address_region, 'NY');
  assert.equal(parseUsAddress('San Francisco, CA'), null);
  assert.equal(parseUsAddress('Clement St, San Francisco, CA 94118'), null);   // no street number
  assert.equal(parseUsAddress('1 Main St, Springfield, ZZ 12345'), null);      // not a state
  assert.equal(parseUsAddress(42), null);
});

test('Offers: real variants with their shop, under a budget, and no paper flowers when it should be fresh', () => {
  const all = parseOffers(search);
  assert.ok(all.length >= 3);
  for (const o of all) { assert.match(o.variantId, /^gid:\/\/shopify\/ProductVariant\//); assert.match(o.shop, /myshopify\.com$/); assert.ok(o.priceCents > 0); }
  assert.ok(parseOffers(search, 10000).every(o => o.priceCents <= 10000));
  assert.equal(parseOffers({ result: { structuredContent: { products: [{ title: 'Grande Peony Paradise', variants: [{ id: 'gid://shopify/ProductVariant/1', price: { amount: 3000, currency: 'USD' }, seller: { name: 'FreshCut Paper', domain: 'fcp.myshopify.com' } }] }] } } }, null, NOT_FRESH_FLOWERS).length, 0);
});

test("Checkouts: a shop that can't deliver there is skipped; one that only needs a phone number is ready", () => {
  assert.match(String(blockedReason(blocked)), /no_delivery/);
  assert.equal(blockedReason({ status: 'requires_escalation', continue_url: 'https://shop.app/checkouts/r/x', messages: [{ code: 'delivery_phone_number_required' }, { code: 'extension_interaction_required' }] }), null);
  assert.equal(blockedReason({ status: 'completed', continue_url: 'https://shop.app/x' }), 'completed');
  assert.equal(blockedReason(null), 'no checkout');
});

test('Ready order: tries the next shop when the first cannot deliver, and returns the real total and pay page', async () => {
  const shops: string[] = [];
  const fake: typeof fetch = async (_u, init) => {
    const body = JSON.parse(String(init?.body));
    const { name, arguments: args } = body.params;
    if (name === 'search_catalog') return new Response(JSON.stringify(search));
    shops.push(args.shop);
    assert.equal(args.checkout.fulfillment.methods[0].destinations[0].postal_code, '94118');
    const ok = shops.length === 2;
    return new Response(JSON.stringify({ result: { structuredContent: ok
      ? { status: 'requires_escalation', continue_url: 'https://shop.app/checkouts/r/OK', totals: [{ type: 'total', amount: 10646 }], messages: [{ code: 'delivery_phone_number_required' }] }
      : blocked } }));
  };
  const o = await readyOrder('peonies', parseUsAddress('350 Clement St, San Francisco, CA 94118', 'Sam')!, {}, fake);
  assert.equal(shops.length, 2);
  assert.notEqual(shops[0], shops[1]);
  assert.equal(o?.url, 'https://shop.app/checkouts/r/OK');
  assert.equal(o?.total, '$106.46');
  assert.equal(o?.deliversTo, '350 Clement St, San Francisco, CA 94118');
});
