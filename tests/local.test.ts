import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { parseLineEvents, validLineSignature, lineMessage, rememberReplyToken, takeReplyToken, lineUser } from '../supabase/functions/_shared/line.ts';
import { loveCalendar } from '../supabase/functions/_shared/jarvis.ts';
import { countryOf, countryCode, regionLinks, regionBrief, KITS } from '../supabase/functions/_shared/region.ts';

test('LINE: one-to-one messages only, redeliveries skipped', () => {
  const body = { events: [
    { type: 'message', webhookEventId: 'e1', replyToken: 'r1', timestamp: 1, source: { type: 'user', userId: 'U1' }, message: { type: 'text', text: 'LINK ABC123' } },
    { type: 'message', webhookEventId: 'e2', source: { type: 'group', groupId: 'G', userId: 'U2' }, message: { type: 'text', text: 'hi' } },
    { type: 'message', webhookEventId: 'e3', deliveryContext: { isRedelivery: true }, source: { type: 'user', userId: 'U1' }, message: { type: 'text', text: 'again' } },
    { type: 'follow', source: { type: 'user', userId: 'U3' } },
    { type: 'message', webhookEventId: 'e4', source: { type: 'user', userId: 'U4' }, message: { type: 'sticker' } },
  ] };
  const ev = parseLineEvents(body);
  assert.deepEqual(ev.map(e => [e.eventId, e.userId, e.text, e.kind]), [['e1', 'U1', 'LINK ABC123', 'text'], ['e4', 'U4', '', 'other']]);
  assert.deepEqual(parseLineEvents({}), []);
  assert.equal(lineUser('line:U1'), 'U1');
  assert.equal(lineUser('tg:1'), null);
});

test('LINE: the signature is HMAC-SHA256 of the raw body with the channel secret', async () => {
  const body = '{"events":[]}';
  const sig = crypto.createHmac('sha256', 'secret').update(body).digest('base64');
  assert.equal(await validLineSignature('secret', body, sig), true);
  assert.equal(await validLineSignature('secret', body + ' ', sig), false);
  assert.equal(await validLineSignature('secret', body, null), false);
  assert.equal(await validLineSignature('', body, sig), false);
});

test('LINE: replies are free with a fresh token, used once; quick replies become buttons', () => {
  rememberReplyToken('U1', 'tok', 1000);
  assert.equal(takeReplyToken('U1', 2000), 'tok');
  assert.equal(takeReplyToken('U1', 2000), null, 'only once');
  rememberReplyToken('U2', 'old', 1000);
  assert.equal(takeReplyToken('U2', 1000 + 60_000), null, 'stale after about a minute');
  const m = lineMessage('Reply SEND to send it', ['SEND', 'DISCARD']) as any;
  assert.deepEqual(m.quickReply.items.map((i: any) => i.action.text), ['SEND', 'DISCARD']);
  assert.equal((lineMessage('hi', null) as any).quickReply, undefined);
});

