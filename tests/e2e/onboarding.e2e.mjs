// Onboarding: only a brand-new account sees it, every button works, and once finished it never comes back
// (not after a reload, not on another device). An account older than a day never sees it.
// Run after api.e2e.test.mjs. Needs psql to add the new account (PGHOST_DIR, default /var/tmp/belluh-pg).
import { chromium } from 'playwright';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
const OUT = process.argv[2], APP = 'http://localhost:4175', SECRET = 'belluh-local-test-secret-0123456789abcdef';
const PG = process.env.PGHOST_DIR || '/var/tmp/belluh-pg';
const jwt = (sub, email) => { const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role: 'authenticated', sub, email, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const session = (sub, email, created_at = new Date().toISOString()) => JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, created_at, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const R = []; const check = (n, ok, d = '') => R.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch();
const errs = [];
const open = async (sub, email, created_at) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'America/New_York' });
  await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); }, [session(sub, email, created_at)]);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP); await p.waitForTimeout(4500); return p;
};
const onboarding = async (p) => /kept between you/.test(await p.locator('body').innerText()) && await p.getByRole('button', { name: 'Begin' }).count() === 1;

// An old account with no partner, no entries and no onboarding finished still goes straight in
const oldId = crypto.randomUUID();
execSync(`psql -h ${PG} -p 54329 -U postgres -d belluh -q -c "insert into auth.users (id, email) values ('${oldId}', 'old-${oldId.slice(0, 6)}@test.com')"`);
const old = await open(oldId, `old-${oldId.slice(0, 6)}@test.com`, '2025-03-01T12:00:00Z');
check('an existing account never sees onboarding', !(await onboarding(old)));

// A brand-new account
const id = crypto.randomUUID(), email = `new-${id.slice(0, 6)}@test.com`;
execSync(`psql -h ${PG} -p 54329 -U postgres -d belluh -q -c "insert into auth.users (id, email) values ('${id}', '${email}')"`);
const p = await open(id, email);
check('a new account sees onboarding', await onboarding(p));
await p.getByRole('button', { name: 'Begin' }).click(); await p.waitForTimeout(800);
await p.getByPlaceholder('Name or nickname').fill('Sam');
await p.getByRole('button', { name: 'Continue' }).click(); await p.waitForTimeout(3500);
await p.locator('textarea').fill('She left a note in my coat pocket.');
await p.getByRole('button', { name: 'Keep it' }).click(); await p.waitForTimeout(2500);
check('the first words are kept and shown back', (await p.locator('body').innerText()).includes('She left a note in my coat pocket.'));
await p.getByRole('button', { name: 'Continue' }).click(); await p.waitForTimeout(800);
await p.getByRole('button', { name: /Send Sam your link/ }).click(); await p.waitForTimeout(1500);
const link = (await p.locator('.select-all').allInnerTexts()).join('');
check('inviting gives a one-time link that works for new accounts', /\?invite=[A-Za-z0-9_-]{16,}/.test(link), link);
await p.screenshot({ path: `${OUT}/onboarding-invite.png` });
await p.getByRole('button', { name: /Start writing/ }).click(); await p.waitForTimeout(4000);
const home = await p.locator('body').innerText();
check('finishing opens the journal with the first entry in it', !(await onboarding(p)) && home.includes('She left a note in my coat pocket.'));
await p.reload(); await p.waitForTimeout(4500);
check('it does not come back after a reload', !(await onboarding(p)));
const other = await open(id, email);
check('it does not come back on another device', !(await onboarding(other)));

// Skip works even on the last step with nothing sent
const id2 = crypto.randomUUID(), email2 = `skip-${id2.slice(0, 6)}@test.com`;
execSync(`psql -h ${PG} -p 54329 -U postgres -d belluh -q -c "insert into auth.users (id, email) values ('${id2}', '${email2}')"`);
const q = await open(id2, email2);
await q.getByRole('button', { name: 'Begin' }).click(); await q.waitForTimeout(800);
await q.getByPlaceholder('Name or nickname').fill('Alex');
await q.getByRole('button', { name: 'Continue' }).click(); await q.waitForTimeout(3500);
await q.locator('textarea').fill('Pancakes on a Tuesday.');
await q.getByRole('button', { name: 'Keep it' }).click(); await q.waitForTimeout(2500);
await q.getByRole('button', { name: 'Continue' }).click(); await q.waitForTimeout(800);
await q.getByRole('button', { name: 'Skip for now' }).click(); await q.waitForTimeout(4000);
check('Skip for now opens the journal', !(await onboarding(q)));
check('No JavaScript errors', errs.length === 0, errs.slice(0, 2).join(' / '));
console.log(R.join('\n')); await b.close();
