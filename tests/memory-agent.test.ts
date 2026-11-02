import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryAgent, progressLine, type ServerEvent, type Transport } from '../src/lib/memory/agent.ts';
import { fakeEngine } from './fakes/memoryEngine.ts';
import { MAX_ROUNDS } from '../supabase/functions/_shared/memoryrules.ts';
import { PASSPORT_SCHEMA, draftFromProfile } from '../src/lib/memory/passport.ts';

/** A fake memory-agent: a script of steps; each step sees what the phone sent. */
function fakeServer(script: ((body: any) => ServerEvent[])[]) {
  const bodies: any[] = [];
  const transport: Transport = async function* (body, signal) {
    bodies.push(JSON.parse(JSON.stringify(body)));
    const step = script[Math.min(bodies.length - 1, script.length - 1)];
    for (const ev of step(body)) { if (signal.aborted) return; await new Promise(r => setTimeout(r, 1)); yield ev; }
  };
  return { transport, bodies };
}
const tools = (calls: { name: string; args: Record<string, unknown> }[]): ServerEvent => ({ type: 'tools', calls, parts: calls.map(c => ({ functionCall: c })), ticket: 't' });

test('query: tools run on the device, only their text goes up, and evidence comes back as device ids, most telling first', async () => {
  const engine = fakeEngine();
  const { transport, bodies } = fakeServer([
    () => [tools([{ name: 'trips', args: { from: '2025-01-01', to: '2025-12-31' } }, { name: 'list_places', args: { city: 'Lisbon' } }])],
    b => {
      const sent = JSON.stringify(b.rounds);
      assert.ok(!/\bp[0-9]\b/.test(sent.replace(/\[\d+(\.\d+)?\]/g, '')), 'no device ids in what was sent');
      assert.match(b.rounds[0].results[0].text, /^\[1\.1\] 2025-05-03 Lisbon, Time Out Market/);
      assert.equal(b.ticket, 't');
      return [{ type: 'partial', text: 'You went to' }, { type: 'partial', text: 'You went to Cervejaria Ramiro.' }, { type: 'answer', text: 'You went to Cervejaria Ramiro.', cited: ['1.2', '2', '1.1'], declined: false }];
    },
  ]);
  const agent = createMemoryAgent({ engine, transport, allowed: () => true, today: () => '2026-11-02' });
  const updates: any[] = [];
  for await (const u of agent.queryUpdates('Where did I eat in Lisbon?')) updates.push(u);
  assert.deepEqual(updates.filter(u => u.type === 'progress').map(u => u.text), ['Looking at your trips in 2025', 'Finding your places in Lisbon']);
  assert.deepEqual(updates.filter(u => u.type === 'partialAnswer').map(u => u.text), ['You went to', 'You went to Cervejaria Ramiro.']);
  const final = updates.at(-1);
  assert.equal(final.type, 'answer');
  assert.deepEqual(final.answer.assetIdentifiers, ['p2', 'p1']);
  assert.equal(final.answer.declined, false);
  assert.equal(bodies[0].consent, true);
  assert.equal(bodies[0].today, '2026-11-02');
  assert.deepEqual(engine.calls.map(c => c.name), ['trips', 'list_places']);
});

test('query: a partial answer followed by more reading clears what was shown', async () => {
  const { transport } = fakeServer([
    () => [{ type: 'partial', text: 'Let me' }, tools([{ name: 'facets', args: {} }])],
    () => [{ type: 'answer', text: 'Brooklyn, mostly.', cited: [], declined: false }],
  ]);
  const agent = createMemoryAgent({ engine: fakeEngine(), transport, allowed: () => true });
  const seq: string[] = [];
  for await (const u of agent.queryUpdates('Where do I take the most photos?')) seq.push(u.type === 'partialAnswer' ? `partial:${u.text}` : u.type);
  assert.deepEqual(seq, ['partial:Let me', 'partial:', 'progress', 'answer']);
});

test('query: never-answered topics are refused on the device, before anything is sent', async () => {
  const { transport, bodies } = fakeServer([() => []]);
  const agent = createMemoryAgent({ engine: fakeEngine(), transport, allowed: () => true, lang: 'es' });
  const a = await agent.query('¿Cuándo fui al médico?');
  assert.equal(a.declined, true);
  assert.match(a.text, /salud/);
  assert.equal(bodies.length, 0);
});

