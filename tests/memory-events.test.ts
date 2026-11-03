// Belluh Memory, the last Rollup features: events (on the device, the opt-in lookup, the tool, the Afterglow lines),
// Keep adding from a folder, run reports, the photos just indexed, and search context.
import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { LABELS, SENSITIVE } from '../src/lib/memory/vocab.ts';
import { createMemoryEngine, type Understander, type EngineDeps } from '../src/lib/memory/engine.ts';
import { parseTicket, ticketDate, detectEvents, visitsOf, lookupCandidates, lookupRequest, eventLines, eventsTool, type EventRec, type EventWords } from '../src/lib/memory/events.ts';
import { capped, contextOf, eventMatches, type Rec } from '../src/lib/memory/logic.ts';
import { cleanReport, sendRunReport, worthReporting, type RunReport } from '../src/lib/memory/reports.ts';
import { newFiles, scanFolder, fileKey, type FolderState } from '../src/lib/memory/folder.ts';
import { withEventLines, draftFromProfile, SECTION_KEYS } from '../src/lib/memory/passport.ts';
import { progressLine } from '../src/lib/memory/agent.ts';
import { MEMORY_TOOL_NAMES, cleanToolArgs } from '../supabase/functions/_shared/memoryrules.ts';
import { cleanVisits, readSetlists, readTicketmaster, readWikidata, kindFromType, sameVenue, eveningOf, wikidataQuery, ticketmasterUrl, setlistUrl } from '../supabase/functions/_shared/memoryevents.ts';
import more from '../src/i18n/ui/memoryMore.ts';
import type { CellPlaces } from '../src/lib/memory/geo.ts';

const NOW = Date.UTC(2026, 10, 2, 12);
const W = (y: number, m: number, d: number, h = 12, mi = 0) => Date.UTC(y, m - 1, d, h, mi);
const EN: EventWords = more.en.events;

// ------------------------------------------------------------------------------------------------------------ tickets

test('Tickets: the kind, the day and the name, in several languages; train tickets and boarding passes are not events', () => {
  const t = parseTicket('PHOENIX\nAlpha Zulu Tour\nThe Fillmore\nSat, May 16, 2026 8:00 PM\nGENERAL ADMISSION\nTicketmaster', W(2026, 4, 2));
  assert.deepEqual(t, { kind: 'concert', day: '2026-05-16', name: 'PHOENIX' });
  assert.equal(parseTicket('Golden State Warriors vs Los Angeles Lakers\nChase Center\nSection 112 Row 4 Seat 9\n03/14/2026', null)?.name, 'Golden State Warriors vs Los Angeles Lakers');
  assert.equal(parseTicket('Golden State Warriors vs Los Angeles Lakers\nSection 112 Row 4\n03/14/2026', null)?.kind, 'game');
  assert.equal(parseTicket('Berlin Marathon 2026\nStartnummer 1234\nEntry confirmed\n27. September 2026', null)?.kind, 'race');
  assert.equal(parseTicket('コンサート チケット\n2026年7月4日 開場18:00\n東京ドーム', null)?.day, '2026-07-04');
  assert.equal(parseTicket('Billet concert\nZénith Paris\n12 mars 2026', null)?.day, '2026-03-12');
  assert.equal(parseTicket('Boarding pass\nFlight UA 837 Seat 32A\nGate 12\nMay 3, 2026', null), null, 'a flight is not an event');
  assert.equal(parseTicket('Train ticket Coach 5 Seat 61\nLondon to Paris 12 Mar 2026', null), null);
  assert.equal(parseTicket('Ramen Week tickets on sale Friday', null), null, 'no day, no event');
  assert.equal(ticketDate('Doors 7pm, Nov 8', W(2026, 10, 20)), '2026-11-08', 'no year: the next one on or after the screenshot');
  assert.equal(ticketDate('Doors 7pm, Jan 8', W(2026, 10, 20)), '2027-01-08');
  assert.equal(ticketDate('25/12/2026', null), '2026-12-25', 'day first when it must be');
});

