import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  weekday, weekStart, previousWeekStart, isWeeklyDue, isCheckinDue, pairOf,
  pairActionPrompt, personalInsightInstruction, validateAction, checkinMessage,
} from '../supabase/functions/_shared/weekly.ts';
import type { EntryRow } from '../supabase/functions/_shared/agent.ts';

test('weeks start on Sunday', () => {
  assert.equal(weekday({ y: 2026, m: 10, d: 11 }), 0); // Sun Oct 11, 2026
  assert.equal(weekStart({ y: 2026, m: 10, d: 11 }), '2026-10-11');
  assert.equal(weekStart({ y: 2026, m: 10, d: 14 }), '2026-10-11');
  assert.equal(weekStart({ y: 2026, m: 10, d: 17 }), '2026-10-11');
  assert.equal(weekStart({ y: 2026, m: 11, d: 2 }), '2026-11-01', 'crosses month boundaries');
  assert.equal(previousWeekStart('2026-11-01'), '2026-10-25');
});

test('Sunday 9am for the insight, Wednesday 6pm for the check-in', () => {
  assert.equal(isWeeklyDue({ y: 2026, m: 10, d: 11, hour: 9 }), true);
  assert.equal(isWeeklyDue({ y: 2026, m: 10, d: 11, hour: 8 }), false);
  assert.equal(isWeeklyDue({ y: 2026, m: 10, d: 12, hour: 12 }), false);
  assert.equal(isCheckinDue({ y: 2026, m: 10, d: 14, hour: 18 }), true);
  assert.equal(isCheckinDue({ y: 2026, m: 10, d: 14, hour: 17 }), false);
});

test('a couple is stored once regardless of who triggers it', () => {
  assert.deepEqual(pairOf('b', 'a'), { user_a: 'a', user_b: 'b' });
  assert.deepEqual(pairOf('a', 'b'), { user_a: 'a', user_b: 'b' });
  assert.deepEqual(pairOf('a', null), { user_a: 'a', user_b: null });
});

test("the shared action never sees either partner's private entries", () => {
  const rows: EntryRow[] = [
    { id: '1', user_id: 'm', content: 'We loved the Saturday market.', is_shared: true, created_at: '2026-10-10T10:00:00Z' },
    { id: '2', user_id: 'm', content: 'MAYA SECRET worry', is_shared: false, created_at: '2026-10-10T11:00:00Z' },
    { id: '3', user_id: 'd', content: 'DAN SECRET plan', is_shared: false, created_at: '2026-10-10T12:00:00Z' },
    { id: '4', user_id: 'd', content: 'Long week, missed dinner together.', is_shared: true, created_at: '2026-10-09T12:00:00Z' },
  ];
  const p = pairActionPrompt({ names: { m: 'Maya', d: 'Dan' }, entries: rows, lastWeek: null, today: '2026-10-11' });
  assert.ok(!p.includes('SECRET'));
  assert.match(p, /Maya: We loved the Saturday market/);
  assert.match(p, /Dan: Long week/);
  assert.match(p, /first week/);
});

test('last week shapes this week', () => {
  const p = pairActionPrompt({
    names: { m: 'Maya', d: 'Dan' }, entries: [], today: '2026-10-18',
    lastWeek: { action: 'Phones away at dinner twice.', checkins: [{ name: 'Maya', status: 'done' }, { name: 'Dan', status: 'skipped' }] },
  });
  assert.match(p, /Phones away at dinner twice\.". Maya did it; Dan skipped it\./);
  assert.match(personalInsightInstruction('Walk after dinner.', null), /Walk after dinner\./);
});

test('model output for the action is validated', () => {
  assert.deepEqual(validateAction({ action: '  Take a  walk after dinner. ', why: 'You both wrote about evenings.' }),
    { action: 'Take a walk after dinner.', why: 'You both wrote about evenings.' });
  assert.equal(validateAction({ action: '' }), null);
  assert.equal(validateAction({ action: 'x'.repeat(400) }), null);
  assert.equal(validateAction(null), null);
  assert.match(checkinMessage('Walk after dinner.', 'Dan'), /you and Dan/);
});
