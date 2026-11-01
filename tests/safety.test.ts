import test from 'node:test';
import assert from 'node:assert/strict';
import { crisisSignal, crisisLine, withCrisisLine, disclosure, needsDisclosure, DISCLOSE_EVERY_MS } from '../supabase/functions/_shared/safety.ts';

test('Crisis check: catches it in every language Belluh speaks, and leaves ordinary talk alone', () => {
  for (const t of ['I want to kill myself', "honestly I don't want to live anymore", 'quiero morir', 'não quero mais viver', 'je veux mourir',
    'voglio farla finita', 'ich will nicht mehr leben', '死にたい', '我想死', '죽고 싶어', 'thinking about suicide'])
    assert.ok(crisisSignal(t), t);
  for (const t of ['this traffic is killing me', 'I could die for that tiramisu', 'plan a dinner for Friday', 'he cut my hair', 'killer date idea'])
    assert.ok(!crisisSignal(t), t);
});

test('Crisis line: the local line in the local language, always in the reply', () => {
  assert.match(crisisLine('US'), /988/);
  assert.match(crisisLine('KR'), /109/);
  assert.match(crisisLine('JP'), /0120-279-338/);
  assert.match(crisisLine('BR'), /188/);
  assert.match(crisisLine('ZZ'), /emergency number/);
  assert.equal(withCrisisLine('I am here. Call 988 now.', 'US'), 'I am here. Call 988 now.');
  assert.match(withCrisisLine("I'm so glad you told me.", 'GB'), /116 123/);
});

test('AI disclosure: new conversation and every three hours, in their language', () => {
  const now = Date.parse('2026-11-01T12:00:00Z');
  assert.ok(needsDisclosure(null, now));
  assert.ok(!needsDisclosure(new Date(now - DISCLOSE_EVERY_MS + 60_000).toISOString(), now));
  assert.ok(needsDisclosure(new Date(now - DISCLOSE_EVERY_MS).toISOString(), now));
  assert.match(disclosure('US'), /AI/);
  assert.match(disclosure('JP'), /AI/);
  assert.match(disclosure('KR'), /AI/);
});