// ------------------------------------------------------------------------------------------------- events, pure

const rec = (id: string, wall: number, o: Partial<Rec> = {}): Rec => ({
  id, date: new Date(wall).toISOString(), mediaType: 'photo', places: [], cuisines: [], labels: [], sensitivity: null, people: [],
  wall, stage: 'understood', addedAt: 0, exact: { lat: 37.7841, lng: -122.4330 }, location: { city: 'San Francisco', lat: 37.784, lng: -122.433 }, ...o,
} as Rec);
const FILLMORE = { name: 'The Fillmore', kind: 'music_venue', cuisine: null };
const ARENA = { name: 'Chase Center', kind: 'stadium', cuisine: null };

test('An event needs the photos to support it: a stage or crowd, a ticket, or a listing plus photos at the venue over a while', () => {
  const items: Rec[] = [
    // A show at the Fillmore: the photos show a concert
    rec('a1', W(2026, 5, 16, 21, 45), { places: [FILLMORE], labels: [{ name: 'concert', p: 0.6 }] }),
    rec('a2', W(2026, 5, 17, 0, 40), { places: [FILLMORE], labels: [{ name: 'concert', p: 0.5 }] }),
    // A walk past the arena on a game night: one photo of the street, nothing that shows a game
    rec('b1', W(2026, 3, 14, 19), { places: [ARENA], labels: [{ name: 'old town street', p: 0.4 }], exact: { lat: 37.768, lng: -122.3877 }, location: { city: 'San Francisco', lat: 37.768, lng: -122.388 } }),
    // An evening at the arena: three photos at the venue over two hours, no game label
    ...[0, 1, 2].map(i => rec(`c${i}`, W(2026, 4, 2, 19 + i), { places: [ARENA], labels: [{ name: 'beer', p: 0.4 }], exact: { lat: 37.768, lng: -122.3877 }, location: { city: 'San Francisco', lat: 37.768, lng: -122.388 } })),
    // An ID card at a concert never counts
    rec('s1', W(2026, 6, 1, 21), { labels: [{ name: 'concert', p: 0.6 }], sensitivity: 'id' }),
  ];
  const visits = visitsOf(items);
  const fillmore = visits.find(v => v.ids.includes('a1'))!;
  assert.deepEqual(fillmore.ids, ['a1', 'a2'], 'a 12:40 am encore belongs to the evening before');
  assert.equal(fillmore.day, '2026-05-16');
  let ev = detectEvents(items, { now: NOW });
  assert.equal(ev.length, 1, 'only the show: no game from a walk past, nothing without a lookup at the arena');
  assert.equal(ev[0].kind, 'concert'); assert.equal(ev[0].venue, 'The Fillmore'); assert.equal(ev[0].source, 'photos');
  // With the lookup on, the arena evening is a game; the walk past still is not, even with a listing
  const arena = visits.find(v => v.ids.includes('c0'))!, walk = visits.find(v => v.ids.includes('b1'))!;
  ev = detectEvents(items, { now: NOW, lookups: { [arena.key]: { name: 'Warriors vs Lakers', kind: 'game', genre: 'Basketball' }, [walk.key]: { name: 'Warriors vs Suns', kind: 'game' } } });
  assert.deepEqual(ev.map(e => e.name).filter(Boolean), ['Warriors vs Lakers']);
  assert.ok(!ev.some(e => e.ids.includes('s1')));
});

