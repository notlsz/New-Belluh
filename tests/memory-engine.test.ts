import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { parseQuery, textHas } from '../src/lib/memory/query.ts';
import { cellOf, cellsFor, parseCities, nearestCity, matchVenue, type CellPlaces } from '../src/lib/memory/geo.ts';
import { labelsFrom, sensitivityFrom } from '../src/lib/memory/scoring.ts';
import { LABELS, SENSITIVE, sensitiveText } from '../src/lib/memory/vocab.ts';
import { assignFaces, peopleOf, interests, scrub, type Rec, type Cluster } from '../src/lib/memory/logic.ts';
import { createMemoryEngine, type Understander, type EngineDeps } from '../src/lib/memory/engine.ts';
import { looksLikeScreenshot } from '../src/lib/memory/reader.ts';
import { ocrLangs } from '../src/lib/memory/ocr.ts';
import { parseOverpass, overpassQuery, kindOf, CELL_RE } from '../supabase/functions/_shared/memoryplaces.ts';

const NOW = new Date(2026, 10, 2, 12).getTime();   // Mon 2 Nov 2026, local noon
const W = (y: number, m: number, d: number, h = 12, mi = 0) => Date.UTC(y, m - 1, d, h, mi);

// ------------------------------------------------------------------------------------------------------ query parsing

test('Search reads dates: seasons, months, holidays, years and relative words', () => {
  const p = (q: string) => parseQuery(q, { now: NOW, years: [2023, 2026] });
  let x = p('beach last summer');
  assert.deepEqual(x.dateRange, { from: '2026-06-01', to: '2026-08-31' });
  assert.equal(x.visualText, 'beach');
  assert.equal(x.retrievalIntent, 'mixed');
  x = p('how many coffee days in March');
  assert.equal(x.operation, 'count'); assert.equal(x.countUnit, 'days');
  assert.deepEqual(x.dateRange, { from: '2026-03-01', to: '2026-03-31' });
  assert.equal(x.visualText, 'coffee');
  assert.deepEqual(p('dinner in December').dateRange, { from: '2025-12-01', to: '2025-12-31' }, 'a month still to come this year means last year');
  x = p('Christmas');
  assert.equal(x.holiday, 'Christmas');
  assert.ok(x.dateRanges!.some(r => r.from === '2025-12-24' && r.to === '2025-12-26'));
  assert.equal(x.dateRange, null, 'every year, so no single range');
  assert.equal(x.retrievalIntent, 'date'); assert.equal(x.sort, 'newest');
  assert.deepEqual(p('christmas eve 2024').dateRange, { from: '2024-12-24', to: '2024-12-24' });
  assert.deepEqual(p("last valentine's day").dateRange, { from: '2026-02-14', to: '2026-02-14' });
  assert.deepEqual(p('thanksgiving 2025').dateRange, { from: '2025-11-27', to: '2025-11-30' });
  assert.deepEqual(p('snow 2024').dateRange, { from: '2024-01-01', to: '2024-12-31' });
  assert.deepEqual(p('last month').dateRange, { from: '2026-10-01', to: '2026-10-31' });
  assert.deepEqual(p('yesterday').dateRange, { from: '2026-11-01', to: '2026-11-01' });
  assert.deepEqual(p('this summer').dateRange, { from: '2026-06-01', to: '2026-08-31' });
  assert.deepEqual(p('last winter').dateRange, { from: '2025-12-01', to: '2026-02-28' });
  assert.equal(p('may flowers').dateRange ?? null, null, '"may" alone is not a month');
  assert.deepEqual(p('in May 2025').dateRange, { from: '2025-05-01', to: '2025-05-31' });
});

