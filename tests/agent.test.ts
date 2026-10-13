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
