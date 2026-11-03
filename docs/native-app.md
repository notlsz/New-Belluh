# Belluh on the App Store and Google Play

The iOS and Android apps are the same Vite build as belluh.com, wrapped with Capacitor 8 (`capacitor.config.ts`, `ios/`, `android/`). What only the apps do:

| | iOS | Android |
|---|---|---|
| Photo library with real dates and places | PHPhotoLibrary, full or limited access | MediaStore, full or "selected photos" (Android 14+), ACCESS_MEDIA_LOCATION for GPS |
| Background preparation of new photos | BGProcessingTask `com.belluh.app.photos` | WorkManager (on new media, and every 6 hours) |
| Push notifications | APNs | Firebase Cloud Messaging |
| belluh.com links open the app | Universal Links | App Links |
| Share to Belluh | not yet (needs a Share Extension) | Share sheet, images |

The photo code is Belluh's own plugin in `native/belluh-native` (Swift and Kotlin, JS name `BelluhPhotos`). The web side switches on `Capacitor.isNativePlatform()` (`src/lib/native/platform.ts`); in a browser nothing changes.

**Photos and the index never leave the phone.** The plugin writes a 640 px copy of each photo to the app's private cache, the same on-device engine (`src/lib/memory`) indexes it, and the copy is deleted once indexed. The WebView storage that holds the index is excluded from iCloud backup (`AppDelegate.keepOffBackups`) and from Android backup and device transfer (`allowBackup="false"`, `data_extraction_rules.xml`). The image model runs in the WebView, which neither OS runs in the background, so background work reads dates, places and copies; understanding happens the next time Belluh opens, at once.

## Build it yourself

```bash
npm ci
npx vite build && npx cap sync      # copies dist/ into both projects
npx cap open ios                     # Xcode (macOS)
npx cap open android                 # Android Studio
```

CI (`.github/workflows/native-apps.yml`) builds a debug APK and an unsigned iOS build on every change, and signed store builds on `main` once the secrets below exist. Download builds from the run's Artifacts.

## What the founder does to ship

Nothing below is in the repo: every key goes into GitHub (Settings, Secrets and variables, Actions) or Vercel, never into code.

### 1. Apple (TestFlight)

1. Enroll in the Apple Developer Program as an organization (US$99 a year; needs a D-U-N-S number for the company). Note the 10-character **Team ID** (developer.apple.com, Membership).
2. Certificates, Identifiers and Profiles, Identifiers, add an App ID: bundle id **`com.belluh.app`**, with capabilities **Push Notifications** and **Associated Domains**.
3. App Store Connect, My Apps, new app: iOS, name Belluh, bundle id `com.belluh.app`, SKU `belluh-ios`.
4. App Store Connect, Users and Access, Integrations, App Store Connect API: generate a key with the **Admin** role (CI needs it to create the distribution certificate and profile itself). Download the `.p8` once.
5. Certificates, Identifiers and Profiles, Keys: create a key with **Apple Push Notifications service (APNs)**. Download that `.p8` too.
6. GitHub secrets:
   - `APPLE_TEAM_ID`: the Team ID
   - `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`: from step 4
   - `APP_STORE_CONNECT_KEY_P8`: the whole text of the step 4 `.p8`
   - `APNS_KEY_P8`: the whole text of the step 5 `.p8`; `APNS_KEY_ID`: its key id
7. Vercel, Belluh project, Environment Variables: `BELLUH_APPLE_TEAM_ID` = the Team ID. The next deploy serves `belluh.com/.well-known/apple-app-site-association` (invites, `/afterglow`, guides open the app).
8. Push to `main` (or run "Native apps" by hand with "release" ticked). The iOS job archives, signs in the cloud and uploads to TestFlight. In App Store Connect, TestFlight: answer export compliance (already declared: no non-exempt encryption), add yourself as an internal tester, install from the TestFlight app.

### 2. Google (Play internal testing)

1. Google Play Console account (US$25 once). Create the app: Belluh, package **`com.belluh.app`**.
2. Make the upload key once, on your own computer, and keep the file and passwords safe (a lost upload key can be reset by Play support, but it takes days):
   ```bash
   keytool -genkeypair -v -keystore belluh-upload.jks -alias belluh -keyalg RSA -keysize 4096 -validity 10000
   base64 -i belluh-upload.jks | pbcopy      # macOS; on Linux: base64 -w0 belluh-upload.jks
   ```
   GitHub secrets: `ANDROID_KEYSTORE_BASE64` (that output), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`belluh`), `ANDROID_KEY_PASSWORD`.
