// The dating apps couples met on, and which of them Belluh can read. No dating app offers an API to a person's matches
// or chats; what exists is each app's "download my data" export (GDPR, CCPA) and the screenshots on the phone. The
// research behind every line (owners, rankings, export steps and formats, sources) is docs/growth/research/dating-apps.md.
// Names only: no brand logos are fetched or shown, each app is its name in text beside a generic 3D emoji.
// Pure, so it's unit-tested.

/**
 * How Belluh reads an app's export:
 * - tinder, hinge: a parser for the format, checked against public parsers of real exports (see the research file)
 * - generic: the app sends a data export, but its format isn't verified; Belluh tries any JSON in it, and if nothing
 *   reads, offers screenshots
 * - none: no self-serve export Belluh can use (most Chinese, Korean and Japanese apps, video-chat apps): screenshots
 */
export type ExportKind = 'tinder' | 'hinge' | 'generic' | 'none';

export interface DatingApp {
  id: string;
  /** The name people know it by where it's used (native script for local apps) */
  name: string;
  owner: string;
  export: ExportKind;
  /** The official help page for the data export, when there is one */
  help?: string;
  /** Using it says something about sexuality: the name is never saved unless the person shows it */
  sensitive?: boolean;
  /** How to recognise it in a screenshot's text */
  marks: RegExp;
}

const a = (id: string, name: string, owner: string, exp: ExportKind, marks: RegExp, more: Partial<DatingApp> = {}): DatingApp => ({ id, name, owner, export: exp, marks, ...more });

export const DATING_APPS: DatingApp[] = [
  // The ten most downloaded worldwide in 2025 (AppTweak)
  a('tinder', 'Tinder', 'Match Group', 'tinder', /\btinder\b/i, { help: 'https://www.help.tinder.com/hc/en-gb/articles/115005626726-How-do-I-request-a-copy-of-my-personal-data' }),
  a('bumble', 'Bumble', 'Bumble Inc.', 'generic', /\bbumble\b/i, { help: 'https://support.bumble.com/hc/en-us/articles/28783199493917-Requesting-your-data' }),
  a('hinge', 'Hinge', 'Match Group', 'hinge', /\bhinge\b|\bwe met\b/i, { help: 'https://help.hinge.co/hc/en-us/articles/360011235813-How-do-I-request-a-copy-of-my-personal-data' }),
  a('badoo', 'Badoo', 'Bumble Inc.', 'generic', /\bbadoo\b/i),
  a('boo', 'Boo', 'Boo Enterprises', 'none', /\bboo\b(?! ?bear)/i),
  a('omi', 'Omi', 'MatchUp UK', 'none', /\bomi\b/i),
  a('ihappy', 'iHappy', 'ihappydate', 'none', /\bihappy\b/i),
  a('happn', 'happn', 'happn', 'generic', /\bhappn\b|\bcrushtime\b/i),
  a('grindr', 'Grindr', 'Grindr Inc.', 'generic', /\bgrindr\b/i, { sensitive: true, help: 'https://help.grindr.com/hc/en-us/articles/1500005257961-Accessing-your-personal-data' }),
  a('kismia', 'Kismia', 'Kismia Group', 'none', /\bkismia\b/i),
  // China
  a('momo', '陌陌', 'Hello Group', 'none', /陌陌|\bmomo\b/i),
  a('soul', 'Soul', 'Soulgate', 'none', /\bsoul\s?app\b|灵魂匹配|\bsoul\b/i),
  a('tantan', '探探', 'Hello Group', 'none', /探探|\btantan\b/i),
  a('blued', 'Blued', 'Newborn Town', 'none', /\bblued\b/i, { sensitive: true }),
  a('qingteng', '青藤之恋', 'unverified', 'none', /青藤之恋/),
  // Japan
  a('pairs', 'Pairs', 'Eureka (Match Group)', 'none', /\bpairs\b|ペアーズ/i),
  a('tapple', 'タップル', 'タップル (CyberAgent)', 'none', /タップル|\btapple\b/i),
  a('with', 'with', 'with', 'none', /(?:^|\s)with(?:\s|$)(?=.*(マッチング|いいね))/is),
  a('zexy', 'ゼクシィ縁結び', 'Recruit', 'none', /ゼクシィ縁結び/),
  a('omiai', 'Omiai', 'Enito', 'none', /\bomiai\b/i),
  // Korea
  a('wippy', '위피', 'Wippy', 'none', /위피|\bwippy\b/i),
  a('glam', '글램', 'unverified', 'none', /글램/),
  a('noondate', '정오의데이트', 'unverified', 'none', /정오의\s?데이트/),
  // Europe, the Americas, Asia
  a('azar', 'Azar', 'Hyperconnect (Match Group)', 'none', /\bazar\b/i),
  a('meetic', 'Meetic', 'Match Group', 'generic', /\bmeetic\b/i),
  a('snoggle', 'Snoggle', 'Joy Media', 'none', /\bsnoggle\b/i),
  a('lovoo', 'LOVOO', 'ParshipMeet', 'generic', /\blovoo\b/i),
  a('once', 'Once', 'Once', 'none', /\bonce\b(?=.*match)/is),
  a('breeze', 'Breeze', 'Breeze', 'none', /\bbreeze\b/i),
  a('duet', 'Duet', 'unverified', 'none', /\bduet\b/i),
  a('cmb', 'Coffee Meets Bagel', 'Coffee Meets Bagel', 'generic', /coffee meets bagel|\bcmb\b/i),
  a('okcupid', 'OkCupid', 'Match Group', 'generic', /\bokcupid\b/i),
  a('quackquack', 'QuackQuack', 'QuackQuack', 'none', /quack ?quack/i),
  a('aisle', 'Aisle', 'Info Edge', 'none', /\baisle\b/i),
  a('muzz', 'Muzz', 'Muzz', 'none', /\bmuzz\b/i),
  a('her', 'HER', 'HER', 'none', /\bher app\b/i, { sensitive: true }),
];

