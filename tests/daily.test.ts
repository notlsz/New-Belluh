import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, questionForDay } from '../src/lib/daily.ts';

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
