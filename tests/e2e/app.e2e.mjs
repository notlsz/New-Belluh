// Drives the real Belluh app (built against the local stack) as Maya, Dan and Eve.
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], APP = 'http://localhost:4175', SECRET = 'belluh-local-test-secret-0123456789abcdef';
const jwt = (sub, email) => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role: 'authenticated', sub, email, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
};
const session = (sub, email) => JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const results = [];
const check = (name, ok, detail = '') => { results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); };
const b = await chromium.launch();
const open = async (sub, email, path = '/') => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); }, [session(sub, email)]);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP + path); await p.waitForTimeout(3500);
  return { p, errs, ctx };
};
const MAYA = '11111111-1111-1111-1111-111111111111', DAN = '22222222-2222-2222-2222-222222222222', EVE = '33333333-3333-3333-3333-333333333333';

// Maya's timeline
{
  const { p, errs } = await open(MAYA, 'maya@test.com');
  const text = await p.locator('body').innerText();
  check("Maya's timeline loads", text.includes('Maya shared'), errs.join('; ').slice(0, 120));
  check("Maya sees Dan's shared entry", text.includes('Dan shared: brutal day'));
  check("Maya never sees Dan's private entry", !text.includes('DAN PRIVATE'));
  check("Today's question card shows", /Today's Question/i.test(text));
  await p.screenshot({ path: `${OUT}/1-maya-timeline.png` });

  // Answer today's question through the real composer
  const q = p.getByText(/Tap to answer|Answer to unlock/).first();
  if (await q.count()) {
    await q.click(); await p.waitForTimeout(800);
    await p.locator('textarea').first().fill('The way he hummed while making coffee this morning.');
    await p.getByRole('button', { name: /next/i }).first().click().catch(() => {});
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/2-maya-composer.png` });
    await p.getByRole('button', { name: /😊/ }).first().click().catch(() => {});
    await p.waitForTimeout(300);
    await p.getByRole('button', { name: /Save to Story/ }).click();
    await p.waitForTimeout(3000);
    const t2 = await p.locator('body').innerText();
    check('Answering the daily question saves an entry', /Memory captured|coffee this morning/i.test(t2));
  } else check('Answering the daily question saves an entry', false, 'card button not found');
  await p.goto(APP + '/'); await p.waitForTimeout(3500);
  await p.screenshot({ path: `${OUT}/3-maya-after-answer.png` });
  const t3 = await p.locator('body').innerText();
  check('After answering, Maya sees her answer in the question card', t3.includes('hummed while making coffee'));

  // Belluh tab
  const tabs = p.locator('nav button');
  await tabs.nth(2).click(); await p.waitForTimeout(2500);
  check('With a partner connected, the tab is Us', await p.locator('nav button[aria-label="Us"]').count() === 1);
  await p.getByRole('tab', { name: 'Just you' }).click(); await p.waitForTimeout(2000);
  const t4 = await p.locator('body').innerText();
  check('Belluh tab loads the ongoing conversation', /You & Dan/.test(t4) && /Note to Dan|Sent to Dan/i.test(t4), t4.slice(0, 80).replace(/\n/g, ' '));
  await p.screenshot({ path: `${OUT}/4-maya-belluh.png` });
  await p.getByText('Memory', { exact: true }).click(); await p.waitForTimeout(800);
  const t5 = await p.locator('body').innerText();
  check('Memory sheet lists what Belluh remembers', t5.includes('Dan needs ten minutes'));
  await p.screenshot({ path: `${OUT}/5-maya-memory.png` });
  check('No JavaScript errors for Maya', errs.length === 0, errs.join('; ').slice(0, 200));
}

// Dan
{
  const { p, errs } = await open(DAN, 'dan@test.com');
  const text = await p.locator('body').innerText();
  check("Dan never sees Maya's private entry", !text.includes('MAYA PRIVATE'));
  check("Dan's daily question shows Maya answered (locked)", /Maya answered/.test(text) && !text.includes('hummed while making coffee'));
  await p.screenshot({ path: `${OUT}/6-dan-locked-answer.png` });
  check('Belluh tab shows an unread-note dot for Dan', await p.locator('[aria-label="New note"]').count() > 0);
  await p.locator('nav button').nth(2).click(); await p.waitForTimeout(2500);
  const t2 = await p.locator('body').innerText();
  check("Dan receives Maya's note", t2.includes('From Maya, via Belluh') && t2.includes('Saturday coffee'));
  await p.screenshot({ path: `${OUT}/7-dan-note.png` });
  check('No JavaScript errors for Dan', errs.length === 0, errs.join('; ').slice(0, 200));
}

// Eve opens an invite link from Maya
{
  const res = await fetch('http://127.0.0.1:3000/rest/v1/rpc/create_partner_invite', { method: 'POST', headers: { apikey: 'x', Authorization: `Bearer ${jwt(MAYA, 'maya@test.com')}`, 'content-type': 'application/json' }, body: '{}' });
  const token = await res.json();
  const { p, errs } = await open(EVE, 'eve@test.com', `/?invite=${token}`);
  const text = await p.locator('body').innerText();
  check('Opening an invite link asks first ("Connect with Maya?")', text.includes('Connect with Maya?'));
  await p.screenshot({ path: `${OUT}/8-eve-invite-prompt.png` });
  await p.getByRole('button', { name: 'Not now' }).click(); await p.waitForTimeout(1500);
  const after = await fetch('http://127.0.0.1:3000/rest/v1/partner_connections?select=status', { headers: { apikey: 'x', Authorization: `Bearer ${jwt(EVE, 'eve@test.com')}` } }).then(r => r.json());
  check('"Not now" leaves the accounts unconnected', Array.isArray(after) && after.length === 0, JSON.stringify(after));
  check('Invite link removed from the address bar', !p.url().includes('invite='));
  check('No JavaScript errors for Eve', errs.length === 0, errs.join('; ').slice(0, 200));
}
await b.close();
console.log(results.join('\n'));
