import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedToUtc, validatePlan, formatOption, localDateOf, icsCalendar, googleCalendarUrl } from '../supabase/functions/_shared/plans.ts';

test('local times convert exactly, across daylight saving', () => {
  assert.equal(zonedToUtc('2026-10-17T19:00', 'America/New_York'), '2026-10-17T23:00:00.000Z');
  assert.equal(zonedToUtc('2026-12-05T19:00', 'America/New_York'), '2026-12-06T00:00:00.000Z');
  assert.equal(zonedToUtc('2026-10-17T19:00', 'Europe/London'), '2026-10-17T18:00:00.000Z');
  assert.equal(zonedToUtc('nonsense', 'America/New_York'), null);
});

test('Belluh can only propose real, future times', () => {
  const now = new Date('2026-10-13T12:00:00Z');
  const p = validatePlan({ title: '  Dinner at   Nopa ', options: [
    { start: '2026-10-17T19:00', minutes: 90, label: 'Saturday' },
    { start: '2026-10-01T19:00' },                 // past: dropped
    { start: '2027-12-01T19:00' },                 // too far: dropped
  ] }, 'America/New_York', now)!;
  assert.equal(p.title, 'Dinner at Nopa');
  assert.deepEqual(p.options, [{ id: 'a', starts_at: '2026-10-17T23:00:00.000Z', minutes: 90, label: 'Saturday' }]);
  assert.equal(validatePlan({ title: 'x', options: [] }, 'America/New_York', now), null);
  assert.equal(validatePlan({ title: 'Walk', options: [{ start: '2026-10-01T10:00' }] }, 'America/New_York', now), null);
  assert.equal(formatOption(p.options[0], 'America/New_York'), 'Sat, Oct 17 · 7:00 PM');
  assert.deepEqual(localDateOf(p.options[0].starts_at, 'America/New_York'), { y: 2026, m: 10, d: 17 });
});

test('calendar feed and Add to Google Calendar', () => {
  const ics = icsCalendar('Maya & Dan', [{ uid: 'p1', title: 'Dinner, at Nopa', starts_at: '2026-10-17T23:00:00.000Z', minutes: 90 }],
    [{ uid: 'o1', title: "Dan's birthday", month: 10, day: 20, year: null, repeats_yearly: true }], new Date('2026-10-13T12:00:00Z'));
  assert.match(ics, /BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261017T230000Z\r\nDTEND:20261018T003000Z\r\nSUMMARY:Dinner\\, at Nopa/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261020\r\nDTEND;VALUE=DATE:20261021\r\nSUMMARY:Dan's birthday\r\nRRULE:FREQ=YEARLY/);
  assert.ok(ics.split('\r\n').every(l => l.length <= 75));
  assert.match(googleCalendarUrl({ uid: 'p1', title: 'Dinner', starts_at: '2026-10-17T23:00:00.000Z', minutes: 90 }), /dates=20261017T230000Z%2F20261018T003000Z/);
});