test('Only cells, venue names and times are asked about, and only for visits that look like events', () => {
  const items: Rec[] = [
    rec('a1', W(2026, 5, 16, 21), { places: [FILLMORE], labels: [{ name: 'concert', p: 0.6 }] }),
    rec('k1', W(2026, 5, 18, 9), { labels: [{ name: 'coffee', p: 0.7 }] }),
  ];
  const cands = lookupCandidates(visitsOf(items), () => [{ name: 'Fillmore', kind: 'music_venue' }, { name: 'Cafe', kind: 'cafe' }]);
  assert.equal(cands.length, 2, 'the coffee morning is in a cell with a venue, so it may be asked about');
  const only = lookupCandidates(visitsOf(items));
  assert.equal(only.length, 1, 'without venues around, only the visit whose photos show an event');
  const req = lookupRequest(only[0]);
  assert.deepEqual(Object.keys(req).sort(), ['cell', 'end', 'start', 'venues']);
  assert.equal(req.cell, '37.78,-122.44');
  assert.equal(req.start, '2026-05-16T21:00');
  assert.ok(!JSON.stringify(req).includes('37.7841'), 'never coordinates');
});

test('A ticket names the event of that day, stands for one on its own, or is listed as coming up', () => {
  const items: Rec[] = [
    rec('a1', W(2026, 5, 16, 21), { places: [FILLMORE], labels: [{ name: 'concert', p: 0.6 }] }),
    rec('t1', W(2026, 4, 2, 10), { mediaType: 'screenshot', exact: null, location: null, text: 'PHOENIX\nThe Fillmore\nSat, May 16, 2026\nGeneral Admission ticket' }),
    rec('t2', W(2026, 1, 5, 10), { mediaType: 'screenshot', exact: null, location: null, text: 'Hamilton\nOrpheum Theatre\nORCH Row F Seat 7 tickets\nFeb 21, 2026' }),
    rec('t3', W(2026, 10, 20, 10), { mediaType: 'screenshot', exact: null, location: null, text: 'Fred again..\nChase Center\nGA Floor ticket\nDec 5, 2026 concert' }),
  ];
  const ev = detectEvents(items, { now: NOW });
  const show = ev.find(e => e.day === '2026-05-16')!;
  assert.equal(show.name, 'PHOENIX'); assert.ok(show.ticket); assert.ok(show.ids.includes('t1'));
  const play = ev.find(e => e.day === '2026-02-21')!;
  assert.equal(play.kind, 'show'); assert.equal(play.source, 'ticket'); assert.equal(play.upcoming, false);
  const soon = ev.find(e => e.day === '2026-12-05')!;
  assert.ok(soon.upcoming);
  const tool = eventsTool(ev, {}, capped);
  assert.match(tool.text, /^2 events \(newest first\): 1 concert, 1 show\./);
  assert.match(tool.text, /2026-05-16 Sat: concert PHOENIX at The Fillmore, San Francisco/);
  assert.match(tool.text, /Upcoming, from tickets: 2026-12-05 concert Fred again\.\./);
  assert.equal(eventsTool(ev, { kind: 'game' }, capped).text, 'No games found in the photos.');
  assert.equal(eventsTool(ev, { from: '2026-03-01' }, capped).text.split('\n').length, 3);
});

test('The Afterglow Events lines: "House shows, nine this year", grouped by genre, with the photos behind each', () => {
  const ev: EventRec[] = [];
  for (let i = 0; i < 9; i++) ev.push({ key: `h${i}`, day: `2026-0${1 + (i % 9)}-1${i}`, start: null, end: null, kind: 'concert', name: i === 0 ? null : 'Fred again..', venue: 'The Midway', city: 'San Francisco', genre: 'House', performers: [], source: 'lookup', ticket: false, upcoming: false, ids: [`p${i}`] });
  ev.push({ key: 'g1', day: '2025-04-02', start: null, end: null, kind: 'game', name: 'Warriors vs Lakers', venue: 'Chase Center', city: null, genre: null, performers: [], source: 'lookup', ticket: false, upcoming: false, ids: ['g'] });
  ev.sort((a, b) => (a.day < b.day ? 1 : -1));
  const lines = eventLines(ev, NOW, EN);
  assert.equal(lines[0].text, 'House shows, nine this year');
  assert.equal(lines[0].ids.length, 3);
  assert.equal(lines[1].text, 'Games, one since 2025');
  assert.match(lines[2].text, /^Most recently Fred again\.\. \(The Midway\), 2026-/);
  const ja = eventLines(ev, NOW, more.ja.events, { lang: 'ja' });
  assert.equal(ja[0].text, 'Houseのライブ、今年9回');
  // On Our Afterglow: added when the AI wrote no Events line, never over one it wrote
  const draft = draftFromProfile({ json: { title: 'Sunrise runner', music: ['Jazz at Smalls'] }, evidence: {}, refused: [] });
  assert.ok(SECTION_KEYS.includes('events'));
  const filled = withEventLines(draft, ev, { words: EN, now: NOW });
  assert.equal(filled.sections.events[0].text, 'House shows, nine this year');
  assert.deepEqual(filled.sections.events[0].evidence, lines[0].ids);
  const written = draftFromProfile({ json: { events: ['Techno nights, monthly'] }, evidence: {}, refused: [] });
  assert.equal(withEventLines(written, ev, { words: EN, now: NOW }).sections.events[0].text, 'Techno nights, monthly');
});

