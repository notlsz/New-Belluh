# Belluh

Consumer AI couples app: a shared love journal for two plus Bella, an AI agent that remembers occasions and plans dates, flowers and gifts over iMessage, SMS, WhatsApp, Telegram and LINE. React + Vite + TypeScript front end; Supabase edge functions in `supabase/functions` (shared logic in `_shared/`).

## Growth and localization: read the playbook first

Any work on a market, a country, pricing, a language, a channel or growth starts with `docs/growth/README.md`:
- `docs/growth/strategy.md` and `global-decisions.md` hold the rules; `docs/growth/markets/<iso>-<name>.md` holds each country's plan and log; `build-list.md` the product priorities.
- After shipping market work, run `node scripts/growth-status.mjs` (it regenerates what is shipped per market from the code), then add a line to the market's Log and to `docs/growth/CHANGELOG.md`.
- Crisis lines in `supabase/functions/_shared/safety.ts` must be verified at the source before they are added. Never weaken the safety baseline or discreet mode for growth.

## Conventions

- Tests: `npm test`; types: `npx tsc --noEmit -p .`; also run a `vite build`, because `lucide-react` is aliased to `src/lib/emojiIcons.tsx` and a missing icon breaks the build but not tsc.
- UI strings live in `src/i18n` and `src/i18n/ui/*.ts`; every key in every language, no em dashes or the characters • · in user-facing text.
- Commit as `Claude <noreply@anthropic.com>`.
