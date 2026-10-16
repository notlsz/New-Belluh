import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  visibleEntries, entriesBlock, occasionsBlock, systemPrompt, validateToolCall, cleanReply, type EntryRow,
} from '../supabase/functions/_shared/agent.ts';

const ME = 'me', DAN = 'dan', STRANGER = 'x';
const rows: EntryRow[] = [
  { id: '1', user_id: ME, content: 'My shared entry', is_shared: true, created_at: '2026-10-10T10:00:00Z' },
  { id: '2', user_id: ME, content: 'My private entry', is_shared: false, created_at: '2026-10-11T10:00:00Z' },
  { id: '3', user_id: DAN, content: 'Dan shared this', is_shared: true, created_at: '2026-10-09T10:00:00Z' },
  { id: '4', user_id: DAN, content: 'DAN PRIVATE SECRET', is_shared: false, created_at: '2026-10-08T10:00:00Z' },
  { id: '5', user_id: DAN, content: 'Dan null-shared', is_shared: null, created_at: '2026-10-07T10:00:00Z' },
  { id: '6', user_id: STRANGER, content: 'stranger shared', is_shared: true, created_at: '2026-10-06T10:00:00Z' },
  { id: '7', user_id: ME, content: '{"firstMet":"x"}', is_shared: true, tags: ['system_facts'], created_at: '2026-10-05T10:00:00Z' },
  { id: '8', user_id: ME, content: '   ', is_shared: true, created_at: '2026-10-04T10:00:00Z' },
];

test("privacy: Belluh never sees a partner's private entries or strangers' entries", () => {
  const seen = visibleEntries(ME, [DAN], rows).map(r => r.id);
  assert.deepEqual(seen.sort(), ['1', '2', '3']);
  const block = entriesBlock(visibleEntries(ME, [DAN], rows), { me: 'Maya', dan: 'Dan' }, ME);
  assert.ok(!block.includes('DAN PRIVATE SECRET'));
  assert.ok(!block.includes('stranger'));
  assert.ok(!block.includes('firstMet'));
});

test("privacy: without a connection, none of the other person's entries are visible", () => {
  assert.deepEqual(visibleEntries(ME, [], rows).map(r => r.id).sort(), ['1', '2']);
});

test("the viewer's own private entries are labelled so Belluh won't pass them on", () => {
  const block = entriesBlock(visibleEntries(ME, [DAN], rows), { me: 'Maya', dan: 'Dan' }, ME);
  assert.match(block, /Maya \(you\) \[private: only you can see this\]: My private entry/);
  assert.match(block, /^- 2026-10-11/m, 'newest first');
  assert.match(block, /Dan: Dan shared this/);
});

