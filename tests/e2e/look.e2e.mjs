import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], APP = 'http://localhost:4175', PASSWORD = 'Belluh-test-1';
const R = []; const check = (n, ok, d = '') => R.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
// Landing: the dragonfly in the top-left corner, with its ripple
{
  const c = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage();
  await p.goto(APP); await p.waitForTimeout(500);
  check('landing top-left shows the dragonfly', await p.locator('header img[src*="dragonfly"]').count() === 1);
  await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/1-landing-ripple.png`, clip: { x: 0, y: 0, width: 300, height: 70 } });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/1b-landing.png`, clip: { x: 0, y: 0, width: 300, height: 70 } });
  await c.close();
}
const c = await b.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
await c.addInitScript(() => { try { localStorage.setItem('belluh_water', 'force'); } catch {} });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const login = async (page) => {
  await page.goto(`${APP}/login`); await page.waitForTimeout(1200);
  await page.locator('input[type="email"]').fill('jimmy@test.com');
  await page.locator('input[type="password"]').fill(PASSWORD);
  const t0 = Date.now();
  await page.getByRole('button', { name: /^Log in/ }).click();
  await page.waitForTimeout(700);
  const left = !(await page.locator('input[type="password"]').count());
  const seen = await page.locator('body').innerText();
  await page.getByText('SHARED JOURNAL').first().waitFor({ timeout: 8000 });
  return { left: left && /Opening your journal|SHARED JOURNAL/i.test(seen), ms: Date.now() - t0 };
};
const r1 = await login(p);
check('one click leaves the login screen right away', r1.left, `journal in ${r1.ms} ms`);
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/2-sidebar.png` });
check('laptop side panel shows the dragonfly', await p.locator('nav img[src*="dragonfly"]').count() === 1);
await p.getByRole('button', { name: 'Collapse side panel' }).click(); await p.waitForTimeout(500);
const w = await p.locator('nav').first().evaluate(n => n.getBoundingClientRect().width);
check('collapse folds the side panel to its icons', w < 100, `${w}px`);
await p.screenshot({ path: `${OUT}/3-collapsed.png` });
await p.reload(); await p.waitForTimeout(4000);
check('it stays collapsed after a reload', (await p.locator('nav').first().evaluate(n => n.getBoundingClientRect().width)) < 100);
await p.getByRole('button', { name: 'Expand side panel' }).click(); await p.waitForTimeout(400);
// Color theme: pick mint and the page, side panel and menus follow
await p.locator('nav button[aria-label="Me"]').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Settings' }).first().click(); await p.waitForTimeout(800);
const themes = await p.locator('button[aria-label$=" theme"]').count();
check('more pastel themes to choose from', themes >= 16, `${themes}`);
await p.screenshot({ path: `${OUT}/4-themes.png` });
await p.getByRole('button', { name: 'Mint theme' }).click(); await p.waitForTimeout(400);
await p.getByRole('button', { name: 'Done' }).click(); await p.waitForTimeout(500);
const navBg = await p.locator('nav').first().evaluate(n => getComputedStyle(n).backgroundColor);
check('the side panel takes the theme', /240, 251, 246/.test(navBg), navBg);
await p.locator('nav button[aria-label="Story"]').click(); await p.waitForTimeout(800);
await p.locator('h1').first().click(); await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/5-mint-menu.png` });
const menuBg = await p.locator('div.absolute.w-72').first().evaluate(n => getComputedStyle(n).backgroundColor);
check('the chapter menu takes the theme', /248, 253, 251/.test(menuBg), menuBg);
await p.locator('h1').first().click(); await p.waitForTimeout(300);
// Heart: one clean heart, also when tapped
await p.getByPlaceholder('Ask Belluh...').fill('become a heart'); await p.keyboard.press('Enter');
for (const ms of [200, 600, 1500, 3000]) { await p.waitForTimeout(ms === 200 ? 200 : ms - [200, 600, 1500, 3000][[200, 600, 1500, 3000].indexOf(ms) - 1]); const orb = p.locator('.belluh-orb').first(); await orb.screenshot({ path: `${OUT}/6-heart-${ms}.png` }).catch(() => {}); }
check('Belluh became a heart', (await p.evaluate(() => document.documentElement.dataset.belluhShape)) === 'heart');
await p.locator('.belluh-orb').first().click().catch(() => {}); await p.waitForTimeout(300);
await p.locator('.belluh-orb').first().screenshot({ path: `${OUT}/7-heart-tapped.png` }).catch(() => {});
await p.waitForTimeout(1500);
await p.locator('.belluh-orb').first().screenshot({ path: `${OUT}/7b-heart-after-tap.png` }).catch(() => {});
await c.close();
// A different browser, nothing saved locally: the heart comes back with the account
const c2 = await b.newContext({ viewport: { width: 1280, height: 860 } });
await c2.addInitScript(() => { try { localStorage.setItem('belluh_water', 'force'); } catch {} });
const q = await c2.newPage();
await login(q); await q.waitForTimeout(2500);
check('on another browser, Belluh is still a heart', (await q.evaluate(() => document.documentElement.dataset.belluhShape)) === 'heart', await q.evaluate(() => document.documentElement.dataset.belluhShape));
await c2.close(); await b.close();
check('no crashes', errs.length === 0, errs.join(' | ').slice(0, 200));
console.log(R.join('\n'));
