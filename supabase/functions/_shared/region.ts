// Where they live changes what Bella does: the stores, the booking sites, the delivery and ride apps people there
// actually use, the money, and the customs around love, gifts and dates. A couple in Tokyo books on Tabelog, gives
// gifts wrapped with care and plans Christmas Eve as a date night; a couple in Shanghai books through Dianping, pays
// with WeChat, celebrates 520 and Qixi and never gives a clock; a couple in Seoul counts 100 days. The country comes
// from what they told Bella, else their time zone. The US keeps its own links (actions.ts); every other country gets
// its kit here. Pure logic, unit-tested in Node.

import type { ActionLink } from './actions.ts';

export type Kind = 'table' | 'buy' | 'gift' | 'flowers' | 'food' | 'groceries' | 'ride' | 'experience';
type Tpl = [label: string, url: string];   // {q} = the search, url-encoded; {qd} = the search with dashes

interface Kit {
  name: string;
  money: string;             // how prices are written there: "¥5,000"
  searchIn: string;          // the language their stores search best in
  maps: 'google' | 'amap' | 'naver';
  links: Partial<Record<Kind, Tpl[]>>;
  apps: string;              // what people there use, said in a line, for what Bella can't link to
  culture: string;           // customs around love, dates and gifts: common, not universal
}

const site = (domain: string) => `https://www.google.com/search?q={q}+site%3A${domain}`;
const baidu = (extra: string) => `https://www.baidu.com/s?wd={q}+${encodeURIComponent(extra)}`;
const gmaps = 'https://www.google.com/maps/search/?api=1&query={q}';
const shopping = 'https://www.google.com/search?udm=28&q={q}';
const uber = 'https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff%5Bformatted_address%5D={q}';
const transit = 'https://www.google.com/maps/dir/?api=1&destination={q}&travelmode=transit';
const uberEats = 'https://www.ubereats.com/search?q={q}';
const airbnbExp = 'https://www.airbnb.com/s/experiences?query={q}';

