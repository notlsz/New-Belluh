import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, questionForDay, computeCoupleStreak, streakFor } from '../src/lib/daily.ts';

const now = new Date(2026, 9, 12, 15, 0); // Oct 12, 2026, 3pm local
const d = (day: number, h = 10) => new Date(2026, 9, day, h);

test('streak counts consecutive days ending today', () => {
  assert.equal(computeStreak([d(12), d(11), d(11, 22), d(10)], now), 3);
});
test('streak still counts if the latest entry was yesterday', () => {
  assert.equal(computeStreak([d(11), d(10)], now), 2);
});
test('a gap breaks the streak', () => {
  assert.equal(computeStreak([d(12), d(10), d(9)], now), 1);
  assert.equal(computeStreak([d(9)], now), 0);
  assert.equal(computeStreak([], now), 0);
});
test('streak crosses month boundaries', () => {
  assert.equal(computeStreak([new Date(2026, 10, 1, 9), new Date(2026, 9, 31, 9)], new Date(2026, 10, 1, 20)), 2);
});
test('both partners get the same question on the same day, and it changes daily', () => {
  const qs = ['a', 'b', 'c'];
  assert.equal(questionForDay(qs, new Date(2026, 9, 12, 1)), questionForDay(qs, new Date(2026, 9, 12, 23)));
  assert.notEqual(questionForDay(qs, new Date(2026, 9, 12)), questionForDay(qs, new Date(2026, 9, 13)));
});

import { hideLockedAnswer } from '../src/lib/daily.ts';
test("AI features never see your partner's answer before you've answered", () => {
  const now = new Date(2026, 9, 13, 15);
  const q = 'What made you smile today?';
  const e = (id: string, userId: string, prompt?: string, day = 13) => ({ id, userId, prompt, timestamp: new Date(2026, 9, day, 9) });
  const rows = [e('d1', 'dan', q), e('d0', 'dan', q, 12), e('d2', 'dan')];
  assert.deepEqual(hideLockedAnswer(rows, 'maya', q, now).map(r => r.id), ['d0', 'd2']);
  assert.deepEqual(hideLockedAnswer([...rows, e('m1', 'maya', q)], 'maya', q, now).map(r => r.id), ['d1', 'd0', 'd2', 'm1']);
});

const day = (d: number, h = 12) => new Date(2026, 10, d, h);
const tonight = day(10, 20);

test('Couple streak: only days you both wrote count, ending today or yesterday', () => {
  assert.equal(computeCoupleStreak([day(10), day(9), day(8)], [day(10), day(9)], tonight), 2);
  assert.equal(computeCoupleStreak([day(9), day(8)], [day(9), day(8), day(7)], tonight), 2, 'yesterday still counts');
  assert.equal(computeCoupleStreak([day(10), day(9)], [day(8)], tonight), 0, 'never the same day');
  assert.equal(computeCoupleStreak([], [], tonight), 0);
});

test('Streak shown: yours alone until your partner writes, then the two of you together', () => {
  const solo = [{ userId: 'me', timestamp: day(10) }, { userId: 'me', timestamp: day(9) }];
  assert.equal(streakFor(solo, 'me', tonight), 2);
  const both = [...solo, { userId: 'you', timestamp: day(10) }];
  assert.equal(streakFor(both, 'me', tonight), 1);
});

import { coupleMetrics } from '../src/lib/coupleMetrics.ts';
test('Couple metrics: both showing up, counted once per couple, first-week cohort', () => {
  const now = Date.parse('2026-11-20T12:00:00Z');
  const rows = [
    { user_id: 'a', partner_id: 'b', connected_at: '2026-11-01T00:00:00Z' },
    { user_id: 'b', partner_id: 'a', connected_at: '2026-11-01T00:00:00Z' },
    { user_id: 'c', partner_id: 'd', connected_at: '2026-11-18T00:00:00Z' },
  ];
  const entries = [
    { user_id: 'a', created_at: '2026-11-19T10:00:00Z' }, { user_id: 'b', created_at: '2026-11-18T10:00:00Z' },
    { user_id: 'a', created_at: '2026-11-02T10:00:00Z' }, { user_id: 'b', created_at: '2026-11-05T10:00:00Z' },
    { user_id: 'c', created_at: '2026-11-19T10:00:00Z' },
  ];
  const m = coupleMetrics(rows, entries, now);
  assert.equal(m.couples, 2);
  assert.equal(m.bothActive7d, 1);
  assert.equal(m.bothActiveRate, 50);
  assert.equal(m.week1Both, 100, 'only a+b are old enough for the cohort');
});