export const appById = (id: string | null | undefined) => DATING_APPS.find(x => x.id === id) ?? null;

/**
 * The apps that matter where the reader lives, most active users first where the source gives them, from the sources in
 * the research file. Countries not listed see the worldwide list. Items marked † in the research are kept but are unverified there.
 */
export const LOCAL_DATING: Record<string, string[]> = {
  WORLD: ['tinder', 'bumble', 'hinge', 'badoo', 'boo', 'omi', 'ihappy', 'happn', 'grindr', 'kismia'],
  US: ['tinder', 'hinge', 'bumble', 'duet'],
  GB: ['tinder', 'hinge', 'breeze', 'azar'],
  FR: ['tinder', 'happn', 'hinge', 'meetic', 'azar'],
  DE: ['tinder', 'bumble', 'hinge', 'snoggle', 'azar'],
  KR: ['wippy', 'tinder', 'glam', 'noondate'],
  JP: ['pairs', 'tapple', 'with', 'tinder', 'zexy', 'omiai'],
  ES: ['tinder', 'bumble', 'hinge', 'azar'],
  CA: ['tinder', 'bumble', 'hinge'],
  IN: ['quackquack', 'tinder', 'bumble', 'aisle'],
  AU: ['tinder', 'hinge', 'bumble'],
  IT: ['tinder', 'hinge', 'azar', 'once'],
  BR: ['tinder', 'badoo', 'bumble'],
  AE: ['tinder', 'bumble', 'hinge', 'muzz'],
  NL: ['tinder', 'bumble', 'happn'],
  SG: ['tinder', 'cmb', 'bumble', 'okcupid', 'hinge'],
  CH: ['tinder', 'bumble', 'hinge', 'azar'],
  MX: ['tinder', 'bumble'],
  HK: ['tinder', 'cmb', 'tantan', 'bumble'],
  CN: ['momo', 'soul', 'tantan', 'blued', 'qingteng'],
};

/** Every app, the reader's own country's first, then the worldwide ten, then the rest by name */
export function appsFor(country: string | null | undefined): DatingApp[] {
  const local = LOCAL_DATING[String(country ?? '').toUpperCase()] ?? [];
  const order = [...new Set([...local, ...LOCAL_DATING.WORLD])];
  const first = order.map(appById).filter((x): x is DatingApp => !!x);
  const rest = DATING_APPS.filter(x => !order.includes(x.id)).sort((p, q) => p.name.localeCompare(q.name));
  return [...first, ...rest];
}