export const KITS: Record<string, Kit> = {
  US: {
    name: 'the United States', money: '$80', searchIn: 'English', maps: 'google', links: {},
    apps: 'OpenTable and Resy for tables, DoorDash and Uber Eats for delivery, Uber and Lyft for rides, Amazon and Target for gifts.',
    culture: `- How love is said: out loud and often ("I love you", "I'm proud of you"), and appreciated when it is. Many couples know the five love languages; therapy and couples counseling are normal, not a crisis.
- Life is scheduled and busy: date night works best as a standing ritual on the calendar. Partners expect to be equals and to talk things through directly.
- Families can live states apart, so holidays mean deciding whose family and booking travel early.
- In English: warm, casual, direct.
- Big days for couples: Valentine's Day (Feb 14), anniversaries, birthdays; Mother's and Father's Day if they have kids. Many couples mark the day they met and the day they got together.
- Tip 18 to 20 percent at sit-down restaurants. Popular places book up two to four weeks ahead on OpenTable or Resy; Friday and Saturday at 7:30 go first.
- A gift lands best when it's specific and personal; a handwritten card counts for a lot. Experiences (a class, a trip, a show) often beat things.`,
  },
  CA: {
    name: 'Canada', money: '$80 CAD', searchIn: 'English (French in Quebec)', maps: 'google',
    links: {
      table: [['Book on OpenTable', 'https://www.opentable.ca/s?term={q}'], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.ca', 'https://www.amazon.ca/s?k={q}'], ['Compare prices', shopping]],
      food: [['Order on Uber Eats', uberEats], ['Order on DoorDash', 'https://www.doordash.com/search/store/{q}/']],
      groceries: [['Add to Instacart', 'https://www.instacart.ca/store/s?k={q}']],
      ride: [['Uber there', uber], ['Transit directions', transit]],
    },
    apps: 'OpenTable for tables, Uber Eats, DoorDash and SkipTheDishes for delivery, Uber and Lyft for rides, Amazon.ca for gifts.',
    culture: `- How love is said: friendly and polite, between American directness and British reserve. Couples value balance and fairness at home.
- Seasons rule: winter means planning cosy indoor dates and trips south; summer means cottage weekends, lakes and patios.
- Quebec is its own culture: French first, a later dinner, a strong sense of identity; the Fête nationale (June 24) matters there.
- In Canadian English, warm and easygoing (Canadian spelling); in Quebec French, tutoie and keep it natural, not France-formal.
- Valentine's Day, anniversaries and birthdays, much like the US. In Quebec, French first and a later dinner hour.
- Tip 15 to 20 percent. Prices on menus and shelves are before tax.`,
  },
  GB: {
    name: 'the United Kingdom', money: '£60', searchIn: 'English', maps: 'google',
    links: {
      table: [['Book on OpenTable', 'https://www.opentable.co.uk/s?term={q}'], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.co.uk', 'https://www.amazon.co.uk/s?k={q}'], ['Find it at John Lewis', 'https://www.johnlewis.com/search?search-term={q}'], ['Compare prices', shopping]],
      flowers: [['Flower delivery', 'https://www.google.com/search?udm=28&q={q}+flower+delivery+UK'], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Order on Uber Eats', uberEats], ['Find it on Deliveroo', site('deliveroo.co.uk')]],
      groceries: [['Add it at Tesco', 'https://www.tesco.com/groceries/en-GB/search?query={q}'], ['Add it at Ocado', 'https://www.ocado.com/search?entry={q}']],
      ride: [['Uber there', uber], ['Transit directions', transit]],
    },
    apps: 'OpenTable for tables, Deliveroo, Just Eat and Uber Eats for delivery, Uber, Bolt and the Tube for getting around, Moonpig for cards.',
    culture: `- How love is said: understated. Dry humour and gentle teasing are affection; big declarations can feel American. A proper card with real words matters more than the size of the gift.
- Pubs and Sunday roasts are the backbone of time together; weekends away to the coast or the Cotswolds, and city breaks to Europe.
- Class and region shape taste; don't assume. Bonfire Night (Nov 5) and the Christmas run-up are cosy, social seasons.
- In British English: warm, a little wry, never gushing; British spelling.
- Valentine's Day is the big one; a proper card matters (many send one even with a gift). Anniversaries and birthdays as in the US.
- A 12.5 percent service charge is often already on the bill; otherwise tip about 10 percent. Pubs: order at the bar, no tip.
- Understatement lands better than grand gestures; a thoughtful, specific gift over an expensive one.`,
  },
  JP: {
    name: 'Japan', money: '¥8,000', searchIn: 'Japanese', maps: 'google',
    links: {
      table: [['Find it on Tabelog', site('tabelog.com')], ['Find it on Hot Pepper', site('hotpepper.jp')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.co.jp', 'https://www.amazon.co.jp/s?k={q}'], ['Buy it on Rakuten', 'https://search.rakuten.co.jp/search/mall/{q}/']],
      flowers: [['Order flowers on Rakuten', 'https://search.rakuten.co.jp/search/mall/{q}+%E8%8A%B1%E6%9D%9F/'], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=%E8%8A%B1%E5%B1%8B+{q}']],
      food: [['Order on Uber Eats', uberEats], ['Find it on Demae-can', site('demae-can.com')]],
      groceries: [['Order on Amazon.co.jp', 'https://www.amazon.co.jp/s?k={q}']],
      ride: [['Train directions', transit], ['Taxi with Uber', uber]],
      experience: [['Find it on Google', 'https://www.google.com/search?q={q}'], ['Experiences on Airbnb', airbnbExp]],
    },
    apps: 'Tabelog, Hot Pepper and OMAKASE for tables (popular places open bookings a month or two ahead), Uber Eats and Demae-can for delivery, trains first and GO or Uber for taxis, Amazon.co.jp and Rakuten for gifts, LINE for messages.',
    culture: `- How love is said: rarely in words. "Aishiteru" is almost never spoken; care shows in actions, small, steady and well-timed (remembering, a packed bento, waiting at the station). Help them show it, not just say it.
- Reading the air (kuuki wo yomu): people often hint instead of asking, and expect the other to notice. Help them notice, and say needs gently and indirectly; never push a blunt confrontation.
- Long work hours make time scarce: protect small rituals (a weekend morning, a seasonal walk). Seasons matter deeply: hanami in spring, fireworks and yukata in summer, autumn leaves, illuminations in winter.
- Dating usually begins with a clear confession (kokuhaku); meeting parents is serious; harmony with both families matters.
- In Japanese: gentle and warm, soft polite-casual, never stiff keigo and never rough.
- Valentine's Day (Feb 14): traditionally the woman gives chocolate (honmei, the real one, often handmade). White Day (Mar 14): the man gives back, usually something worth a bit more. Many younger couples do both their own way; ask, don't assume.
- Christmas Eve is a couples' night: a nice dinner booked weeks ahead, illuminations, a gift. Birthdays and anniversaries matter; some couples mark monthly anniversaries early on.
- Wrapping and presentation count as much as the gift; a beautifully wrapped small thing beats a big one in a plastic bag. Avoid sets of four or nine (shi, ku sound like death and suffering), and white chrysanthemums (funerals).
- Affection is usually private: little public display, so plan intimate settings (a private room, a counter seat, an onsen ryokan) rather than public gestures.
- No tipping, ever; it can confuse. Many small places are cash only and some take no reservations for walk-ins. Trains stop around midnight, so plan the way home.
- After a trip, bring omiyage (local sweets) for their family or workplace; meeting the parents is a serious step.`,
  },
  CN: {
    name: 'mainland China', money: '¥500', searchIn: 'Chinese (simplified)', maps: 'amap',
    links: {
      table: [['Find it on Dianping', baidu('大众点评')], ['See it on Amap', 'https://uri.amap.com/search?keyword={q}']],
      buy: [['Buy it on JD', 'https://search.jd.com/Search?keyword={q}'], ['Buy it on Tmall', 'https://list.tmall.com/search_product.htm?q={q}'], ['Buy it on Taobao', 'https://s.taobao.com/search?q={q}']],
      flowers: [['Order flowers on JD', 'https://search.jd.com/Search?keyword={q}%20%E9%B2%9C%E8%8A%B1'], ['Florists on Amap', 'https://uri.amap.com/search?keyword=%E8%8A%B1%E5%BA%97']],
      food: [['Find it on Amap', 'https://uri.amap.com/search?keyword={q}']],
      groceries: [['Order on JD', 'https://search.jd.com/Search?keyword={q}']],
      ride: [['Directions on Amap', 'https://uri.amap.com/search?keyword={q}']],
      experience: [['Find it on Dianping', baidu('大众点评')]],
    },
    apps: 'Dianping and Meituan to find and book places, Meituan and Ele.me for delivery, DiDi for rides, JD, Tmall and Taobao for gifts, WeChat for everything (messages, red packets, paying). Google, Uber Eats and Amazon are not used there; delivery and rides are ordered in those apps.',
    culture: `- How love is said: more through care than words. Making sure they've eaten, picking them up, remembering the small things, and providing for the future are love. Romantic days are celebrated with clear gestures (flowers, a red packet, a gift).
- Family is central: parents' approval and meeting them carry weight, and so do gifts for parents. Face matters; never embarrass a partner in front of others.
- Life runs on WeChat: messages, voice notes, red packets, paying. Work hours can be long (996 in some fields); small daily care counts.
- In Chinese (simplified): warm and natural, never stiff.
- Days for couples: 520 (May 20, "wo ai ni") and 1314 ("forever"), Qixi (the seventh day of the seventh lunar month, Chinese Valentine's), Feb 14, Christmas Eve for younger couples. Singles' Day (Nov 11) is a shopping day, not a couples' one.
- A WeChat red packet of 520 or 1314 yuan is a common romantic gesture; numbers with 8 (wealth) and 6 (smooth) are lucky.
- Never give a clock (song zhong sounds like attending a funeral), an umbrella (san, separation), pears to share (li, parting), a green hat (infidelity), or anything in fours. Avoid white or black wrapping; red and gold are good.
- Family is close to the center: meeting the parents, holidays at home (Spring Festival), gifts for parents (good tea, health products, fruit baskets) carry weight. Face matters; never embarrass a partner in front of others.
- No tipping. Pay by WeChat Pay or Alipay. Popular restaurants queue on Meituan or Dianping rather than taking far-ahead bookings.`,
  },
  HK: {
    name: 'Hong Kong', money: 'HK$600', searchIn: 'English or traditional Chinese', maps: 'google',
    links: {
      table: [['Find it on OpenRice', site('openrice.com')], ['See it on Google Maps', gmaps]],
      buy: [['Find it on HKTVmall', site('hktvmall.com')], ['Compare prices', shopping]],
      food: [['Find it on foodpanda', site('foodpanda.hk')], ['Find it on Deliveroo', site('deliveroo.hk')]],
      ride: [['Uber there', uber], ['MTR directions', transit]],
    },
    apps: 'OpenRice for tables, foodpanda and Deliveroo for delivery, the MTR, taxis and Uber for getting around, HKTVmall for gifts, WhatsApp for messages.',
    culture: `- Valentine's Day is big (flower stands everywhere, dinners booked out), as are Christmas Eve, Qixi and anniversaries.
- Avoid clocks, umbrellas and fours as gifts, as in mainland China. A 10 percent service charge is usually on the bill.`,
  },
  TW: {
    name: 'Taiwan', money: 'NT$2,000', searchIn: 'traditional Chinese', maps: 'google',
    links: {
      table: [['Find it on inline', site('inline.app')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Shopee', 'https://shopee.tw/search?keyword={q}'], ['Find it on momo', site('momoshop.com.tw')]],
      food: [['Order on Uber Eats', uberEats], ['Find it on foodpanda', site('foodpanda.com.tw')]],
      ride: [['Uber there', uber], ['Transit directions', transit]],
    },
    apps: 'inline and EZTABLE for tables, Uber Eats and foodpanda for delivery, the MRT and Uber or taxis for rides, Shopee, momo and PChome for gifts, LINE for messages.',
    culture: `- Feb 14, Qixi and Christmas Eve are couples' days; 520 is popular too. Avoid clocks, umbrellas, fours and pears as gifts.
- No tipping in most places; a 10 percent service charge is common at sit-down restaurants.`,
  },
  KR: {
    name: 'South Korea', money: '₩80,000', searchIn: 'Korean', maps: 'naver',
    links: {
      table: [['Find it on Naver Map', 'https://map.naver.com/p/search/{q}'], ['Find it on Catch Table', site('catchtable.co.kr')]],
      buy: [['Buy it on Coupang', 'https://www.coupang.com/np/search?q={q}'], ['Compare on Naver Shopping', 'https://search.shopping.naver.com/search/all?query={q}']],
      flowers: [['Order flowers on Coupang', 'https://www.coupang.com/np/search?q={q}+%EA%BD%83%EB%8B%A4%EB%B0%9C'], ['Florists on Naver Map', 'https://map.naver.com/p/search/%EA%BD%83%EC%A7%91']],
      food: [['Find it on Naver Map', 'https://map.naver.com/p/search/{q}']],
      groceries: [['Order on Coupang', 'https://www.coupang.com/np/search?q={q}']],
      ride: [['Directions on Naver Map', 'https://map.naver.com/p/search/{q}']],
      experience: [['Find it on Naver', 'https://search.naver.com/search.naver?query={q}']],
    },
    apps: 'Naver Map and Catch Table for tables (Google Maps works poorly there), Baemin and Coupang Eats for delivery, Kakao T for taxis, Coupang and Naver Shopping for gifts, KakaoTalk for messages and gifting (KakaoTalk Gift sends a coffee or cake voucher instantly).',
    culture: `- Couples count days: 100, 200, 300 days and 1,000 days together are celebrated, alongside the yearly anniversary. Bella can work out the dates from when they got together.
- The 14th of every month is a couples' day; the big ones are Valentine's (Feb 14, women give), White Day (Mar 14, men give), Rose Day (May 14) and Pepero Day (Nov 11). Christmas is mainly a couples' holiday.
- Couple items are common and sweet: matching rings (often at 100 days), matching outfits or phone cases.
- No tipping. Nice restaurants fill up on Catch Table; book early for Christmas Eve and Valentine's.`,
  },
  SG: {
    name: 'Singapore', money: 'S$120', searchIn: 'English', maps: 'google',
    links: {
      table: [['Find it on Chope', site('chope.co')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Shopee', 'https://shopee.sg/search?keyword={q}'], ['Buy it on Lazada', 'https://www.lazada.sg/catalog/?q={q}'], ['Buy it on Amazon.sg', 'https://www.amazon.sg/s?k={q}']],
      food: [['Find it on GrabFood', site('food.grab.com')], ['Find it on foodpanda', site('foodpanda.sg')]],
      ride: [['MRT directions', transit]],
    },
    apps: 'Chope for tables, GrabFood and foodpanda for delivery, Grab and the MRT for getting around (Uber is not there), Shopee, Lazada and Amazon.sg for gifts.',
    culture: `- Feb 14 and anniversaries; Chinese couples may mark Qixi, and many families keep Lunar New Year, Hari Raya or Deepavali, so ask which they celebrate.
- No tipping; a 10 percent service charge plus GST is on most bills.`,
  },
  IN: {
    name: 'India', money: '₹3,000', searchIn: 'English', maps: 'google',
    links: {
      table: [['Find it on Zomato', site('zomato.com')], ['Find it on EazyDiner', site('eazydiner.com')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.in', 'https://www.amazon.in/s?k={q}'], ['Buy it on Flipkart', 'https://www.flipkart.com/search?q={q}']],
      flowers: [['Find it on Ferns N Petals', site('fnp.com')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Find it on Swiggy', site('swiggy.com')], ['Find it on Zomato', site('zomato.com')]],
      groceries: [['Add it on BigBasket', 'https://www.bigbasket.com/ps/?q={q}']],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Zomato and EazyDiner for tables, Swiggy and Zomato for delivery, Uber and Ola for rides, Amazon.in and Flipkart for gifts, Ferns N Petals for flowers and cakes delivered the same day, WhatsApp for messages.',
    culture: `- Feb 14 in cities, anniversaries and birthdays (a midnight cake surprise is a classic). Karva Chauth for many married couples in the north; Diwali gifts for the whole family.
- Family is closely involved; gifts for parents and in-laws matter. Ask about food: many are vegetarian, some don't eat beef or pork, some avoid onion and garlic on certain days.
- Public affection is low-key in most places; plan private or family-friendly settings. Tip about 10 percent where no service charge is added.`,
  },
  AE: {
    name: 'the United Arab Emirates', money: 'AED 300', searchIn: 'English', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+reservation']],
      buy: [['Buy it on Amazon.ae', 'https://www.amazon.ae/s?k={q}'], ['Buy it on noon', 'https://www.noon.com/uae-en/search/?q={q}']],
      food: [['Find it on Talabat', site('talabat.com')], ['Find it on Deliveroo', site('deliveroo.ae')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Google Maps and restaurant sites for tables, Talabat and Deliveroo for delivery, Careem and Uber for rides, Amazon.ae and noon for gifts.',
    culture: `- Public displays of affection can break the law; keep gestures private. Alcohol only in licensed venues. During Ramadan, plan around iftar and avoid eating in public by day.
- Weekends are Saturday and Sunday (Friday afternoon is quiet). Tip around 10 percent if no service charge.`,
  },
  FR: {
    name: 'France', money: '60 €', searchIn: 'French', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.fr')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.fr', 'https://www.amazon.fr/s?k={q}'], ['Find it at Fnac', site('fnac.com')]],
      food: [['Order on Uber Eats', uberEats], ['Find it on Deliveroo', site('deliveroo.fr')]],
      ride: [['Uber there', uber], ['Metro directions', transit]],
    },
    apps: 'TheFork (LaFourchette) for tables, Uber Eats and Deliveroo for delivery, the Metro, Uber and G7 for getting around, Amazon.fr and Fnac for gifts.',
    culture: `- How love is lived: as an art of living, long dinners, walks, good bread and wine, and conversation. Couples argue and debate openly; it's a sign of engagement, not trouble.
- Relationships become serious without a formal "are we exclusive?" talk; PACS is a common alternative to marriage. Privacy matters: no public oversharing.
- Time is protected: the long Sunday lunch, the August holidays, la rentrée in September when life restarts.
- Elegance over excess: a well-chosen book, a perfume, a small producer's wine beats something flashy.
- In French: tutoie, warm and understated, elegant, never saccharine.
- La Saint-Valentin (Feb 14) is for couples only, not friends. Dinner starts late (8 to 9), and many restaurants close Sunday, Monday and in August.
- Don't give chrysanthemums (funerals) or an even number of flowers in traditional settings. Quality over size: good wine, a book, something beautiful.
- Service is included; leave a few euros for great service.`,
  },
  DE: {
    name: 'Germany', money: '60 €', searchIn: 'German', maps: 'google',
    links: {
      table: [['Book on OpenTable', 'https://www.opentable.de/s?term={q}'], ['Find it on Quandoo', site('quandoo.de')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.de', 'https://www.amazon.de/s?k={q}'], ['Find it on OTTO', 'https://www.otto.de/suche/{q}/']],
      food: [['Find it on Lieferando', site('lieferando.de')], ['Order on Uber Eats', uberEats]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'OpenTable and Quandoo for tables, Lieferando and Wolt for delivery, public transport and FREENOW or Uber for rides, Amazon.de and OTTO for gifts.',
    culture: `- Valentinstag is modest; anniversaries (Jahrestag) and birthdays matter more. Never wish someone happy birthday early; it's bad luck.
- Be on time. Round up or tip 5 to 10 percent, said aloud when paying. Many shops close Sundays, so order gifts in time.
- Avoid chrysanthemums, lilies and white carnations (funerals); give flowers in odd numbers.`,
  },
  ES: {
    name: 'Spain', money: '60 €', searchIn: 'Spanish', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.es')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.es', 'https://www.amazon.es/s?k={q}'], ['Find it at El Corte Inglés', site('elcorteingles.es')]],
      gift: [['Buy it on Amazon.es', 'https://www.amazon.es/s?k={q}'], ['Find it at El Corte Inglés', site('elcorteingles.es')]],
      flowers: [['Send flowers with Interflora', site('interflora.es')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florister%C3%ADa+{q}']],
      food: [['Find it on Glovo', site('glovoapp.com')], ['Find it on Just Eat', site('just-eat.es')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it on Glovo', site('glovoapp.com')], ['Buy it at Carrefour', site('carrefour.es')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
      experience: [['Find it on Google', 'https://www.google.com/search?q={q}'], ['Experiences on Airbnb', airbnbExp]],
    },
    apps: 'TheFork (ElTenedor) for tables, Glovo, Just Eat and Uber Eats for delivery, Cabify, Uber and the Metro for getting around, Renfe for trains, Amazon.es and El Corte Inglés for gifts, WhatsApp for everything (Spain lives on WhatsApp), Bizum to pay each other back.',
    culture: `- How love is said: openly and often. "Te quiero" is everyday and also said to family and friends; "te amo" is weightier, kept for big moments. Affection in public (a kiss, holding hands on the paseo) is normal.
- Life is lived outside and late: terrazas, tapas and an evening paseo; dinner at 9 to 10:30, later on weekends. Plan dates around this rhythm, never a 6 pm dinner.
- Many people live with their parents until around 30, so privacy is scarce: a weekend escapada (a casa rural, the coast, Lisbon, a parador) means a lot.
- Family is close: Sunday lunch with the family is common; meeting the parents is a real step, and both families matter at Christmas.
- San Valentín (Feb 14) is a dinner and a gift. In Catalonia, Sant Jordi (Apr 23) is the romantic day: a rose for her and a book for him, now often both ways.
- Los Reyes (Jan 6) is the big gift day for many; Nochevieja means twelve grapes at midnight, one per chime, together.
- In Spanish (Spain): warm, direct, tú, a bit of humor; never stiff, never usted with a partner. Use Spain words (móvil, coche, quedar).
- No tipping obligation; rounding up or a few euros for a nice dinner. Pay each other back with Bizum.`,
  },

  IT: {
    name: 'Italy', money: '60 €', searchIn: 'Italian', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.it')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.it', 'https://www.amazon.it/s?k={q}'], ['Compare prices', shopping]],
      food: [['Find it on Glovo', site('glovoapp.com')], ['Find it on Deliveroo', site('deliveroo.it')]],
      ride: [['Directions', transit], ['Taxi with Uber', uber]],
    },
    apps: 'TheFork for tables, Glovo, Deliveroo and Just Eat for delivery, trains and taxis (Uber is limited) for getting around, Amazon.it for gifts.',
    culture: `- How love is lived: openly and warmly, with touch, food and family. Cooking for someone is a declaration; Sunday lunch with family is sacred, and families are close, often near each other.
- La bella figura: presentation and care matter, in how a gift is wrapped, how a table is set and how you show up.
- Life has rhythms: aperitivo at seven, the evening passeggiata, Ferragosto in August when cities empty for the sea.
- Regions differ (north and south, city and village); respect where they're from.
- In Italian: dai del tu, warm, expressive, a little playful.
- San Valentino (Feb 14) is for couples. Dinner from 8. Coperto (cover charge) is normal; tipping is optional.
- Avoid chrysanthemums (funerals) and give odd numbers of flowers.`,
  },
  MX: {
    name: 'Mexico', money: '$1,500 MXN', searchIn: 'Spanish', maps: 'google',
    links: {
      table: [['Book on OpenTable', 'https://www.opentable.com.mx/s?term={q}'], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Mercado Libre', 'https://listado.mercadolibre.com.mx/{qd}'], ['Buy it on Amazon.com.mx', 'https://www.amazon.com.mx/s?k={q}']],
      gift: [['Buy it on Mercado Libre', 'https://listado.mercadolibre.com.mx/{qd}'], ['Buy it on Amazon.com.mx', 'https://www.amazon.com.mx/s?k={q}']],
      flowers: [['Order flowers on Rappi', site('rappi.com.mx')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florer%C3%ADa+{q}']],
      food: [['Find it on Rappi', site('rappi.com.mx')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it on Rappi', site('rappi.com.mx')], ['Buy it at Walmart', site('walmart.com.mx')]],
      ride: [['Uber there', uber], ['Directions', transit]],
      experience: [['Find it on Google', 'https://www.google.com/search?q={q}'], ['Experiences on Airbnb', airbnbExp]],
    },
    apps: 'OpenTable for tables, Rappi, Uber Eats and DiDi Food for delivery, Uber and DiDi for rides (apps over street taxis, especially at night), Mercado Libre and Amazon.com.mx for gifts, Ticketmaster for shows, WhatsApp for everything.',
    culture: `- How love is said: warmly and out loud. Romance is expressive: flowers, long WhatsApp voice notes, "te amo" and pet names (amor, mi vida, gordo/gorda as affection). A serenata with mariachi or a trío under the window is the classic grand gesture.
- Family is the center: Sunday comida with the family, the partner's mother matters, and meeting the family is a real step. Plan holidays with both families in mind.
- Día del Amor y la Amistad (Feb 14) is for friends too; for couples, flowers, chocolates, a dinner. Día de las Madres (May 10) is enormous: include both mothers.
- Día de Muertos (Nov 1 and 2) honors loved ones who died, with altars and cempasúchil; it is not a romantic date, though couples visit altars and panteones together. Never give marigolds as a romantic gift.
- December is family season: Las Posadas (Dec 16 to 24), Nochebuena dinner on the 24th, Guadalupe on the 12th.
- Time is relaxed and plans flex; warmth matters more than punctuality. Diminutives soften everything (ahorita, un cafecito).
- In Spanish (Mexico): warm, affectionate, tú, Mexican words (celular, carro, platicar); never Spain forms (vosotros, vale, móvil).
- Tip 10 to 15 percent. Use Uber or DiDi rather than hailing a taxi at night.`,
  },

  BR: {
    name: 'Brazil', money: 'R$300', searchIn: 'Portuguese', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on TheFork', site('thefork.com.br')]],
      buy: [['Buy it on Mercado Livre', 'https://lista.mercadolivre.com.br/{qd}'], ['Buy it on Amazon.com.br', 'https://www.amazon.com.br/s?k={q}']],
      gift: [['Buy it on Mercado Livre', 'https://lista.mercadolivre.com.br/{qd}'], ['Buy it on Amazon.com.br', 'https://www.amazon.com.br/s?k={q}']],
      flowers: [['Send flowers with Giuliana Flores', site('giulianaflores.com.br')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=floricultura+{q}']],
      food: [['Find it on iFood', site('ifood.com.br')]],
      groceries: [['Find it on iFood', site('ifood.com.br')], ['Buy it at Pão de Açúcar', site('paodeacucar.com')]],
      ride: [['Uber there', uber], ['Directions', transit]],
      experience: [['Find it on Google', 'https://www.google.com/search?q={q}'], ['Find it on Sympla', site('sympla.com.br')]],
    },
    apps: 'Google Maps and TheFork for tables, iFood for delivery and the supermarket, Uber and 99 for rides, Mercado Livre and Amazon.com.br for gifts, Giuliana Flores for flowers, Sympla for events, Pix to pay each other, WhatsApp for everything.',
    culture: `- How love is said: warmly, physically and out loud. "Te amo" is said often, affection in public is normal, and long WhatsApp voice notes are everyday. Family and friends are part of the couple's life.
- Time together is social: churrasco with friends, the beach, a samba or a forró night, football on TV. Plans flex; arriving a little late is fine, coldness is not.
- Dia dos Namorados (June 12) is the big day, not Feb 14 (February is Carnaval season): dinner, flowers, a gift; restaurants book out. Festa Junina in June is a playful outing.
- Dia das Mães (second Sunday of May) is huge: a family lunch, plan for both mothers. Réveillon means white clothes and, on the coast, jumping seven waves at midnight.
- Family is close and often nearby; Sunday lunch with the family is common, and the partner's family matters.
- In Portuguese (Brazil): warm, affectionate, informal (você, "a gente", "pra"), a little playful; never European Portuguese forms.
- A 10 percent service charge is usually on the bill; dinner runs late. Pay each other back with Pix. Prefer Uber or 99 at night.`,  },
  PT: {
    name: 'Portugal', money: '40 €', searchIn: 'Portuguese (Portugal)', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.pt')], ['See it on Google Maps', gmaps]],
      buy: [['Find it at Worten', site('worten.pt')], ['Find it at Fnac', site('fnac.pt')]],
      gift: [['Find it at Fnac', site('fnac.pt')], ['Find it at El Corte Inglés', site('elcorteingles.pt')]],
      flowers: [['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florista+{q}'], ['Flower delivery', 'https://www.google.com/search?q={q}+entrega+de+flores']],
      food: [['Find it on Glovo', site('glovoapp.com')], ['Order on Uber Eats', uberEats]],
      groceries: [['Buy it at Continente', site('continente.pt')], ['Find it on Glovo', site('glovoapp.com')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
      experience: [['Find it on Ticketline', site('ticketline.sapo.pt')], ['Experiences on Airbnb', airbnbExp]],
    },
    apps: 'TheFork for tables, Glovo, Uber Eats and Bolt Food for delivery, Uber and Bolt for rides, the metro, trams and CP trains for getting around, Worten, Fnac and El Corte Inglés for gifts, Ticketline and BOL for shows, MB Way to pay each other back, WhatsApp for messages.',
    culture: `- How love is said: warmly but with more reserve than in Brazil. "Amo-te" is kept for real moments; "gosto muito de ti" carries a lot. Care shows in gestures and in showing up.
- Saudade is real: a longing that colors songs (fado), letters and long distance. Many couples have lived apart for work abroad; staying close across distance is familiar.
- Family is close: Sunday lunch with the family, and the partner's family matters. Meeting the parents is a real step.
- Dia dos Namorados is Feb 14 (not June, as in Brazil). In Lisbon, Santo António (June 12 to 13) is the matchmaker's night: street parties (arraiais), grilled sardines, and a manjerico (a pot of basil with a paper carnation and a love verse, a quadra) given to the one you love.
- The lenço dos namorados, an embroidered handkerchief from the Minho, is a traditional love token; a thoughtful, handmade or local gift lands better than an expensive one.
- Rhythm: dinner 8 to 9:30, coffee all day, long lunches. Fado in Alfama or a miradouro at sunset is a classic date; weekend escapes to Sintra, Comporta, the Douro or the Algarve.
- In Portuguese (Portugal): warm and natural, tu with a partner, European Portuguese only (telemóvel, comboio, pequeno-almoço, "estou a fazer"); never Brazilian forms.
- Tipping is small and optional, around 5 to 10 percent for a nice dinner. Pay each other back with MB Way.`,
  },

  AU: {
    name: 'Australia', money: 'A$100', searchIn: 'English', maps: 'google',
    links: {
      table: [['Book on OpenTable', 'https://www.opentable.com.au/s?term={q}'], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.com.au', 'https://www.amazon.com.au/s?k={q}'], ['Compare prices', shopping]],
      food: [['Order on Uber Eats', uberEats], ['Order on DoorDash', 'https://www.doordash.com/search/store/{q}/']],
      groceries: [['Add it at Woolworths', 'https://www.woolworths.com.au/shop/search/products?searchTerm={q}']],
      ride: [['Uber there', uber], ['Transit directions', transit]],
    },
    apps: 'OpenTable for tables, Uber Eats, DoorDash and Menulog for delivery, Uber and DiDi for rides, Amazon.com.au for gifts.',
    culture: `- How love is said: casual and genuine; showing off or being too earnest gets gently mocked. Mateship and humour run through relationships.
- Life is outdoors: the beach, a barbecue, a coastal walk, a winery weekend. Seasons are flipped: Christmas is summer.
- Long distances between cities mean planning travel; many couples have family overseas.
- In Australian English: relaxed, warm, plain-spoken, Australian spelling.
- Valentine's Day, anniversaries and birthdays. Seasons are flipped: Christmas is summer, so picnics and beach days, not fireplaces.
- Tipping isn't expected; 10 percent for great service. Many restaurants are BYO wine.`,
  },
  CH: {
    name: 'Switzerland', money: 'CHF 80', searchIn: 'German, French or Italian, by region', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.ch')], ['See it on Google Maps', gmaps]],
      buy: [['Find it on Galaxus', 'https://www.galaxus.ch/search?q={q}'], ['Compare prices', shopping]],
      food: [['Order on Uber Eats', uberEats], ['Find it on Smood', site('smood.ch')]],
      groceries: [['Find it at Coop', site('coop.ch')], ['Find it at Migros', site('migros.ch')]],
      ride: [['Train and tram directions', transit], ['Uber there', uber]],
    },
    apps: 'TheFork and phone calls for tables, Uber Eats and Smood for delivery, the SBB app for trains (the default way to travel), Galaxus and Digitec for gifts, Twint to pay, WhatsApp for messages.',
    culture: `- How love is lived: privately and reliably. Swiss couples tend to be reserved in public and show care through dependability: on time, plans kept, things done well. Grand public gestures can embarrass; thoughtful and well-made lands.
- Four languages and distinct regions: German-speaking Zurich and Bern, French-speaking Geneva and Lausanne, Italian-speaking Ticino. Speak to them in theirs and respect the region's customs.
- Punctuality is respect: book tables precisely and arrive on time. Shops close early and on Sundays, so order gifts ahead. Nature is the date: a lake swim, a hike, a mountain hut.
- Prices are high and service is included; rounding up is enough. Valentinstag is modest; anniversaries and birthdays matter more.
- In German: warm but understated, du with the partner; in French or Italian, tu.`,
  },
  TR: {
    name: 'Türkiye', money: '₺3,000', searchIn: 'Turkish', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+rezervasyon']],
      buy: [['Buy it on Trendyol', 'https://www.trendyol.com/sr?q={q}'], ['Buy it on Hepsiburada', 'https://www.hepsiburada.com/ara?q={q}'], ['Buy it on Amazon.com.tr', 'https://www.amazon.com.tr/s?k={q}']],
      flowers: [['Order on ÇiçekSepeti', site('ciceksepeti.com')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=%C3%A7i%C3%A7ek%C3%A7i+{q}']],
      food: [['Find it on Yemeksepeti', site('yemeksepeti.com')], ['Find it on Getir', site('getir.com')]],
      groceries: [['Find it on Getir', site('getir.com')], ['Find it on Trendyol', 'https://www.trendyol.com/sr?q={q}']],
      ride: [['Directions', transit], ['Uber there', uber]],
    },
    apps: 'Google Maps and a phone call or WhatsApp for tables, Yemeksepeti, Getir and Trendyol Go for delivery, BiTaksi, Uber and the metro for getting around, Trendyol, Hepsiburada and ÇiçekSepeti for gifts and flowers, WhatsApp for messages. Cards with taksit (installments) are normal for bigger gifts.',
    culture: `- How love is said: warmly and through care. Pet names are everyday (aşkım, canım, hayatım); "seni seviyorum" carries weight. Feeding someone, looking after them and showing up for their family are love.
- Family is central: meeting the parents is a serious step, and a formal visit to ask for her hand (kız isteme, with Turkish coffee, sometimes a salty one for the groom as a joke) is still common.
- Public norms vary a lot: relaxed in much of Istanbul, Izmir and the coast, more conservative elsewhere. Keep affection and plans discreet unless they say otherwise, and never assume.
- In Turkish: warm, sen with a partner, natural and a little playful; never stiff.
- Big days: Sevgililer Günü (Feb 14) is the big flower day; anniversaries and birthdays matter. Ramazan and the two Bayrams (dates move each year) are family time, with visits to elders.
- Tip around 5 to 10 percent at sit-down restaurants. Popular meyhanes and Bosphorus places fill up on weekends; book by phone or WhatsApp.
- Bring something when visiting family (baklava, lokum, flowers). Skip alcohol as a gift for families who don't drink.`,
  },
  SA: {
    name: 'Saudi Arabia', money: 'SAR 300', searchIn: 'Arabic or English', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+reservation']],
      buy: [['Buy it on noon', 'https://www.noon.com/saudi-en/search/?q={q}'], ['Buy it on Amazon.sa', 'https://www.amazon.sa/s?k={q}']],
      flowers: [['Send flowers with Floward', site('floward.com')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Find it on HungerStation', site('hungerstation.com')], ['Find it on Jahez', site('jahez.net')]],
      groceries: [['Buy it on noon', 'https://www.noon.com/saudi-en/search/?q={q}']],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Google Maps and restaurant sites for tables, HungerStation, Jahez and Keeta for delivery, Uber and Careem for rides, noon and Amazon.sa for gifts, Floward for flowers, WhatsApp for messages; people pay with mada, Apple Pay and Tabby or Tamara.',
    culture: `- How love is said: warmly but privately. Romance usually centers on engagement and marriage (the milka or katb al-kitab, the wedding, the anniversary). Follow how they describe themselves, and never suggest anything public or that could expose them.
- Family is at the heart of it: families are involved in engagements and big decisions, and time with both families matters, especially around Eid.
- In Arabic: warm and respectful, Gulf-friendly phrasing; or English if they write in English.
- Big days: wedding and engagement anniversaries, Eid al-Fitr and Eid al-Adha gifts, Ramadan iftar and suhoor together (these move with the Islamic calendar). Feb 14 is commercially visible now but many keep it to a quiet dinner or a gift at home.
- National Day (Sep 23) and Founding Day (Feb 22) bring fireworks and events; the weekend is Friday and Saturday.
- No alcohol and no pork, anywhere. Many restaurants have family sections; dinners run late, especially in Ramadan.
- Gifts that land: perfume and oud, fine dates or chocolates, flowers delivered by Floward, gold or jewelry for big moments. Tip about 10 percent if service isn't included.`,
  },
  NL: {
    name: 'the Netherlands', money: '€70', searchIn: 'Dutch', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.nl')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on bol.com', 'https://www.bol.com/nl/nl/s/?searchtext={q}'], ['Buy it on Amazon.nl', 'https://www.amazon.nl/s?k={q}']],
      flowers: [['Send flowers with Fleurop', site('fleurop.nl')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=bloemist+{q}']],
      food: [['Find it on Thuisbezorgd', site('thuisbezorgd.nl')], ['Order on Uber Eats', uberEats]],
      groceries: [['Add it at Albert Heijn', 'https://www.ah.nl/zoeken?query={q}']],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'TheFork and restaurant sites for tables, Thuisbezorgd and Uber Eats for delivery, the bike, NS trains and Uber for getting around, bol.com and Amazon.nl for gifts, Fleurop and Bloomon for flowers, Tikkie to pay each other back, WhatsApp for messages.',
    culture: `- How love is said: plainly and honestly. "Ik hou van je" is sincere; directness is a form of respect, and couples talk things through without drama.
- Life runs on the agenda: plan dates ahead, and splitting the bill (then a Tikkie) is normal, not unromantic. Partners expect equality at home.
- Gezelligheid matters more than luxury: a terrace in the sun, a borrel with friends, a bike ride along the canals, a cosy dinner at home.
- In Dutch: je and jij, direct, no fluff, a little dry humour.
- Big days: Valentijnsdag (Feb 14) is modest (anonymous cards are a tradition), Koningsdag (Apr 27) is one big orange street party, and on Sinterklaas (Dec 5) people swap gifts with teasing handwritten poems. Christmas has two days; Oud en Nieuw means oliebollen and fireworks.
- Dinner is early (6 to 7:30). Round up or tip 5 to 10 percent for good service.
- On a birthday you congratulate the whole family too ("gefeliciteerd met je vriend"). Flowers are an everyday gift; thoughtful and practical beats flashy.`,
  },
  NO: {
    name: 'Norway', money: '1 200 kr', searchIn: 'Norwegian', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+bord+booking']],
      buy: [['Compare on Prisjakt', site('prisjakt.no')], ['Compare prices', shopping]],
      flowers: [['Send flowers with Interflora', site('interflora.no')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=blomsterbutikk+{q}']],
      food: [['Find it on Foodora', site('foodora.no')], ['Find it on Wolt', site('wolt.com')]],
      groceries: [['Find it on Oda', site('oda.com')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'Restaurant sites and a phone call for tables, Foodora and Wolt for delivery, Ruter and Vy for transit, taxis and Uber in the cities, Prisjakt, Komplett and Elkjøp for gifts, Oda for groceries, Vipps to pay each other, Messenger and Snapchat for messages.',
    culture: `- How love is said: quietly. "Jeg elsker deg" is kept for real moments; love shows in everyday equality, sharing the chores and being there.
- Janteloven: modesty is valued, and showy gestures can embarrass. A thoughtful plan beats an expensive one.
- Friluftsliv (life outdoors) is the classic date: a hike, a ski trip, a fjord swim in summer, a weekend at a hytte (cabin) with no signal. Winters are long and dark, so cosy evenings in matter.
- Many couples live together as samboere for years before marrying, if they marry; don't assume.
- In Norwegian (Bokmål unless they write Nynorsk): du, warm and plain, never gushing.
- Big days: Morsdag is the second Sunday of February, Valentinsdag (Feb 14) is modest, 17. mai is the national day (bunad, parades, ice cream), Sankthans (Jun 23) means bonfires, and Christmas Eve (julaften) is the main celebration.
- Prices are high; tipping isn't expected, round up or 5 to 10 percent for great service. Pay each other back with Vipps.`,
  },
  PL: {
    name: 'Poland', money: '300 zł', searchIn: 'Polish', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+rezerwacja']],
      buy: [['Buy it on Allegro', 'https://allegro.pl/listing?string={q}'], ['Buy it on Amazon.pl', 'https://www.amazon.pl/s?k={q}']],
      flowers: [['Send flowers with Poczta Kwiatowa', site('pocztakwiatowa.pl')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=kwiaciarnia+{q}']],
      food: [['Find it on Pyszne.pl', site('pyszne.pl')], ['Find it on Glovo', site('glovoapp.com')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it on Allegro', 'https://allegro.pl/listing?string={q}']],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'Google Maps and restaurant sites for tables, Pyszne.pl, Glovo, Wolt and Uber Eats for delivery, Uber, Bolt and FREENOW for rides, Allegro for gifts, Poczta Kwiatowa for flowers, BLIK to pay each other, Messenger and WhatsApp for messages.',
    culture: `- How love is said: romantically and with courtesy. Flowers on a date, small chivalrous gestures and a handwritten word are appreciated by many; "kocham cię" carries weight.
- Family and faith matter to many: Sunday dinner with the family, and Wigilia (Christmas Eve), when people share the opłatek wafer and wish each other well. Meeting the parents is a real step.
- Name days (imieniny) can matter as much as birthdays, especially for older generations; flowers or a small gift. Bella can ask their names and mark them.
- In Polish: ty, warm and affectionate, with diminutives (kochanie, skarbie).
- Big days: Walentynki (Feb 14), Dzień Kobiet (Mar 8, flowers for the women in their life), Dzień Matki (May 26), Andrzejki (Nov 29, a playful fortune-telling night with poured wax), Sylwester (Dec 31).
- Give an odd number of flowers; chrysanthemums are for graves (All Saints, Nov 1).
- Tip about 10 percent for good service. Pay each other back with BLIK.`,
  },
  BE: {
    name: 'Belgium', money: '€70', searchIn: 'Dutch or French, by region', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.be')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on bol.com', 'https://www.bol.com/be/nl/s/?searchtext={q}'], ['Buy it on Amazon.com.be', 'https://www.amazon.com.be/s?k={q}']],
      flowers: [['Send flowers with Interflora', site('interflora.be')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Find it on Deliveroo', site('deliveroo.be')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it at Colruyt', site('colruyt.be')], ['Find it at Delhaize', site('delhaize.be')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'TheFork and Resengo for tables, Deliveroo, Uber Eats and Takeaway.com for delivery, SNCB/NMBS trains, STIB, De Lijn and Uber for getting around, bol.com and Amazon.com.be for gifts, Bongo boxes for experiences, Payconiq or Wero and Bancontact to pay, WhatsApp for messages.',
    culture: `- How love is said: warmly but modestly. Belgians are private and practical; care shows in good food, time together and compromise rather than big words.
- Two main cultures: Flanders speaks Dutch (Flemish, not Netherlands Dutch), Wallonia speaks French, Brussels both, and the east has a small German-speaking community. Write to them in theirs and respect where they're from.
- Food is the date: a long dinner, a beer tasting, real chocolate (a box from a good chocolatier is a classic gift), frites on the square, a weekend in Bruges, Ghent or the Ardennes.
- In Dutch: je and jij (Flemish casual ge is fine if they use it); in French: tu, warm and natural.
- Big days: Valentine's Day (Feb 14), Mother's Day on the second Sunday of May (Aug 15 in Antwerp), Sinterklaas (Dec 6), Christmas and New Year's Eve.
- Service is included; round up for good service. Dinner is around 7 to 8.
- Avoid chrysanthemums (graves); good chocolate, flowers or a Bongo experience box land well.`,
  },
  IE: {
    name: 'Ireland', money: '€80', searchIn: 'English', maps: 'google',
    links: {
      table: [['Book on OpenTable', 'https://www.opentable.ie/s?term={q}'], ['See it on Google Maps', gmaps]],
      buy: [['Find it on Amazon', 'https://www.amazon.co.uk/s?k={q}'], ['Compare prices', shopping]],
      flowers: [['Send flowers with Interflora', site('interflora.ie')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Find it on Deliveroo', site('deliveroo.ie')], ['Find it on Just Eat', site('just-eat.ie')], ['Order on Uber Eats', uberEats]],
      groceries: [['Add it at Tesco', 'https://www.tesco.ie/groceries/en-IE/search?query={q}']],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'OpenTable and restaurant sites for tables, Deliveroo, Just Eat and Uber Eats for delivery, FREENOW and Uber for taxis, Irish Rail, Luas and Dublin Bus for getting around, Interflora for flowers, Revolut to pay each other back, WhatsApp for messages.',
    culture: `- How love is said: warmly and with understatement. Slagging (gentle teasing) is affection; big declarations can feel too much. A good card with real words goes a long way.
- The pub, live music, a walk on the pier or a cliff path, a weekend away in Galway, Kerry or West Cork: time together is social and easy.
- Family is close, and many have family abroad; Christmas usually means going home, so decide early whose family.
- In Irish English: warm, chatty, a bit wry; Irish and British spelling. A cúpla focal of Irish only if they use it.
- Big days: St Brigid's Day (Feb 1), Valentine's Day (Feb 14), St Patrick's Day (Mar 17), anniversaries and birthdays. A leap-day proposal by the woman (Feb 29) is an old Irish tradition.
- Tip 10 to 12.5 percent at restaurants unless service is on the bill; no tip at the bar.
- The Claddagh ring is the traditional love token: worn on the right hand with the heart facing in means taken.`,
  },
  SE: {
    name: 'Sweden', money: '1 000 kr', searchIn: 'Swedish', maps: 'google',
    links: {
      table: [['Find it on TheFork', site('thefork.se')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.se', 'https://www.amazon.se/s?k={q}'], ['Compare on Prisjakt', site('prisjakt.nu')]],
      flowers: [['Send flowers with Interflora', site('interflora.se')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=blomsterhandel+{q}']],
      food: [['Find it on Foodora', site('foodora.se')], ['Find it on Wolt', site('wolt.com')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it at ICA', site('ica.se')], ['Find it on Mathem', site('mathem.se')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'TheFork and restaurant sites for tables, Foodora, Wolt and Uber Eats for delivery, SL, SJ trains, Bolt and Uber for getting around, Amazon.se, Prisjakt and CDON for gifts, Interflora for flowers, Swish to pay each other back, Messenger and WhatsApp for messages.',
    culture: `- How love is said: sincerely and without fuss. "Jag älskar dig" means it; lagom (not too much, not too little) shapes gestures. Many couples live together as sambo for years before marrying, if they do.
- Equality is the default: splitting costs and chores is normal, and nobody assumes roles.
- Fika is a date in itself. Summers are for the archipelago, a lake swim and the summer house; long dark winters are for candles, home dinners and saunas.
- In Swedish: du, warm and low-key, never exaggerated.
- Big days: Alla hjärtans dag (Feb 14, flowers and a dinner, kept modest), Valborg bonfires (Apr 30), Midsommar (the Friday between June 19 and 25, flower crowns, herring, dancing), crayfish parties in August, Lucia (Dec 13) and Christmas Eve (julafton), the main day.
- Tipping isn't required; round up or about 10 percent for a great dinner. Pay each other back with Swish.
- Design and quality over flash; an experience or something well made lands best.`,
  },
  AT: {
    name: 'Austria', money: '70 €', searchIn: 'German', maps: 'google',
    links: {
      table: [['Find it on Quandoo', site('quandoo.at')], ['Find it on TheFork', site('thefork.at')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Amazon.de', 'https://www.amazon.de/s?k={q}'], ['Compare on Geizhals', site('geizhals.at')]],
      flowers: [['Send flowers with Fleurop', site('fleurop.at')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=blumen+{q}']],
      food: [['Find it on Lieferando', site('lieferando.at')], ['Find it on foodora', site('foodora.at')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it at BILLA', site('billa.at')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'Quandoo, TheFork and a phone call for tables, Lieferando, foodora and Uber Eats for delivery, public transport, ÖBB trains and Uber or Bolt for getting around, Amazon.de and Geizhals for gifts, Fleurop for flowers, Jochen Schweizer and mydays for experiences, WhatsApp for messages.',
    culture: `- How love is said: charmingly, with a little formality and a lot of Gemütlichkeit. "Ich liebe dich" is sincere; Viennese Schmäh (dry, teasing humour) is affection.
- The classics: an afternoon in a Kaffeehaus, a Heuriger among the vineyards, the opera, a hike and a mountain hut. Ball season (January and February) makes a glamorous couples' night.
- Punctuality and planning matter: book tables ahead and be on time. Shops close on Sundays, so get gifts in time.
- In Austrian German: du with a partner, warm, Austrian words (Jänner, Paradeiser, Sackerl), never German-German phrasing.
- Big days: Valentinstag (Feb 14, flowers or a dinner, modest), anniversaries (Jahrestag), Muttertag (second Sunday of May), Heiliger Abend (Dec 24, when the Christkind brings the gifts) and Silvester (the Donauwalzer at midnight).
- Round up or tip about 5 to 10 percent, saying the total when you pay.
- Give flowers in odd numbers; avoid chrysanthemums and lilies (graves).`,
  },
  AR: {
    name: 'Argentina', money: '$80.000 ARS', searchIn: 'Spanish', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+reserva']],
      buy: [['Buy it on Mercado Libre', 'https://listado.mercadolibre.com.ar/{qd}'], ['Compare prices', shopping]],
      flowers: [['Find it on Mercado Libre', 'https://listado.mercadolibre.com.ar/{qd}'], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florer%C3%ADa+{q}']],
      food: [['Find it on PedidosYa', site('pedidosya.com.ar')], ['Find it on Rappi', site('rappi.com.ar')]],
      groceries: [['Find it on PedidosYa', site('pedidosya.com.ar')], ['Find it on Rappi', site('rappi.com.ar')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Google Maps, Instagram and WhatsApp for tables, PedidosYa and Rappi for delivery, Uber, Cabify and DiDi for rides, Mercado Libre for gifts, Mercado Pago and bank transfers to pay, WhatsApp for everything.',
    culture: `- How love is said: openly and passionately. "Te amo" and "te quiero" are said often, everyone greets with a kiss on the cheek, and long talks over mate or wine are a date in themselves.
- Life runs late: merienda in the afternoon, dinner at 9:30 or later, going out after midnight. Never plan a 7 pm dinner.
- Family and friends are close: Sunday asado with the family, the partner's family matters, and Día del Amigo (Jul 20) is huge.
- In Rioplatense Spanish: voseo always (vos querés, contame, dale), warm and playful, "che" is fine; never tú.
- Big days: Día de los Enamorados (Feb 14), Semana de la Dulzura (first week of July, sweets traded for a kiss), Día de la Primavera (Sep 21, picnics), Día de la Madre (third Sunday of October, not May), Día del Padre (third Sunday of June).
- Prices change fast: give budgets loosely and check current prices. Tip about 10 percent, often in cash.
- A good Malbec, alfajores or a handwritten note land well.`,
  },
  MY: {
    name: 'Malaysia', money: 'RM150', searchIn: 'English or Malay', maps: 'google',
    links: {
      table: [['Find it on Chope', site('chope.co')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Shopee', 'https://shopee.com.my/search?keyword={q}'], ['Buy it on Lazada', 'https://www.lazada.com.my/catalog/?q={q}']],
      flowers: [['Send flowers with BloomThis', site('bloomthis.co')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Find it on GrabFood', site('food.grab.com')], ['Find it on foodpanda', site('foodpanda.my')]],
      groceries: [['Buy it on Shopee', 'https://shopee.com.my/search?keyword={q}']],
      ride: [['Directions', transit]],
    },
    apps: 'Chope and Google Maps for tables, GrabFood and foodpanda for delivery, Grab for rides (Uber is not there) and the LRT and MRT in the Klang Valley, Shopee and Lazada for gifts, BloomThis for flowers, Touch \'n Go eWallet and DuitNow to pay, WhatsApp for messages.',
    culture: `- How love is said: through care more than words. "Dah makan?" (have you eaten?) is affection; small daily kindnesses and food matter.
- Malaysia is many cultures: Malay, Chinese, Indian and others, each with its own festivals and food rules. Ask which they keep; for Muslim partners, choose halal places and skip alcohol.
- Public affection is modest, especially for Muslim couples; plan private, family-friendly settings, and never suggest anything that could expose them.
- Families are closely involved, especially around engagements and weddings.
- In Malaysian English (light Manglish if they use it), Bahasa Melayu (awak, sayang) or Chinese: warm, gentle, easygoing.
- Big days: Feb 14 for many non-Muslim couples (many Muslim couples don't mark it), Chap Goh Mei (the 15th night of Lunar New Year, oranges thrown in the water) for Chinese couples, Hari Raya, Deepavali and Christmas with family. Festival dates move each year.
- No tipping needed; a service charge plus SST is on most restaurant bills.`,
  },
  TH: {
    name: 'Thailand', money: '฿1,500', searchIn: 'Thai', maps: 'google',
    links: {
      table: [['Find it on Wongnai', site('wongnai.com')], ['Find it on Hungry Hub', site('hungryhub.com')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Shopee', 'https://shopee.co.th/search?keyword={q}'], ['Buy it on Lazada', 'https://www.lazada.co.th/catalog/?q={q}']],
      flowers: [['Order flowers on Shopee', 'https://shopee.co.th/search?keyword={q}+%E0%B8%94%E0%B8%AD%E0%B8%81%E0%B9%84%E0%B8%A1%E0%B9%89'], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Find it on LINE MAN', site('lineman.line.me')], ['Find it on GrabFood', site('food.grab.com')]],
      groceries: [['Buy it on Lazada', 'https://www.lazada.co.th/catalog/?q={q}']],
      ride: [['Directions', transit]],
    },
    apps: 'Wongnai and Hungry Hub for tables and deals, LINE MAN and GrabFood for delivery, Grab and Bolt for rides, the BTS and MRT in Bangkok, Shopee and Lazada for gifts, PromptPay QR to pay, LINE for messages.',
    culture: `- How love is said: sweetly and playfully, with nicknames and teasing. Care shows in small things: feeding each other, bringing snacks, checking in on LINE through the day.
- Face and kreng jai (consideration) matter: avoid confrontation, never criticize a partner in front of others, and raise problems gently.
- Family is respected: meeting the parents is serious, elders come first, and for marriage the sinsod (bride price) is still a tradition in many families.
- In Thai: warm and gentle, with polite particles (kha, khrap), playful but never rude.
- Big days: Valentine's Day (Feb 14) is huge (roses everywhere; some couples register their marriage at Bang Rak, the "village of love"), Loy Krathong (the November full moon) to float a krathong together, Songkran (Apr 13 to 15), Mother's Day (Aug 12) and Father's Day (Dec 5). Same-sex marriage has been legal since January 2025.
- Tipping isn't required; leave small change, and a 10 percent service charge is common at nicer places.
- Don't wrap gifts in black; flowers, sweets and something thoughtful land well.`,
  },
  ID: {
    name: 'Indonesia', money: 'Rp400.000', searchIn: 'Indonesian', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+reservasi']],
      buy: [['Find it on Tokopedia', site('tokopedia.com')], ['Buy it on Shopee', 'https://shopee.co.id/search?keyword={q}']],
      flowers: [['Order flowers on Shopee', 'https://shopee.co.id/search?keyword={q}+bunga'], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=toko+bunga+{q}']],
      food: [['Find it on GoFood', site('gofood.co.id')], ['Find it on GrabFood', site('food.grab.com')]],
      groceries: [['Buy it on Shopee', 'https://shopee.co.id/search?keyword={q}']],
      ride: [['Directions', transit]],
    },
    apps: 'Google Maps and WhatsApp for tables, GoFood, GrabFood and ShopeeFood for delivery, Gojek and Grab for rides, Tokopedia and Shopee for gifts, QRIS, GoPay, OVO and DANA to pay, WhatsApp for messages.',
    culture: `- How love is said: gently and through care: "sayang", checking they've eaten, small gifts, time with each other's families. Family and faith are central for most couples.
- Discretion matters: public affection is frowned on in most places, and couples who aren't married can face family or legal trouble for living together. Follow how they describe themselves and never suggest anything that could expose them.
- Families are involved in engagements and weddings; many couples Bella meets will be engaged or married.
- In Indonesian: warm and casual (aku, kamu), gentle, never stiff; not Malaysian Malay.
- Big days: Lebaran (Idul Fitri, date moves) is the biggest: going home (mudik), asking forgiveness and sending hampers. Valentine's Day is contested (some regions and clerics discourage it), so many keep it quiet or skip it. Hari Ibu (Dec 22) honors mothers.
- Most couples eat halal; skip alcohol unless they say otherwise. No tipping needed; service is often included.
- A thoughtful hamper, flowers or a meal out with family lands well.`,
  },
  DK: {
    name: 'Denmark', money: '800 kr.', searchIn: 'Danish', maps: 'google',
    links: {
      table: [['Find it on DinnerBooking', site('dinnerbooking.com')], ['Find it on TheFork', site('thefork.dk')], ['See it on Google Maps', gmaps]],
      buy: [['Compare on PriceRunner', site('pricerunner.dk')], ['Compare prices', shopping]],
      flowers: [['Send flowers with Interflora', site('interflora.dk')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=blomsterhandler+{q}']],
      food: [['Find it on Wolt', site('wolt.com')], ['Find it on Just Eat', site('just-eat.dk')]],
      groceries: [['Find it on Nemlig.com', site('nemlig.com')]],
      ride: [['Transit directions', transit]],
    },
    apps: 'DinnerBooking, TheFork and restaurant sites for tables, Wolt and Just Eat for delivery, the bike, the Metro, DSB trains and Dantaxi for getting around, PriceRunner and local shops for gifts, Interflora for flowers, MobilePay to pay each other back, Messenger for messages.',
    culture: `- How love is said: honestly and without fuss. "Jeg elsker dig" is sincere; hygge (candles, a home-cooked dinner, closeness) is the love language, more than grand gestures.
- Equality and directness: partners share costs and chores, irony and dry humour are affection, and showing off (Janteloven) lands badly.
- Life by bike, harbour baths and picnics in summer, a sommerhus by the sea; dark winters are for cosy evenings in.
- In Danish: du, warm, informal, a little dry.
- Big days: Valentinsdag (Feb 14, modest), gækkebrev before Easter (a paper-cut letter with a riddle rhyme, signed with dots: guess the sender or owe a chocolate egg), Sankthans (Jun 23, bonfires), and Christmas Eve (juleaften), the main celebration.
- Service is included; round up for great service. Pay each other back with MobilePay.
- Design and quality over flash; flowers are an everyday gift.`,
  },
  IL: {
    name: 'Israel', money: '₪400', searchIn: 'Hebrew', maps: 'google',
    links: {
      table: [['Find it on Ontopo', site('ontopo.com')], ['See it on Google Maps', gmaps]],
      buy: [['Compare on Zap', site('zap.co.il')], ['Compare prices', shopping]],
      flowers: [['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}'], ['Flower delivery', 'https://www.google.com/search?q={q}+%D7%9E%D7%A9%D7%9C%D7%95%D7%97+%D7%A4%D7%A8%D7%97%D7%99%D7%9D']],
      food: [['Find it on Wolt', site('wolt.com')], ['Find it on 10bis', site('10bis.co.il')]],
      ride: [['Directions', transit]],
    },
    apps: 'Ontopo and Tabit for tables, Wolt and 10bis for delivery, Gett and Yango for taxis and Moovit for buses and trains, Zap to compare prices for gifts, Bit and PayBox to pay each other back, WhatsApp for everything.',
    culture: `- How love is said: directly and warmly. Israelis are dugri (straight talkers); affection is expressive, and friends and family are part of the couple's life, with big Friday-night dinners.
- Shabbat shapes the week: from Friday evening to Saturday night many places close and public transport largely stops. Plan around it, and ask whether kosher or Shabbat matters to them.
- People range from secular to religious, Jewish and Arab; ask what fits rather than assume. Reserve duty can mean time apart; staying close across that matters.
- In Hebrew: warm and informal, using the right gender forms for each of them; or Arabic or English if that's what they write.
- Big days: Tu B'Av (the 15th of Av, in July or August) is the Jewish day of love; Feb 14 is secondary. Rosh Hashanah and Passover (dates move) are family holidays.
- Tip 10 to 15 percent at restaurants (often in cash). Popular places book up on Ontopo or Tabit for Thursday and Saturday nights.
- Flowers on Friday for Shabbat are a common, lovely gesture.`,
  },
  NZ: {
    name: 'New Zealand', money: 'NZ$120', searchIn: 'English', maps: 'google',
    links: {
      table: [['Find it on First Table', site('firsttable.co.nz')], ['See it on Google Maps', gmaps]],
      buy: [['Find it on Trade Me', site('trademe.co.nz')], ['Compare prices', shopping]],
      flowers: [['Send flowers with Interflora', site('interflora.co.nz')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Order on Uber Eats', uberEats], ['Order on DoorDash', 'https://www.doordash.com/search/store/{q}/']],
      groceries: [['Find it at Woolworths', site('woolworths.co.nz')], ['Find it at New World', site('newworld.co.nz')]],
      ride: [['Uber there', uber], ['Transit directions', transit]],
    },
    apps: 'First Table, OpenTable and restaurant sites for tables, Uber Eats and DoorDash for delivery, Uber for rides, Trade Me and local shops for gifts, Interflora for flowers, Woolworths and New World for groceries, Messenger and iMessage for messages.',
    culture: `- How love is said: easygoing and genuine. Showing off gets gently cut down (tall poppy), and humour runs through everything.
- Life is outdoors: beaches, tramping, a road trip, a weekend at the bach. Seasons are flipped: Christmas is summer.
- Māori culture is part of everyday life: "kia ora" is a welcome greeting, and whānau (family) matters.
- In New Zealand English: relaxed, warm, plain-spoken, NZ spelling.
- Big days: Valentine's Day, anniversaries and birthdays; Matariki (the Māori New Year, a public holiday whose date moves) is a time to gather; Mother's Day is the second Sunday of May, Father's Day the first Sunday of September.
- Tipping isn't expected; 10 percent for great service. Some restaurants are BYO.
- A thoughtful local gift lands well (NZ wine, something handmade). Pounamu (greenstone) is traditionally given, not bought for yourself.`,
  },
  VN: {
    name: 'Vietnam', money: '800.000₫', searchIn: 'Vietnamese', maps: 'google',
    links: {
      table: [['Find it on PasGo', site('pasgo.vn')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Shopee', 'https://shopee.vn/search?keyword={q}'], ['Buy it on Tiki', 'https://tiki.vn/search?q={q}'], ['Buy it on Lazada', 'https://www.lazada.vn/catalog/?q={q}']],
      flowers: [['Order flowers on Shopee', 'https://shopee.vn/search?keyword={q}+hoa'], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=shop+hoa+{q}']],
      food: [['Find it on ShopeeFood', site('shopeefood.vn')], ['Find it on GrabFood', site('food.grab.com')]],
      groceries: [['Buy it on Tiki', 'https://tiki.vn/search?q={q}']],
      ride: [['Directions', transit]],
    },
    apps: 'PasGo and Google Maps for tables, ShopeeFood and GrabFood for delivery, Grab, Be and Xanh SM for rides, Shopee, Tiki and Lazada for gifts, MoMo, ZaloPay and VietQR bank transfers to pay, Zalo for messages.',
    culture: `- How love is said: through care. "Anh yêu em" and "em yêu anh" are said, but love mostly shows in deeds: picking her up on the motorbike, bringing food, remembering what they like.
- Family comes first: respect for parents runs deep, meeting the family is a big step, and Tết (Lunar New Year, date moves) is spent at home with family.
- In Vietnamese: warm and affectionate, with the right pronoun pair (anh and em between partners, following how they speak).
- Big days: International Women's Day (Mar 8) and Vietnamese Women's Day (Oct 20) are major flower and gift days for a partner, and for mothers and mothers-in-law too. Valentine's Day is popular with younger couples; White Day (Mar 14) and Thất Tịch (the seventh day of the seventh lunar month) are smaller.
- Café dates, a night market, a weekend in Đà Lạt or Hội An are classics. Christmas Eve is a night out for young couples in the cities.
- No tipping obligation; a small tip is appreciated at nicer places.
- Avoid black or white wrapping (mourning) and sharp objects as gifts; flowers, sweets and something for the family land well.`,
  },
  FI: {
    name: 'Finland', money: '70 €', searchIn: 'Finnish', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+p%C3%B6yt%C3%A4varaus']],
      buy: [['Find it at Verkkokauppa.com', site('verkkokauppa.com')], ['Compare prices', shopping]],
      flowers: [['Send flowers with Interflora', site('interflora.fi')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=kukkakauppa+{q}']],
      food: [['Find it on Wolt', site('wolt.com')], ['Find it on Foodora', site('foodora.fi')]],
      groceries: [['Find it at S-kaupat', site('s-kaupat.fi')], ['Find it at K-Ruoka', site('k-ruoka.fi')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'Restaurant sites and Google Maps for tables, Wolt and Foodora for delivery, HSL and VR trains, Bolt and Uber for getting around, Verkkokauppa.com and Gigantti for gifts, S-kaupat and K-Ruoka for groceries, MobilePay to pay each other back, WhatsApp for messages.',
    culture: `- How love is said: rarely in words, and it means a lot when it is. "Rakastan sinua" is not said lightly; silence together is comfortable, and actions (fixing, showing up, being reliable) speak.
- Sauna, the summer cottage (mökki), lakes and forests are the backdrop for time together; long dark winters make cosy evenings in precious.
- Equality is the norm: splitting costs and chores is ordinary.
- In Finnish: sinä, plain and warm, never gushing (some Finns speak Swedish; follow them).
- Big days: Ystävänpäivä (Feb 14) is Friend's Day, for friends as much as couples, so frame it that way. Vappu (May 1) means picnics and sima, Juhannus (midsummer, late June) is spent at the cottage, Itsenäisyyspäivä (Dec 6) has candles in the windows, and Christmas Eve is the main day. Name days are on the calendar.
- Tipping isn't expected. Pay each other back with MobilePay.
- Practical, well-made gifts (Finnish design, something for the sauna or the cottage) land well.`,
  },
  CL: {
    name: 'Chile', money: '$50.000 CLP', searchIn: 'Spanish', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+reserva']],
      buy: [['Buy it on Mercado Libre', 'https://listado.mercadolibre.cl/{qd}'], ['Find it at Falabella', site('falabella.com')]],
      flowers: [['Find it on Mercado Libre', 'https://listado.mercadolibre.cl/{qd}'], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florer%C3%ADa+{q}']],
      food: [['Find it on PedidosYa', site('pedidosya.cl')], ['Find it on Rappi', site('rappi.cl')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it on Rappi', site('rappi.cl')], ['Find it on PedidosYa', site('pedidosya.cl')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Google Maps and restaurant sites for tables, PedidosYa, Rappi and Uber Eats for delivery, Uber, Cabify and DiDi for rides, the Metro in Santiago, Mercado Libre and Falabella for gifts, Mercado Pago and bank transfers to pay, WhatsApp for everything.',
    culture: `- How love is said: warmly and casually. Partners are pololo and polola, and being together is pololear; "te amo" and "te quiero" are said, and affection in public is normal.
- Family is close: many live with their parents into their late twenties, so a weekend away (the coast, the Cajón del Maipo, Valparaíso) means a lot.
- Life runs a little late: once (evening tea) around 7, dinner after 8:30.
- In Chilean Spanish: tú, warm and relaxed, Chilean words (pololo, al tiro, cachai if they use it); never Spain forms.
- Big days: Día de los Enamorados (Feb 14), Día de la Madre (second Sunday of May), Día del Padre (third Sunday of June), Fiestas Patrias (Sep 18 and 19: fondas, cueca, empanadas and asado), New Year's Eve fireworks.
- A 10 percent tip is suggested on the bill and customary.
- A good Carmenère, flowers or a handwritten note land well.`,
  },
  CZ: {
    name: 'Czechia', money: '1 500 Kč', searchIn: 'Czech', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+rezervace']],
      buy: [['Find it on Alza', site('alza.cz')], ['Compare on Heureka', site('heureka.cz')]],
      flowers: [['Florists near you', 'https://www.google.com/maps/search/?api=1&query=kv%C4%9Btin%C3%A1%C5%99stv%C3%AD+{q}'], ['Flower delivery', 'https://www.google.com/search?q={q}+rozvoz+kv%C4%9Btin']],
      food: [['Find it on Wolt', site('wolt.com')], ['Find it on Foodora', site('foodora.cz')]],
      groceries: [['Find it on Rohlik.cz', site('rohlik.cz')]],
      ride: [['Transit directions', transit], ['Uber there', uber]],
    },
    apps: 'Google Maps and restaurant sites for tables, Wolt and Foodora for delivery, public transport, Bolt, Uber and Liftago for getting around, Alza and Heureka for gifts, Rohlik.cz for groceries, Messenger and WhatsApp for messages.',
    culture: `- How love is said: sincerely and with dry, ironic humour. "Miluju tě" carries weight; practical care and time together say more than grand gestures.
- May 1 is Lovers' Day: couples kiss under a blossoming tree (a cherry or a birch) and visit the Mácha statue on Petřín Hill in Prague.
- Name days (svátek) are on the calendar and marked with flowers or a small gift; Bella can ask their names.
- Weekends at the chata or chalupa (cottage), hikes, a good pub and beer are the backbone of time together.
- In Czech: ty, warm and understated.
- Big days: Valentýn (Feb 14, modest), MDŽ (Women's Day, Mar 8), May 1, Mother's Day (second Sunday of May), Štědrý den (Christmas Eve, carp dinner and gifts from Ježíšek), Silvestr.
- Tip about 10 percent by telling the server the total you want to pay. Give flowers in odd numbers.`,
  },
  ZA: {
    name: 'South Africa', money: 'R800', searchIn: 'English', maps: 'google',
    links: {
      table: [['Find it on Dineplan', site('dineplan.com')], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Takealot', 'https://www.takealot.com/all?qsearch={q}'], ['Compare prices', shopping]],
      flowers: [['Send flowers with NetFlorist', site('netflorist.co.za')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Order on Uber Eats', uberEats], ['Find it on Mr D', site('mrd.com')]],
      groceries: [['Find it on Checkers Sixty60', site('checkers.co.za')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Dineplan and restaurant sites for tables, Uber Eats and Mr D for delivery, Uber and Bolt for rides (better than walking or hailing at night), Takealot for gifts, NetFlorist for flowers, Checkers Sixty60 for groceries, WhatsApp for everything.',
    culture: `- How love is said: warmly and sociably; friends and family are part of the couple's life. South Africa has many cultures and eleven-plus languages, so ask which traditions they keep (in many families, lobola negotiations are part of marriage).
- The classics: a braai with friends, a wine farm in Stellenbosch or Franschhoek, the beach, a weekend in the bush on a game drive.
- Plan the way home: use Uber or Bolt at night and choose places with safe parking. Power cuts (load-shedding) can still disrupt plans, so have a backup.
- In South African English: warm and friendly; a lekker or a howzit if they talk that way.
- Big days: Valentine's Day is big, Mother's Day (second Sunday of May), Father's Day (third Sunday of June), Heritage Day (Sep 24, also called Braai Day). Christmas is summer. Same-sex marriage has been legal since 2006.
- Tip 10 to 15 percent at restaurants, and something small for car guards.
- A thoughtful local gift lands well: good South African wine, rooibos, something handmade.`,
  },
  GR: {
    name: 'Greece', money: '50 €', searchIn: 'Greek', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+%CE%BA%CF%81%CE%AC%CF%84%CE%B7%CF%83%CE%B7']],
      buy: [['Compare on Skroutz', 'https://www.skroutz.gr/search?keyphrase={q}'], ['Compare prices', shopping]],
      flowers: [['Florists near you', 'https://www.google.com/maps/search/?api=1&query=%CE%B1%CE%BD%CE%B8%CE%BF%CF%80%CF%89%CE%BB%CE%B5%CE%AF%CE%BF+{q}'], ['Flower delivery', 'https://www.google.com/search?udm=28&q={q}+flower+delivery+Greece']],
      food: [['Find it on efood', site('e-food.gr')], ['Find it on Wolt', site('wolt.com')]],
      groceries: [['Find it on Skroutz', 'https://www.skroutz.gr/search?keyphrase={q}']],
      ride: [['Directions', transit], ['Taxi with Uber', uber]],
    },
    apps: 'Google Maps and a phone call for tables, efood, Wolt and Box for delivery, FREENOW and Uber for taxis and the Metro in Athens, Skroutz for gifts, IRIS to pay each other back, Viber and WhatsApp for messages.',
    culture: `- How love is said: openly and passionately. "S'agapó" is said with feeling, pet names are everyday (agápi mou, mōró mou), and evenings out run late with friends.
- Name days (giortí) often matter more than birthdays: a call first thing, a small gift, sometimes an open house. Bella can ask their names and mark them.
- Family is close: Sunday lunch, the partner's family matters, and Orthodox Easter (date moves) is the biggest holiday of the year.
- In Greek: εσύ, warm, expressive, a little playful.
- Big days: Agios Valentinos (Feb 14), Mother's Day (second Sunday of May), Dekapentávgoustos (Aug 15, island festivals), Christmas and New Year's Eve (the vasilópita coin on Jan 1).
- Dinner at 9 or later; a taverna by the sea at sunset or a weekend on an island are classics.
- Tip around 5 to 10 percent or round up. Bring sweets from a zacharoplasteío when visiting family.`,
  },
  CO: {
    name: 'Colombia', money: '$200.000 COP', searchIn: 'Spanish', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+reserva']],
      buy: [['Buy it on Mercado Libre', 'https://listado.mercadolibre.com.co/{qd}'], ['Find it at Falabella', site('falabella.com.co')]],
      flowers: [['Order flowers on Rappi', site('rappi.com.co')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florister%C3%ADa+{q}']],
      food: [['Find it on Rappi', site('rappi.com.co')]],
      groceries: [['Find it on Rappi', site('rappi.com.co')]],
      ride: [['Directions', transit], ['Uber there', uber]],
    },
    apps: 'Google Maps, Instagram and WhatsApp for tables, Rappi for delivery, flowers and groceries, DiDi, Uber and InDrive for rides (apps rather than hailing a taxi at night), Mercado Libre and Falabella for gifts, Nequi and Bre-B to pay each other, WhatsApp for everything.',
    culture: `- How love is said: warmly and romantically: "te amo", "te quiero", "mi amor", "mi vida", and dancing (salsa, vallenato) is a date in itself.
- Amor y Amistad (the third Saturday of September) is the big day, for friends too (amigo secreto gift swaps); Feb 14 is smaller.
- Family is close and faith matters to many: Sunday with the family, the Novena de Aguinaldos (Dec 16 to 24) and the Noche de Velitas (Dec 7, candles at night).
- In Colombian Spanish: many couples in Bogotá and Antioquia say usted to each other affectionately, others tú; follow them. Colombian words, never Spain forms.
- Big days: Amor y Amistad, Día de la Madre (second Sunday of May), Día del Padre (third Sunday of June), December's novenas and New Year's Eve.
- Restaurants often suggest a 10 percent "servicio voluntario"; it's fine to accept or decline.
- Flowers are a classic gift (Colombia grows some of the world's best), along with chocolates and a handwritten card.`,
  },
  HU: {
    name: 'Hungary', money: '20 000 Ft', searchIn: 'Hungarian', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+asztalfoglal%C3%A1s']],
      buy: [['Find it on eMAG', site('emag.hu')], ['Compare on Árukereső', site('arukereso.hu')]],
      flowers: [['Florists near you', 'https://www.google.com/maps/search/?api=1&query=vir%C3%A1gbolt+{q}'], ['Flower delivery', 'https://www.google.com/search?q={q}+vir%C3%A1gk%C3%BCld%C3%A9s']],
      food: [['Find it on Wolt', site('wolt.com')], ['Find it on Foodora', site('foodora.hu')]],
      groceries: [['Find it on Kifli.hu', site('kifli.hu')]],
      ride: [['Transit directions', transit]],
    },
    apps: 'Google Maps and restaurant sites for tables, Wolt and Foodora for delivery, BKK public transport and Bolt or Főtaxi for rides (Uber is not there), eMAG and Árukereső for gifts, Kifli.hu for groceries, Messenger and Viber for messages.',
    culture: `- How love is said: warmly in private, more reserved in public. "Szeretlek" is said to family too; many appreciate chivalrous gestures (flowers, opening doors).
- Name days (névnap) are celebrated, often as much as birthdays, with flowers or a small gift; Bella can ask their names.
- The classics: the thermal baths, a walk along the Danube, a wine weekend in Tokaj or Eger, a coffeehouse or a ruin bar.
- In Hungarian: te, warm and natural.
- Big days: Valentin-nap (Feb 14), Nőnap (Mar 8, flowers for women), Anyák napja (first Sunday of May), Aug 20 fireworks, Christmas Eve (Szenteste, gifts from Jézuska) and Szilveszter.
- Tip 10 to 15 percent, but check whether a service charge is already on the bill.
- Give flowers in odd numbers; chrysanthemums are for graves.`,
  },
  RO: {
    name: 'Romania', money: '300 lei', searchIn: 'Romanian', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+rezervare']],
      buy: [['Find it on eMAG', site('emag.ro')], ['Compare prices', shopping]],
      flowers: [['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florarie+{q}'], ['Flower delivery', 'https://www.google.com/search?q={q}+livrare+flori']],
      food: [['Find it on Glovo', site('glovoapp.com')], ['Find it on Tazz', site('tazz.ro')], ['Order on Uber Eats', uberEats]],
      groceries: [['Find it on Glovo', site('glovoapp.com')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Google Maps and a phone call for tables, Glovo, Tazz, Bolt Food and Uber Eats for delivery, Uber and Bolt for rides, eMAG for gifts, Revolut and bank transfers to pay each other back, WhatsApp and Messenger for messages.',
    culture: `- How love is said: romantically and out loud. "Te iubesc", flowers and thoughtful gestures are appreciated, and couples spend a lot of time with friends and family.
- Romania has its own lovers' day: Dragobete (Feb 24). On Mărțișor (Mar 1) men give women a small charm on a red-and-white string, worn through March; Women's Day (Mar 8) follows.
- Name days (onomastica) are celebrated, especially on big saints' days (Sf. Ion, Sf. Maria, Sf. Nicolae).
- Family and Orthodox faith matter to many; Easter (date moves) is the biggest holiday.
- In Romanian: tu, warm and natural.
- Big days: Valentine's Day, Dragobete, Mărțișor, Mar 8, Ziua Mamei (first Sunday of May), Sânziene (Jun 24, midsummer flower crowns), Christmas Eve and Revelion.
- Tip about 10 percent. Give flowers in odd numbers (even numbers are for funerals).`,
  },
  KZ: {
    name: 'Kazakhstan', money: '25 000 ₸', searchIn: 'Russian or Kazakh', maps: 'google',
    links: {
      table: [['Find it on 2GIS', site('2gis.kz')], ['See it on Google Maps', gmaps]],
      buy: [['Find it on Kaspi', site('kaspi.kz')], ['Compare prices', shopping]],
      flowers: [['Find it on Kaspi', site('kaspi.kz')], ['Florists on 2GIS', site('2gis.kz')]],
      food: [['Find it on Wolt', site('wolt.com')], ['Find it on Glovo', site('glovoapp.com')]],
      groceries: [['Find it on Kaspi', site('kaspi.kz')]],
      ride: [['Directions', transit]],
    },
    apps: '2GIS and Instagram for finding places and tables, Wolt, Glovo and Yandex Eats for delivery, Yandex Go for taxis, Kaspi for shopping, paying and sending money (Kaspi installments too), WhatsApp and Telegram for messages.',
    culture: `- How love is said: respectfully and through care. Family is central: elders are honored, parents are closely involved, and matchmaking between families (kudalyk) is still part of marriage for many.
- Hospitality is huge: a full dastarkhan (table) for guests, and bringing a gift when visiting the family.
- Public norms are modest, and the law restricts LGBT topics; keep plans discreet and never suggest anything that could expose them.
- Russian is common in the cities and Kazakh is the state language; write in theirs. In Russian: ты, warm and natural.
- Big days: Mar 8 (Women's Day) is a major flower day, bigger than Feb 14 for many; Nauryz (Mar 21 to 23) is the spring new year with family and nauryz kozhe; New Year's Eve is the big winter celebration with gifts.
- Tip about 10 percent unless service is on the bill.
- Give flowers in odd numbers; tulips (native to Kazakhstan) are a lovely choice in spring.`,
  },
  EG: {
    name: 'Egypt', money: 'EGP 1,500', searchIn: 'Arabic or English', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on Google', 'https://www.google.com/search?q={q}+reservation']],
      buy: [['Buy it on Amazon.eg', 'https://www.amazon.eg/s?k={q}'], ['Buy it on noon', 'https://www.noon.com/egypt-en/search/?q={q}']],
      flowers: [['Send flowers with Floward', site('floward.com')], ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist+{q}']],
      food: [['Find it on Talabat', site('talabat.com')]],
      groceries: [['Find it on Breadfast', site('breadfast.com')], ['Find it on Talabat', site('talabat.com')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Google Maps and a phone call or WhatsApp for tables, Talabat and Breadfast for delivery and groceries, Uber, DiDi and InDrive for rides, Amazon.eg and noon for gifts, Floward for flowers, InstaPay and Vodafone Cash to pay, WhatsApp for everything.',
    culture: `- How love is said: warmly, with humour and terms of endearment (habibi, habibti), mostly in private. Romance usually centers on engagement (khutuba) and marriage, and families are closely involved; follow how they describe themselves.
- Public norms are conservative: never suggest public displays or anything that could expose them.
- In Egyptian Arabic: warm, playful and natural; or English if they write in English.
- Big days: Eid al-Fitr and Eid al-Adha, Ramadan iftar and late suhoor nights (these move each year), Mother's Day (Mar 21, huge), and Egypt's own Eid el-Hob (Nov 4). Feb 14 is kept low-key and private.
- The classics: a felucca on the Nile at sunset, a walk on the Corniche, a late dinner; weekends are Friday and Saturday.
- Tip (baksheesh) about 10 to 15 percent, even when a service charge is on the bill.
- Flowers, chocolates and perfume land well; gold (the shabka) marks an engagement.`,
  },
};

const TZ: Record<string, string> = {
  'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN', 'PRC': 'CN',
  'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'HK', 'Asia/Taipei': 'TW', 'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG',
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dubai': 'AE', 'Europe/London': 'GB', 'Europe/Belfast': 'GB',
  'Europe/Lisbon': 'PT', 'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Europe/Rome': 'IT', 'Europe/Zurich': 'CH',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Cancun': 'MX', 'America/Tijuana': 'MX', 'America/Merida': 'MX', 'America/Chihuahua': 'MX', 'America/Mazatlan': 'MX', 'America/Hermosillo': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR', 'America/Manaus': 'BR', 'America/Belem': 'BR',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA', 'America/Regina': 'CA', 'America/Montreal': 'CA',
  'Europe/Istanbul': 'TR', 'Asia/Istanbul': 'TR', 'Turkey': 'TR', 'Asia/Riyadh': 'SA', 'Europe/Amsterdam': 'NL', 'Europe/Oslo': 'NO', 'Europe/Warsaw': 'PL', 'Poland': 'PL',
  'Europe/Brussels': 'BE', 'Europe/Dublin': 'IE', 'Eire': 'IE', 'Europe/Stockholm': 'SE', 'Europe/Vienna': 'AT', 'America/Buenos_Aires': 'AR', 'America/Cordoba': 'AR',
  'Asia/Kuala_Lumpur': 'MY', 'Asia/Kuching': 'MY', 'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID', 'Asia/Pontianak': 'ID',
  'Europe/Copenhagen': 'DK', 'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL', 'Israel': 'IL', 'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ', 'NZ': 'NZ',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Europe/Helsinki': 'FI', 'America/Santiago': 'CL', 'America/Punta_Arenas': 'CL', 'Pacific/Easter': 'CL', 'Chile/Continental': 'CL',
  'Europe/Prague': 'CZ', 'Africa/Johannesburg': 'ZA', 'Europe/Athens': 'GR', 'America/Bogota': 'CO', 'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO',
  'Asia/Almaty': 'KZ', 'Asia/Qyzylorda': 'KZ', 'Asia/Aqtobe': 'KZ', 'Asia/Aqtau': 'KZ', 'Asia/Atyrau': 'KZ', 'Asia/Oral': 'KZ', 'Asia/Qostanay': 'KZ', 'Africa/Cairo': 'EG', 'Egypt': 'EG',
};

/** The country their time zone points to: Asia/Tokyo is Japan, America/Chicago the US. Null when it can't tell. */
export function countryOfTimeZone(tz: string | null | undefined): string | null {
  if (!tz) return null;
  if (TZ[tz]) return TZ[tz];
  if (tz.startsWith('Australia/')) return 'AU';
  if (tz.startsWith('America/Argentina/')) return 'AR';
  if (/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Indiana\/|Kentucky\/|North_Dakota\/)|Pacific\/Honolulu|US\/)/.test(tz)) return 'US';
  return null;
}

/** What they told Bella wins; otherwise the time zone; otherwise the US, where Belluh started. */
export function countryOf(stated: string | null | undefined, tz: string | null | undefined): string {
  const s = (stated ?? '').toUpperCase();
  if (KITS[s]) return s;
  return countryOfTimeZone(tz) ?? 'US';
}

/**
 * Where the partner lives, for gifts and flowers sent to them. Long distance only when the partner said where they
 * live, or neither of them did and their clocks are in different countries: a partner's untouched default clock must
 * not send a Tokyo couple's gifts to the US.
 */
export function partnerCountryOf(mine: { country?: string | null; timezone?: string | null } | null, theirs: { country?: string | null; timezone?: string | null } | null): string | null {
  if (!theirs) return null;
  if (theirs.country) return countryOf(theirs.country, null);
  if (mine?.country) return null;
  return countryOf(null, theirs.timezone);
}

/** "Japan", "japan", "JP", "Tokyo" → "JP": for when they say where they live. */
const NAMES: Record<string, string> = {
  'united states': 'US', usa: 'US', america: 'US', us: 'US', canada: 'CA', 'united kingdom': 'GB', uk: 'GB', britain: 'GB', england: 'GB', scotland: 'GB', wales: 'GB',
  japan: 'JP', china: 'CN', 'mainland china': 'CN', 'hong kong': 'HK', taiwan: 'TW', korea: 'KR', 'south korea': 'KR', singapore: 'SG', india: 'IN',
  uae: 'AE', 'united arab emirates': 'AE', dubai: 'AE', france: 'FR', germany: 'DE', spain: 'ES', italy: 'IT', mexico: 'MX', brazil: 'BR', portugal: 'PT', lisbon: 'PT', lisboa: 'PT', porto: 'PT', españa: 'ES', méxico: 'MX', 'ciudad de méxico': 'MX', cdmx: 'MX', guadalajara: 'MX', monterrey: 'MX', valencia: 'ES', sevilla: 'ES', australia: 'AU',
  tokyo: 'JP', osaka: 'JP', kyoto: 'JP', shanghai: 'CN', beijing: 'CN', shenzhen: 'CN', guangzhou: 'CN', seoul: 'KR', busan: 'KR', taipei: 'TW', london: 'GB',
  paris: 'FR', berlin: 'DE', munich: 'DE', madrid: 'ES', barcelona: 'ES', rome: 'IT', milan: 'IT', 'mexico city': 'MX', 'sao paulo': 'BR', 
  sydney: 'AU', switzerland: 'CH', zurich: 'CH', geneva: 'CH', basel: 'CH', bern: 'CH', lausanne: 'CH', lugano: 'CH', 'united kingdom of great britain': 'GB', brasil: 'BR', 'rio de janeiro': 'BR', 'são paulo': 'BR', 'hong kong sar': 'HK', perth: 'AU', brisbane: 'AU', ottawa: 'CA', calgary: 'CA', 'québec': 'CA', quebec: 'CA', manchester: 'GB', edinburgh: 'GB', melbourne: 'AU', toronto: 'CA', vancouver: 'CA', montreal: 'CA', mumbai: 'IN', delhi: 'IN', bangalore: 'IN', bengaluru: 'IN',
  turkey: 'TR', türkiye: 'TR', turkiye: 'TR', istanbul: 'TR', ankara: 'TR', izmir: 'TR', antalya: 'TR',
  'saudi arabia': 'SA', ksa: 'SA', saudi: 'SA', riyadh: 'SA', jeddah: 'SA', dammam: 'SA',
  netherlands: 'NL', 'the netherlands': 'NL', holland: 'NL', nederland: 'NL', amsterdam: 'NL', rotterdam: 'NL', utrecht: 'NL', 'the hague': 'NL', 'den haag': 'NL', eindhoven: 'NL',
  norway: 'NO', norge: 'NO', oslo: 'NO', bergen: 'NO', trondheim: 'NO', stavanger: 'NO',
  poland: 'PL', polska: 'PL', warsaw: 'PL', warszawa: 'PL', krakow: 'PL', kraków: 'PL', wroclaw: 'PL', wrocław: 'PL', gdansk: 'PL', gdańsk: 'PL', poznan: 'PL', poznań: 'PL',
  belgium: 'BE', belgië: 'BE', belgie: 'BE', belgique: 'BE', brussels: 'BE', bruxelles: 'BE', brussel: 'BE', antwerp: 'BE', antwerpen: 'BE', ghent: 'BE', gent: 'BE', bruges: 'BE', brugge: 'BE', liège: 'BE', liege: 'BE',
  ireland: 'IE', éire: 'IE', eire: 'IE', 'republic of ireland': 'IE', dublin: 'IE', cork: 'IE', galway: 'IE', limerick: 'IE',
  sweden: 'SE', sverige: 'SE', stockholm: 'SE', gothenburg: 'SE', göteborg: 'SE', malmö: 'SE', malmo: 'SE', uppsala: 'SE',
  austria: 'AT', österreich: 'AT', osterreich: 'AT', vienna: 'AT', wien: 'AT', salzburg: 'AT', graz: 'AT', innsbruck: 'AT', linz: 'AT',
  argentina: 'AR', 'buenos aires': 'AR', rosario: 'AR', mendoza: 'AR',
  malaysia: 'MY', 'kuala lumpur': 'MY', kl: 'MY', penang: 'MY', 'johor bahru': 'MY',
  thailand: 'TH', bangkok: 'TH', 'chiang mai': 'TH', phuket: 'TH', pattaya: 'TH',
  indonesia: 'ID', jakarta: 'ID', bali: 'ID', surabaya: 'ID', bandung: 'ID', yogyakarta: 'ID',
  denmark: 'DK', danmark: 'DK', copenhagen: 'DK', københavn: 'DK', aarhus: 'DK', odense: 'DK',
  israel: 'IL', 'tel aviv': 'IL', jerusalem: 'IL', haifa: 'IL',
  'new zealand': 'NZ', nz: 'NZ', aotearoa: 'NZ', auckland: 'NZ', wellington: 'NZ', christchurch: 'NZ', queenstown: 'NZ',
  vietnam: 'VN', 'viet nam': 'VN', 'việt nam': 'VN', hanoi: 'VN', 'hà nội': 'VN', 'ho chi minh city': 'VN', saigon: 'VN', hcmc: 'VN', 'da nang': 'VN', 'đà nẵng': 'VN',
  finland: 'FI', suomi: 'FI', helsinki: 'FI', tampere: 'FI', espoo: 'FI', turku: 'FI',
  chile: 'CL', santiago: 'CL', 'santiago de chile': 'CL', valparaíso: 'CL', valparaiso: 'CL',
  czechia: 'CZ', 'czech republic': 'CZ', česko: 'CZ', prague: 'CZ', praha: 'CZ', brno: 'CZ',
  'south africa': 'ZA', 'cape town': 'ZA', johannesburg: 'ZA', joburg: 'ZA', durban: 'ZA', pretoria: 'ZA',
  greece: 'GR', ελλάδα: 'GR', hellas: 'GR', athens: 'GR', αθήνα: 'GR', thessaloniki: 'GR',
  colombia: 'CO', bogotá: 'CO', bogota: 'CO', medellín: 'CO', medellin: 'CO', cali: 'CO', cartagena: 'CO', barranquilla: 'CO',
  hungary: 'HU', magyarország: 'HU', budapest: 'HU', debrecen: 'HU',
  romania: 'RO', românia: 'RO', bucharest: 'RO', bucurești: 'RO', bucuresti: 'RO', cluj: 'RO', 'cluj-napoca': 'RO', timișoara: 'RO', timisoara: 'RO',
  kazakhstan: 'KZ', казахстан: 'KZ', қазақстан: 'KZ', almaty: 'KZ', алматы: 'KZ', astana: 'KZ', астана: 'KZ',
  egypt: 'EG', مصر: 'EG', cairo: 'EG', القاهرة: 'EG', alexandria: 'EG', giza: 'EG',
};
export function countryCode(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/\.$/, '') : '';
  if (!s) return null;
  if (/^[a-z]{2}$/.test(s) && KITS[s.toUpperCase()]) return s.toUpperCase();
  return NAMES[s] ?? null;
}

const fill = (tpl: string, q: string) => tpl
  .replace(/\{qd\}/g, encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-')))
  .replace(/\{q\}/g, encodeURIComponent(q).replace(/%20/g, '+'));
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** The words a tool call searches for, per kind. */
function queryOf(kind: Kind, r: Record<string, unknown>): string[] {
  const what = clean(r.what, 80), where = clean(r.where, 80);
  switch (kind) {
    case 'table': return [[what || 'dinner', where].filter(Boolean).join(' ')];
    case 'buy': return [clean(r.item, 80)].filter(x => x.length >= 2);
    case 'gift': return (Array.isArray(r.ideas) ? r.ideas : []).map(i => clean(i, 80)).filter(i => i.length >= 2).slice(0, 3);
    case 'flowers': return [what || 'bouquet'];
    case 'food': return what.length >= 2 ? [[what, where].filter(Boolean).join(' ')] : [];
    case 'groceries': return (Array.isArray(r.items) ? r.items : []).map(i => clean(i, 50)).filter(i => i.length >= 2).slice(0, 5);
    case 'ride': return [clean(r.to, 120)].filter(x => x.length >= 2);
    case 'experience': return what.length >= 2 ? [[what, where].filter(Boolean).join(' ')] : [];
  }
}

/**
 * Links for this kind of action in their country, with what they asked for filled in. Null for the US (actions.ts has
 * richer US links) and for kinds a country has no kit for, so the caller keeps its own.
 */
export function regionLinks(kind: Kind, raw: unknown, country: string): ActionLink[] | null {
  if (country === 'US') return null;
  const kit = KITS[country];
  const r = (raw ?? {}) as Record<string, unknown>;
  const qs = queryOf(kind, r);
  if (!qs.length) return [];
  const tpls = kit?.links[kind === 'gift' ? 'buy' : kind] ?? fallback(kind, kit);
  if (kind === 'gift' || kind === 'groceries') {
    const t = tpls[0];
    return qs.map(q => ({ label: q.charAt(0).toUpperCase() + q.slice(1), url: fill(t[1], q) }));
  }
  const q = qs[0];
  // Flowers: the arrangement goes to the shop search, the place to the "florists near" search
  const near = clean(r.where, 80);
  return tpls.map(([label, url]) => ({ label, url: fill(url, kind === 'flowers' && /^Florists/.test(label) ? near : q).replace(/(\+|%20)+(?=&|$)/, '') }));
}

/** For a country with no kit for this kind (or no kit at all): what works almost everywhere. */
function fallback(kind: Kind, kit: Kit | undefined): Tpl[] {
  const map: Tpl = kit?.maps === 'amap' ? ['See it on Amap', 'https://uri.amap.com/search?keyword={q}'] : kit?.maps === 'naver' ? ['Find it on Naver Map', 'https://map.naver.com/p/search/{q}'] : ['See it on Google Maps', gmaps];
  switch (kind) {
    case 'table': return [map];
    case 'buy': case 'gift': return [['Find it in stores near you', shopping]];
    case 'flowers': return [['Flower delivery', 'https://www.google.com/search?udm=28&q={q}+flower+delivery'], kit?.maps === 'google' || !kit ? ['Florists near you', 'https://www.google.com/maps/search/?api=1&query=florist'] : map];
    case 'food': return [['Order on Uber Eats', uberEats], map];
    case 'groceries': return [['Find it near you', shopping]];
    case 'ride': return [['Directions', transit], ['Uber there', uber]];
    case 'experience': return [['Experiences on Airbnb', airbnbExp], ['Find it on Google', 'https://www.google.com/search?q={q}+tickets']];
  }
}

/** The OpenStreetMap country code for finding spots there. */
export const osmCountry = (country: string) => country.toLowerCase();

/** What Bella knows about where they live, for her instructions. The partner may live somewhere else (long distance). */
export function regionBrief(country: string, partnerCountry: string | null, partnerName: string | null): string {
  const k = KITS[country] ?? KITS.US;
  const p = partnerCountry && partnerCountry !== country ? KITS[partnerCountry] : null;
  return `They live in ${k.name}.${p ? ` ${partnerName ?? 'Their partner'} lives in ${p.name}: it's long distance, so anything delivered to ${partnerName ?? 'them'} (flowers, a gift) comes from stores in ${p.name}, priced in their money, at a time that suits ${partnerName ?? 'them'}'s day.` : ''}
- Money: write prices the way people there do (like ${k.money}). Budgets they give are in that currency.
- What people there use: ${k.apps}
- Shopping phrases for tools work best in ${k.searchIn}${k.searchIn.startsWith('English') ? '' : ' (write the item in that language, with the English in your reply)'}.
- What links you can get ready there is shown under your reply as usual. Where only an app does it (a ride, delivery), say which app and what to order, in one line.
Customs around love, dates and gifts in ${k.name} (common, not universal: what these two have said always wins, never stereotype them, and if they come from somewhere else or celebrate differently, follow them)
${k.culture}${p ? `
In ${p.name}, for anything for ${partnerName ?? 'their partner'}
${p.culture}` : ''}`;
}
