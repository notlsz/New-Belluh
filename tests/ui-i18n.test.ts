import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pickUi } from '../src/i18n/ui.ts';

const DIR = path.join(import.meta.dirname, '../src/i18n/ui');
const LANGS = ['ja', 'fr', 'it', 'pt', 'zh', 'de', 'es', 'ko'] as const;
const walk = (o: any, p = ''): [string, string][] => typeof o === 'string' ? [[p, o]] : Array.isArray(o) ? o.flatMap((x, i) => walk(x, `${p}[${i}]`)) : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => walk(v, p ? `${p}.${k}` : k)) : [];
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

test('Every part of the app is translated into every language, with its placeholders, and no em dashes or dots', async () => {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.ts')) : [];
  for (const f of files) {
    const table = (await import(path.join(DIR, f))).default;
    const base = Object.fromEntries(walk(table.en));
    for (const l of LANGS) {
      const own = Object.fromEntries(walk(table[l] ?? {}));
      const missing = Object.keys(base).filter(k => !(k in own));
      assert.equal(missing.length, 0, `${f} ${l} is missing ${missing.slice(0, 5).join(', ')}`);
      for (const [k, s] of Object.entries(own)) {
        assert.ok(!/[—•·]/.test(s), `${f} ${l} ${k}: ${s}`);
        if (k in base) assert.equal(holes(s), holes(base[k]), `${f} ${l} ${k}`);
      }
    }
    for (const v of ['es-MX', 'pt-PT']) {
      assert.ok(table[v], `${f} has no ${v}`);
      for (const [k, s] of walk(table[v])) { assert.ok(!/[—•·]/.test(s), `${f} ${v} ${k}`); if (k in base) assert.equal(holes(s), holes(base[k]), `${f} ${v} ${k}`); }
    }
    for (const [k, s] of Object.entries(base)) assert.ok(!/[—•·]/.test(s), `${f} en ${k}`);
  }
});

test('A country that writes a language its own way wins over the language, which wins over English', () => {
  const t = { en: { a: 'cell phone', b: 'Hi' }, pt: { a: 'celular', b: 'Oi' }, 'pt-PT': { a: 'telemóvel' } } as any;
  assert.deepEqual(pickUi(t, 'pt', 'PT'), { a: 'telemóvel', b: 'Oi' });
  assert.deepEqual(pickUi(t, 'pt', 'BR'), { a: 'celular', b: 'Oi' });
  assert.deepEqual(pickUi(t, 'ja', 'JP'), { a: 'cell phone', b: 'Hi' });
});
