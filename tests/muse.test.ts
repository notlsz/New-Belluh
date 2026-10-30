import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGoal, logProgress, current, goalLine, isoWeek, type Goal } from '../supabase/functions/_shared/goals.ts';
import { validateWatch, parseTicketmaster, eventFound, priceFound, ticketmasterUrl, foundText } from '../supabase/functions/_shared/watches.ts';
import { buildIdeas } from '../supabase/functions/_shared/ideas.ts';
import { validateToolCall } from '../supabase/functions/_shared/agent.ts';

const today = { y: 2026, m: 10, d: 30 };

test('goals: saving, habits and budgets, in the money they use', () => {
  const kyoto = validateGoal({ kind: 'save', title: 'Kyoto trip', target: 3000, due_on: '2027-04-01' }, 'FR', today)!;
  assert.equal(kyoto.currency, 'EUR');
  assert.equal(kyoto.period, null);
  const yen = validateGoal({ kind: 'save', title: '旅行', target: 300000 }, 'JP', today)!;
  assert.equal(yen.currency, 'JPY');
  const dates = validateGoal({ kind: 'habit', title: 'Date night', target: 1, period: 'week' }, 'US', today)!;
  assert.equal(dates.currency, null);
  assert.equal(dates.period_key, '2026-W44');
  // Nonsense is refused: no title, a habit 12 times a week, a due date in the past
  assert.equal(validateGoal({ kind: 'save', title: '', target: 10 }, 'US', today), null);
  assert.equal(validateGoal({ kind: 'habit', title: 'Walk', target: 12, period: 'week' }, 'US', today), null);
  assert.equal(validateGoal({ kind: 'nope', title: 'x y', target: 1 }, 'US', today), null);
  assert.equal(validateGoal({ kind: 'save', title: 'Car', target: 100, due_on: '2020-01-01' }, 'US', today)!.due_on, null);
});

test('goals: progress adds up, and habits start over each week', () => {
  const g: Goal = { kind: 'habit', title: 'Date night', target: 1, progress: 0, currency: null, period: 'week', period_key: '2026-W44', due_on: null };
  const a = logProgress(g, 1, today)!;
  assert.equal(a.progress, 1);
  // Next week, last week's date no longer counts
  const nextWeek = { y: 2026, m: 11, d: 3 };
  assert.equal(current({ ...g, progress: 1 }, nextWeek), 0);
  assert.equal(logProgress({ ...g, progress: 1 }, 1, nextWeek)!.progress, 1);
  assert.equal(logProgress(g, 0.5, today), null);
  const save: Goal = { kind: 'save', title: 'Kyoto trip', target: 3000, progress: 2900, currency: 'EUR', period: null, period_key: null, due_on: '2027-04-01' };
  assert.equal(logProgress(save, 150, today)!.done, true);
  assert.equal(logProgress(save, -5000, today)!.progress, 0);
  assert.match(goalLine({ ...save, progress: 1200 }, today), /Kyoto trip: saved 1,200 of 3,000 EUR, by 2027-04-01, about 360 a month/);
  assert.equal(isoWeek({ y: 2027, m: 1, d: 1 }), '2026-W53');
  assert.equal(isoWeek({ y: 2026, m: 1, d: 1 }), '2026-W01');
});

test('watches: tickets once they are really on sale, at their price', () => {
  const w = validateWatch({ kind: 'event', what: 'Laufey', place: 'Los Angeles', max_price: 150 }, today)!;
  assert.equal(w.until_on, '2026-12-29');
  assert.equal(validateWatch({ kind: 'price', what: 'Glide Pro stroller' }, today), null, 'a price watch needs a price');
  assert.equal(validateWatch({ kind: 'event', what: 'Laufey', until: '2030-01-01' }, today)!.until_on, '2026-12-29');
  const now = new Date('2026-10-30T18:00:00Z');
  const json = { _embedded: { events: [
    { name: 'Laufey: A Matter of Time Tour', url: 'https://www.ticketmaster.com/event/A', dates: { start: { localDate: '2027-02-14' }, status: { code: 'onsale' } }, sales: { public: { startDateTime: '2026-11-06T17:00:00Z' } }, priceRanges: [{ min: 59.5, currency: 'USD' }], _embedded: { venues: [{ name: 'Hollywood Bowl' }] } },
    { name: 'Laufey', url: 'https://www.ticketmaster.com/event/B', dates: { start: { localDate: '2027-02-15' }, status: { code: 'onsale' } }, sales: { public: { startDateTime: '2026-10-01T17:00:00Z' } }, priceRanges: [{ min: 89, currency: 'USD' }], _embedded: { venues: [{ name: 'Hollywood Bowl' }] } },
    { name: 'Something else', url: 'http://insecure', dates: { status: { code: 'onsale' } } },
  ] } };
  const ev = parseTicketmaster(json, now);
  assert.equal(ev.length, 2);
  assert.equal(ev[0].onSale, false, 'public sale starts next week');
  const f = eventFound(w, ev)!;
  assert.equal(f.url, 'https://www.ticketmaster.com/event/B');
  assert.match(f.title, /Laufey, Hollywood Bowl, 2027-02-15/);
  assert.equal(f.price, 'from 89 USD');
  assert.equal(eventFound({ ...w, max_cents: 5000 }, ev), null, 'over their price');
  assert.match(foundText(w, f), /Tickets are on sale/);
  const url = ticketmasterUrl(w, 'US', 'k');
  assert.match(url, /keyword=Laufey/); assert.match(url, /city=Los\+Angeles/); assert.match(url, /countryCode=US/);
  assert.doesNotMatch(ticketmasterUrl(w, 'JP', 'k'), /countryCode/);
});

