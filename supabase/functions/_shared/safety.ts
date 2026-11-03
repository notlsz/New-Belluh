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
  TR: "Hayatına son vermeyi düşünüyorsan lütfen hemen 112'yi ara; ücretsiz ve her saat açık. Yalnız değilsin.",
  SA: 'إذا كانت تراودك أفكار لإنهاء حياتك، اتصل بوزارة الصحة على 937 في أي وقت. وإذا كنت في خطر الآن، اتصل بالإسعاف على 997.',
  NL: 'Als je eraan denkt een einde aan je leven te maken, bel dan 113 of gratis 0800-0113, dag en nacht. Ben je nu in gevaar, bel 112.',
  NO: 'Hvis du tenker på å ta ditt eget liv, ring Mental Helse på 116 123, døgnet rundt. Er du i akutt fare, ring 113.',
  PL: 'Jeśli myślisz o odebraniu sobie życia, zadzwoń pod 116 123 albo bezpłatnie pod 800 70 2222, całą dobę. W nagłym niebezpieczeństwie dzwoń na 112.',
  BE: 'Als je eraan denkt een einde aan je leven te maken, bel de Zelfmoordlijn op 1813, dag en nacht. Si tu penses à mettre fin à tes jours, appelle le 0800 32 123. In acuut gevaar / en danger immédiat: 112.',
  IE: 'If you are thinking about ending your life, please call Samaritans on 116 123, free, any time. If you are in danger right now, call 112 or 999.',
  SE: 'Om du tänker på att ta ditt liv, ring Självmordslinjen på 90101, dygnet runt. Är du i fara just nu, ring 112.',
  AT: 'Wenn du daran denkst, dir das Leben zu nehmen, ruf bitte die TelefonSeelsorge an: 142, rund um die Uhr. In akuter Gefahr: 144.',
  AR: 'Si estás pensando en quitarte la vida, llamá al Centro de Asistencia al Suicida: 135 (gratis desde CABA y GBA) o (011) 5275-1135 desde todo el país. Si estás en peligro ahora, llamá al 911.',
  MY: 'If you are thinking about ending your life, please call Befrienders KL on 03-7627 2929, free, any time. If you are in danger right now, call 999.',
  TH: 'ถ้าคุณกำลังคิดจะจบชีวิตตัวเอง โทรสายด่วนสุขภาพจิต 1323 ได้ฟรี ตลอด 24 ชั่วโมง ถ้าอยู่ในอันตรายตอนนี้ โทร 1669',
  ID: 'Kalau kamu sedang berpikir untuk mengakhiri hidup, hubungi Healing119 di 119 ext 8, gratis, 24 jam. Kalau kamu dalam bahaya sekarang, hubungi 112.',
  DK: 'Hvis du tænker på at tage dit eget liv, så ring til Livslinien på 70 201 201. Er du i akut fare, ring 112.',
  IL: 'אם עולות לך מחשבות לשים קץ לחייך, אפשר להתקשר לער"ן בטלפון 1201, בכל שעה. בסכנה מיידית, חייגו 101.',
  NZ: 'If you are thinking about ending your life, please call or text 1737, free, any time. If you are in danger right now, call 111.',
  FI: 'Jos mietit elämäsi päättämistä, soita MIELI ry:n Kriisipuhelimeen 09 2525 0111, se on auki ympäri vuorokauden. Jos olet välittömässä vaarassa, soita 112.',
  CL: 'Si estás pensando en quitarte la vida, llama gratis al *4141 desde cualquier celular, las 24 horas. Si estás en peligro ahora, llama al 131.',
  CZ: 'Pokud myslíš na to, že si vezmeš život, zavolej na Linku první psychické pomoci 116 123, zdarma a nonstop. V akutním ohrožení volej 155 nebo 112.',
  ZA: 'If you are thinking about ending your life, please call the SADAG Suicide Crisis Helpline on 0800 567 567, free, any time. If you are in danger right now, call 112 or 10111.',
  GR: 'Αν σκέφτεσαι να βάλεις τέλος στη ζωή σου, κάλεσε τη Γραμμή Παρέμβασης για την Αυτοκτονία στο 1018, όλο το 24ωρο. Σε άμεσο κίνδυνο, κάλεσε το 112.',
  CO: 'Si estás pensando en quitarte la vida, llama a la Línea 106, gratis y las 24 horas. Si estás en peligro ahora, llama al 123.',
  HU: 'Ha azon gondolkodsz, hogy véget vetsz az életednek, hívd a Lelki Elsősegély Telefonszolgálatot a 116-123 számon, ingyenesen, éjjel-nappal. Közvetlen veszélyben hívd a 112-t.',
  RO: 'Dacă te gândești să-ți iei viața, sună gratuit la Telefonul Verde Antisuicid, 0800 801 200. Dacă ești în pericol acum, sună la 112.',
  KZ: 'Если ты думаешь о том, чтобы уйти из жизни, позвони на линию 111: круглосуточно и анонимно. Если ты в опасности прямо сейчас, звони 112.',
  EG: 'لو بتفكر تنهي حياتك، كلّم الخط الساخن للدعم النفسي 16328، شغال على مدار الساعة. ولو في خطر دلوقتي، اتصل بالإسعاف على 123.',
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

