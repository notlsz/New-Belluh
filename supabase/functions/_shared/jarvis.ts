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
type LoveDay = { name: string; local?: string; note: string; m: number; d?: number; nth?: [n: number, weekday: number] };
const LOVE_DAYS: Record<string, LoveDay[]> = {
  ES: [
    { name: 'Día de Reyes', m: 1, d: 6, note: 'the Three Kings bring the gifts for many families; roscón de Reyes' },
    { name: 'San Valentín', m: 2, d: 14, note: 'a dinner and a gift; tables book up, and dinner is late' },
    { name: 'Día del Padre', m: 3, d: 19, note: 'San José: something for both fathers' },
    { name: 'Sant Jordi', m: 4, d: 23, note: 'in Catalonia the most romantic day: a rose and a book, exchanged on the street stalls' },
    { name: 'Día de la Madre', m: 5, nth: [1, 0], note: 'first Sunday of May; family lunch and flowers for both mothers' },
    { name: 'la Noche de San Juan', m: 6, d: 23, note: 'bonfires on the beach and a wish; a warm night out together' },
    { name: 'Nochevieja', m: 12, d: 31, note: 'twelve grapes at midnight, one per chime, together' },
  ],
  MX: [
    { name: 'Día del Amor y la Amistad', m: 2, d: 14, note: 'for friends too; for couples flowers, chocolates and a dinner; serenatas are a classic' },
    { name: 'Día de las Madres', m: 5, d: 10, note: 'huge in Mexico: include both mothers, restaurants book out' },
    { name: 'Día del Padre', m: 6, nth: [3, 0], note: 'third Sunday of June' },
    { name: 'Día de Muertos', m: 11, d: 2, note: 'honoring loved ones who died, with altars and cempasúchil; not a romantic date, but couples visit altars together' },
    { name: 'el Día de la Virgen de Guadalupe', m: 12, d: 12, note: 'a deeply important day for many families' },
    { name: 'Las Posadas', m: 12, d: 16, note: 'nine nights of posadas until Nochebuena; family and friends' },
    { name: 'Nochebuena', m: 12, d: 24, note: 'the family Christmas dinner, late at night' },
  ],
  PT: [
    { name: 'o Dia dos Namorados', m: 2, d: 14, note: 'in Portugal it is Feb 14 (Brazil celebrates June 12): a dinner and flowers' },
    { name: 'o Dia do Pai', m: 3, d: 19, note: 'São José: something for both fathers' },
    { name: 'o Dia da Mãe', m: 5, nth: [1, 0], note: 'first Sunday of May; Sunday lunch and flowers for both mothers' },
    { name: 'o Santo António', m: 6, d: 12, note: 'Lisbon\'s matchmaker\'s night: arraiais, sardines, and a manjerico with a love verse for the one you love' },
    { name: 'a Consoada', m: 12, d: 24, note: 'Christmas Eve dinner with the family, bacalhau' },
    { name: 'a Passagem de Ano', m: 12, d: 31, note: 'New Year\'s Eve; twelve raisins at midnight and fireworks over the river' },
  ],
  JP: [
    { name: "Valentine's Day", local: 'バレンタインデー', m: 2, d: 14, note: 'traditionally she gives him chocolate (honmei, often handmade); many couples now do it their own way, so ask' },
    { name: 'White Day', local: 'ホワイトデー', m: 3, d: 14, note: 'he gives back, usually something a little nicer: sweets, a small accessory, flowers' },
    { name: 'Tanabata', local: '七夕', m: 7, d: 7, note: 'the star festival of two lovers who meet once a year; write wishes on tanzaku papers together, yukata and a festival walk' },
    { name: 'Ii Fufu no Hi', local: 'いい夫婦の日', m: 11, d: 22, note: '"good couple day" (11/22), a popular day for married couples and wedding registrations' },
    { name: 'Christmas Eve', local: 'クリスマスイブ', m: 12, d: 24, note: 'the couples\' night of the year: illuminations, a nice dinner booked weeks ahead, a gift' },
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
    { name: "Valentine's Day", local: '情人节', m: 2, d: 14, note: 'roses and a nice dinner, especially for younger couples' },
    { name: '520', local: '520', m: 5, d: 20, note: '"wo ai ni": a red packet of 520 yuan, flowers, a gift' },
    { name: 'Singles\' Day', local: '双十一', m: 11, d: 11, note: 'a shopping festival, not a couples\' day; good for buying a gift early' },
    { name: 'Christmas Eve', local: '平安夜', m: 12, d: 24, note: 'a couples\' night for younger people; a gift-wrapped "peace apple" (ping\'an guo)' },
  ],
  CH: [
    { name: 'Valentinstag', m: 2, d: 14, note: 'modest: flowers or a dinner, nothing showy' },
    { name: 'Muttertag', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers and a visit' },
    { name: 'the Swiss National Day', m: 8, d: 1, note: 'bonfires on the hills and fireworks over the lakes' },
    { name: 'Christmas markets', m: 12, d: 1, note: 'Advent: mulled wine at the Christmas markets through December' },
    { name: 'Silvester', m: 12, d: 31, note: 'New Year\'s Eve; fireworks over the lake' },
  ],
  KR: [
    { name: "Valentine's Day", local: '발렌타인데이', m: 2, d: 14, note: 'women traditionally give chocolate; he returns it on White Day' },
    { name: 'White Day', local: '화이트데이', m: 3, d: 14, note: 'he gives back: candy plus something a little nicer, often flowers or a small accessory' },
    { name: 'Rose Day', local: '로즈데이', m: 5, d: 14, note: 'roses for each other; one of the 14th-of-the-month couple days' },
    { name: "Parents' Day", local: '어버이날', m: 5, d: 8, note: 'carnations and a call or visit for both sets of parents' },
    { name: 'Pepero Day', local: '빼빼로데이', m: 11, d: 11, note: 'Pepero sticks for each other; a box with a small note or gift tucked in' },
    { name: 'Christmas Eve', local: '크리스마스 이브', m: 12, d: 24, note: 'mainly a couples\' night: a dinner date, lights and a gift; restaurants book out weeks ahead' },
  ],
  DE: [
    { name: 'Valentinstag', m: 2, d: 14, note: 'kept modest: flowers or a dinner, nothing showy' },
    { name: 'Muttertag', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers and a visit for both mothers' },
    { name: 'Advent and the Weihnachtsmärkte', m: 12, d: 1, note: 'Glühwein at the Christmas markets through December; a classic winter date' },
    { name: 'Heiligabend', m: 12, d: 24, note: 'Christmas Eve is the gift evening in Germany, usually with family; plan whose family early' },
    { name: 'Silvester', m: 12, d: 31, note: 'New Year\'s Eve: Sekt, fireworks at midnight and a wish for the year' },
  ],
  IN: [
    { name: 'Rose Day', m: 2, d: 7, note: 'the start of Valentine\'s week in the cities: roses on the 7th, then Propose, Chocolate, Teddy, Promise, Hug and Kiss days' },
    { name: "Valentine's Day", m: 2, d: 14, note: 'big for urban couples: a dinner out and a gift; keep it discreet if families are conservative' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'something for both mothers; family first' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'parties and dinners book up early in the big cities' },
  ],
  TW: [
    { name: "Valentine's Day", local: '情人節', m: 2, d: 14, note: 'flowers and a set dinner; prices peak, so book ahead' },
    { name: 'White Day', local: '白色情人節', m: 3, d: 14, note: 'a second Valentine\'s: a return gift' },
    { name: '520', local: '520', m: 5, d: 20, note: '"wo ai ni": flowers or a small gift, and many couples register marriages on this day' },
    { name: "Mother's Day", local: '母親節', m: 5, nth: [2, 0], note: 'a family meal and flowers for both mothers' },
    { name: "Father's Day", local: '父親節', m: 8, d: 8, note: '8/8 ("ba ba"): a meal or a gift for both fathers' },
    { name: 'Christmas Eve', local: '平安夜', m: 12, d: 24, note: 'a couples\' date night: lights and a dinner out' },
  ],
  HK: [
    { name: "Valentine's Day", local: '情人節', m: 2, d: 14, note: 'flowers are the big gesture, and prices double; order early' },
    { name: "Mother's Day", local: '母親節', m: 5, nth: [2, 0], note: 'dim sum with family and flowers for both mothers' },
    { name: 'Christmas Eve', local: '平安夜', m: 12, d: 24, note: 'a couples\' night: harbour lights in Tsim Sha Tsui and a dinner booked well ahead' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'harbour fireworks; claim a spot or book a view early' },
  ],
  SG: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'a dinner and flowers; set menus book out' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'a family meal and flowers for both mothers' },
    { name: 'National Day', m: 8, d: 9, note: 'fireworks over Marina Bay; a waterfront spot makes a date' },
    { name: 'Christmas Eve', m: 12, d: 24, note: 'the Orchard Road lights and a dinner date' },
  ],
  AE: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'kept private: a quiet dinner or a gift at home rather than anything public' },
    { name: "Mother's Day", m: 3, d: 21, note: 'Mother\'s Day in the Arab world: flowers and a visit for both mothers' },
    { name: 'National Day', m: 12, d: 2, note: 'fireworks and lights across the country; a long weekend for a trip' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'Burj Khalifa fireworks; views and tables sell out' },
  ],
  TR: [
    { name: 'Sevgililer Günü', m: 2, d: 14, note: 'the big flower day: roses, a dinner and a gift; flower prices peak, so order early' },
    { name: 'Hıdırellez', m: 5, d: 6, note: 'the spring festival: people tie wishes to a rose tree the night before; a sweet thing to do together' },
    { name: 'Anneler Günü', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers and a visit for both mothers' },
    { name: 'Babalar Günü', m: 6, nth: [3, 0], note: 'Father\'s Day: something for both fathers' },
    { name: 'Yılbaşı', m: 12, d: 31, note: 'New Year\'s Eve is the big gift and party night; tables book up' },
  ],
  SA: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'kept private by most: a quiet dinner or a gift at home rather than anything public' },
    { name: 'Founding Day', m: 2, d: 22, note: 'a national holiday with heritage events; a long weekend for a trip' },
    { name: "Mother's Day", m: 3, d: 21, note: 'Mother\'s Day in the Arab world: flowers and a visit for both mothers' },
    { name: 'Saudi National Day', m: 9, d: 23, note: 'fireworks and events in every city; a holiday for a getaway' },
  ],
  NL: [
    { name: 'Valentijnsdag', m: 2, d: 14, note: 'modest: flowers, a card (sometimes anonymous) or a dinner' },
    { name: 'Koningsdag', m: 4, d: 27, note: 'one big orange street party (the 26th when the 27th is a Sunday); vrijmarkt, boats and music' },
    { name: 'Moederdag', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers and breakfast for both mothers' },
    { name: 'Vaderdag', m: 6, nth: [3, 0], note: 'Father\'s Day: something for both fathers' },
    { name: 'Sinterklaasavond', m: 12, d: 5, note: 'gifts with teasing handwritten poems and surprises; Bella can help write the poem' },
    { name: 'Oudejaarsavond', m: 12, d: 31, note: 'oliebollen, fireworks and a kiss at midnight' },
  ],
  NO: [
    { name: 'Morsdag', m: 2, nth: [2, 0], note: 'Mother\'s Day in Norway is in February: flowers or breakfast for both mothers' },
    { name: 'Valentinsdag', m: 2, d: 14, note: 'modest: flowers or a dinner, nothing showy' },
    { name: '17. mai', m: 5, d: 17, note: 'Constitution Day: bunad, parades and ice cream, a day out together' },
    { name: 'Sankthansaften', m: 6, d: 23, note: 'midsummer bonfires by the water on the lightest night' },
    { name: 'Farsdag', m: 11, nth: [2, 0], note: 'Father\'s Day: something for both fathers' },
    { name: 'Julaften', m: 12, d: 24, note: 'Christmas Eve is the main celebration, usually with family; decide early whose family' },
  ],
  PL: [
    { name: 'Walentynki', m: 2, d: 14, note: 'flowers, a dinner and a card; restaurants fill up' },
    { name: 'Dzień Kobiet', m: 3, d: 8, note: 'Women\'s Day: flowers for her, and for mothers too' },
    { name: 'Dzień Matki', m: 5, d: 26, note: 'Mother\'s Day: flowers and a visit for both mothers' },
    { name: 'Dzień Ojca', m: 6, d: 23, note: 'Father\'s Day: something for both fathers' },
    { name: 'Dzień Chłopaka', m: 9, d: 30, note: 'Boyfriends\' Day: a small gift or treat for him' },
    { name: 'Andrzejki', m: 11, d: 29, note: 'a playful evening of fortune-telling (pouring wax through a key) with friends' },
    { name: 'Wigilia', m: 12, d: 24, note: 'Christmas Eve with family: sharing the opłatek wafer and twelve dishes' },
    { name: 'Sylwester', m: 12, d: 31, note: 'New Year\'s Eve parties and balls book up early' },
  ],
  BE: [
    { name: "Valentine's Day", local: 'Valentijnsdag / la Saint-Valentin', m: 2, d: 14, note: 'a dinner, flowers and good chocolate' },
    { name: "Mother's Day", local: 'Moederdag / la Fête des mères', m: 5, nth: [2, 0], note: 'second Sunday of May (Aug 15 in Antwerp): flowers for both mothers' },
    { name: "Father's Day", local: 'Vaderdag / la Fête des pères', m: 6, nth: [2, 0], note: 'second Sunday of June: something for both fathers' },
    { name: 'Sinterklaas', local: 'Sinterklaas / la Saint-Nicolas', m: 12, d: 6, note: 'gifts and speculoos on the morning of Dec 6' },
    { name: "New Year's Eve", local: 'Oudejaarsavond / le Réveillon', m: 12, d: 31, note: 'dinners and parties book up early' },
  ],
  IE: [
    { name: "St Brigid's Day", m: 2, d: 1, note: 'the start of spring, now with its own bank holiday weekend; a good weekend away' },
    { name: "Valentine's Day", m: 2, d: 14, note: 'a proper card with real words matters; tables book up' },
    { name: "St Patrick's Day", m: 3, d: 17, note: 'parades and sessions; book anywhere central early' },
    { name: "Father's Day", m: 6, nth: [3, 0], note: 'something for both fathers' },
    { name: 'Christmas Eve', m: 12, d: 24, note: 'most go home to family; decide early whose' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'parties and dinners book up early' },
  ],
  SE: [
    { name: 'Alla hjärtans dag', m: 2, d: 14, note: 'flowers and a dinner, kept modest' },
    { name: 'Valborg', m: 4, d: 30, note: 'Walpurgis Night: bonfires and songs to welcome spring' },
    { name: 'Fars dag', m: 11, nth: [2, 0], note: 'Father\'s Day: something for both fathers' },
    { name: 'Lucia', m: 12, d: 13, note: 'candlelit Lucia processions, saffron buns and glögg' },
    { name: 'Julafton', m: 12, d: 24, note: 'Christmas Eve is the main day, usually with family' },
    { name: 'Nyårsafton', m: 12, d: 31, note: 'New Year\'s Eve dinner with friends and fireworks' },
  ],
  AT: [
    { name: 'Valentinstag', m: 2, d: 14, note: 'modest: flowers or a dinner' },
    { name: 'Muttertag', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers and a visit for both mothers' },
    { name: 'Vatertag', m: 6, nth: [2, 0], note: 'Father\'s Day (second Sunday of June): something for both fathers' },
    { name: 'Advent and the Christkindlmärkte', m: 12, d: 1, note: 'Punsch at the Christmas markets through December; a classic winter date' },
    { name: 'Heiliger Abend', m: 12, d: 24, note: 'the Christkind brings the gifts on Christmas Eve, usually with family' },
    { name: 'Silvester', m: 12, d: 31, note: 'New Year\'s Eve: the Donauwalzer at midnight' },
  ],
  AR: [
    { name: 'el Día de los Enamorados', m: 2, d: 14, note: 'a dinner and a gift; dinner runs late' },
    { name: 'el Día del Padre', m: 6, nth: [3, 0], note: 'third Sunday of June: asado for both fathers' },
    { name: 'la Semana de la Dulzura', m: 7, d: 1, note: 'the first week of July: sweets traded for a kiss' },
    { name: 'el Día del Amigo', m: 7, d: 20, note: 'huge in Argentina: dinners with friends book out' },
    { name: 'el Día de la Primavera', m: 9, d: 21, note: 'the first day of spring: picnics in the park' },
    { name: 'el Día de la Madre', m: 10, nth: [3, 0], note: 'third Sunday of October (not May): a family lunch for both mothers' },
  ],
  MY: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'for many non-Muslim couples: a dinner and flowers; many Muslim couples don\'t mark it' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'a family meal and flowers for both mothers' },
    { name: 'Merdeka Day', m: 8, d: 31, note: 'National Day: fireworks and a long weekend' },
    { name: 'Malaysia Day', m: 9, d: 16, note: 'a holiday for a short getaway' },
  ],
  TH: [
    { name: "Valentine's Day", local: 'วันวาเลนไทน์', m: 2, d: 14, note: 'huge: roses, a dinner, and some couples register their marriage at Bang Rak' },
    { name: 'Songkran', local: 'สงกรานต์', m: 4, d: 13, note: 'Thai New Year (13 to 15 April): water fights, merit-making and visiting family' },
    { name: "Mother's Day", local: 'วันแม่', m: 8, d: 12, note: 'jasmine garlands and time with both mothers' },
    { name: "Father's Day", local: 'วันพ่อ', m: 12, d: 5, note: 'a meal or a visit for both fathers' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'countdowns and riverside fireworks in Bangkok' },
  ],
  ID: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'contested: some celebrate quietly with a dinner or chocolate, many skip it' },
    { name: 'Hari Kartini', m: 4, d: 21, note: 'honoring Kartini and women; some wear kebaya' },
    { name: 'Hari Kemerdekaan', m: 8, d: 17, note: 'Independence Day: neighborhood games and celebrations' },
    { name: 'Hari Ibu', m: 12, d: 22, note: 'Mother\'s Day: something for both mothers' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'fireworks and gatherings with family and friends' },
  ],
  DK: [
    { name: 'Valentinsdag', m: 2, d: 14, note: 'modest: flowers or a dinner' },
    { name: 'Mors dag', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers for both mothers' },
    { name: 'Fars dag', m: 6, d: 5, note: 'Father\'s Day falls on Constitution Day: something for both fathers' },
    { name: 'Sankthansaften', m: 6, d: 23, note: 'midsummer bonfires by the water' },
    { name: 'Juleaften', m: 12, d: 24, note: 'Christmas Eve is the main celebration, usually with family' },
    { name: 'Nytårsaften', m: 12, d: 31, note: 'the King\'s speech, kransekage and fireworks' },
  ],
  IL: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'secondary to Tu B\'Av, but many couples mark it with flowers or a dinner' },
    { name: "New Year's Eve", local: 'סילבסטר', m: 12, d: 31, note: 'parties in Tel Aviv and Haifa; not marked by everyone' },
  ],
  NZ: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'dinner out and flowers' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'breakfast or lunch out and flowers' },
    { name: "Father's Day", m: 9, nth: [1, 0], note: 'first Sunday of September: something for both dads' },
    { name: 'Christmas Day', m: 12, d: 25, note: 'summer: the beach, a barbecue, the bach' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'fireworks from the Sky Tower or a beach party' },
  ],
  VN: [
    { name: "Valentine's Day", local: 'Lễ Tình nhân', m: 2, d: 14, note: 'popular with younger couples: roses, chocolate, a dinner' },
    { name: "International Women's Day", local: 'Ngày Quốc tế Phụ nữ', m: 3, d: 8, note: 'a major flower and gift day for a partner, mothers and mothers-in-law' },
    { name: 'White Day', local: 'Valentine Trắng', m: 3, d: 14, note: 'a smaller return-gift day' },
    { name: "Vietnamese Women's Day", local: 'Ngày Phụ nữ Việt Nam', m: 10, d: 20, note: 'flowers and gifts for her, and for both mothers' },
    { name: 'Christmas Eve', local: 'Đêm Giáng sinh', m: 12, d: 24, note: 'a night out for young couples among the city lights' },
  ],
  FI: [
    { name: 'Ystävänpäivä', m: 2, d: 14, note: 'Friend\'s Day: for friends as much as couples; a card or a small gift' },
    { name: 'Vappu', m: 5, d: 1, note: 'picnics, sima and the student caps; the eve (Apr 30) is the big night out' },
    { name: 'Äitienpäivä', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers and breakfast for both mothers' },
    { name: 'Isänpäivä', m: 11, nth: [2, 0], note: 'Father\'s Day: something for both fathers' },
    { name: 'Itsenäisyyspäivä', m: 12, d: 6, note: 'Independence Day: two candles in the window and a quiet evening' },
    { name: 'Jouluaatto', m: 12, d: 24, note: 'Christmas Eve is the main day: sauna, a family dinner' },
  ],
  CL: [
    { name: 'el Día de los Enamorados', m: 2, d: 14, note: 'a dinner and flowers; restaurants fill up' },
    { name: 'el Día de la Madre', m: 5, nth: [2, 0], note: 'a family lunch for both mothers' },
    { name: 'el Día del Padre', m: 6, nth: [3, 0], note: 'something for both fathers' },
    { name: 'las Fiestas Patrias', m: 9, d: 18, note: 'fondas, cueca, empanadas and asado; a long weekend together' },
    { name: 'Año Nuevo', m: 12, d: 31, note: 'New Year\'s Eve fireworks, the biggest in Valparaíso' },
  ],
  CZ: [
    { name: 'Valentýn', m: 2, d: 14, note: 'modest: flowers or a dinner' },
    { name: 'MDŽ', m: 3, d: 8, note: 'Women\'s Day: flowers for her' },
    { name: 'První máj', m: 5, d: 1, note: 'Lovers\' Day: a kiss under a blossoming tree, and in Prague a walk up Petřín Hill' },
    { name: 'Den matek', m: 5, nth: [2, 0], note: 'Mother\'s Day: flowers for both mothers' },
    { name: 'Štědrý den', m: 12, d: 24, note: 'Christmas Eve: carp dinner and gifts from Ježíšek, with family' },
    { name: 'Silvestr', m: 12, d: 31, note: 'New Year\'s Eve parties and fireworks' },
  ],
  ZA: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'big: a dinner and flowers; tables book up' },
    { name: "Mother's Day", m: 5, nth: [2, 0], note: 'lunch out and flowers for both moms' },
    { name: "Father's Day", m: 6, nth: [3, 0], note: 'a braai for both dads' },
    { name: 'Heritage Day', m: 9, d: 24, note: 'also called Braai Day: a braai with friends' },
    { name: "New Year's Eve", m: 12, d: 31, note: 'summer: a beach or a rooftop; plan the ride home' },
  ],
  GR: [
    { name: 'Agios Valentinos', local: 'Άγιος Βαλεντίνος', m: 2, d: 14, note: 'a dinner and flowers' },
    { name: "Mother's Day", local: 'Γιορτή της Μητέρας', m: 5, nth: [2, 0], note: 'flowers for both mothers' },
    { name: 'Dekapentavgoustos', local: 'Δεκαπενταύγουστος', m: 8, d: 15, note: 'island and village festivals; the peak of summer' },
    { name: "New Year's Eve", local: 'Παραμονή Πρωτοχρονιάς', m: 12, d: 31, note: 'the vasilopita with its lucky coin is cut at midnight or on Jan 1' },
  ],
  CO: [
    { name: 'San Valentín', m: 2, d: 14, note: 'smaller than in September, but many couples go out' },
    { name: 'el Día de la Madre', m: 5, nth: [2, 0], note: 'huge: a family lunch for both mothers; restaurants book out' },
    { name: 'el Día del Padre', m: 6, nth: [3, 0], note: 'something for both fathers' },
    { name: 'Amor y Amistad', m: 9, nth: [3, 6], note: 'the big day for couples and friends (third Saturday of September): flowers, a dinner, amigo secreto' },
    { name: 'la Noche de Velitas', m: 12, d: 7, note: 'candles and lanterns at night to open the Christmas season' },
    { name: 'la Novena de Aguinaldos', m: 12, d: 16, note: 'nine nights of novenas with family until Christmas Eve' },
  ],
  HU: [
    { name: 'Valentin-nap', m: 2, d: 14, note: 'flowers and a dinner' },
    { name: 'Nőnap', m: 3, d: 8, note: 'Women\'s Day: flowers for her, and for mothers' },
    { name: 'Anyák napja', m: 5, nth: [1, 0], note: 'Mother\'s Day (first Sunday of May): flowers for both mothers' },
    { name: 'Szent István napja', m: 8, d: 20, note: 'fireworks over the Danube' },
    { name: 'Szenteste', m: 12, d: 24, note: 'Christmas Eve, gifts from Jézuska, with family' },
    { name: 'Szilveszter', m: 12, d: 31, note: 'New Year\'s Eve parties book up early' },
  ],
  RO: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'a dinner and flowers' },
    { name: 'Dragobete', m: 2, d: 24, note: 'Romania\'s own lovers\' day: a date and a small gift' },
    { name: 'Mărțișor', m: 3, d: 1, note: 'a small charm on a red-and-white string for her, worn through March' },
    { name: 'Ziua Femeii', m: 3, d: 8, note: 'Women\'s Day: flowers for her, and for mothers' },
    { name: 'Ziua Mamei', m: 5, nth: [1, 0], note: 'Mother\'s Day (first Sunday of May): flowers for both mothers' },
    { name: 'Sânziene', m: 6, d: 24, note: 'midsummer: flower crowns and a night out' },
    { name: 'Revelion', m: 12, d: 31, note: 'New Year\'s Eve parties book up early' },
  ],
  KZ: [
    { name: "Valentine's Day", local: 'День святого Валентина', m: 2, d: 14, note: 'flowers and a dinner in the cities' },
    { name: "Women's Day", local: '8 Марта', m: 3, d: 8, note: 'a major flower day, for her and for mothers; often bigger than Feb 14' },
    { name: 'Nauryz', local: 'Наурыз', m: 3, d: 21, note: 'the spring new year (Mar 21 to 23): family, nauryz kozhe and visits' },
    { name: "New Year's Eve", local: 'Новый год', m: 12, d: 31, note: 'the big winter celebration, with gifts and family' },
  ],
  EG: [
    { name: "Valentine's Day", m: 2, d: 14, note: 'kept low-key and private: a quiet dinner or a gift' },
    { name: "Mother's Day", local: 'عيد الأم', m: 3, d: 21, note: 'huge: flowers and a visit for both mothers' },
    { name: 'Eid el-Hob', local: 'عيد الحب المصري', m: 11, d: 4, note: 'Egypt\'s own day of love: a dinner or a small gift' },
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

/** Love days in their country in the next days, soonest first, with what people there do. */
export function loveDaysSoon(country: string, today: LocalDate, within = 45): { name: string; local?: string; note: string; on: LocalDate; inDays: number }[] {
  const days = LOVE_DAYS[country];
  if (!days) return [];
  const soon: { name: string; local?: string; note: string; on: LocalDate; inDays: number }[] = [];
  for (const x of days) for (const y of [today.y, today.y + 1]) {
    const on = { y, m: x.m, d: x.d ?? nthWeekday(y, x.m, x.nth![0], x.nth![1]) };
    const inDays = daysBetween(today, on);
    if (inDays >= 0 && inDays <= within) { soon.push({ name: x.name, ...(x.local ? { local: x.local } : {}), note: x.note, on, inDays }); break; }
  }
  return soon.sort((a, b) => a.inDays - b.inDays);
}

/** Love days in their country in the next 45 days, soonest first, with what people there do. */
export function loveCalendar(country: string, today: LocalDate, within = 45): string | null {
  const soon = loveDaysSoon(country, today, within);
  return soon.length ? soon.map(x => `- ${x.name}, ${iso(x.on)} (${x.inDays === 0 ? 'today' : (x.inDays === 1 ? 'tomorrow' : `in ${x.inDays} days`)}): ${x.note}`).join('\n') : null;
}
