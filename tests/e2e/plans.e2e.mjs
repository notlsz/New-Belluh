// Plans, calendar, the + page, Our weeks and the Me page in a real browser, against the local stack.
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const OUT = process.argv[2], APP = 'http://localhost:4175', API = 'http://127.0.0.1:3000', SECRET = 'belluh-local-test-secret-0123456789abcdef';
const jwt = (sub, email, role = 'authenticated') => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const h = b({ alg: 'HS256', typ: 'JWT' }), p = b({ role, ...(sub ? { sub, email } : {}), aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
};
const session = (sub, email) => JSON.stringify({ access_token: jwt(sub, email), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'local', user: { id: sub, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
const MAYA = '11111111-1111-1111-1111-111111111111', DAN = '22222222-2222-2222-2222-222222222222';
const results = []; const check = (n, ok, d = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  (' + d + ')' : ''}`);
const b = await chromium.launch();
const open = async (sub, email, width = 390) => {
  const ctx = await b.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(([s]) => { localStorage.setItem('sb-127-auth-token', s); }, [session(sub, email)]);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP); await p.waitForTimeout(3500);
  return { p, errs, ctx };
};
const tab = (p, name) => p.locator(`nav button[aria-label="${name}"]`).click();

// Maya asks Belluh to plan; Dan picks a time from his home feed
await fetch(`${API}/functions/v1/belluh-agent`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${jwt(MAYA, 'maya@test.com')}`, apikey: jwt('', '', 'anon') }, body: JSON.stringify({ action: 'chat', message: 'Can you plan a dinner with Dan?', timezone: 'America/New_York' }) });
{
  const { p, errs } = await open(DAN, 'dan@test.com');
  const t = await p.locator('body').innerText();
  check('Dan sees "Maya wants to plan" on home', /Maya wants to plan/i.test(t));
  check('with times to pick', await p.getByText('Pick', { exact: true }).count() >= 2);
  await p.screenshot({ path: `${OUT}/plan-dan-home.png`, fullPage: false });
  await p.getByText('Pick', { exact: true }).first().click(); await p.waitForTimeout(2500);
  const t2 = await p.locator('body').innerText();
  check('One tap confirms it', /It's a plan/i.test(t2));
  check('Add to Google Calendar and Apple/Outlook appear', t2.includes('Google Calendar') && t2.includes('Apple or Outlook'));
  // Other plans may be on screen too (which comes first depends on today's date), so look at this plan's link
  const gHrefs = await p.locator('a', { hasText: 'Google Calendar' }).evaluateAll(as => as.map(a => a.getAttribute('href') ?? ''));
  const gHref = gHrefs.find(h => /Dinner/.test(h)) ?? gHrefs[0];
  check('Google link carries the plan', /calendar\.google\.com.*Dinner/.test(gHref ?? ''), (gHref ?? '').slice(0, 80));
  await p.screenshot({ path: `${OUT}/plan-dan-confirmed.png` });

  // Our weeks
  await p.locator('button:has(svg.lucide-book-open)').first().click().catch(() => {}); await p.waitForTimeout(1500);
  const t3 = await p.locator('body').innerText();
  check('Book opens "Our weeks" with real history', t3.includes('Our weeks') && /you did \d+ and Maya did \d+/.test(t3) && /plans you made/i.test(t3));
  await p.screenshot({ path: `${OUT}/our-weeks.png` });
  await p.getByLabel('Close').first().click().catch(() => {}); await p.waitForTimeout(500);

  // + opens a blank page with today's question one tap away
  await tab(p, 'Capture'); await p.waitForTimeout(1200);
  const t4 = await p.locator('body').innerText();
  check('+ opens "What\'s on your mind?"', t4.includes("What's on your mind?"));
  check("today's question is one tap away", t4.includes("Answer today's question instead"));
  await p.screenshot({ path: `${OUT}/compose.png` });
  await p.getByText("Answer today's question instead").click(); await p.waitForTimeout(400);
  check('tapping it shows the question', /today's question/i.test(await p.locator('body').innerText()));
  await p.locator('.fixed.inset-0 button:has(svg.lucide-x)').first().click().catch(() => {}); await p.waitForTimeout(600); // the composer's close

  // Me: calendar subscription and honest stats
  await tab(p, 'Me'); await p.waitForTimeout(2500);
  const t5 = await p.locator('body').innerText();
  check('Me shows "shared this month", no made-up Synergy', /shared this month/.test(t5) && !/Synergy|Resonance/.test(t5));
  check('Unset dates say "Add date", not "Today"', t5.includes('Add date') && !/\bToday\b/.test(t5.split('First Met')[1] ?? ''));
  await p.getByText('Texting, notifications & calendar').click(); await p.waitForTimeout(2000);
  await p.getByRole('button', { name: /Add to my calendar/ }).scrollIntoViewIfNeeded();
  await p.getByRole('button', { name: /Add to my calendar/ }).click(); await p.waitForTimeout(1500);
  const webcal = await p.locator('a', { hasText: 'Apple Calendar' }).getAttribute('href').catch(() => null);
  check('Calendar link made (Apple via webcal)', /^webcal:\/\/127\.0\.0\.1:3000\/functions\/v1\/belluh-calendar\?token=/.test(webcal ?? ''), webcal ?? 'none');
  const ics = webcal ? await (await fetch(webcal.replace('webcal://', 'http://'))).text() : '';
  check('The feed has the plan Dan just picked', /SUMMARY:Dinner at the Thai place/.test(ics));
  await p.screenshot({ path: `${OUT}/me-calendar.png`, fullPage: true });
  check('No JavaScript errors for Dan', errs.length === 0, errs.join('; ').slice(0, 160));
}
// Maya hears back, and sees the confirmed plan
{
  const { p, errs } = await open(MAYA, 'maya@test.com', 1280);
  const t = await p.locator('body').innerText();
  check("Maya's home shows the confirmed plan", /It's a plan/i.test(t) && t.includes('Dinner at the Thai place'));
  await p.screenshot({ path: `${OUT}/maya-desktop-home.png` });
  await p.locator('nav button[aria-label="Us"], nav button[aria-label="Belluh"]').first().click(); await p.waitForTimeout(2500);
  check('Belluh tells Maya which time Dan picked', /Dan picked .* for "Dinner at the Thai place"/.test(await p.locator('body').innerText()));
  await p.screenshot({ path: `${OUT}/maya-desktop-belluh.png` });
  check('No JavaScript errors for Maya', errs.length === 0, errs.join('; ').slice(0, 160));
}
await b.close();
console.log(results.join('\n'));