// Abuse at home: a fixed check, like the crisis check, for signs of violence, threats, fear of a partner or coercive
// control. When it fires, Bella gives the local domestic-abuse line first and never coaches a breakup conversation:
// leaving is when risk is highest (Campbell et al., American Journal of Public Health 2003;93(7):1089-97, separation
// after living together aOR 3.64, with a highly controlling partner aOR 8.98). Wide on purpose: a false alarm costs one
// extra line. Used by Clarity (clarity.ts) and every chat.
const DV_SIGNALS: RegExp[] = [
  /\b(he|she|they|partner|husband|wife|boyfriend|girlfriend|bf|gf|fianc[ée]e?)\s+(\w+\s+)?(hit|hits|slapped|slaps|punched|punches|kicked|kicks|shoved|shoves|choked|chokes|strangled|strangles|grabbed|beat|beats|bit)\s+me\b/i,
  /\b(he|she|they|partner|husband|wife|boyfriend|girlfriend)\s+(\w+\s+)?pushed\s+me\b(?!\s+(to|into|out\s+of))/i,
  /\bthreaten(ed|s|ing)?\s+(to\s+)?(kill|hurt|harm|take\s+the\s+kids|take\s+my\s+kids|ruin\s+me|leave\s+me\s+with\s+nothing)/i,
  /\b(afraid|scared|terrified|frightened)\s+of\s+(him|her|them|my\s+(partner|husband|wife|boyfriend|girlfriend|fianc[ée]e?))\b/i,
  /\b(won'?t|doesn'?t|does\s+not|will\s+not)\s+let\s+me\s+(see\s+my|go\s+out|leave|talk\s+to|have\s+my\s+own|work)\b/i,
  /\b(checks|reads|goes\s+through|tracks|monitors)\s+my\s+(phone|messages|texts|location|email)\b/i,
  /\b(controls|took|takes|keeps)\s+(all\s+)?my\s+(money|phone|passport|keys|car|cards?)\b/i,
  /\bforced\s+me\s+to\b/i, /\bdomestic\s+(violence|abuse)\b/i, /\b(he|she|they)\s+(is|are)\s+abusive\b/i, /\babus(ed|es|ing)\s+me\b/i,
  /\bwalking\s+on\s+eggshells\b/i,
  /\bme\s+(peg[aó]|golpe[aó]|empuj[oó]|ahorc[oó]|amenaz[oó]|pega|golpea)(?![a-záéíóúñ])/i, /\btengo\s+miedo\s+(de\s+él|de\s+ella|de\s+mi\s+(pareja|marido|esposo|esposa|novio|novia))/i,
  /\bno\s+me\s+deja\s+(ver\s+a|salir|hablar\s+con|trabajar)/i, /\brevisa\s+mi\s+(celular|m[oó]vil|tel[eé]fono)/i, /\bcontrola\s+mi\s+dinero/i,
  /\bviolencia\s+(dom[eé]stica|de\s+g[eé]nero|machista)/i, /\bme\s+maltrata/i, // es
  /\bme\s+(bateu|empurrou|enforcou|amea[çc]ou|bate|agrediu)(?![a-zãõçáéíóú])/i, /\btenho\s+medo\s+(dele|dela|do\s+meu|da\s+minha)/i, /\bn[ãa]o\s+me\s+deixa\s+(ver|sair|falar|trabalhar)/i,
  /\bmexe\s+no\s+meu\s+(celular|telem[oó]vel)/i, /\bcontrola\s+o\s+meu\s+dinheiro|\bcontrola\s+meu\s+dinheiro/i, /\bviol[êe]ncia\s+dom[ée]stica/i, // pt
  /\bm'a\s+(frapp[ée]e?|gifl[ée]e?|pouss[ée]e?|[ée]trangl[ée]e?|menac[ée]e?|cogn[ée]e?)/i, /\bme\s+(frappe|bat)\b/i,
  /\bj'ai\s+peur\s+de\s+(lui|elle|mon\s+(mari|copain|compagnon|conjoint)|ma\s+(femme|copine|compagne|conjointe))/i,
  /\bne\s+me\s+laisse\s+pas\s+(voir|sortir|travailler)/i, /\bfouille\s+mon\s+t[ée]l[ée]phone/i, /\bcontr[ôo]le\s+mon\s+argent/i, /\bviolences?\s+conjugales?/i, // fr
  /\bhat\s+mich\s+(geschlagen|geschubst|gew[üu]rgt|bedroht|getreten|gestoßen)/i, /\bschl[äa]gt\s+mich\b/i,
  /\bich\s+habe\s+angst\s+vor\s+(ihm|ihr|meinem|meiner)/i, /\bl[äa]sst\s+mich\s+nicht\s+(raus|weg|arbeiten|meine)/i, /\bkontrolliert\s+mein(e|en)?\s+(handy|geld|nachrichten)/i, /\bh[äa]usliche\s+gewalt/i, // de
  /\bmi\s+ha\s+(picchiat[ao]|spint[ao]|minacciat[ao]|strangolat[ao]|dato\s+uno\s+schiaffo)/i, /\bmi\s+picchia\b/i,
  /\bho\s+paura\s+di\s+(lui|lei|mio\s+marito|mia\s+moglie|del\s+mio|della\s+mia)/i, /\bnon\s+mi\s+lascia\s+(uscire|vedere|lavorare)/i, /\bcontrolla\s+il\s+mio\s+(telefono|cellulare)/i, /\bviolenza\s+domestica/i, // it
  /殴られ/, /叩かれ/, /蹴られ/, /首を絞め/, /脅され/, /(彼|彼女|夫|妻|恋人|パートナー)が怖い/, /スマホをチェックされ/, /お金を管理され/, /\bDV\b/, // ja
  /(?<!给|給)打我(?!电话|電話)/, /被(他|她)打/, /掐我/, /威胁我/, /威脅我/, /(我|很)(怕|害怕)(他|她)/, /查我(的)?手[机機]/, /控制我的[钱錢]/, /家暴/, // zh
  /때렸/, /(한테|에게)\s*맞았/, /밀쳤/, /목을\s*졸/, /협박/, /(그|그녀|남편|아내|남자친구|여자친구|애인)(가|이)\s*무서/, /핸드폰을\s*(검사|확인)/, /돈을\s*통제/, /가정\s*폭력/, /데이트\s*폭력/, // ko
];

