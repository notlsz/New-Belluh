// Safety that never depends on the model: a fixed check for talk of suicide or self-harm, run on every message in
// every channel, with the crisis line for where they live in their own language; and Bella saying she is an AI at the
// start of every texting conversation and again after three hours (New York's AI companion law, Nov 5 2025; California
// SB 243, Jan 1 2026; EU AI Act Article 50, Aug 2 2026). The published protocol is on belluh.com/safety-tips.

// Words people actually use, in the languages Belluh speaks. Wide on purpose: a false alarm costs one extra line.
const SIGNALS: RegExp[] = [
  /\b(kill|hurt|harm|cut)\s+my\s*self\b/i, /\bsuicid/i, /\bend\s+(it\s+all|my\s+life)\b/i, /\b(want|wanna|going)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|be\s+here)\b/i, /\bbetter\s+off\s+(dead|without\s+me)\b/i, /\bno\s+reason\s+to\s+live\b/i,
  /\bself[-\s]?harm/i, /\btake\s+my\s+(own\s+)?life\b/i,
  /\bsuicid[ae]r?/i, /\bquiero\s+morir/i, /\bmatarme\b/i, /\bquitarme\s+la\s+vida\b/i, /\bno\s+quiero\s+vivir\b/i, // es
  /\bme\s+matar\b/i, /\bquero\s+morrer\b/i, /\bn[aã]o\s+quero\s+(mais\s+)?viver\b/i, // pt
  /\bme\s+suicider\b/i, /\bje\s+veux\s+mourir\b/i, /\ben\s+finir\b/i, // fr
  /\bvoglio\s+morire\b/i, /\bfarla\s+finita\b/i, /\bammazzarmi\b/i, // it
  /\bsuizid/i, /\bselbstmord/i, /\bumbringen\b/i, /\bnicht\s+mehr\s+leben\b/i, /\bsterben\s+will\b/i, // de
  /死にたい/, /自殺/, /消えたい/, /自傷/, // ja
  /想死/, /自杀/, /自殺/, /不想活/, /自残/, // zh
  /죽고\s*싶/, /자살/, /자해/, // ko
];

export function crisisSignal(text: string): boolean {
  return SIGNALS.some(r => r.test(text));
}

// The line to call where they live, said in their language. Numbers checked against each service's own site.
const LINES: Record<string, string> = {
  US: 'If you are thinking about ending your life, please call or text 988 (Suicide & Crisis Lifeline), any time. If you are in danger right now, call 911.',
  CA: 'If you are thinking about ending your life, please call or text 988, any time. If you are in danger right now, call 911.',
  GB: 'If you are thinking about ending your life, please call Samaritans on 116 123, free, any time. If you are in danger right now, call 999.',
  AU: 'If you are thinking about ending your life, please call Lifeline on 13 11 14, any time. If you are in danger right now, call 000.',
  JP: '死にたい気持ちがあるなら、よりそいホットライン（0120-279-338、24時間・無料）に電話してください。今すぐ危険なときは119番へ。',
  KR: '스스로를 해치고 싶은 마음이 든다면, 자살예방상담전화 109로 지금 전화해 주세요. 24시간 열려 있어요. 위급하면 119로 연락하세요.',
  CN: '如果你有轻生的念头，请拨打全国心理援助热线 12356。如果现在有危险，请拨打 120 或 110。',
  TW: '如果你有輕生的念頭，請撥打安心專線 1925，24 小時都有人接聽。如果現在有危險，請撥打 119。',
  HK: '如果你有輕生的念頭，請致電撒瑪利亞防止自殺會 2389 2222，24 小時有人接聽。如果現在有危險，請致電 999。',
  SG: 'If you are thinking about ending your life, please call SOS on 1767, any time. If you are in danger right now, call 995.',
  IN: 'If you are thinking about ending your life, please call Tele-MANAS on 14416, free, any time. If you are in danger right now, call 112.',
  AE: 'If you are thinking about ending your life, please call the mental support line on 800 4673 (800 HOPE). If you are in danger right now, call 999.',
  FR: 'Si tu penses à mettre fin à tes jours, appelle le 3114, gratuit, 24h/24. En danger immédiat, appelle le 112.',
  DE: 'Wenn du daran denkst, dir das Leben zu nehmen, ruf bitte die TelefonSeelsorge an: 0800 111 0 111, kostenlos, rund um die Uhr. In akuter Gefahr: 112.',
  CH: 'Wenn du daran denkst, dir das Leben zu nehmen, ruf bitte Die Dargebotene Hand an: 143, rund um die Uhr. In akuter Gefahr: 144.',
  ES: 'Si estás pensando en quitarte la vida, llama al 024, gratis, a cualquier hora. Si estás en peligro ahora, llama al 112.',
  IT: 'Se stai pensando di toglierti la vita, chiama Telefono Amico allo 02 2327 2327. Se sei in pericolo adesso, chiama il 112.',
  MX: 'Si estás pensando en quitarte la vida, llama a la Línea de la Vida al 800 911 2000, gratis, las 24 horas. Si estás en peligro ahora, llama al 911.',
  BR: 'Se você está pensando em tirar a própria vida, ligue para o CVV no 188, de graça, a qualquer hora. Se estiver em perigo agora, ligue 192.',
  PT: 'Se está a pensar em pôr fim à vida, ligue para o SNS 24 (808 24 24 24) e escolha o apoio psicológico. Em perigo imediato, ligue 112.',
};
const FALLBACK = 'If you are thinking about ending your life, please call your local emergency number or a crisis line where you live, now. You do not have to go through this alone.';

