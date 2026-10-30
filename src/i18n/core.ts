// Belluh's language logic, without React, so it's unit-tested in Node: who the reader is, which words and formats.
import en, { type Dict } from './en.ts';
import ja from './ja.ts';
import fr from './fr.ts';
import it from './it.ts';
import pt from './pt.ts';
import zh from './zh.ts';
import de from './de.ts';

export type Lang = 'en' | 'ja' | 'fr' | 'it' | 'pt' | 'zh' | 'de';
export type Country = 'US' | 'GB' | 'CA' | 'AU' | 'JP' | 'FR' | 'IT' | 'BR' | 'CN' | 'CH' | 'OTHER';

const DICTS: Record<Lang, Dict> = { en, ja, fr, it, pt, zh, de };
export const LANGS: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' }, { id: 'ja', name: '日本語' }, { id: 'fr', name: 'Français' }, { id: 'it', name: 'Italiano' },
  { id: 'pt', name: 'Português' }, { id: 'zh', name: '简体中文' }, { id: 'de', name: 'Deutsch' },
];

const TZ_COUNTRY: [RegExp, Country][] = [
  [/^Asia\/Tokyo$/, 'JP'], [/^Europe\/Paris$/, 'FR'], [/^Europe\/Rome$/, 'IT'], [/^Europe\/Zurich$/, 'CH'], [/^Europe\/(London|Belfast)$/, 'GB'],
  [/^America\/(Sao_Paulo|Fortaleza|Recife|Bahia|Manaus|Belem)$/, 'BR'], [/^Asia\/(Shanghai|Chongqing|Harbin|Urumqi)$/, 'CN'],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal)$/, 'CA'], [/^Australia\//, 'AU'],
  [/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky|North_Dakota)|Pacific\/Honolulu)/, 'US'],
];

/** Where they are and what they read, from the browser. Pure, so it's unit-tested. */
export function detect(languages: readonly string[], timeZone: string): { lang: Lang; country: Country } {
  const tzCountry = TZ_COUNTRY.find(([re]) => re.test(timeZone))?.[1];
  const first = (languages[0] || 'en').toLowerCase();
  const region = (first.split('-')[1] || '').toUpperCase();
  const country: Country = tzCountry ?? (['US', 'GB', 'CA', 'AU', 'JP', 'FR', 'IT', 'BR', 'CN', 'CH'].includes(region) ? region as Country : 'OTHER');
  // The first browser language Belluh speaks wins; Chinese only when it's simplified (mainland)
  for (const l of languages.map(x => x.toLowerCase())) {
    const base = l.split('-')[0];
    if (base === 'zh') { if (!/-(tw|hk|mo|hant)/.test(l)) return { lang: 'zh', country }; continue; }
    if (base === 'en' || base === 'ja' || base === 'fr' || base === 'it' || base === 'pt' || base === 'de') return { lang: base as Lang, country };
  }
  const byCountry: Partial<Record<Country, Lang>> = { JP: 'ja', FR: 'fr', IT: 'it', BR: 'pt', CN: 'zh', CH: 'de' };
  return { lang: byCountry[country] ?? 'en', country };
}

/** BCP 47 tag for dates and numbers: en-GB writes 30 October, de-CH writes 30.10., ja-JP writes 10月30日. */
export function localeTag(lang: Lang, country: Country): string {
  const c = country === 'OTHER' ? '' : country;
  const fallback: Record<Lang, string> = { en: 'en-US', ja: 'ja-JP', fr: 'fr-FR', it: 'it-IT', pt: 'pt-BR', zh: 'zh-CN', de: 'de-CH' };
  if (!c) return fallback[lang];
  const tag = `${lang}-${c}`;
  try { return Intl.DateTimeFormat.supportedLocalesOf([tag]).length ? tag : fallback[lang]; } catch { return fallback[lang]; }
}

// British, Australian and Canadian English spell some words differently
const COMMONWEALTH: [RegExp, string][] = [[/\bfavorite/g, 'favourite'], [/\bFavorite/g, 'Favourite'], [/\bcolor/g, 'colour'], [/\bcenter/g, 'centre'], [/\bpersonalized/g, 'personalised'], [/\borganiz/g, 'organis']];
// Who texts on what: the apps named on the page, most used there first
export const TEXT_APPS: Partial<Record<Country, string>> = {
  GB: 'WhatsApp, iMessage or SMS', CA: 'iMessage, WhatsApp or SMS', AU: 'iMessage, WhatsApp or SMS', JP: 'LINE, iMessage or WhatsApp', FR: 'WhatsApp, iMessage or SMS',
  IT: 'WhatsApp, iMessage or SMS', BR: 'WhatsApp, iMessage or SMS', CN: 'iMessage or SMS', CH: 'WhatsApp, iMessage or SMS',
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** A translation with anything it's missing filled from English, so a gap never shows a raw key. */
function merged(base: any, over: any): any {
  if (Array.isArray(base)) return Array.isArray(over) && over.length ? over : base;
  if (isObj(base)) { const out: any = {}; for (const k of Object.keys(base)) out[k] = merged(base[k], isObj(over) ? over[k] : undefined); return out; }
  return typeof over === 'string' && over.trim() ? over : base;
}
function respell(v: any): any {
  if (typeof v === 'string') return COMMONWEALTH.reduce((s, [re, to]) => s.replace(re, to), v);
  if (Array.isArray(v)) return v.map(respell);
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, respell(x)]));
  return v;
}

export function dictFor(lang: Lang, country: Country): Dict {
  let d: Dict = lang === 'en' ? en : merged(en, DICTS[lang]);
  if (lang === 'en' && (country === 'GB' || country === 'AU' || country === 'CA')) d = respell(d);
  return d;
}

/** The daily question in the reader's language. Answers are saved under the English question, so partners who read
 *  Belluh in different languages still answer the same question and unlock each other's answer. */
export function localQuestion(d: Dict, englishQuestion: string): string {
  const i = en.app.daily.indexOf(englishQuestion);
  return i >= 0 ? d.app.daily[i] ?? englishQuestion : englishQuestion;
}

/** Fills {words} in a string. */
export const fill = (s: string, vars: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

