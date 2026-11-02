# Launch Belluh where Bella already speaks

Belluh should put its first 90 days of money into **15 markets where Bella's channel, a UI language and a country kit already exist**, led by the United States, which alone is about **35% of global in-app spend and 45% of generative-AI app revenue** ([Sensor Tower](https://sensortower.com/blog/2025-state-of-mobile-consumers-usd150-billion-spent-on-mobile-highlights)). Wave 1 (now to Feb 14 2027) is the US, Puerto Rico, UK, Canada, Australia, Ireland, New Zealand, Singapore, Japan, France, Germany, Austria, Switzerland, Spain and Mexico. Wave 2 (Mar to Sep 2027) is gated on specific builds: Korea needs KakaoTalk and Korean, India needs UPI AutoPay and a ₹599 tier, Italy needs a DPIA and age gate before its regulator notices, the Gulf needs Arabic, the Nordics need Messenger, Hong Kong and Taiwan need Traditional Chinese, and Brazil plus Portugal launch together for June 12. Wave 3 covers the rest of the top 100. China is out: the kit exists, but WhatsApp, LINE and Telegram are unavailable there and an in-country launch triggers CAC filing under the July 2026 companion rules. Russia and seven sanctioned or restricted states are out too. Three decisions apply everywhere. First, **$29.99 is a US and Nordic price**: most of the top 100 needs 30 to 65% of it. Second, couples-app subscriptions convert poorly (Paired has an estimated 483K MAU but sits in a "$10K+ per month" revenue bucket), so **gift and booking commissions must carry low-ARPU markets** ([AppGoblin](https://appgoblin.info/apps/1469609343/trends)). Third, the journal holds GDPR Article 9 data, and **22 accessible top-100 markets criminalise same-sex relations**, so discreet mode is a launch requirement there, not a feature. The country ranking is a model, not a measurement, and should be re-fit on Belluh's own trial-to-paid data after 3 to 6 months.

> **Notation.** **†** = unverified: the research notes flagged it as prior knowledge, an estimate or not re-checked this session (their [UV], [EST], [UNVERIFIED], [bg] tags). Treat † as a lead to confirm before it ships in copy or contracts. **All local prices except the US anchor are estimates** (PPP or Spotify Duo ratios, rounded to store price points); replace them with World Bank price-level ratios (PA.NUS.PPPC.RF) before launch. "Acc." = accessible rank after removing blocked and restricted countries. Partner names are integration candidates; no API or affiliate terms were verified for any of them†.

## Fifteen markets are ready now; Korea and India wait on builds

### How the ranking was built, and what it can't tell you