test('Search context and event words', () => {
  const r = rec('x', W(2026, 5, 16, 21), { people: ['p1'] });
  assert.deepEqual(contextOf(r, { lat: 37.33, lng: -121.89 }), { awayFromHome: true, withPeople: true, partOfDay: 'evening', weekend: true });
  assert.equal(contextOf(r, null).awayFromHome, null);
  const e = { name: 'Phoenix', kind: 'concert' as const, venue: 'The Fillmore', genre: 'Indie rock' };
  assert.ok(eventMatches(e, 'phoenix'));
  assert.ok(eventMatches(e, 'concerts'));
  assert.ok(eventMatches(e, 'indie rock'));
  assert.ok(!eventMatches(e, 'ramen'));
});

// ----------------------------------------------------------------------------------------------------- the engine

const TOPICS = ['concert', 'stadium', 'coffee', 'park'];
const N_SENS = SENSITIVE.reduce((n, s) => n + s.prompts.length, 0);
const vecFor = (t: string | null) => { const v = new Float32Array(TOPICS.length + 1); v[t ? TOPICS.indexOf(t) : TOPICS.length] = 1; return v; };
const fakeModel = (): Understander => ({
  async load({ onProgress }) { onProgress(90, 90); return { promptMatrix: null }; },
  async image(work: any) {
    if (work instanceof Blob) work = JSON.parse(await work.text());
    const sims = new Float32Array(LABELS.length).fill(0.12);
    sims[LABELS.findIndex(l => l.name === work.topic)] = 0.3;
    return { vec: vecFor(work.topic), sims, sens: new Float32Array(N_SENS).fill(0.1), faces: [] };
  },
  async text(t: string) { return vecFor(TOPICS.find(x => t.includes(x)) ?? null); },
  dispose() {},
});
const FILL = { lat: 37.78404, lng: -122.43302 };
const file = (id: string, topic: string, wall: number, o: any = {}) => ({ id, topic, wall, name: `IMG_${id}.JPG`, type: 'image/jpeg', ...o });
function deps(extra: Partial<EngineDeps> = {}) {
  const sentEvents: any[] = [], reports: RunReport[] = [];
  const d: EngineDeps = {
    idb: new IDBFactory(), now: () => NOW, uiLang: () => 'en',
    reader: { async read(f: any) { return { id: f.id, mediaType: f.media ?? 'photo', wall: f.wall, date: new Date(f.wall).toISOString(), timeZone: null, lat: f.lat ?? null, lng: f.lng ?? null, w: 4032, h: 3024, thumb: new Blob([JSON.stringify({ topic: f.topic })], { type: 'image/webp' }), work: { topic: f.topic } as any }; } },
    understander: fakeModel(),
    ocr: async () => ({ read: async (f: any) => f.text ?? '', close: async () => {} }),
    cities: async () => ({ name: ['San Francisco'], cc: ['US'], lat: new Float32Array([37.77]), lng: new Float32Array([-122.42]), pop: new Uint32Array([800000]), grid: new Map([['37,-123', [0]]]) }),
    countryOf: () => 'United States of America',
    places: async (cells: string[]) => cells.map((cell): CellPlaces => cell === '37.78,-122.44'
      ? { cell, neighborhood: 'Fillmore', city: 'San Francisco', metro: null, country: 'United States', countryCode: 'US', venues: [{ name: 'The Fillmore', kind: 'music_venue', lat: 37.78404, lng: -122.43302 }] }
      : { cell, venues: [] }),
    events: async (visits) => { sentEvents.push(...visits); return visits.map(v => v.venues.includes('The Fillmore') && v.start.startsWith('2026-05-16') ? { name: 'Phoenix', kind: 'concert', genre: 'Indie rock', performers: ['Phoenix', 'Mndsgn'], venue: 'The Fillmore' } : null); },
    sendReport: async (r: RunReport) => { reports.push(r); },
    ...extra,
  };
  return { d, sentEvents, reports };
}
function library() {
  return [
    file('c1', 'concert', W(2026, 5, 16, 21, 5), FILL), file('c2', 'concert', W(2026, 5, 16, 22, 30), FILL),
    file('c3', 'concert', W(2025, 9, 3, 20), FILL),
    file('k1', 'coffee', W(2026, 5, 18, 9), { lat: 37.33, lng: -121.89 }),
    file('t1', 'park', W(2026, 10, 20, 10), { media: 'screenshot', text: 'Fred again..\nChase Center\nGA Floor ticket\nDec 5, 2026 concert' }),
  ];
}

