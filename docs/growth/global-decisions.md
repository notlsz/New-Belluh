# Global decisions

Apply in every market unless a market file overrides them.

## Seven decisions apply in every market

### Price on a six-step ladder and keep annual at six months' price

The current plan prices annual at 6× monthly ($179.99 vs $29.99). Keep that ratio in every tier so the annual plan reads as "half off" everywhere. Spotify Duo's LatAm ratios (Brazil about 0.39×, Mexico about 0.66× the US price) show couples-plan pricing is familiar and steeply discounted outside the US ([Digital Music News](https://www.digitalmusicnews.com/?p=248538)).

| Tier | × US | Duo/mo, est. (annual = 6×) | Markets |
|---|---|---|---|
| **T1 Premium** | 0.9 to 1.0 | US/PR $29.99; CH CHF 29.90; NO NOK 299; DK DKK 199; IS ISK 3,990; AU A$44.99; NZ NZ$47.99; IL ₪99; CA C$39.99 | US, PR, CH, NO, DK, IS, AU, NZ, IL, CA |
| **T2 High** | 0.75 to 0.9 | UK £22.99; IE/LU €26.99; SE SEK 279; DE/FR/NL/BE/AT/FI €24.99; SG S$29.98; HK HK$178; AE AED 79; QA QAR 79 | Western Europe core, SG, HK, UAE, Qatar |
| **T3 Mid** | 0.55 to 0.7 | IT/ES €19.99; PT/GR/CY/MT/SI/EE €16.99; JP ¥2,900; KR ₩27,000; SA SAR 69; KW KWD 5.9; BH BHD 6.9; OM OMR 6.9; JO JOD 11.9; MX MX$299 to 349 | Southern Europe, JP, KR, Gulf, Mexico |
| **T4 Value** | 0.45 to 0.55 | LV/LT/SK/HR €14.99; PL PLN 59.99; CZ CZK 399; HU HUF 5,990; RO RON 59.99; TW NT$490; CL CLP 12,990 to 14,990; PE S/44.90 to 49.90; CR/EC/GT/PA US$14.99 | CEE, Taiwan, Andean and Central America |
| **T5 Emerging** | 0.3 to 0.45 | BR R$59.90 to 69.90; AR ARS indexed monthly (~$10 to 11); CO COP 39,900 to 44,900; TR ₺399 (reprice quarterly); ZA R219; MY RM49.90; TH ฿349; PH ₱549; VN ₫229,000; KZ KZT 4,990; MA MAD 119; KE KSh 1,299; BG €11.99; RS RSD 1,290 | Brazil, Southern Cone, Türkiye, SEA, Balkans |
| **T6 Pass** | 0.2 to 0.3 | IN ₹599 (+ ₹199 30-day pass); ID Rp129,000; PK PKR 1,999; BD BDT 799; LK LKR 2,490; NG ₦9,900; EG EGP 299; GH GHS 119; UA UAH 299 | South Asia, Indonesia, West and East Africa, Egypt, Ukraine |

Two adjustments override the ladder. **Japan should test above its tier**: it had by far the highest per-capita App Store spend in Sensor Tower's 2012 to 2017 series ($214 against about $92 in the US), so run ¥2,900 against a higher price ([Sensor Tower](https://sensortower.com/blog/per-capita-app-store-spending)). **Messaging costs set the floor in Western Europe**: WhatsApp Business bills proactive template messages per country, and "anniversary in 3 days" nudges are templates. DE, FR and NL are among the dearest†, so model template cost per paying couple before locking T2 prices.

### Bella's channel decides the market, not the UI language

