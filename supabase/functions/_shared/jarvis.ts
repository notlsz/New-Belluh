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
    marks.map(x => `- ${x.label}: ${iso(x.on)} (${x.inDays === 0 ? 'today' : (x.inDays === 1 ? 'tomorrow' : `in ${x.inDays} days`)})`).join('\n');
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
  return soon.length ? soon.map(x => `- ${x.name} peak the night of ${iso(x.on)} (${x.inDays === 0 ? 'tonight' : (x.inDays === 1 ? 'tomorrow' : `in ${x.inDays} days`)}): ${x.note}`).join('\n') : null;
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

// The days couples mark where they live, with what people there actually do. Bella brings one up early enough to
// plan for it, the way a local friend would. Fixed dates, or "the nth weekday of a month".
type LoveDay = { name: string; note: string; m: number; d?: number; nth?: [n: number, weekday: number] };
const LOVE_DAYS: Record<string, LoveDay[]> = {
  JP: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'traditionally she gives him chocolate (honmei, often handmade); many couples now do it their own way, so ask' },
    { name: 'White Day', m: 3, d: 14, note: 'he gives back, usually something a little nicer: sweets, a small accessory, flowers' },
    { name: 'Tanabata', m: 7, d: 7, note: 'the star festival of two lovers who meet once a year; write wishes on tanzaku papers together, yukata and a festival walk' },
    { name: 'Ii Fufu no Hi', m: 11, d: 22, note: '"good couple day" (11/22), a popular day for married couples and wedding registrations' },
    { name: 'Christmas Eve', m: 12, d: 24, note: 'the couples\' night of the year: illuminations, a nice dinner booked weeks ahead, a gift' },
  ],
  FR: [
    { name: 'la Saint-Valentin', m: 2, d: 14, note: 'for couples only (friends don\'t celebrate it); a dinner, flowers, a handwritten word' },
    { name: 'la Fête de la Musique', m: 6, d: 21, note: 'free music on every corner until late; a perfect spontaneous evening out together' },
    { name: 'le 14 juillet', m: 7, d: 14, note: 'fireworks over the city at night; a picnic spot by the river, booked early' },
    { name: 'le Beaujolais nouveau', m: 11, nth: [3, 4], note: 'the new wine arrives (third Thursday of November); a bistro evening' },
    { name: 'le Réveillon de la Saint-Sylvestre', m: 12, d: 31, note: 'New Year\'s Eve, often with friends; bisous at midnight' },
  ],
  IT: [
    { name: 'San Valentino', m: 2, d: 14, note: 'for couples; dinner out and a gift, chocolates (Baci are a classic) or flowers' },
    { name: 'la Festa della Donna', m: 3, d: 8, note: 'Women\'s Day; a sprig of yellow mimosa is the tradition' },
    { name: 'la Notte di San Lorenzo', m: 8, d: 10, note: 'shooting stars: lie out under the sky together and make a wish on each one' },
    { name: 'Ferragosto', m: 8, d: 15, note: 'the heart of summer; cities empty for the sea or the mountains, plan the escape early' },
    { name: 'la Vigilia di Natale', m: 12, d: 24, note: 'usually with family (often a fish dinner); decide early whose family, and keep a moment for just the two of you' },
    { name: 'San Silvestro', m: 12, d: 31, note: 'New Year\'s Eve: lentils for luck, red underwear for love, fireworks at midnight' },
  ],
  GB: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'a proper card with real words matters; tables book up' },
    { name: 'Bonfire Night', m: 11, d: 5, note: 'fireworks, a bonfire and something warm to drink' },
    { name: 'Christmas Eve', m: 12, d: 24, note: 'decide early whose family; a winter walk and the pub' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'parties and dinners book up early' },
  ],
  BR: [
    { name: 'Dia das Mães', m: 5, nth: [2, 0], note: 'Mother\'s Day, a big family lunch; plan for both mothers' },
    { name: 'Dia dos Namorados', m: 6, d: 12, note: 'the couples\' day in Brazil (not Feb 14): dinner, flowers, a gift; restaurants book out' },
    { name: 'São João', m: 6, d: 24, note: 'Festa Junina: quentão, quadrilha dancing, plaid shirts, a playful date' },
    { name: 'Réveillon', m: 12, d: 31, note: 'white clothes, the beach, jumping seven waves at midnight for luck' },
  ],
  CA: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'dinner and flowers; book early in the cities' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'brunch and flowers for both moms' },
    { name: 'the Fête nationale (Quebec)', m: 6, d: 24, note: 'Saint-Jean-Baptiste: shows and bonfires across Quebec' },
    { name: 'Canada Day', m: 7, d: 1, note: 'fireworks and a long weekend, often at the lake or cottage' },
    { name: 'Thanksgiving', m: 10, nth: [2, 1], note: 'family dinner (second Monday of October); decide whose family' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'a kiss at midnight; indoor plans in the cold' },
  ],
  AU: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'dinner out and flowers' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'breakfast or lunch out and flowers' },
    { name: 'Christmas Day', m: 12, d: 25, note: 'summer: the beach, a barbecue, seafood' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'harbour fireworks; good spots are claimed early in the day' },
  ],
  CN: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'roses and a nice dinner, especially for younger couples' },
    { name: '520', m: 5, d: 20, note: '"wo ai ni": a red packet of 520 yuan, flowers, a gift' },
    { name: 'Singles\' Day', m: 11, d: 11, note: 'a shopping festival, not a couples\' day; good for buying a gift early' },
    { name: 'Christmas Eve', m: 12, d: 24, note: 'a couples\' night for younger people; a gift-wrapped "peace apple" (ping\'an guo)' },
  ],
  CH: [
    { name: 'Valentinstag', m: 2, d: 14, note: 'modest: flowers or a dinner, nothing showy' },
    { name: 'Muttertag', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers and a visit' },
    { name: 'the Swiss National Day', m: 8, d: 1, note: 'bonfires on the hills and fireworks over the lakes' },
    { name: 'Christmas markets', m: 12, d: 1, note: 'Advent: mulled wine at the Christmas markets through December' },
    { name: 'Silvester', m: 12, d: 31, note: 'New Year\'s Eve; fireworks over the lake' },
  ],
  US: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'tables book up two to three weeks ahead; flowers and a card' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'flowers for both moms; brunch books out early' },
    { name: 'the Fourth of July', m: 7, d: 4, note: 'fireworks; find a rooftop or a spot by the water early' },
    { name: 'Halloween', m: 10, d: 31, note: 'a couples\' costume is a fun date' },
    { name: 'Thanksgiving', m: 11, nth: [4, 4], note: 'family; decide early whose family you\'re with this year, and travel books up' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'a kiss at midnight; dinners and parties book up early' },
  ],
};

const nthWeekday = (y: number, m: number, n: number, wd: number) => {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  return 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
};

/** Love days in their country in the next 45 days, soonest first, with what people there do. */
export function loveCalendar(country: string, today: LocalDate, within = 45): string | null {
  const days = LOVE_DAYS[country];
  if (!days) return null;
  const soon: { name: string; note: string; on: LocalDate; inDays: number }[] = [];
  for (const x of days) for (const y of [today.y, today.y + 1]) {
    const on = { y, m: x.m, d: x.d ?? nthWeekday(y, x.m, x.nth![0], x.nth![1]) };
    const inDays = daysBetween(today, on);
    if (inDays >= 0 && inDays <= within) { soon.push({ name: x.name, note: x.note, on, inDays }); break; }
  }
  soon.sort((a, b) => a.inDays - b.inDays);
  return soon.length ? soon.map(x => `- ${x.name}, ${iso(x.on)} (${x.inDays === 0 ? 'today' : (x.inDays === 1 ? 'tomorrow' : `in ${x.inDays} days`)}): ${x.note}`).join('\n') : null;
}