test('Search reads media, sort, quoted text and places the index knows', () => {
  const known = { cities: ['Tokyo', 'San Jose'], countries: ['Japan', 'United States of America'], venues: ['Ichiran Shibuya'], neighborhoods: ['Shibuya'], metros: [], cuisines: ['ramen'], kinds: ['cafe', 'museum'] };
  let x = parseQuery('ramen in Tokyo', { now: NOW, known });
  assert.deepEqual(x.placeFilters, ['Tokyo']);
  assert.deepEqual(x.placeKinds, ['ramen']);
  assert.equal(x.visualText, 'ramen', 'a cuisine is also what a photo shows');
  x = parseQuery('videos from 2023', { now: NOW });
  assert.equal(x.mediaType, 'video'); assert.equal(x.visualText, null);
  assert.equal(parseQuery('screenshots of tickets', { now: NOW }).mediaType, 'screenshot');
  assert.equal(parseQuery('first time at a museum', { now: NOW, known }).sort, 'oldest');
  x = parseQuery('the "matcha latte" menu', { now: NOW });
  assert.equal(x.quoted, 'matcha latte');
  x = parseQuery('coffee at Ichiran Shibuya', { now: NOW, known });
  assert.deepEqual(x.placeFilters, ['Ichiran Shibuya'], 'the venue wins over its neighborhood');
  assert.ok(textHas('Fresh RAMEN noodles', 'ramen'));
  assert.ok(textHas('two tickets please', 'ticket'), 'with or without a trailing s');
  assert.equal(textHas('grammar', 'ram'), null, 'whole words only');
});

// ------------------------------------------------------------------------------------------------------ geography

test('Cells are 0.01 degree, named by their south-west corner, deduped and sorted', () => {
  assert.equal(cellOf(35.6595, 139.7005), '35.65,139.70');
  assert.equal(cellOf(-33.8688, 151.2093), '-33.87,151.20');
  assert.equal(cellOf(37.33, -121.89), '37.33,-121.89');
  assert.equal(cellOf(40.71, -74.0), '40.71,-74.00');
  const cells = cellsFor([{ lat: 35.6595, lng: 139.7005 }, { lat: 35.6599, lng: 139.7001 }, { lat: 34.0, lng: 135.5 }]);
  assert.deepEqual(cells, ['34.00,135.50', '35.65,139.70']);
  cells.forEach(c => assert.match(c, CELL_RE));
});

const CITIES = parseCities(['#JP', 'Tokyo\t3569\t13969\t8336', 'Kyoto\t3502\t13576\t1459', '#US', 'San Jose\t3734\t-12189\t1013', 'Santa Cruz\t3697\t-12203\t64', 'Half Moon Bay\t3746\t-12243\t12'].join('\n'));
test('Without places, the nearest city of 15,000+ within 75 km comes from the device', () => {
  assert.equal(nearestCity(CITIES, 35.66, 139.70)?.name, 'Tokyo');
  assert.equal(nearestCity(CITIES, 37.0, -122.0)?.name, 'Santa Cruz');
  assert.equal(nearestCity(CITIES, 36.0, -120.0), null, 'nothing within 75 km');
  const v = matchVenue({ lat: 35.6595, lng: 139.7005 }, [
    { name: 'Hotel', kind: 'hotel', lat: 35.65952, lng: 139.70052 },
    { name: 'Ichiran', kind: 'restaurant', cuisine: 'ramen', lat: 35.6597, lng: 139.7007 },
    { name: 'Far Cafe', kind: 'cafe', lat: 35.6620, lng: 139.7005 },
  ], ['food']);
  assert.equal(v?.name, 'Ichiran', 'a restaurant fits a food photo better than the hotel next door');
  assert.equal(matchVenue({ lat: 35.6595, lng: 139.7005 }, [{ name: 'Far Cafe', kind: 'cafe', lat: 35.6620, lng: 139.7005 }]), null, 'over 60 m is no match');
});

