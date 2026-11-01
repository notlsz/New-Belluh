import test from 'node:test';
import assert from 'node:assert/strict';
import { togetherSince, milestones, skyBlock, noveltyLine, playlistLinks } from '../supabase/functions/_shared/jarvis.ts';
import { validateToolCall, systemPrompt } from '../supabase/functions/_shared/agent.ts';

const today = { y: 2026, m: 10, d: 30 };

test('Together since: the day they got together, never a wedding or a birthday', () => {
  assert.equal(togetherSince([{ label: "Dan's birthday", month: 3, day: 2, year: 1995 }]), null);
  assert.equal(togetherSince([{ label: 'Wedding anniversary', month: 6, day: 1, year: 2020 }]), null);
  assert.deepEqual(togetherSince([{ label: 'Day we met', month: 1, day: 5, year: 2024 }, { label: 'Together anniversary', month: 2, day: 14, year: 2024 }])?.start, { y: 2024, m: 2, d: 14 });
  assert.equal(togetherSince([{ label: 'Together anniversary', month: 2, day: 14, year: null }]), null, 'no year, no count');
});

test('Day counts the way couples count them: the first day is day 1; the next 100 and the first months', () => {
  // Together since Aug 4 2026: Oct 30 is day 88, day 100 is Nov 11
  const m = milestones([{ label: 'Got together', month: 8, day: 4, year: 2026 }], today, 'KR')!;
  assert.match(m, /Today is day 88 since Got together/);
  assert.match(m, /Day 100 together: 2026-11-11 \(in 12 days\)/);
  assert.match(m, /3 months together: 2026-11-04 \(in 5 days\)/);
  assert.match(m, /celebrate 100 days/);
  assert.ok(m.indexOf('3 months') < m.indexOf('Day 100'), 'soonest first');
  const us = milestones([{ label: 'Started dating', month: 10, day: 30, year: 2021 }], today, 'US')!;
  assert.match(us, /Today is day 1,827/);
  assert.match(us, /Day 2,000 together: 2027-04-21/);
  assert.ok(!/months together/.test(us), 'monthly anniversaries only in the first year');
  assert.ok(!/celebrate 100 days/.test(us));
  assert.match(milestones([{ label: 'Together', month: 10, day: 30, year: 2026 }], today, 'JP')!, /Today is day 1 since/);
  assert.equal(milestones([{ label: 'Together', month: 11, day: 30, year: 2026 }], today, 'JP'), null, 'not yet');
});

test('The night sky: meteor showers peaking within 45 days', () => {
  const s = skyBlock(today)!;
  assert.match(s, /Leonids peak the night of 2026-11-17 \(in 18 days\)/);
  assert.match(s, /Geminids peak the night of 2026-12-14 \(in 45 days\)/);
  assert.ok(!/Perseids/.test(s));
  assert.match(skyBlock({ y: 2026, m: 12, d: 31 })!, /Quadrantids peak the night of 2027-01-03/);
  assert.equal(skyBlock({ y: 2026, m: 6, d: 1 }), null);
});

test('Something new: only after three weeks without a date, never for someone with no history', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  assert.equal(noveltyLine([], now), null);
  assert.equal(noveltyLine(['2026-10-20T19:00:00Z'], now), null);
  assert.match(noveltyLine(['2026-09-01T19:00:00Z', null, '2026-12-01T19:00:00Z'], now)!, /8 weeks ago/, 'future plans are not past dates');
});

test('Playlists in the app people use there', () => {
  assert.match(playlistLinks('candlelit jazz', 'US')[0].url, /^https:\/\/open\.spotify\.com\/search\/candlelit%20jazz\/playlists$/);
  assert.equal(playlistLinks('city pop', 'CN').length, 1);
  assert.match(playlistLinks('city pop', 'CN')[0].url, /y\.qq\.com/);
  assert.ok(playlistLinks('ballads', 'KR').some(l => /melon\.com/.test(l.url)));
  assert.deepEqual(playlistLinks('', 'US'), []);
  assert.deepEqual(validateToolCall('mood_playlist', { vibe: '  slow   jazz ' }), { name: 'mood_playlist', vibe: 'slow jazz' });
});

test('Bella keeps watch, answers in their language, and protects the evening', () => {
  const p = systemPrompt({ myName: 'Maya', partnerName: 'Dan', memories: [], entries: '', dates: '', today: '2026-10-30', watch: 'Today is day 88 since Got together.' });
  assert.match(p, /Keeping watch\nToday is day 88/);
  assert.match(p, /Reply in the language they write to you in/);
  assert.match(p, /Do Not Disturb/);
  assert.match(p, /two weeks ahead for anything that ships/);
  assert.match(p, /Rest:/);
});

test('Love calendar: every country with a region kit has its own love days, and Korea counts Pepero Day', async () => {
  const { KITS } = await import('../supabase/functions/_shared/region.ts');
  const { loveDaysSoon } = await import('../supabase/functions/_shared/jarvis.ts');
  for (const c of Object.keys(KITS)) assert.ok(loveDaysSoon(c, { y: 2026, m: 1, d: 1 }, 366).length > 0, `${c} has no love days`);
  const kr = loveDaysSoon('KR', { y: 2026, m: 11, d: 1 }, 45);
  assert.equal(kr[0].local, '빼빼로데이');
  assert.equal(kr[0].on.d, 11);
});
