import test from 'node:test';
import assert from 'node:assert/strict';
import { countryOfTimeZone, countryOf, countryCode, partnerCountryOf, regionLinks, regionBrief, KITS } from '../supabase/functions/_shared/region.ts';
import { parseSpots } from '../supabase/functions/_shared/places.ts';
import { validateToolCall, systemPrompt, usSystemPrompt } from '../supabase/functions/_shared/agent.ts';

test('Country: what they told Bella, else their time zone, else the US', () => {
  assert.equal(countryOfTimeZone('Asia/Tokyo'), 'JP');
  assert.equal(countryOfTimeZone('Asia/Shanghai'), 'CN');
  assert.equal(countryOfTimeZone('Asia/Seoul'), 'KR');
  assert.equal(countryOfTimeZone('America/Chicago'), 'US');
  assert.equal(countryOfTimeZone('America/Indiana/Indianapolis'), 'US');
  assert.equal(countryOfTimeZone('America/Toronto'), 'CA');
  assert.equal(countryOfTimeZone('Australia/Sydney'), 'AU');
  assert.equal(countryOfTimeZone('Africa/Lagos'), null);
  assert.equal(countryOf('JP', 'America/New_York'), 'JP', 'what they said wins over the clock');
  assert.equal(countryOf(null, 'Asia/Seoul'), 'KR');
  assert.equal(countryOf('ZZ', 'Africa/Lagos'), 'US');
  assert.equal(countryCode('Tokyo'), 'JP');
  assert.equal(countryCode('south korea'), 'KR');
  assert.equal(countryCode('gb'), 'GB');
  assert.equal(countryCode('Narnia'), null);
});