test('memory-places reads Overpass: venues and areas per cell', () => {
  const q = overpassQuery(['35.65,139.70']);
  assert.match(q, /make cell name="35\.65,139\.70"/);
  assert.match(q, /\(35\.65,139\.7,35\.66,139\.71\)/);
  const cells = parseOverpass([
    { type: 'cell', tags: { name: '35.65,139.70' } },
    { type: 'node', lat: 35.6597, lon: 139.7007, tags: { amenity: 'restaurant', name: 'Ichiran', cuisine: 'Ramen' } },
    { type: 'way', center: { lat: 35.655, lon: 139.705 }, tags: { leisure: 'park', name: 'Miyashita Park', 'name:en': 'Miyashita Park' } },
    { type: 'node', lat: 35.65, lon: 139.7, tags: { amenity: 'bank', name: 'A bank' } },
    { type: 'area', tags: { boundary: 'administrative', admin_level: '2', name: 'Japan', 'name:en': 'Japan', 'ISO3166-1': 'JP' } },
    { type: 'area', tags: { boundary: 'administrative', admin_level: '4', name: '東京都', 'name:en': 'Tokyo' } },
    { type: 'area', tags: { boundary: 'administrative', admin_level: '7', name: '渋谷区', 'name:en': 'Shibuya' } },
    { type: 'area', tags: { place: 'suburb', name: 'Jinnan' } },
    { type: 'cell', tags: { name: '34.00,135.50' } },
  ]);
  assert.equal(cells.length, 2);
  assert.deepEqual(cells[0].venues.map(v => [v.name, v.kind, v.cuisine]), [['Ichiran', 'restaurant', 'ramen'], ['Miyashita Park', 'park', null]]);
  assert.equal(cells[0].city, 'Shibuya'); assert.equal(cells[0].metro, 'Tokyo'); assert.equal(cells[0].neighborhood, 'Jinnan');
  assert.equal(cells[0].country, 'Japan'); assert.equal(cells[0].countryCode, 'JP');
  assert.equal(kindOf({ natural: 'beach' }), 'beach');
  assert.equal(kindOf({ amenity: 'bank' }), null);
});

// ---------------------------------------------------------------------------------------------- labels and sensitivity

test('Labels come from the image model only when it is sure enough; sensitive kinds need to beat every label', () => {
  const sims = new Float32Array(LABELS.length).fill(0.12);
  const iRamen = LABELS.findIndex(l => l.name === 'ramen'), iPho = LABELS.findIndex(l => l.name === 'pho');
  sims[iRamen] = 0.29; sims[iPho] = 0.28;
  const ls = labelsFrom(sims);
  assert.equal(ls[0].name, 'ramen'); assert.equal(ls[1].name, 'pho');
  assert.ok(ls[0].p > 0.5);
  assert.deepEqual(labelsFrom(new Float32Array(LABELS.length).fill(0.12).map((x, i) => i === iRamen ? 0.16 : x)), [], 'a weak best guess is no label');
  const nSens = SENSITIVE.reduce((n, s) => n + s.prompts.length, 0);
  const sens = new Float32Array(nSens).fill(0.1);
  sens[0] = 0.234;   // the museum portrait from calibration
  assert.equal(sensitivityFrom(sens, new Float32Array(LABELS.length).fill(0.2)).kind, null);
  sens[0] = 0.3;
  assert.equal(sensitivityFrom(sens, new Float32Array(LABELS.length).fill(0.2)).kind, 'id');
  assert.equal(sensitiveText('Card 4111 1111 1111 1111 exp 12/29'), 'payment');
  assert.equal(sensitiveText('Your verification code is 123456'), 'credential');
  assert.equal(sensitiveText('PASSPORT  Date of birth 01 JAN 1990'), 'id');
  assert.equal(sensitiveText('Ichiran ramen 980 yen, order 1234 5678 9012 3456'), null, 'a number that fails Luhn is not a card');
});

test('Screenshots: by name, or a screen-shaped PNG with no camera or GPS', () => {
  assert.ok(looksLikeScreenshot({ name: 'Screenshot 2026-03-01 at 10.00.00.png', type: 'image/png', hasCamera: false, hasGps: false, w: 100, h: 100 }));
  assert.ok(looksLikeScreenshot({ name: 'IMG_1.PNG', type: 'image/png', hasCamera: false, hasGps: false, w: 1179, h: 2556 }));
  assert.ok(!looksLikeScreenshot({ name: 'IMG_2.JPG', type: 'image/jpeg', hasCamera: true, hasGps: true, w: 3024, h: 4032 }));
  assert.deepEqual(ocrLangs('ja-JP'), ['eng', 'jpn']); assert.deepEqual(ocrLangs('zh-TW'), ['eng', 'chi_tra']); assert.deepEqual(ocrLangs('en-US'), ['eng']);
});

