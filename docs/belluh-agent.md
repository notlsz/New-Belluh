# Belluh agent

Belluh is the same Belluh tab, now with a memory and the ability to act. It is built to feel like part of the journal, not a separate chatbot.

## What it does

- **One ongoing conversation per person.** It reads your entries and the entries your partner shares, plus your saved dates and what it remembers about you. Conversations persist across devices.
- **Remembers, and forgets on request.** When you tell it something lasting ("Dan needs ten minutes after work"), it saves it. Tap **Memory** in the Belluh tab to see everything it keeps and delete any of it, or say "forget that".
- **Saves dates** you mention, into the same list the WhatsApp feature uses, so reminders cover them.
- **Carries notes to your partner, with your approval.** Ask it to help you say something to your partner; it drafts the note in your voice and shows **Send to Dan / Don't send**. Nothing is sent until you tap Send. Your partner sees it in their Belluh tab as "From Maya, via Belluh", with a pink dot on the tab.
- **Replies after you write, when it has something to add.** A small Belluh card appears after you save an entry, linking it to something earlier or asking one question. If it has nothing specific to say, it stays quiet.
- **Mediate Conflict** still works; it now helps find words and can turn them into a note to send.

## Privacy rules (enforced on the server, unit-tested)

- Belluh only ever loads your own entries and your connected partner's **shared** entries. Your partner's private entries are never fetched, so they can't leak into an answer or a note.
- Your own private entries are labelled for Belluh so it doesn't pass them on unless you ask.
- Notes go only to a connected partner. Memories, the conversation and notes are visible only to their owners (and a note to its sender and recipient).
- The Gemini key lives in Supabase secrets, not in the browser.

## What it deliberately doesn't do

It doesn't flirt, play a romantic role or try to replace the partner. Grok's companions (avatar, affection meter) were retired by xAI in September 2026, and a companion inside a couples app would compete with the relationship. Belluh points you back to each other.

## Deploy

1. Apply `supabase/migrations/20261012010000_belluh_agent.sql` (after the occasions migration).
2. Set the `GEMINI_API_KEY` secret (optional `GEMINI_MODEL`, default `gemini-2.5-flash`).
3. `supabase functions deploy belluh-agent` (keep JWT verification on).

Until it is deployed, the Belluh tab falls back to the original chat, so nothing breaks.

## Tests

`npm test` covers the privacy filter, prompt, tool validation and date logic. `tests/gemini_loop.deno.test.ts` checks that tool calls run and their results go back to the model (`deno test --allow-env`).
