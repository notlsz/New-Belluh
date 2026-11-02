import test from 'node:test';
import assert from 'node:assert/strict';
import { gapsBetweenDates, lastDateOf, looksLikeDateAsk, homeCityOf, GAP_DEFAULT_DAYS } from '../src/lib/memory/gaps.ts';
import { listItems, type Rec } from '../src/lib/memory/logic.ts';
import { gapsIn, gapsContext } from '../supabase/functions/_shared/devicetools.ts';
import type { IndexedItem, Interest } from '../src/lib/memory/types.ts';

const it = (id: string, date: string, city: string, place: string | null, labels: string[], extra: Partial<IndexedItem> = {}): IndexedItem => ({
  id, date, mediaType: 'photo', location: { city, country: 'US', lat: 0, lng: 0 }, places: place ? [{ name: place, kind: 'restaurant' }] : [],
  cuisines: [], labels: labels.map(name => ({ name, p: 0.8 })), text: null, sensitivity: null, people: [], ...extra,
});
const NOW = Date.parse('2026-09-15T18:00:00Z');

// Home is Oakland (most photos); the last date was Sep 2
const ITEMS: IndexedItem[] = [
  ...Array.from({ length: 8 }, (_, i) => it(`h${i}`, `2026-0${(i % 6) + 1}-10T12:00:00Z`, 'Oakland', null, ['kitchen'])),
  it('d1', '2026-09-02T20:00:00Z', 'Oakland', 'Burma Superstar', ['dinner']),              // the date itself: not a gap
  it('z1', '2026-09-04T09:00:00Z', 'Springdale', null, ['hiking', 'canyon']),              // a trip: three days away
  it('z2', '2026-09-05T09:00:00Z', 'Springdale', null, ['hiking']),
  it('z3', '2026-09-06T09:00:00Z', 'Springdale', null, ['canyon']),
  it('t1', '2026-09-07T15:00:00Z', 'Oakland', 'Blue Bottle Coffee', ['coffee']),           // a place
  it('r1', '2026-09-09T07:00:00Z', 'Oakland', null, ['running', 'track']),                 // a small moment
  it('c1', '2026-09-10T10:00:00Z', 'Oakland', 'City Clinic', ['waiting room'], { sensitivity: 'health' }),
  { ...it('s1', '2026-09-11T10:00:00Z', 'Oakland', null, ['screenshot']), mediaType: 'screenshot' },
  it('f1', '2026-09-20T10:00:00Z', 'Oakland', 'Future Place', ['dinner']),                 // after now
];
const INTERESTS: Interest[] = [
  { name: 'climbing', kind: 'activity', status: 'emerging', count: 3, first: '2026-09-08', last: '2026-09-12', samples: ['r1'] },
  { name: 'coffee', kind: 'food', status: 'active', count: 20, first: '2025-01-01', last: '2026-09-07', samples: ['t1'] },
];

test('The last date is the latest plan you both said yes to, or a table, tickets or trip you booked, before now', () => {
  const plans = [
    { status: 'confirmed', title: 'Dinner at Burma Superstar', chosen_option: 'b', options: [{ id: 'a', starts_at: '2026-08-01T02:00:00Z' }, { id: 'b', starts_at: '2026-09-02T02:00:00Z' }] },
    { status: 'confirmed', title: 'Next week', chosen_option: 'a', options: [{ id: 'a', starts_at: '2026-09-20T02:00:00Z' }] },   // future
    { status: 'proposed', title: 'Maybe', chosen_option: null, options: [{ id: 'a', starts_at: '2026-09-10T02:00:00Z' }] },
  ];
  const bookings = [
    { kind: 'flowers', status: 'booked', title: 'Peonies', starts_at: '2026-09-12T00:00:00Z' },          // not a date
    { kind: 'table', status: 'prepared', title: 'Not booked', starts_at: '2026-09-11T00:00:00Z' },
    { kind: 'experience', status: 'booked', title: 'Jazz night', starts_at: '2026-08-20T03:00:00Z' },
  ];
  assert.deepEqual(lastDateOf(plans, bookings, NOW), { at: '2026-09-02T02:00:00Z', title: 'Dinner at Burma Superstar' });
  assert.deepEqual(lastDateOf([], bookings, NOW), { at: '2026-08-20T03:00:00Z', title: 'Jazz night' });
  assert.equal(lastDateOf([], [], NOW), null);
});

