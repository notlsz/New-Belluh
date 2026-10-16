// Weekly loop in the real app: Timeline card, one-tap check-in, Belluh thread card, tab dot.
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], APP = 'http://localhost:4175', SECRET = 'belluh-local-test-secret-0123456789abcdef';
const jwt = (sub, email) => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role: 'authenticated', sub, email, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
};
const session = (sub, email) => JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const results = []; const check = (n, ok, d = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch();
const open = async (sub, email) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'America/New_York' });
  await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); }, [session(sub, email)]);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP); await p.waitForTimeout(3500); return { p, errs };
};
const MAYA = '11111111-1111-1111-1111-111111111111', DAN = '22222222-2222-2222-2222-222222222222';
// Start from "nobody has answered this week" (other suites may have checked in already)
{
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ role: 'service_role', exp: Math.floor(Date.now() / 1000) + 600 });
  const svc = `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
  await fetch('http://127.0.0.1:3000/rest/v1/weekly_checkins?user_id=in.(' + MAYA + ',' + DAN + ')', { method: 'DELETE', headers: { apikey: svc, authorization: `Bearer ${svc}` } });
}
{
  const { p, errs } = await open(DAN, 'dan@test.com');
  const card = p.getByText('This week, together').first();
  check('Dan sees "This week, together" on his home feed', await card.count() > 0);
  check('Shows the action', (await p.locator('body').innerText()).includes('Take a twenty-minute walk after dinner'));
  check('Shows Maya hasn\'t checked in yet', (await p.locator('body').innerText()).includes("Maya hasn't checked in yet"));
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/w1-dan-home-card.png` });
  await p.getByRole('button', { name: 'We did it' }).first().click(); await p.waitForTimeout(1500);
  const after = await p.locator('body').innerText();
  check('One tap from home saves it, and the card folds to one line', after.includes('You: did it') && after.includes("Maya: not yet") === false && await p.getByRole('button', { name: 'Change' }).count() === 1);
  await p.screenshot({ path: `${OUT}/w2-dan-checked-in.png` });
  check('No JavaScript errors for Dan', errs.length === 0, errs.join('; ').slice(0, 120));
}
{
  const { p, errs } = await open(MAYA, 'maya@test.com');
  const body = await p.locator('body').innerText();
  check('Maya sees Dan did it', body.includes('Dan: did it'));
  check('Belluh tab shows a dot for the new weekly message', await p.locator('[aria-label="New note"]').count() > 0);
  await p.getByRole('button', { name: /^(Belluh|Us)$/ }).click(); await p.waitForTimeout(3000);
  const t = await p.locator('body').innerText();
  check('Belluh thread shows the Sunday insight', /your week, from belluh/i.test(t) && t.includes('Dinner came up'));
  check('The check-in card sits under it', await p.getByText('This week, together').count() === 1);
  await p.getByText('Your week, from Belluh').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/w3-maya-belluh-thread.png` });
  await p.getByRole('button', { name: 'Not yet' }).first().click(); await p.waitForTimeout(1500);
  check('Tapping in the thread adds Belluh\'s short reply', (await p.locator('body').innerText()).includes('still time this week'));
  await p.screenshot({ path: `${OUT}/w4-maya-not-yet.png` });
  check('No JavaScript errors for Maya', errs.length === 0, errs.join('; ').slice(0, 120));
}
await b.close();
console.log(results.join('\n'));