No public source gives subscription revenue for 100 countries, so the rank uses a **modeled app-spend proxy**: online adults × household consumption per head raised to an elasticity of 1.145. That elasticity was solved so the US gets its observed 52/150 share of 2024's $150B global in-app spend ([Sensor Tower](https://sensortower.com/blog/2025-state-of-mobile-consumers-usd150-billion-spent-on-mobile-highlights)). The proxy was then nudged upward so Sensor Tower's observed order (US > China > Japan > Korea > UK) holds ([Sensor Tower Q2 2025](https://investgame.net/wp-content/uploads/2025/11/sensor_tower__q2_2025_digital_market_index.pdf)). The score weights that spend at 40%, couples online at 25%, GDP per head at 15%, account ownership at 10% and AI user share at 10% ([OWID/Microsoft AI Diffusion](https://ourworldindata.org/grapher/estimated-share-people-generative-ai)). The partnered share is a uniform 60% because UN marriage data wasn't pulled. That doesn't change the order, but real data would lift South Asia and MENA and lower the Nordics and Japan's young cohort.

**Korea's rank rests on that anchor.** The adjustment lifted Korea's modeled spend from **$2.98B to $6.85B**, while Japan moved only from $6.89B to $7.19B and the UK barely moved. Read Korea's #5 as an upper bound: it is a top-four in-app market by observed order, but the model alone would rank it lower. The top 20 is robust (15 of 20 survive equal weights; all 20 survive with spend at 60%), so the wave order holds even if the weights are wrong. **Taiwan is unscored** because the World Bank doesn't publish it. On income and app-spend grounds it belongs around the top 30†, and it is treated as a Wave 2 market below.

The score compresses the gap between markets. In revenue terms the **US is worth more than ranks 2 to 10 combined**, and modeled spend per online couple in India is about 1/50th of the US level. Treat rank as priority order, not revenue share.

### Wave plan

| Wave | Window | Markets (acc. rank) | Why this wave | Gate to enter |
|---|---|---|---|---|
| **1** | Now to Feb 14 2027 | US (1), UK (2), France (3), Germany (4), Japan (6), Spain (7), Canada (8), Australia (10), Singapore (15), Switzerland (16), Ireland (22), Mexico (24), Austria (25), New Zealand (33), Puerto Rico (59) | Channel, UI language and kit already exist. These cover the majority of modeled top-100 spend, and Feb 14 is the shared peak everywhere except Japan's inverted version | IE, AT and NZ kits are finishing in the current build. Japan launches first with Christmas Eve 2026 |
| **2** | Mar to Sep 2027 | Korea (5), India (9), Italy (11), Brazil (12), UAE (13), Netherlands (14), Saudi Arabia (18), Norway (19), Belgium (21), Sweden (23), Denmark (30), Israel (31), Hong Kong (32), Taiwan (unscored), Portugal (35), Finland (36), Luxembourg (63), Iceland (80), Malta (88) | High value, but each misses one build or legal step | KakaoTalk + Korean; UPI AutoPay; Italian DPIA + age gate; Pix Automático; Arabic RTL + discreet mode; Dutch; Messenger; Hebrew; Traditional Chinese |
| **3** | Q4 2027 onward | Türkiye, Poland, Argentina, Chile, Colombia, Peru, Thailand, Malaysia, Indonesia, Vietnam, Philippines, South Africa, Kazakhstan, Egypt, CEE, Baltics, Balkans, smaller Gulf states | Lower price tiers, missing languages (pl, tr, th, id, vi, ms), Viber or Zalo needed, inflation repricing | Viber, Zalo, local wallets, prepaid passes |
| **Availability only** | Any time | The long tail of ranks ~57 to 100 (see section 3 tables) | Listed in stores at the tier price, with no paid spend | Discreet mode on where criminalising |

**Spend concentration matters more than the market count.** Wave 1 has 15 markets, but the US deserves most of the budget, and the other 14 should run as cheap tests that reuse US creative and the existing kits. That matches the pattern in the earlier cross-border evidence: ship availability everywhere and spend capital in waves ([TechCrunch on Uber's $700M SEA loss](https://techcrunch.com/2019/04/11/uber-global-exits-billions/amp/)).

### Excluded and restricted markets

| Country | Raw rank | Verdict | Reason |
|---|---|---|---|
| China | 2 | **Do not launch in mainland**; serve Chinese-speaking couples abroad (SG, MY, US, CA, AU) with the existing zh UI and CN kit | Google Play, WhatsApp, Telegram and LINE are unavailable; WeChat needs a local entity, ICP and PIPL localisation†. The CAC human-like interaction measures (in force Jul 15 2026) require 2-hour reminders, minor mode, algorithm filing and security assessments at 1M users or 100K MAU, with fines of RMB 10K to 200K ([Latham & Watkins](https://www.lw.com/en/insights/2026/07/china-introduces-rules-for-ai-companion-and-emotional-interaction-services)). The rules ban "damaging users' real relationships", which a couples product fits well, so revisit only through a licensed local partner |
| Russia | 17 | **Stay out** | US/EU sanctions; Apple Pay and Google Play paid billing suspended since 2022† |
| Iran, Cuba, North Korea | 36, 85, excluded | **Blocked** | OFAC comprehensive sanctions† |
| Belarus, Venezuela, Myanmar, Syria | 61, 52, 75, 146 | **Restricted: no launch** | Sectoral sanctions and payment friction; junta and internet shutdowns (Myanmar); residual listings after the US Syria programme was revoked Jun 30 2025† |

The sanctions labels come from general regulatory knowledge, not from sources fetched this session. Verify them against OFAC before blocking storefronts†.

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

## Country plans, accessible ranks 1 to 25

### 1. United States (score 87.9, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: en, iMessage/SMS/WhatsApp, kit, calendar, NY and CA disclosure |
| Channel | iMessage (Apple Messages for Business) + RCS/SMS fallback; WhatsApp secondary (30% reach vs RCS 80%) ([Infobip](https://www.infobip.com/messaging-trends-report/regional-snapshot)) |
| Payment, price | App Store, Apple Pay, cards; **$29.99/mo, $179.99/yr** (anchor) |
| Calendar | Feb 14; Mother's Day 2nd Sun May and Father's Day 3rd Sun Jun†; Christmas/NYE engagement season†; dating anniversaries |
| Partners | OpenTable, Resy, Tock, SevenRooms; 1-800-Flowers, FTD, UrbanStems, The Bouqs; DoorDash, Instacart; Etsy, Amazon; Ticketmaster† |
| Couples, culture | Median first marriage **30.8 (men) / 28.4 (women)**, up from 23.5/21.1 in 1975; married couples are 47% of households ([US Census](https://www.census.gov/newsroom/press-releases/2025/families-and-living-arrangements.html)). Long dating phase, mixed iPhone/Android couples |
| Regulation | NY Art. 47; CA SB 243 (published protocol, private right of action, reports from Jul 2027); FTC 6(b) scrutiny of companion monetisation |
| 3 moves | (1) Ship Apple Messages for Business with RCS fallback so Android partners aren't second-class. (2) Open a "Valentine's pre-book" on Jan 24 2027: Bella books OpenTable/Resy and sends flowers, as the first paid-conversion test. (3) Lead creative with the problem, not the app: "you'll never scramble for a reservation on Feb 13 again" |
| Build | SB 243 safety page and report pipeline; Spanish Bella on WhatsApp for Hispanic couples (es exists); flows for moving in together and engagement planning |

### 2. United Kingdom (77.5, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: en, WhatsApp, iMessage, kit |
| Channel | WhatsApp leads ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)); iMessage second, given high iOS share† |
| Payment, price | Cards, Apple Pay, PayPal, Klarna, Direct Debit†; **£22.99** est. |
| Calendar | Feb 14; Dydd Santes Dwynwen Jan 25 (Wales)†; Feb 29 leap-day proposals†; Mothering Sunday† |
| Partners | OpenTable, Resy, SevenRooms, DesignMyNight; Bloom & Wild, Moonpig, Interflora; Red Letter Days, Virgin Experience Days, Buyagift† |
| Couples, culture | Same-sex marriage legal; ILGA Rainbow score 44% ([PinkNews](https://www.thepinknews.com/2026/05/12/europe-lgbtq-2026-rainbow-map/)). UK in-app spend grew 24% YoY, the fastest of the top five ([Sensor Tower Q2 2025](https://investgame.net/wp-content/uploads/2025/11/sensor_tower__q2_2025_digital_market_index.pdf)) |
| Regulation | UK GDPR + Data (Use and Access) Act 2025; Online Safety Act age assurance (coverage of a two-person journal unclear)† |
| 3 moves | (1) Make Bloom & Wild letterbox flowers Bella's default Valentine's gift. (2) Run a Welsh-language Dwynwen micro-campaign on Jan 25 as a cheap pre-Valentine's test. (3) This is Paired's home market, so publish "alternative to Paired" pages framed around the one thing Paired can't do: book the date |
| Build | en-GB spelling and voice; Moonpig card + flowers combo |

### 3. France (76.6, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: fr, WhatsApp, kit |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)); high template costs† |
| Payment, price | Cartes Bancaires, Apple Pay, PayPal†, Wero (live Sep 30 2024) ([Wikipedia](https://en.wikipedia.org/wiki/Wero_(payment))); **€24.99** est. |
| Calendar | Saint-Valentin; muguet (lily of the valley) May 1†; Fête des Mères late May/June†; PACS anniversary |
| Partners | TheFork/LaFourchette; Interflora, Aquarelle, Bergamotte; Smartbox, Wonderbox† |
| Couples, culture | Men marry at 36.0 on average ([Mapas Milhaud](https://mapasmilhaud.com/en/data-maps/average-age-of-european-men-at-first-marriage-2024/)); PACS-heavy, most births outside marriage†. AI user share 47.8%, the highest of the big EU markets |
| Regulation | 3-click cancellation†; Loi Toubon (French terms and ads)†; CNIL; AI Act Art. 50 |
| 3 moves | (1) Add "PACSé(e)" as a status and the PACS anniversary as an occasion. (2) Make May 1 muguet delivery the second annual spike. (3) Default Bella's midweek suggestions to LaFourchette discount slots |
| Build | 3-click cancel on web billing; Wero at web checkout |

### 4. Germany (76.6, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: de, WhatsApp, kit |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | PayPal, SEPA Lastschrift, Klarna†; Wero e-commerce rolling out ([Paperjam](https://en.paperjam.lu/article/epi-rolls-out-wero-ecommerce-in-belgium)); **€24.99** est., push annual |
| Calendar | Modest Valentinstag†; named wedding anniversaries: Papier (1), Holz (5), Rosen (10), Silber (25), Gold (50)† |
| Partners | OpenTable, Quandoo; Fleurop, Blume2000, Bloom & Wild; Jochen Schweizer/mydays† |
| Couples, culture | Strict Datenschutz culture; ~4% of global GenAI app revenue, level with the UK ([Sensor Tower](https://sensortower.com/blog/2025-state-of-mobile-consumers-usd150-billion-spent-on-mobile-highlights)) |
| Regulation | Kündigungsbutton (§312k BGB)†; 17 data-protection authorities† |
| 3 moves | (1) Bella announces named anniversaries ("Morgen ist eure Holzhochzeit") with themed gifts. (2) Put one-click cancel and an "EU-hosted" badge on the paywall as trust signals. (3) Make a mydays experience voucher the default anniversary gift |
| Build | Kündigungsbutton; EU residency; du/Sie register toggle |

### 5. South Korea (76.0, Wave 2)

| Field | Plan |
|---|---|
| Today | Kit and calendar exist; **no Korean UI, no KakaoTalk** |
| Rank caveat | The anchor lifted modeled spend from $2.98B to $6.85B. Treat #5 as an upper bound |
| Channel | KakaoTalk Channel / Alimtalk (48.19M MAU) ([Korea Times](https://www.koreatimes.co.kr/business/companies/20250924/kakaotalk-leads-in-users-tiktok-lite-in-usage-time-data)) |
| Payment, price | KakaoPay, NaverPay, Toss†; **₩27,000** est. |
| Calendar | The densest couple calendar in the world: a themed 14th every month, Pepero Day Nov 11 (rated important by **80.7%**), Valentine's 74.1%, White Day 68.9% ([Korea Herald](https://www.koreaherald.com/article/10419651)); D+100/200/300/1000-day anniversaries ([Daebak](https://daebak.co/blogs/magazine/korean-couple-anniversaries-100-days-culture)) |
| Partners | Catchtable, Naver Booking; Kakao 선물하기 (Gift), Coupang, Kukka; Yanolja† |
| Couples, culture | First marriage ~34/31† and very low fertility†: a long dating phase, ideal for the product. College students (60.9%) and twenty-something workers (55.8%) are the most active in "day culture" |
| Regulation | AI Basic Act: advance notice, Korean labels, local agent above 1M daily users ([Cooley](https://www.cooley.com/news/insight/2026/2026-01-27-south-koreas-ai-basic-act-overview-and-key-takeaways)); PIPA† |
| 3 moves | (1) Put a D-day counter on the home screen and have Bella auto-plan at D-7 before every 100-day mark. (2) A themed 14th each month: Rose Day roses, Photo Day studio booking, Wine Day reservation. (3) Make Kakao Gift Bella's default gift action; soft launch for Rose Day (May 14 2027), scale for Pepero Day (Nov 11 2027) |
| Build | Korean (해요체 default, 반말 opt-in), KakaoTalk channel, Kakao Gift, Noto KR fonts, KakaoPay; parity with Between on the D-day counter and photo timeline |

### 6. Japan (75.7, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: ja, LINE, kit. Verify the CJK font fallback (Merriweather has no CJK glyphs†) |
| Channel | LINE Official Account + Messaging API; LINE is the top app ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | Cards, PayPay (75M+ registered users) ([Payment Navi](https://paymentnavi.com/?p=180136)), konbini, carrier billing†; **¥2,900** est., test higher (highest per-capita App Store spend historically) |
| Calendar | Feb 14 (women give honmei choco), White Day Mar 14 (men return); **Christmas Eve is the couples' night**; Nov 22 "Ii Fūfu no Hi"; Tanabata Jul 7† |
| Partners | Hot Pepper Gourmet, Tabelog, Ikyu, TableCheck, OMAKASE; LINE Gift; Hibiya-Kadan, Aoyama Flower Market; Rakuten† |
| Couples, culture | First marriage ~31/30† and record-low marriages†. AI user share only **22.5%**, so explain Bella before selling her. Incumbents: Pairy (still listed) and Between's legacy |
| Regulation | AI Promotion Act (Jun 4 2025), voluntary ([Digital Policy Alert](https://digitalpolicyalert.org/change/13446-act-on-promotion-of-research-and-development-and-application-of-artificial-intelligence-related-technologies)); APPI† |
| 3 moves | (1) **Launch now with a Christmas Eve 2026 concierge**: tables sell out, and Dec 24 is 7 weeks away. (2) Add a Valentine's/White Day "okaeshi" tracker that remembers what was received and suggests the return gift. (3) Send gifts as LINE Gift links, so no address is needed |
| Build | Polite-casual register QA; 年月日 and Reiwa dates; PayPay on web checkout |

### 7. Spain (73.6, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: es, WhatsApp, kit |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | **Bizum: 32M+ users, 70% of adults**, in-store since May 2026 ([Ara](https://en.ara.cat/economy/bizum-an-exceptional-success-story-in-the-banking-sector-that-turns-ten-years-old_1_5782776.html)); cards; **€19.99** est. |
| Calendar | San Valentín; **Sant Jordi Apr 23** (Catalonia: rose and book); Sant Donís Oct 9 (Valencia)† |
| Partners | ElTenedor (TheFork), CoverManager; Interflora ES, Floraqueen; Smartbox, Wonderbox† |
| Couples, culture | Men marry at 36.9 ([Mapas Milhaud](https://mapasmilhaud.com/en/data-maps/average-age-of-european-men-at-first-marriage-2024/)); **#1 on ILGA's 2026 Rainbow Map** ([PinkNews](https://www.thepinknews.com/2026/05/12/europe-lgbtq-2026-rainbow-map/)); AI user share 44.2% |
| Regulation | AESIA, the EU's first national AI agency†; AI Act Art. 50 |
| 3 moves | (1) A Sant Jordi bundle in Catalan: a rose plus a book Bella picks from the couple's journal. (2) Bizum split for the shared "date fund". (3) Default dinner slots to 21:00 to 22:30 |
| Build | Catalan strings for Sant Jordi; es-ES voice distinct from es-MX |

### 8. Canada (73.3, Wave 1)

| Field | Plan |
|---|---|
| Today | Mostly ready: en, fr, iMessage/SMS/WhatsApp, kit. **Messenger missing** |
| Channel | Messenger 55% (top), Instagram 50%, Apple 50%, RCS 45%, WhatsApp 30% ([Infobip](https://www.infobip.com/messaging-trends-report/regional-snapshot)). Launch on SMS/iMessage; add Messenger in Wave 2 |
| Payment, price | App Store, cards, Interac†; **C$39.99** est. (CAD numeral parity) |
| Calendar | As US†; Quebec French copy for every occasion |
| Partners | OpenTable (dominant); 1-800-Flowers.ca/FTD; SkipTheDishes, Uber Eats† |
| Couples, culture | Same-sex marriage since 2005 ([mirror](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/Same-sex_marriage_in_North_America)) |
| Regulation | Quebec Charter: websites in French; Bill 96 tightened rules from Jun 1 2025 ([McCarthy Tétrault](https://www.mccarthy.ca/en/insights/blogs/consumer-markets-perspectives/french-language-requirements-bill-96-and-june-1-2025-common-misconceptions)); French-first ToS† |
| 3 moves | (1) A Québécois fr-CA variant ("chum", "blonde", "magasiner") with French-first ToS. (2) C$39.99 parity pricing. (3) OpenTable as the single restaurant partner |
| Build | fr-CA strings; Messenger |

### 9. India (72.3, Wave 2)

| Field | Plan |
|---|---|
| Today | en, WhatsApp, kit exist. **Missing: UPI AutoPay, ₹599 tier, Hindi** |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | UPI: 21.63bn transactions in Dec 2025, ~83% of digital payment volume ([Business Standard](https://www.business-standard.com/amp/industry/news/upi-ends-2025-strong-note-record-transactions-december-126010100687_1.html)); UPI AutoPay for recurring billing; **₹599/mo + ₹199 pass** est. 90% of adults hold an account but only 65% own a phone ([World Bank](https://www.worldbank.org/en/news/press-release/2025/07/16/mobile-phone-technology-powers-saving-surge-in-developing-economies)) |
| Calendar | Valentine's week Feb 7 to 14 in cities (with backlash)†; Karva Chauth (Oct/Nov)†; muhurat wedding seasons†; wedding anniversaries |
| Partners | Zomato District, Swiggy Dineout, EazyDiner; FNP, IGP; Blinkit, Zepto, Instamart (~10-minute delivery)† |
| Couples, culture | Arranged or "arranged-love" marriages remain the majority†. Use married framing outside the metros and track in-laws' dates. Decriminalised 2018, no same-sex marriage† |
| Regulation | DPDP Rules (duties ~May 2027); AI labelling under the IT Rules since Feb 20 2026 |
| 3 moves | (1) A 10-minute "surprise drop" of flowers or gifts via quick commerce. (2) Married-couple mode with Karva Chauth and in-laws' anniversaries. (3) Hinglish Bella at ₹599 on AutoPay, with a ₹199 pass for card-less users |
| Build | UPI AutoPay via a local PSP; Hindi + Noto Devanagari; measure token cost per Hindi turn before scaling |

### 10. Australia (72.1, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: en, iMessage/SMS/WhatsApp, kit. Messenger missing |
| Channel | Messenger is the top app ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)); run Bella on iMessage/SMS one-to-one |
| Payment, price | Cards, Apple Pay, Afterpay, Zip, PayID†; **A$44.99** est. |
| Calendar | Feb 14; spring wedding season Sep to Nov† |
| Partners | OpenTable, TheFork; Easy Flowers, LVLY, Interflora AU†. **Avoid Bloomex** ([CHOICE](https://www.choice.com.au/about-us/media-releases/2022/november/flowers-that-dont-deliver-choice-shonkys)) |
| Couples, culture | Marriage equality since 2017†; most couples cohabit before marriage†; AI user share 39.5%; second-highest historical per-capita App Store spend ($114) ([Sensor Tower](https://sensortower.com/blog/per-capita-app-store-spending)) |
| Regulation | eSafety codes for companion chatbots, up to A$49.5M ([eSafety](https://esafety.gov.au/newsroom/media-releases/esafety-report-shows-ai-companions-are-putting-children-at-risk)) |
| 3 moves | (1) Afterpay split for gift-plus-dinner bundles. (2) An Australian voice ("arvo", dry humour, no American "awesome!")†. (3) A long-distance mode for FIFO-worker couples† |
| Build | Age assurance; Messenger in Wave 2 |

### 11. Italy (71.6, Wave 2)

| Field | Plan |
|---|---|
| Today | Built (it, WhatsApp, kit) but **regulator-gated** |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | Cards, PostePay, Satispay, Bancomat Pay, PayPal†; **€19.99** est. |
| Calendar | San Valentino; Festa della Donna Mar 8 (mimosa)† |
| Partners | TheFork (strong); Interflora IT; Smartbox, Emozione3† |
| Couples, culture | Civil unions only (2016)†; Rainbow rank 36th ([PinkNews](https://www.thepinknews.com/2026/05/12/europe-lgbtq-2026-rainbow-map/)) |
| Regulation | Garante's €5M Replika fine (legal basis, transparency, age verification) ([The Star/Reuters](https://www.thestar.com.my/tech/tech-news/2025/05/19/italy039s-data-watchdog-fines-ai-company-replika039s-developer-56-million)); Law 132/2025 parental consent under 14† |
| 3 moves | (1) No paid spend until the DPIA, verified 18+ gate and Italian notices are done. (2) Mimosa delivery on Mar 8 as the first campaign if the DPIA closes in time, otherwise Feb 14 2028. (3) Satispay for the date fund |
| Build | Italian DPIA and notices; opt-in-only training |

### 12. Brazil (69.5, Wave 2)

| Field | Plan |
|---|---|
| Today | pt-BR, WhatsApp, kit exist. **Missing: Pix Automático, T5 price** |
| Channel | WhatsApp: 85% reach ([Infobip](https://www.infobip.com/messaging-trends-report/regional-snapshot)), ~92% of the population ([Aurora](https://www.aurorainbox.com/en/2026/03/05/whatsapp-business-latam-adoption/)) |
| Payment, price | **Pix Automático** (live Jun 16 2025, explicitly for subscriptions; 160M+ Pix users) ([Times Brasil](https://timesbrasil.com.br/brasil/economia-brasileira/banco-central-lanca-hoje-o-pix-automatico-entenda-como-funciona/)); parcelado annual†; **R$59.90 to 69.90** est. |
| Calendar | **Dia dos Namorados Jun 12** (Feb 14 barely matters, though it is emerging); Mother's Day 2nd Sun May; Father's Day 2nd Sun Aug ([Bloomberg Línea](https://www.bloomberglinea.com/latinoamerica/colombia/cuando-es-el-dia-del-padre-2025-en-los-paises-de-latam-mexico-colombia-y-mas/)) |
| Partners | Giuliana Flores; Mercado Livre, iFood, Rappi; reservations via iFood/TheFork/Get In† |
| Couples, culture | Religion "very important" for 79% ([Pew](https://www.pewresearch.org/religion/2026/01/21/catholicism-has-declined-in-latin-america-over-the-past-decade/)); marriage equality 2013; #7 globally in GenAI app revenue despite sitting outside the top 10 for total in-app spend |
| Regulation | LGPD†; AI bill PL 2338 stalled ([CASRAI](https://casrai.org/guides/brazil-ai-bill-pl-2338-status)) |
| 3 moves | (1) Treat June 12 2027 as the Super Bowl: a 3-week build-up and Giuliana Flores pre-orders. (2) Pix Automático billing plus parcelado annual. (3) pt-BR copy that respects "namorar" vs "ficar", with a monthly-anniversary counter for new couples† |
| Build | Pix Automático via a PSP; web paywall |

### 13. United Arab Emirates (69.4, Wave 2)

| Field | Plan |
|---|---|
| Today | Kit, en, WhatsApp exist. **No Arabic** |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)); Snapchat-shareable date cards† |
| Payment, price | Cards, Apple Pay, Tabby/Tamara, Careem Pay†; **AED 79** est. |
| Calendar | Ramadan iftar, Eid al-Fitr and al-Adha, wedding anniversaries; Feb 14 commercially visible; Mother's Day Mar 21† |
| Partners | **Floward** (Riyadh HQ, 9 countries) ([Wikipedia](https://en.wikipedia.org/wiki/Floward)); Talabat, Careem, Noon, SevenRooms, Eat App† |
| Couples, culture | **AI user share 70.1%, the world's highest** ([OWID](https://ourworldindata.org/grapher/estimated-share-people-generative-ai)); married-couple default; Sat to Sun weekend†. Same-sex relations criminalised, death penalty possible |
| Regulation | Local data-protection and localisation rules not reviewed† |
| 3 moves | (1) Arabic/English toggle with married-couple default. (2) Floward plus Tabby split-pay for anniversary gifts. (3) Discreet mode on by default, no same-sex creative |
| Build | Arabic RTL + Noto Naskh; Hijri dates |

### 14. Netherlands (69.4, Wave 2)

| Field | Plan |
|---|---|
| Today | WhatsApp exists; **no Dutch**; kit in current build |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)); high template costs† |
| Payment, price | iDEAL migrating to Wero since Jan 2026 ([EPI](https://epicompany.eu/media-insights/successful-first-phase-marks-major-next-steps-in-ideal-to-wero-migration/)); Tikkie†; **€24.99** est. |
| Calendar | Valentijnsdag with anonymous cards† |
| Partners | TheFork, Formitable; Bloomon, Fleurop NL, Greetz; Bongo† |
| Couples, culture | First country with same-sex marriage (2001)†; low religiosity†; AI user share 42.1% |
| Regulation | The Dutch DPA has warned about AI "friendship and therapy" apps† |
| 3 moves | (1) Co-branded iDEAL/Wero at checkout. (2) Direct, no-fluff Dutch copy using "je". (3) Greetz card plus flowers as the Valentine's default |
| Build | nl-NL |

### 15. Singapore (68.4, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: en, zh, WhatsApp, kit |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | PayNow, GrabPay, cards, Atome†; **S$29.98** est. |
| Calendar | Feb 14; Chap Goh Mei (15th day of Lunar New Year)†; Chinese New Year |
| Partners | Chope (Grab-owned†), Grab, foodpanda; Far East Flora, A Better Florist† |
| Couples, culture | AI user share **63.4%**; first marriage ~32/30†; 377A repealed in 2022, with the constitution protecting the marriage definition† |
| Regulation | PDPA† |
| 3 moves | (1) A BTO milestone tracker ("we applied for a flat")†. (2) A Singlish-light English voice. (3) A Grab ride-plus-dinner "date night" bundle |
| Build | None blocking; zh copy for Chinese-speaking couples |

### 16. Switzerland (67.7, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: de/fr/it, WhatsApp, kit |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | Twint, PostFinance, cards ([Pay.nl](https://www.pay.nl/en/news/grenzeloze-groei-nieuwe-betaalmethoden-voor-heel-europa)); **CHF 29.90** est. |
| Calendar | Valentinstag/Saint-Valentin; named anniversaries† |
| Partners | Fleurop-Interflora CH; Jochen Schweizer CH, Smartbox CH; TheFork, Quandoo† |
| Couples, culture | Same-sex marriage 2022†; highest privacy expectations in Europe† |
| Regulation | Revised FADP (Sep 1 2023)† |
| 3 moves | (1) Twint checkout. (2) A de-CH variant (no ß) with CHF 1'234.50 formatting. (3) State CH/EU data residency on the paywall |
| Build | de-CH strings; Twint |

### 17. Türkiye (67.5, Wave 3)

| Field | Plan |
|---|---|
| Today | WhatsApp exists; **no Turkish**; kit in build |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | Credit cards in taksit installments, TROY†; **₺399** est., repriced quarterly |
| Calendar | Sevgililer Günü Feb 14, ÇiçekSepeti's peak†; Kandil nights† |
| Partners | ÇiçekSepeti, Yemeksepeti, Getir, Trendyol† |
| Couples, culture | Large modeled spend ($2.27B) but AI user share only 17.4%; same-sex relations legal, Pride banned, official hostility† |
| Regulation | KVKK† |
| 3 moves | (1) Annual plan in taksit installments. (2) Quarterly TRY repricing. (3) Fix the dotted/dotless İ/ı casing bug before launch |
| Build | Turkish locale; discreet defaults |
| Why Wave 3 | Inflation repricing, low AI adoption and no Turkish yet outweigh the spend size |

### 18. Saudi Arabia (66.2, Wave 2)

| Field | Plan |
|---|---|
| Today | WhatsApp exists; **no Arabic**; kit in build |
| Channel | WhatsApp, with very high Snapchat use† |
| Payment, price | **E-payments were 85% of retail payments in 2025** ([SAMA](https://www.sama.gov.sa/en-US/MediaCenter/News/pages/news-1139.aspx)); mada, Apple Pay, Tabby/Tamara†; **SAR 69** est. |
| Calendar | Ramadan suhoor and iftar, Eid, Hijri anniversaries; Feb 14 publicly visible since ~2018† |
| Partners | Floward (HQ Riyadh), HungerStation, Jahez, Keeta, Noon† |
| Couples, culture | Marriage-first and family-brokered†; Fri to Sat weekend†; criminalising |
| Regulation | PDPL† |
| 3 moves | (1) Gulf Arabic RTL. (2) Ramadan date plans (iftar bookings, suhoor ideas). (3) mada-first checkout with a Hijri anniversary option |
| Build | Shared Arabic build with the UAE; discreet mode on |

### 19. Norway (65.9, Wave 2)

| Field | Plan |
|---|---|
| Today | **No Norwegian, no Messenger**; kit in build |
| Channel | Messenger leads ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)); Snapchat† |
| Payment, price | Vipps MobilePay ([Pay.nl](https://www.pay.nl/en/news/grenzeloze-groei-nieuwe-betaalmethoden-voor-heel-europa)); **NOK 299** est. |
| Calendar | Valentinsdag; Sankthans (Midsummer)† |
| Partners | Interflora NO, Euroflorist† |
| Couples, culture | Men marry at 36.9 ([Mapas Milhaud](https://mapasmilhaud.com/en/data-maps/average-age-of-european-men-at-first-marriage-2024/)); cohabitation-first; AI user share 48.6% |
| Regulation | Datatilsynet banned Meta behavioural ads in 2023†, which limits Messenger-based ad targeting |
| 3 moves | (1) Vipps checkout. (2) Bella on Messenger. (3) Hytte (cabin) weekend date plans |
| Build | Messenger; Bokmål |

### 20. Poland (65.8, Wave 3)

| Field | Plan |
|---|---|
| Today | WhatsApp exists; **no Polish**; kit in build |
| Channel | Messenger and WhatsApp close† |
| Payment, price | **BLIK: 21.6M active users; 3.6M recurring payments in H1 2026**, with OpenAI among the partners ([BLIK](https://www.blik.com/en/blik-delivers-a-strong-first-half-of-2026-1-6-billion-transactions-and-over-2-million-more-active-users-year-on-year)); **PLN 59.99** est. |
| Calendar | Walentynki; Andrzejki Nov 29 to 30; imieniny (name days)† |
| Partners | Allegro; Poczta Kwiatowa, Euroflorist; Wolt, Glovo† |
| Couples, culture | No recognition of same-sex couples†; high religiosity† |
| Regulation | UODO† |
| 3 moves | (1) BLIK recurring subscription. (2) Name-day engine. (3) Allegro gifting |
| Build | Polish, Messenger, name days |

### 21. Belgium (65.8, Wave 2)

| Field | Plan |
|---|---|
| Today | fr and de exist, **no nl-BE**; kit in build |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | Bancontact†; Wero e-commerce rolling out ([Paperjam](https://en.paperjam.lu/article/epi-rolls-out-wero-ecommerce-in-belgium)); **€24.99** est. |
| Calendar | Valentijnsdag/Saint-Valentin; Antwerp Mother's Day Aug 15† |
| Partners | TheFork, Resengo; Interflora BE, Fleurop BE; Bongo† |
| Couples, culture | Rainbow Map top five ([PinkNews](https://www.thepinknews.com/2026/05/12/europe-lgbtq-2026-rainbow-map/)); same-sex marriage 2003† |
| Regulation | APD/GBA† |
| 3 moves | (1) Bancontact plus Wero. (2) nl-BE copy that is distinct from nl-NL. (3) A Bongo box as the default anniversary gift |
| Build | nl-BE |

### 22. Ireland (64.9, Wave 1)

| Field | Plan |
|---|---|
| Today | en, WhatsApp; kit finishing in current build |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | Cards, Revolut†; **€26.99** est. |
| Calendar | Feb 14; Feb 29 proposals (next in 2028)† |
| Partners | OpenTable, Interflora IE, Smartbox IE† |
| Couples, culture | Same-sex marriage by referendum (2015)†; AI user share 48.4% |
| Regulation | The DPC is lead regulator for Meta's WhatsApp and Messenger† |
| 3 moves | (1) Reuse UK creative at zero marginal cost. (2) Irish-language greetings as a goodwill touch. (3) A Smartbox experience as the anniversary default |
| Build | Finish the kit |

### 23. Sweden (64.8, Wave 2)

| Field | Plan |
|---|---|
| Today | **No Swedish, no Messenger**; kit in build |
| Channel | Messenger leads ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)); WhatsApp and iMessage strong† |
| Payment, price | Swish, Klarna ([Pay.nl](https://www.pay.nl/en/news/grenzeloze-groei-nieuwe-betaalmethoden-voor-heel-europa)); **SEK 279** est. |
| Calendar | Alla hjärtans dag; Midsommar; name days† |
| Partners | Interflora SE, Euroflorist; Upplevelsepresent, Smartbox SE; TheFork† |
| Couples, culture | **Men marry at 37.5, Europe's latest** ([Mapas Milhaud](https://mapasmilhaud.com/en/data-maps/average-age-of-european-men-at-first-marriage-2024/)); sambo (cohabiting) norm† |
| Regulation | IMY† |
| 3 moves | (1) "Sambo" status with a moving-in anniversary. (2) Midsommar planning. (3) Swish split for the date fund |
| Build | Messenger; Swedish |

### 24. Mexico (63.7, Wave 1)

| Field | Plan |
|---|---|
| Today | Ready: es-MX, WhatsApp, kit |
| Channel | WhatsApp 90% ([Infobip](https://www.infobip.com/messaging-trends-report/regional-snapshot)) |
| Payment, price | Cards, Mercado Pago, OXXO Pay, SPEI†; account ownership only 53%; **MX$299 to 349** est. |
| Calendar | Feb 14 Día del Amor y la Amistad (friends included); **Aug 1 Día de la Novia** ([Excélsior](https://www.excelsior.com.mx/trending/dia-de-la-novia-por-que-se-celebra-el-1-de-agosto-y-como-surgio/1729719)); **May 10 Mother's Day, fixed** ([Bloomberg Línea](https://www.bloomberglinea.com/2024/05/06/cuando-es-el-dia-de-la-madre-en-los-paises-de-latinoamerica/)) |
| Partners | OpenTable inside Uber Eats "Sal a comer" in 115+ cities (Dec 2025) ([Uber](https://www.uber.com/mx/en/newsroom/llega-a-mexico-sal-a-comer-de-uber-eats-y-opentable)); Rappi, Mercado Libre, Amazon MX† |
| Couples, culture | Average marriage age **32.1 (women) / 35.0 (men)**; 6,312 same-sex marriages in 2024 ([INEGI](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/emat/emat2024_RR.pdf)); INEGI-cited coverage says 72% of young Mexicans have no partner ([Publimetro](https://www.publimetro.com.mx/noticias/2024/02/12/triste-san-valentin-segun-inegi-72-de-jovenes-mexicanos-no-tienen-pareja/)) |
| Regulation | No AI statute; LFPDPPP† |
| 3 moves | (1) A non-negotiable May 10 reminder for your partner's mother. (2) OpenTable bookings through the same network Uber Eats uses. (3) Annual plans via OXXO and Mercado Pago in meses sin intereses† |
| Build | Mercado Pago and OXXO on web checkout |
| Why Wave 1 | The cheapest WhatsApp-LatAm learning market: everything already exists, so it de-risks Brazil |

### 25. Austria (63.6, Wave 1)

| Field | Plan |
|---|---|
| Today | de, WhatsApp; kit finishing in current build |
| Channel | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) |
| Payment, price | eps, Bankomatkarte, PayPal, Klarna†; Wero joining ([Wikipedia](https://en.wikipedia.org/wiki/Wero_(payment))); **€24.99** est. |
| Calendar | Valentinstag; named anniversaries† |
| Partners | Quandoo, OpenTable; Fleurop AT; Jochen Schweizer, mydays AT† |
| Couples, culture | Same-sex marriage 2019†; 100% account ownership |
| Regulation | DSB† |
| 3 moves | (1) Austrian vocabulary (Jänner, Paradeiser)†. (2) eps checkout. (3) Kaffeehaus and Heuriger date suggestions |
| Build | de-AT strings |

## Ranks 26 to 100 by region

"Avail." means listed in stores at the tier price with no paid spend. "Crim." marks markets where same-sex relations are criminalised, so discreet mode is on by default. All prices are estimates; T-codes refer to the ladder above where the notes gave no local price. Channel entries without a citation are †.

### Europe (25 markets)

| Acc. | Country | Wave | Channel | Pay rail | Duo/mo | Anchor occasions | Gaps today | Flag and lead move |
|---|---|---|---|---|---|---|---|---|
| 30 | Denmark | 2 | Messenger (leads) ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | MobilePay, Dankort† | DKK 199 | Feb 14; gækkebrev riddle letters before Easter† | da, Messenger | Rainbow top five. Bella helps write the gækkebrev |
| 35 | Portugal | 2 | WhatsApp | MB Way, Multibanco† | €16.99 | **Santo António Jun 12 to 13** (manjerico basil pots)†; Feb 14 | None: pt-PT and kit ready | Run with Brazil's June 12 campaign; manjerico gift |
| 36 | Finland | 2 | WhatsApp vs Telegram (sources conflict) | MobilePay | €24.99 | Ystävänpäivä Feb 14 is friends' day; name days† | fi | Reframe Feb 14 copy around couples and friends |
| 38 | Czechia | 3 | Messenger/WhatsApp | Cards, QR | CZK 399 | May 1 cherry-tree kiss on Petřín Hill; name days† | cs | Enhanced partnership 2025†. May 1 date plan |
| 40 | Greece | 3 | Viber/WhatsApp | Cards, IRIS† | €16.99 | Name days often outrank birthdays† | el, Viber | Marriage 2024†. Name-day reminders are the killer feature |
| 42 | Hungary | 3 | Messenger/Viber | Cards | HUF 5,990 | Névnap (name days)† | hu | No same-sex imagery in ads (child-protection law)†; product stays inclusive |
| 43 | Romania | 3 | WhatsApp/Messenger | Cards; BLIK live ([BLIK](https://www.blik.com/en/blik-delivers-a-strong-first-half-of-2026-1-6-billion-transactions-and-over-2-million-more-active-users-year-on-year)) | RON 59.99 | **Dragobete Feb 24**; Mărțișor Mar 1† | ro | No recognition; Rainbow low. Mărțișor reminders |
| 47 | Bulgaria | 3 | Viber | Cards (euro since Jan 1 2026†) | €11.99 | Feb 14 shared with Trifon Zarezan (wine)† | bg, Viber | Pair Valentine's with wine gifts |
| 48 | Slovakia | 3 | Messenger/WhatsApp | Cards; BLIK via mBank SK ([BLIK](https://www.blik.com/en/blik-delivers-a-strong-first-half-of-2026-1-6-billion-transactions-and-over-2-million-more-active-users-year-on-year)) | €14.99 | May 1 cherry-tree kiss; name days† | sk | No recognition. BLIK checkout |
| 49 | Ukraine | 3 | Telegram, Viber | Monobank, PrivatBank† | UAH 299 | Ivan Kupala† | uk | Martial law. Long-distance mode for separated couples; never default to Russian |
| 52 | Croatia | 3 | WhatsApp/Viber | Cards (euro) | €14.99 | Licitar gingerbread hearts† | hr | Life partnership 2014† |
| 54 | Lithuania | 3 | Messenger/Viber | Cards | €14.99 | Name days; Joninės† | lt | Partnership ruling 2025† |
| 55 | Slovenia | 3 | WhatsApp/Viber | Cards (euro) | €16.99 | Gregorjevo Mar 12 lovers' day† | sl | Marriage 2022† |
| 57 | Azerbaijan | Avail. | WhatsApp/Telegram | Cards | T5 | Feb 14 | All | No research coverage |
| 61 | Serbia | 3 | Viber | Cards, IPS QR† | RSD 1,290 | Feb 14 also St Tryphon† | sr, Viber | No recognition. Cyrillic/Latin toggle |
| 63 | Luxembourg | 2 | WhatsApp | Payconiq moved to Wero by Sep 30 2026 ([Wikipedia](https://en.wikipedia.org/wiki/Wero_(payment))) | €26.99 | Feb 14 | None (fr/de) | Ship with Belgium and France |
| 67 | Cyprus | 3 | Viber/WhatsApp | Cards | €16.99 | Name days | el | Rainbow 30th ([Cyprus Mail](https://cyprus-mail.com/2026/05/12/cyprus-ranks-30th-in-europe-on-lgbt-rights-index)). Greek name-day reminders |
| 70 | Latvia | 3 | Messenger/WhatsApp | Cards | €14.99 | Līgo/Jāņi Jun 23 to 24† | lv | Partnership from 2024†. Russian optional, never default |
| 74 | Estonia | 3 | Messenger/WhatsApp | Cards | €16.99 | Sõbrapäev (friends' day)† | et | Marriage 2024† |
| 80 | Iceland | 2 | Messenger | Cards | ISK 3,990 | Bóndadagur (late Jan), Konudagur (late Feb)† | Messenger | Rainbow top five. Konudagur flowers; English works |
| 82 | Georgia | Avail. | WhatsApp/Viber | Cards | T5 | Feb 14 | All | No research coverage |
| 84 | Bosnia and Herzegovina | Avail. | Viber | Cards | T5 | Feb 14 | All | Viber dependency |
| 88 | Malta | 2 | WhatsApp | Cards, Revolut† | €16.99 | Feb 14 | None (en) | Rainbow #2 in 2026. English launch is nearly free |
| 90 | North Macedonia | Avail. | Viber | Cards | T5 | Feb 14 | All | Viber dependency |
| 98 | Armenia | Avail. | Telegram/WhatsApp | Cards | T5 | Feb 14 | All | No research coverage |

### Latin America and Caribbean (14 markets)

| Acc. | Country | Wave | Channel | Pay rail | Duo/mo | Anchor occasions | Gaps today | Flag and lead move |
|---|---|---|---|---|---|---|---|---|
| 26 | Argentina | 3 | WhatsApp 80% ([Infobip](https://www.infobip.com/messaging-trends-report/regional-snapshot)) | Mercado Pago, cuotas† | ARS indexed monthly (~$10 to 11) | Feb 14; Semana de la Dulzura (July)†; **Mother's Day 3rd Sun Oct** ([Bloomberg Línea](https://www.bloomberglinea.com/2024/05/06/cuando-es-el-dia-de-la-madre-en-los-paises-de-latinoamerica/)) | es-AR voseo | Least religious big LatAm market (37% "very important") ([Pew](https://www.pewresearch.org/religion/2026/01/21/catholicism-has-declined-in-latin-america-over-the-past-decade/)). Voseo copy, monthly repricing |
| 37 | Chile | 3 | WhatsApp (~85% of the population) ([Aurora](https://www.aurorainbox.com/en/2026/03/05/whatsapp-business-latam-adoption/)) | Webpay, Mercado Pago† | CLP 12,990 to 14,990 | Feb 14; Fiestas Patrias Sep 18† | es-CL vocabulary | 33% unaffiliated. "Pololo/polola" Bella† |
| 41 | Colombia | 3 | WhatsApp 75% ([Infobip](https://www.infobip.com/messaging-trends-report/regional-snapshot)) | Nequi, **Bre-B** (live Sep 2025) ([Portafolio](https://www.portafolio.co/economia/bre-b-esta-es-la-fecha-oficial-en-que-comienzan-los-pagos-inmediatos-634750)), PSE | COP 39,900 to 44,900 | **Amor y Amistad, 3rd Sat Sep (Sep 18 2027)** ([Calendario de Colombia](https://www.calendariodecolombia.com/fecha/2026/dia-de-amor-y-amistad)) | Calendar override | Launch mid-July 2027 for Sep 18; tú/usted toggle†; Rappi's home market |
| 50 | Peru | 3 | WhatsApp (~76%) | **Yape (~14M users)**, Plin ([Infobae](https://www.infobae.com/peru/2025/05/03/billeteras-digitales-como-yape-y-plin-estan-desplazando-a-las-tarjetas-de-credito-por-que/)) | S/44.90 to 49.90 | Feb 14; Mother's 2nd Sun May | Yape | No same-sex union: discreet defaults. "Enamorado/a" copy† |
| 56 | Dominican Republic | 3 | WhatsApp | Cards | US$9.99 to 14.99† | Mother's last Sun May; Father's last Sun Jul ([Bloomberg Línea](https://www.bloomberglinea.com/2024/05/06/cuando-es-el-dia-de-la-madre-en-los-paises-de-latinoamerica/)) | Calendar | Constitutional ban: privacy defaults |
| 59 | Puerto Rico | 1 | iMessage + WhatsApp mix | US rails | $29.99 | Mother's 2nd Sun May | None | Rides the US launch; bilingual en/es |
| 65 | Costa Rica | 3 | WhatsApp | Cards, SINPE Móvil† | US$14.99 | **Mother's Day Aug 15** | Calendar | Marriage 2020; 71% account ownership ([Revista E&N](https://www.revistaeyn.com/finanzas/ranking-de-bancarizacion-de-los-paises-de-centroamerica-segun-el-informe-global-findex-OG26642185)) |
| 68 | Ecuador | 3 | WhatsApp | Cards | US$14.99 | Mother's 2nd Sun May | None | USD economy; marriage 2019 |
| 76 | Panama | 3 | WhatsApp | Cards | US$14.99 | **Mother's Day Dec 8** (stacks on Christmas) | Calendar | No recognition. Bella warns in November |
| 79 | Uruguay | 3 | WhatsApp | Cards; PedidosYa† | US$9.99 to 14.99† | Father's Day set yearly | es-AR voseo | Marriage 2013. Reuse the es-AR locale |
| 85 | Guatemala | Avail. | WhatsApp | Cash-friendly† | US$14.99 | Mother's May 10; Father's Jun 17; "Día del Cariño"† | None | 38% account ownership: free tier plus gift commission |
| 87 | Paraguay | Avail. | WhatsApp | Cards | US$9.99 to 14.99† | Mother's May 15 | Voseo | Constitutional ban: privacy defaults |
| 92 | Bolivia | Avail. | WhatsApp | Cards | T5 | Mother's May 27; Father's Mar 19; Sep 21 Día del Amor† | Calendar | Same-sex free unions recognised |
| 93 | Jamaica | Avail. | WhatsApp | Cards | US$9.99 to 14.99† | Feb 14 | None (en) | **Crim.** Strict discreet mode, no LGBTQ-targeted ads |

### Asia-Pacific (17 markets plus Taiwan)

| Acc. | Country | Wave | Channel | Pay rail | Duo/mo | Anchor occasions | Gaps today | Flag and lead move |
|---|---|---|---|---|---|---|---|---|
| 27 | Malaysia | 3 | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | DuitNow, Touch 'n Go, GrabPay, Atome† | RM49.90 | Hari Raya, CNY, Chap Goh Mei, Deepavali; Valentine's discouraged for Muslims (2005 fatwa)† | ms; kit in build | **Crim.** Halal filter on suggestions; trilingual BM/EN/ZH |
| 28 | Thailand | 3 | LINE | PromptPay, TrueMoney† | ฿349 | Feb 14 (Bang Rak registrations), Loy Krathong† | th; kit in build | Marriage equality Jan 2025†. LINE MAN Wongnai, Hungry Hub; Buddhist Era dates |
| 29 | Indonesia | 3 | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | QRIS, GoPay, OVO, DANA† | Rp129,000 + passes | Lebaran, weddings; Valentine's contested† | id; kit in build | **Crim.** (Aceh; KUHP cohabitation†). Married framing only; Ramadan and Lebaran hampers |
| 32 | Hong Kong | 2 | WhatsApp (+ WeChat)† | FPS, PayMe, Octopus, AlipayHK† | HK$178 | Feb 14 (flower prices triple)†; Qixi (Aug 8 2027) ([ChinaTravel](https://www.chinatravel.com/culture/qixi-festival)); Christmas Eve | zh-Hant | Cantonese-flavoured zh-Hant; staycations as date nights; partnership bill rejected 2025† |
| n/r | **Taiwan** (unscored) | 2 | LINE | Cards, LINE Pay, JKOPAY† | NT$490 | Feb 14, White Day, **520 (May 20)**, Qixi, Christmas Eve† | zh-Hant | Marriage equality 2019†: inclusive marketing is safe. Qixi flower pre-orders |
| 33 | New Zealand | 1 | iMessage/SMS (Messenger top) | Cards, Afterpay, Laybuy† | NZ$47.99 | Feb 14 | Kit in build | First Table early-sitting deals; te reo greetings |
| 34 | Vietnam | 3 | **Zalo** ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | MoMo, ZaloPay, VietQR† | ₫229,000 | **Oct 20 Women's Day**, Mar 8, Feb 14, Thất Tịch† | vi, Zalo; kit in build | AI Law from Mar 2026. Anh/em pronouns |
| 44 | Kazakhstan | 3 | WhatsApp/Telegram | Kaspi† | KZT 4,990 | **Mar 8**, Feb 14† | kk/ru; kit in build | Propaganda law 2026: no LGBTQ marketing |
| 46 | Philippines | 3 | Messenger, Viber ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | GCash, Maya | ₱549 | **Monthsaries**; Feb 14; Christmas from September† | Messenger | Monthsary engine; OFW long-distance mode |
| 58 | Bangladesh | Avail. | WhatsApp/IMO/Messenger | bKash, Nagad† | BDT 799 | Pohela Falgun Feb 13; Feb 14† | bn | **Crim.** Married framing |
| 60 | Pakistan | Avail. | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | JazzCash, Easypaisa, Raast† | PKR 1,999 | Nikah anniversaries, Eid† | ur (RTL) | **Crim.** Married-only framing |
| 62 | Uzbekistan | Avail. | Telegram | Local cards† | T6 | Feb 14, Mar 8† | All | **Crim.** |
| 73 | Sri Lanka | Avail. | WhatsApp/Viber | LankaQR† | LKR 2,490 | Feb 14, Avurudu† | si/ta | **Crim.** Kapruka gifting |
| 77 | Macao | Avail. | WeChat/WhatsApp | Cards | HK$ tier | As Hong Kong | zh-Hant | Ships with Hong Kong |
| 89 | Mongolia | Avail. | Messenger | Cards | T6 | Feb 14 | All | No research coverage |
| 96 | Brunei | Avail. | WhatsApp | Cards | T2 | Eid | All | **Crim., death penalty possible.** Discreet mode locked on; no marketing |
| 97 | Nepal | Avail. | Viber/Messenger | Wallets† | T6 | Feb 14 | All | No research coverage |
| 100 | Kyrgyz Republic | Avail. | Telegram/WhatsApp | Cards | T6 | Mar 8 | All | No research coverage |

### Middle East (8 markets)

| Acc. | Country | Wave | Channel | Pay rail | Duo/mo | Anchor occasions | Gaps today | Flag and lead move |
|---|---|---|---|---|---|---|---|---|
| 31 | Israel | 2 | WhatsApp | Cards in tashlumim installments, Bit† | ₪99 | **Tu B'Av** (Jul/Aug); Feb 14 secondary† | he (RTL); kit in build | Hebrew with gendered verbs; Shabbat-aware booking; Ontopo, Tabit, Wolt |
| 51 | Qatar | 3 | WhatsApp | NAPS/Himyan, cards† | QAR 79 | Eid, anniversaries | ar | **Crim.** AI user share 41.8%. Snoonu or Floward same-day |
| 53 | Kuwait | 3 | WhatsApp | KNET† | KWD 5.9 | Eid | ar | **Crim.** Floward (founded in Kuwait) as default |
| 66 | Oman | 3 | WhatsApp | Cards | OMR 6.9 | Eid | ar | **Crim.** Conservative tone |
| 72 | Iraq | Avail. | WhatsApp/Viber/Telegram | Cash-heavy (30% accounts) | T6 | Eid | ar | **Crim.** |
| 78 | Bahrain | 3 | WhatsApp | BenefitPay† | BHD 6.9 | Eid | ar | BenefitPay checkout |
| 81 | Jordan | 3 | WhatsApp | CliQ† | JOD 11.9 | Eid, engagements, Feb 14 | ar | Levantine Arabic voice |
| 95 | Lebanon | Avail. | WhatsApp | Cash-heavy (23% accounts) | T6 | Feb 14, Eid | ar | **Crim.** |

### Africa (11 markets)

| Acc. | Country | Wave | Channel | Pay rail | Duo/mo | Anchor occasions | Gaps today | Flag and lead move |
|---|---|---|---|---|---|---|---|---|
| 39 | South Africa | 3 | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | Cards, Ozow, SnapScan, Payflex† | R219 | Feb 14 | Kit in build | Marriage equality 2006†. NetFlorist + Dineplan; offline-tolerant reminders |
| 45 | Egypt | 3 | WhatsApp | InstaPay, Fawry, Vodafone Cash† | EGP 299 pass | Eid; engagement (khutuba); Nov 4 Egyptian Valentine's† | ar; kit in build | **Crim.** Egyptian Arabic; engagement-period mode |
| 64 | Nigeria | Avail. | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | Bank transfer, Paystack, OPay† | ₦9,900 | Feb 14 (wear red); introduction ceremonies† | None (en) | **Crim.** Pidgin voice option; transfer/USSD checkout |
| 69 | Algeria | Avail. | Messenger/WhatsApp | Cash-heavy (35% accounts) | T6 | Eid | ar/fr | **Crim.** |
| 71 | Morocco | Avail. | WhatsApp | Cash on delivery, CMI† | MAD 119 | Eid, weddings | Darija | **Crim.** Darija + French, not just MSA |
| 75 | Ghana | Avail. | WhatsApp | MTN MoMo† | GHS 119 | Feb 14 is also National Chocolate Day† | None (en) | **Crim.**, new bill awaiting signature. No LGBTQ marketing |
| 83 | Kenya | Avail. | WhatsApp ([Sinch](https://sinch.com/blog/most-popular-messaging-apps-by-country/)) | M-Pesa incl. Ratiba recurring† | KSh 1,299 | Feb 14 | None (en) | **Crim.** M-Pesa STK-push checkout |
| 86 | Angola | Avail. | WhatsApp | Wallets† | T6 | Feb 14 | pt-PT fits | No research coverage |
| 91 | Tunisia | Avail. | Messenger/WhatsApp | Cards | T6 | Eid | fr/ar | **Crim.** |
| 94 | Côte d'Ivoire | Avail. | WhatsApp | Mobile money† | T6 | Feb 14 | fr fits | No research coverage |
| 99 | Mauritius | Avail. | WhatsApp | Cards | T5 | Feb 14 | en/fr fit | No research coverage |

## Build list: Kakao and Messenger unlock the most value

The order below ranks each build by accessible value unlocked per unit of effort, with legal gates first because they block revenue already in reach.

| # | Build | Unlocks (acc. rank) | Why this position |
|---|---|---|---|
| **P0: before Wave 1 scales (Nov to Jan)** | | | |
| 1 | Privacy and discreet baseline: per-partner Art. 9 consent, private entries, neutral notifications, app lock, no plaintext orientation, EU residency, DPIA | All; legally required for 11, 13, 18 | One build protects every market and is the precondition for the Gulf |
| 2 | SB 243 safety page, 18+ age assurance, Kündigungsbutton and 3-click cancel on web billing | 1, 3, 4, 10, 11 | Cheap; directly reduces legal exposure in Wave 1 |
| 3 | Machine-readable marking of Bella-generated images/cards | All EU | Art. 50 deadline Dec 2 2026 |
| 4 | Finish IE, NZ, AT kits (in build); verify CJK fallback fonts for shipped ja and zh | 6, 22, 25, 33 | Completes Wave 1 |
| **P1: Wave 2 gates (Dec to Apr)** | | | |
| 5 | **Korean + KakaoTalk channel + Kakao Gift + D-day counter** | 5 | The highest-ranked market with no channel; the D-day counter is Asian parity |
| 6 | **Messenger channel** | 8, 10, 19, 23, 30, 33, 46, 80; split in 20, 38, 42, 43, 48, 54, 70, 74 | The most top-25 markets unlocked by one build |
| 7 | **Traditional Chinese** (zh-Hant-TW, zh-Hant-HK) | 32, Taiwan, 77 | Kits and LINE already exist; cheapest Wave 2 unlock |
| 8 | Local recurring rails on web checkout where store rules allow†: Pix Automático, UPI AutoPay, BLIK recurring, Wero/iDEAL, Bancontact, Bizum, Twint, Swish, Vipps MobilePay | 9, 12, 14, 16, 19, 20, 21, 23 | Turns T5/T6 markets from unprofitable to viable |
| 9 | **Arabic RTL** (mirrored layout, Noto Naskh, Hijri dates, Fri/Sat or Sat/Sun weekends) | 13, 18, 45, 51, 53, 66, 71, 78, 81 | Two top-20 markets plus the Gulf |
| 10 | Dutch (nl-NL and nl-BE) | 14, 21 | Two top-21 markets; kits in build |
| 11 | Hindi/Hinglish Bella, Noto Devanagari, ₹199 pass | 9 | Volume; needs token-cost proof first |
| 12 | Occasion engine variants: name days, monthsaries, D+N counters, gender-aware Valentine's/White Day, Hijri anniversaries, per-country Mother's/Father's Day | 5, 6, 46, CEE, Greece, Nordics, LatAm | Calendars are where Bella earns transactions |
| 13 | Nordic languages (sv, nb, da, fi) and Hebrew RTL with gendered verbs | 19, 23, 30, 31, 36 | Follows Messenger |
| **P2: Wave 3 (May 2027 onward)** | | | |
| 14 | **Viber channel** | 40, 42, 47, 49, 52, 55, 61, 67, 84, 90; PH, LK | Unlocks the Balkans and Greece |
| 15 | Polish, Turkish (fix İ/ı casing), Czech, Romanian, Hungarian, Greek | 17, 20, 38, 40, 42, 43 | Two top-20 markets |
| 16 | Thai (ICU line breaking, Buddhist Era), Indonesian, Malay, Vietnamese + **Zalo** OA/Mini App | 27, 28, 29, 34 | SEA volume |
| 17 | Locale variants: fr-CA, es-AR voseo, es-CL, de-CH/de-AT, en-AU/en-GB, Catalan | 7, 8, 10, 16, 25, 26, 37 | Feels-like-home polish on markets already live |
| 18 | 30-day prepaid passes and mobile money (M-Pesa, MoMo, GCash, bKash, Kaspi) | 9, 29, 44, 46, 58, 64, 75, 83 | Card-scarce markets |
| | **Not building:** WeChat, CN mainland billing, Russian storefront | | Restricted markets |

Noto font pairings matter more than they look: Merriweather has no Arabic, Hebrew, CJK, Thai or Devanagari glyphs†, so every non-Latin language in this list ships with a Noto fallback (Noto Serif KR/TC, Noto Naskh Arabic, Frank Ruhl Libre or Noto Hebrew, Noto Thai, Noto Devanagari).

## Gate every market on couple metrics, then run a 90-day loop

### Metrics per market

There are no published couples-app retention or conversion benchmarks, so the gates below are **starting targets set by us**, to be replaced by the first cohort's real numbers. The same data should re-fit the ranking weights after 3 to 6 months.

| Metric | Definition | Starting gate to graduate | Why |
|---|---|---|---|
| Pair activation | % of sign-ups whose partner joins within 72 hours | ≥ 50% | A one-sided couple app is a diary; this is the first leak |
| Bella channel opt-in | % of active couples with both partners connected to Bella on the local channel | ≥ 60% | Proves the channel choice is right |
| Occasion capture | % of couples with 3+ occasions saved by day 7 (anniversary, birthdays, a local day) | ≥ 70% | Fuels every later transaction |
| Couple D30 retention | Both partners active on day 30 | ≥ 35% | Ritual strength |
| Trial to paid | At the local tier price | ≥ 8% | Tests the ladder; A/B one tier up and down |
| Transaction attach | % of paying couples with 1+ Bella booking or gift in 90 days; GMV per couple | ≥ 40% | Gift revenue carries T5/T6 markets |
| Unit cost | LLM tokens + channel template fees per paying couple, as a share of local price | ≤ 30% | Non-English tokens and WhatsApp templates vary by country† |
| Safety | Disclosure delivered on 100% of threads; crisis triggers routed within SLA; zero regulator contacts | 100% / 100% / 0 | Non-negotiable |
| Privacy | Discreet-mode adoption in criminalising markets; data requests closed on time | Default on; 100% | Protects users and the brand |

### The 90-day launch loop

Time each launch so the market's **peak occasion falls in days 31 to 60**. That way the push lands after onboarding is debugged and before the gate review.

| Phase | Days | Do | Check | Score and decide |
|---|---|---|---|---|
| Localise | −30 to 0 | Kit, calendar, channel, price, affiliate partners, notices, DPIA where needed | Native speakers grade 50 Bella conversations; disclosure and the local crisis line fire on the live channel; discreet defaults on where required | Ship only if every check passes |
| Soft launch | 1 to 30 | Organic launch plus a small paid test with two problem-led creatives | Daily: pair activation, channel opt-in, cost per activated couple | Fix the worst funnel step weekly |
| Peak push | 31 to 60 | Local peak campaign (Feb 14, Jun 12, Sep 18, Pepero Day); pre-book flows; price A/B ±1 tier | Transaction attach, conversion at price, partner fulfilment failures | Kill any partner with failed deliveries |
| Gate | 61 to 90 | Score against the metric gates | Compare with the market's predecessor (e.g. Mexico before Brazil) | **Graduate** (scale spend, hire a local partner manager), **hold** (rerun 30 days on the weakest metric) or **retreat** to availability only; write the lessons into the kit template |

### Launch dates that put the peak in days 31 to 60

| Peak | Date | Markets | Start the loop |
|---|---|---|---|
| Christmas Eve | Dec 24 2026 | Japan (also KR, HK, TW) | **Now** (compressed loop) |
| Valentine's Day | Sun Feb 14 2027 | Wave 1 broadly | Dec 15 to Jan 1 |
| White Day | Mar 14 2027 | Japan, Korea, Taiwan | Running from Japan's launch |
| Festa della Donna / Women's Day | Mar 8 2027 | Italy (if DPIA done), Vietnam, Kazakhstan, CEE | Jan 15 |
| Sant Jordi | Apr 23 2027 | Spain (Catalonia) | Already live |
| Rose Day | May 14 2027 | Korea soft launch | Mar 25 |
| 520 | May 20 2027 | Taiwan | Apr 1 |
| Dia dos Namorados / Santo António | Sat Jun 12 2027 | Brazil, Portugal | Apr 15 |
| Día de la Novia | Aug 1 2027 | Mexico second spike | Already live |
| Qixi | Aug 8 2027 | Taiwan, Hong Kong | Jun 15 |
| Amor y Amistad | Sat Sep 18 2027 | Colombia | Jul 20 |
| Oct 20 Women's Day | Oct 20 2027 | Vietnam | Aug 25 |
| Pepero Day | Nov 11 2027 | Korea scale-up | Sep 15 |

## Conclusion

The playbook's biggest correction to the brief is that **Belluh's binding constraint is the messaging channel, not the UI language**. Two channel builds, KakaoTalk and Messenger, unlock more ranked value (Korea plus Canada, Australia, the Nordics, New Zealand and the Philippines) than any five new languages. Traditional Chinese is the cheapest unlock on the list because the kits and LINE already exist. Price is the second hidden localisation: at $29.99 Belluh is priced for perhaps a dozen countries, and the rest of the map pays for itself through Pix, UPI, BLIK and Bella's gift orders, or not at all. That makes transaction attach, not subscription conversion, the metric that decides whether Wave 3 is worth entering.

The calendar is the third lever, and the one that most rewards depth. A global Feb 14 campaign misses Brazil's June 12, Colombia's September, Japan's Christmas Eve and White Day, Korea's twelve 14ths, Romania's Dragobete and the name days of half of Europe. Each local peak is also a dated, measurable experiment, which turns "localise deeply" into a 90-day loop with a pass mark. Run the first loops in the 15 ready markets, re-fit the model on real conversion data, and let Korea, India and the Gulf earn their place through builds rather than ambition.
