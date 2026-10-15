# Belluh agent

Belluh is the same Belluh tab, now with a memory and the ability to act. It is built to feel like part of the journal, not a separate chatbot.

## What it does

- **One ongoing conversation per person.** It reads your entries and the entries your partner shares, plus your saved dates and what it remembers about you. Conversations persist across devices.
- **Remembers, and forgets on request.** When you tell it something lasting ("Dan needs ten minutes after work"), it saves it. Tap **Memory** in the Belluh tab to see everything it keeps and delete any of it, or say "forget that".
- **Dates, exactly like WhatsApp.** Tell Belluh a date in the app or text it on WhatsApp; both save to the same list. In the app you can also ask what it remembers (with when you told it), remove one, or pause reminders. Reminders arrive in the Belluh tab a week before and on the day, and on WhatsApp too if it's connected.
- **Sees your photos.** When you add a photo to an entry, or send one in the Belluh chat, Belluh looks at it. Only photos in your own private folder are ever sent to it.
- **Notifications.** Turn them on per device in Me → Settings: plans and notes from your partner, answers to your plans, Sunday's suggestion, Wednesday's check-in and date reminders. Messages are end-to-end encrypted to the browser (Web Push with Belluh's own VAPID key, made on first use and kept server-side). On iPhone, add Belluh to the Home Screen first.
- **Lives where you are, not in a chat tab.** Home leads with a stack of what Belluh has for you (an offer, a plan to pick, how last night went, a reminder), each with its buttons and a dismiss; its reply to an entry sits right under that entry; and the Ask Belluh bar opens your conversation as a panel over Home (Memory and Mediate inside). With a partner connected, the tab bar's Belluh tab is **Us**: the two of you and Belluh. It opens to your own thread when a note or something from Belluh is waiting. Notifications open Home with the panel up.
- **Carries notes to your partner, with your approval.** Ask it to help you say something to your partner; it drafts the note in your voice and shows **Send to Dan / Don't send**. Nothing is sent until you tap Send. Your partner sees it in their Belluh tab as "From Maya, via Belluh", with a pink dot on the tab.
- **Replies after you write, when it has something to add.** A small Belluh card appears after you save an entry, linking it to something earlier or asking one question. If it has nothing specific to say, it stays quiet.
- **Does things, not just suggests (and asks before anything that reaches your partner or costs money).**
  - **Reminders it sends itself:** "remind me to call his mom Sunday at 5" and it does, in the app, as a notification and by text.
  - **A table, ready to book:** for any dinner or drinks plan it prepares OpenTable (time and party size filled in) and Maps links. You finish the booking with one tap; it never claims something is booked.
  - **Gift ideas:** one to three, from things your partner said they love or wished for, each a link to buy.
  - **Your words in your journal:** text it how last night went and say "journal this"; it saves your own words as a private entry (only your words: anything you didn't say is refused).
- **Comes to you.** A job runs every 5 minutes (`belluh-nudges`) and, in the daytime, Belluh reaches out on its own, each at most once:
  - 10 to 14 days before a birthday or anniversary with nothing planned, it offers to plan it, in one line drawn from your journal. **Help me plan it** (or texting PLAN IT) runs it like a request; **Not now** closes it.
  - A plan your partner proposed that you haven't answered in 36 hours gets one nudge, with the times.
  - The morning after a plan you made together: "How was it?", with **Write about it**.
  These sit at the top of Home with their buttons, in the Belluh tab, as notifications and by text. Pausing reminders pauses them too.
- **A weekly loop.**
  - **Sunday morning:** each of you gets a short private insight in the Belluh tab, and you share one small thing to try together that week. The suggestion is written only from entries you both chose to share, because both of you see it.
  - **Wednesday evening:** a one-tap check-in for whoever hasn't answered.
  - **The next Sunday:** the suggestion builds on how it went, and goes lighter if you skipped.

  The shared suggestion also sits at the top of the home feed. One tap answers it, and the card then folds to a single line showing where each of you is. There's nothing to set up: the app saves your time zone when it opens, and Belluh only writes to people who've journaled in the last two weeks.
- **Us: one thread for both of you and Belluh.** In the Belluh tab, switch from Just you to Us. You, your partner and Belluh talk together; Belluh answers when asked (or named), can plan right in the thread, and your partner picks the time there. In Us, Belluh only gets what both of you can see: shared entries, the facts you both wrote, plans and the weekly loop. Never anyone's private entries, one-to-one memories or notes, and a daily answer only once you've both answered. Only the server writes the thread, so every message belongs to a real, connected couple.
- **Text it, too.** Connect Telegram, WhatsApp or SMS in Me → Settings and texting Belluh is the same Belluh: same thread, memory and tools. Plans and notes from your partner arrive on your phone; reply 1/2/3 to pick a time, SEND to send a note Belluh drafted, DID IT for the weekly check-in. See `docs/whatsapp-occasions.md`.
- **Plans things with your partner.** Ask "plan a dinner with Dan this week" and Belluh proposes up to three times (from what it knows: your entries, dates, and what's coming up), sends them to your partner as a card, and your partner picks one with a tap or says none work. The confirmed plan becomes a date for both of you with reminders, appears on Home, in **Our weeks**, and in your own calendar (one tap for Google, an .ics for Apple or Outlook, or a private subscription link in Me → Settings that keeps all plans and dates in sync). Belluh knows what you've planned next time either of you talks to it.
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
4. For the weekly loop: apply `20261012030000_weekly_loop.sql`, deploy `belluh-weekly --no-verify-jwt`, and schedule it hourly (see `docs/DEPLOY.md`).
5. For plans and calendars: apply `20261013020000_plans_calendar.sql` and deploy `belluh-calendar --no-verify-jwt`.
6. For reminders and reaching out: apply `20261015000000_belluh_acts.sql`, deploy `belluh-nudges --no-verify-jwt`, and schedule it every 5 minutes. The deploy workflow does all of this.

Until it is deployed, the Belluh tab falls back to the original chat. That chat also needs the `gemini-proxy` function (all AI now runs on the server), so deploy both together.

## Tests

`npm test` covers the privacy filter, prompt, tool validation, date logic and the weekly loop's schedule and prompts. `tests/e2e` runs everything against real Postgres with the migrations applied (29 API scenarios, plus browser checks for the app and the weekly card). `tests/gemini_loop.deno.test.ts` checks that tool calls run and their results go back to the model (`deno test --allow-env`).