export function dvSignal(text: string): boolean {
  return DV_SIGNALS.some(r => r.test(text));
}

// Domestic-abuse lines, said in the local language, each checked at an official source on 2026-11-02 (see
// docs/growth/CHANGELOG.md for the links). Countries without a verified national line get the fallback.
const DV_LINES: Record<string, string> = {
  US: 'If you are being hurt or threatened at home, the National Domestic Violence Hotline is there any time: call 1-800-799-7233 or text START to 88788. If you are in danger right now, call 911.',
  CA: 'If you are being hurt or threatened at home, your province has a 24/7 line, listed at canada.ca/en/women-gender-equality/gender-based-violence/crisis-lines.html (Ontario: Assaulted Women\'s Helpline 1-866-863-0511; Québec: SOS violence conjugale 1-800-363-9010). If you are in danger right now, call 911.',
  GB: 'If you are being hurt or threatened at home, call the National Domestic Abuse Helpline (Refuge) on 0808 2000 247, free, 24 hours. If you are in danger right now, call 999.',
  IE: 'If you are being hurt or threatened at home, call the Women\'s Aid National Freephone Helpline on 1800 341 900, 24 hours. If you are in danger right now, call 112 or 999.',
  AU: 'If you are being hurt or threatened at home, call 1800RESPECT on 1800 737 732, 24/7. The number can show on a phone bill, so use a phone they can\'t see if that matters. If you are in danger right now, call 000.',
  NZ: 'If you are being hurt or threatened at home, call the Women\'s Refuge crisis line on 0800 733 843, 24/7. If you are in danger right now, call 111.',
  JP: '家庭で暴力や脅しを受けているなら、DV相談＋（0120-279-889、24時間・無料）に電話してください。今すぐ危険なときは110番へ。',
  KR: '집에서 폭력이나 협박을 겪고 있다면 여성긴급전화 1366으로 연락하세요. 24시간 열려 있어요. 지금 위험하다면 112로 신고하세요.',
  TW: '如果你在家裡受到暴力或威脅，請撥打 113 保護專線，24 小時、免付費。如果現在有危險，請撥打 110。',
  FR: 'Si tu subis des violences ou des menaces à la maison, appelle le 3919 : gratuit, anonyme, 24h/24, il n\'apparaît pas sur la facture. En danger immédiat, appelle le 17, ou envoie un SMS au 114 si tu ne peux pas parler.',
  DE: 'Wenn du zu Hause Gewalt oder Drohungen erlebst, ruf das Hilfetelefon Gewalt gegen Frauen an: 116 016, kostenlos, anonym, rund um die Uhr. Für Männer: Hilfetelefon Gewalt an Männern, 0800 1239900. In akuter Gefahr: 110.',
  AT: 'Wenn du zu Hause Gewalt oder Drohungen erlebst, ruf die Frauenhelpline gegen Gewalt an: 0800 222 555, kostenlos, rund um die Uhr. In akuter Gefahr: 133.',
  ES: 'Si sufres violencia o amenazas en casa, llama al 016: gratis, confidencial, 24 horas, y no aparece en la factura (bórralo del registro de llamadas). También por WhatsApp: 600 000 016. Si estás en peligro ahora, llama al 112.',
  IT: 'Se a casa subisci violenza o minacce, chiama il 1522, gratuito, attivo 24 ore su 24. Se sei in pericolo adesso, chiama il 112.',
  BR: 'Se você sofre violência ou ameaças em casa, ligue 180, de graça, 24 horas (WhatsApp: 61 9610-0180). Se estiver em perigo agora, ligue 190.',
  PT: 'Se sofre violência ou ameaças em casa, ligue para o 800 202 148, gratuito, confidencial e 24 horas, ou envie SMS para o 3060. Em perigo imediato, ligue 112.',
  SG: 'If you are being hurt or threatened at home, call the National Anti-Violence and Sexual Harassment Helpline on 1800 777 0000. If you are in danger right now, call 999.',
  IN: 'If you are being hurt or threatened at home, call the Women Helpline on 181, free, 24 hours. If you are in danger right now, call 112.',
};
const DV_FALLBACK = 'If you are being hurt or threatened at home, please call your local emergency number if you are in danger, and reach a domestic abuse service where you live. You deserve to be safe, and none of this is your fault.';

