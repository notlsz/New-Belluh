// Reading a search the way Rollup does: the dates, media and places it names become filters, and what is left
// (`visualText`) is matched against what photos show and say. Runs on the device; pure, so it's unit-tested.
// Dates are compared as local calendar days (YYYY-MM-DD) of when each photo was taken, where it was taken.

import type { MediaType, SearchPlan } from './types.ts';

export interface KnownPlaces {
  /** Names the index knows, lowercased → how they match */
  cities: string[]; neighborhoods: string[]; metros: string[]; countries: string[];
  venues: string[]; cuisines: string[];
  /** Venue kinds the index holds (cafe, museum, ...) */
  kinds: string[];
}

export interface PlanX extends SearchPlan {
  /** Every range the date part means ("Christmas" is one range a year); dateRange is the single one when there is one */
  dateRanges?: { from: string; to: string }[];
  holiday?: string | null;
  /** Places that filter (cities, neighborhoods, metros, countries, venues) */
  placeFilters?: string[];
  /** Kinds of place and cuisines: they lift results, they don't filter */
  placeKinds?: string[];
  /** Quoted words: matched as text in images */
  quoted?: string | null;
  /** "how many ... days": count days, not photos */
  countUnit?: 'photos' | 'days' | null;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MON3 = MONTHS.map(m => m.slice(0, 3));
const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (y: number, m: number, d: number) => { const t = new Date(Date.UTC(y, m - 1, d)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const monthRange = (y: number, m: number) => ({ from: ymd(y, m, 1), to: ymd(y, m, lastDay(y, m)) });

/** Wall-clock parts of "now" (the device's local time) */
export function wallNow(now: number) { const d = new Date(now); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), dow: d.getDay() }; }

// Northern-hemisphere meteorological seasons, as most people mean them
const SEASONS: Record<string, [number, number]> = { spring: [3, 5], summer: [6, 8], fall: [9, 11], autumn: [9, 11], winter: [12, 2] };
function seasonRange(name: string, y: number) {
  const [a, b] = SEASONS[name];
  return a <= b ? { from: ymd(y, a, 1), to: ymd(y, b, lastDay(y, b)) } : { from: ymd(y, a, 1), to: ymd(y + 1, b, lastDay(y + 1, b)) };
}

function easter(y: number): [number, number] {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return [Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1];
}
const nthWeekday = (y: number, m: number, dow: number, n: number) => { const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); return 1 + ((dow - first + 7) % 7) + (n - 1) * 7; };