// --------------------------------------------------------------------------------------------- the engine, with fakes

// A fake image model: each photo has a topic; its embedding points at the topic; labels and text follow it.
const TOPICS = ['beach', 'ramen', 'coffee', 'concert', 'dog', 'sushi', 'park', 'idcard'];
const LABEL_OF: Record<string, string> = { beach: 'beach', ramen: 'ramen', coffee: 'coffee', concert: 'concert', dog: 'dog', sushi: 'sushi', park: 'park', idcard: 'document' };
const N_SENS = SENSITIVE.reduce((n, s) => n + s.prompts.length, 0);
function vecFor(topic: string | null, jitter = 0): Float32Array {
  const v = new Float32Array(TOPICS.length + 1);
  if (topic) v[TOPICS.indexOf(topic)] = 1; else v[TOPICS.length] = 1;
  v[TOPICS.length] += jitter;
  const n = Math.hypot(...v); return v.map(x => x / n);
}
const fakeModel = (): Understander => ({
  async load({ onProgress }) { onProgress(10, 10); return { promptMatrix: null }; },
  async image(work: any) {
    if (work instanceof Blob) work = JSON.parse(await work.text());   // a stored preview, after a reload
    const m = work as { topic: string; jitter?: number; faces?: number[] };
    const sims = new Float32Array(LABELS.length).fill(0.12);
    sims[LABELS.findIndex(l => l.name === LABEL_OF[m.topic])] = 0.3;
    const sens = new Float32Array(N_SENS).fill(0.1);
    if (m.topic === 'idcard') sens[0] = 0.33;
    const faces = (m.faces ?? []).map(p => ({ box: [0.4, 0.2, 0.1, 0.15] as [number, number, number, number], score: 0.95, emb: Float32Array.from({ length: 128 }, (_, i) => (i === p ? 1 : 0.01)) }));
    return { vec: vecFor(m.topic, m.jitter ?? 0), sims, sens, faces };
  },
  async text(t: string) { const topic = TOPICS.find(x => t.includes(x)) ?? null; return vecFor(topic); },
  dispose() {},
});

interface Fake { name: string; type: string; id: string; topic: string; wall: number; lat?: number; lng?: number; media?: 'photo' | 'screenshot' | 'video'; text?: string; jitter?: number; faces?: number[] }
const file = (f: Partial<Fake> & { id: string; topic: string; wall: number }): any => ({ name: `IMG_${f.id}.JPG`, type: f.media === 'screenshot' ? 'image/png' : 'image/jpeg', ...f });
const TOKYO = { lat: 35.6595, lng: 139.7005 }, HOME = { lat: 37.3382, lng: -121.8863 }, BEACH = { lat: 36.9615, lng: -122.0242 };

function deps(extra: Partial<EngineDeps> = {}): EngineDeps & { sent: string[][] } {
  const sent: string[][] = [];
  return {
    sent,
    idb: new IDBFactory(), now: () => NOW, uiLang: () => 'en',
    reader: { async read(f: any) { return { id: f.id, mediaType: f.media ?? 'photo', wall: f.wall, date: new Date(f.wall).toISOString(), timeZone: null, lat: f.lat ?? null, lng: f.lng ?? null, w: 4032, h: 3024, thumb: new Blob([JSON.stringify({ topic: f.topic, jitter: f.jitter, faces: f.faces })], { type: 'image/webp' }), work: { topic: f.topic, jitter: f.jitter, faces: f.faces } as any }; } },
    understander: fakeModel(),
    ocr: async () => ({ read: async (f: any) => f.text ?? '', close: async () => {} }),
    cities: async () => CITIES,
    countryOf: (lng: number) => lng > 100 ? 'Japan' : 'United States of America',
    places: async (cells: string[]) => {
      sent.push(cells);
      return cells.map((cell): CellPlaces => cell === '35.65,139.70'
        ? { cell, neighborhood: 'Jinnan', city: 'Shibuya', metro: 'Tokyo', country: 'Japan', countryCode: 'JP', venues: [{ name: 'Ichiran', kind: 'restaurant', cuisine: 'ramen', lat: 35.6596, lng: 139.7006 }, { name: 'Blue Bottle', kind: 'cafe', cuisine: 'coffee_shop', lat: 35.6599, lng: 139.7004 }] }
        : { cell, neighborhood: null, city: null, metro: null, country: null, countryCode: null, venues: [] });
    },
    ...extra,
  };
}

