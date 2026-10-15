# End-to-end tests

These run Belluh against a local stand-in for Supabase, so the real database rules, API and server functions are exercised without touching production.

- **Database:** Postgres 16 with `base.sql` (roles, auth, storage and Belluh's existing tables, including deliberately wide-open old policies) plus every migration in `supabase/migrations`.
- **API:** PostgREST 12 (`db-anon-role anon`, JWT secret below), behind `gateway.mjs`, which plays Supabase's gateway (`/rest/v1`, `/auth/v1/user`, `/functions/v1/*`, a small in-memory `/storage/v1/object`, CORS).
- **Server functions:** `belluh-agent`, `gemini-proxy` and `belluh-weekly` (with `CRON_SECRET=cron-test`) run in Deno via `fnwrap.ts` (`PORT`, `FN_PATH`), with `SUPABASE_URL=http://127.0.0.1:3000` and `GEMINI_API_BASE=http://127.0.0.1:3002`.
- **AI:** `fake-gemini.mjs` gives scripted answers and logs every request to `$GEMINI_LOG`, so tests can check what Belluh sent.

Secret used throughout: `JWT_SECRET=belluh-local-test-secret-0123456789abcdef`.

## Run

1. Start Postgres, create a `belluh` database, apply `base.sql` then the migrations.
2. Start PostgREST (port 3001), `gateway.mjs` (3000), `fake-gemini.mjs` (3002), and the functions: `belluh-agent` 8101, `gemini-proxy` 8102, `belluh-weekly` 8103, `whatsapp-webhook` 8104, `occasion-reminders` 8105, `belluh-calendar` 8106, `sms-webhook` 8107, `belluh-push` 8108, `belluh-nudges` 8109, `telegram-webhook` 8110 (env: `PUSH_TEST_HOSTS=127.0.0.1:3002`, `TELEGRAM_BOT_TOKEN=tg-token`, `TELEGRAM_API_BASE=http://127.0.0.1:3002/telegram`, `CRON_SECRET=cron-test`, `WHATSAPP_API_BASE=http://127.0.0.1:3002/graph`, `WHATSAPP_APP_SECRET=wa-secret`, `WHATSAPP_VERIFY_TOKEN=wa-verify`, `WHATSAPP_ACCESS_TOKEN=wa-token`, `WHATSAPP_PHONE_NUMBER_ID=123`, `TWILIO_API_BASE=http://127.0.0.1:3002/twilio`, `TWILIO_ACCOUNT_SID=AC123`, `TWILIO_AUTH_TOKEN=tw-token`, `TWILIO_FROM=+15550001111`). `fake-gemini.mjs` also stands in for Meta's, Twilio's and Telegram's APIs.
3. `node --test api.e2e.test.mjs` (needs `@supabase/supabase-js`): 32 scenarios, covering access rules, invites, shared vs private entries, the Belluh agent, the weekly loop, the security audit fixes, moving old media to private storage, that a partner's private entry never reaches the model, WhatsApp and SMS end to end (including the full Belluh agent by text: notes, plans, check-ins, STOP), planning together with the calendar feed, photos in the Belluh chat, encrypted web push (decrypted in the test the way a browser would), the shared Us thread (shared things only), Telegram (one-tap link, signed updates only, quick-answer buttons), Belluh acting (reminders it sends, booking and gift links, your own words saved to the journal and nothing else) and Belluh reaching out (birthday offers, a nudge on an unanswered plan, how it went), each once.
4. Build the app with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000`, serve it on 4175, then `node app.e2e.mjs <screenshot dir>`: 18 checks in a real browser as Maya, Dan and Eve. Then `node weekly.e2e.mjs <screenshot dir>`: 11 checks of the weekly card and check-in.

Then `node acts.e2e.mjs <screenshot dir>` (before settings.e2e.mjs, which disconnects Maya's texting): 10 checks of Belluh's offer on Home, its gift and booking links, and Connect Telegram. Build with `VITE_BELLUH_WHATSAPP_NUMBER=15550002222 VITE_BELLUH_SMS_NUMBER=+15550001111 VITE_BELLUH_TELEGRAM_BOT=BelluhBot`.

Last run, Oct 15, 2026: 32/32 API scenarios, 18/18 browser checks, 11/11 weekly checks, 14/14 plan, calendar and Me-page checks, 5/5 relationship-date checks, 6/6 Us checks, 10/10 Belluh-acts checks and 9/9 Settings checks passed.