test('system prompt carries memories, dates, privacy and safety rules', () => {
  const p = systemPrompt({
    myName: 'Maya', partnerName: 'Dan', memories: ['Dan needs ten minutes after work'],
    entries: '- e', dates: occasionsBlock([{ label: "Dan's birthday", month: 10, day: 20, year: null, repeats_yearly: true }], { y: 2026, m: 10, d: 12 }),
    today: '2026-10-12',
  });
  assert.match(p, /Dan needs ten minutes after work/);
  assert.match(p, /Dan's birthday: October 20 \(in 8 days\)/);
  assert.match(p, /never a third person in the relationship/);
  assert.match(p, /can't see private entries/);
  assert.match(p, /988/);
});

test('tool calls from the model are validated', () => {
  assert.deepEqual(validateToolCall('remember_fact', { fact: '  Loves  rainy days ' }), { name: 'remember_fact', fact: 'Loves rainy days' });
  assert.equal(validateToolCall('remember_fact', { fact: '' }), null);
  assert.equal(validateToolCall('forget_memory', { query: 'a' }), null);
  assert.deepEqual(validateToolCall('save_date', { label: 'Anniversary', month: 6, day: 3, repeats_yearly: true }),
    { name: 'save_date', label: 'Anniversary', month: 6, day: 3, year: null, repeats_yearly: true });
  assert.equal(validateToolCall('save_date', { label: 'Bad', month: 2, day: 30, repeats_yearly: true }), null);
  assert.equal(validateToolCall('save_date', { label: 'Bad', month: 13, day: 1 }), null);
  assert.equal(validateToolCall('send_money', { amount: 5 }), null);
  assert.equal(validateToolCall('draft_note_to_partner', { text: 'I missed you today.' })?.name, 'draft_note_to_partner');
});

test('markdown is stripped from replies', () => {
  assert.equal(cleanReply('## Hey\n**Bold** and *soft* words\n\n\n\nEnd'), 'Hey\nBold and soft words\n\nEnd');
  // Belluh talks like a person: no list bullets, emoji, dashes, arrows, leaked tool output or pasted links
  assert.equal(cleanReply('Here are two ideas:\n- A film camera 📷\n• Poetry books ✨'), 'Here are two ideas:\nA film camera\nPoetry books');
  assert.equal(cleanReply('Saturday works — dinner at 7 → then a walk 💕'), 'Saturday works, dinner at 7, then a walk');
  assert.equal(cleanReply('Done. {"ok":true,"note":"The ideas are shown under your reply"}'), 'Done.');
  assert.equal(cleanReply('Book it [on OpenTable](https://www.opentable.com/s?x=1) or here: https://maps.google.com/x.'), 'Book it on OpenTable or here.');
  assert.equal(cleanReply('Belluh: Open 5–7pm · closes early'), 'Open 5 to 7pm, closes early');
  assert.equal(cleanReply('1. Call his mom\n2) Pick up the cake'), 'Call his mom\nPick up the cake');
  assert.equal(cleanReply('Use `code` and _this_ ~~not~~ here\n---\n> quoted'), 'Use code and this not here\n\nquoted');
  assert.equal(cleanReply('| Day | Plan |\n|---|---|\n| Sat | Ramen |'), 'Day, Plan\nSat, Ramen');
  // ordinary writing is left alone
  const plain = "Dan's birthday is in 12 days. He wrote that he misses shooting film, so I'd start there. Want me to find a table for Saturday at 7?";
  assert.equal(cleanReply(plain), plain);
  assert.equal(cleanReply('It costs $69 at Retrospekt, and ships in 2-3 days.'), 'It costs $69 at Retrospekt, and ships in 2-3 days.');
});

import { buildGeminiBody } from '../supabase/functions/_shared/proxy.ts';

test('AI proxy: converts SDK-style requests and rejects anything else', () => {
  const ok = buildGeminiBody({ model: 'gemini-3-flash-preview', contents: 'hello', config: { responseMimeType: 'application/json', responseSchema: { type: 'OBJECT' } } });
  assert.ok(!('error' in ok));
  if (!('error' in ok)) {
    assert.equal(ok.model, 'gemini-3-flash-preview');
    assert.deepEqual((ok.body as any).contents, [{ role: 'user', parts: [{ text: 'hello' }] }]);
    assert.equal((ok.body as any).generationConfig.responseMimeType, 'application/json');
  }
  const audio = buildGeminiBody({ model: 'x', contents: { parts: [{ inlineData: { mimeType: 'audio/webm', data: 'AAA' } }, { text: 'Transcribe' }] } });
  assert.ok(!('error' in audio) && audio.model === 'gemini-2.5-flash', 'unknown models fall back to the default');
  assert.ok('error' in buildGeminiBody({ contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: 'x' } }] } }));
  assert.ok('error' in buildGeminiBody({ contents: { parts: [{ functionCall: {} }] } }));
  assert.ok('error' in buildGeminiBody({ contents: 'x'.repeat(70_000) }));
  assert.ok('error' in buildGeminiBody({ contents: 42 }));
});

import { hideUnansweredDaily, factsBlock, notesBlock, weeksBlock } from '../supabase/functions/_shared/agent.ts';

test("Belluh can't give away today's answer before you've answered", () => {
  const now = new Date('2026-10-13T15:00:00Z');
  const q = 'What made you smile today?';
  const rows: EntryRow[] = [
    { id: 'a', user_id: 'd', content: 'DAN ANSWER', title: q, is_shared: true, created_at: '2026-10-13T12:00:00Z' },
    { id: 'b', user_id: 'd', content: 'old answer', title: 'Old question', is_shared: true, created_at: '2026-10-01T12:00:00Z' },
    { id: 'c', user_id: 'd', content: 'plain entry', is_shared: true, created_at: '2026-10-13T12:00:00Z' },
  ];
  assert.deepEqual(hideUnansweredDaily('m', rows, now).map(r => r.id), ['b', 'c']);
  const mine: EntryRow = { id: 'm1', user_id: 'm', content: 'mine', title: q, is_shared: true, created_at: '2026-10-13T13:00:00Z' };
  assert.deepEqual(hideUnansweredDaily('m', [...rows, mine], now).map(r => r.id).sort(), ['a', 'b', 'c', 'm1']);
});

