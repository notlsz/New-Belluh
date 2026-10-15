// The shared "Us" thread in a real browser: Maya and Dan, same conversation, Belluh answering when asked.
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], APP = 'http://localhost:4175', SECRET = 'belluh-local-test-secret-0123456789abcdef';
const jwt = (sub, email) => { const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role: 'authenticated', sub, email, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const session = (sub, email) => JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const MAYA = '11111111-1111-1111-1111-111111111111', DAN = '22222222-2222-2222-2222-222222222222';
const R = []; const check = (n, ok, d = '') => R.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch();
const open = async (sub, email) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); localStorage.removeItem('belluh_space'); }, [session(sub, email)]);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP); await p.waitForTimeout(3000);
  await p.locator('nav button[aria-label="Us"]').click(); await p.waitForTimeout(2000);
  return { p, errs };
};
const maya = await open(MAYA, 'maya@test.com');
check('Belluh tab offers "Just you" and "You & Dan"', await maya.p.getByRole('tab', { name: 'Just you' }).count() === 1 && await maya.p.getByRole('tab', { name: /You & Dan/ }).count() === 1);
await maya.p.getByRole('tab', { name: /You & Dan/ }).click(); await maya.p.waitForTimeout(2000);
check('Us shows the shared conversation', (await maya.p.locator('body').innerText()).includes('Hey you, dinner tonight?'));
await maya.p.getByLabel('Message Dan and Belluh').fill('Belluh, what have we both been writing about?');
await maya.p.getByRole('button', { name: 'Send to Us' }).click(); await maya.p.waitForTimeout(3000);
const t = await maya.p.locator('body').innerText();
check('Belluh answers in the shared thread', t.includes('Plain reply from the model.'));
check('Says who can see it', t.includes('Maya and Dan both see this'));
await maya.p.screenshot({ path: `${OUT}/us-maya.png` });
await maya.p.getByRole('button', { name: /^Belluh$|^Off$/ }).first().click(); // turn Belluh off: just to Dan
await maya.p.getByLabel('Message Dan and Belluh').fill('Love you, see you at 7');
await maya.p.getByRole('button', { name: 'Send to Us' }).click(); await maya.p.waitForTimeout(1500);
const dan = await open(DAN, 'dan@test.com');
await dan.p.getByRole('tab', { name: /You & Maya/ }).click(); await dan.p.waitForTimeout(2500);
const td = await dan.p.locator('body').innerText();
check('Dan sees the same thread, labelled', td.includes('Love you, see you at 7') && td.includes('Plain reply from the model.') && td.includes('MAYA'));
await dan.p.screenshot({ path: `${OUT}/us-dan.png` });
check('No JS errors', maya.errs.length + dan.errs.length === 0, [...maya.errs, ...dan.errs].join(' | ').slice(0, 200));
await b.close();
console.log(R.join('\n'));