| Channel | Status | Primary in | Value unlocked | Verdict |
|---|---|---|---|---|
| iMessage + SMS/RCS | Shipped | US (RCS 80% reach, WhatsApp 30%), 88% of US teens on iPhone; AU/NZ/CA one-to-one | Rank 1 alone | Keep; RCS fallback for mixed iPhone/Android couples ([Infobip](https://www.infobip.com/messaging-trends-report/regional-snapshot); [MacRumors](https://www.macrumors.com/2025/04/09/teen-iphone-ownership-continues-to-soar/)) |
| WhatsApp | Shipped | Western and Southern Europe, all of LatAm (Mexico 90%, Brazil 85%), India, SG, Gulf, Türkiye, Africa | About 60 of the top 100 | Keep; budget template costs per country |
| LINE | Shipped | Japan (LINE leads), Taiwan, Thailand | Ranks 6, 28 and Taiwan | Keep; add LINE Gift |
| Telegram | Shipped | Ukraine, Kazakhstan, Uzbekistan, Kyrgyzstan† | Ranks 44 to 100 | Keep, low priority |
| **KakaoTalk** | **Missing** | Korea (48.19M MAU) ([Korea Times](https://www.koreatimes.co.kr/business/companies/20250924/kakaotalk-leads-in-users-tiktok-lite-in-usage-time-data)) | Rank 5 | **Build first** |
| **Messenger** | **Missing** | Canada (55%, top), Australia, NZ, Sweden, Norway, Denmark, Philippines; split with WhatsApp in PL, CZ, SK, HU, RO, Baltics ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | Ranks 8, 10, 19, 23, 30, 33, 46 plus CEE | **Build second** |
| Viber | Missing | Bulgaria, Greece, Serbia, Hungary, Ukraine, Cyprus, Balkans, Philippines, Sri Lanka† | Mostly ranks 40 to 90 | Wave 3 |
| Zalo | Missing | Vietnam (Zalo leads) | Rank 34 | Wave 3 |
| WeChat | Missing | China | Excluded | Do not build |

Survey data puts **Messenger, not iMessage, at the top in Australia and New Zealand** ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)). iMessage and SMS still work for one-to-one couple threads, so these markets can launch in Wave 1, but Messenger is the bigger unlock across the top 25 than any single new language.

### One safety baseline that satisfies the strictest regime

Belluh already ships a crisis check with local lines and a 3-hourly AI disclosure. The table shows what each regime still asks for. The design question underneath is whether Bella is a "companion". New York's definition covers AI that retains memory, asks unprompted emotion-based questions and sustains personal dialogue, which a relationship agent plausibly meets. California excludes productivity bots, but whether a planner-booker qualifies is untested. Comply with both, and frame Bella as a planner in marketing anyway ([Morrison Foerster](https://www.mofo.com/resources/insights/251120-new-york-and-california-enact-landmark-ai)).

| Regime | In force | Requirement | Belluh status | Still to do |
|---|---|---|---|---|
| NY GBL Art. 47 | Nov 5 2025 | "AI, not human" notice at start and every 3 hours; self-harm detection and referral; AG penalties up to $15,000/day ([NY Senate](https://www.nysenate.gov/legislation/laws/GBS/A47)) | Shipped | Log disclosures per thread as evidence |
| California SB 243 | Jan 1 2026 | Disclosure; **published** suicide protocol; "may be unsuitable for minors" notice; break reminders and sexual-content safeguards for known minors; private right of action ($1,000/violation); annual reports to the Office of Suicide Prevention from **Jul 1 2027** ([Perkins Coie](https://perkinscoie.com/insights/update/california-companion-chatbot-law-now-effect)) | Partial | Publish the protocol page; 18+ gate; build the report pipeline |
| FTC 6(b) inquiry | Sep 11 2025 | Orders to 7 companion operators on monetisation, engagement features and minors ([DLA Piper](https://www.dlapiper.com/insights/publications/2025/09/ftc-ai-chatbots)) | n/a | Avoid engagement dark patterns; document harm testing |
| EU AI Act Art. 50 | Aug 2 2026 (not delayed) | Tell users they're dealing with AI; machine-readable marking of generated content by **Dec 2 2026** for systems already on the market; fines to €15M or 3% ([Baker Botts](https://www.bakerbotts.com/thought-leadership/publications/2026/september/eu-ai-act-article-50-transparency-obligations-go-live)) | Disclosure shipped | Watermark any Bella-generated images or cards by Dec 2 |
| Italy (Garante + Law 132/2025) | Fine May 2025; law Oct 10 2025 | €5M fine on Replika's maker for missing legal basis, transparency and age checks ([The Star/Reuters](https://www.thestar.com.my/tech/tech-news/2025/05/19/italy039s-data-watchdog-fines-ai-company-replika039s-developer-56-million)); parental consent under 14† ([Norton Rose](https://www.nortonrosefulbright.com/en-fr/inside-fintech/blog/2025/10/italy-new-law-on-artificial-intelligence-law-no-132-2025)) | Gap | DPIA, verified 18+, Italian notices before any spend |
| Korea AI Basic Act | Jan 22 2026 | Advance AI notice; label generative output; local agent above 1M daily Korean users; fines to KRW 30M after a one-year grace ([Cooley](https://www.cooley.com/news/insight/2026/2026-01-27-south-koreas-ai-basic-act-overview-and-key-takeaways)) | Disclosure shipped | Korean-language labels at launch |
| Australia eSafety codes | In force | Companion chatbots must shield children from sexual content and give crisis info; breach of a direction up to A$49.5M ([eSafety](https://esafety.gov.au/newsroom/media-releases/esafety-report-shows-ai-companions-are-putting-children-at-risk)); app-store age checks floated Mar 2026 ([The Star/Reuters](https://www.thestar.com.my/tech/tech-news/2026/03/02/exclusive-australia-says-it-may-go-after-app-stores-search-engines-in-ai-age-crackdown)) | Crisis shipped | Age assurance |
| Consumer cancellation | DE Jul 1 2022; FR Jun 1 2023 | Kündigungsbutton (§312k BGB)†; 3-click cancel† | Unknown | Build into web billing |
| Quebec Charter / Bill 96 | Signage rules Jun 1 2025 | French websites; French-first contracts of adhesion† ([McCarthy Tétrault](https://www.mccarthy.ca/en/insights/blogs/consumer-markets-perspectives/french-language-requirements-bill-96-and-june-1-2025-common-misconceptions)) | fr shipped | fr-CA variant, French-first ToS |
| India DPDP + IT Rules | Rules Nov 13 2025; duties ~May 2027; AI labelling Feb 20 2026 ([Chambers](https://chambers.com/articles/s-r-data-india-s-digital-personal-data-protection-regime-takes-effect); [Latham](https://www.lw.com/en/insights/2026/09/ai-regulation-in-apac-diverging-approaches-across-the-region)) | Notice, consent, labelling | Disclosure shipped | Consent manager flow before May 2027 |
| Vietnam AI Law | Mar 1 2026 ([Latham](https://www.lw.com/en/insights/2026/09/ai-regulation-in-apac-diverging-approaches-across-the-region)) | Risk-tiered duties | n/a | Review before Wave 3 |

### Treat the journal like health data

A shared love journal holds data on a person's **sex life and sexual orientation**, which GDPR Article 9 makes a special category: processing needs **explicit consent** or another narrow exception ([GDPR Art. 9](https://gdpr-info.eu/art-9-gdpr/)). It also holds data about third parties (exes, in-laws) and about each partner that the other wrote. Italy has shown it will fine a companion app over legal basis and age checks ([EDPB](https://www.edpb.europa.eu/news/ai-the-italian-supervisory-authority-fines-company-behind-chatbot-replika_fr)). The controls below apply globally because they are cheaper to build once than per country.

| Control | Implementation |
|---|---|
| Legal basis | Separate explicit-consent screen for intimate and orientation data, per partner, revocable in one tap |
| Two-person consent | Each entry is private, shared or "shared after reveal"; one partner can never pull the other's private entries |
| Model training | Off by default; opt-in only, separate consent (also required by China's rules, a useful global high-water mark) |
| DPIA | One EU DPIA covering journal, Bella memory and channel relays; translate it for the Garante and the CNIL |
| Residency | EU hosting for EU/UK/CH users, stated on the paywall; Swiss revFADP† |
| Channel exposure | Bella's WhatsApp, LINE and SMS messages leave the encrypted app. Keep intimate content out of channel messages and link back into the app instead |
| Breakup flow | One-tap split that gives each partner an export of their own entries and deletes shared Bella memory |
| Retention | Short default retention for Bella conversation logs; journal kept until the user deletes it |

### Discreet mode is mandatory in 22 criminalising markets

Sixty-five jurisdictions criminalise same-sex relations, and the count rose in 2025 for the first time in nearly a decade ([PinkNews](https://www.thepinknews.com/2025/07/09/how-many-countries-is-it-illegal-to-be-gay/); [GCN/ILGA](https://gcn.ie/countries-criminalising-same-sex-acts-2025/)). The accessible top 100 includes the **UAE (death penalty possible), Saudi Arabia, Malaysia, Indonesia, Egypt, Qatar, Kuwait, Bangladesh, Pakistan, Uzbekistan, Nigeria, Oman, Algeria, Morocco, Iraq, Sri Lanka, Ghana, Kenya, Tunisia, Jamaica, Lebanon and Brunei** (Brunei: death penalty possible, moratorium since 2019). Ghana's parliament passed a bill on May 29 2026 punishing LGBTQ+ identification with up to 3 years; the President had not signed it as of late June ([Africanews](https://www.africanews.com/2026/05/29/ghana-approves-sweeping-anti-lgbtq-law/); [Urania](https://www.urania.institute/en/news/2026/0629-ghana-lgbtq-law-president-signature/)). Kazakhstan signed a "propaganda" ban in January 2026 without criminalising acts ([PinkNews](https://www.thepinknews.com/2026/01/05/kazakhstan-lgbtq-propaganda-bill-law/)), and Hungary restricts same-sex imagery in content seen by minors†.

**Indonesia** is flagged in the ranking as criminalising, but national law is silent: Aceh criminalises same-sex acts, and the new Criminal Code (in force Jan 2 2026) is reported to criminalise extramarital sex and **unmarried cohabitation on complaint by a spouse, parent or child†**. Treat the cohabitation provision as unverified until a legal check, and market only to engaged and married couples there.

The product stays fully inclusive everywhere; what changes is exposure. In these markets, discreet mode should be **on by default**:

| Risk | Default in criminalising markets |
|---|---|
| Lock-screen outing | Neutral notification previews ("You have a new note"), with no partner name, pronoun or content |
| Bella on a shared or inspected phone | Bella's channel messages are neutral and contain no intimate content; a "Bella goes quiet" code word pauses outbound messages |
| Device inspection | App lock (PIN or biometric) and an optional neutral icon and name |
| Data seizure or subpoena | No sexual-orientation field stored in plaintext; partner gender not required; journal encrypted; minimal log retention; no in-country storage unless the law compels it† |
| Marketing | No same-sex imagery or LGBTQ-targeted ads; store screenshots show neutral or opposite-sex couples; never geo-target LGBTQ interests |
| Payment trail | Neutral billing descriptor ("BELLUH APP") with no "couples" or "love" wording |
| Staff and partners | Never share couple composition with local florists, restaurants or partners. Bella orders in the user's own name |

Apply the same defaults, opt-out rather than forced, in markets without legal recognition but with hostile climates: Türkiye (Pride banned†), Peru, Paraguay, Dominican Republic, Honduras, Poland, Romania, Bulgaria, Slovakia, Lithuania, Serbia and Ukraine.

### Gifts and bookings carry the low-ARPU half of the map

Evidence on couples-app conversion is thin but consistent. Paired, the largest Western player found, has **12.7M lifetime iOS installs, a 4.70 rating and an estimated 483K MAU**, with revenue in a "$10K+ per month" bucket (a floor, likely understated) ([AppGoblin](https://appgoblin.info/apps/1469609343/trends)). China's 恋爱记 (Lianaiji) has about 2.1M MAU and earns **76% of its revenue from ads**, built on streaks, a shared pet and couple games ([AppGoblin](https://appgoblin.info/apps/590246583)). Lasting proved there is demand for counselling-style content when Talkspace bought it ([Business Wire](https://www.businesswire.com/news/home/20201112005199/en/Talkspace-Announces-Acquisition-of-Leading-Relationship-Counseling-App-Lasting)). A $29.99 Duo plan sits far above typical couples-app pricing, closer to therapy or concierge pricing, so Bella's booking and gifting has to justify it.

The occasion economics are real where there is a peak. Brazil's Giuliana Flores calls June 12 "our Christmas", handles **800K+ orders a year at an average ticket of R$215 to 220**, and projected 14% growth for 2025 ([Times Brasil](https://timesbrasil.com.br/empresas-e-negocios/giuliana-flores-dia-namorados-vendas-flor-crescimento-receita-expansao/)). Brazilian e-commerce was projected at R$9.23B for that one date ([Estado de Minas](https://www.em.com.br/mundo-corporativo/2025/06/7168926-comercio-eletronico-deve-movimentar-rs-923-bilhoes-no-dia-dos-namorados.html)). In Tier 5 and 6 markets one flower order can be worth more than a month of subscription.

The sequence that follows is: start with **affiliate links** (TheFork, Smartbox, Interflora and similar programmes are cheaper than API booking†). Next come **in-messenger gifting rails** where they exist (LINE Gift, Kakao 선물하기), because they need no address and live where Bella already talks†. After that, one **regional specialist per region**: Floward across 9 GCC and nearby markets ([Wikipedia](https://en.wikipedia.org/wiki/Floward)), Giuliana Flores in Brazil, FNP/IGP in India, ÇiçekSepeti in Türkiye, NetFlorist in South Africa†. Where no API exists, Bella can order through local florists' and restaurants' WhatsApp Business lines, a native behaviour in LatAm†. Avoid Bloomex in Australia, which won a CHOICE "Shonky" award for failed deliveries ([CHOICE](https://www.choice.com.au/about-us/media-releases/2022/november/flowers-that-dont-deliver-choice-shonkys)).

### Competitors: nobody pairs the journal with an agent that books

| Competitor | Where | Model | Signal | Threat to Belluh |
|---|---|---|---|---|
| Paired | UK (US, AU, CA growing) | Freemium subscription; daily questions; university study showing a 36% relationship-quality gain in 3 months | ~483K MAU est. ([AppGoblin](https://appgoblin.info/apps/1469609343/trends); [UKTN](https://www.uktech.news/news/paired-a-uk-app-that-aims-to-make-couple-relationships-happier-and-healthier-bags-2-5m-20210527)) | Direct in EN markets; no agent |
| Lasting (Talkspace) | US | Subscription counselling curriculum | Acquired Nov 2020 | Therapy-adjacent anchor |
| Flamme, Agapé | Global EN | Freemium daily Q&A, streaks, widgets; Flamme adds an AI coach | Flamme claims 200K partners (self-reported); runs "alternatives to X" SEO pages ([Flamme](https://www.flamme.app/the-7-best-ai-couples-app-alternatives-to-paired)) | Copy the SEO playbook |
| Between | KR to JP/TW/SEA | Couple chat, album, anniversaries, early commerce | 10M+ downloads; Japan's top social app in 2014 ([Vulcan Post](https://vulcanpost.com/103111/couples-apps-between-hits-10-million-downloads/); [The Bridge](https://thebridge.jp/en/2014/01/between-couples-app)) | Sets the D-day/album parity bar in Asia |
| 恋爱记 | China | Ads + IAP, gamified rituals | 30.4M installs, ~2.1M MAU est. | Out of scope (China) |
| Pairy, SumOne† | JP; KR/global Gen Z | Couple app; Q&A | Pairy still listed ([App Store](https://apps.apple.com/app/id522155251)) | Local parity |
| Hinge, Tinder | Global | Adding AI coaching pre-match | Hinge "personal matchmaker" vision ([Fortune](https://www.fortune.com/2025/06/24/hinges-ceo-ai-personal-matchmaker-justin-mcleod-dating-apps)); Tinder AI wingman ([AllSides](https://www.allsides.com/news/2025-03-08-1415/technology-tinder-rolling-out-ai-wingman-help-struggling-users-what-tech-will)) | They stop at the match; post-match is open |
| ChatGPT, Gemini, Meta AI in WhatsApp† | Global | General assistants | ChatGPT ~80% share in the US, ~75% in India and Germany, ~57% in Japan, ~48% in Korea ([OfficeChai](https://officechai.com/ai/gemini-competitive-with-chatgpt-in-japan-and-south-korea-lags-in-us-and-india)) | **The real substitute.** Win on memory of two people, local calendars and checkout |

The repeated lesson is that **daily two-person rituals drive retention** (questions, streaks, pets, widgets), while **anniversaries are where money changes hands**. Belluh needs ritual parity (a daily prompt and a D-day counter) and then wins on the step nobody else takes: Bella booking the table and sending the flowers.
