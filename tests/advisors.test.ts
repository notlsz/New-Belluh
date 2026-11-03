// The live database's advisor fixes (supabase/migrations/20261103020000_advisor_hardening.sql). The migration was also
// run against Postgres 16 with tests/e2e/base.sql and every other migration (twice, to show it is safe to repeat);
// these checks keep its guarantees from being edited away.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const MIG = 'supabase/migrations/20261103020000_advisor_hardening.sql';
const sql = fs.readFileSync(path.join(ROOT, MIG), 'utf8');
const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');

test('Advisors: every public function gets a fixed search_path, extension functions left alone', () => {
  assert.match(code, /alter function %s set search_path = public, extensions/);
  assert.match(code, /c like 'search_path=%'/);
  assert.match(code, /d\.deptype = 'e'/);
});

test('Advisors: security definer trigger functions are not callable by anon or signed-in people', () => {
  assert.match(code, /p\.prosecdef and p\.prorettype = 'trigger'::regtype/);
  assert.match(code, /revoke execute on function %s from public, anon, authenticated/);
  // Never revokes from the service role, and never touches a function that is not a trigger
  assert.ok(!/service_role/.test(code));
});

test('Advisors: unindexed foreign keys get an index, only when none leads with that column', () => {
  assert.match(code, /c\.contype = 'f'/);
  assert.match(code, /not exists \(select 1 from pg_index i where i\.indrelid = c\.conrelid and i\.indkey\[0\] = c\.conkey\[1\]\)/);
  assert.match(code, /create index if not exists %I/);
  assert.match(code, /left\(k\.tname \|\| '_' \|\| k\.col \|\| '_fk', 63\)/);
});

test('Advisors: the migration is new, not an edit of an applied one, and changes no data', () => {
  const files = fs.readdirSync(path.join(ROOT, 'supabase/migrations')).sort();
  assert.equal(files[files.length - 1], path.basename(MIG));
  assert.ok(!/\b(insert into|update public\.|delete from|truncate|drop table|drop policy)\b/i.test(code));
});
