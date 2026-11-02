import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStory, clusterPlaces, km, round3, rowsFor, suggest, dayIso, type Shot } from '../src/lib/photoStory.ts';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
let n = 0;
const shot = (t: number | null, lat: number | null, lng: number | null): Shot => ({ id: `s${++n}`, t, lat, lng });
// San Jose home, a Lisbon trip, a Tokyo trip, and one favorite cafe a few km from home
const HOME = { lat: 37.3382, lng: -121.8863 }, CAFE = { lat: 37.3688, lng: -122.0363 };
const LISBON = { lat: 38.7223, lng: -9.1393 }, PORTO = { lat: 41.1579, lng: -8.6291 }, TOKYO = { lat: 35.6762, lng: 139.6503 };
const country = (lng: number, lat: number) => lng < -100 ? 'United States of America' : lng < 0 ? 'Portugal' : 'Japan';

function fixture(): Shot[] {
  n = 0;
  const s: Shot[] = [];
  for (let d = 1; d <= 20; d++) s.push(shot(at(2023, 1, d, 19), HOME.lat + (d % 3) * 0.001, HOME.lng));   // 20 days at home
  for (let d = 2; d <= 6; d++) s.push(shot(at(2023, 2, d * 7, 11), CAFE.lat, CAFE.lng + 0.0005));       // the cafe, 5 Saturdays
  for (let d = 10; d <= 13; d++) s.push(shot(at(2023, 5, d, 15), LISBON.lat, LISBON.lng), shot(at(2023, 5, d, 20), LISBON.lat + 0.002, LISBON.lng));
  s.push(shot(at(2023, 5, 14, 13), PORTO.lat, PORTO.lng));
  for (let d = 1; d <= 3; d++) s.push(shot(at(2024, 4, d, 10), TOKYO.lat, TOKYO.lng));
  s.push(shot(at(2022, 8, 3, 21), null, null));   // the earliest photo, no location
  s.push(shot(null, HOME.lat, HOME.lng));         // a photo with no date
  return s;
}

test('Distance is right to within a few km (San Jose to Lisbon is about 9,100 km)', () => {
  assert.ok(Math.abs(km(HOME, LISBON) - 9130) < 60, String(km(HOME, LISBON)));
  assert.equal(round3(38.722349), 38.722);
});

test('Photos within about 1 km are one place, with first and last visit and the days they were there', () => {
  const places = clusterPlaces(fixture(), 1, country);
  const home = places[0];
  assert.equal(home.days, 20);
  assert.equal(home.count, 21);
  assert.equal(home.country, 'United States of America');
  assert.equal(home.first, at(2023, 1, 1, 19));
  assert.equal(home.last, at(2023, 1, 20, 19));
  const cafe = places.find(p => km(p, CAFE) < 1)!;
  assert.equal(cafe.days, 5);
  // the cafe and home are 14 km apart: never merged
  assert.ok(km(home, cafe) > 10);
});

test('Trips are runs of days away from home, with country, dates and length', () => {
  const story = buildStory(fixture(), { countryOf: country });
  assert.ok(story.home && km(story.home, HOME) < 1);
  assert.equal(story.trips.length, 2);
  const [lisbon, tokyo] = story.trips;
  assert.equal(lisbon.country, 'Portugal');
  assert.equal(lisbon.days, 5);   // 10 to 14 May, Porto on the last day
  assert.deepEqual(lisbon.countries, ['Portugal']);
  assert.ok(km(lisbon, LISBON) < 1);
  assert.equal(lisbon.start, at(2023, 5, 10, 15));
  assert.equal(tokyo.country, 'Japan');
  assert.equal(tokyo.days, 3);
  // the cafe is 14 km away, not 50: it's home ground, not a trip
  assert.ok(!story.trips.some(t => km(t, CAFE) < 5));
});

test('A gap of more than 3 days without photos ends a trip; one stray photo out of town is not a trip', () => {
  n = 0;
  const s: Shot[] = [];
  for (let d = 1; d <= 10; d++) s.push(shot(at(2023, 1, d), HOME.lat, HOME.lng));
  s.push(shot(at(2023, 2, 1), LISBON.lat, LISBON.lng), shot(at(2023, 2, 2), LISBON.lat, LISBON.lng));
  s.push(shot(at(2023, 2, 9), LISBON.lat, LISBON.lng), shot(at(2023, 2, 10), LISBON.lat, LISBON.lng));
  s.push(shot(at(2023, 3, 1), TOKYO.lat, TOKYO.lng));
  const story = buildStory(s, { countryOf: country });
  assert.equal(story.trips.length, 2);
  assert.deepEqual(story.trips.map(t => t.days), [2, 2]);
});