function library(): any[] {
  const out: any[] = [];
  let n = 0;
  const id = () => `f${String(++n).padStart(3, '0')}`;
  // Beach days last summer, two shots of the same moment among them
  out.push(file({ id: id(), topic: 'beach', wall: W(2026, 7, 4, 15, 0), ...BEACH }));
  out.push(file({ id: id(), topic: 'beach', wall: W(2026, 7, 4, 15, 0) + 20_000, jitter: 0.05, ...BEACH }));
  out.push(file({ id: id(), topic: 'beach', wall: W(2026, 8, 20, 11), ...BEACH }));
  out.push(file({ id: id(), topic: 'beach', wall: W(2025, 7, 1, 11), ...BEACH }));
  // A Tokyo trip in March with ramen, and coffee days at home and in Tokyo
  for (const d of [10, 11, 12, 13]) out.push(file({ id: id(), topic: 'ramen', wall: W(2026, 3, d, 20), ...TOKYO }));
  for (const d of [10, 12]) out.push(file({ id: id(), topic: 'coffee', wall: W(2026, 3, d, 9), lat: 35.65992, lng: 139.70041 }));
  for (const d of [2, 3, 20]) out.push(file({ id: id(), topic: 'coffee', wall: W(2026, 3, d, 9), ...HOME }));
  // Ramen at home too, often, this year and before: an interest
  for (const m of [1, 2, 4, 5, 6, 7, 8, 9, 10]) out.push(file({ id: id(), topic: 'ramen', wall: W(2026, m, 15, 19), ...HOME }));
  for (const m of [3, 6, 9]) out.push(file({ id: id(), topic: 'ramen', wall: W(2025, m, 5, 19), ...HOME }));
  // Concerts long ago, none lately: lapsed
  for (const m of [1, 2, 3]) out.push(file({ id: id(), topic: 'concert', wall: W(2025, m, 22, 21), ...HOME }));
  // A dog at home on many days
  for (const d of [1, 8, 15, 22]) out.push(file({ id: id(), topic: 'dog', wall: W(2026, 10, d, 10), ...HOME, faces: d % 2 ? [3] : [3, 7] }));
  // A photo of an ID card, and a screenshot with a password on it
  out.push(file({ id: id(), topic: 'idcard', wall: W(2026, 9, 1, 10), ...HOME, faces: [7] }));
  out.push(file({ id: id(), topic: 'park', wall: W(2026, 9, 2, 10), media: 'screenshot', text: 'Your password: hunter2' }));
  out.push(file({ id: id(), topic: 'park', wall: W(2026, 9, 3, 10), media: 'screenshot', text: 'Ramen Week tickets on sale Friday' }));
  // Park days
  for (const d of [5, 12]) out.push(file({ id: id(), topic: 'park', wall: W(2026, 10, d, 16), ...HOME, faces: d === 5 ? [9] : [] }));
  return out;
}

async function indexed(extra: Partial<EngineDeps> = {}, opts: Record<string, unknown> = {}) {
  const d = deps(extra);
  const e = createMemoryEngine(d);
  const states: string[] = [];
  e.onState(s => states.push(s.type === 'indexing' ? `indexing:${s.progress.step}` : s.type));
  if (Object.keys(opts).length) await e.setOptions(opts as any);
  const files = library();
  await e.addFiles(files);
  await e.idle();
  return { e, d, states, files };
}

