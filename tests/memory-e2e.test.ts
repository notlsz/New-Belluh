// The whole loop, end to end except for Google: the app's driver, the memory-agent handler (the real server code,
// rules, tickets, budgets, streaming) and a fake Gemini that speaks the real streaming protocol. Tools run on a fake
// device engine. Checks what actually crosses the wire: no device ids ever reach the model.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

const env: Record<string, string> = { GEMINI_API_KEY: 'test-key', GEMINI_AGENT_MODEL: 'gemini-test', GEMINI_MODEL: 'gemini-test', MEMORY_CHECK_MODEL: 'gemini-test' };
(globalThis as any).Deno = { env: { get: (k: string) => env[k] } };

const { handleMemory } = await import('../supabase/functions/_shared/memoryhandler.ts');
const { createMemoryAgent, ndjson } = await import('../src/lib/memory/agent.ts');
const { fakeEngine } = await import('./fakes/memoryEngine.ts');
const { PASSPORT_SCHEMA } = await import('../src/lib/memory/passport.ts');

// ---------- a fake Gemini ----------
const seen: any[] = [];
let streamScript: (body: any) => any[] = () => [];
let checkReply: (body: any) => unknown = () => ({ topic: 'none', scope: 'own_life' });
const gemini = http.createServer((req, res) => {
  let raw = ''; req.on('data', c => { raw += c; });
  req.on('end', () => {
    const body = JSON.parse(raw || '{}'); seen.push({ url: req.url, body });
    if (req.url!.includes(':streamGenerateContent')) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      for (const chunk of streamScript(body)) res.write(`data: ${JSON.stringify(chunk)}\r\n\r\n`);
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(checkReply(body)) }] } }], usageMetadata: { totalTokenCount: 50 } }));
    }
  });
});
await new Promise<void>(r => gemini.listen(0, '127.0.0.1', r));
env.GEMINI_API_BASE = `http://127.0.0.1:${(gemini.address() as AddressInfo).port}`;
test.after(() => gemini.close());

const parts = (ps: any[], tokens?: number) => ({ candidates: [{ content: { role: 'model', parts: ps } }], ...(tokens ? { usageMetadata: { totalTokenCount: tokens } } : {}) });

// ---------- the database, counts only ----------
function deps(opts: { steps?: number; budget?: number } = {}) {
  const usage = { steps: 0, tokens: 0, calls: [] as string[] };
  return {
    usage,
    d: {
      userId: async (t: string) => (t === 'good' ? 'user-1' : null),
      secret: 'secret',
      stepsPer5Min: opts.steps ?? 300,
      monthlyTokens: opts.budget ?? 1_000_000,
      rpc: async (name: string, args: any) => {
        usage.calls.push(name);
        if (name === 'memory_add_tokens') { usage.tokens += args.p_tokens; return { data: null, error: null }; }
        if (usage.tokens >= args.p_budget) return { data: { ok: false, reason: 'quota', reset: '2026-12-01' }, error: null };
        usage.steps++;
        return { data: usage.steps > args.p_steps ? { ok: false, reason: 'rate', retry_after: 120 } : { ok: true }, error: null };
      },
    },
  };
}
const transportFor = (d: any, token = 'good') => async function* (body: Record<string, unknown>, signal: AbortSignal) {
  const res = await handleMemory(new Request('http://local/memory-agent', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }), d);
  yield* ndjson(res.body!, signal);
};