test('Engine: events from the device with the lookup off; nothing is sent about them', async () => {
  const { d, sentEvents } = deps();
  const e = createMemoryEngine(d);
  await e.setOptions({ places: true });
  await e.addFiles(library()); await e.idle();
  assert.equal(sentEvents.length, 0, 'the lookup is off unless the person opts in');
  const ev = await e.events();
  assert.deepEqual(ev.filter(x => !x.upcoming).map(x => [x.day, x.kind, x.venue]), [['2026-05-16', 'concert', 'The Fillmore'], ['2025-09-03', 'concert', 'The Fillmore']]);
  assert.ok(ev.some(x => x.upcoming && x.name === 'Fred again..'));
  const t = await e.runTool({ name: 'events', args: {} });
  assert.match(t.text, /^2 events/);
  assert.ok(!/37\.78|-122\.4/.test(t.text), 'no coordinates in tool text');
  const s = await e.search('concerts');
  assert.ok(s.results.length >= 2);
  assert.ok(s.results.every(r => r.context && typeof r.context.withPeople === 'boolean'));
  assert.equal((await e.item('c1'))!.event?.venue, 'The Fillmore');
});

test('Engine: with the lookup on, only cells, venue names and times go out; the event gets its name; off forgets it', async () => {
  const { d, sentEvents } = deps();
  const e = createMemoryEngine(d);
  await e.setOptions({ places: true, events: true });
  await e.addFiles(library()); await e.idle();
  assert.ok(sentEvents.length >= 1);
  for (const v of sentEvents) {
    assert.deepEqual(Object.keys(v).sort(), ['cell', 'end', 'start', 'venues']);
    assert.match(v.cell, /^-?\d+\.\d{2},-?\d+\.\d{2}$/);
    assert.ok(!JSON.stringify(v).includes('37.784'), 'never coordinates');
  }
  assert.ok(!sentEvents.some(v => v.cell === '37.33,-121.89'), 'a coffee morning is not asked about');
  const ev = (await e.events()).find(x => x.day === '2026-05-16')!;
  assert.equal(ev.name, 'Phoenix'); assert.equal(ev.genre, 'Indie rock'); assert.equal(ev.source, 'lookup');
  const s = await e.search('Phoenix');
  assert.deepEqual(s.results.flatMap(r => [r.id, ...r.duplicates]).sort(), ['c1', 'c2']);
  assert.ok(s.results.length >= 1 && s.results.every(r => r.matchReasons.includes('event')));
  const n = sentEvents.length;
  await e.addFiles([file('k2', 'coffee', W(2026, 6, 1, 9), { lat: 37.33, lng: -121.89 })]); await e.idle();
  assert.equal(sentEvents.length, n, 'a visit is looked up once');
  await e.setOptions({ events: false });
  assert.equal((await e.events()).find(x => x.day === '2026-05-16')!.name, null, 'off: what the lookup found is forgotten');
});