test('Love calendars: what couples there mark, in time to plan', () => {
  const at = (m: number, d: number) => ({ y: 2026, m, d });
  assert.match(loveCalendar('JP', at(2, 20))!, /White Day, 2026-03-14 \(in 22 days\)/);
  assert.match(loveCalendar('IT', at(8, 1))!, /Notte di San Lorenzo, 2026-08-10/);
  assert.match(loveCalendar('IT', at(3, 1))!, /mimosa/);
  assert.match(loveCalendar('BR', at(6, 1))!, /Dia dos Namorados, 2026-06-12 .*not Feb 14/);
  assert.match(loveCalendar('US', at(11, 1))!, /Thanksgiving, 2026-11-26/, 'fourth Thursday');
  assert.match(loveCalendar('CA', at(10, 1))!, /Thanksgiving, 2026-10-12/, 'second Monday');
  assert.match(loveCalendar('FR', at(11, 1))!, /Beaujolais nouveau, 2026-11-19/, 'third Thursday');
  assert.match(loveCalendar('CN', at(5, 1))!, /520, 2026-05-20/);
  assert.match(loveCalendar('CH', at(7, 20))!, /Swiss National Day, 2026-08-01/);
  assert.match(loveCalendar('JP', at(12, 20))!, /Christmas Eve, 2026-12-24/);
  assert.match(loveCalendar('GB', { y: 2026, m: 12, d: 30 })!, /New Year's Eve, 2026-12-31/);
  assert.match(loveCalendar('JP', { y: 2027, m: 1, d: 5 })!, /Valentine's Day, 2027-02-14/, 'into the new year');
  assert.match(loveCalendar('GB', at(12, 30))!, /New Year's Eve, 2026-12-31 \(tomorrow\)/, 'one day reads tomorrow');
  assert.equal(loveCalendar('ZZ', at(1, 1)), null);
});

test('Switzerland: its own stores, trains first, Swiss customs', () => {
  assert.equal(countryOf(null, 'Europe/Zurich'), 'CH');
  assert.equal(countryCode('Geneva'), 'CH');
  assert.match(regionLinks('buy', { item: 'Uhr' }, 'CH')![0].url, /galaxus\.ch\/search\?q=Uhr/);
  assert.match(regionLinks('ride', { to: 'Zürich HB' }, 'CH')![0].url, /travelmode=transit/);
  assert.match(regionBrief('CH', null, null), /Punctuality is respect/);
  for (const c of ['US', 'JP', 'FR', 'IT', 'GB', 'BR', 'CA', 'AU', 'CN', 'CH']) assert.match(KITS[c].culture, /How love is (said|lived)/, c);
});

import { detect as detectLang, dictFor as dictOf, localeTag as tagOf } from '../src/i18n/core.ts';

test('Spain, Mexico, Portugal and Brazil each get their own language, formats and kit', () => {
  assert.deepEqual(detectLang(['es-ES'], 'Europe/Madrid'), { lang: 'es', country: 'ES' });
  assert.deepEqual(detectLang(['es-MX', 'en-US'], 'America/Mexico_City'), { lang: 'es', country: 'MX' });
  assert.deepEqual(detectLang(['pt-PT'], 'Europe/Lisbon'), { lang: 'pt', country: 'PT' });
  assert.deepEqual(detectLang(['pt-BR'], 'America/Sao_Paulo'), { lang: 'pt', country: 'BR' });
  assert.deepEqual(detectLang(['en-US'], 'Atlantic/Madeira'), { lang: 'en', country: 'PT' });
  assert.equal(tagOf('es', 'MX'), 'es-MX'); assert.equal(tagOf('pt', 'PT'), 'pt-PT');
  // Portugal's Portuguese and Mexico's Spanish are their own, not Brazil's or Spain's
  assert.notEqual(dictOf('pt', 'PT').hero.sub, dictOf('pt', 'BR').hero.sub);
  assert.notEqual(dictOf('es', 'MX').common.me, dictOf('es', 'ES').common.me);
  assert.ok(!/\bpra\b|celular/.test(JSON.stringify(dictOf('pt', 'PT'))), 'no Brazilian forms in Portugal');
  assert.ok(!/vosotros|¡vale|\bvale[,.!]|móvil|ordenador|\bcoche/i.test(JSON.stringify(dictOf('es', 'MX'))), 'no Spain forms in Mexico');
  for (const c of ['ES', 'MX', 'PT', 'BR']) {
    assert.ok(KITS[c].culture.includes('How love is said'), c);
    for (const k of ['table', 'gift', 'flowers', 'food', 'groceries', 'ride', 'experience']) assert.ok((KITS[c].links as any)[k]?.length, `${c} ${k}`);
  }
  assert.equal(countryCode('Portugal'), 'PT'); assert.equal(countryCode('CDMX'), 'MX'); assert.equal(countryOf(null, 'Europe/Lisbon'), 'PT');
  assert.match(regionLinks('table', { what: 'fado', where: 'Alfama' }, 'PT')![0].url, /thefork\.pt/);
  assert.match(loveCalendar('PT', { y: 2026, m: 6, d: 1 })!, /Santo António, 2026-06-12/);
  assert.match(loveCalendar('ES', { y: 2026, m: 4, d: 1 })!, /Sant Jordi, 2026-04-23/);
  assert.match(loveCalendar('MX', { y: 2026, m: 5, d: 1 })!, /Día de las Madres, 2026-05-10/);
});
