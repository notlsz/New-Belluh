// "Every screenshot is a plan", after Rollup: a screenshot of a restaurant, a bag, a concert or a hotel is something
// the person meant to do. On the device, the text read from each screenshot (OCR, already in the index) is sorted into
// an intent: a table (restaurant or bar), something to buy (a gift or product), tickets (an event), a trip (a place to
// stay or go), or other. Bella turns one into a booking draft only when the person picks it and says yes, and then
// only the words read from that one screenshot are sent, never the image. Pure, so it's unit-tested.

import type { IndexedItem } from './types.ts';

export type ShotIntent = 'dine' | 'buy' | 'attend' | 'trip' | 'other';
/** The BookingDraft kind (supabase/functions/_shared/bookings.ts) each intent becomes */
export const INTENT_KIND = { dine: 'table', buy: 'gift', attend: 'experience', trip: 'trip' } as const;
export const SHOT_EMOJI: Record<Exclude<ShotIntent, 'other'>, string> = { dine: '🍣', buy: '🛍️', attend: '🎟️', trip: '🧳' };
export const SHOT_TEXT_MAX = 1000;

// Words that mark each intent, in the nine languages Belluh speaks, with the apps people screenshot in each country.
// Weight 2: says it outright (reserve a table, add to cart, get tickets, check-in); weight 1: a hint (menu, price, live).
type Rule = [RegExp, number];
const RULES: Record<Exclude<ShotIntent, 'other'>, Rule[]> = {
  dine: [
    [/\b(reserve a table|book a table|reservations?|party of \d|omakase|tasting menu|opentable|resy|tock|thefork|la ?fourchette|quandoo|tabelog|catch ?table|dianping)\b/i, 2],
    [/\b(restaurant|bistro|brasserie|trattoria|osteria|pizzeria|izakaya|ramen|sushi|tapas|wine bar|cocktail bar|cocktails|speakeasy|brunch|dinner|menu|happy hour|cuisine|chef)\b/i, 1],
    [/(予約する|席を予約|食べログ|ぐるなび|ホットペッパー|居酒屋|レストラン|寿司|ラーメン|ディナー|ランチ|メニュー|コース料理)/, 2],
    [/(订座|预订餐位|大众点评|美团|餐厅|餐廳|火锅|菜单|晚餐|午餐|酒吧)/, 2],
    [/(캐치테이블|테이블링|맛집|식당|레스토랑|메뉴|오마카세|예약하기|와인바)/, 2],
    [/(réserver une table|réservation|carte des vins|menu du jour|restaurant|bistrot|apéro)/i, 2],
    [/(prenota(re)? un tavolo|prenotazione|ristorante|trattoria|osteria|aperitivo|menù)/i, 2],
    [/(tisch reservieren|reservierung|speisekarte|restaurant|gasthaus|weinbar)/i, 2],
    [/(reservar (una )?mesa|reserva|carta|restaurante|taquería|cantina|marisquería)/i, 2],
    [/(reservar mesa|cardápio|restaurante|tasca|marisqueira|rodízio|boteco)/i, 2],
  ],
  buy: [
    [/\b(add to (cart|bag|basket)|buy now|buy it now|shop now|checkout|in stock|out of stock|sold out|free shipping|free delivery|wishlist|add to wishlist|select size|size guide|pre-?order)\b/i, 2],
    [/\b(amazon|etsy|shopify|ebay|sephora|nordstrom|zara|uniqlo|ssense|farfetch|price|sale|% off|colou?r|sizes?|qty|quantity|reviews)\b/i, 1],
    [/[$€£¥₩]\s?\d[\d,.]*|\d[\d,.]*\s?(€|円|元|원|usd|eur)/i, 1],
    [/(カートに入れる|今すぐ購入|購入手続き|送料無料|税込|在庫あり|楽天|メルカリ|ゾゾタウン)/, 2],
    [/(加入购物车|立即购买|包邮|淘宝|天猫|京东|小红书|拼多多|现货)/, 2],
    [/(장바구니|구매하기|바로구매|무료배송|쿠팡|무신사|품절)/, 2],
    [/(ajouter au panier|acheter maintenant|livraison gratuite|en stock|rupture de stock)/i, 2],
    [/(aggiungi al carrello|acquista ora|spedizione gratuita|disponibile)/i, 2],
    [/(in den warenkorb|jetzt kaufen|kostenloser versand|auf lager|ausverkauft|zalando)/i, 2],
    [/(añadir al carrito|agregar al carrito|comprar ahora|envío gratis|agotado|mercado libre)/i, 2],
    [/(adicionar ao carrinho|comprar agora|frete grátis|portes grátis|esgotado|mercado livre)/i, 2],
  ],
  attend: [
    [/\b(get tickets|buy tickets|tickets?|presale|on sale|doors open|doors at|admission|general admission|lineup|sold-out show|ticketmaster|eventbrite|dice|axs|stubhub|seat(s|ing)?|row [a-z0-9]+)\b/i, 2],
    [/\b(concert|festival|live|tour|gig|show|exhibition|exhibit|museum|theater|theatre|musical|opera|ballet|comedy|screening|jazz|dj set)\b/i, 1],
    [/(チケット|公演|開演|開場|ライブ|コンサート|フェス|展覧会|ぴあ|イープラス)/, 2],
    [/(门票|演唱会|演出|音乐节|展览|大麦|猫眼|开场)/, 2],
    [/(티켓|예매|공연|콘서트|페스티벌|전시회|인터파크|멜론티켓)/, 2],
    [/(billets?|billetterie|concert|spectacle|exposition|fnac spectacles)/i, 2],
    [/(biglietti|concerto|spettacolo|mostra|ticketone)/i, 2],
    [/(tickets?|karten|konzert|ausstellung|eventim|einlass)/i, 2],
    [/(entradas|boletos|concierto|espectáculo|exposición|ticketmaster)/i, 2],
    [/(ingressos|bilhetes|concerto|espetáculo|exposição|sympla|blueticket)/i, 2],
  ],
  trip: [
    [/\b(check-?in|check-?out|\d+ nights?|guests?|airbnb|booking\.com|expedia|hotels?\.com|vrbo|itinerary|boarding|flight|round trip|one way|departure|arrival|resort|ryokan|villa|cabin|things to do in|travel guide)\b/i, 2],
    [/\b(hotel|hostel|beach|island|getaway|weekend in|day trip|national park|hike|trail|views?|stay)\b/i, 1],
    [/(チェックイン|チェックアウト|宿泊|旅館|ホテル|航空券|旅行|観光|じゃらん|楽天トラベル|温泉)/, 2],
    [/(入住|退房|酒店|民宿|机票|旅行|景点|携程|飞猪|攻略)/, 2],
    [/(체크인|체크아웃|숙소|호텔|항공권|여행|야놀자|여기어때|펜션)/, 2],
    [/(arrivée|départ|nuits?|hôtel|séjour|vol|voyage|gîte|week-end à)/i, 2],
    [/(arrivo|partenza|notti|albergo|hotel|soggiorno|volo|viaggio|agriturismo)/i, 2],
    [/(anreise|abreise|nächte|übernachtung|hotel|flug|reise|ferienwohnung)/i, 2],
    [/(llegada|salida|noches|hotel|hospedaje|vuelo|viaje|escapada)/i, 2],
    [/(chegada|partida|noites|hotel|pousada|voo|viagem|escapadinha)/i, 2],
  ],
};