test('Run reports: counts and timings only, kept on the device, handed to the sender', async () => {
  const { d, reports } = deps();
  const e = createMemoryEngine(d);
  await e.addFiles(library()); await e.idle();
  const kept = await e.reports();
  assert.equal(kept.length, 1);
  const r = kept[0];
  assert.equal(r.read, 5); assert.equal(r.located, 4); assert.equal(r.understood, 5);
  assert.ok(r.labels >= 5); assert.equal(r.textRead, 1); assert.equal(r.modelMB, 90);
  assert.equal(r.trigger, 'picked'); assert.equal(r.outcome, 'ready'); assert.equal(r.indexTotal, 5);
  assert.ok('reading' in r.stages && 'understanding' in r.stages);
  assert.deepEqual(reports, kept);
  const text = JSON.stringify(r);
  for (const leak of ['c1', 'Fillmore', 'concert', 'Fred', 'San Francisco', '37.']) assert.ok(!text.includes(leak), `no ${leak} in a report`);
  await e.search('coffee');
  await e.addFiles([file('k9', 'coffee', W(2026, 7, 1, 9))], { source: 'folder' } as any); await e.idle();
  const [last] = await e.reports();
  assert.equal(last.trigger, 'folder'); assert.equal(last.read, 1); assert.equal(last.searches, 1);
  await e.addFiles([file('k9', 'coffee', W(2026, 7, 1, 9))]); await e.idle();
  assert.equal((await e.reports()).length, 2, 'a run that did nothing is not a report');
});

test('Reports leave the device only when both switches allow it, cut to their fields', async () => {
  const dirty = { ...cleanReport({ read: 3 }), place: 'Tokyo', ids: ['a'], labelsFound: ['ramen'], seconds: 'x' } as any;
  const c = cleanReport(dirty);
  assert.ok(!('place' in c) && !('ids' in c) && !('labelsFound' in c));
  assert.equal(c.seconds, 0); assert.equal(c.read, 3);
  assert.ok(!worthReporting(cleanReport({})));
  const posted: unknown[] = [];
  assert.equal(await sendRunReport(c, { allowed: async () => false, post: async b => { posted.push(b); } }), false);
  assert.equal(posted.length, 0);
  assert.equal(await sendRunReport(dirty, { allowed: async () => true, post: async b => { posted.push(b); } }), true);
  assert.ok(!('place' in (posted[0] as object)));
});

test('The photos just indexed are told batch by batch, sensitive ones left out', async () => {
  const { d } = deps();
  const e = createMemoryEngine(d);
  const seen: string[] = [];
  e.onBatch(b => seen.push(...b.ids));
  await e.addFiles(library()); await e.idle();
  assert.deepEqual(seen.sort(), ['c1', 'c2', 'c3', 'k1', 't1']);
});

// ------------------------------------------------------------------------------------------------------- the folder

function fakeDir(files: Record<string, { size: number; lastModified: number }>): any {
  const tree: any = {};
  for (const [path, meta] of Object.entries(files)) {
    const parts = path.split('/'); let node = tree;
    for (const p of parts.slice(0, -1)) node = node[p] ??= {};
    node[parts[parts.length - 1]] = meta;
  }
  const dir = (name: string, node: any): any => ({
    kind: 'directory', name,
    async *values() {
      for (const [k, v] of Object.entries(node)) {
        if ((v as any).size != null) yield { kind: 'file', name: k, getFile: async () => ({ name: k, ...(v as any) }) };
        else yield dir(k, v);
      }
    },
  });
  return dir('Pictures', tree);
}

