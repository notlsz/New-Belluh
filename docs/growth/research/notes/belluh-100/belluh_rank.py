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