test('Indexing goes through its states and ends ready; the same photo picked twice is indexed once', async () => {
  const { e, states, files } = await indexed();
  assert.equal(e.state().type, 'ready');
  assert.ok(states.includes('indexing:reading'));
  assert.ok(states.includes('downloadingModels'));
  assert.ok(states.includes('indexing:understanding'));
  const s = await e.summary();
  assert.equal(s.photos + s.screenshots, files.length);
  assert.equal(s.screenshots, 2);
  await e.addFiles([files[0], files[1]]);
  assert.equal((await e.summary()).photos, s.photos, 'deduped by content hash');
  const it = (await e.item('f005'))!;
  assert.equal(it.location?.city, 'Tokyo'); assert.equal(it.location?.country, 'Japan');
  assert.equal(it.location?.lat, 35.66, 'a Location is rounded to 3 decimals');
  assert.equal((it as any).exact, undefined, 'exact coordinates never leave the engine');
  assert.equal((it as any).wall, undefined);
});

test('Search ranks by the image model, filters by plan, and groups near-duplicates', async () => {
  const { e } = await indexed();
  const r = await e.search('beach last summer');
  assert.deepEqual(r.plan.dateRange, { from: '2026-06-01', to: '2026-08-31' });
  assert.equal(r.results.length, 2, 'two moments: the same-minute pair is one');
  const pair = r.results.find(x => x.duplicates.length);
  assert.ok(pair, 'the two shots of 4 July are grouped');
  assert.deepEqual(pair!.duplicates.length, 1);
  assert.ok(r.results.every(x => x.matchReasons.includes('image') && x.matchReasons.includes('date')));
  assert.ok(r.results.every(x => x.relevance === 'high'));
  const all = await e.search('beach');
  assert.equal(all.results.length, 3, 'without a date, last year too');
  assert.ok(!all.results.some(x => x.labels[0]?.name === 'ramen'));
  const t = await e.search('"Ramen Week"');
  assert.equal(t.results.length, 1); assert.match(t.results[0].matchedText ?? '', /Ramen Week/);
  const shots = await e.search('screenshots');
  assert.equal(shots.results.length, 2);
  assert.ok(shots.results.some(x => x.sensitivity === 'credential'), 'search still returns sensitive items, flagged');
  const c = await e.search('how many coffee days in March');
  assert.equal(c.plan.operation, 'count');
  assert.deepEqual((c as any).count, { photos: 5, days: 5 });
});

test('With places on, only 0.01 degree cells are sent; venues and cuisines come back to the device', async () => {
  const { e, d } = await indexed({}, { places: true });
  assert.ok(d.sent.length >= 1);
  for (const batch of d.sent) for (const c of batch) assert.match(c, CELL_RE);
  const flat = d.sent.flat();
  assert.equal(new Set(flat).size, flat.length, 'each cell once');
  assert.ok(flat.length < 10, 'cells, not photos');
  const r = await e.search('ramen in Tokyo');
  assert.ok(r.results.length >= 4);
  assert.ok(r.results.every(x => x.location?.metro === 'Tokyo' || x.location?.city === 'Tokyo'));
  const ram = r.results.find(x => x.places[0]?.name === 'Ichiran');
  assert.ok(ram, 'matched to the restaurant within 60 m');
  assert.deepEqual(ram!.cuisines, ['ramen']);
  const v = await e.search('ramen at Ichiran');
  assert.ok(v.results.every(x => x.places[0]?.name === 'Ichiran'));
});

test('Sensitive photos are left out of facets, interests, people and every tool', async () => {
  const { e } = await indexed({}, { people: true });
  const f = await e.facets(32, 32);
  const sampled = new Set(f.flatMap(x => x.samples));
  const id = (await e.search('document')).results.find(x => x.sensitivity === 'id');
  assert.ok(id, 'the ID card is marked');
  assert.ok(!sampled.has(id!.id));
  assert.ok(!f.some(x => x.name === 'document'));
  assert.ok(f.find(x => x.kind === 'food'), 'a food group');
  assert.ok(!f.some(x => x.samples.length && x.kind === 'label' && x.name === 'park' && x.count > 2), 'screenshots are not counted');
  for (const name of ['search_photos', 'list_places', 'list_visits', 'count_days', 'timeline', 'facets', 'interests', 'trips'] as const) {
    const res = await e.runTool({ name, args: { query: 'document', place: 'San Jose', granularity: 'month' } });
    assert.ok(!res.ids.includes(id!.id), `${name} left the ID card out`);
    assert.ok(!/hunter2|password/i.test(res.text), `${name} left the password screenshot out`);
  }
  const people = await e.people();
  assert.ok(people.every(p => p.cover !== id!.id));
});