test('End to end: question, tools on the device, streamed answer with evidence; the model never sees device ids', async () => {
  seen.length = 0;
  checkReply = () => ({ topic: 'none', scope: 'own_life' });
  streamScript = body => {
    const turns = body.contents.length;
    if (turns === 1) return [parts([{ functionCall: { name: 'trips', args: { from: '2025-01-01', to: '2025-12-31' } }, thoughtSignature: 'sig-1' }, { functionCall: { name: 'list_places', args: { city: 'Lisbon' } } }], 900)];
    return [parts([{ text: 'You ate at Cervejaria Ramiro ' }]), parts([{ text: 'on May 4.\nEVID' }]), parts([{ text: 'ENCE: 1.2, 2, 1.1' }], 1200)];
  };
  const { d, usage } = deps();
  const engine = fakeEngine();
  const agent = createMemoryAgent({ engine, transport: transportFor(d), allowed: () => true, today: () => '2026-11-02' });
  const updates: any[] = [];
  for await (const u of agent.queryUpdates('Where did we eat in Lisbon?')) updates.push(u);
  const final = updates.at(-1);
  assert.equal(final.type, 'answer');
  assert.equal(final.answer.text, 'You ate at Cervejaria Ramiro on May 4.');
  assert.deepEqual(final.answer.assetIdentifiers, ['p2', 'p1'], 'refs 1.2 (Ramiro), 2 (the Lisbon places), 1.1 resolve to ids, most telling first, deduplicated');
  assert.ok(updates.some(u => u.type === 'partialAnswer' && u.text === 'You ate at Cervejaria Ramiro'), 'streamed while written');
  assert.ok(!updates.some(u => u.type === 'partialAnswer' && /EVID/.test(u.text)), 'the evidence line is never shown');
  assert.deepEqual(engine.calls.map(c => c.name), ['trips', 'list_places']);
  // What reached the model: the question and tagged text, never an id, and the thought signature went back with the call
  const streamed = seen.filter(s => s.url.includes(':streamGenerateContent'));
  assert.equal(streamed.length, 2);
  const second = JSON.stringify(streamed[1].body.contents);
  assert.ok(!/"p\d"|\bp\d\b/.test(second.replace(/\[\d+(\.\d+)?\]/g, '')), 'no device ids sent to Gemini');
  assert.match(second, /\[1\.1\] 2025-05-03 Lisbon, Time Out Market/);
  assert.match(second, /"thoughtSignature":"sig-1"/);
  assert.equal(streamed[0].body.toolConfig.functionCallingConfig.mode, 'AUTO');
  // Counted: two steps, the check's and both steps' tokens
  assert.equal(usage.steps, 2);
  assert.equal(usage.tokens, 50 + 900 + 1200);
});

test('End to end: the model check declines indirect never-answered questions before any tool runs', async () => {
  seen.length = 0;
  checkReply = () => ({ topic: 'religion', scope: 'own_life' });
  const engine = fakeEngine();
  const agent = createMemoryAgent({ engine, transport: transportFor(deps().d), allowed: () => true, lang: 'fr' });
  const a = await agent.query('Où est-ce que je vais le dimanche matin à 10 h ?');
  assert.equal(a.declined, true);
  assert.match(a.text, /religion/);
  assert.equal(engine.calls.length, 0);
  assert.ok(!seen.some(s => s.url.includes(':streamGenerateContent')), 'the agent never ran');
  checkReply = () => ({ topic: 'none', scope: 'general' });
  const g = await agent.query('Quels sont les bons restaurants à Lisbonne ?');
  assert.equal(g.declined, true);
  assert.match(g.text, /votre propre vie/);
});