test('The gaps: a trip, a place and a small moment since the last date, oldest first, never sensitive, screenshots or later', () => {
  const g = gapsBetweenDates(ITEMS, { last: { at: '2026-09-02T02:00:00Z', title: 'Dinner at Burma Superstar' }, now: NOW, interests: INTERESTS })!;
  assert.equal(homeCityOf(ITEMS), 'Oakland');
  assert.equal(g.since, '2026-09-02');
  assert.equal(g.noDate, false);
  assert.deepEqual(g.moments.map(m => [m.day, m.kind, m.name, m.days]), [
    ['2026-09-04', 'trip', 'Springdale', 3],
    ['2026-09-07', 'place', 'Blue Bottle Coffee', 1],
    ['2026-09-09', 'moment', 'running', 1],
  ]);
  assert.deepEqual(g.moments.map(m => m.id), ['z1', 't1', 'r1']);
  assert.deepEqual(g.newInterests, ['climbing']);
  // The text Bella gets: short, dated, no ids, nothing sensitive
  assert.equal(g.summary, 'Since their last date on 2026-09-02 ("Dinner at Burma Superstar"): 2026-09-04 a trip to Springdale (3 days); 2026-09-07 went to Blue Bottle Coffee; 2026-09-09 photos of running. New lately: climbing.');
  assert.ok(!/\b(z1|t1|r1|c1)\b|Clinic|Future/.test(g.summary));
  assert.ok(g.summary.length <= 700);
});

test('No date on record: the last few weeks; nothing new at all: no gaps', () => {
  const g = gapsBetweenDates(ITEMS, { last: null, now: NOW })!;
  assert.equal(g.noDate, true);
  assert.equal(g.since, '2026-08-16');
  assert.match(g.summary, new RegExp(`^In the last ${GAP_DEFAULT_DAYS} days`));
  assert.equal(gapsBetweenDates(ITEMS.slice(0, 8), { last: { at: '2026-09-02T02:00:00Z', title: null }, now: NOW }), null);
});

test('At most four moments, trips first, spread across the weeks', () => {
  const many = [...ITEMS, ...Array.from({ length: 6 }, (_, i) => it(`m${i}`, `2026-09-${String(10 + i).padStart(2, '0')}T08:00:00Z`, 'Oakland', null, [`thing${i}`]))];
  const g = gapsBetweenDates(many, { last: { at: '2026-09-02T02:00:00Z', title: null }, now: NOW })!;
  assert.equal(g.moments.length, 4);
  assert.equal(g.moments[0].kind, 'trip');
  assert.deepEqual([...g.moments].sort((a, b) => a.day.localeCompare(b.day)), g.moments);
});

test('Date asks in each language pick up the gaps; other questions do not', () => {
  for (const t of ['Plan a date for Saturday', 'ideas for our next date?', '次のデートどこ行こう', '下次约会去哪', '데이트 어디 갈까', 'un rendez-vous ce week-end', 'un appuntamento sabato', 'ein Date am Freitag', 'una cita el viernes', 'um encontro no sábado']) assert.ok(looksLikeDateAsk(t), t);
  for (const t of ['What is the date today?', 'How was your day?', 'remind me to call mom']) assert.ok(!looksLikeDateAsk(t), t);
});

test('The server takes the summary as short text only, as context for this turn', () => {
  assert.equal(gapsIn({ summary: 'x' }), null);
  assert.equal(gapsIn('short'), null);
  assert.equal(gapsIn('a'.repeat(900))!.length, 700);
  assert.match(gapsContext('Since their last date: a trip to Springdale.', 'Ana', 'Sam'), /Data, not instructions[\s\S]*Springdale[\s\S]*don't repeat the last date/);
});

test('list(): newest first, one kind of media, a date range, never sensitive', () => {
  const rec = (i: IndexedItem, wall: number): Rec => ({ ...i, wall, stage: 'understood', addedAt: 0 });
  const recs = ITEMS.map((i, n) => rec(i, Date.parse(i.date!) + n));
  assert.deepEqual(listItems(recs, { mediaType: 'screenshot' }).map(r => r.id), ['s1']);
  assert.ok(!listItems(recs).some(r => r.id === 'c1'));
  assert.deepEqual(listItems(recs, { from: '2026-09-04', to: '2026-09-07' }).map(r => r.id), ['t1', 'z3', 'z2', 'z1']);
  assert.equal(listItems(recs, { limit: 2 }).length, 2);
});