// Where the reader lives, as an ISO code, for the countries the list knows. The i18n layer decides the language from
// fewer countries; this reads the same signals (the time zone first, then the browser language's region).
const TZ_ISO: [RegExp, string][] = [
  [/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise)|^Pacific\/Honolulu$/, 'US'],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal)$/, 'CA'],
  [/^America\/(Mexico_City|Monterrey|Cancun|Tijuana|Merida|Chihuahua|Mazatlan|Hermosillo)$/, 'MX'],
  [/^America\/Sao_Paulo$|^America\/(Bahia|Fortaleza|Recife|Manaus|Belem)$/, 'BR'],
  [/^Europe\/London$/, 'GB'], [/^Europe\/Paris$/, 'FR'], [/^Europe\/Berlin$/, 'DE'], [/^Europe\/Madrid$/, 'ES'],
  [/^Europe\/Rome$/, 'IT'], [/^Europe\/Amsterdam$/, 'NL'], [/^Europe\/Zurich$/, 'CH'],
  [/^Asia\/Tokyo$/, 'JP'], [/^Asia\/Seoul$/, 'KR'], [/^Asia\/(Kolkata|Calcutta)$/, 'IN'], [/^Asia\/Dubai$/, 'AE'],
  [/^Asia\/Singapore$/, 'SG'], [/^Asia\/Hong_Kong$/, 'HK'], [/^Asia\/(Shanghai|Chongqing|Urumqi)$/, 'CN'],
  [/^Australia\//, 'AU'],
  // Where discreet mode is on by default (src/lib/discreet.ts): these see the worldwide list, with the app's name kept out
  [/^Asia\/Riyadh$/, 'SA'], [/^Asia\/(Kuala_Lumpur|Kuching)$/, 'MY'], [/^Asia\/(Jakarta|Makassar|Jayapura|Pontianak)$/, 'ID'],
  [/^Africa\/Cairo$/, 'EG'], [/^Asia\/Qatar$/, 'QA'], [/^Asia\/Kuwait$/, 'KW'], [/^Asia\/(Dhaka|Dacca)$/, 'BD'], [/^Asia\/Karachi$/, 'PK'],
  [/^Asia\/(Tashkent|Samarkand)$/, 'UZ'], [/^Africa\/Lagos$/, 'NG'], [/^Asia\/Muscat$/, 'OM'], [/^Africa\/Algiers$/, 'DZ'],
  [/^Africa\/Casablanca$/, 'MA'], [/^Asia\/Baghdad$/, 'IQ'], [/^Asia\/Colombo$/, 'LK'], [/^Africa\/Accra$/, 'GH'], [/^Africa\/Nairobi$/, 'KE'],
  [/^Africa\/Tunis$/, 'TN'], [/^America\/Jamaica$/, 'JM'], [/^Asia\/Beirut$/, 'LB'], [/^Asia\/Brunei$/, 'BN'],
];

export function datingCountry(languages: readonly string[], timeZone: string, fallback?: string | null): string {
  const tz = TZ_ISO.find(([re]) => re.test(timeZone))?.[1];
  if (tz) return tz;
  const region = String(languages[0] ?? '').split('-')[1]?.toUpperCase();
  if (region && /^[A-Z]{2}$/.test(region)) return region;
  return fallback && fallback !== 'OTHER' ? fallback : 'WORLD';
}

/** The reader's country from this browser */
export function browserDatingCountry(fallback?: string | null): string {
  let langs: readonly string[] = [], tz = '';
  try { langs = navigator.languages?.length ? navigator.languages : [navigator.language]; tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { /* defaults */ }
  return datingCountry(langs, tz, fallback);
}

/** The app a screenshot's text names, if any */
export function appInText(text: string, prefer: string[] = []): DatingApp | null {
  const t = String(text ?? '');
  const hits = DATING_APPS.filter(x => x.marks.test(t));
  if (!hits.length) return null;
  return hits.sort((p, q) => (prefer.indexOf(p.id) === -1 ? 99 : prefer.indexOf(p.id)) - (prefer.indexOf(q.id) === -1 ? 99 : prefer.indexOf(q.id)))[0];
}