test('query: nothing runs without permission, and the round cap stops a server that never answers', async () => {
  const off = createMemoryAgent({ engine: fakeEngine(), transport: fakeServer([() => []]).transport, allowed: () => false });
  await assert.rejects(off.query('Where did I eat?'), (e: any) => e.code === 'notConsented');
  const loop = fakeServer([() => [tools([{ name: 'facets', args: {} }])]]);
  const agent = createMemoryAgent({ engine: fakeEngine(), transport: loop.transport, allowed: () => true });
  await assert.rejects(agent.query('Where did I eat?'), (e: any) => e.code === 'internal');
  assert.equal(loop.bodies.length, MAX_ROUNDS + 1);
  assert.equal(loop.bodies.at(-1).rounds.length, MAX_ROUNDS);
});

test('query: leaving the loop cancels the request in flight, and server errors become memory errors', async () => {
  let aborted = false;
  const slow: Transport = async function* (_b, signal) {
    signal.addEventListener('abort', () => { aborted = true; });
    yield { type: 'partial', text: 'You' };
    await new Promise(r => setTimeout(r, 30));
    yield { type: 'answer', text: 'late', cited: [], declined: false };
  };
  const agent = createMemoryAgent({ engine: fakeEngine(), transport: slow, allowed: () => true });
  for await (const u of agent.queryUpdates('Where did I go?')) { if (u.type === 'partialAnswer') break; }
  assert.ok(aborted, 'the request was aborted');
  const ctrl = new AbortController();
  const p = agent.query('Where did I go?', { signal: ctrl.signal });
  setTimeout(() => ctrl.abort(), 5);
  await assert.rejects(p, (e: any) => e.code === 'cancelled');
  const limited = createMemoryAgent({ engine: fakeEngine(), transport: fakeServer([() => [{ type: 'error', code: 'rate_limited', message: 'slow down', retryAfter: 42 }]]).transport, allowed: () => true });
  await assert.rejects(limited.query('Where did I go?'), (e: any) => e.code === 'rateLimited' && e.retryAfter === 42);
});

test('query: no index yet is an error, not a call', async () => {
  const { transport, bodies } = fakeServer([() => []]);
  const engine = fakeEngine({ state: () => ({ type: 'notStarted' }) });
  const agent = createMemoryAgent({ engine, transport, allowed: () => true });
  await assert.rejects(agent.query('Where did I go?'), (e: any) => e.code === 'notStarted');
  assert.equal(bodies.length, 0);
});

test('profile: Our Passport schema is valid, progress is reported, evidence comes back per JSON Pointer as device ids', async () => {
  const { transport, bodies } = fakeServer([
    b => { assert.equal(b.kind, 'profile'); return [tools([{ name: 'interests', args: { window: 'lifetime' } }])]; },
    () => [{ type: 'profile', json: { title: 'Sunrise runner, seafood regular', music: null, food: ['Seafood in Lisbon'], travel: null, places: ['Prospect Park, most weekends'], rhythm: null, firsts: null },
      evidence: { '/food/0': ['1.2'], '/places': ['1.1'] }, refused: [] }],
  ]);
  const lines: string[] = [];
  const agent = createMemoryAgent({ engine: fakeEngine(), transport, allowed: () => true });
  const p = await agent.profile(PASSPORT_SCHEMA, { onProgress: l => lines.push(l) });
  assert.deepEqual(lines, ['Looking at what you love']);
  assert.deepEqual(p.evidence, { '/food/0': ['p1'], '/places': ['p5'] });
  assert.ok(bodies[0].schema);
  const d = draftFromProfile(p);
  assert.equal(d.title, 'Sunrise runner, seafood regular');
  assert.deepEqual(d.sections.food.map(l => [l.text, l.evidence]), [['Seafood in Lisbon', ['p1']]]);
  assert.deepEqual(d.sections.places[0].evidence, ['p5'], 'a line without its own pointer uses its section');
  await assert.rejects(agent.profile({ type: 'object', properties: { a: { type: 'array' } } }), (e: any) => e.code === 'invalidSchema' && /\/a: an array needs/.test(e.message));
});

test('Progress lines read like Rollup\'s', () => {
  assert.equal(progressLine({ name: 'trips', args: { from: '2025-01-01', to: '2025-12-31' } }), 'Looking at your trips in 2025');
  assert.equal(progressLine({ name: 'trips', args: {} }), 'Looking at your trips');
  assert.equal(progressLine({ name: 'search_photos', args: { query: 'ramen' } }), 'Searching your photos for “ramen”');
  assert.equal(progressLine({ name: 'list_visits', args: { place: 'Lisbon' } }), 'Looking at your visits to Lisbon');
});