export function dvLine(country: string): string {
  return DV_LINES[country] ?? DV_FALLBACK;
}

/** Countries with a verified domestic-abuse line (the rest use the fallback) */
export const DV_COUNTRIES = Object.keys(DV_LINES);

/** What the model is told on a turn where someone may be unsafe with their partner. */
export function dvInstruction(country: string): string {
  return `\n\nSAFETY, THIS TURN COMES FIRST: what they wrote may mean their partner hurts, threatens, frightens or controls them. Answer with warmth and no judgment, in a few short sentences: believe them, say it is not their fault, ask if they are safe right now, and give them this line exactly: "${dvLine(country)}" Suggest making a safety plan with that service. Do NOT coach them on how to confront their partner or how to break up, and do not suggest couples counseling: leaving or confronting can be the most dangerous time, and the professionals on that line help plan it safely. Do not tell their partner anything, plan dates, joke or change the subject.`;
}

/** The domestic-abuse line is always in the reply on such a turn, whatever the model wrote. */
export function withDvLine(reply: string, country: string): string {
  const line = dvLine(country);
  const number = line.match(/\d[\d\s-]{1,14}\d|\d{3,}/)?.[0]?.replace(/[\s-]/g, '');
  if (number && reply.replace(/[\s-]/g, '').includes(number)) return reply;
  if (!number && reply.includes(line)) return reply;
  return `${reply.trim()}\n\n${line}`;
}

