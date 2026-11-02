import test from 'node:test';
import assert from 'node:assert/strict';
import { chatWithDevice, deviceAllowed, type ChatReply } from '../src/lib/memory/devicechat.ts';
import {
  DEVICE_TOOL, DEVICE_ROUNDS_MAX, DEVICE_TOOL_DECLARATION, deviceCall, deviceCalls, deviceRoundsToContents, makeDeviceTicket, readDeviceTicket, takeCitations,
} from '../supabase/functions/_shared/devicetools.ts';
import { fakeEngine } from './fakes/memoryEngine.ts';

const SECRET = 'test-secret';
const USER = 'user-1';

/**
 * A stand-in for belluh-agent's chat, built from the same pieces the real one uses: it pauses when "Bella" asks for
 * look_in_photos, signs a ticket for the message, and on resume checks the ticket and the rounds before answering.
 */
function fakeBella(script: { lookups: Record<string, unknown>[][]; answer: (results: string[]) => string }) {
  const bodies: any[] = [];
  let rounds = 0;
  const send = async (device: Record<string, unknown> | null): Promise<ChatReply | null> => {
    bodies.push(JSON.parse(JSON.stringify({ device })));
    const userMsg = { id: 'm-user', role: 'user', body: 'When was our last trip to Lisbon?', meta: {}, created_at: '2026-11-02T10:00:00Z' };
    let results: string[] = [];
    if (device?.ticket) {
      const t = await readDeviceTicket(device.ticket, USER, SECRET);
      assert.ok(t, 'ticket checks out');
      assert.equal(t!.m, 'm-user');
      const contents = deviceRoundsToContents(device.rounds);
      assert.ok(contents, 'rounds hold together');
      results = contents!.filter(c => c.role === 'user').flatMap(c => c.parts.map((p: any) => String(p.functionResponse.response.result ?? '')));
      rounds = (device.rounds as unknown[]).length;
    }
    const next = device ? script.lookups[rounds] : undefined;
    if (device && next) {
      const parts = next.map(args => ({ functionCall: { name: DEVICE_TOOL, args }, thoughtSignature: 'sig' }));
      return { messages: device.ticket ? [] : [userMsg], device: { calls: deviceCalls(parts), parts, ticket: await makeDeviceTicket({ u: USER, m: 'm-user', at: Date.now() }, SECRET) } };
    }
    const c = rounds ? takeCitations(script.answer(results)) : { text: script.answer(results), cited: [] };
    const reply = { id: 'm-bella', role: 'belluh', body: c.text, meta: c.cited.length ? { cited: c.cited, from_photos: true } : {}, created_at: '2026-11-02T10:00:05Z' };
    return { messages: device?.ticket ? [reply] : [userMsg, reply] };
  };
  return { send, bodies };
}

test('Round trip: Bella asks, the lookup runs on the device, only text goes up, and her answer cites photos by tag', async () => {
  const engine = fakeEngine();
  const seen: string[] = [];
  const bella = fakeBella({
    lookups: [[{ tool: 'trips', from: '2025-01-01' }]],
    answer: r => { assert.match(r[0], /^\[1\.1\] 2025-05-03 Lisbon/); return 'Your last trip to Lisbon was in May 2025 [1.2], with dinner at Cervejaria Ramiro [1.2, 1.1].'; },
  });
  const out = await chatWithDevice({ text: 'When was our last trip to Lisbon?', send: bella.send, engine, allowed: () => true, onLookup: c => seen.push(c.name) });
  assert.deepEqual(engine.calls, [{ name: 'trips', args: { from: '2025-01-01' } }]);
  assert.deepEqual(seen, ['trips']);
  assert.equal(out.lookups, 1);
  assert.deepEqual(out.messages.map(m => m.id), ['m-user', 'm-bella']);
  assert.equal(out.messages[1].body, 'Your last trip to Lisbon was in May 2025, with dinner at Cervejaria Ramiro.');
  // Tags turn back into device ids here, most telling first; the ids never went up
  assert.deepEqual(out.cites, { 'm-bella': ['p2', 'p1'] });
  const sent = JSON.stringify(bella.bodies);
  assert.ok(!/"p\d"/.test(sent) && !/\bp[0-9]\b/.test(sent.replace(/\[\d+(\.\d+)?\]/g, '')), 'no device ids sent');
  assert.equal(bella.bodies[0].device.on, true);
  assert.equal(bella.bodies[1].device.rounds[0].parts[0].thoughtSignature, 'sig');
  assert.ok(!/thumbnail|blob|base64/i.test(sent));
});

test('Several lookups in a row, up to the limit; a call Bella got wrong runs nothing', async () => {
  const engine = fakeEngine();
  const bella = fakeBella({
    lookups: [[{ tool: 'list_places', city: 'Lisbon' }, { tool: 'teleport' }], [{ tool: 'list_visits', place: 'Cervejaria Ramiro' }], [{ tool: 'trips' }], [{ tool: 'facets' }]],
    answer: r => `Saw ${r.length} results.`,
  });
  const out = await chatWithDevice({ text: 'Where did we eat in Lisbon?', send: bella.send, engine, allowed: () => true });
  assert.deepEqual(engine.calls.map(c => c.name), ['list_places', 'list_visits', 'trips']);
  assert.equal(bella.bodies.length, 1 + DEVICE_ROUNDS_MAX);
  assert.match(bella.bodies[1].device.rounds[0].results[1].text, /could not run/);
  assert.equal(out.lookups, 3);
});

