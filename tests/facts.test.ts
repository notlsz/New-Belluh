import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFactDate, readableFacts, ymdString } from '../supabase/functions/_shared/facts.ts';
import { factsBlock } from '../supabase/functions/_shared/agent.ts';

test('fact dates: bare dates and old UTC-midnight timestamps keep the chosen day', () => {
  assert.deepEqual(parseFactDate('2021-06-14'), { y: 2021, m: 6, d: 14 });
  assert.deepEqual(parseFactDate('2021-06-14T00:00:00.000Z'), { y: 2021, m: 6, d: 14 });
  assert.equal(parseFactDate(null), null);
  assert.equal(parseFactDate(''), null);
  assert.equal(parseFactDate('not a date'), null);
  assert.equal(ymdString({ y: 2021, m: 6, d: 4 }), '2021-06-04');
});

test('facts read as words for Belluh, and unset ones are left out', () => {
  const json = JSON.stringify({ firstMet: '2020-05-01', anniversary: '2021-06-14T00:00:00.000Z', partnerBday: null, configs: { a: 1 } });
  assert.equal(readableFacts(json), 'First met: May 1, 2020; Anniversary: June 14, 2021');
  assert.equal(readableFacts(JSON.stringify({ firstMet: null })), '(no dates filled in yet)');
  assert.equal(readableFacts('Together since 2021.'), 'Together since 2021.');
  const block = factsBlock([{ id: 'f', user_id: 'm', content: json, is_shared: true, tags: ['system_facts'], created_at: '2026-01-01T00:00:00Z' } as never], { m: 'Maya' })!;
  assert.match(block, /Maya wrote: First met: May 1, 2020; Anniversary: June 14, 2021/);
  assert.doesNotMatch(block, /configs/);
});