test('Keep adding reads only what is new or changed in the folder, newest first, and needs permission', async () => {
  const files: Record<string, { size: number; lastModified: number }> = {
    'IMG_1.JPG': { size: 10, lastModified: 1 }, 'trip/IMG_2.HEIC': { size: 20, lastModified: 3 }, 'notes.txt': { size: 1, lastModified: 2 },
    '.thumbs/IMG_3.JPG': { size: 5, lastModified: 4 }, 'clip.MOV': { size: 30, lastModified: 2 },
  };
  let dir = fakeDir(files);
  const first = await newFiles(dir, {});
  assert.deepEqual(first.files.map(f => f.name), ['IMG_2.HEIC', 'clip.MOV', 'IMG_1.JPG'], 'media only, hidden folders skipped, newest first');
  assert.equal(first.seen['trip/IMG_2.HEIC'], fileKey({ size: 20, lastModified: 3 }));
  files['IMG_1.JPG'] = { size: 11, lastModified: 9 }; files['IMG_4.PNG'] = { size: 4, lastModified: 8 };
  dir = fakeDir(files);
  const second = await newFiles(dir, first.seen);
  assert.deepEqual(second.files.map(f => f.name), ['IMG_1.JPG', 'IMG_4.PNG'], 'changed and new only');
  assert.equal((await newFiles(dir, {}, 2)).more, 2);

  // Permission: without it, nothing is read; a tap may ask
  let perm = 'prompt';
  const handle = Object.assign(fakeDir(files), { queryPermission: async () => perm, requestPermission: async () => { perm = 'granted'; return perm; } });
  const kept = { handle, state: { name: 'Pictures', addedAt: 0, lastScan: null, lastAdded: 0, seen: {} } as FolderState };
  const added: File[][] = [];
  const add = async (f: File[]) => { added.push(f); };
  let r = await scanFolder(add, { kept, save: async () => {}, now: 1000 });
  assert.deepEqual([r.permission, r.added, added.length], ['prompt', 0, 0]);
  r = await scanFolder(add, { kept, save: async () => {}, now: 1000, interactive: true });
  assert.deepEqual([r.permission, r.added], ['granted', 4]);
  r = await scanFolder(add, { kept, save: async () => {}, now: 2000 });
  assert.equal(r.added, 0, 'not again within ten minutes');
  files['IMG_5.JPG'] = { size: 5, lastModified: 20 };
  kept.handle = Object.assign(fakeDir(files), { queryPermission: async () => 'granted' });
  r = await scanFolder(add, { kept, save: async () => {}, now: 1000 + 11 * 60_000 });
  assert.equal(r.added, 1, 'coming back later adds what is new');
});

// ------------------------------------------------------------------------------------------------- server and agent

