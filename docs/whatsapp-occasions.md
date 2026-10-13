# WhatsApp: Belluh remembers every date

Users text Belluh on WhatsApp ("Maya's birthday is May 12"). Belluh saves the date, remembers when they first said it, and sends a reminder a week before and on the day.

It is deliberately a date-capture and reminder service, not a chat companion. Meta's WhatsApp Business rules (in force for all businesses since January 15, 2026) ban AI providers from offering general-purpose assistants on WhatsApp; structured reminder bots are allowed. Keep it that way: anything that isn't a date gets a short "I only keep dates here" reply.

## What's in the code

| Piece | File |
|---|---|
| Tables, access rules, link-code function | `supabase/migrations/20261012000000_occasions_whatsapp.sql` |
| Webhook (receives messages, saves dates, replies) | `supabase/functions/whatsapp-webhook/index.ts` |
| Hourly reminder job | `supabase/functions/occasion-reminders/index.ts` |
| Shared date logic (unit-tested) | `supabase/functions/_shared/occasions.ts`, `tests/occasions.test.ts` |
| "Connect WhatsApp" card and dates list | `src/components/WhatsAppDates.tsx`, shown on the Profile page |

What users can text:

- Any sentence with a date → saved, confirmed with "Saved: Maya's birthday, May 12 ✓". Repeats are recognised: "Already saved (you told me on Mar 3, 2026)".
- `LIST` → every date, soonest first, with when they first mentioned it.
- `FORGET <name>` → removes one.
- `STOP` / `START` → pause or resume reminders.
- `LINK <code>` → connects their number to their Belluh account (the code comes from the Profile page).

## Setup, in order

### 1. Supabase project
Belluh's Supabase project (`ctbsycrlakdanfzbaqmz`) was not responding on Oct 12, 2026. Restore it first, or create a new one and update the app's Supabase URL and key.

Apply the migration (SQL editor or `supabase db push`).

### 2. Meta (WhatsApp Business Platform)
1. In Meta for Developers, create an app of type **Business** and add the **WhatsApp** product.
2. Add and verify a phone number for Belluh. Note its **Phone number ID**.
3. Create a **System user** in Business Settings with a permanent access token that has `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Note the app's **App secret** (App settings → Basic).
5. Submit this message template (category **Utility**, language **English (US)**, name `occasion_reminder`):

   > Belluh reminder: {{1}} is {{2}}, {{3}}. You first told me about it on {{4}}. Reply STOP to pause reminders.

   Sample values for Meta's review: `Maya's birthday`, `in one week`, `May 12`, `Mar 3, 2026`.

   And a second one (category **Utility**, name `belluh_update`), used when Belluh has something for the person more than 24 hours after they last texted (a plan their partner sent, a note, Sunday's suggestion):

   > Belluh: {{1}}
   >
   > Reply here to answer, or open the Belluh app.

   Sample value: `Maya wants to plan "Dinner at the Thai place" with you. Pick a time: 1) Fri, Oct 16 · 7:00 PM 2) Sat, Oct 17 · 7:00 PM. Reply 1, 2, or NONE.`

### 3. Secrets (Supabase → Edge Functions → Secrets)

| Name | Value |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | system-user token from step 2.3 |
| `WHATSAPP_PHONE_NUMBER_ID` | from step 2.2 |
| `WHATSAPP_APP_SECRET` | from step 2.4 |
| `WHATSAPP_VERIFY_TOKEN` | any long random string you choose |
| `GEMINI_API_KEY` | a server-side Gemini key (keep it out of the browser) |
| `CRON_SECRET` | another long random string |
| `GEMINI_MODEL` | optional, default `gemini-2.5-flash` |
| `REMINDER_LOCAL_HOUR` | optional, default `9` (9am in each user's time zone) |

### 4. Deploy

```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy occasion-reminders --no-verify-jwt
```

`--no-verify-jwt` is required because Meta and cron can't send a Supabase login token. The webhook checks Meta's signature on every request instead, and the reminder job checks `CRON_SECRET`.

### 5. Point Meta at the webhook
In the WhatsApp product → Configuration → Webhook:
- Callback URL: `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`
- Verify token: the `WHATSAPP_VERIFY_TOKEN` value
- Subscribe to the **messages** field.

### 6. Schedule reminders (SQL editor)

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('occasion-reminders', '5 * * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/occasion-reminders',
    headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>')
  );
$$);
```

It runs every hour. Each user gets reminders from 9am in their own time zone; a failed send retries the next hour, and a send never repeats.

To test without waiting, call `.../occasion-reminders?force=1` with the `x-cron-secret` header.

### 7. App
Set `VITE_BELLUH_WHATSAPP_NUMBER` in Vercel to Belluh's WhatsApp number (digits only, with country code). Me → Settings then shows **Connect WhatsApp**, which gives the user a code and an "Open WhatsApp" button with `LINK <code>` pre-filled.

## Belluh by text

Once connected, texting Belluh is talking to Belluh: the same thread, memory and tools as the Belluh tab (a message sent from the phone shows in the app marked "via WhatsApp" or "via text"). Short replies do things directly:

- **SEND** / **DISCARD**: the note Belluh just drafted to your partner
- **1**, **2**, **3** / **NONE** (optionally with a note): answer a plan your partner sent
- **DID IT** / **NOT YET** / **SKIP**: this week's thing to try together
- **LIST**, **FORGET <name>**: your dates
- **STOP** / **START**: pause or resume everything Belluh sends first (reminders, plans, notes, Sunday's suggestion). Replies to your own texts always come.

Belluh messages you first when your partner sends a plan or a note, when they answer your plan, on Sunday (insight plus the week's suggestion) and Wednesday (check-in), and for date reminders.

## SMS (Twilio), the same thing by plain text

Everything above also works by SMS: one-tap **Connect by text** (opens Messages with `LINK <code>` typed in), texting a date, LIST, FORGET, STOP/START, and reminders a week before and on the day. A person links one number; Belluh replies and reminds on whichever of WhatsApp or SMS they last texted from.

1. Twilio: buy a number. For US numbers, register the brand and an A2P 10DLC campaign (use case "Account notifications"); unregistered US traffic is blocked. Creating a Messaging Service and putting the number in it is the simplest way.
2. In the number's (or Messaging Service's) settings, set **A message comes in** to `https://<project-ref>.supabase.co/functions/v1/sms-webhook`, HTTP POST.
3. GitHub secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (the number in E.164, or the Messaging Service SID starting with `MG`). The deploy workflow sets them and deploys `sms-webhook`.
4. Vercel: `VITE_BELLUH_SMS_NUMBER` = the number, e.g. `+15551234567`.

Every request is checked against Twilio's signature (`X-Twilio-Signature`) using the auth token. If the project is behind a custom domain, set the `SMS_WEBHOOK_URL` secret to the exact URL Twilio calls. Twilio's own STOP handling also applies to SMS.

## Not possible: Snapchat, iMessage

Snapchat has no API for reading or sending chats (Snap Kit only offers login, sharing and Bitmoji), so Belluh can't sync Snapchat. iMessage needs Apple Messages for Business through an approved messaging provider and only works when the user starts the chat from Apple's apps; SMS reaches iPhones today.

## Costs
Meta charges per delivered template message, by country; reminders are always templates. Replies to a user's own message are free-form; check Meta's current rate card for whether those are charged in your markets.

## Testing

```bash
npm test     # date logic, signature checks, replies
```

The migration and access rules were tested on Postgres 16. The webhook's verification handshake and signature checks were tested locally. The full flow (Meta → webhook → database → reply) still needs one real test once the credentials above exist.
