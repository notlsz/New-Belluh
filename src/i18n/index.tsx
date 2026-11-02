// Belluh speaks the language of where you live and feels local there: the words, the sample couple's names, the
// stories, the apps you text on, how dates and times are written. Detected from the browser (language first, then time
// zone); anyone can switch in the footer, and the choice is remembered on this device.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en, { type Dict } from './en';
import { detect, localeTag, dictFor, fill, TEXT_APPS, type Lang, type Country } from './core';
import { pickUi, type UiTable } from './ui';
import { canStore } from '../lib/consent';

export { LANGS, detect, localeTag, dictFor, fill, localQuestion } from './core';
export type { Lang, Country } from './core';

const DICT_IDS: Lang[] = ['en', 'ja', 'fr', 'it', 'pt', 'zh', 'de', 'es', 'ko'];

interface I18n {
  lang: Lang; country: Country; tag: string; d: Dict; textApps: string;
  f: (s: string, vars?: Record<string, string | number>) => string;
  date: (d: Date, o: Intl.DateTimeFormatOptions) => string;
  num: (n: number) => string;
  setLang: (l: Lang) => void;
}
const Ctx = createContext<I18n | null>(null);
const STORE = 'belluh_lang';

function initial(): { lang: Lang; country: Country } {
  let langs: readonly string[] = ['en-US'], tz = '';
  try { langs = navigator.languages?.length ? navigator.languages : [navigator.language]; tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { /* defaults */ }
  const found = detect(langs, tz);
  try { const saved = localStorage.getItem(STORE) as Lang | null; if (saved && DICT_IDS.includes(saved)) return { ...found, lang: saved }; } catch { /* storage off */ }
  return found;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [{ lang, country }, setState] = useState(initial);
  const value = useMemo<I18n>(() => {
    const d = dictFor(lang, country);
    const tag = localeTag(lang, country);
    return {
      lang, country, tag, d,
      textApps: lang === 'en' ? TEXT_APPS[country] ?? d.textApps : d.textApps,
      f: fill,
      date: (x, o) => { try { return x.toLocaleDateString(tag, o); } catch { return x.toLocaleDateString('en-US', o); } },
      num: n => { try { return n.toLocaleString(tag); } catch { return String(n); } },
      // Remembered on this device only if they allow preference storage (Privacy choices)
      setLang: (l) => { if (canStore('preferences')) { try { localStorage.setItem(STORE, l); } catch { /* storage off */ } } setState(s => ({ ...s, lang: l })); },
    };
  }, [lang, country]);
  useEffect(() => {
    try { document.documentElement.lang = value.tag; } catch { /* no document */ }
    // Tell Bella, so the reminders and nudges she sends on her own come in this language too
    import('../services/belluhAgent').then(m => m.belluhAgent.saveLanguage()).catch(() => {});
  }, [value.tag]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/** The words and formats for where the reader lives. Works without a provider too (English, US), e.g. in tests. */
export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (v) return v;
  return { lang: 'en', country: 'US', tag: 'en-US', d: en, textApps: en.textApps, f: fill, date: (x, o) => x.toLocaleDateString('en-US', o), num: n => n.toLocaleString('en-US'), setLang: () => {} };
}

/** A part of the app's own strings (src/i18n/ui/*.ts) in the reader's language and their country's way of writing it. */
export function useUi<T>(table: UiTable<T>): T {
  const { lang, country } = useI18n();
  return useMemo(() => pickUi(table, lang, country), [table, lang, country]);
}
export type { UiTable };