test('With no clear home (only holiday photos), each run of days is its own trip', () => {
  n = 0;
  const s = [shot(at(2023, 5, 10), LISBON.lat, LISBON.lng), shot(at(2023, 5, 11), LISBON.lat, LISBON.lng), shot(at(2024, 4, 1), TOKYO.lat, TOKYO.lng), shot(at(2024, 4, 2), TOKYO.lat, TOKYO.lng)];
  const story = buildStory(s, { countryOf: country });
  assert.equal(story.home, null);
  assert.deepEqual(story.trips.map(t => t.country), ['Portugal', 'Japan']);
});

test('Firsts and rhythm: the earliest photo, the busiest months, the spot they keep going back to, the favorite time', () => {
  const r = buildStory(fixture(), { countryOf: country }).rhythm;
  assert.equal(r.first, at(2022, 8, 3, 21));
  assert.equal(r.total, 39);
  assert.equal(r.dated, 38);
  assert.equal(r.located, 38);
  assert.deepEqual(r.topMonths[0], { year: 2023, month: 1, count: 20 });
  assert.equal(r.recurring.length, 1);           // the cafe; home is left out
  assert.equal(r.recurring[0].visits, 5);
  assert.ok(r.favorite);
  assert.equal(r.favorite!.part, 'evening');
  assert.equal(r.favorite!.weekend, false);
});

test('Suggestions: trips and recurring places ticked, home never offered, dates never assumed', () => {
  const story = buildStory(fixture(), { countryOf: country });
  const s = suggest(story);
  assert.deepEqual(s.filter(x => x.kind === 'trip').map(x => x.on), [true, true]);
  const pins = s.filter(x => x.kind === 'pin');
  assert.equal(pins.length, 1);
  assert.ok(pins.every(p => p.kind === 'pin' && km(p.place, HOME) > 5));
  const together = s.find(x => x.kind === 'together')!;
  assert.equal(together.on, false);
  assert.equal(s.find(x => x.kind === 'firstTrip')!.on, false);
});

test('Saved rows hold only a caption, a day, rounded coordinates and the chapter: nothing from the photo itself', () => {
  const story = buildStory(fixture(), { countryOf: country });
  const s = suggest(story).map(x => ({ ...x, on: true }));
  const { entries, occasions } = rowsFor(s, { userId: 'u1', circleId: 'c1', shared: false, caption: x => `caption ${x.id}`, label: x => x.kind === 'together' ? 'When we got together' : 'Our first trip' });
  assert.equal(entries.length, 3);
  for (const e of entries) {
    assert.deepEqual(Object.keys(e).sort(), ['content', 'date', 'is_favorite', 'is_shared', 'lat', 'lng', 'tags', 'type', 'user_id']);
    assert.equal(e.lat, round3(e.lat));
    assert.equal(e.lng, round3(e.lng));
    assert.equal(e.is_shared, false);
    assert.deepEqual(e.tags, ['circle:c1', 'from_photos']);
    assert.ok(e.date.endsWith('T12:00:00.000Z'));
  }
  assert.equal(occasions.length, 2);
  const together = occasions.find(o => o.kind === 'anniversary')!;
  assert.deepEqual([together.year, together.month, together.day], [2022, 8, 3]);
  assert.equal(together.source, 'app');
  // unticked items and empty captions are never saved
  const none = rowsFor(s.map(x => ({ ...x, on: false })), { userId: 'u1', circleId: 'c1', shared: true, caption: () => 'x', label: () => 'x' });
  assert.equal(none.entries.length + none.occasions.length, 0);
  const blank = rowsFor(s, { userId: 'u1', circleId: 'c1', shared: true, caption: () => '  ', label: () => '' });
  assert.equal(blank.entries.length + blank.occasions.length, 0);
  assert.equal(dayIso(at(2023, 5, 10, 23)), '2023-05-10T12:00:00.000Z');
});
