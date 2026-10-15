// Belluh's water: it shows listening, thinking and talking, takes any shape it's asked for (instantly when it knows
// the thing, or the shape Belluh picks itself), keeps it across a reload, and goes back to water.
// Run after api.e2e.test.mjs (Maya and Dan connected). Uses software WebGL so the real water renders.
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], SECRET = 'belluh-local-test-secret-0123456789abcdef';
const jwt = (sub, email) => { const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role: 'authenticated', sub, email, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sub = '11111111-1111-1111-1111-111111111111', email = 'maya@test.com';
const s = JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const R = []; const check = (n, ok, d = '') => R.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'America/New_York' });
// Software WebGL normally gets the light 2D water; force the real 3D water here
await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); localStorage.setItem('belluh_water', 'force'); }, [s]);
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const root = (k) => p.evaluate((k) => document.documentElement.dataset[k] ?? null, k);
const waitFor = async (k, v, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await root(k) === v) return true; await p.waitForTimeout(100); } return false; };
const seen = async (k, v, ms = 20000) => p.waitForFunction(([k, v]) => document.documentElement.dataset[k] === v, [k, v], { timeout: ms, polling: 30 }).then(() => true, () => false);

await p.goto('http://localhost:4175'); await p.waitForTimeout(4000);
const drawn = await p.evaluate(() => {
  const c = document.querySelector('.belluh-orb.is-3d canvas');
  if (!c) return 'no 3d orb';
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let solid = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) solid++;
  return solid / (c.width * c.height);
});
check('the water renders in 3D on Home', typeof drawn === 'number' && drawn > 0.15 && drawn < 0.8, String(drawn));

await p.getByPlaceholder('Ask Belluh...').fill('hi'); await p.keyboard.press('Enter');
const dialog = p.getByRole('dialog', { name: 'Belluh' });
await dialog.waitFor(); await p.waitForTimeout(6000);
const box = dialog.locator('textarea');
const heardBefore = await root('belluhHeard');
await box.pressSequentially('turn into a giraffe please', { delay: 20 });
check('typing to Belluh moves the water (listening)', (await root('belluhHeard')) !== heardBefore);
// Record every state Belluh goes through (a fast reply can think for only a moment)
await p.evaluate(() => { window.__states = []; new MutationObserver(() => window.__states.push(document.documentElement.dataset.belluhState)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-belluh-state'] }); });
const talking = seen('belluhState', 'talking', 20000);
await p.keyboard.press('Enter');
check('it becomes a giraffe instantly, before the reply', await waitFor('belluhShape', 'giraffe', 1500), String(await root('belluhShape')));
await p.waitForTimeout(300);
check('it thinks while Belluh works on the reply', (await p.evaluate(() => window.__states)).includes('thinking'), (await p.evaluate(() => window.__states.join(' '))));
await p.screenshot({ path: `${OUT}/orb-1-thinking.png` });
check('it talks while the reply appears word by word', await talking);
await p.screenshot({ path: `${OUT}/orb-2-talking.png` });
check('then it rests', await waitFor('belluhState', 'idle', 30000));
const avatar = dialog.locator('.belluh-orb').last();
await avatar.screenshot({ path: `${OUT}/orb-3-giraffe.png` });

await box.fill('Can you become a lighthouse?'); await p.keyboard.press('Enter');
check('anything else: it takes the shape Belluh draws', await waitFor('belluhShape', 'lighthouse', 30000), String(await root('belluhShape')));
await waitFor('belluhState', 'idle', 30000);
await dialog.locator('.belluh-orb').last().screenshot({ path: `${OUT}/orb-4-lighthouse.png` });

await p.reload(); await p.waitForTimeout(4000);
check('its shape stays after a reload', (await root('belluhShape')) === 'lighthouse');
await p.screenshot({ path: `${OUT}/orb-5-home-lighthouse.png` });
await p.getByPlaceholder('Ask Belluh...').fill('ok go back to normal'); await p.keyboard.press('Enter');
check('"go back to normal" turns it back into water', await waitFor('belluhShape', 'water', 3000));
await p.waitForTimeout(5000);
check('No JavaScript errors', errs.length === 0, errs.slice(0, 2).join(' / '));
console.log(R.join('\n')); await b.close();
