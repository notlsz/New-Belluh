import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { detect, summarize, ownItems, nextSteps, clarityInstruction, counsellingFor, type ClarityItem } from '../supabase/functions/_shared/clarity.ts';
import { handleClarity, scoreFree, type ClarityStore, type Reflection, type TalkMessage } from '../supabase/functions/_shared/clarityapi.ts';
import { dvSignal, dvLine, withDvLine, dvInstruction, DV_COUNTRIES, crisisLine } from '../supabase/functions/_shared/safety.ts';

const ROOT = path.join(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const NOW = Date.parse('2026-11-02T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
let seq = 0;
const item = (owner: string, text: string, ago = 5, kind: ClarityItem['kind'] = 'entry'): ClarityItem => ({ kind, id: `i${++seq}`, owner, text, at: daysAgo(ago) });

test('Detection: the same patterns in several languages', () => {
  const cases: [string, string][] = [
    ['He never listens to me when I talk about work.', 'unheard'],
    ['No me escucha nunca, es como hablar con la pared.', 'unheard'],
    ['Il ne m\'écoute jamais.', 'unheard'],
    ['Er hört mir nicht zu.', 'unheard'],
    ['話を聞いてくれない。', 'unheard'],
    ['他根本不听我说。', 'unheard'],
    ['내 말을 안 들어.', 'unheard'],
    ['She gave me the silent treatment all weekend.', 'stonewalling'],
    ['Me ignoró toda la noche.', 'stonewalling'],
    ['また無視された。', 'stonewalling'],
    ['又冷战了。', 'stonewalling'],
    ['He rolled his eyes and mocked me in front of friends.', 'contempt'],
    ['Il se moque de moi devant tout le monde.', 'contempt'],
    ['I feel so lonely in this relationship.', 'lonely'],
    ['Mi sento sola anche quando siamo insieme.', 'lonely'],
    ['Me sinto sozinha.', 'lonely'],
    ['寂しい。', 'lonely'],
    ['Same fight about the dishes again.', 'sameFight'],
    ['Schon wieder dieser Streit.', 'sameFight'],
    ['He blames me for everything.', 'defensiveness'],
    ['He wants kids and I don\'t.', 'kids'],
    ['Ella no quiere tener hijos.', 'kids'],
    ['Il ne veut pas déménager à Lyon.', 'place'],
    ['We argued about money again.', 'money'],
    ['He apologized and we made up.', 'repair'],
  ];
  for (const [text, key] of cases) assert.ok(detect(text).has(key as any), `${key}: ${text}`);
});

test('Detection: ordinary writing finds nothing to worry about', () => {
  for (const t of ['We had ramen and walked by the river.', 'I want to move the couch.', 'Kids at the park were loud.', '今日は海に行った。', 'Fuimos al cine.']) {
    const found = [...detect(t).keys()].filter(k => !['warm', 'repair'].includes(k));
    assert.deepEqual(found, [], t);
  }
  // A topic alone is not a mismatch; a disagreement about it is
  assert.ok(!detect('We talked about having kids someday.').has('kids'));
});

test('Summary: dated counts of separate pieces of writing, shown from two up, in the last 90 days', () => {
  const me = 'me';
  const items = [
    item(me, 'He never listens.', 80), item(me, 'He doesn\'t listen to me.', 40), item(me, 'Again, not heard.', 3, 'chat'),
    item(me, 'He never listens.', 200), // too old
    item(me, 'I feel lonely.', 10), // only once: not shown
    item(me, 'So grateful for him today.', 2),
  ];
  const s = summarize(me, items, 'US', NOW);
  const unheard = s.patterns.find(p => p.key === 'unheard')!;
  assert.equal(unheard.count, 3);
  assert.equal(unheard.first, daysAgo(80));
  assert.equal(unheard.last, daysAgo(3));
  assert.equal(unheard.sources[0].kind, 'chat');
  assert.ok(!s.patterns.some(p => p.key === 'lonely'));
  assert.equal(s.balance.warm, 1);
  assert.equal(s.safety.abuse, false);
  assert.deepEqual(s.steps, ['talk', 'counsel', 'part']);
  assert.equal(JSON.stringify(s).match(/score|percent|compatib/i), null, 'no score anywhere');
});

test('Isolation: a partner\'s writing never counts, whatever the query returns', () => {
  const items = [item('partner', 'She never listens to me.', 5), item('partner', 'She never listens.', 6), item('partner', 'He hit me.', 7)];
  assert.equal(ownItems('me', items).length, 0);
  const s = summarize('me', items, 'US', NOW);
  assert.equal(s.patterns.length, 0);
  assert.equal(s.safety.abuse, false);
  assert.equal(s.written, 0);
});

test('Isolation: nothing outside Clarity reads its tables: not the partner\'s views, Bella\'s context, Afterglow, texting or exports', () => {
  const files = [
    'supabase/functions/_shared/agentdb.ts', 'supabase/functions/_shared/agentcore.ts', 'supabase/functions/_shared/agent.ts',
    'supabase/functions/_shared/weekly.ts', 'supabase/functions/_shared/nudges.ts', 'supabase/functions/_shared/notify.ts',
    'supabase/functions/belluh-agent/index.ts', 'supabase/functions/belluh-weekly/index.ts', 'supabase/functions/belluh-nudges/index.ts',
    'supabase/functions/memory-agent/index.ts', 'src/components/YourData.tsx', 'src/components/UsThread.tsx', 'src/pages/Passport.tsx',
    'src/services/passportStore.ts', 'src/pages/Timeline.tsx', 'src/pages/Journal.tsx',
  ].filter(f => fs.existsSync(path.join(ROOT, f)));
  assert.ok(files.length > 8);
  for (const f of files) assert.ok(!/clarity/i.test(read(f)), `${f} must not touch Clarity`);
  // Every webhook (texting) and every function except Clarity's own
  for (const d of fs.readdirSync(path.join(ROOT, 'supabase/functions'))) {
    if (d === '_shared' || d === 'belluh-clarity') continue;
    const f = `supabase/functions/${d}/index.ts`;
    if (fs.existsSync(path.join(ROOT, f))) assert.ok(!/clarity/i.test(read(f)), f);
  }
  // The edge function reads only the signed-in person's rows, and never partner notes or the shared thread
  const fn = read('supabase/functions/belluh-clarity/index.ts');
  assert.ok(!/partner_notes|us_messages|memory_passports|partnerIds|partner_id/.test(fn));
  for (const q of fn.matchAll(/from\('(journal_entries|agent_messages)'\)[^\n]*/g)) assert.match(q[0], /\.eq\('user_id', uid\)/, q[0]);
  // Owner-only rows: every policy is user_id = auth.uid(), with no partner clause
  const sql = read('supabase/migrations/20261103010000_clarity.sql');
  const policies = [...sql.matchAll(/create policy[^\n]+/g)].map(m => m[0]);
  assert.equal(policies.length, 3);
  for (const p of policies) { assert.match(p, /using \(user_id = auth\.uid\(\)\) with check \(user_id = auth\.uid\(\)\)/); assert.ok(!/partner/.test(p)); }
});

test('Safety: signs of abuse in any language give the domestic-abuse line first and never breakup coaching', () => {
  for (const t of ['He hit me last night.', 'My husband threatened to kill me', "I'm scared of him", "She won't let me see my friends", 'He checks my phone every night',
    'Me pegó otra vez.', 'Tengo miedo de él.', "Il m'a frappée.", 'Er hat mich geschlagen.', 'Mi ha picchiata.', 'Ele me bateu.', '夫に殴られた。', '他打我。', '남편이 때렸어.'])
    assert.ok(dvSignal(t), t);
  for (const t of ['It hit me how much I love him', 'He pushed me to apply for the job', 'Call me later', '给我打电话', 'He really hurt my feelings', 'I am scared of spiders'])
    assert.ok(!dvSignal(t), t);
  const s = summarize('me', [item('me', 'He shoved me against the wall.', 100), item('me', 'He never listens.', 3), item('me', 'He never listens.', 4)], 'GB', NOW);
  assert.equal(s.safety.abuse, true);
  assert.match(s.safety.dvLine!, /0808 2000 247/);
  assert.deepEqual(s.steps, ['safety', 'support']);
  assert.ok(!s.steps.includes('part') && !s.steps.includes('talk') && !s.steps.includes('counsel'));
  assert.equal(s.counselling, null, 'no couples counseling where there is abuse');
  const sys = clarityInstruction(s, [], 'Ana', 'GB');
  assert.match(sys, /Do NOT coach a breakup/);
  assert.match(sys, /0808 2000 247/);
  assert.match(dvInstruction('US'), /Do NOT coach them/);
  assert.match(withDvLine('I hear you.', 'FR'), /3919/);
  assert.equal(withDvLine('Call 3919, any time.', 'FR'), 'Call 3919, any time.');
});

test('Safety: verified domestic-abuse lines; unverified countries keep the safe fallback', () => {
  const want: Record<string, RegExp> = { US: /1-800-799-7233.*88788/, GB: /0808 2000 247/, AU: /1800 737 732/, NZ: /0800 733 843/, IE: /1800 341 900/, CA: /1-866-863-0511/,
    JP: /0120-279-889/, KR: /1366/, TW: /113/, FR: /3919/, DE: /116 016/, AT: /0800 222 555/, ES: /016/, IT: /1522/, BR: /180/, PT: /800 202 148/, SG: /1800 777 0000/, IN: /181/ };
  for (const [c, r] of Object.entries(want)) assert.match(dvLine(c), r, c);
  assert.deepEqual(DV_COUNTRIES.sort(), Object.keys(want).sort());
  for (const c of ['CH', 'MX', 'HK', 'ZZ']) assert.match(dvLine(c), /local emergency number/, c);
  assert.match(crisisLine('US'), /988/, 'the crisis lines are untouched');
});

test('Next steps and questions: patterns and questions, a mismatch check-in only when there is one', () => {
  assert.deepEqual(nextSteps(false, true), ['talk', 'checkin', 'counsel', 'part']);
  assert.deepEqual(nextSteps(true, true), ['safety', 'support']);
  const s = summarize('me', [item('me', 'He wants kids and I don\'t.', 5), item('me', 'We disagree about kids.', 9)], 'JP', NOW);
  assert.ok(s.patterns.some(p => p.key === 'kids'));
  assert.ok(s.questions.includes('line'));
  assert.equal(counsellingFor('JP'), null, 'no provider is made up where none was checked');
  assert.match(counsellingFor('GB')!.url, /relate\.org\.uk/);
});

function memoryStore(writing: ClarityItem[]) {
  const on = new Set<string>();
  const refl: (Reflection & { uid: string })[] = [];
  const talk: (TalkMessage & { uid: string })[] = [];
  let n = 0;
  const store: ClarityStore = {
    isOn: async u => on.has(u), turnOn: async u => { on.add(u); },
    wipe: async u => { on.delete(u); for (const a of [refl, talk]) for (let i = a.length - 1; i >= 0; i--) if (a[i].uid === u) a.splice(i, 1); },
    writing: async () => writing, // returns everyone's on purpose: the handler must still keep only the person's own
    item: async (u, kind, id) => writing.find(w => w.id === id && w.kind === kind) ?? null,
    reflections: async u => refl.filter(r => r.uid === u),
    addReflection: async (u, key, text) => { const r = { uid: u, id: `r${++n}`, key, text, created_at: daysAgo(0) }; refl.push(r); return r; },
    deleteReflection: async (u, id) => { const i = refl.findIndex(r => r.id === id && r.uid === u); if (i >= 0) refl.splice(i, 1); },
    talk: async u => talk.filter(t => t.uid === u),
    addTalk: async (u, role, body) => { const t = { uid: u, id: `t${++n}`, role, body, created_at: daysAgo(0) }; talk.push(t); return t; },
    profile: async () => ({ name: 'Sam', country: 'US' }),
  };
  return { store, refl, talk };
}

test('Opt-in: off by default, on after a choice, off deletes everything it holds', async () => {
  const writing = [item('me', 'He never listens.', 3), item('me', 'He never listens.', 4), item('partner', 'She never listens.', 2), item('partner', 'She never listens.', 3)];
  const { store, refl, talk } = memoryStore(writing);
  const model = async () => 'What would you want him to hear?';
  assert.deepEqual((await handleClarity(store, 'me', { action: 'status' }, model, NOW)).body, { on: false });
  assert.equal((await handleClarity(store, 'me', { action: 'view' }, model, NOW)).status, 403, 'nothing while off');
  await handleClarity(store, 'me', { action: 'on' }, model, NOW);
  const v: any = (await handleClarity(store, 'me', { action: 'view' }, model, NOW)).body;
  assert.equal(v.patterns.find((p: any) => p.key === 'unheard').count, 2, 'only my two, not my partner\'s');
  assert.ok(!JSON.stringify(v).includes('She never'));
  assert.equal((await handleClarity(store, 'me', { action: 'open', kind: 'entry', id: writing[2].id }, model, NOW)).status, 404, 'a partner entry never opens');
  await handleClarity(store, 'me', { action: 'answer', key: 'want', text: 'To feel like a team again.' }, model, NOW);
  await handleClarity(store, 'me', { action: 'talk', text: 'Is it me?' }, model, NOW);
  assert.equal(refl.length, 1); assert.equal(talk.length, 2);
  // The partner has nothing, and can't read mine
  assert.equal((await handleClarity(store, 'partner', { action: 'view' }, model, NOW)).status, 403);
  const off: any = (await handleClarity(store, 'me', { action: 'off' }, model, NOW)).body;
  assert.deepEqual(off, { on: false, deleted: true });
  assert.equal(refl.length, 0); assert.equal(talk.length, 0);
  assert.deepEqual((await handleClarity(store, 'me', { action: 'status' }, model, NOW)).body, { on: false });
});

test('Talking to Bella on the page: abuse gets the line whatever the model says; no scores ever', async () => {
  const { store } = memoryStore([]);
  await store.turnOn('me');
  const coach = async () => "Here's how to tell him it's over: sit him down tonight and say it straight.";
  const out: any = (await handleClarity(store, 'me', { action: 'talk', text: "He choked me and I'm scared of him. How do I break up?" }, coach, NOW)).body;
  assert.match(out.messages[1].body, /1-800-799-7233/);
  assert.ok(!/sit him down|it's over/i.test(out.messages[1].body), 'no breakup coaching, whatever the model would say');
  const silent = async () => null;
  const out2: any = (await handleClarity(store, 'me', { action: 'talk', text: 'He hit me again.' }, silent, NOW)).body;
  assert.match(out2.messages[1].body, /1-800-799-7233/, 'even when no model answers');
  const scorer = async () => 'Your compatibility is 42%.';
  const out3: any = (await handleClarity(store, 'me', { action: 'talk', text: 'Are we compatible?' }, scorer, NOW)).body;
  assert.ok(!/42/.test(out3.messages[1].body));
  assert.ok(!scoreFree('You are 42% compatible')); assert.ok(scoreFree('You wrote about this 9 times.'));
});
