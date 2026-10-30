// What a Jarvis for the relationship keeps an eye on, so Bella can bring it up before they think to ask: how many days
// they've been together and the next milestone (100 days, 1,000 days, the first months), the night sky worth a date
// (a meteor shower peaking), and how long since they last did something together. Pure logic, unit-tested in Node.

import { daysBetween, nextOccurrence, type LocalDate } from './occasions.ts';

export interface DatedOccasion { label: string; month: number; day: number; year: number | null }

/** The day they got together (or met, or first dated), if they saved it with a year. */
export function togetherSince(rows: DatedOccasion[]): { label: string; start: LocalDate } | null {
  const rank = (l: string) => /together|started dating|dating anniversary|became a couple|our anniversary|^anniversary$/i.test(l) ? 0 : /first date/i.test(l) ? 1 : /\bmet\b/i.test(l) ? 2 : -1;
  const best = rows.filter(r => r.year && r.year > 1900 && !/wedding|married|engag/i.test(r.label) && rank(r.label) >= 0)
    .sort((a, b) => rank(a.label) - rank(b.label))[0];
  return best ? { label: best.label, start: { y: best.year!, m: best.month, d: best.day } } : null;
}

const addDays = (x: LocalDate, n: number): LocalDate => {
  const t = new Date(Date.UTC(x.y, x.m - 1, x.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};
const iso = (x: LocalDate) => `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;

/**
 * Day counts the way couples count them (the first day is day 1, as in Korea and Japan): today's count, and the next
 * milestones: every 100 days to 1,000, then 1,500, 2,000 and each 1,000 after; and, in their first year, each month.
 */
export function milestones(rows: DatedOccasion[], today: LocalDate, country: string): string | null {
  const t = togetherSince(rows);
  if (!t) return null;
  const day = daysBetween(t.start, today) + 1;
  if (day < 1) return null;
  const marks: { label: string; on: LocalDate; inDays: number }[] = [];
  const counts = [...Array.from({ length: 10 }, (_, i) => (i + 1) * 100), 1500, ...Array.from({ length: 10 }, (_, i) => (i + 2) * 1000)];
  for (const n of counts) if (n >= day) { const on = addDays(t.start, n - 1); marks.push({ label: `Day ${n.toLocaleString('en-US')} together`, on, inDays: daysBetween(today, on) }); if (marks.length >= 2) break; }
  // Monthly anniversaries early on, which couples in Korea and Japan (and many others) mark
  if (day <= 366) for (let mo = 1; mo <= 12; mo++) {
    const y = t.start.y + Math.floor((t.start.m - 1 + mo) / 12), m = ((t.start.m - 1 + mo) % 12) + 1;
    const on = { y, m, d: Math.min(t.start.d, new Date(Date.UTC(y, m, 0)).getUTCDate()) };
    const inDays = daysBetween(today, on);
    if (inDays >= 0) { marks.push({ label: `${mo} month${mo === 1 ? '' : 's'} together`, on, inDays }); break; }
  }
  marks.sort((a, b) => a.inDays - b.inDays);
  const counting = ['KR', 'JP', 'CN', 'TW'].includes(country) ? ' Couples there count days and celebrate 100 days, 1,000 days and the first months.' : '';
  return `Today is day ${day.toLocaleString('en-US')} since ${t.label} (${iso(t.start)}).${counting}\n` +
    marks.map(x => `- ${x.label}: ${iso(x.on)} (${x.inDays === 0 ? 'today' : `in ${x.inDays} days`})`).join('\n');
}

// Peaks of the major meteor showers, the same nights every year (northern sky; a dark place after midnight is best)
const SHOWERS: [string, number, number, string][] = [
  ['Quadrantids', 1, 3, 'short, sharp peak, up to about 100 an hour'],
  ['Lyrids', 4, 22, 'about 20 an hour'],
  ['Eta Aquariids', 5, 6, 'best before dawn, better in the southern sky'],
  ['Perseids', 8, 12, 'the summer favorite, up to about 100 an hour on warm nights'],
  ['Draconids', 10, 8, 'best in the early evening'],
  ['Orionids', 10, 21, 'about 20 an hour, from Halley\'s comet'],
  ['Leonids', 11, 17, 'about 15 an hour'],
  ['Geminids', 12, 14, 'the year\'s best, up to about 120 an hour, from mid-evening'],
];

/** Meteor showers peaking in the next 45 days, for a "look up now" night. */
export function skyBlock(today: LocalDate): string | null {
  const soon = SHOWERS.map(([name, m, d, note]) => ({ name, note, on: nextOccurrence({ month: m, day: d, year: null, repeats_yearly: true }, today)! }))
    .map(x => ({ ...x, inDays: daysBetween(today, x.on) }))
    .filter(x => x.inDays <= 45).sort((a, b) => a.inDays - b.inDays);
  return soon.length ? soon.map(x => `- ${x.name} peak the night of ${iso(x.on)} (${x.inDays === 0 ? 'tonight' : `in ${x.inDays} days`}): ${x.note}`).join('\n') : null;
}

/** How long since they last did something together that Belluh knows of; only worth saying once it's been a while. */
export function noveltyLine(lastTogether: (string | null | undefined)[], now = new Date()): string | null {
  const past = lastTogether.map(x => (x ? new Date(x).getTime() : NaN)).filter(t => Number.isFinite(t) && t <= now.getTime());
  if (!past.length) return null;
  const days = Math.floor((now.getTime() - Math.max(...past)) / 86_400_000);
  return days >= 21 ? `Their last date or plan together that you know of was ${Math.round(days / 7)} weeks ago. If it fits the moment, suggest something new for the two of them (somewhere they've never been, something one of them mentioned wanting to try), not a repeat.` : null;
}

/** Music for the evening: a playlist search in the app people use there (Spotify and YouTube Music; QQ Music in China, Melon in Korea). */
export function playlistLinks(vibe: unknown, country: string): { label: string; url: string }[] {
  const v = typeof vibe === 'string' ? vibe.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
  if (v.length < 2) return [];
  const q = encodeURIComponent(v);
  if (country === 'CN') return [{ label: `${v} on QQ Music`, url: `https://y.qq.com/n/ryqq/search?w=${q}` }];
  const out = [{ label: `${v} on Spotify`, url: `https://open.spotify.com/search/${q}/playlists` }, { label: `${v} on YouTube Music`, url: `https://music.youtube.com/search?q=${q}` }];
  if (country === 'KR') out.push({ label: `${v} on Melon`, url: `https://www.melon.com/search/total/index.htm?q=${q}` });
  return out;
}