test('watches: a price drop on the real thing, not a lookalike', () => {
  const w = validateWatch({ kind: 'price', what: 'Glide Pro stroller', max_price: 120 }, today)!;
  const products = [
    { title: 'Glide Pro Travel Stroller', price: '$80.00', seller: 'NovaCruise', image: null, url: 'https://novacruise.example/a' },
    { title: 'Stroller rain cover', price: '$20.00', seller: 'Other', image: null, url: 'https://other.example/b' },
    { title: 'Glide Pro Stroller', price: '$140.00', seller: 'Pricey', image: null, url: 'https://pricey.example/c' },
  ];
  const f = priceFound(w, products)!;
  assert.equal(f.url, 'https://novacruise.example/a');
  assert.equal(priceFound({ ...w, max_cents: 5000 }, products), null);
});

test('ideas: soonest and most useful first, each one once', () => {
  const ideas = buildIdeas({
    country: 'JP',
    occasions: [
      { label: "Dan's birthday", month: 11, day: 9, year: 1994, repeats_yearly: true },
      { label: 'Started dating', month: 2, day: 10, year: 2024, repeats_yearly: true },
      { label: 'Dan turns 32', month: 11, day: 11, year: null, kind: 'birthday', repeats_yearly: true },
      { label: 'Dinner at the Thai place', month: 11, day: 3, year: 2026, kind: 'other', repeats_yearly: false },
      { label: 'Paris trip', month: 11, day: 6, year: 2026, kind: 'trip', repeats_yearly: false },
    ],
    memories: ['Dan wants to see the northern lights', 'Works at a bank'],
    waitingPlans: [{ id: 'p1', title: 'Dinner at the Thai place' }],
    goals: [{ id: 'g1', kind: 'habit', title: 'Date night', target: 1, progress: 0, currency: null, period: 'week', period_key: '2026-W44', due_on: null, status: 'active' }],
    watches: [{ id: 'w1', what: 'Laufey tickets' }],
    lastTogether: null,
  }, today, 8);
  const kinds = ideas.map(i => i.kind);
  assert.equal(kinds[0], 'plan_waiting');
  // Only the days about them, and Dan's birthday once (not again as "Dan turns 32"); a dinner or a trip is already a plan
  assert.deepEqual(ideas.filter(i => i.kind === 'occasion').map(i => (i as any).label), ["Dan's birthday"]);
  assert.deepEqual(ideas.find(i => i.kind === 'occasion'), { kind: 'occasion', key: "occ:Dan's birthday:2026", label: "Dan's birthday", inDays: 10 });
  // Day 1,000 since 2024-02-10 is 2026-11-05
  assert.deepEqual(ideas.find(i => i.kind === 'milestone'), { kind: 'milestone', key: 'day:1000', day: 1000, inDays: 6 });
  assert.equal((ideas.find(i => i.kind === 'wish') as any).fact, 'Dan wants to see the northern lights');
  assert.ok(kinds.includes('goal') && kinds.includes('novelty'));
  assert.equal(new Set(ideas.map(i => i.key)).size, ideas.length);
  // A quiet week: only the love days coming up there (Halloween tomorrow, Thanksgiving in a month)
  assert.deepEqual(buildIdeas({ country: 'US', occasions: [], memories: [], waitingPlans: [], goals: [], watches: [], lastTogether: '2026-10-25T19:00:00Z' }, today).map(i => i.kind), ['love_day', 'love_day']);
});

test('Bella can set goals, log them and watch for things', () => {
  assert.deepEqual(validateToolCall('set_goal', { kind: 'save', title: 'Kyoto trip', target: 3000, due_on: '2027-04-01' }), { name: 'set_goal', args: { kind: 'save', title: 'Kyoto trip', target: 3000, due_on: '2027-04-01' } });
  assert.deepEqual(validateToolCall('log_goal', { goal: 'Kyoto', amount: 200 }), { name: 'log_goal', goal: 'Kyoto', amount: 200 });
  assert.equal(validateToolCall('log_goal', { goal: '', amount: 2 }), null);
  assert.deepEqual(validateToolCall('watch_for', { kind: 'event', what: 'Laufey' }), { name: 'watch_for', args: { kind: 'event', what: 'Laufey' } });
  assert.equal(validateToolCall('watch_for', 'nope' as any), null);
});