test('memory-events: checks what arrives, reads setlist.fm, Ticketmaster and Wikidata, and picks the event at the venue', () => {
  assert.equal(cleanVisits({ visits: [{ cell: '37.784,-122.43', venues: [], start: '2026-05-16T21:00', end: '2026-05-16T23:00' }] }), null, 'a cell has two decimals');
  assert.equal(cleanVisits({ visits: [{ cell: '37.78,-122.44', venues: [], start: '2026-05-16T21:00', end: '2026-05-16T20:00' }] }), null);
  assert.equal(cleanVisits({ visits: Array(21).fill({ cell: '37.78,-122.44', venues: [], start: '2026-05-16T21:00', end: '2026-05-16T22:00' }) }), null);
  const ok = cleanVisits({ visits: [{ cell: '37.78,-122.44', venues: ['The Fillmore', 3, 'x'.repeat(200)], start: '2026-05-17T00:30', end: '2026-05-17T01:00', lat: 37.7841 }] })!;
  assert.deepEqual(Object.keys(ok[0]).sort(), ['cell', 'end', 'start', 'venues'], 'anything else is dropped');
  assert.equal(ok[0].venues[1].length, 80);
  assert.equal(eveningOf('2026-05-17T00:30'), '2026-05-16');
  assert.ok(setlistUrl('The Fillmore', '2026-05-16').endsWith('venueName=The%20Fillmore&date=16-05-2026'));
  assert.match(ticketmasterUrl('k', '37.78,-122.44', '2026-05-16'), /latlong=37\.785,-122\.435&radius=2&unit=km&startDateTime=2026-05-16T00:00:00Z&endDateTime=2026-05-18T00:00:00Z/);
  assert.match(wikidataQuery('43.73,7.42', '2026-06-07'), /Point\(7\.425 43\.735\)/);

  const sl = readSetlists({ setlist: [
    { artist: { name: 'Mndsgn' }, venue: { name: 'The Fillmore' }, sets: { set: [{ song: [{}, {}] }] } },
    { artist: { name: 'Phoenix' }, venue: { name: 'Fillmore' }, sets: { set: [{ song: Array(18).fill({}) }] } },
    { artist: { name: 'Other' }, venue: { name: 'Bottom of the Hill' }, sets: { set: [] } },
  ] }, 'The Fillmore');
  assert.deepEqual([sl?.name, sl?.kind, sl?.performers], ['Phoenix', 'concert', ['Phoenix', 'Mndsgn']]);
  const tm = { _embedded: { events: [
    { name: 'Parking: Warriors', dates: { start: { localDate: '2026-03-14' } }, _embedded: { venues: [{ name: 'Chase Center' }] } },
    { name: 'Golden State Warriors vs. Los Angeles Lakers', dates: { start: { localDate: '2026-03-14' } }, classifications: [{ segment: { name: 'Sports' }, genre: { name: 'Basketball' }, subGenre: { name: 'NBA' } }], _embedded: { venues: [{ name: 'Chase Center' }], attractions: [{ name: 'Golden State Warriors' }] } },
    { name: 'Fred again..', dates: { start: { localDate: '2026-03-14' } }, classifications: [{ segment: { name: 'Music' }, genre: { name: 'Dance/Electronic' }, subGenre: { name: 'House' } }], _embedded: { venues: [{ name: 'Bill Graham Civic Auditorium' }], attractions: [{ name: 'Fred again..' }] } },
  ] } };
  assert.deepEqual(readTicketmaster(tm, '2026-03-14', ['Chase Center']), { name: 'Golden State Warriors vs. Los Angeles Lakers', kind: 'game', genre: 'NBA', performers: ['Golden State Warriors'], venue: 'Chase Center', source: 'ticketmaster' });
  assert.equal(readTicketmaster(tm, '2026-03-14', ['Bill Graham Civic'])?.genre, 'House');
  assert.equal(readTicketmaster(tm, '2026-03-14', ['The Fillmore']), null, 'a listing at another venue is not this visit');
  assert.equal(readTicketmaster(tm, '2026-03-15', ['Chase Center']), null);
  assert.deepEqual(readWikidata({ results: { bindings: [{ eLabel: { value: 'Q123' } }, { eLabel: { value: '2026 Monaco Grand Prix' }, typeLabel: { value: 'Formula One Grand Prix' } }] } }), { name: '2026 Monaco Grand Prix', kind: 'race', genre: null, performers: [], venue: null, source: 'wikidata' });
  assert.equal(kindFromType('tennis tournament edition'), 'game');
  assert.equal(kindFromType('music festival edition'), 'festival');
  assert.ok(sameVenue('The Fillmore', 'Fillmore Auditorium') && !sameVenue('Chase Center', 'Oracle Park'));
});

test('The agent can ask for events, with only the arguments the tool takes', () => {
  assert.ok(MEMORY_TOOL_NAMES.includes('events' as any));
  assert.deepEqual(cleanToolArgs('events', { kind: 'game', from: '2026-01-01', to: 'soon', limit: 500, venue: 'x' }), { kind: 'game', from: '2026-01-01', limit: 50 });
  assert.deepEqual(cleanToolArgs('events', { kind: 'party' }), {});
  assert.equal(progressLine({ name: 'events', args: {} }), 'Looking at your concerts, games and shows');
});