test('Tool text is short and never holds coordinates or file names', async () => {
  const { e } = await indexed({}, { places: true });
  const calls = [
    { name: 'search_photos', args: { query: 'ramen in Tokyo' } }, { name: 'search_photos', args: { query: 'beach' } },
    { name: 'list_places', args: {} }, { name: 'list_places', args: { kind: 'city' } }, { name: 'list_places', args: { kind: 'restaurant' } },
    { name: 'list_visits', args: { place: 'Ichiran' } }, { name: 'count_days', args: { query: 'coffee', from: '2026-03-01', to: '2026-03-31' } },
    { name: 'timeline', args: { granularity: 'month' } }, { name: 'timeline', args: { granularity: 'week', from: '2026-10-01' } },
    { name: 'facets', args: {} }, { name: 'interests', args: { window: 'lifetime' } }, { name: 'trips', args: {} },
  ] as const;
  for (const c of calls) {
    const r = await e.runTool(c as any);
    assert.ok(r.text.length <= 2000, `${c.name} is capped`);
    assert.ok(!/\d+\.\d{3,}/.test(r.text), `${c.name} has no coordinates: ${r.text}`);
    assert.ok(!/IMG_|\.jpe?g|\.png/i.test(r.text), `${c.name} has no file names`);
    assert.ok(r.text.length > 0);
  }
  const visits = await e.runTool({ name: 'list_visits', args: { place: 'Ichiran' } });
  assert.match(visits.text, /2026-03-1\d/);
  const days = await e.runTool({ name: 'count_days', args: { query: 'coffee', from: '2026-03-01', to: '2026-03-31' } });
  assert.match(days.text, /^5 days/);
  const trips = await e.runTool({ name: 'trips', args: {} });
  assert.match(trips.text, /Japan/);
  assert.equal(scrub('at 35.6595, 139.7005 in IMG_0001.HEIC'), 'at [place] in [file]');
});

test('Interests are scored against a typical adult: active, emerging, lapsed', async () => {
  const { e } = await indexed();
  const now = await e.interests('now');
  const ramen = now.find(i => i.name === 'Ramen');
  assert.ok(ramen, 'ramen stands out');
  assert.equal(ramen!.status, 'active');
  assert.ok(ramen!.vsTypical! > 3);
  assert.ok(!now.some(i => i.status === 'lapsed'), 'now leaves lapsed out');
  const life = await e.interests('lifetime');
  const music = life.find(i => i.name === 'Live music');
  assert.equal(music?.status, 'lapsed');
  const all = await e.interests('lifetime', true);
  assert.ok(all.length >= life.length);
  assert.ok(!life.some(i => /document|baby/i.test(i.name)), 'nothing about documents or children');
  // A pure check of the yardstick: ten coffee days in a year of daily photos is typical, ten ramen days is not
  const recs: Rec[] = [];
  for (let d = 0; d < 300; d++) recs.push({ id: `x${d}`, date: null, mediaType: 'photo', places: [], cuisines: [], labels: [{ name: d % 30 === 0 ? 'coffee' : d % 30 === 1 ? 'ramen' : 'park', p: 0.9 }], sensitivity: null, people: [], wall: Date.UTC(2026, 0, 1) + d * 86_400_000, stage: 'understood', addedAt: 0 });
  const xs = interests(recs, NOW, 'lifetime', true);
  assert.equal(xs.find(i => i.name === 'Coffee')?.typical, true);
  assert.equal(xs.find(i => i.name === 'Ramen')?.typical, false);
});

