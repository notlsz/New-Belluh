# Deploying the backend

The website deploys from `main` on Vercel. The backend pieces below live in Supabase and must be set up once Belluh's Supabase project is reachable again. Until then the site loads, but sign-in (and everything behind it) depends on the database.

Do these in order.

1. **Migrations** (Supabase SQL editor, or `supabase db push`), oldest first:
   - `supabase/migrations/20261012000000_occasions_whatsapp.sql`
   - `supabase/migrations/20261012010000_belluh_agent.sql`
   - `supabase/migrations/20261012020000_security_hardening.sql`

   The last one replaces the access rules on `journal_entries` and `partner_connections`, adds one-time invite links, and creates the private `journal-private` storage bucket.

2. **Secrets** (Edge Functions → Secrets): `GEMINI_API_KEY` (required). Optional: `GEMINI_MODEL`, `AI_HOURLY_LIMIT` (default 120), `AGENT_HOURLY_LIMIT` (default 40). WhatsApp secrets are in `docs/whatsapp-occasions.md`.

3. **Functions:**
   ```bash
   supabase functions deploy gemini-proxy
   supabase functions deploy belluh-agent
   supabase functions deploy whatsapp-webhook --no-verify-jwt     # when WhatsApp is ready
   supabase functions deploy occasion-reminders --no-verify-jwt   # when WhatsApp is ready
   ```

## What works before step 1-3, after the database is back

- Sign-in, writing, liking, the timeline: yes.
- Invite links: the old style still works, as a request the other person accepts in their profile. Once step 1 is done, new links are one-time and ask "Connect with Maya?" before connecting.
- Voice notes and photos: saved to the original storage until the private bucket exists.
- AI features (transcription, patterns, forecast, letters, Belluh): need steps 2 and 3. The live site had no AI key in it before this change either.

## Smoke test after deploying

With two test accounts: invite by link and accept; write a shared and a private entry each; check each sees only the other's shared entry; heart the partner's entry; record a voice note and reload after an hour; answer today's question on both; ask Belluh to send a note and confirm it arrives.
