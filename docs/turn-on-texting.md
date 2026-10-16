# Turn on texting Belluh

All three channels are built and tested: Telegram, WhatsApp and SMS run the same Belluh as the app (journal, plans, reminders, gifts, tables, dinner, rides), with links to finish each thing. Each one turns on when its secrets exist. Nothing else needs changing in the code.

Two places hold the settings:

- **GitHub** → notlsz/New-Belluh → Settings → Secrets and variables → Actions. The deploy workflow (`.github/workflows/supabase-deploy.yml`) copies these into Supabase, deploys the webhooks and prints each webhook URL.
- **Vercel** → the Belluh project → Settings → Environment Variables (Production). These tell the app which buttons to show in Me → Settings. Until one is set, Settings says "Texting Belluh is coming soon".

After adding secrets, run the workflow (Actions → Deploy Supabase backend → Run workflow). After adding a Vercel variable, redeploy production.

## 1. Telegram (do this first, about ten minutes)

No business number, carrier registration or message review.

1. In Telegram, open @BotFather, send `/newbot`, name it Belluh, pick a username such as `BelluhBot`. BotFather replies with a token.
2. GitHub secret `TELEGRAM_BOT_TOKEN` = that token.
3. Run the workflow. It stores the token, deploys `telegram-webhook`, registers the webhook with a secret derived from the token, and sets the bot's menu.
4. Vercel variable `VITE_BELLUH_TELEGRAM_BOT` = the username without the @ (for example `BelluhBot`). Redeploy.
5. Check: Me → Settings → Connect Telegram, tap Start in Telegram, then send "remind me to call mom tomorrow at 5".

## 2. WhatsApp (a few days, mostly Meta's review)

1. Meta for Developers → create a **Business** app → add **WhatsApp**. Add and verify Belluh's phone number and note its **Phone number ID**.
2. Business Settings → System users → create one with a permanent token that has `whatsapp_business_messaging` and `whatsapp_business_management`.
3. App settings → Basic → note the **App secret**.
4. Submit the two Utility templates, `occasion_reminder` and `belluh_update`, with the exact text in `docs/whatsapp-occasions.md` (section 2).
5. GitHub secrets: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, and `WHATSAPP_VERIFY_TOKEN` (any long random string you choose).
6. Run the workflow. In Meta → WhatsApp → Configuration, set the callback URL it prints (`https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`) with the same verify token, and subscribe to **messages**.
7. Vercel variable `VITE_BELLUH_WHATSAPP_NUMBER` = the number, digits only (for example `15551234567`). Redeploy.

Policy: since January 15, 2026 Meta's WhatsApp Business terms bar general-purpose AI assistants. Belluh is scoped to one relationship and its plans, reminders and errands, but Meta decides; if Meta pushes back, keep WhatsApp to reminders and plans and point everything else to Telegram, SMS or the app.

## 3. SMS (Twilio, one to three weeks for US carrier registration)

1. Twilio → buy a US number. Register the brand and an **A2P 10DLC** campaign; unregistered US traffic is blocked. Putting the number in a Messaging Service is simplest.
2. The number's (or Messaging Service's) **A message comes in** → `https://<project-ref>.supabase.co/functions/v1/sms-webhook`, HTTP POST.
3. GitHub secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (the number in E.164, or the Messaging Service SID starting with `MG`).
4. Run the workflow.
5. Vercel variable `VITE_BELLUH_SMS_NUMBER` = the number in E.164 (for example `+15551234567`). Redeploy.

## What Belluh does and doesn't finish

Belluh gets things ready and the person finishes them with one tap. It never says something is ordered, bought or booked.

| Ask | What comes back |
|---|---|
| A table | OpenTable with the date, time and party size filled in, and Google Maps nearby |
| Flowers | Florists that deliver to that place, with the date, plus the card message |
| A gift or "buy …" | Real products from independent Shopify shops, each opening that shop's checkout with the item in the cart (Shop Pay), then Amazon and Target |
| Dinner, groceries, a ride, tickets | DoorDash and Uber Eats; Instacart; Uber and Lyft with the destination set; ticket sites |

Shopify products come from Shopify's Global Catalog (`supabase/functions/_shared/shopify.ts`). It needs no key. Belluh's agent profile is served at `https://www.belluh.com/ucp/agent-profile.json`. Shopify rate-limits keyless use and says it is not for production at scale, so when traffic grows, set up authenticated catalog access in Shopify's Dev Dashboard (see shopify.dev/docs/agents/catalog) and point `SHOPIFY_CATALOG_URL` at it.