test('People are grouped on the device, opt-in only; one-off faces are left out unless asked', async () => {
  const off = await indexed();
  assert.deepEqual(await off.e.people(), [], 'off by default');
  const { e } = await indexed({}, { people: true });
  const ps = await e.people();
  assert.deepEqual(ps.map(p => p.photos), [4, 2], 'the second face is in three photos, but one is the ID card');
  const all = await e.people(true);
  assert.equal(all.length, 3, 'with includeAll, the face seen once too');
  await e.namePerson(ps[0].id, 'Mia');
  assert.equal((await e.people())[0].name, 'Mia');
  const photos = await e.photosOf(ps[0].id);
  assert.equal(photos.length, 4);
  const withHer = await e.search('dog', { people: [ps[0].id] });
  assert.equal(withHer.results.length, 4);
  // Pure clustering: same face joins, a different one starts a group
  const one = (i: number) => Float32Array.from({ length: 8 }, (_, k) => (k === i ? 1 : 0));
  let n = 0;
  const cs: Cluster[] = assignFaces([], [{ item: 'a', box: [0, 0, 0.1, 0.1], emb: one(1), score: 1 }, { item: 'b', box: [0, 0, 0.1, 0.1], emb: one(1), score: 1 }, { item: 'c', box: [0, 0, 0.1, 0.1], emb: one(2), score: 1 }], () => `p${++n}`);
  assert.equal(cs.length, 2);
  const byId = new Map(['a', 'b', 'c'].map(id => [id, { id, sensitivity: null, wall: W(2026, 1, 1) } as unknown as Rec]));
  assert.equal(peopleOf(cs, byId).length, 1);
});

test('Pause lasts; deleteIndex keeps models, places and options; reset clears everything', async () => {
  const d = deps();
  const e = createMemoryEngine(d);
  await e.setOptions({ places: true, readText: false });
  await e.pause();
  const files = library();
  await e.addFiles(files.slice(0, 5));
  assert.equal(e.state().type, 'paused');
  assert.equal((await e.search('beach')).results.length, 0, 'nothing understood while paused');
  // A new engine on the same database (another visit): still paused, options kept
  const e2 = createMemoryEngine({ ...d });
  await e2.open();
  assert.equal(e2.state().type, 'paused');
  assert.equal(e2.options.places, true);
  await e2.resume();
  await e2.idle();
  assert.equal(e2.state().type, 'ready');
  assert.ok((await e2.search('beach')).results.length >= 2, 'understood from the stored previews');
  assert.ok(await e2.thumbnail('f001'));
  await e2.deleteIndex();
  assert.equal(e2.state().type, 'notStarted');
  await assert.rejects(() => e2.search('beach'), (err: any) => err.code === 'noIndex');
  assert.equal(e2.options.places, true, 'options kept');
  const sentBefore = d.sent.flat().length;
  await e2.addFiles(files.slice(0, 5));
  await e2.idle();
  assert.equal(d.sent.flat().length, sentBefore, 'place data kept: no cell asked again');
  await e2.reset();
  assert.equal(e2.state().type, 'notStarted');
  assert.equal(e2.options.places, false, 'options back to defaults');
  await e2.setOptions({ places: true });
  await e2.addFiles(files.slice(0, 5));
  await e2.idle();
  assert.ok(d.sent.flat().length > sentBefore, 'place data gone: cells asked again');
});

test('The shipped vocabulary embeddings match the vocabulary (run scripts/memory-prompts.mjs after changing it)', async () => {
  const fs = await import('node:fs');
  const { decodePrompts, encodePrompts, vocabKey } = await import('../src/lib/memory/prompts.ts');
  const d = decodePrompts(fs.readFileSync(new URL('../src/lib/memory/data/prompts.txt', import.meta.url), 'utf8'));
  assert.ok(d);
  assert.equal(d!.key, vocabKey());
  assert.equal(d!.rows.length, (LABELS.length + N_SENS) * d!.dim);
  const v = Float32Array.from({ length: 16 }, (_, i) => Math.sin(i + 1));
  const n = Math.hypot(...v); const unit = v.map(x => x / n);
  const back = decodePrompts(encodePrompts('k', 16, unit))!;
  assert.ok(Math.max(...unit.map((x, i) => Math.abs(x - back.rows[i]))) < 0.01, 'int8 keeps them close');
});
