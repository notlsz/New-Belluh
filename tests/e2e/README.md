# End-to-end tests

These run Belluh against a local stand-in for Supabase, so the real database rules, API and server functions are exercised without touching production.

- **Database:** Postgres 16 with `base.sql` (roles, auth, storage and Belluh's existing tables, including deliberately wide-open old policies) plus every migration in `supabase/migrations`.
- **API:** PostgREST 12 (`db-anon-role anon`, JWT secret below), behind `gateway.mjs`, which plays Supabase's gateway (`/rest/v1`, `/auth/v1/user`, `/functions/v1/*`, CORS).
- **Server functions:** `belluh-agent`, `gemini-proxy` and `belluh-weekly` (with `CRON_SECRET=cron-test`) run in Deno via `fnwrap.ts` (`PORT`, `FN_PATH`), with `SUPABASE_URL=http://127.0.0.1:3000` and `GEMINI_API_BASE=http://127.0.0.1:3002`.
- **AI:** `fake-gemini.mjs` gives scripted answers and logs every request to `$GEMINI_LOG`, so tests can check what Belluh sent.

Secret used throughout: `JWT_SECRET=belluh-local-test-secret-0123456789abcdef`.

## Run

1. Start Postgres, create a `belluh` database, apply `base.sql` then the migrations.
2. Start PostgREST (port 3001), `gateway.mjs` (3000), `fake-gemini.mjs` (3002), and the three functions (8101, 8102, 8103).
3. `node --test api.e2e.test.mjs` (needs `@supabase/supabase-js`): 20 scenarios, covering access rules, invites, shared vs private entries, the Belluh agent, the weekly loop, the security audit fixes, and that a partner's private entry never reaches the model.
4. Build the app with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3000`, serve it on 4175, then `node app.e2e.mjs <screenshot dir>`: 18 checks in a real browser as Maya, Dan and Eve. Then `node weekly.e2e.mjs <screenshot dir>`: 11 checks of the weekly card and check-in.

Last run, Oct 12, 2026: 20/20 API scenarios, 18/18 browser checks and 11/11 weekly checks passed.
