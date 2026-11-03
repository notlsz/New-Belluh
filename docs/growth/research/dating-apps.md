# Dating apps: where couples met, and what Belluh can import

Research for "Bring your story from the app you met on" (src/lib/datingApps.ts, src/lib/datingImport.ts, src/components/HowWeMet.tsx). Collected 2026-11-02. **†** = unverified this session (prior knowledge, a source older than 2024, or a vendor summary that doesn't rank clearly); treat it as a lead. No dating app offers a public API to read a person's matches or chats, so the only routes are the apps' own data downloads (GDPR Art. 15/20, CCPA, and similar rights) and the screenshots on the person's phone.

## How Belluh reads each app

| Route | Apps | What happens |
|---|---|---|
| **Direct import** (a parser for the format) | Tinder, Hinge | The person drops the ZIP or JSON; Belluh opens it in the browser, ranks the matches, the person picks theirs, every other match is discarded |
| **Best-effort import** (the app has a data download, format not verified) | Bumble, Badoo, Grindr, happn, Meetic, LOVOO, OkCupid, Coffee Meets Bagel | Belluh tries any JSON in the file for message lists; if nothing reads, it offers screenshots |
| **Screenshots** (no usable self-serve download found) | Every Chinese, Japanese and Korean app listed, plus Azar, Boo, Omi, iHappy, Kismia, Snoggle, Once, Breeze, Duet, QuackQuack, Aisle, Muzz, HER | On-device OCR (tesseract.js, as Belluh Memory uses) reads the match screen and first messages |
| **Manual** | Any app | "Just the date, no file": the app and the day they matched |

## The formats Belluh parses

**Tinder** (`data.json`, inside the ZIP). Request: sign in to Tinder's Manage My Account tool (account.gotinder.com), tap Download My Information, enter an email; Tinder emails a link "within a few days" that expires after 24 hours; the ZIP holds an `index.html` and "may also include a machine-readable JSON version" ([Tinder help](https://www.help.tinder.com/hc/en-gb/articles/115005626726-How-do-I-request-a-copy-of-my-personal-data)). Top-level keys `Usage`, `Campaigns`, `Experiences`, `Purchases`, `Photos`, `Spotify`, `Messages`, `RoomsAndInteractions`, `User`; `Messages` is a list of `{ match_id, messages: [{ to, from, message, sent_date, type?, fixed_height? }] }`, where `from` is "You", `message` is HTML-escaped ("don&rsquo;t"), `sent_date` reads like "Tue, 30 Nov 2021 05:08:21 GMT", and `type` marks gifs, gestures and other non-text ([SwipeStats TinderDataJSON.ts](https://github.com/kristianeboe/swipestats.io/blob/770128a302a815c2d4041905e98dd4f19bf82736/src/lib/interfaces/TinderDataJSON.ts); usage keys also used by [tinderstats](https://github.com/mibeh/tinderstats/blob/master/tinderstats.py); the to/from/message/sent_date shape matches [Towards Data Science](https://towardsdatascience.com/diving-into-my-tinder-dat-e-a-a508269b8d10)). **The export holds only the messages the person sent, and no per-match match date** (only daily match counts in `Usage.matches`), so Belluh uses the first message day as the default "day we matched" and lets them change it.

**Hinge** (`matches.json`, with `user.json`, `prompts.json`, `media.json` in the ZIP). Request: Settings, Download My Data, choose your country, confirm the email; "most exports are ready within 30 days" and the download lasts 48 hours; exports exclude personal information about other members ([Hinge help](https://help.hinge.co/hc/en-us/articles/360011235813-How-do-I-request-a-copy-of-my-personal-data)). `matches.json` is a list of threads `{ like?: [{ timestamp, like: [{ timestamp, comment? }] }], match?: [{ timestamp }], chats?: [{ body, timestamp }], we_met?: [{ timestamp, did_meet_subject, was_my_type? }], block?: [{ block_type, timestamp }], voice_notes? }`; `chats` holds only messages the person sent ([SwipeStats HingeDataJSON.ts](https://github.com/Boe-Ventures/swipestats.io/blob/4b3f436ec3cccb58d798a6d49458dfc75ab72f18/src/lib/interfaces/HingeDataJSON.ts); the same field set in [HingeInformation](https://github.com/hughbe/HingeInformation)). Belluh reads the match timestamp as the day they matched and a "Yes" in `we_met` as a strong sign of the right match. Timestamps like "2024-05-10 21:30:00" are read as UTC †.

Because both exports contain only the person's own messages, nothing in them is the partner's words. Lines from screenshots, and any line the best-effort parser can't attribute, go to the partner for approval first.

## Other apps' data downloads

| App | Owner | Download exists | How to request | Format | Belluh |
|---|---|---|---|---|---|
| Bumble | Bumble Inc. | Yes, by request | Contact form, "Request my data" (Subject Access Request); up to 30 days; each person must request their own side of a conversation ([Bumble support](https://support.bumble.com/hc/en-us/articles/28783199493917-Requesting-your-data)) | Not stated † | Best effort, then screenshots |
| Grindr | Grindr Inc. | Yes, in app | Settings, Security and Privacy, Download My Data; part 1 is a ZIP saved straight away, part 2 arrives by email link in days (up to 15 to 30); each part has an HTML data dictionary; only chats you sent are included ([Grindr help](https://help.grindr.com/hc/en-us/articles/1500005257961-Accessing-your-personal-data)) | ZIP, file formats not stated † | Best effort, then screenshots; **name hidden by default** |
| Badoo, happn, Meetic, LOVOO, OkCupid, Coffee Meets Bagel | see list below | Legal right (GDPR/CCPA) †; self-serve tool not confirmed this session | The app's privacy or help settings † | Unknown † | Best effort, then screenshots |
| Momo, Tantan, Soul, Blued, 青藤之恋 | Hello Group (Momo, Tantan), Soulgate, Newborn Town (Blued), unverified | PIPL Art. 45 gives a right to a copy †; no self-serve export found | Customer service † | Unknown † | Screenshots |
| Pairs, タップル, with, ゼクシィ縁結び, Omiai | see list below | APPI disclosure request † | Written request to the operator † | Unknown † | Screenshots |
| 위피, 글램, 정오의데이트 | Wippy, unverified | PIPA access right † | Customer service † | Unknown † | Screenshots |

## Top 10 worldwide

By 2025 downloads, App Store and Google Play combined ([AppTweak, Jan to Dec 2025](https://www.apptweak.com/en/reports/most-downloaded-dating-apps)): 1 Tinder (Tinder LLC) 63.7M; 2 Bumble (Bumble Holding Limited) 29.2M; 3 Hinge (Hinge, Inc.) 21.3M; 4 Badoo (Badoo) 19.5M; 5 Boo (Boo Enterprises) 17.7M; 6 Omi (MatchUp UK Limited) 16.0M; 7 iHappy (ihappydate) 15.9M; 8 happn (happn) 12.8M; 9 Grindr (Grindr LLC) 12.3M; 10 Kismia (Kismia Group) 12.0M.

Import: Tinder and Hinge direct; Bumble, Badoo, happn and Grindr best effort; Boo, Omi, iHappy and Kismia by screenshots.

## Top 5 in China

China stays excluded as a launch market (strategy.md); the list serves Chinese-speaking couples abroad and the zh UI.

| App | Owner | Evidence | Belluh |
|---|---|---|---|
| 陌陌 Momo | Hello Group | Social-app MAU ranking Dec 2025, about 97M (MoonFox via AppGrowing white paper, pairing of figures approximate) ([PDF](https://pdf.dfcfw.com/pdf/H3_AP202603181820611106_1.pdf)); 3.9M paying users Q4 2025 ([Hello Group Q4 2025](https://www-web.itiger.com/news/2620287793)) | Screenshots |
| Soul | Soulgate | Same MoonFox ranking, about 33M MAU (approximate pairing); about 11M daily users in 2025 ([TechNode, Nov 2025](https://technode.com/2025/11/28/chinas-gen-z-social-platform-soul-app-files-for-hong-kong-listing/)) | Screenshots |
| 探探 Tantan | Hello Group | 0.6M paying users Q4 2025 ([Hello Group Q4 2025](https://www-web.itiger.com/news/2620287793)); no MAU found | Screenshots |
| Blued | Newborn Town | Operator confirmed ([Tiger/Bamboo Works, Jun 2025](https://www.itiger.com/news/2541302888)); no current user number found † | Screenshots; **name hidden by default** |
| 青藤之恋 Qingteng | unverified | Fifth place is **unverified**: no 2024 to 2026 ranking found; 牵手 and 二狗 are alternatives † | Screenshots |

## Belluh's top 15 markets (markets/index.json)

Per-country rankings come from Sensor Tower's Q4 2025 "Top 5 Dating Apps" pages (AI-written summaries of Sensor Tower data, published January 2026; unified iOS and Android unless marked Android). The summaries list five apps without a clear rank, so Belluh orders them by the active users each summary gives, and drops non-dating apps they include (Tea, yope, Yubo, Couple Joy, SwissTransfer, Meet5, social voice-chat apps).

| Rank | Market | Apps in Belluh's order | Source | Direct | Best effort | Screenshots |
|---|---|---|---|---|---|---|
| 1 | US | Tinder (~7M active), Hinge (~4.3M), Bumble (~3.4M), Duet (~1.2M) | [Sensor Tower US](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-us-64c9b6bbe1714cfff1c9d0e8) | Tinder, Hinge | Bumble | Duet |
| 2 | UK | Tinder, Hinge, Breeze, Azar (Android) | [Sensor Tower GB](https://sensortower.com/blog/2025-q4-android-top-5-dating-units-gb-64c9b6bbe1714cfff1c9d0e8) | Tinder, Hinge | | Breeze, Azar |
| 3 | France | Tinder (~1.5M), happn (~710K), Hinge (~600K), Meetic (~447K), Azar | [Sensor Tower FR](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-fr-64c9b6bbe1714cfff1c9d0e8) | Tinder, Hinge | happn, Meetic | Azar |
| 4 | Germany | Tinder (~1.58M), Bumble (~1.17M), Hinge (~658K), Snoggle, Azar | [Sensor Tower DE](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-de-64c9b6bbe1714cfff1c9d0e8) | Tinder, Hinge | Bumble | Snoggle, Azar |
| 5 | South Korea | 위피 Wippy, Tinder, 글램 Glam †, 정오의데이트 †| Wippy first and Tinder second by in-app revenue, Jan 2025 to Jan 2026 ([Sensor Tower KR, Feb 2026](https://sensortower.com/ko/blog/state-of-korea-dating-app-market)); Glam and Noondate unverified | Tinder | | Wippy, Glam, Noondate |
| 6 | Japan | Pairs 27.0%, タップル 15.2%, with 14.4%, Tinder 9.0%, ゼクシィ縁結び 7.2%, Omiai 6.4% | Most-used app in the last year, n=500, Aug 2026 ([日本マッチングアプリ機構 via PR TIMES](https://prtimes.jp/main/html/rd/p/000000004.000186185.html)); Tinder first by downloads, Pairs first by MAU, May 2022 to Apr 2025 ([Sensor Tower JP](https://sensortower.com/ja/blog/state-of-dating-apps-jp)) | Tinder | | Pairs, タップル, with, ゼクシィ縁結び, Omiai |
| 7 | Spain | Tinder (~1.1M), Bumble (~456K), Hinge (~249K), Azar | [Sensor Tower ES](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-es-64c9b6bbe1714cfff1c9d0e8) | Tinder, Hinge | Bumble | Azar |
| 8 | Canada | Tinder (~870K app MAU), Bumble (~578K), Hinge (~532K) | Mar 2025 ([Sensor Tower CA](https://sensortower.com/blog/2025-q1-ca-leading-3-Dating---Social-Discovery-brands)) | Tinder, Hinge | Bumble | |
| 9 | India | QuackQuack, Tinder, Bumble, Aisle † | Google Play daily downloads Aug 2021 to Feb 2022 ([AppTweak via Free Press Journal](https://www.freepressjournal.in/technology/few-local-indian-apps-overtake-well-known-global-dating-apps-report)): **older than 2024, unverified for today**; Aisle † | Tinder | Bumble | QuackQuack, Aisle |
| 10 | Australia | Tinder (~425K), Hinge (~349K), Bumble | [Sensor Tower AU](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-au-64c9b6bbe1714cfff1c9d0e8) | Tinder, Hinge | Bumble | |
| 11 | Italy | Tinder (~939K), Hinge (~342K), Azar, Once | [Sensor Tower IT](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-it-64c9b6bbe1714cfff1c9d0e8) (also lists Tablo, a social app) | Tinder, Hinge | | Azar, Once |
| 12 | Brazil | Tinder (~3.5M); Badoo †, Bumble † | Tinder is the only dating app in [Sensor Tower BR](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-br-64c9b6bbe1714cfff1c9d0e8) (the rest are chat apps); Badoo and Bumble unverified | Tinder | Badoo, Bumble | |
| 13 | UAE | Tinder (~50K); Bumble †, Hinge †, Muzz † | Tinder is the only dating app in [Sensor Tower AE](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-ae-64c9b6bbe1714cfff1c9d0e8); the others unverified. **Discreet mode is on by default here** | Tinder, Hinge | Bumble | Muzz |
| 14 | Netherlands | Tinder (~110K), Bumble (~96K), happn (~52K) (Android) | [Sensor Tower NL](https://sensortower.com/blog/2025-q4-android-top-5-dating-units-nl-64c9b6bbe1714cfff1c9d0e8) | Tinder | Bumble, happn | |
| 15 | Singapore | Tinder 53%, Coffee Meets Bagel 42%, Bumble 34%, OkCupid 30%, Hinge 14% | Share of dating-app users who used each, Feb 2025, n=1,061 ([YouGov](https://business.yougov.com/content/51592-tinder-is-the-most-popular-dating-app-across-apac-but-local-apps-have-a-considerable-presence)) | Tinder, Hinge | CMB, Bumble, OkCupid | |

Also in the app: Switzerland (Tinder, Bumble, Hinge, Azar; [Sensor Tower CH](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-ch-64c9b6bbe1714cfff1c9d0e8)), Mexico (Tinder; Bumble †; [Sensor Tower MX](https://sensortower.com/blog/2025-q4-unified-top-5-dating-units-mx-64c9b6bbe1714cfff1c9d0e8)) and Hong Kong (Tinder 46%, Coffee Meets Bagel 30%, Tantan 19%, Bumble 19%; [YouGov](https://business.yougov.com/content/51592-tinder-is-the-most-popular-dating-app-across-apac-but-local-apps-have-a-considerable-presence)). Indonesia's YouGov list (Tinder 53%, Tantan 41%, Bumble 24%, Omi 23%) is in the same source; Indonesia isn't given a local list yet.

## Owners not verified this session †

Tinder, Hinge, OkCupid, Meetic, Pairs (Eureka) and Azar (Hyperconnect) as Match Group; Badoo as Bumble Inc.; LOVOO as ParshipMeet; タップル as CyberAgent; ゼクシィ縁結び as Recruit; Omiai as Enito; Aisle as Info Edge; the owners of with, Glam, 정오의데이트, Duet and 青藤之恋. Publisher names for the top 10 come from AppTweak; Hello Group, Soulgate and Newborn Town from the sources above.

## Privacy and safety decisions

- Apps whose use can reveal sexuality (Grindr, Blued, HER) never have their name saved by default; in discreet mode no app name is saved by default. The name is saved only as the `dating_app:<id>` tag and the entry's words, only when the person turns on "Name {app} in our story".
- Analytics get one event, `how_we_met_saved`, with counts only (lines kept, lines pending); never the app.
- The file and screenshots are read in the browser. Other matches are discarded in memory the moment the person picks theirs (`keepOnly`).
- Partner approval: `story_approvals` (migration 20261102080000) holds lines that may be the partner's words; only the partner can approve (`decide_story_approval`), approval writes the journal entry, decline deletes the words.

## Not done or open

- Bumble, Badoo, happn, Meetic, LOVOO, OkCupid, Coffee Meets Bagel and Grindr export formats are unverified; Belluh's generic reader may not read them. Get a real (consenting, internal) export of each and add a parser plus a synthetic fixture.
- No current India ranking from 2024 to 2026 was found; Korea's third and fourth apps and China's fifth are unverified.
- Discreet mode has no user-facing switch in the app yet; it is the country default (or a `belluh_discreet` value on the device).