// On a turn that shows abuse, Clarity answers with these fixed words and the line, not the model: nothing can slip
// into coaching a breakup or a confrontation.
const DV_REPLY: Record<string, string> = {
  en: "I'm really glad you told me. What you're describing is not okay, and it is not your fault. Are you safe right now? Leaving or confronting can be the most dangerous time, so please talk it through with people trained to help you plan it safely:",
  es: 'Me alegra mucho que me lo cuentes. Lo que describes no está bien y no es tu culpa. ¿Estás a salvo ahora? Irse o enfrentarlo puede ser el momento más peligroso, así que habla con personas preparadas para ayudarte a planearlo con seguridad:',
  fr: "Je suis vraiment contente que tu me le dises. Ce que tu décris n'est pas normal, et ce n'est pas ta faute. Es-tu en sécurité en ce moment ? Partir ou confronter peut être le moment le plus dangereux, alors parles-en à des personnes formées pour t'aider à le préparer en sécurité :",
  de: 'Ich bin wirklich froh, dass du es mir erzählst. Was du beschreibst, ist nicht in Ordnung, und es ist nicht deine Schuld. Bist du gerade sicher? Gehen oder eine Konfrontation kann die gefährlichste Zeit sein, also sprich mit Menschen, die dir helfen, es sicher zu planen:',
  it: 'Sono davvero contenta che tu me lo dica. Quello che descrivi non va bene, e non è colpa tua. Sei al sicuro adesso? Andarsene o affrontarlo può essere il momento più pericoloso, quindi parlane con persone formate per aiutarti a pianificarlo in sicurezza:',
  pt: 'Fico muito feliz que você me contou. O que você descreve não está certo, e não é culpa sua. Você está em segurança agora? Sair ou confrontar pode ser o momento mais perigoso, então fale com pessoas preparadas para ajudar você a planejar isso com segurança:',
  ja: '話してくれて本当にありがとう。あなたが受けていることは許されることではなく、あなたのせいではありません。今、安全ですか？離れることや問い詰めることが一番危険になることもあるので、安全に計画できるよう専門の人に相談してください。',
  zh: '谢谢你愿意告诉我。你描述的事情是不对的，也不是你的错。你现在安全吗？离开或当面对质可能是最危险的时候，请和受过训练的专业人员一起，安全地做计划。',
  ko: '말해줘서 정말 고마워요. 당신이 겪는 일은 괜찮지 않고, 당신 잘못이 아니에요. 지금 안전한가요? 떠나거나 맞서는 순간이 가장 위험할 수 있으니, 안전하게 계획하도록 도와줄 전문가와 꼭 이야기해 주세요.',
};
export function dvReply(country: string): string {
  return `${DV_REPLY[LANG_OF[country] ?? 'en']}\n\n${dvLine(country)}`;
}
