// Belluh where you already are: a stack on Home, replies under entries, Ask opens a panel, and the tab is Us.
// Run after api.e2e.test.mjs (Maya and Dan connected); it adds its own entry and Belluh messages.
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], SECRET = 'belluh-local-test-secret-0123456789abcdef';
const jwt = (sub, email) => { const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role: 'authenticated', sub, email, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const sub = '11111111-1111-1111-1111-111111111111', email = 'maya@test.com';
const s = JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const API = 'http://127.0.0.1:3000';
const svc = (role) => { const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); const h = b({ alg: 'HS256', typ: 'JWT' }), q = b({ role, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${q}.${crypto.createHmac('sha256', SECRET).update(`${h}.${q}`).digest('base64url')}`; };
const H = { apikey: svc('anon'), authorization: `Bearer ${svc('service_role')}`, 'content-type': 'application/json', prefer: 'return=representation' };
const post = (table, rows) => fetch(`${API}/rest/v1/${table}`, { method: 'POST', headers: H, body: JSON.stringify(rows) }).then(r => r.json());
const ago = (min) => new Date(Date.now() - min * 60_000).toISOString();
const [entry] = await post('journal_entries', [{ user_id: sub, content: 'He made coffee before I woke up, then left without saying a word about it. Small thing. Big thing.', is_shared: true, type: 'Freeform', date: ago(180), tags: ['circle:c1'], created_at: ago(180) }]);
await post('agent_messages', [
  { user_id: sub, role: 'belluh', body: 'The small things he does without saying seem to be how he says it.', meta: { entry_id: entry.id }, created_at: ago(170) },
  { user_id: sub, role: 'belluh', body: 'Reminder: Pick up the camera', meta: { kind: 'remind', week: 'ui-' + Date.now() }, created_at: ago(20) },
  { user_id: sub, role: 'belluh', body: 'Your anniversary is in 12 days. Want me to set something up?', meta: { kind: 'offer', week: 'ui-' + Date.now(), status: 'open', ask: 'Help me plan something for our anniversary.' }, created_at: ago(1) },
]);
const R = []; const check = (n, ok, d = '') => R.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'America/New_York' });
await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); }, [s]);
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:4175'); await p.waitForTimeout(4000);
let t = await p.locator('body').innerText();
// One card in front, the rest folded behind it until you ask
check('Home shows one card in front with the rest folded', /Show \d more/.test(t) && !t.includes('Pick up the camera'));
await p.getByRole('button', { name: /^Show \d more$/ }).click(); await p.waitForTimeout(400);
t = await p.locator('body').innerText();
const n = Number(/Belluh has (\d) things for you/i.exec(t)?.[1] ?? 0);
check('Home stacks what Belluh has for you', n >= 2 && /belluh noticed/i.test(t) && /reminder you asked for/i.test(t) && t.includes('Pick up the camera'), t.slice(0, 400).replace(/\n/g, ' | '));
await p.screenshot({ path: `${OUT}/1-home-stack.png` });
await p.getByRole('button', { name: 'Dismiss' }).first().click(); await p.waitForTimeout(400);
t = await p.locator('body').innerText();
check('a card can be dismissed', n === 2 ? !/things for you/i.test(t) : new RegExp(`Belluh has ${n - 1} things for you`, 'i').test(t));
await p.getByText('The small things he does without saying').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
check("Belluh's reply sits under the entry it's about", (await p.getByText('The small things he does without saying').count()) === 1);
await p.screenshot({ path: `${OUT}/2-entry-reply.png` });
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
await p.getByPlaceholder('Ask Belluh...').fill('What should I plan for Dan this weekend?');
await p.keyboard.press('Enter'); await p.waitForTimeout(3500);
const dialog = p.getByRole('dialog', { name: 'Belluh' });
check('Ask Belluh opens a panel over Home, not another tab', await dialog.count() === 1 && await p.locator('nav button[aria-current="page"]').getAttribute('aria-label') === 'Story');
check('the panel is your own conversation, with Memory and Mediate', (await dialog.innerText()).includes('What should I plan for Dan this weekend?') && await dialog.getByText('Memory').count() === 1 && await dialog.getByText('Mediate Conflict').count() === 1);
await p.screenshot({ path: `${OUT}/3-ask-panel.png` });
await dialog.getByRole('button', { name: 'Close' }).click(); await p.waitForTimeout(500);
check('closing it returns to Home', await p.getByRole('dialog').count() === 0);
check('the tab is Us once you are connected', await p.locator('nav button[aria-label="Us"]').count() === 1);
await p.locator('nav button[aria-label="Us"]').click(); await p.waitForTimeout(2500);
t = await p.locator('body').innerText();
check('Us opens the thread with your partner and Belluh', t.includes('You, Dan and Belluh') || t.includes('Maya and Dan both see this'));
await p.screenshot({ path: `${OUT}/4-us-tab.png` });
check('No JS errors', errs.length === 0, errs.join(' | ').slice(0, 200));
await b.close();
console.log(R.join('\n'));
