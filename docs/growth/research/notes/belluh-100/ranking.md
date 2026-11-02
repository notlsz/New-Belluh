# Belluh: Top 100 Countries Ranked by Expected Value to a Paid Couples/Relationship Subscription App

Snapshot built 1 Nov 2026. Script and data are reproducible: `belluh_rank.py` and `ranked_data.json` sit in the same folder as this file. All arithmetic is done in Python from the downloaded World Bank and OWID files. No hand-entered country values were used except the barrier lists.

## What are the best available country-level proxies?

### Takeaway
No public source gives app-subscription or dating-app revenue for 100 countries. Sensor Tower publishes only the US dollar figure, a top-5 order, and AI-app revenue shares, and Business of Apps keeps its country split behind a paywall. The best defensible method is therefore a modeled app-spend proxy: online adults × household consumption^b. b is calibrated so the US gets its observed 34.7% share of $150B global IAP, and the model is then anchored to Sensor Tower's observed top-5 order. Hard country data comes from the World Bank WDI (population, 0–14 share, internet use, GDP per capita PPP, household consumption), Global Findex 2025 (account ownership, 2024 wave), and Microsoft AI Diffusion via OWID (AI user share, latest Mar 2026).

### Cited Findings
**App and IAP spend (anchors)**
- 2024 global consumer IAP spend was $150B (+13% YoY). The US spent about $52B (more than a third, +16% YoY). Europe's IAP grew 24% YoY. Europe's top markets were named as the UK, Germany, France and Italy. — [Sensor Tower State of Mobile 2025 highlights](https://sensortower.com/blog/2025-state-of-mobile-consumers-usd150-billion-spent-on-mobile-highlights)
- Shares of global Generative-AI app revenue in 2024: US 45%, UK ~4%, Germany ~4%, Japan ~3%, Canada ~3%. Brazil is #7 for GenAI revenue but outside the top 10 for total IAP. This is a direct signal of willingness to pay for AI apps. — [Sensor Tower](https://sensortower.com/blog/2025-state-of-mobile-consumers-usd150-billion-spent-on-mobile-highlights)
- Q2 2025 top IAP markets in order: US (~$15B, +8% YoY), China (iOS only), Japan, South Korea, UK (+24% YoY). Brazil grew +33% YoY. LatAm IAP was $1.6B (+27%). — [Sensor Tower Q2 2025 Digital Market Index (PDF)](https://investgame.net/wp-content/uploads/2025/11/sensor_tower__q2_2025_digital_market_index.pdf)
- 2025 global IAP revenue was about $167B, a record (headline only, not fetched in full). — [Sensor Tower via itiger](https://www.itiger.com/hans/news/1105729603); [MobileMarketingReads](https://mobilemarketingreads.com/?p=49969)
- Per-capita App Store spend, 2012–2017 cumulative: Japan $214, Australia $114, US ~$92, South Korea $41, France $29, Germany $26, China $18, Russia $9. These are old figures, used only qualitatively to show that Japan, Australia and Korea over-index per head. — [Sensor Tower 2018](https://sensortower.com/blog/per-capita-app-store-spending)
- Country-by-country app-spend tables (eMarketer, Statista) are paywalled and could not be retrieved. — [eMarketer chart](https://www.emarketer.com/chart/265729/Leading-Countries-Worldwide-Ranked-by-Consumer-Spending-on-Mobile-Apps-2021-2023-billions); [Statista top app markets](https://statista.com/statistics/1496753/top-app-markets-by-revenue)

**Dating-app revenue**
- The dating-app market was $5.34B in 2023 (+8%). Tinder made $1.9B, about twice Bumble. Hinge revenue grew 23.3%. The country split ("Dating App Revenue by Country") is in the paid report only. — [Business of Apps Dating App Report](https://www.businessofapps.com/data/dating-app-report/)
- Global dating-app revenue exceeded $6B, with North America driving about 50% (headline). — [Business of Apps](https://www.businessofapps.com/?p=102860); [Global Dating Insights](https://www.globaldatinginsights.com/featured/global-dating-app-revenues-top-6-billion-likely-primed-to-grow/)

**AI adoption**
- ChatGPT share of global web visits, Aug 2025 (Similarweb): US 15.09%, India 9.31%, Brazil 5.31%, UK 4.30%, Indonesia 3.72%, Japan 3.48%, Germany 3.37%, France 3.21%, Philippines 2.98%, Canada 2.62%. Total visits were 5.84B/month. This measures volume, not penetration, so it was not used in the score. — [Databoks/Similarweb](https://databoks.katadata.co.id/en/technology-telecommunications/statistics/68e4ad307a453/indonesia-joins-the-ranks-of-top-global-chatgpt-users-as-of-august-2025)
- AI user share of the working-age population, by country, half-yearly from Jun 2025 to Mar 2026 (Microsoft AI Economy Institute, AI Diffusion). Examples from the latest values: UAE 70.1%, Singapore 63.4%, Norway 48.6%, Ireland 48.4%, France 47.8%, US 31.3%, India 17.6%, China 16.4%. This metric is used in the score. — [OWID grapher (CSV source)](https://ourworldindata.org/grapher/estimated-share-people-generative-ai); [Microsoft Global AI Adoption 2025](https://microsoft.com/en-us/corporate-responsibility/topics/ai-economy-institute/reports/global-ai-adoption-2025); [Technical report](https://www.microsoft.com/en-us/research/wp-content/uploads/2025/09/AI-Diffusion_Technical-Report.pdf)
- The Anthropic Economic Index per-country AUI page could not be fetched (domain not on allowlist), so it was not used.

**Macro, payments and population (World Bank API, latest year per country)**
- GDP per capita PPP, current int'l $ (NY.GDP.PCAP.PP.CD): 229 of 241 economies have 2025 values. — [WDI](https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.CD)
- Population (SP.POP.TOTL, 2025) and population aged 0–14 % (SP.POP.0014.TO.ZS, 2025). Adults are taken as population × (1 − 0–14 share). — [WDI pop](https://data.worldbank.org/indicator/SP.POP.TOTL); [WDI 0–14](https://data.worldbank.org/indicator/SP.POP.0014.TO.ZS)
- Individuals using the Internet % (IT.NET.USER.ZS; mostly 2024, some 2025). This is the smartphone-user proxy, since ITU smartphone ownership is sparse. — [WDI](https://data.worldbank.org/indicator/IT.NET.USER.ZS)
- Account ownership, % age 15+ (FX.OWN.TOTL.ZS). 147 economies have 2024 values from the Findex 2025 wave. Country-level "made or received a digital payment" figures could not be pulled through the API, so account ownership is the payments proxy. — [WDI/Findex](https://data.worldbank.org/indicator/FX.OWN.TOTL.ZS); [Findex 2025 overview](https://blogs.worldbank.org/en/allaboutfinance/digital-technology-is-unlocking-financial-inclusion)
- Household final consumption per capita, constant 2015 US$ (NE.CON.PRVT.PC.KD; mostly 2025). It drives the app-spend model because app prices are paid in near-USD terms and GDP PPP is inflated for Ireland, Luxembourg and Singapore by multinational profits. — [WDI](https://data.worldbank.org/indicator/NE.CON.PRVT.PC.KD)

### Inferences
- Willingness to pay for AI apps is extremely concentrated: the US alone is 45% of GenAI app revenue and about 35% of all IAP. Expect the US to be worth more than ranks 2–10 combined in revenue terms. The score's log scaling compresses that gap, so read the score as priority order, not revenue share.
- Ranks 2–4 (the UK, Germany and France for accessible markets) are the clear second wave. Their GenAI revenue shares (UK and Germany ~4% each) are similar to Japan's (~3%) despite smaller populations.
- Dating-app revenue mirrors this concentration (North America about 50% of global revenue). That makes the US, Canada and the UK the strongest analogues for a paid relationship app.

### Gaps
- No public per-country non-game subscription revenue exists. The model's spend column is an estimate, not observed data. Sensor Tower or AppMagic country exports (paid) would replace it.
- Business of Apps and Statista dating-revenue by country are paywalled. Match Group's and Bumble's 10-Ks give only US-vs-international splits (not fetched).
- Partnered share (married or cohabiting adults): UN World Marriage Data and the OECD Family Database could not be pulled in the call budget. A uniform 60% was applied. Because the size term is log-normalized, a uniform factor does not change any rank. Swapping in real data would modestly lift high-marriage markets (South Asia, MENA) and lower low-partnership ones (Nordics, Japan's young cohort).
- Smartphone penetration uses internet use as a stand-in. GSMA and DataReportal country tables were not retrieved.

## Scoring formula and ranks 1–100

### Takeaway
Score = 100 × (0.40·AppSpend + 0.25·CouplesOnline + 0.15·GDPpcPPP + 0.10·AccountOwnership + 0.10·AIUserShare). The size and income terms use log10 min-max scaling and the rate terms use linear min-max, across a universe of 172 economies with population ≥300k. The resulting order is US, China (restricted), UK, France, Germany, Korea, Japan, Spain, Canada, India, Australia, Italy, Brazil, UAE, Netherlands. The top 20 is robust to reweighting.

### Cited Findings (method; data sources as cited above)
- **AppSpend (modeled, $):** spend_i = K × online_adults_i × hhc_i^b. b = 1.145 is solved by bisection so the US share of modeled global spend equals 52/150 ([Sensor Tower](https://sensortower.com/blog/2025-state-of-mobile-consumers-usd150-billion-spent-on-mobile-highlights)). K scales the total to $150B. **Anchor step:** spend is raised, never lowered, so the observed Q2 2025 order US > China > Japan > Korea > UK holds, with each at least 5% above the next and the UK at least 5% above every other country ([Sensor Tower Q2 2025](https://investgame.net/wp-content/uploads/2025/11/sensor_tower__q2_2025_digital_market_index.pdf)). The anchor lifted Korea from $2.98B to $6.85B and Japan from $6.89B to $7.19B, and the UK barely moved (6.46 to 6.52). Modeled total after anchoring is $154B.
- **CouplesOnline:** adults × internet % × 0.60.
- **Imputation:** a missing metric is set to the median of the country's World Bank region, then the global median. Imputed fields are flagged per row. Countries missing three or more of the five core metrics were excluded: North Korea, Turkmenistan, Eritrea, Fiji and Vanuatu.
- **Sensitivity:** with equal 20% weights, 93 of the top 100 and 15 of the top 20 stay. The biggest movers are Pakistan (65→104), Bangladesh (63→94), Iceland (87→57) and Egypt (48→74). With app spend at 60%, 99 of the top 100 and 20 of the top 20 stay.
- **Model check against observed data:** before anchoring, the modeled top 12 by spend was US, China, Japan, UK, Germany, Korea, France, Canada, Italy, India, Australia, Brazil. That matches Sensor Tower's named leaders (US, China, Japan, Korea, UK; Europe's top four UK, Germany, France, Italy; Brazil top 10 in GenAI).

### Inferences
- Singapore, UAE, Ireland, Norway and Switzerland score high on income and AI adoption but are small. They are high-ARPU test markets, not volume markets.
- India (#10), Brazil (#13), Indonesia and Mexico rank on scale. At $29.99 a month (US price) they need purchasing-power price tiers. The modeled spend per online couple in India is roughly 1/50th of the US level.
- Japan (#7) and Korea (#6) are top-4 IAP markets, but their AI user share is lower (22.5% and 37.1%). Japan needs LINE and Korea needs KakaoTalk for Bella's messaging layer. LINE is in the product spec. KakaoTalk is not, which is a gap to close before entering Korea.

### Gaps
- Weights are the brief's suggested weights, not fitted to Belluh conversion data. They should be re-fit once there are 3–6 months of per-country trial→paid data.
- AppSpend and GDP are correlated (r = 0.69 between log spend and log GDP pc PPP across the 172 economies), so income is partly double-counted. That is deliberate in the brief's weights but worth knowing.

## Access barriers: raw rank vs accessible rank

### Takeaway
Three countries are treated as **Blocked** (Iran, Cuba and North Korea, which is also excluded for lack of data). Six are **Restricted** (China, Russia, Belarus, Venezuela, Myanmar and Syria; Syria sits at raw rank 146). These have no accessible rank. Removing the Restricted China (#2) and Russia (#17) shifts every accessible rank below them up. The accessible top 100 runs to raw rank 107 (Kyrgyz Republic). Separately, 65+ jurisdictions criminalise same-sex relations, and 22 of the raw top 100 do (21 listed below plus Iran, which is Blocked). Those are kept as accessible but flagged for product and safety handling.

### Cited Findings
- 65 jurisdictions criminalise same-sex relations as of Jul 2025, citing Human Dignity Trust data. The death penalty is possible or listed in Afghanistan, Brunei (moratorium since 2019), Iran, Mauritania (de facto moratorium), UAE, Yemen and Somalia. — [PinkNews list, Jul 2025](https://www.thepinknews.com/2025/07/09/how-many-countries-is-it-illegal-to-be-gay/); [Human Dignity Trust](https://www.humandignitytrust.org)
- The number of criminalising countries grew in 2025 for the first time in almost a decade. Burkina Faso was added to the script's list on this basis (headline seen, article not fetched). — [GCN](https://gcn.ie/countries-criminalising-same-sex-acts-2025/)
- Sanctions and China rules are labeled from general regulatory knowledge, not from sources fetched in this session: OFAC comprehensive programs for Iran, Cuba and North Korea; Russia under US/EU sanctions with Apple Pay and Google Play paid billing suspended since 2022; the US Syria sanctions program revoked by executive order on 30 Jun 2025 with residual listings; China's CAC generative-AI service filing and ICP requirements, with Google Play, WhatsApp, Telegram and LINE unavailable. **Verify against OFAC (https://ofac.treasury.gov/sanctions-programs-and-country-information) and CAC before relying on them.**

### Inferences
- Criminalising markets in the raw top 100 are UAE (#14, death penalty possible), Saudi Arabia (#20), Malaysia (#29), Indonesia (#31), Egypt (#48), Qatar (#55), Kuwait (#57), Bangladesh (#63), Pakistan (#65), Uzbekistan (#67), Nigeria (#69), Oman (#71), Algeria (#74), Myanmar (#75, also Restricted), Morocco (#77), Iraq (#78), Sri Lanka (#79), Ghana (#81), Kenya (#90), Tunisia (#98) and Jamaica (#100). Playbook for these: localized storefront creatives without same-sex imagery, inclusive features left on but discreet, no outing-risk notifications (Bella messages on WhatsApp should be neutral), end-to-end encrypted journal, and data residency or minimal retention. Gulf markets (UAE, KSA, Qatar) remain high-value because of ARPU and AI adoption: UAE's 70% AI user share is the highest in the world.
- Messaging-channel fit (channels from the Belluh spec; market fit is inference): LINE for Japan, Taiwan and Thailand; WhatsApp for Europe, LatAm, India, MENA and Africa; iMessage and SMS for the US. Taiwan does not appear because the World Bank API does not publish Taiwan data. Treat Taiwan as a likely top-30 market on income and app-spend grounds, but it is unscored.

### Gaps
- Taiwan is missing from World Bank data, so it is unscored.
- The sanctions and CAC barrier text was not re-verified in this session (call budget). The death-penalty list and the Trinidad & Tobago 2025 status should be checked against the HDT live map.

## Ranked table (rank 1–110 so the accessible top 100 is complete)

Columns: raw rank, accessible rank (– means Blocked/Restricted), modeled annual app IAP spend (2024 $B, anchored), online adults in couples (millions, uniform 60%), GDP per capita PPP (mostly 2025), account ownership % age 15+ (Findex, mostly 2024), AI user share % of working-age population (latest of Jun 2025–Mar 2026). Imputed fields are flagged per row.

| Rank | Acc. rank | Country | Region | Score | Modeled app spend $B | Online adults in couples (M) | GDP pc PPP $ | Account own. % | AI user share % | Barriers / flags |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | United States | North America | 87.9 | 52.00 | 161.0 | 90,027 | 97 | 31.3 |  |
| 2 | - | China | Asia-Pacific | 81.8 | 18.04 | 654.0 | 29,333 | 89 | 16.4 | Restricted: No Google Play/WhatsApp/Telegram/LINE; CAC generative-AI filing + ICP required for App Store AI apps |
| 3 | 2 | United Kingdom | Europe | 77.5 | 6.52 | 33.1 | 64,606 | 99 | 42.2 |  |
| 4 | 3 | France | Europe | 76.6 | 4.09 | 30.6 | 63,975 | 99 | 47.8 |  |
| 5 | 4 | Germany | Europe | 76.6 | 6.21 | 40.3 | 75,407 | 98 | 31.1 |  |
| 6 | 5 | Korea, Rep. | Asia-Pacific | 76.0 | 6.85 | 27.3 | 63,125 | 97 | 37.1 |  |
| 7 | 6 | Japan | Asia-Pacific | 75.7 | 7.19 | 56.2 | 55,422 | 99 | 22.5 |  |
| 8 | 7 | Spain | Europe | 73.6 | 2.50 | 24.8 | 59,868 | 98 | 44.2 |  |
| 9 | 8 | Canada | North America | 73.3 | 3.51 | 20.0 | 66,746 | 98 | 37.3 |  |
| 10 | 9 | India | Asia-Pacific | 72.3 | 3.00 | 466.1 | 11,748 | 89 | 17.6 |  |
| 11 | 10 | Australia | Asia-Pacific | 72.1 | 2.96 | 13.1 | 71,934 | 98 | 39.5 |  |
| 12 | 11 | Italy | Europe | 71.6 | 3.46 | 27.9 | 62,803 | 86 | 30.2 |  |
| 13 | 12 | Brazil | Latin America | 69.5 | 2.87 | 86.9 | 23,433 | 86 | 19.1 |  |
| 14 | 13 | United Arab Emirates | Middle East | 69.4 | 0.84 | 5.8 | 79,344 | 86 | 70.1 | LGBT Criminalised (death penalty possible) |
| 15 | 14 | Netherlands | Europe | 69.4 | 1.28 | 9.0 | 87,320 | 99 | 42.1 |  |
| 16 | 15 | Singapore | Asia-Pacific | 68.4 | 0.50 | 3.1 | 163,354 | 98 | 63.4 |  |
| 17 | - | Russian Federation | Europe | 68.2 | 2.33 | 67.4 | 49,568 | 79 | 9.5 | Restricted: US/EU sanctions; Apple Pay/Google Play paid billing suspended since 2022 |
| 18 | 16 | Switzerland | Europe | 67.7 | 1.46 | 4.5 | 102,513 | 98 | 37.8 |  |
| 19 | 17 | Turkiye | Europe | 67.5 | 2.27 | 36.5 | 45,288 | 82 | 17.4 |  |
| 20 | 18 | Saudi Arabia | Middle East | 66.2 | 1.16 | 16.9 | 73,784 | 79 | 29.4 | LGBT Criminalised |
| 21 | 19 | Norway | Europe | 65.9 | 0.77 | 2.8 | 104,044 | 99 | 48.6 |  |
| 22 | 20 | Poland | Europe | 65.8 | 1.01 | 16.6 | 54,262 | 86 | 31.0 |  |
| 23 | 21 | Belgium | Europe | 65.8 | 0.84 | 5.8 | 74,676 | 98 | 39.0 |  |
| 24 | 22 | Ireland | Europe | 64.9 | 0.41 | 2.6 | 155,089 | 98 | 48.4 |  |
| 25 | 23 | Sweden | Europe | 64.8 | 0.83 | 5.1 | 72,529 | 99 | 36.1 |  |
| 26 | 24 | Mexico | Latin America | 63.7 | 2.01 | 50.0 | 25,868 | 53 | 20.1 |  |
| 27 | 25 | Austria | Europe | 63.6 | 0.65 | 4.4 | 76,778 | 100 | 34.1 |  |
| 28 | 26 | Argentina | Latin America | 62.7 | 0.97 | 19.5 | 32,587 | 82 | 21.9 |  |
| 29 | 27 | Malaysia | Asia-Pacific | 62.5 | 0.67 | 16.7 | 41,498 | 89 | 21.8 | LGBT Criminalised |
| 30 | 28 | Thailand | Asia-Pacific | 61.9 | 0.66 | 33.4 | 26,250 | 92 | 12.4 |  |
| 31 | 29 | Indonesia | Asia-Pacific | 61.8 | 1.11 | 94.5 | 17,660 | 56 | 14.1 | LGBT Criminalised |
| 32 | 30 | Denmark | Europe | 61.6 | 0.54 | 3.0 | 83,218 | 99 | 31.2 |  |
| 33 | 31 | Israel | Middle East | 61.4 | 0.54 | 3.9 | 59,717 | 89 | 38.1 |  |
| 34 | 32 | Hong Kong SAR, China | Asia-Pacific | 61.3 | 0.79 | 3.9 | 80,423 | 97 | 18.4 | imputed: ai |
| 35 | 33 | New Zealand | Asia-Pacific | 60.7 | 0.40 | 2.5 | 57,350 | 98 | 43.0 |  |
| 36 | - | Iran, Islamic Rep. | Middle East | 59.8 | 0.44 | 36.9 | 19,699 | 91 | 12.6 | Blocked: OFAC comprehensive sanctions; LGBT Criminalised (death penalty possible) |
| 37 | 34 | Viet Nam | Asia-Pacific | 59.7 | 0.43 | 39.6 | 18,088 | 71 | 26.5 |  |
| 38 | 35 | Portugal | Europe | 59.6 | 0.45 | 5.0 | 53,146 | 91 | 26.4 |  |
| 39 | 36 | Finland | Europe | 59.5 | 0.40 | 2.7 | 65,884 | 100 | 29.5 |  |
| 40 | 37 | Chile | Latin America | 59.4 | 0.50 | 9.5 | 37,774 | 85 | 22.7 |  |
| 41 | 38 | Czechia | Europe | 58.8 | 0.26 | 4.9 | 60,487 | 92 | 30.1 |  |
| 42 | 39 | South Africa | Africa | 58.4 | 0.43 | 22.6 | 15,906 | 81 | 23.1 |  |
| 43 | 40 | Greece | Europe | 57.7 | 0.45 | 4.7 | 45,264 | 89 | 20.8 |  |
| 44 | 41 | Colombia | Latin America | 57.7 | 0.56 | 20.3 | 22,640 | 57 | 24.5 |  |
| 45 | 42 | Hungary | Europe | 57.5 | 0.25 | 4.6 | 49,838 | 87 | 32.2 |  |
| 46 | 43 | Romania | Europe | 57.4 | 0.44 | 8.8 | 50,895 | 71 | 17.5 |  |
| 47 | 44 | Kazakhstan | Asia-Pacific | 57.0 | 0.30 | 8.3 | 44,293 | 87 | 15.9 |  |
| 48 | 45 | Egypt, Arab Rep. | Africa | 56.5 | 0.66 | 36.3 | 20,204 | 43 | 14.8 | LGBT Criminalised |
| 49 | 46 | Philippines | Asia-Pacific | 55.3 | 0.47 | 34.3 | 12,577 | 50 | 20.1 |  |
| 50 | 47 | Bulgaria | Europe | 54.2 | 0.19 | 2.7 | 44,451 | 85 | 29.7 |  |
| 51 | 48 | Slovak Republic | Europe | 54.0 | 0.16 | 2.5 | 49,309 | 92 | 26.1 |  |
| 52 | - | Venezuela, RB | Latin America | 53.7 | 0.23 | 9.9 | 22,652 | 87 | 10.3 | Restricted: US sanctions on government/PDVSA; payments friction; imputed: gdp,hhc |
| 53 | 49 | Ukraine | Europe | 53.4 | 0.17 | 16.6 | 18,905 | 88 | 9.4 |  |
| 54 | 50 | Peru | Latin America | 52.7 | 0.30 | 13.0 | 18,816 | 59 | 16.4 |  |
| 55 | 51 | Qatar | Middle East | 51.8 | 0.12 | 1.5 | 128,883 | 44 | 41.8 | LGBT Criminalised; imputed: acct |
| 56 | 52 | Croatia | Europe | 51.7 | 0.11 | 1.7 | 50,946 | 93 | 26.1 |  |
| 57 | 53 | Kuwait | Middle East | 51.5 | 0.15 | 2.4 | 56,468 | 74 | 21.1 | LGBT Criminalised |
| 58 | 54 | Lithuania | Europe | 51.0 | 0.09 | 1.3 | 56,838 | 99 | 24.3 |  |
| 59 | 55 | Slovenia | Europe | 51.0 | 0.08 | 1.0 | 59,245 | 99 | 29.0 |  |
| 60 | 56 | Dominican Republic | Latin America | 50.9 | 0.16 | 4.6 | 28,721 | 65 | 24.8 |  |
| 61 | - | Belarus | Europe | 50.5 | 0.11 | 4.3 | 34,716 | 90 | 9.6 | Restricted: US/EU sectoral sanctions; card-payment friction; imputed: acct |
| 62 | 57 | Azerbaijan | Europe | 50.4 | 0.28 | 4.4 | 26,113 | 56 | 17.7 | imputed: hhc |
| 63 | 58 | Bangladesh | Asia-Pacific | 50.3 | 0.24 | 40.7 | 10,154 | 43 | 7.8 | LGBT Criminalised |
| 64 | 59 | Puerto Rico (US) | Latin America | 50.3 | 0.27 | 1.5 | 52,196 | 65 | 18.3 | imputed: acct,ai |
| 65 | 60 | Pakistan | Asia-Pacific | 50.2 | 0.38 | 55.9 | 6,573 | 27 | 11.4 | LGBT Criminalised |
| 66 | 61 | Serbia | Europe | 50.2 | 0.09 | 3.0 | 33,910 | 83 | 24.1 |  |
| 67 | 62 | Uzbekistan | Asia-Pacific | 49.9 | 0.25 | 13.7 | 13,601 | 60 | 7.2 | LGBT Criminalised |
| 68 | 63 | Luxembourg | Europe | 49.9 | 0.09 | 0.3 | 156,542 | 90 | 26.2 | imputed: acct,ai |
| 69 | 64 | Nigeria | Africa | 49.8 | 0.12 | 34.9 | 9,532 | 63 | 10.1 | LGBT Criminalised; imputed: hhc |
| 70 | 65 | Costa Rica | Latin America | 49.7 | 0.12 | 2.2 | 33,815 | 71 | 28.5 |  |
| 71 | 66 | Oman | Middle East | 49.6 | 0.10 | 2.4 | 42,295 | 70 | 26.5 | LGBT Criminalised |
| 72 | 67 | Cyprus | Europe | 49.0 | 0.08 | 0.6 | 64,575 | 96 | 26.2 | imputed: ai |
| 73 | 68 | Ecuador | Latin America | 48.6 | 0.13 | 6.4 | 16,757 | 65 | 19.5 |  |
| 74 | 69 | Algeria | Africa | 47.5 | 0.14 | 15.4 | 18,586 | 35 | 13.2 | LGBT Criminalised |
| 75 | - | Myanmar | Asia-Pacific | 47.5 | 0.39 | 11.4 | 6,012 | 48 | 10.0 | Restricted: Military junta; targeted sanctions; internet shutdowns; LGBT Criminalised; imputed: hhc |
| 76 | 70 | Latvia | Europe | 47.3 | 0.05 | 0.9 | 46,137 | 95 | 26.2 | imputed: ai |
| 77 | 71 | Morocco | Africa | 47.1 | 0.15 | 15.7 | 11,112 | 44 | 11.7 | LGBT Criminalised |
| 78 | 72 | Iraq | Middle East | 46.8 | 0.18 | 14.7 | 14,267 | 30 | 12.5 | LGBT Criminalised |
| 79 | 73 | Sri Lanka | Asia-Pacific | 46.7 | 0.08 | 5.6 | 17,065 | 82 | 7.3 | LGBT Criminalised |
| 80 | 74 | Estonia | Europe | 46.6 | 0.04 | 0.6 | 52,106 | 99 | 26.2 | imputed: ai |
| 81 | 75 | Ghana | Africa | 46.3 | 0.07 | 9.8 | 8,610 | 81 | 10.1 | LGBT Criminalised |
| 82 | 76 | Panama | Latin America | 46.1 | 0.07 | 1.5 | 43,902 | 64 | 23.3 |  |
| 83 | 77 | Macao SAR, China | Asia-Pacific | 45.6 | 0.04 | 0.3 | 137,031 | 91 | 18.4 | imputed: acct,ai |
| 84 | 78 | Bahrain | Middle East | 45.4 | 0.05 | 0.8 | 70,997 | 82 | 14.9 | imputed: ai |
| 85 | - | Cuba | Latin America | 45.0 | 0.09 | 3.9 | 22,652 | 65 | 6.7 | Blocked: OFAC comprehensive sanctions; imputed: gdp,acct |
| 86 | 79 | Uruguay | Latin America | 44.7 | 0.04 | 1.5 | 38,315 | 74 | 24.6 | imputed: hhc |
| 87 | 80 | Iceland | Europe | 44.7 | 0.04 | 0.2 | 83,431 | 100 | 26.2 | imputed: ai |
| 88 | 81 | Jordan | Middle East | 44.4 | 0.07 | 4.6 | 12,632 | 46 | 29.7 | imputed: hhc |
| 89 | 82 | Georgia | Europe | 44.4 | 0.04 | 1.6 | 29,414 | 79 | 20.5 |  |
| 90 | 83 | Kenya | Africa | 44.2 | 0.05 | 7.7 | 7,016 | 90 | 8.7 | LGBT Criminalised |
| 91 | 84 | Bosnia and Herzegovina | Europe | 43.6 | 0.04 | 1.4 | 25,814 | 77 | 22.1 |  |
| 92 | 85 | Guatemala | Latin America | 43.3 | 0.10 | 4.7 | 15,197 | 38 | 16.4 |  |
| 93 | 86 | Angola | Africa | 42.3 | 0.07 | 5.3 | 10,251 | 55 | 10.9 | imputed: acct |
| 94 | 87 | Paraguay | Latin America | 42.3 | 0.06 | 2.5 | 20,181 | 61 | 12.2 |  |
| 95 | 88 | Malta | Europe | 42.1 | 0.03 | 0.3 | 72,210 | 97 | 14.9 | imputed: ai |
| 96 | 89 | Mongolia | Asia-Pacific | 42.0 | 0.02 | 1.2 | 20,798 | 98 | 16.7 |  |
| 97 | 90 | North Macedonia | Europe | 41.9 | 0.02 | 0.8 | 28,029 | 84 | 26.2 | imputed: ai |
| 98 | 91 | Tunisia | Africa | 41.2 | 0.06 | 4.3 | 15,233 | 38 | 13.5 | LGBT Criminalised |
| 99 | 92 | Bolivia | Latin America | 41.1 | 0.04 | 4.2 | 12,873 | 57 | 12.7 |  |
| 100 | 93 | Jamaica | Latin America | 40.1 | 0.03 | 1.3 | 13,291 | 73 | 24.0 | LGBT Criminalised; imputed: hhc |
| 101 | 94 | Cote d'Ivoire | Africa | 39.4 | 0.03 | 4.8 | 8,209 | 58 | 13.1 |  |
| 102 | 95 | Lebanon | Middle East | 39.3 | 0.07 | 2.1 | 11,917 | 23 | 27.3 | LGBT Criminalised |
| 103 | 96 | Brunei Darussalam | Asia-Pacific | 39.1 | 0.01 | 0.2 | 92,430 | 91 | 18.4 | LGBT Criminalised (death penalty possible); imputed: acct,ai |
| 104 | 97 | Nepal | Asia-Pacific | 38.7 | 0.02 | 5.9 | 6,175 | 60 | 14.2 |  |
| 105 | 98 | Armenia | Europe | 38.6 | 0.02 | 1.2 | 24,754 | 71 | 7.4 |  |
| 106 | 99 | Mauritius | Africa | 38.5 | 0.02 | 0.5 | 33,667 | 90 | 10.1 | imputed: ai |
| 107 | 100 | Kyrgyz Republic | Asia-Pacific | 38.3 | 0.02 | 2.8 | 9,220 | 72 | 9.5 |  |
| 108 | 101 | El Salvador | Latin America | 38.0 | 0.03 | 1.9 | 14,101 | 43 | 18.3 |  |
| 109 | 102 | Senegal | Africa | 37.9 | 0.02 | 4.3 | 5,463 | 76 | 13.9 | LGBT Criminalised |
| 110 | 103 | Lao PDR | Asia-Pacific | 37.6 | 0.07 | 2.2 | 10,383 | 38 | 7.8 | imputed: hhc |

## Grouped by region (raw top 100)

- **Europe** (40): 3. United Kingdom, 4. France, 5. Germany, 8. Spain, 12. Italy, 15. Netherlands, 17. Russian Federation, 18. Switzerland, 19. Turkiye, 21. Norway, 22. Poland, 23. Belgium, 24. Ireland, 25. Sweden, 27. Austria, 32. Denmark, 38. Portugal, 39. Finland, 41. Czechia, 43. Greece, 45. Hungary, 46. Romania, 50. Bulgaria, 51. Slovak Republic, 53. Ukraine, 56. Croatia, 58. Lithuania, 59. Slovenia, 61. Belarus, 62. Azerbaijan, 66. Serbia, 68. Luxembourg, 72. Cyprus, 76. Latvia, 80. Estonia, 87. Iceland, 89. Georgia, 91. Bosnia and Herzegovina, 95. Malta, 97. North Macedonia
- **Asia-Pacific** (21): 2. China, 6. Korea, Rep., 7. Japan, 10. India, 11. Australia, 16. Singapore, 29. Malaysia, 30. Thailand, 31. Indonesia, 34. Hong Kong SAR, China, 35. New Zealand, 37. Viet Nam, 47. Kazakhstan, 49. Philippines, 63. Bangladesh, 65. Pakistan, 67. Uzbekistan, 75. Myanmar, 79. Sri Lanka, 83. Macao SAR, China, 96. Mongolia
- **Latin America** (18): 13. Brazil, 26. Mexico, 28. Argentina, 40. Chile, 44. Colombia, 52. Venezuela, RB, 54. Peru, 60. Dominican Republic, 64. Puerto Rico (US), 70. Costa Rica, 73. Ecuador, 82. Panama, 85. Cuba, 86. Uruguay, 92. Guatemala, 94. Paraguay, 99. Bolivia, 100. Jamaica
- **Middle East** (10): 14. United Arab Emirates, 20. Saudi Arabia, 33. Israel, 36. Iran, Islamic Rep., 55. Qatar, 57. Kuwait, 71. Oman, 78. Iraq, 84. Bahrain, 88. Jordan
- **Africa** (9): 42. South Africa, 48. Egypt, Arab Rep., 69. Nigeria, 74. Algeria, 77. Morocco, 81. Ghana, 90. Kenya, 93. Angola, 98. Tunisia
- **North America** (2): 1. United States, 9. Canada

The Middle East is ranked separately from North Africa. Egypt, Morocco, Algeria and Tunisia are under Africa. Türkiye and the Caucasus are under Europe. Central Asia, Pakistan and Afghanistan are under Asia-Pacific.

## Script (belluh_rank.py)

Data pulls, run before the script (World Bank API and OWID CSV):

```bash
for ind in NY.GDP.PCAP.PP.CD SP.POP.TOTL SP.POP.0014.TO.ZS IT.NET.USER.ZS FX.OWN.TOTL.ZS NE.CON.PRVT.PC.KD; do
  curl -sS "https://api.worldbank.org/v2/country/all/indicator/$ind?format=json&per_page=20000&date=2018:2025" -o data/wb_$ind.json; done
curl -sS "https://api.worldbank.org/v2/country?format=json&per_page=400" -o data/wb_countries.json
curl -sS "https://ourworldindata.org/grapher/estimated-share-people-generative-ai.csv?useColumnShortNames=true" -o data/owid_ai.csv
python3 -I belluh_rank.py data
```

```python
"""Belluh top-100 country ranking. Usage: python3 -I belluh_rank.py <data_dir>"""
import json, csv, math, sys, statistics as st
D = sys.argv[1]

def wb(ind):
    out = {}
    for r in json.load(open(f"{D}/wb_{ind}.json"))[1]:
        iso, v, y = r["countryiso3code"], r["value"], int(r["date"])
        if v is None or not iso: continue
        if iso not in out or y > out[iso][1]: out[iso] = (v, y)
    return out

meta = {c["id"]: c for c in json.load(open(f"{D}/wb_countries.json"))[1] if c["region"]["id"] != "NA"}
gdp, pop, kid, net, acct, hhc = (wb(i) for i in ["NY.GDP.PCAP.PP.CD", "SP.POP.TOTL", "SP.POP.0014.TO.ZS", "IT.NET.USER.ZS", "FX.OWN.TOTL.ZS", "NE.CON.PRVT.PC.KD"])
ai = {}
for r in csv.DictReader(open(f"{D}/owid_ai.csv")):
    if r["code"] and not r["code"].startswith("OWID") and r["ai_user_share"]:
        if r["code"] not in ai or r["day"] > ai[r["code"]][1]: ai[r["code"]] = (float(r["ai_user_share"]), r["day"])

# Region grouping requested by brief
NA_ = {"USA", "CAN"}
MIDEAST = {"ARE","SAU","QAT","KWT","BHR","OMN","ISR","JOR","LBN","IRQ","IRN","SYR","YEM","PSE"}
EUROPE_FROM_ECS_EXCL = {"KAZ","UZB","KGZ","TJK","TKM"}  # Central Asia -> Asia-Pacific
def region(iso):
    r = meta[iso]["region"]["id"]
    if iso in NA_: return "North America"
    if iso in MIDEAST: return "Middle East"
    if r == "LCN": return "Latin America"
    if r == "ECS": return "Asia-Pacific" if iso in EUROPE_FROM_ECS_EXCL else "Europe"
    if r in ("EAS", "SAS"): return "Asia-Pacific"
    if iso in ("PAK", "AFG"): return "Asia-Pacific"   # WB now groups these with MENA
    if iso == "MLT": return "Europe"
    if r in ("SSF", "MEA"): return "Africa"   # remaining MEA = North Africa + Djibouti/Malta
    return r

# Barriers
BLOCKED = {"IRN": "OFAC comprehensive sanctions", "PRK": "OFAC comprehensive sanctions", "CUB": "OFAC comprehensive sanctions"}
RESTRICTED = {"CHN": "No Google Play/WhatsApp/Telegram/LINE; CAC generative-AI filing + ICP required for App Store AI apps",
              "RUS": "US/EU sanctions; Apple Pay/Google Play paid billing suspended since 2022",
              "SYR": "US sanctions program revoked 30 Jun 2025 but residual SDN/EU/terror-list risk",
              "BLR": "US/EU sectoral sanctions; card-payment friction",
              "VEN": "US sanctions on government/PDVSA; payments friction",
              "MMR": "Military junta; targeted sanctions; internet shutdowns"}
CRIM = set("AFG BGD BRN IDN IRN IRQ KWT LBN MYS MDV MMR OMN PAK PSE QAT SAU LKA SYR TKM ARE UZB YEM DZA BDI CMR TCD COM EGY ERI SWZ ETH GHA GIN KEN LBR LBY MWI MLI MRT MAR NGA SEN SLE SOM SSD SDN TZA GMB TGO TUN UGA ZMB ZWE GRD GUY JAM LCA VCT TTO KIR PNG WSM SLB TON TUV BFA".split())
DEATH = set("AFG BRN IRN MRT ARE YEM SOM".split())

PARTNERED = 0.60  # uniform share of adults married/cohabiting (see Gaps); ranking-invariant under log scaling
rows = []
for iso, m in meta.items():
    if iso not in pop or pop[iso][0] < 300_000: continue
    rows.append(dict(iso=iso, name=m["name"], reg=region(iso), wbreg=m["region"]["id"],
                     pop=pop[iso][0], kid=kid.get(iso, (None,))[0], net=net.get(iso, (None,))[0],
                     gdp=gdp.get(iso, (None,))[0], hhc=hhc.get(iso, (None,))[0], acct=acct.get(iso, (None,))[0], ai=ai.get(iso, (None,))[0], imp=[]))
# Imputation: missing metric -> median of same World Bank region (then global median)
EXCLUDED = [r["name"] for r in rows if sum(r[k] is None for k in ["net", "gdp", "acct", "ai", "hhc"]) >= 3]
rows = [r for r in rows if r["name"] not in EXCLUDED]
for k in ["kid", "net", "gdp", "hhc", "acct", "ai"]:
    for r in rows:
        if r[k] is None:
            pool = [x[k] for x in rows if x[k] is not None and x["wbreg"] == r["wbreg"]] or [x[k] for x in rows if x[k] is not None]
            r[k] = st.median(pool); r["imp"].append(k)
for r in rows:
    r["adults"] = r["pop"] * (1 - r["kid"] / 100)
    r["online_adults"] = r["adults"] * r["net"] / 100
    r["couples_online"] = r["online_adults"] * PARTNERED

# App-spend proxy: spend_i = k * online_adults_i * x_i^b.
# (x = household final consumption per capita, const 2015 US$, WDI NE.CON.PRVT.PC.KD)
# b calibrated so US share = 52/150 (Sensor Tower 2024: US $52B of $150B global IAP); k so total = $150B.
def us_share(b):
    t = sum(r["online_adults"] * r["hhc"] ** b for r in rows)
    return [r for r in rows if r["iso"] == "USA"][0]["online_adults"] * [r for r in rows if r["iso"] == "USA"][0]["hhc"] ** b / t
lo, hi = 0.0, 6.0
for _ in range(60):
    mid = (lo + hi) / 2
    lo, hi = (mid, hi) if us_share(mid) < 52 / 150 else (lo, mid)
B = (lo + hi) / 2
K = 150e9 / sum(r["online_adults"] * r["hhc"] ** B for r in rows)
for r in rows: r["spend"] = r["spend_raw"] = K * r["online_adults"] * r["hhc"] ** B
# Anchor to observed ordering: Sensor Tower Q2 2025 top IAP markets = USA > CHN > JPN > KOR > GBR.
# Raise (never lower) each anchor so it sits >=5% above the next; GBR >=5% above every non-anchor.
by = {r["iso"]: r for r in rows}
ANCH = ["USA", "CHN", "JPN", "KOR", "GBR"]
by["GBR"]["spend"] = max(by["GBR"]["spend"], 1.05 * max(r["spend"] for r in rows if r["iso"] not in ANCH))
for a, b_ in reversed(list(zip(ANCH, ANCH[1:]))):
    by[a]["spend"] = max(by[a]["spend"], 1.05 * by[b_]["spend"])

def lognorm(k):
    v = [math.log10(r[k]) for r in rows]; a, b = min(v), max(v)
    for r in rows: r["n_" + k] = (math.log10(r[k]) - a) / (b - a)
def lin(k):
    v = [r[k] for r in rows]; a, b = min(v), max(v)
    for r in rows: r["n_" + k] = (r[k] - a) / (b - a)
lognorm("spend"); lognorm("couples_online"); lognorm("gdp"); lin("acct"); lin("ai")
W = dict(spend=.40, couples_online=.25, gdp=.15, acct=.10, ai=.10)
for r in rows: r["score"] = 100 * sum(W[k] * r["n_" + k] for k in W)
rows.sort(key=lambda r: -r["score"])
acc = 0
for i, r in enumerate(rows, 1):
    r["rank"] = i
    r["barrier"] = BLOCKED.get(r["iso"]) or RESTRICTED.get(r["iso"]) or ""
    r["tier"] = "Blocked" if r["iso"] in BLOCKED else "Restricted" if r["iso"] in RESTRICTED else "Open"
    if r["tier"] == "Open": acc += 1; r["arank"] = acc
    else: r["arank"] = None
    r["lgbt"] = ("Criminalised (death penalty possible)" if r["iso"] in DEATH else "Criminalised") if r["iso"] in CRIM else ""

print("EXCLUDED", EXCLUDED); print(f"calibrated elasticity b={B:.3f}; universe={len(rows)} countries (pop>=300k)")
print("TOP", " ".join(r["iso"] for r in sorted(rows, key=lambda r: -r["spend"])[:12]))
json.dump(rows, open(f"{D}/ranked.json", "w"), default=str)

def f(x, d=0): return f"{x:,.{d}f}"
hdr = "| Rank | Acc. rank | Country | Region | Score | Modeled app spend $B | Online adults in couples (M) | GDP pc PPP $ | Account own. % | AI user share % | Barriers / flags |\n|---|---|---|---|---|---|---|---|---|---|---|"
lines = [hdr]
for r in rows[:110]:
    flags = "; ".join(x for x in [r["tier"] + ": " + r["barrier"] if r["barrier"] else "", "LGBT " + r["lgbt"] if r["lgbt"] else "", "imputed: " + ",".join(r["imp"]) if r["imp"] else ""] if x)
    lines.append(f"| {r['rank']} | {r['arank'] or '-'} | {r['name']} | {r['reg']} | {r['score']:.1f} | {r['spend']/1e9:.2f} | {r['couples_online']/1e6:.1f} | {f(r['gdp'])} | {r['acct']:.0f} | {r['ai']:.1f} | {flags} |")
open(f"{D}/table.md", "w").write("\n".join(lines))
# Region view (top-100 accessible+raw)
reg = {}
for r in rows[:100]: reg.setdefault(r["reg"], []).append(f"{r['rank']}. {r['name']}")
open(f"{D}/regions.md", "w").write("\n".join(f"- **{k}** ({len(v)}): " + ", ".join(v) for k, v in sorted(reg.items(), key=lambda kv: -len(kv[1]))))
```