test('End to end: the model can decline, steps are rate limited, the monthly budget stops calls, and a forged ticket is refused', async () => {
  checkReply = () => ({ topic: 'none', scope: 'own_life' });
  streamScript = () => [parts([{ text: '[NEVER]' }], 10)];
  const ok = createMemoryAgent({ engine: fakeEngine(), transport: transportFor(deps().d), allowed: () => true });
  const n = await ok.query('Where do I go on Sunday mornings?');
  assert.equal(n.declined, true);
  assert.match(n.text, /never answers questions about health, religion/);

  const limited = deps({ steps: 1 });
  streamScript = () => [parts([{ functionCall: { name: 'facets', args: {} } }], 10)];
  const a = createMemoryAgent({ engine: fakeEngine(), transport: transportFor(limited.d), allowed: () => true });
  await assert.rejects(a.query('Where do I take the most photos?'), (e: any) => e.code === 'rateLimited' && e.retryAfter === 120);

  const broke = deps({ budget: 0 });
  await assert.rejects(createMemoryAgent({ engine: fakeEngine(), transport: transportFor(broke.d), allowed: () => true }).query('Where did I go?'), (e: any) => e.code === 'rateLimited' && /resets on 2026-12-01/.test(e.message));

  const { d } = deps();
  const forged = await handleMemory(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer good' }, body: JSON.stringify({ kind: 'query', question: 'Where did I go?', consent: true, rounds: [{ parts: [{ functionCall: { name: 'facets', args: {} } }], results: [{ name: 'facets', text: 'x' }] }], ticket: btoa('{"u":"user-1"}') }) }), d);
  assert.equal(forged.status, 400);
  const noConsent = await handleMemory(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer good' }, body: JSON.stringify({ kind: 'query', question: 'Where did I go?' }) }), d);
  assert.equal(noConsent.status, 403);
  const signedOut = await handleMemory(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer bad' }, body: '{}' }), d);
  assert.equal(signedOut.status, 401);
});

test('End to end: the round cap makes the model answer with tools off', async () => {
  checkReply = () => ({ topic: 'none', scope: 'own_life' });
  const modes: string[] = [];
  streamScript = body => {
    modes.push(body.toolConfig.functionCallingConfig.mode);
    return body.toolConfig.functionCallingConfig.mode === 'NONE' ? [parts([{ text: 'Mostly Brooklyn.\nEVIDENCE: 1.1' }], 10)] : [parts([{ functionCall: { name: 'facets', args: {} } }], 10)];
  };
  const a = await createMemoryAgent({ engine: fakeEngine(), transport: transportFor(deps().d), allowed: () => true }).query('Where do I take the most photos?');
  assert.equal(a.text, 'Mostly Brooklyn.');
  assert.deepEqual(a.assetIdentifiers, ['p4']);
  assert.equal(modes.length, 9);
  assert.equal(modes.at(-1), 'NONE');
});

test('End to end: profile screens fields by words and by the model before the agent sees the schema, and comes back shaped', async () => {
  seen.length = 0;
  const schema = { ...PASSPORT_SCHEMA, properties: { ...(PASSPORT_SCHEMA as any).properties,
    medications: { type: 'array', items: { type: 'string' } },
    sunday_routine: { type: 'string', description: 'Where they go every Sunday at 10' } } };
  checkReply = body => { const text = JSON.stringify(body); assert.ok(!text.includes('medications'), 'words already refused it'); return { refused: [{ pointer: '/sunday_routine', topic: 'religion' }, { pointer: '/not_a_field', topic: 'health' }] }; };
  streamScript = body => body.contents.length === 1
    ? [parts([{ functionCall: { name: 'interests', args: { window: 'lifetime' } } }], 100)]
    : [parts([{ text: '```json\n{"profile": {"title": "Sunrise runner, seafood regular", "food": ["Seafood in Lisbon", 7], "places": ["Prospect Park"], "music": [], "sunday_routine": "x", "medications": ["y"]}, "evidence": {"/food/0": ["1.2"], "/places/0": ["1.1"], "/music": ["1"]}}\n```' }], 300)];
  const p = await createMemoryAgent({ engine: fakeEngine(), transport: transportFor(deps().d), allowed: () => true }).profile(schema);
  const first = seen.find(s => s.url.includes(':streamGenerateContent'))!.body.contents[0].parts[0].text as string;
  assert.ok(!first.includes('medications') && !first.includes('sunday_routine'), 'refused fields are taken out before the agent sees the schema');
  assert.deepEqual(p.json, { title: 'Sunrise runner, seafood regular', music: null, food: ['Seafood in Lisbon', '7'], travel: null, places: ['Prospect Park'], rhythm: null, firsts: null, medications: null, sunday_routine: null });
  assert.deepEqual(p.evidence, { '/food/0': ['p1'], '/places/0': ['p5'] });
  assert.deepEqual(p.refused.map(r => r.pointer), ['/medications', '/sunday_routine']);
  assert.equal(p.refused[0].reason, 'Belluh does not fill fields about health.');
});