// Text that should never leave the phone, even when the person picks it: card numbers, codes, passwords, bank details
const PRIVATE = [
  /\b(?:\d[ -]?){13,19}\b/,                                                                         // a card number
  /\b(password|passcode|pin code|cvv|cvc|security code|verification code|one-time code|otp|2fa|seed phrase|recovery phrase)\b/i,
  /\b(iban|routing number|account number|sort code|swift|ssn|social security)\b/i,
  /(パスワード|暗証番号|認証コード|口座番号|密码|验证码|银行卡|비밀번호|인증번호|계좌번호|mot de passe|code de vérification|codice di verifica|kennwort|passwort|bestätigungscode|contraseña|código de verificación|senha|código de verificação)/i,
];
export const looksPrivate = (text: string) => PRIVATE.some(r => r.test(text));

/** Lines that are phone chrome or buttons, not the name of the thing */
const CHROME = /^(\d{1,2}[:.]\d{2}(\s?[ap]m)?|\d{1,3}\s?%|lte|5g|4g|wi-?fi|back|share|save|done|cancel|search|menu|home|more|see all|open|close|follow|following|like|reply|sponsored|ad)$/i;
const BUTTONS = /^(add to (cart|bag|basket)|buy( it)? now|shop now|get tickets|buy tickets|reserve( a table)?|book( a table| now)?|check availability|see menu|view menu|directions|call|website|order online|reviews?|photos|overview|details|about)$/i;