test('the couple\'s story, notes and past weeks reach Belluh', () => {
  const names = { m: 'Maya', d: 'Dan' };
  assert.match(factsBlock([{ id: 'f', user_id: 'm', content: 'Together since 2021. Met at a climbing gym.', is_shared: true, tags: ['system_facts'], created_at: '2026-01-01T00:00:00Z' }], names)!, /Maya wrote: Together since 2021/);
  assert.equal(factsBlock([], names), null);
  assert.match(notesBlock([{ from_user: 'm', to_user: 'd', body: 'Miss you', created_at: '2026-10-12T10:00:00Z' }], names)!, /Maya to Dan: Miss you/);
  assert.match(weeksBlock([{ week_start: '2026-10-04', action: 'Walk after dinner.', checkins: [{ name: 'Maya', status: 'done' }] }])!, /"Walk after dinner\." \(Maya did it\)/);
  const p = systemPrompt({ myName: 'Maya', partnerName: 'Dan', memories: [], entries: '', dates: '', today: '2026-10-13', facts: 'Together since 2021.', notes: null, pastWeeks: null });
  assert.match(p, /Their story, in their words\nTogether since 2021\./);
  assert.match(p, /Earlier weeks\n\(This is their first week/);
});

test('in-app Belluh can do everything WhatsApp can with dates', () => {
  assert.deepEqual(validateToolCall('forget_date', { query: "  Dan's birthday " }), { name: 'forget_date', query: "Dan's birthday" });
  assert.equal(validateToolCall('forget_date', { query: 'x' }), null);
  assert.deepEqual(validateToolCall('set_reminders', { on: false }), { name: 'set_reminders', on: false });
  assert.equal(validateToolCall('set_reminders', { on: 'no' }), null);
  const block = occasionsBlock([{ label: "Dan's birthday", month: 10, day: 20, year: null, repeats_yearly: true, mentioned_at: '2026-03-03T10:00:00Z', source: 'whatsapp' }], { y: 2026, m: 10, d: 13 });
  assert.match(block, /Dan's birthday: October 20 \(in 7 days; they first told you on 2026-03-03 on WhatsApp\)/);
});

import { sharedBetween, usSystemPrompt } from '../supabase/functions/_shared/agent.ts';

test('Us thread: Belluh only gets what both of them can see', () => {
  const now = new Date('2026-10-14T20:00:00Z');
  const row = (id: string, user_id: string, content: string, extra: Record<string, unknown> = {}) => ({ id, user_id, content, is_shared: true, tags: [], created_at: '2026-10-14T12:00:00Z', ...extra }) as never;
  const rows = [
    row('1', 'm', 'Maya shared this'),
    row('2', 'm', 'MAYA PRIVATE', { is_shared: false }),
    row('3', 'd', 'DAN PRIVATE', { is_shared: false }),
    row('4', 'd', 'Dan answered the daily question', { title: 'Q today' }),
    row('5', 'e', 'Someone else entirely'),
    row('6', 'm', '{"firstMet":"2020-01-01"}', { tags: ['system_facts'] }),
  ];
  const out = sharedBetween('m', 'd', rows, now).map((r: any) => r.content);
  assert.deepEqual(out, ['Maya shared this'], "no private entries, no strangers, and Dan's daily answer waits for Maya's");
  const both = sharedBetween('m', 'd', [...rows, row('7', 'm', 'Maya answered too', { title: 'Q today' })], now).map((r: any) => r.content);
  assert.ok(both.includes('Dan answered the daily question') && both.includes('Maya answered too'), 'once both answer, both are in');

  const p = usSystemPrompt({ names: ['Maya', 'Dan'], today: '2026-10-14', facts: null, weekly: null, pastWeeks: null, plans: null, entries: '- Maya shared this' });
  assert.match(p, /three-way chat with Maya and Dan/);
  assert.match(p, /Both of them see everything you write here/);
  assert.match(p, /that stays private/);
});