// Holidays: each gives its range in a year. Ordered longest phrase first so "christmas eve" wins over "christmas".
const HOLIDAYS: [RegExp, string, (y: number) => { from: string; to: string }][] = [
  [/\bnew year'?s eve\b/, "New Year's Eve", y => ({ from: ymd(y, 12, 31), to: ymd(y, 12, 31) })],
  [/\bnew year'?s( day)?\b|\bnew year\b/, "New Year", y => ({ from: ymd(y - 1, 12, 31), to: ymd(y, 1, 1) })],
  [/\bchristmas eve\b/, 'Christmas Eve', y => ({ from: ymd(y, 12, 24), to: ymd(y, 12, 24) })],
  [/\b(christmas|xmas)\b/, 'Christmas', y => ({ from: ymd(y, 12, 24), to: ymd(y, 12, 26) })],
  [/\bvalentine'?s( day)?\b/, "Valentine's Day", y => ({ from: ymd(y, 2, 14), to: ymd(y, 2, 14) })],
  [/\bhalloween\b/, 'Halloween', y => ({ from: ymd(y, 10, 31), to: ymd(y, 10, 31) })],
  [/\bthanksgiving\b/, 'Thanksgiving', y => { const d = nthWeekday(y, 11, 4, 4); return { from: ymd(y, 11, d), to: ymd(y, 11, d + 3) }; }],
  [/\b(fourth of july|4th of july|july 4th|independence day)\b/, 'Fourth of July', y => ({ from: ymd(y, 7, 4), to: ymd(y, 7, 4) })],
  [/\beaster\b/, 'Easter', y => { const [m, d] = easter(y); return { from: ymd(y, m, d - 2 > 0 ? d - 2 : d), to: ymd(y, m, d) }; }],
  [/\bmother'?s day\b/, "Mother's Day", y => { const d = nthWeekday(y, 5, 0, 2); return { from: ymd(y, 5, d), to: ymd(y, 5, d) }; }],
];

const MEDIA: [RegExp, MediaType][] = [
  [/\b(videos?|clips?|movies i (took|filmed))\b/, 'video'],
  [/\b(screenshots?|screen ?shots?|screen ?caps?)\b/, 'screenshot'],
];

// Words that carry no visual meaning once dates, media and places are read
const FILLER = new Set(('a an the of in at on from during my our we us i me you your with and or for to show find all any some photos photo pictures picture pics pic ' +
  'images image shots shot taken when where was were did do of there that this these those time times day days ever go went been have had ' +
  'how many much count number around near by while').split(' '));

/** Holiday occurrences that touch [fromYear, toYear] */
function holidayRanges(fn: (y: number) => { from: string; to: string }, years: number[]) { return years.map(fn); }

export interface ParseContext { now: number; known?: Partial<KnownPlaces>; years?: [number, number] }

export function parseQuery(query: string, ctx: ParseContext): PlanX {
  let q = ` ${query.toLowerCase().replace(/[’`]/g, "'").replace(/[?!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
  const now = wallNow(ctx.now);
  const [y0, y1] = ctx.years ?? [now.y - 30, now.y];
  const take = (re: RegExp) => { const m = q.match(re); if (m) q = q.replace(re, ' '); return m; };

  // Quoted words are text to read in images
  const qm = query.match(/["“]([^"”]+)["”]/);
  const quoted = qm ? qm[1].trim() : null;
  if (qm) q = q.replace(qm[0].toLowerCase(), ' ');

  const countM = take(/^\s*(how many|how often|count( of)?|number of)\b/);
  const operation: SearchPlan['operation'] = countM ? 'count' : 'search';
  let countUnit: PlanX['countUnit'] = null;
  if (operation === 'count') countUnit = /\b(days?|times?|visits?)\b/.test(q) ? 'days' : 'photos';

  let mediaType: MediaType | null = null;
  for (const [re, t] of MEDIA) if (take(re)) { mediaType = t; break; }

  let sort: SearchPlan['sort'] = 'relevance';
  if (take(/\b(latest|most recent|newest|recently|recent|last time)\b/)) sort = 'newest';
  else if (take(/\b(first time|first|oldest|earliest)\b/)) sort = 'oldest';

  // Dates
  let ranges: { from: string; to: string }[] = [];
  let holiday: string | null = null;
  const yearM = q.match(/\b(19[89]\d|20\d\d)\b/);
  const year = yearM ? +yearM[1] : null;
  for (const [re, name, fn] of HOLIDAYS) {
    if (!re.test(q)) continue;
    q = q.replace(re, ' ');
    holiday = name;
    const last = take(/\b(last|this past)\s*$/) || /\blast\s+$/.test(q);
    if (year) ranges = [fn(year)];
    else if (last || /\b(last|this)\b/.test(q)) {
      // the most recent one that has started
      let y = now.y; const today = ymd(now.y, now.m, now.d);
      if (fn(y).from > today) y--;
      ranges = [fn(y)];
      q = q.replace(/\b(last|this)\b/, ' ');
    } else {
      const ys: number[] = []; for (let y = y0; y <= y1 + 1; y++) ys.push(y);
      ranges = holidayRanges(fn, ys);
    }
    break;
  }
  if (!ranges.length) {
    const rel = q.match(/\b(last|this|past|previous)\s+(\d+\s+)?(day|week|month|year|spring|summer|fall|autumn|winter)s?\b/);
    const monthM = q.match(new RegExp(`\\b(${MONTHS.join('|')}|${MON3.join('|')})\\b`));
    const seasonM = q.match(/\b(spring|summer|fall|autumn|winter)\b/);
    const agoM = q.match(/\b(\d+|a|one|two|three|four|five)\s+(year|month|week)s?\s+ago\b/);
    const today = ymd(now.y, now.m, now.d);
    if (/\btoday\b/.test(q)) { ranges = [{ from: today, to: today }]; q = q.replace(/\btoday\b/, ' '); }
    else if (/\byesterday\b/.test(q)) { const t = ymd(now.y, now.m, now.d - 1); ranges = [{ from: t, to: t }]; q = q.replace(/\byesterday\b/, ' '); }
    else if (agoM) {
      const n = ({ a: 1, one: 1, two: 2, three: 3, four: 4, five: 5 } as Record<string, number>)[agoM[1]] ?? +agoM[1];
      const unit = agoM[2];
      if (unit === 'year') ranges = [{ from: ymd(now.y - n, 1, 1), to: ymd(now.y - n, 12, 31) }];
      else if (unit === 'month') { const d = new Date(Date.UTC(now.y, now.m - 1 - n, 1)); ranges = [monthRange(d.getUTCFullYear(), d.getUTCMonth() + 1)]; }
      else { const s = ymd(now.y, now.m, now.d - 7 * n - now.dow); ranges = [{ from: s, to: ymd(+s.slice(0, 4), +s.slice(5, 7), +s.slice(8, 10) + 6) }]; }
      q = q.replace(agoM[0], ' ');
    } else if (rel) {
      const [all, which, nStr, unit] = rel;
      const n = nStr ? +nStr.trim() : 1;
      if (unit in SEASONS) {
        // "last summer" is the most recent summer that has ended, or the one under way if it is "this summer"
        let y = now.y;
        if (which === 'this') { if (seasonRange(unit, y).from > today) y--; if (unit === 'winter' && now.m <= 2) y--; }
        else { while (seasonRange(unit, y).to >= today) y--; }
        ranges = [seasonRange(unit, y)];
      } else if (nStr || which === 'past') {
        const back = unit === 'day' ? ymd(now.y, now.m, now.d - n) : unit === 'week' ? ymd(now.y, now.m, now.d - 7 * n) : unit === 'month' ? ymd(now.y, now.m - n, now.d) : ymd(now.y - n, now.m, now.d);
        ranges = [{ from: back, to: today }];
      } else if (unit === 'day') { const t = ymd(now.y, now.m, now.d - (which === 'this' ? 0 : 1)); ranges = [{ from: t, to: t }]; }
      else if (unit === 'week') {
        const mon = now.d - ((now.dow + 6) % 7) - (which === 'this' ? 0 : 7);
        ranges = [{ from: ymd(now.y, now.m, mon), to: ymd(now.y, now.m, mon + 6) }];
      } else if (unit === 'month') { const d = new Date(Date.UTC(now.y, now.m - 1 - (which === 'this' ? 0 : 1), 1)); ranges = [monthRange(d.getUTCFullYear(), d.getUTCMonth() + 1)]; }
      else { const y = now.y - (which === 'this' ? 0 : 1); ranges = [{ from: ymd(y, 1, 1), to: ymd(y, 12, 31) }]; }
      q = q.replace(all, ' ');
    } else if (monthM) {
      const m = (MONTHS.indexOf(monthM[1]) >= 0 ? MONTHS.indexOf(monthM[1]) : MON3.indexOf(monthM[1])) + 1;
      // "march" alone is a word only in some places ("may" too): take it as a month when a date word sits with it
      const isMonth = !(monthM[1] === 'may' || monthM[1] === 'mar') || year != null || /\b(in|during|of|last|this)\s+(may|mar)\b/.test(q);
      if (isMonth) {
        const dayM = q.match(new RegExp(`\\b${monthM[1]}\\s+(\\d{1,2})(st|nd|rd|th)?\\b|\\b(\\d{1,2})(st|nd|rd|th)?\\s+(of\\s+)?${monthM[1]}\\b`));
        const dd = dayM ? +(dayM[1] ?? dayM[3]) : null;
        let y = year ?? now.y;
        if (year == null && (m > now.m || (m === now.m && dd != null && dd > now.d))) y--;   // "in March" is the last March
        ranges = dd ? [{ from: ymd(y, m, dd), to: ymd(y, m, dd) }] : [monthRange(y, m)];
        if (dayM) q = q.replace(dayM[0], ' ');
        q = q.replace(new RegExp(`\\b(last|this)?\\s*${monthM[1]}\\b`), ' ');
      }
    } else if (seasonM) {
      let y = year ?? now.y;
      if (year == null && seasonRange(seasonM[1], y).from > today) y--;
      ranges = [seasonRange(seasonM[1], y)];
      q = q.replace(seasonM[0], ' ');
    }
    if (!ranges.length && year != null) ranges = [{ from: ymd(year, 1, 1), to: ymd(year, 12, 31) }];
  }
  if (year != null) q = q.replace(new RegExp(`\\b${year}\\b`), ' ');

  // Places the index knows, longest names first so "new york" wins over "york"
  const placeFilters: string[] = [], placeKinds: string[] = [];
  const k = ctx.known ?? {};
  const filterNames = [...(k.venues ?? []), ...(k.neighborhoods ?? []), ...(k.cities ?? []), ...(k.metros ?? []), ...(k.countries ?? [])]
    .filter(n => n && n.length >= 2).sort((a, b) => b.length - a.length);
  for (const name of filterNames) {
    const re = new RegExp(`(^|\\s)(in |at |from |around |near )?${esc(name.toLowerCase())}('s)?(?=\\s|$)`);
    if (re.test(q)) { placeFilters.push(name); q = q.replace(re, ' '); }
  }
  // Kinds of place and cuisines lift results but stay in the visual text: "ramen" is also what a photo shows
  const softNames = [...(k.kinds ?? []), ...(k.cuisines ?? [])].filter(Boolean);
  for (const name of softNames) {
    const words = name.toLowerCase().replace(/_/g, ' ');
    if (new RegExp(`(^|\\s)${esc(words)}s?(?=\\s|$)`).test(q)) placeKinds.push(name);
  }

  const visual = q.split(' ').filter(w => w && !FILLER.has(w) && !/^(last|this|past|next)$/.test(w)).join(' ').trim();
  const visualText = visual || null;
  const hasDate = ranges.length > 0, hasPlace = placeFilters.length > 0;
  const retrievalIntent: SearchPlan['retrievalIntent'] = quoted && !visualText ? 'text'
    : visualText && (hasDate || hasPlace || quoted) ? 'mixed'
    : visualText ? 'visual'
    : hasPlace ? (hasDate ? 'mixed' : 'place')
    : hasDate ? 'date' : 'visual';
  if (!visualText && !quoted && sort === 'relevance') sort = 'newest';
  return {
    operation, retrievalIntent,
    dateRange: ranges.length === 1 ? ranges[0] : null,
    dateRanges: ranges,
    holiday,
    places: [...placeFilters, ...placeKinds],
    placeFilters, placeKinds,
    mediaType,
    visualText,
    quoted,
    countUnit,
    sort,
  };
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Does a word list hold the needle, as spelled, with or without a trailing "s" (how Rollup matches text) */
export function textHas(hay: string, needle: string): { at: number; len: number } | null {
  const h = hay.toLowerCase(), n = needle.toLowerCase().trim();
  if (!n) return null;
  const words = n.split(/\s+/).map(w => esc(w.replace(/s$/, '')) + 's?').join('\\s+');
  const m = new RegExp(`(^|[^\\p{L}\\p{N}])(${words})(?=$|[^\\p{L}\\p{N}])`, 'u').exec(h);
  return m ? { at: m.index + m[1].length, len: m[2].length } : null;
}
