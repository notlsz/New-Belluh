// The login screen, end to end in a real browser: log in with email and password, see every old entry, log out,
// log in again (the second time must work too), and a wrong password says so. Uses the account seeded by
// seed-multi-partner.sql (four partners, chapters, a past chapter). Local test accounts only.
import { chromium } from 'playwright';
const OUT = process.argv[2], APP = 'http://localhost:4175', PASSWORD = process.env.TEST_PASSWORD || 'Belluh-test-1';
const R = []; const check = (n, ok, d = '') => R.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const logIn = async (pw = PASSWORD, wait = 5000) => {
  await p.goto(`${APP}/login`); await p.waitForTimeout(1500);
  await p.locator('input[type="email"]').fill('jimmy@test.com');
  await p.locator('input[type="password"]').fill(pw);
  await p.getByRole('button', { name: /^Log in/ }).click();
  await p.waitForTimeout(wait);
};
const ALL = ['First night we cooked together', 'Walked the long way home', 'She laughed at my terrible pun', 'We argued about the dishes', 'What made you smile today?', 'Voice note from the beach', 'Drop: thinking of you', 'Ana: our first winter together', 'Ana: he fixed my bike'];
const CARA = ['A new chapter, coffee with Cara', 'Cara and I painted the hallway', 'Cara: the hallway is blue now'];

await logIn('wrong-password', 1200);
const wrong = await p.locator('body').innerText();
check('a wrong password is refused, with a message', /invalid login credentials/i.test(wrong) && !wrong.includes('SHARED JOURNAL'), wrong.slice(0, 160).replace(/\n+/g, ' | '));
// One tap is enough: the journal opens from a single "Log in", fast, and the button shows it's working meanwhile
await p.goto(`${APP}/login`); await p.waitForTimeout(1500);
await p.locator('input[type="email"]').fill('jimmy@test.com');
await p.locator('input[type="password"]').fill(PASSWORD);
const t0 = Date.now();
await p.getByRole('button', { name: /^Log in/ }).click();
await p.waitForTimeout(150);
check('the button says it is opening your journal', /Opening your journal/.test(await p.locator('body').innerText()));
await p.getByText('Jimmy & Ana').first().waitFor({ timeout: 8000 });
check('one tap opens the journal', true, `${Date.now() - t0} ms`);
await p.waitForTimeout(2500);
check('photos fill in after the journal opens', await p.locator('img[src*="old.jpg"]').count() > 0);
let t = await p.locator('body').innerText();
check('logging in opens the journal', t.includes('Jimmy & Ana') && t.includes('SHARED JOURNAL'));
check('every old entry in the first chapter shows', ALL.every(x => t.includes(x)), ALL.filter(x => !t.includes(x)).join('; '));
check("other partners' entries stay in their own chapters", !t.includes('Bea: brunch with Eli') && !t.includes('Dee: game night') && !t.includes('Cara: the hallway'));
await p.screenshot({ path: `${OUT}/login-1-journal.png` });
await p.locator('h1').first().click(); await p.waitForTimeout(600);
await p.locator('div.absolute button', { hasText: 'Jimmy & Cara' }).click(); await p.waitForTimeout(1200);
t = await p.locator('body').innerText();
check("the chapter with Cara has its entries, including ones older apps tagged in capitals", CARA.every(x => t.includes(x)), CARA.filter(x => !t.includes(x)).join('; '));
await p.locator('h1').first().click(); await p.waitForTimeout(600);
await p.locator('div.absolute button', { hasText: 'My Constellation' }).click(); await p.waitForTimeout(1200);
t = await p.locator('body').innerText();
check('every moment, together, has all of them', [...ALL, ...CARA, 'Bea: brunch with Eli', 'Dee: game night'].every(x => t.includes(x)));
// Log out and back in: the second login must open the journal too
await p.locator('nav button[aria-label="Me"]').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Settings' }).first().click(); await p.waitForTimeout(800);
await p.getByText('Log Out', { exact: true }).click(); await p.waitForTimeout(2500);
await logIn();
t = await p.locator('body').innerText();
check('logging in again after logging out opens the journal', t.includes('Jimmy & Ana') && ALL.every(x => t.includes(x)));
await p.screenshot({ path: `${OUT}/login-2-again.png` });
// Pressing Log in over and over (or holding Enter) must still end in the journal, never as a logged-out visitor
await p.locator('nav button[aria-label="Me"]').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Settings' }).first().click(); await p.waitForTimeout(800);
await p.getByText('Log Out', { exact: true }).click(); await p.waitForTimeout(2500);
await p.goto(`${APP}/login`); await p.waitForTimeout(1500);
await p.locator('input[type="email"]').fill('jimmy@test.com');
await p.locator('input[type="password"]').fill(PASSWORD);
for (let i = 0; i < 10; i++) await p.locator('input[type="password"]').press('Enter', { delay: 0 }).catch(() => {});
await p.waitForTimeout(6000);
t = await p.locator('body').innerText();
check('pressing Enter ten times still opens the journal with every entry', t.includes('Jimmy & Ana') && ALL.every(x => t.includes(x)));
// A browser that can't save the login (storage full or blocked) must still open the journal right after logging in
{
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await c2.addInitScript(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('sb-')) throw new DOMException('QuotaExceededError', 'QuotaExceededError'); return set.call(this, k, v); }; });
  const q = await c2.newPage();
  await q.goto(`${APP}/login`); await q.waitForTimeout(1500);
  await q.locator('input[type="email"]').fill('jimmy@test.com');
  await q.locator('input[type="password"]').fill(PASSWORD);
  await q.getByRole('button', { name: /^Log in/ }).click(); await q.waitForTimeout(7000);
  const t2 = await q.locator('body').innerText();
  check("logging in on a browser that can't save the login still opens the journal", t2.includes('Jimmy & Ana') && ALL.every(x => t2.includes(x)), t2.slice(0, 120).replace(/\n+/g, ' | '));
  await c2.close();
}
// Typing your existing account into "Create account" logs you in instead of stopping there
{
  const c3 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const q = await c3.newPage();
  await q.goto(`${APP}/signup`); await q.waitForTimeout(1500);
  await q.locator('input[type="email"]').fill('jimmy@test.com');
  await q.locator('input[type="password"]').fill(PASSWORD + 'Aa');
  await q.getByRole('button', { name: /^Create account/ }).click(); await q.waitForTimeout(3000);
  const wrong = await q.locator('body').innerText();
  check('Create account with your email and a wrong password says you already have an account', /already have an account/i.test(wrong));
  await q.goto(`${APP}/signup`); await q.waitForTimeout(1500);
  await q.locator('input[type="email"]').fill('jimmy@test.com');
  await q.locator('input[type="password"]').fill(PASSWORD);
  await q.getByRole('button', { name: /^Create account/ }).click(); await q.waitForTimeout(6000);
  const t3 = await q.locator('body').innerText();
  check('Create account with your existing email and password just logs you in, every entry there', t3.includes('Jimmy & Ana') && ALL.every(x => t3.includes(x)));
  await c3.close();
}
check('no crashes', errs.length === 0, errs.join(' | ').slice(0, 200));
await b.close();
console.log(R.join('\n'));
