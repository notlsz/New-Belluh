// Belluh comes to you and acts, in a real browser: an offer on Home with one-tap answers, gift and booking links in
// the Belluh tab, and Connect Telegram in Settings. Run after api.e2e.test.mjs (it uses that state).
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], APP = 'http://localhost:4175', API = 'http://127.0.0.1:3000', SECRET = 'belluh-local-test-secret-0123456789abcdef';
const jwt = (sub, email, role = 'authenticated') => { const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role, ...(sub ? { sub, email } : {}), aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const session = (sub, email) => JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const MAYA = '11111111-1111-1111-1111-111111111111';
const R = []; const check = (n, ok, d = '') => R.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const service = { apikey: jwt('', '', 'anon'), authorization: `Bearer ${jwt('', '', 'service_role')}`, 'content-type': 'application/json' };

// Reopen Maya's birthday offer, as if Belluh just made it
const offers = await (await fetch(`${API}/rest/v1/agent_messages?user_id=eq.${MAYA}&meta->>kind=eq.offer&select=id,meta`, { headers: service })).json();
for (const o of offers) await fetch(`${API}/rest/v1/agent_messages?id=eq.${o.id}`, { method: 'PATCH', headers: service, body: JSON.stringify({ meta: { ...o.meta, status: 'open' }, created_at: new Date().toISOString() }) });

const b = await chromium.launch();
const open = async (sub, email) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); localStorage.setItem('belluh_space', 'me'); }, [session(sub, email)]);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP); await p.waitForTimeout(3500);
  return { p, errs };
};

const maya = await open(MAYA, 'maya@test.com');
const home = (await maya.p.locator('body').innerText());
check('Home leads with what Belluh noticed', /belluh noticed/i.test(home) && home.includes('misses shooting film'));
check('with one-tap answers', await maya.p.getByRole('button', { name: 'Help me plan it' }).count() === 1 && await maya.p.getByRole('button', { name: 'Not now' }).count() === 1);
await maya.p.screenshot({ path: `${OUT}/acts-home.png` });
await maya.p.getByRole('button', { name: 'Help me plan it' }).click(); await maya.p.waitForTimeout(4500);
const tab = await maya.p.locator('body').innerText();
check('Yes takes you to Belluh, which already did it: gift ideas ready to buy', tab.includes('Film camera') && tab.includes('Poetry books'));
const giftHref = await maya.p.getByRole('link', { name: /Film camera/ }).first().getAttribute('href');
check('each one a real store link', /^https:\/\/www\.amazon\.com\/s\?k=film\+camera$/.test(giftHref ?? ''), giftHref);
const otHref = await maya.p.getByRole('link', { name: /Book a table on OpenTable/ }).first().getAttribute('href');
check('a table it prepared is one tap from booked', /^https:\/\/www\.opentable\.com\/s\?dateTime=\d{4}-\d{2}-\d{2}T19%3A00%3A00&covers=2&term=ramen\+San\+Jose$/.test(otHref ?? ''), otHref);
check('the offer is answered, so it does not ask again', await maya.p.getByRole('button', { name: 'Help me plan it' }).count() === 0);
await maya.p.screenshot({ path: `${OUT}/acts-belluh.png` });
check('Mediate conflict is still there', await maya.p.getByText('Mediate Conflict').count() === 1);

// Settings: Maya switches her texting to Telegram
await fetch(`${API}/rest/v1/whatsapp_links?user_id=eq.${MAYA}`, { method: 'PATCH', headers: service, body: JSON.stringify({ phone_e164: 'tg:888', channel: 'telegram' }) });
const set = await open(MAYA, 'maya@test.com');
await set.p.locator('nav button[aria-label="Me"]').click(); await set.p.waitForTimeout(2000);
await set.p.getByText('Texting, notifications & calendar').click(); await set.p.waitForTimeout(2500);
check('Settings shows Telegram is connected', (await set.p.locator('body').innerText()).includes('Connected to Telegram'));
await set.p.getByRole('button', { name: 'Disconnect texting' }).click(); await set.p.waitForTimeout(2500);
const tgHref = await set.p.getByRole('link', { name: /Connect Telegram/ }).getAttribute('href').catch(() => null);
check('Connect Telegram is one tap: it opens the bot with the code', /^https:\/\/t\.me\/BelluhBot\?start=[A-Z2-9]{6}$/.test(tgHref ?? ''), tgHref);
await set.p.getByRole('link', { name: /Connect Telegram/ }).scrollIntoViewIfNeeded();
await set.p.screenshot({ path: `${OUT}/acts-settings.png` });
const eve = set;
check('No JS errors', maya.errs.length + eve.errs.length === 0, [...maya.errs, ...eve.errs].join(' | ').slice(0, 200));
await b.close();
console.log(R.join('\n'));