test('No lookups without AI answers allowed, a searchable index, or for a question Memory must refuse; turning it off mid-turn stops the next one', async () => {
  const engine = fakeEngine();
  assert.equal(deviceAllowed('When were we in Lisbon?', engine, () => false), false);
  assert.equal(deviceAllowed('When were we in Lisbon?', null, () => true), false);
  assert.equal(deviceAllowed('When did I last go to church?', engine, () => true), false);
  assert.equal(deviceAllowed('When were we in Lisbon?', fakeEngine({ state: () => ({ type: 'notStarted' }) }), () => true), false);
  assert.equal(deviceAllowed('When were we in Lisbon?', engine, () => true), true);

  const plain = fakeBella({ lookups: [[{ tool: 'trips' }]], answer: () => 'Hi.' });
  const off = await chatWithDevice({ text: 'When were we in Lisbon?', send: plain.send, engine, allowed: () => false });
  assert.equal(plain.bodies[0].device, null);
  assert.equal(engine.calls.length, 0);
  assert.equal(off.messages.length, 2);

  let allowed = true;
  const bella = fakeBella({ lookups: [[{ tool: 'trips' }]], answer: r => (assert.match(r[0], /turned off/), 'Okay.') });
  const flip = await chatWithDevice({ text: 'When were we in Lisbon?', send: async d => { const r = await bella.send(d); allowed = false; return r; }, engine, allowed: () => allowed });
  assert.equal(engine.calls.length, 0);
  assert.equal(flip.lookups, 0);
});

test('A lost connection mid-turn says so', async () => {
  const engine = fakeEngine();
  const bella = fakeBella({ lookups: [[{ tool: 'trips' }]], answer: () => 'x' });
  let n = 0;
  const out = await chatWithDevice({ text: 'When were we in Lisbon?', send: async d => (n++ ? null : bella.send(d)), engine, allowed: () => true });
  assert.equal(out.failed, true);
  assert.deepEqual(out.messages.map(m => m.role), ['user']);
});

test('Server side: tickets bind the person and the message and expire; rounds must match their calls; the tool takes only its own arguments', async () => {
  const t = await makeDeviceTicket({ u: USER, m: 'm1', at: Date.now() }, SECRET);
  assert.ok(await readDeviceTicket(t, USER, SECRET));
  assert.equal(await readDeviceTicket(t, 'someone-else', SECRET), null);
  assert.equal(await readDeviceTicket(t, USER, 'other-secret'), null);
  assert.equal(await readDeviceTicket(t, USER, SECRET, Date.now() + 6 * 60_000), null);
  const forged = btoa(JSON.stringify({ ...JSON.parse(atob(t)), m: 'someone-elses-message' }));
  assert.equal(await readDeviceTicket(forged, USER, SECRET), null);

  const call = { functionCall: { name: DEVICE_TOOL, args: { tool: 'search_photos', query: 'ramen', limit: 999, extra: 'x' } } };
  assert.deepEqual(deviceCall(call.functionCall.args), { name: 'search_photos', args: { query: 'ramen', limit: 50 } });
  assert.equal(deviceCall({ tool: 'list_visits' }), null);   // its place is required
  const ok = deviceRoundsToContents([{ parts: [call, { functionCall: { name: 'find_table', args: { what: 'sushi' } } }], results: [{ text: '[1.1] 2025-04-10 Tokyo' }] }])!;
  assert.equal(ok.length, 2);
  assert.equal(ok[1].parts[0].functionResponse.response.result, '[1.1] 2025-04-10 Tokyo');
  assert.match(ok[1].parts[1].functionResponse.response.private_guidance, /Not run yet/);   // another tool in the same reply waits
  assert.equal(deviceRoundsToContents([{ parts: [call], results: [] }]), null);
  assert.equal(deviceRoundsToContents([{ parts: [{ text: 'no calls' }], results: [] }]), null);
  assert.equal(deviceRoundsToContents(Array.from({ length: DEVICE_ROUNDS_MAX + 1 }, () => ({ parts: [call], results: [{ text: 'x' }] }))), null);
  assert.equal(deviceRoundsToContents([{ parts: [{ functionCall: { name: 'DROP TABLE', args: {} } }, call], results: [{ text: 'x' }] }]), null);
  assert.ok((DEVICE_TOOL_DECLARATION.parameters.properties.tool.enum as readonly string[]).includes('trips'));
});

test('Citations come off the words cleanly', () => {
  assert.deepEqual(takeCitations('You went in May [1.2]. Twice [2], at Ramiro [1.2, 1.3] .'), { text: 'You went in May. Twice, at Ramiro.', cited: ['1.2', '2', '1.3'] });
  assert.deepEqual(takeCitations('No tags here.'), { text: 'No tags here.', cited: [] });
});