export function crisisLine(country: string): string {
  return LINES[country] ?? FALLBACK;
}

/** What the model is told on a turn where someone may be in danger. */
export function crisisInstruction(country: string): string {
  return `\n\nSAFETY, THIS TURN COMES FIRST: what they just said may mean they are thinking about suicide or self-harm. Put everything else aside. Answer with warmth and no judgment, in a few short sentences: say you're glad they told you, ask if they are safe right now, and give them this line exactly: "${crisisLine(country)}" Do not plan, book, joke or change the subject.`;
}

/** The crisis line is always in the reply on such a turn, whatever the model wrote. */
export function withCrisisLine(reply: string, country: string): string {
  const line = crisisLine(country);
  const number = line.match(/\d[\d\s-]{1,14}\d|\d{3,}/)?.[0]?.replace(/\s/g, '');
  if (number && reply.replace(/\s/g, '').includes(number)) return reply;
  return `${reply.trim()}\n\n${line}`;
}

// Bella says she is an AI at the start of each texting conversation, and again after three hours of talking
const DISCLOSE: Record<string, string> = {
  en: "(I'm Bella, Belluh's AI, not a person.)",
  ja: '（私はBelluhのAI、Bellaです。人間ではありません。）',
  ko: '(저는 Belluh의 AI, Bella예요. 사람이 아니에요.)',
  zh: '（我是 Belluh 的 AI Bella，不是真人。）',
  fr: "(Je suis Bella, l'IA de Belluh, pas une personne.)",
  de: '(Ich bin Bella, die KI von Belluh, kein Mensch.)',
  es: '(Soy Bella, la IA de Belluh, no una persona.)',
  it: "(Sono Bella, l'IA di Belluh, non una persona.)",
  pt: '(Eu sou a Bella, a IA da Belluh, não uma pessoa.)',
};
const LANG_OF: Record<string, string> = { JP: 'ja', KR: 'ko', CN: 'zh', TW: 'zh', HK: 'zh', FR: 'fr', DE: 'de', CH: 'de', AT: 'de', ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', IT: 'it', BR: 'pt', PT: 'pt' };

export function disclosure(country: string): string {
  return DISCLOSE[LANG_OF[country] ?? 'en'];
}

export const DISCLOSE_EVERY_MS = 3 * 60 * 60 * 1000;

/** Whether this texting reply should open with the disclosure: a new conversation, or three hours since the last one. */
export function needsDisclosure(lastDisclosedAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastDisclosedAt) return true;
  const t = Date.parse(lastDisclosedAt);
  return !Number.isFinite(t) || now - t >= DISCLOSE_EVERY_MS;
}
