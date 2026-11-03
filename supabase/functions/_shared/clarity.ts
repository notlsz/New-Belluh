// Clarity: a private page for one partner, never the couple. It notices research-based patterns in the person's OWN
// writing (their journal entries, private or shared, their own messages to Bella, and their answers on the Clarity page)
// and shows them as dated counts with their own words, a few honest questions and next steps. Patterns and questions,
// never a verdict: no score, no streak, no single number about the relationship, and Bella never says to stay or go.
//
// What it never touches: the partner's entries, the partner's private notes, anything in the shared thread written by
// the partner. Nothing here reaches the partner, the partner's Bella, Afterglow, the shared story, texting or any export.
// The page computes the patterns on demand (nothing derived is stored); only the person's own answers and their
// conversation with Bella on the page are kept, owner-only, and turning Clarity off deletes both.
//
// The patterns and why they are here (each checked at the source, 2026-11-02):
//   Criticism, contempt, defensiveness, stonewalling: Gottman & Levenson, "The timing of divorce", Journal of Marriage
//     and the Family 2000;62:737-745. Negative affect in conflict predicted earlier divorce; contempt and defensiveness
//     separated the groups most.
//   Warm and hard moments, and repair: Gottman, "The roles of conflict engagement, escalation, and avoidance in marital
//     interaction", J Consult Clin Psychol 1993;61(1):6-15 (stable couples balance negativity with far more positivity);
//     Gottman & Levenson 2000 (the absence of positive affect predicted later divorce); Gottman, Coan, Carrere &
//     Swanson, "Predicting marital happiness and stability from newlywed interactions", J Marriage Fam 1998;60(1):5-22.
//   Feeling unheard, loneliness, perceived commitment: Joel et al., PNAS 2020;117(32):19061-19071 (43 longitudinal
//     studies: perceived partner commitment, appreciation, sexual satisfaction, perceived partner satisfaction and
//     conflict were the strongest relationship predictors; change over time was largely unpredictable from self-report,
//     which is why Clarity never predicts).
//   Leaving can be dangerous: Campbell et al., Am J Public Health 2003;93(7):1089-97 (see safety.ts).
// Pure, so it's unit-tested (tests/clarity.test.ts).

import { dvSignal, crisisSignal, dvLine, crisisLine } from './safety.ts';

export type PatternKey =
  | 'criticism' | 'contempt' | 'defensiveness' | 'stonewalling' | 'unheard' | 'lonely' | 'sameFight'
  | 'kids' | 'place' | 'money' | 'faith' | 'ambition' | 'repair' | 'warm' | 'hard';

export const CONCERNS: PatternKey[] = ['criticism', 'contempt', 'defensiveness', 'stonewalling', 'unheard', 'lonely', 'sameFight'];
export const MISMATCHES: PatternKey[] = ['kids', 'place', 'money', 'faith', 'ambition'];
export const STRENGTHS: PatternKey[] = ['repair', 'warm'];