/** The name of the thing: the first short line that reads like a name (not chrome, a button, a price or a sentence) */
export function subjectOf(text: string): string | null {
  const lines = text.split(/\n+/).map(l => l.replace(/\s+/g, ' ').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}!?'’)]+$/gu, '').trim()).filter(Boolean);
  for (const l of lines.slice(0, 14)) {
    const letters = (l.match(/\p{L}/gu) ?? []).length;
    const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(l);
    const words = l.split(' ').length;
    if (letters < 3 || l.length > 48 || CHROME.test(l) || BUTTONS.test(l)) continue;
    if (/https?:|www\.|\.com\b|@/.test(l)) continue;
    if ((l.match(/\d/g) ?? []).length > letters) continue;
    if (!cjk && words > 6) continue;
    if (cjk && l.length > 24) continue;
    return l;
  }
  return null;
}

export interface ShotClass { intent: ShotIntent; subject: string | null; score: number }

/** Sorts one screenshot's text into an intent. Needs a clear signal (a score of 2) to call it anything but other. */
export function classifyScreenshot(text: string | null | undefined): ShotClass {
  const t = String(text ?? '').slice(0, 4000);
  if (t.replace(/\s/g, '').length < 8 || looksPrivate(t)) return { intent: 'other', subject: null, score: 0 };
  let best: ShotIntent = 'other', top = 0;
  for (const intent of Object.keys(RULES) as Exclude<ShotIntent, 'other'>[]) {
    let s = 0;
    for (const [re, w] of RULES[intent]) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      s += Math.min(3, (t.match(g) ?? []).length) * w;
    }
    // Ties go to the earlier, more specific intent (a menu with prices is a table, not a purchase)
    if (s > top) { top = s; best = intent; }
  }
  if (top < 2) return { intent: 'other', subject: subjectOf(t), score: top };
  return { intent: best, subject: subjectOf(t), score: top };
}

export interface ShotPlan { id: string; date: string | null; intent: Exclude<ShotIntent, 'other'>; subject: string; kind: typeof INTENT_KIND[keyof typeof INTENT_KIND]; text: string }

/** The screenshots worth suggesting, newest first: a clear intent and a name, nothing sensitive or private, one per name */
export function screenshotPlans(items: IndexedItem[], limit = 8): ShotPlan[] {
  const out: ShotPlan[] = [];
  const seen = new Set<string>();
  const sorted = [...items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  for (const it of sorted) {
    if (it.mediaType !== 'screenshot' || it.sensitivity || !it.text) continue;
    const c = classifyScreenshot(it.text);
    if (c.intent === 'other' || !c.subject) continue;
    const key = `${c.intent}:${c.subject.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: it.id, date: it.date, intent: c.intent, subject: c.subject, kind: INTENT_KIND[c.intent], text: shotText(it.text) });
    if (out.length >= limit) break;
  }
  return out;
}

/** Exactly what Bella gets, after the person says yes: the words read from that screenshot, tidied and capped */
export const shotText = (text: string) => text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, SHOT_TEXT_MAX);

/** The body the app sends with the chat message; null when the screenshot isn't one that may be sent */
export function shotForBella(p: Pick<ShotPlan, 'intent' | 'subject' | 'text'>): { intent: ShotPlan['intent']; subject: string; text: string } | null {
  if (!p.text || looksPrivate(p.text)) return null;
  return { intent: p.intent, subject: p.subject.slice(0, 80), text: shotText(p.text) };
}
