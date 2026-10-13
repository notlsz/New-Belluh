# End-to-end tests

These run Belluh against a local stand-in for Supabase, so the real database rules, API and server functions are exercised without touching production.

- **Database:** Postgres 16 with `base.sql` (roles, auth, storage and Belluh's existing tables, including deliberately wide-open old policies) plus every migration in `supabase/migrations`.
- **API:** PostgREST 12 (`db-anon-role anon`, JWT secret below), behind `gateway.mjs`, which plays Supabase's gateway (`/rest/v1`, `/auth/v1/user`, `/functions/v1/*`, a small in-memory `/storage/v1/object`, CORS).
- **Server functions:** `belluh-agent`, `gemini-proxy` and `belluh-weekly` (with `CRON_SECRET=cron-test`) run in Deno via `fnwrap.ts` (`PORT`, `FN_PATH`), with `SUPABASE_URL=http://127.0.0.1:3000` and `GEMINI_API_BASE=http://127.0.0.1:3002`.
- **AI:** `fake-gemini.mjs` gives scripted answers and logs every request to `$GEMINI_LOG`, so tests can check what Belluh sent.

Secret used throughout: `JWT_SECRET=belluh-local-test-secret-0123456789abcdef`.

## Run

1. Start Postgres, create a `belluh` database, apply `base.sql` then the migrations.
2. Start PostgREST (port 3001), `gateway.mjs` (3000), `fake-gemini.mjs` (3002), and the functions: `belluh-agent` 8101, `gemini-proxy` 8102, `belluh-weekly` 8103, `whatsapp-webhook` 8104, `occasion-reminders` 8105, `belluh-calendar` 8106, `sms-webhook` 8107 (env: `CRON_SECRET=cron-test`, `WHATSAPP_API_BASE=http://127.0.0.1:3002/graph`, `WHATSAPP_APP_SECRET=wa-secret`, `WHATSAPP_VERIFY_TOKEN=wa-verify`, `WHATSAPP_ACCESS_TOKEN=wa-token`, `WHATSAPP_PHONE_NUMBER_ID=123`, `TWILIO_API_BASE=http://127.0.0.1:3002/twilio`, `TWILIO_ACCOUNT_SID=AC123`, `TWILIO_AUTH_TOKEN=tw-token`, `TWILIO_FROM=+15550001111`). `fake-gemini.mjs` also stands in for Meta's and Twilio's APIs.
3. `node --test api.e2e.test.mjs` (needs `@supabase/supabase-js`): 25 scenarios, covering access rules, invites, shared vs private entries, the Belluh agent, the weekly loop, the security audit fixes, moving old media to private storage, that a partner's private entry never reaches the model, WhatsApp and SMS end to end, and planning together with the calendar feed.
4. Build the app with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000`, serve it on 4175, then `node app.e2e.mjs <screenshot dir>`: 18 checks in a real browser as Maya, Dan and Eve. Then `node weekly.e2e.mjs <screenshot dir>`: 11 checks of the weekly card and check-in.

Last run, Oct 13, 2026: 25/25 API scenarios, 18/18 browser checks, 11/11 weekly checks, 19/19 plan, calendar and Me-page checks, and 5/5 relationship-date checks passed.