test('Every country kit is complete: stores people there use, money, customs', () => {
  for (const [code, k] of Object.entries(KITS)) {
    assert.ok(k.name && k.money && k.apps.length > 40 && k.culture.length > 80, code);
    for (const tpls of Object.values(k.links)) for (const [label, url] of tpls!) {
      assert.ok(/^https:\/\//.test(url), `${code} ${label}`);
      assert.ok(!/[•·]/.test(label), 'no bullet characters in labels');
    }
  }
});

test('Japan: tables through Tabelog, gifts from Rakuten and Amazon Japan, trains before taxis', () => {
  const t = regionLinks('table', { what: 'yakitori', where: 'Ebisu', people: 2 }, 'JP')!;
  assert.match(t[0].label, /Tabelog/);
  assert.match(t[0].url, /^https:\/\/www\.google\.com\/search\?q=yakitori\+Ebisu\+site%3Atabelog\.com$/);
  const b = regionLinks('buy', { item: 'ペアマグカップ' }, 'JP')!;
  assert.match(b[0].url, /^https:\/\/www\.amazon\.co\.jp\/s\?k=/);
  assert.ok(b.some(x => x.url.startsWith('https://search.rakuten.co.jp/search/mall/')));
  const r = regionLinks('ride', { to: 'Shibuya Station' }, 'JP')!;
  assert.match(r[0].label, /Train/);
  assert.match(r[0].url, /travelmode=transit/);
});

test('China: no Google, no Amazon: JD, Tmall, Taobao, Amap and Dianping', () => {
  const all = (['table', 'buy', 'flowers', 'food', 'ride'] as const).flatMap(k => regionLinks(k, { what: '火锅', item: '情侣手表', where: '上海', to: '外滩' }, 'CN')!);
  assert.ok(all.length >= 6);
  for (const l of all) assert.ok(!/google\.|amazon\.|uber/.test(l.url), l.url);
  assert.ok(all.some(l => l.url.startsWith('https://search.jd.com/')));
  assert.ok(all.some(l => l.url.startsWith('https://uri.amap.com/')));
});

test('Korea: Naver Map instead of Google Maps, Coupang for gifts', () => {
  const t = regionLinks('table', { what: '파스타', where: '성수' }, 'KR')!;
  assert.match(t[0].url, /^https:\/\/map\.naver\.com\/p\/search\//);
  assert.match(regionLinks('buy', { item: '커플링' }, 'KR')![0].url, /coupang\.com\/np\/search\?q=/);
});

test('Gifts: one link per idea; flowers to the shop, the place to the florists search', () => {
  const g = regionLinks('gift', { ideas: ['film camera', 'silk scarf'] }, 'GB')!;
  assert.deepEqual(g.map(x => x.label), ['Film camera', 'Silk scarf']);
  assert.match(g[0].url, /amazon\.co\.uk\/s\?k=film\+camera/);
  const f = regionLinks('flowers', { what: 'peonies', where: 'Shoreditch' }, 'GB')!;
  assert.match(f[0].url, /q=peonies\+flower\+delivery/);
  assert.match(f[1].url, /query=florist\+Shoreditch$/);
  const nowhere = regionLinks('flowers', { what: 'peonies' }, 'GB')!;
  assert.match(nowhere[1].url, /query=florist$/, 'no dangling plus when there is no place');
});

test('The US keeps its own links; a country without a kit gets what works everywhere', () => {
  assert.equal(regionLinks('table', { what: 'tacos' }, 'US'), null);
  const x = regionLinks('table', { what: 'tacos', where: 'Lagos' }, 'NG')!;
  assert.match(x[0].url, /google\.com\/maps\/search/);
  assert.equal(regionLinks('buy', {}, 'JP')!.length, 0, 'nothing to search, no links');
  assert.match(regionLinks('buy', { item: 'linen sheets' }, 'MX')![0].url, /listado\.mercadolibre\.com\.mx\/linen-sheets$/);
});

test('The brief: where they live, their money, the customs there, and the partner far away', () => {
  const jp = regionBrief('JP', null, 'Dan');
  assert.match(jp, /Japan/);
  assert.match(jp, /White Day/);
  assert.match(jp, /¥/);
  assert.match(jp, /No tipping/);
  assert.match(jp, /never stereotype/);
  const ld = regionBrief('US', 'KR', 'Min');
  assert.match(ld, /Min lives in South Korea/);
  assert.match(ld, /100, 200, 300 days/);
  assert.match(regionBrief('CN', null, null), /clock/);
});

test('Bella: set_country takes a country or a city; the prompt carries the region and the Jarvis habits', () => {
  assert.deepEqual(validateToolCall('set_country', { country: 'Seoul' }), { name: 'set_country', country: 'KR' });
  assert.deepEqual(validateToolCall('set_country', { country: 'jp' }), { name: 'set_country', country: 'JP' });
  assert.equal(validateToolCall('set_country', { country: 'Atlantis' }), null);
  const p = systemPrompt({ myName: 'Maya', partnerName: 'Dan', memories: [], entries: '', dates: '', today: '2026-10-30', region: regionBrief('JP', null, 'Dan') });
  assert.match(p, /They live in Japan/);
  assert.match(p, /Panic:/);
  assert.match(p, /Reality check:/);
  assert.match(p, /Nostalgia:/);
  assert.match(p, /set_country/);
  assert.match(p, /outside the US, a local crisis line/);
  const u = usSystemPrompt({ names: ['Maya', 'Dan'], today: '2026-10-30', facts: null, weekly: null, pastWeeks: null, plans: null, entries: '', region: regionBrief('KR', null, 'Dan') });
  assert.match(u, /They live in South Korea/);
});

test('Spots abroad: a local number without its country code is not callable', () => {
  const s = parseSpots([{ name: 'Torikizoku', category: 'amenity', type: 'restaurant', lat: '35.6', lon: '139.7', extratags: { phone: '03-1234-5678' }, address: { city: 'Tokyo' } }], 'tokyo', 6, true, false);
  assert.equal(s[0].phone, null);
  const s2 = parseSpots([{ name: 'Torikizoku', category: 'amenity', type: 'restaurant', lat: '35.6', lon: '139.7', extratags: { phone: '+81 3-1234-5678' }, address: { city: 'Tokyo' } }], 'tokyo', 6, true, false);
  assert.equal(s2[0].phone, '+81312345678');
});

test('Long distance only when it really is: a partner\'s default clock never moves the couple', () => {
  assert.equal(partnerCountryOf({ country: 'JP', timezone: 'America/New_York' }, { country: null, timezone: 'America/New_York' }), null, 'she said Tokyo, his clock is just the default');
  assert.equal(partnerCountryOf({ country: 'US' }, { country: 'KR', timezone: 'Asia/Seoul' }), 'KR', 'he said Seoul');
  assert.equal(partnerCountryOf({ country: null, timezone: 'America/Chicago' }, { country: null, timezone: 'Asia/Seoul' }), 'KR', 'neither said; clocks differ');
  assert.equal(partnerCountryOf({ country: 'JP' }, null), null, 'no partner');
});