3. Firebase (console.firebase.google.com): add a project, add an Android app `com.belluh.app`, download `google-services.json`; GitHub secret `GOOGLE_SERVICES_JSON` = its text. Then Project settings, Service accounts, generate a private key; GitHub secret `FCM_SERVICE_ACCOUNT` = that JSON. Without these the Android app works but its notification switch says unsupported.
4. The first upload to Play is by hand: push to `main`, download `belluh-android-release` (the `.aab`) from the run, Play Console, Testing, Internal testing, create a release, upload it. Play App Signing turns on with it.
5. Optional, so later builds upload themselves: Play Console, Setup, API access, link a Google Cloud project, create a service account with "Release to testing tracks" on this app; GitHub secret `PLAY_SERVICE_ACCOUNT_JSON` = its key JSON. Builds then land in Internal testing as drafts.
6. Vercel: `BELLUH_ANDROID_CERT_SHA256` = the SHA-256 fingerprints of the upload key and Play's app signing key (Play Console, Setup, App signing), comma-separated. That publishes `belluh.com/.well-known/assetlinks.json`.
7. Play Console declarations: **Photo and video permissions**: Belluh's core feature reads the whole library on the device (Memory: dates, places and moments for the couple), so it declares READ_MEDIA_IMAGES and READ_MEDIA_VIDEO; if Google refuses, people on Android 14+ can still choose "selected photos". Also Data safety (below), content rating, target audience (18+), and the privacy policy URL `https://belluh.com/privacy`.

### 3. Supabase

Merging this deploys the `native_push_tokens` table and the `register_native_push` function (migration `20261103030000_native_push.sql`). The deploy workflow copies `APNS_KEY_P8`, `APNS_KEY_ID`, `APPLE_TEAM_ID` and `FCM_SERVICE_ACCOUNT` into the functions once they exist. Add `https://belluh.com/**` to Auth, URL Configuration, Redirect URLs if it isn't there, so email links open the app. Sign-in with email works in the app; any sign-in that redirects to another site in a browser window needs a deep-link return before it is offered in the app.

## App Store privacy label (from what the code sends)

Tracking: **No.** Nothing is used for advertising or shared with data brokers; Google Analytics runs with ad features off, and analytics load only after the person allows "Improving Belluh". No App Tracking Transparency prompt is needed.

| Data type | Collected | Linked to the person | Purpose | Where in the code |
|---|---|---|---|---|
| Name | Yes | Yes | App functionality | profile, partner invite |
| Email address | Yes | Yes | App functionality | Supabase Auth |
| Phone number | Yes, if they connect texting | Yes | App functionality | `whatsapp_links` (Bella over SMS, WhatsApp, iMessage) |
| Photos or videos | Yes, only photos they add to a journal entry | Yes | App functionality | storage bucket `journal-media` |
| Audio data | Yes, voice notes | Yes | App functionality | voice notes in journal entries |
| Other user content | Yes (journal entries, notes, messages to Bella, Clarity reflections) | Yes | App functionality, product personalization | journal and agent tables; text is sent to the AI through `gemini-proxy` |
| Purchase history | Yes, gifts and bookings Bella places | Yes | App functionality | `gift_orders`, `booking_orders` |
| Coarse location | Yes, only with Memory's Places on: about 1 km cells, kept as a shared map cache with no account on it | No | App functionality | `memory-places`, `memory_place_cells` |
| Product interaction | Yes, with "Improving Belluh" on | Yes | Analytics | `analytics_events`, Mixpanel, Google Analytics |
| Crash data | Yes, with "Improving Belluh" on | Yes | Analytics | `client_error` and `render_error` events |
| Other diagnostic data | Yes, Memory run reports (counts and timings), opt-in | No | Analytics | `memory-report` |
| User ID | Yes | Yes | App functionality | Supabase user id |
| Device ID | Yes, the notification token | Yes | App functionality | `native_push_tokens` |

**Not collected:** the photo library and everything Belluh Memory learns from it (labels, faces, places, screenshots' text) stay on the phone; precise location; contacts; browsing or search history (Memory searches run on the device); health data; financial info (payment happens on the shop's checkout). A screenshot's text is sent only when the person picks it and asks Bella to make a plan from it; that counts as other user content above.

Google Play Data safety uses the same answers: data is encrypted in transit, people can delete their account in the app (Settings, Delete account), and nothing is shared with third parties beyond service providers (Supabase, Google Gemini, Twilio and the messaging channels, Mixpanel and Google Analytics with consent).

## Before a public release

- **Share to Belluh on iOS:** needs a Share Extension target and an App Group (`group.com.belluh.app`) so Photos and Safari can hand a screenshot to the app. Android has it now.
- **App Review notes:** say that photo access powers on-device Memory and nothing is uploaded, and give a demo account with a partner already linked.
- **Icons and splash:** made from the 512 px `public/icon-512.png` (the dragonfly on white). A 1024 px master would make the App Store icon sharper; replace `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` and the `mipmap-*` files.