const P: Partial<Record<PatternKey, RegExp[]>> = {
  criticism: [
    /\b(he|she|they)\s+(always|never)\b/i, /\byou\s+(always|never)\b/i, /\bwhat'?s\s+wrong\s+with\s+(you|me)\b/i, /\b(criticiz|criticis|nitpick)/i, /\bpicks?\s+(at|on)\s+me\b/i,
    /\bme\s+(critica|reprocha)\b/i, /\bsiempre\s+me\s+critica/i, // es
    /\bme\s+critique|\bcritique\s+tout|\bme\s+reproche/i, // fr
    /\bkritisiert\s+(mich|alles)|\bmeckert|\bn[öo]rgelt|\bdu\s+(immer|nie)\b/i, // de
    /\bmi\s+critica|\bmi\s+rimprovera|\bsempre\s+da\s+ridire/i, // it
    /\bme\s+critica|\bvive\s+me\s+criticando|\bme\s+cobra\s+tudo/i, // pt
    /文句ばかり/, /批判され/, /責められ/, /ダメ出し/, /否定ばかり/, // ja
    /总是挑剔|老是批评|批评我|指责我|挑我毛病|總是挑剔|老是批評|批評我|指責我/, // zh
    /비난/, /비판해/, /잔소리/, /탓만/, // ko
  ],
  contempt: [
    /\brolled\s+(his|her|their)\s+eyes\b/i, /\b(mock|mocked|mocks|mocking)\s+me\b/i, /\bmade\s+fun\s+of\s+me\b/i, /\blooks?\s+down\s+on\s+me\b/i,
    /\b(called|calls)\s+me\s+(stupid|an?\s+idiot|pathetic|useless|crazy|worthless)\b/i, /\bcontempt\b/i, /\bsneer/i, /\bdisgusted\s+(with|by)\s+me\b/i,
    /\bse\s+burl[aó]\s+de\s+m[ií]|\bme\s+desprecia|\bpuso\s+los\s+ojos\s+en\s+blanco|\bme\s+llam[oó]\s+(est[uú]pid|idiota|in[uú]til)/i, // es
    /\bse\s+moque\s+de\s+moi|\bm[ée]pris|\blev[ée]\s+les\s+yeux\s+au\s+ciel|\bm'a\s+trait[ée]e?\s+d'?(idiot|imb[ée]cile|nulle?)/i, // fr
    /\bmacht\s+sich\s+[üu]ber\s+mich\s+lustig|\bverachtung|\bverdreht\s+die\s+augen|\bnannte\s+mich\s+(dumm|bl[öo]d|idiot)/i, // de
    /\bmi\s+prende\s+in\s+giro|\bdisprezz|\balza\s+gli\s+occhi\s+al\s+cielo|\bmi\s+ha\s+dato\s+dell?['a ]\s*(idiota|stupid)/i, // it
    /\bzomb(ou|a)\s+de\s+mim|\bme\s+despreza|\brevirou\s+os\s+olhos|\bme\s+chamou\s+de\s+(burr|idiota|in[uú]til)/i, // pt
    /馬鹿にされ|バカにされ|見下され|軽蔑|鼻で笑/, // ja
    /看不起我|嘲笑我|鄙视|鄙視|翻白眼|瞧不起/, // zh
    /무시당|비웃|경멸|깔보/, // ko
  ],
  defensiveness: [
    /\bnot\s+(my|his|her|their)\s+fault\b/i, /\b(blames?|blamed|blaming)\s+me\b/i, /\bturned\s+it\s+(around\s+)?on\s+me\b/i, /\b(gets|got|getting)\s+(so\s+)?defensive\b/i,
    /\bmakes?\s+excuses\b/i, /\bnever\s+(takes\s+responsibility|admits)\b/i,
    /\bme\s+echa\s+la\s+culpa|\bse\s+pone\s+a\s+la\s+defensiva|\bnunca\s+admite/i, // es
    /\bme\s+met\s+tout\s+sur\s+le\s+dos|\bsur\s+la\s+d[ée]fensive|\bc'est\s+(toujours\s+)?ma\s+faute|\bn'admet\s+jamais/i, // fr
    /\bgibt\s+mir\s+die\s+schuld|\bschiebt\s+(mir\s+)?die\s+schuld|\bin\s+die\s+defensive|\bnie\s+(seine|ihre)\s+schuld/i, // de
    /\bd[àa]\s+la\s+colpa\s+a\s+me|\bsulla\s+difensiva|\bnon\s+ammette\s+mai/i, // it
    /\bme\s+culpa\b|\bna\s+defensiva|\bnunca\s+admite|\bp[õo]e\s+a\s+culpa\s+em\s+mim/i, // pt
    /言い訳ばかり|私のせいに|人のせいに|逆ギレ|開き直/, // ja
    /怪我|推卸责任|推卸責任|找借口|找藉口|倒打一耙/, // zh
    /내\s*탓|남\s*탓|변명만|적반하장/, // ko
  ],
  stonewalling: [
    /\bsilent\s+treatment\b/i, /\bshuts?\s+(me\s+)?(down|out)\b/i, /\b(won'?t|refuses?\s+to|wouldn'?t)\s+talk\b/i, /\bwalked\s+out\b/i, /\bstonewall/i,
    /\bignor(ed|es|ing)\s+me\b/i, /\bstopped\s+talking\s+to\s+me\b/i, /\bcold\s+shoulder\b/i,
    /\bley\s+del\s+hielo|\bno\s+me\s+habla|\bme\s+ignor[aó]|\bse\s+niega\s+a\s+hablar/i, // es
    /\bne\s+me\s+parle\s+plus|\bm'ignore|\brefuse\s+de\s+(me\s+)?parler|\bboude/i, // fr
    /\bschweigt\s+mich\s+an|\bredet\s+nicht\s+mehr\s+mit\s+mir|\bignoriert\s+mich|\bblockt\s+(alles\s+)?ab|\bmacht\s+dicht/i, // de
    /\bnon\s+mi\s+parla|\bmi\s+ignora|\bmuro\s+di\s+silenzio|\bsi\s+rifiuta\s+di\s+parlare/i, // it
    /\bn[ãa]o\s+fala\s+comigo|\bme\s+ignora|\bse\s+recusa\s+a\s+conversar|\bme\s+deu\s+um\s+gelo/i, // pt
    /無視され|口をきいてくれない|黙り込|話し合いを拒/, // ja
    /冷战|冷戰|不理我|不跟我说话|不跟我說話|拒绝沟通|拒絕溝通/, // zh
    /잠수/, /무시해/, /말을\s*안\s*해/, /대화를\s*거부/, /입을\s*닫/, // ko
  ],
  unheard: [
    /\b(doesn'?t|does\s+not|never|won'?t)\s+(really\s+)?listen/i, /\bnot\s+(being\s+)?heard\b/i, /\bunheard\b/i, /\btalking\s+to\s+a\s+wall\b/i,
    /\bdoesn'?t\s+(care|hear)\s+what\s+I\b/i, /\bnever\s+asks?\s+(about\s+me|how\s+I)/i,
    /\bno\s+me\s+escucha|\bno\s+me\s+siento\s+escuchad[ao]|\bhablar\s+con\s+la\s+pared/i, // es
    /\bne\s+m'[ée]coute\s+(pas|jamais)|\bpas\s+[ée]cout[ée]e?|\bparler\s+[àa]\s+un\s+mur/i, // fr
    /\bh[öo]rt\s+mir\s+(nie\s+|nicht\s+)?(richtig\s+)?zu\b|\bf[üu]hle\s+mich\s+nicht\s+geh[öo]rt|\bgegen\s+eine\s+wand\s+reden/i, // de
    /\bnon\s+mi\s+ascolta|\bnon\s+mi\s+sento\s+ascoltat[ao]|\bparlare\s+al\s+muro/i, // it
    /\bn[ãa]o\s+me\s+(escuta|ouve)|\bn[ãa]o\s+me\s+sinto\s+ouvid[ao]|\bfalar\s+com\s+a\s+parede/i, // pt
    /話を聞いてくれない|聞いてもらえない|わかってくれない|分かってくれない/, // ja
    /不听我说|不聽我說|不在乎我的感受|没人听我|沒人聽我|对牛弹琴|對牛彈琴/, // zh
    /내\s*말을\s*안\s*들/, /들어주지\s*않/, /말이\s*안\s*통/, // ko
  ],
  lonely: [
    /\blonely\b/i, /\bloneliness\b/i, /\bfeel\s+(so\s+|really\s+)?alone\b/i, /\blike\s+roommates\b/i, /\balone\s+in\s+(this|our|my)\s+(relationship|marriage)\b/i,
    /\bme\s+siento\s+sol[ao]|\bsoledad|\bcomo\s+compa[ñn]eros\s+de\s+piso/i, // es
    /\bme\s+sens\s+seule?|\bsolitude|\bcomme\s+des\s+colocataires/i, // fr
    /\beinsam|\bf[üu]hle\s+mich\s+allein|\bwie\s+mitbewohner/i, // de
    /\bmi\s+sento\s+sol[ao]|\bsolitudine|\bcome\s+coinquilini/i, // it
    /\bme\s+sinto\s+sozinh[ao]|\bsolid[ãa]o|\bcomo\s+colegas\s+de\s+(quarto|casa)/i, // pt
    /寂しい|さみしい|孤独|ひとりぼっち|同居人みたい/, // ja
    /孤独|孤獨|孤单|孤單|寂寞|像室友/, // zh
    /외로/, /외롭/, /혼자인\s*것\s*같/, /룸메이트\s*같/, // ko
  ],
  sameFight: [
    /\bsame\s+(old\s+)?(fight|argument)\b/i, /\b(fighting|arguing|fought|argued)\s+about\s+(this|it|that)\s+again\b/i, /\bagain\s+and\s+again\b/i,
    /\bover\s+and\s+over\b/i, /\bnever\s+(gets\s+)?resolved\b/i, /\bkeeps?\s+coming\s+(up|back)\b/i,
    /\bla\s+misma\s+(pelea|discusi[oó]n)|\botra\s+vez\s+lo\s+mismo|\bnunca\s+se\s+resuelve/i, // es
    /\bla\s+m[êe]me\s+dispute|\bencore\s+la\s+m[êe]me|\bjamais\s+r[ée]gl[ée]/i, // fr
    /\bderselbe\s+streit|\bimmer\s+wieder\s+(der|die|das)\s+gleiche|\bschon\s+wieder\s+(dieser|der)\s+streit|\bnie\s+gel[öo]st/i, // de
    /\b(solita|stessa)\s+litigata|\bsempre\s+la\s+stessa\s+(storia|discussione)/i, // it
    /\bmesma\s+(briga|discuss[ãa]o)|\bde\s+novo\s+a\s+mesma/i, // pt
    /また同じことで|いつもの喧嘩|同じ喧嘩|同じことでけんか/, // ja
    /又为同一件事|又為同一件事|老问题|老問題|同样的争吵|同樣的爭吵/, // zh
    /또\s*같은\s*문제/, /똑같은\s*싸움/, /맨날\s*같은/, // ko
  ],
  repair: [
    /\b(apologi[sz]ed|said\s+(he|she|they)?\s*(was|were)?\s*sorry|made\s+up|talked\s+it\s+(out|through)|laughed\s+it\s+off|worked\s+it\s+out)\b/i,
    /\bme\s+pidi[oó]\s+perd[oó]n|\bnos\s+reconciliamos|\bhicimos\s+las\s+paces/i, // es
    /\bs'est\s+excus[ée]|\bon\s+s'est\s+r[ée]concili[ée]s|\bm'a\s+demand[ée]\s+pardon/i, // fr
    /\bhat\s+sich\s+entschuldigt|\bwir\s+haben\s+uns\s+vers[öo]hnt|\bausgeredet/i, // de
    /\bmi\s+ha\s+chiesto\s+scusa|\babbiamo\s+fatto\s+pace|\bci\s+siamo\s+chiariti/i, // it
    /\bme\s+pediu\s+desculpa|\bfizemos\s+as\s+pazes/i, // pt
    /謝ってくれ|仲直り|話し合えた/, /道歉了|和好|聊开了|聊開了/, /사과했/, /화해했/, // ja zh ko
  ],
  warm: [
    /\b(grateful|thankful|felt\s+(so\s+)?loved|so\s+happy|laughed\s+together|we\s+laughed|appreciated?|best\s+day|cozy)\b/i,
    /\bagradecid[ao]|\bfeliz\b|\bnos\s+re[ií]mos|\bme\s+sent[ií]\s+querid[ao]/i, // es
    /\breconnaissante?|\bheureuse?\b|\bon\s+a\s+ri\b|\bme\s+suis\s+sentie?\s+aim[ée]e?/i, // fr
    /\bdankbar|\bgl[üu]cklich|\bgelacht|\bgeliebt\s+gef[üu]hlt/i, // de
    /\bgrat[oa](?!\w)|\bfelice\b|\babbiamo\s+riso/i, // it
    /\bgrat[oa](?!\w)|\bfeliz\b|\brimos\s+juntos|\bme\s+senti\s+amad[ao]/i, // pt
    /嬉しい|うれしい|幸せ|感謝|笑った/, /开心|開心|幸福|感谢|感謝|笑了/, /행복/, /고마/, /감사/, /웃었/, // ja zh ko
  ],
  hard: [
    /\b(fight|fought|argument|argued|yelled|screamed|cried|angry|furious|upset)\b/i,
    /\bpelea|\bdiscutimos|\bgrit[oó]|\bllor[eé]|\benojad|\benfadad/i, // es
    /\bdispute|\bdisput[ée]s|\bcri[ée]|\bpleur[ée]|\ben\s+col[èe]re|\b[ée]nerv[ée]/i, // fr
    /\bstreit|\bgestritten|\bgeschrien|\bgeweint|\bw[üu]tend/i, // de
    /\blitigat|\burlat|\bpiant|\barrabbiat/i, // it
    /\bbrig(a|amos|ou)\b|\bgritou|\bchorei|\birritad|\bmagoad/i, // pt
    /喧嘩|けんか|泣いた|怒って|腹が立/, /吵架|哭了|生气|生氣|伤心|傷心/, /싸웠/, /싸움/, /울었/, /화가\s*났/, // ja zh ko
  ],
};

// A mismatch is a topic said in the same sentence as a disagreement, not the topic alone
const DISAGREE: RegExp[] = [
  /\b(disagree|don'?t\s+agree|doesn'?t\s+want|don'?t\s+want|won'?t|can'?t\s+agree|fight\s+about|argue\s+about|fought\s+about|argued\s+about|not\s+on\s+the\s+same\s+page|deal[-\s]?breaker|refuses?)\b/i,
  /\bwants?\b.*\bI\s+don'?t\b/i, /\bI\s+want\b.*\b(he|she|they)\s+(doesn'?t|don'?t)\b/i,
  /\bno\s+quiere|\bno\s+estamos\s+de\s+acuerdo|\bdiscutimos\s+(por|sobre)|\bpeleamos\s+por/i, // es
  /\bne\s+veut\s+pas|\bpas\s+d'accord|\bdispute\s+(sur|pour|[àa]\s+propos)|\bon\s+se\s+dispute/i, // fr
  /\bwill\s+(keine|nicht)|\bnicht\s+einig|\bstreiten\s+(uns\s+)?([üu]ber|wegen)/i, // de
  /\bnon\s+vuole|\bnon\s+siamo\s+d'accordo|\blitighiamo\s+(per|su)/i, // it
  /\bn[ãa]o\s+quer\b|\bn[ãa]o\s+concordamos|\bbrigamos\s+por/i, // pt
  /意見が合わない|欲しくない|したくない|揉め|もめ|喧嘩|けんか/, /不想要|意见不合|意見不合|吵架|争执|爭執/, /원하지\s*않/, /의견이\s*안\s*맞/, /싸웠/, /다퉜/, // ja zh ko
];
const TOPICS: Record<'kids' | 'place' | 'money' | 'faith' | 'ambition', RegExp[]> = {
  kids: [/\b(kids?|children|a\s+baby|have\s+a\s+child)\b/i, /\bhijos|\bbeb[eé](?!\w)|\benfants?\b|\bb[ée]b[ée](?!\w)|\bkinder\b|\bfigli|\bfilhos|\bbeb[êe](?!\w)/i, /子ども|子供|赤ちゃん/, /孩子|小孩|生育/, /아이/, /아기/, /자녀/, /출산/],
  place: [/\b(move|moving|relocat\w*|where\s+to\s+live|which\s+city|back\s+home)\b/i, /\bmudar(nos|se)?\b|\bvivir\s+en\b|\bd[ée]m[ée]nager|\bumziehen|\bziehen\s+nach|\btrasferir|\bmorar\s+em\b/i, /引っ越|どこに住/, /搬家|定居|哪个城市|哪個城市/, /이사/, /어디서\s*살/],
  money: [/\b(money|spend\w*|debt|savings|budget|finances?)\b/i, /\bdinero|\bdeudas?\b|\bargent\b|\bd[ée]penses|\bgeld\b|\bschulden|\bsoldi\b|\bdebiti|\bdinheiro|\bd[íi]vidas?/i, /お金|借金|貯金|浪費/, /[钱錢]|存款|债务|債務/, /돈/, /빚/, /저축/],
  faith: [/\b(religion|religious|church|faith|god|mosque|temple|synagogue|convert)\b/i, /\breligi[oóã]n?|\biglesia|\b[ée]glise|\bkirche|\bchiesa|\bigreja|\bglaube\b|\bfede\b|\bf[ée](?!\w)|\bfoi\b/i, /宗教|信仰/, /教会|教會/, /종교/, /교회/, /신앙/],
  ambition: [/\b(career|ambition|promotion|works?\s+too\s+much|always\s+working)\b/i, /\bcarrera\b|\bcarri[èe]re|\bkarriere|\bcarriera|\bcarreira|\bambici[oó]n|\bambition|\behrgeiz|\bambizione|\bambi[çc][ãa]o/i, /仕事ばかり|キャリア|転職/, /事业|事業|工作狂/, /커리어/, /일만/, /직장/],
};

/** One piece of the person's own writing */
export interface ClarityItem { kind: 'entry' | 'chat' | 'answer'; id: string; owner: string; text: string; at: string }
export interface Source { kind: ClarityItem['kind']; id: string; at: string; excerpt: string }
export interface Pattern { key: PatternKey; count: number; first: string; last: string; sources: Source[] }

const sentences = (text: string) => text.split(/(?<=[.!?。！？])\s*|\n+/).map(s => s.trim()).filter(Boolean);
const clip = (s: string, n = 240) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** The patterns found in one piece of writing, each with the sentence that showed it */
export function detect(text: string): Map<PatternKey, string> {
  const out = new Map<PatternKey, string>();
  for (const s of sentences(String(text ?? '').slice(0, 20000))) {
    for (const [key, rs] of Object.entries(P) as [PatternKey, RegExp[]][]) if (!out.has(key) && rs.some(r => r.test(s))) out.set(key, s);
    if (DISAGREE.some(r => r.test(s))) for (const [key, rs] of Object.entries(TOPICS) as [PatternKey, RegExp[]][]) if (!out.has(key) && rs.some(r => r.test(s))) out.set(key, s);
  }
  return out;
}

/** Only the person's own writing, whatever the query returned: a partner's row never gets in */
export function ownItems(userId: string, items: ClarityItem[]): ClarityItem[] {
  return items.filter(i => i && i.owner === userId && typeof i.text === 'string' && i.text.trim() && !Number.isNaN(Date.parse(i.at)));
}

export const WINDOW_DAYS = 90;
/** A pattern is shown once it shows up in at least this many separate pieces of writing in the window */
export const MIN_COUNT = 2;
const DAY = 86_400_000;

export interface ClaritySummary {
  windowDays: number;
  written: number;
  patterns: Pattern[];
  balance: { warm: number; hard: number };
  safety: { abuse: boolean; crisis: boolean; dvLine: string | null; crisisLine: string | null };
  steps: StepKey[];
  questions: QuestionKey[];
  counselling: Counselling | null;
}

export type StepKey = 'safety' | 'support' | 'talk' | 'checkin' | 'counsel' | 'part';
export type QuestionKey = 'want' | 'unsaid' | 'change' | 'line';

/** Everything the page shows, from the person's own writing. Pure. */
export function summarize(userId: string, raw: ClarityItem[], country: string, now = Date.now()): ClaritySummary {
  const items = ownItems(userId, raw).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const since = now - WINDOW_DAYS * DAY;
  const recent = items.filter(i => Date.parse(i.at) >= since && Date.parse(i.at) <= now + DAY);
  const found = new Map<PatternKey, Source[]>();
  for (const it of recent) for (const [key, sentence] of detect(it.text)) {
    const list = found.get(key) ?? [];
    list.push({ kind: it.kind, id: it.id, at: it.at, excerpt: clip(sentence) });
    found.set(key, list);
  }
  const patterns: Pattern[] = [...found.entries()]
    .filter(([key, s]) => key !== 'hard' && key !== 'warm' && s.length >= MIN_COUNT)
    .map(([key, s]) => ({ key, count: s.length, first: s[0].at, last: s[s.length - 1].at, sources: s.slice(-12).reverse() }))
    .sort((a, b) => (STRENGTHS.includes(a.key) ? 1 : 0) - (STRENGTHS.includes(b.key) ? 1 : 0) || b.count - a.count);
  // Abuse and crisis look further back: a year, and a month
  const abuse = items.some(i => Date.parse(i.at) >= now - 365 * DAY && dvSignal(i.text));
  const crisis = items.some(i => Date.parse(i.at) >= now - 30 * DAY && crisisSignal(i.text));
  const mismatch = patterns.some(p => MISMATCHES.includes(p.key));
  return {
    windowDays: WINDOW_DAYS,
    written: recent.length,
    patterns,
    balance: { warm: found.get('warm')?.length ?? 0, hard: found.get('hard')?.length ?? 0 },
    safety: { abuse, crisis, dvLine: abuse ? dvLine(country) : null, crisisLine: crisis ? crisisLine(country) : null },
    steps: nextSteps(abuse, mismatch),
    questions: abuse ? ['want'] : mismatch ? ['want', 'line', 'unsaid', 'change'] : ['want', 'unsaid', 'change'],
    counselling: abuse ? null : counsellingFor(country),
  };
}

/**
 * Next steps. With any sign of abuse: the domestic-abuse line and a safety plan with professionals, then support for
 * them alone. Never a guided breakup conversation, a mismatch check-in or couples counseling, which are not advised
 * where there is abuse.
 */
export function nextSteps(abuse: boolean, mismatch: boolean): StepKey[] {
  if (abuse) return ['safety', 'support'];
  return mismatch ? ['talk', 'checkin', 'counsel', 'part'] : ['talk', 'counsel', 'part'];
}

export interface Counselling { name: string; url: string; phone?: string }
// Directories that exist, checked 2026-11-02. Elsewhere the page says how to find a licensed couples therapist without
// naming one: no provider is ever made up.
const COUNSELLING: Record<string, Counselling> = {
  US: { name: 'AAMFT Therapist Locator', url: 'https://www.therapistlocator.net' },
  GB: { name: 'Relate', url: 'https://www.relate.org.uk' },
  AU: { name: 'Relationships Australia', url: 'https://www.relationships.org.au', phone: '1300 364 277' },
};
export function counsellingFor(country: string): Counselling | null {
  return COUNSELLING[country] ?? null;
}

/** How Bella talks on the Clarity page. Built from the summary and the person's own answers, nothing else. */
export function clarityInstruction(s: ClaritySummary, answers: { key: string; text: string }[], name: string, country: string): string {
  const pats = s.patterns.map(p => `${p.key}: ${p.count} times in the last ${s.windowDays} days (first ${p.first.slice(0, 10)}, last ${p.last.slice(0, 10)})`).join('; ') || 'nothing that repeats yet';
  const ans = answers.slice(-6).map(a => `${a.key}: "${a.text.slice(0, 400)}"`).join('\n') || 'none yet';
  return [
    `You are Bella, Belluh's AI, talking privately with ${name} on their Clarity page. Only ${name} sees this. Their partner never does, and nothing here is shared, sent by text, or remembered anywhere else.`,
    `What Clarity noticed in ${name}'s own writing (counts of separate entries or messages, not judgments): ${pats}. Warm moments ${s.balance.warm}, hard moments ${s.balance.hard}.`,
    `Their own answers on this page:\n${ans}`,
    'How you talk: warm, plain, short (a few sentences). Patterns and questions, never verdicts. Never tell them to break up or to stay, never predict whether the relationship will last, never give a score, percentage or rating of the relationship or of their partner, and never diagnose anyone. Name what they have written about, with the counts above, ask what they want, and offer next steps: a guided honest conversation, a check-in on a mismatch (children, where to live, money, faith, work), couples counseling, or, if they have decided to part ways, help doing it kindly and practically (how to say it, logistics, and their shared story, which they can archive, download or delete in the app). Only say what the research supports; if unsure, say you are not sure. Reply in the language they write in.',
    s.safety.abuse ? `SAFETY: their writing shows signs that their partner may hurt, threaten, frighten or control them. Before anything else, gently give this line exactly: "${dvLine(country)}" and suggest a safety plan with that service. Do NOT coach a breakup or a confrontation and do not suggest couples counseling: leaving can be the most dangerous time, and the professionals on that line help plan it safely.` : '',
    s.safety.crisis ? `If they mention wanting to die or hurt themselves, give this line exactly: "${crisisLine(country)}"` : '',
  ].filter(Boolean).join('\n\n');
}
