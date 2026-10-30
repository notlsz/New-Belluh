// Strings for one part of the app, kept next to its translations: English first, then each language, then the
// countries that write a language their own way (Mexico's Spanish, Portugal's Portuguese). Anything missing falls back
// to the language, then to English, so a gap never shows a raw key. Pure, so it's unit-tested.
import type { Lang, Country } from './core.ts';

export type UiTable<T> = { en: T } & Partial<Record<Exclude<Lang, 'en'> | 'es-MX' | 'pt-PT', Partial<T>>>;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function over(base: any, top: any): any {
  if (Array.isArray(base)) return Array.isArray(top) && top.length === base.length ? top : base;
  if (isObj(base)) { const o: any = {}; for (const k of Object.keys(base)) o[k] = over(base[k], isObj(top) ? top[k] : undefined); return o; }
  return typeof top === 'string' && top.trim() ? top : base;
}

export function pickUi<T>(t: UiTable<T>, lang: Lang, country: Country): T {
  let out: T = t.en;
  if (lang !== 'en') out = over(out, (t as any)[lang]);
  const variant = (t as any)[`${lang}-${country}`];
  if (variant) out = over(out, variant);
  return out;
}
