import test from 'node:test';
import assert from 'node:assert/strict';
import { detect, localeTag, dictFor, fill, localQuestion } from '../src/i18n/core.ts';
import en from '../src/i18n/en.ts';

const LANGS = ['ja', 'fr', 'it', 'pt', 'zh', 'de'] as const;

test('Detects the reader: language first, then where they are', () => {
  assert.deepEqual(detect(['ja-JP', 'en'], 'Asia/Tokyo'), { lang: 'ja', country: 'JP' });
  assert.deepEqual(detect(['fr-FR'], 'Europe/Paris'), { lang: 'fr', country: 'FR' });
  assert.deepEqual(detect(['it-IT'], 'Europe/Rome'), { lang: 'it', country: 'IT' });
  assert.deepEqual(detect(['pt-BR'], 'America/Sao_Paulo'), { lang: 'pt', country: 'BR' });
  assert.deepEqual(detect(['zh-CN'], 'Asia/Shanghai'), { lang: 'zh', country: 'CN' });
  assert.deepEqual(detect(['de-CH'], 'Europe/Zurich'), { lang: 'de', country: 'CH' });
  assert.deepEqual(detect(['fr-CH'], 'Europe/Zurich'), { lang: 'fr', country: 'CH' }, 'Geneva reads French');
  assert.deepEqual(detect(['en-GB'], 'Europe/London'), { lang: 'en', country: 'GB' });
  assert.deepEqual(detect(['fr-CA'], 'America/Toronto'), { lang: 'fr', country: 'CA' }, 'Quebec');
  assert.deepEqual(detect(['en-AU'], 'Australia/Sydney'), { lang: 'en', country: 'AU' });
  assert.deepEqual(detect(['en-US'], 'America/Chicago'), { lang: 'en', country: 'US' });
  assert.equal(detect(['zh-TW', 'en'], 'Asia/Taipei').lang, 'en', 'traditional Chinese readers are not shown simplified');
  assert.equal(detect(['es-ES'], 'Asia/Tokyo').lang, 'ja', 'a language Belluh lacks falls to the country');
  assert.equal(detect(['es-ES'], 'Europe/Madrid').lang, 'en');
});

test('Local formats: dates and numbers the way they are written there', () => {
  assert.equal(localeTag('en', 'GB'), 'en-GB');
  assert.equal(localeTag('de', 'CH'), 'de-CH');
  assert.equal(localeTag('fr', 'CA'), 'fr-CA');
  assert.equal(localeTag('ja', 'OTHER'), 'ja-JP');
  const d = new Date(2026, 9, 30);
  assert.match(d.toLocaleDateString(localeTag('en', 'GB'), { day: 'numeric', month: 'long' }), /^30 October$/);
  assert.match(d.toLocaleDateString(localeTag('en', 'US'), { day: 'numeric', month: 'long' }), /^October 30$/);
});

test('British, Australian and Canadian spelling', () => {
  assert.match(dictFor('en', 'GB').gift.occasions[5].note, /favourite/);
  assert.match(dictFor('en', 'AU').gift.occasions[5].note, /favourite/);
  assert.match(dictFor('en', 'US').gift.occasions[5].note, /favorite/);
});

const walk = (o: any, path = ''): [string, string][] => typeof o === 'string' ? [[path, o]] : Array.isArray(o) ? o.flatMap((x, i) => walk(x, `${path}[${i}]`)) : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => walk(v, path ? `${path}.${k}` : k)) : [];
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

test('Every translation keeps the placeholders, and never uses em dashes or bullet dots', () => {
  const base = Object.fromEntries(walk(en));
  for (const l of LANGS) {
    const d = dictFor(l, 'OTHER');
    for (const [path, s] of walk(d)) {
      assert.ok(!/[—•·]/.test(s), `${l} ${path}: ${s}`);
      if (path in base && !/\.ask$|\.couple|\.askLang/.test(path)) assert.equal(holes(s), holes(base[path]), `${l} ${path}`);
    }
  }
});

test('Each language is really written in it: most strings differ from English', () => {
  const base = walk(en);
  for (const l of LANGS) {
    const d = Object.fromEntries(walk(dictFor(l, 'OTHER')));
    const same = base.filter(([p, s]) => s.length > 12 && !/\.ask$|\.city$|\.via$|scenes\.\w+\.steps\[\d\]\.detail|\.gloss$/.test(p) && d[p] === s);
    assert.ok(same.length <= 8, `${l}: ${same.length} untranslated, e.g. ${same.slice(0, 3).map(x => x[0]).join(', ')}`);
  }
});

test('The daily question shows in their language but is saved in English, so partners still match', () => {
  const q = en.app.daily[2];
  assert.notEqual(localQuestion(dictFor('ja', 'JP'), q), q);
  assert.equal(localQuestion(dictFor('en', 'US'), q), q);
  assert.equal(localQuestion(dictFor('fr', 'FR'), 'An old custom prompt'), 'An old custom prompt');
  for (const l of LANGS) assert.equal(dictFor(l, 'OTHER').app.daily.length, en.app.daily.length, l);
});

test('fill leaves unknown words alone', () => {
  assert.equal(fill('Hi {name}, {x}', { name: 'Yui' }), 'Hi Yui, {x}');
});
