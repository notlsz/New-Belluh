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
    culture: `- Big days for couples: Valentine's Day (Feb 14), anniversaries, birthdays; Mother's and Father's Day if they have kids. Many couples mark the day they met and the day they got together.
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
    culture: `- Valentine's Day, anniversaries and birthdays, much like the US. In Quebec, French first and a later dinner hour.
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
    culture: `- Valentine's Day is the big one; a proper card matters (many send one even with a gift). Anniversaries and birthdays as in the US.
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
    culture: `- Valentine's Day (Feb 14): traditionally the woman gives chocolate (honmei, the real one, often handmade). White Day (Mar 14): the man gives back, usually something worth a bit more. Many younger couples do both their own way; ask, don't assume.
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
    culture: `- Days for couples: 520 (May 20, "wo ai ni") and 1314 ("forever"), Qixi (the seventh day of the seventh lunar month, Chinese Valentine's), Feb 14, Christmas Eve for younger couples. Singles' Day (Nov 11) is a shopping day, not a couples' one.
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
    culture: `- La Saint-Valentin (Feb 14) is for couples only, not friends. Dinner starts late (8 to 9), and many restaurants close Sunday, Monday and in August.
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
      food: [['Find it on Glovo', site('glovoapp.com')], ['Order on Uber Eats', uberEats]],
      ride: [['Uber there', uber], ['Transit directions', transit]],
    },
    apps: 'TheFork for tables, Glovo, Just Eat and Uber Eats for delivery, Cabify and Uber for rides, Amazon.es and El Corte Inglés for gifts.',
    culture: `- San Valentín (Feb 14); in Catalonia, Sant Jordi (Apr 23): a rose and a book, the most romantic day of the year there.
- Dinner is late (9 to 10:30). Tipping is small, rounding up or a few euros.`,
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
    culture: `- San Valentino (Feb 14) is for couples. Dinner from 8. Coperto (cover charge) is normal; tipping is optional.
- Avoid chrysanthemums (funerals) and give odd numbers of flowers.`,
  },
  MX: {
    name: 'Mexico', money: '$1,500 MXN', searchIn: 'Spanish', maps: 'google',
    links: {
      table: [['Book on OpenTable', 'https://www.opentable.com.mx/s?term={q}'], ['See it on Google Maps', gmaps]],
      buy: [['Buy it on Mercado Libre', 'https://listado.mercadolibre.com.mx/{qd}'], ['Buy it on Amazon.com.mx', 'https://www.amazon.com.mx/s?k={q}']],
      food: [['Order on Uber Eats', uberEats], ['Find it on Rappi', site('rappi.com.mx')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'OpenTable for tables, Rappi, Uber Eats and DiDi Food for delivery, Uber and DiDi for rides, Mercado Libre and Amazon.com.mx for gifts, WhatsApp for messages.',
    culture: `- Día del Amor y la Amistad (Feb 14) celebrates friends too; for couples, flowers, chocolates and a dinner. A serenade with mariachi is a classic grand gesture.
- Marigolds (cempasúchil) belong to Día de Muertos; pick other flowers for romance. Family is central; holidays are with family.
- Tip 10 to 15 percent.`,
  },
  BR: {
    name: 'Brazil', money: 'R$300', searchIn: 'Portuguese', maps: 'google',
    links: {
      table: [['See it on Google Maps', gmaps], ['Find it on TheFork', site('thefork.com.br')]],
      buy: [['Buy it on Mercado Livre', 'https://lista.mercadolivre.com.br/{qd}'], ['Buy it on Amazon.com.br', 'https://www.amazon.com.br/s?k={q}']],
      food: [['Find it on iFood', site('ifood.com.br')]],
      ride: [['Uber there', uber], ['Directions', transit]],
    },
    apps: 'Google Maps and TheFork for tables, iFood for delivery, Uber and 99 for rides, Mercado Livre and Amazon.com.br for gifts, WhatsApp for everything.',
    culture: `- Dia dos Namorados is June 12, not Feb 14 (Feb is Carnival season). It's the big one: dinner, flowers, a gift.
- A 10 percent service charge is usually on the bill. Dinner runs late.`,
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
    culture: `- Valentine's Day, anniversaries and birthdays. Seasons are flipped: Christmas is summer, so picnics and beach days, not fireplaces.
- Tipping isn't expected; 10 percent for great service. Many restaurants are BYO wine.`,
  },
};

const TZ: Record<string, string> = {
  'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN', 'PRC': 'CN',
  'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'HK', 'Asia/Taipei': 'TW', 'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG',
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dubai': 'AE', 'Europe/London': 'GB', 'Europe/Belfast': 'GB',
  'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Europe/Rome': 'IT',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Cancun': 'MX', 'America/Tijuana': 'MX', 'America/Merida': 'MX', 'America/Chihuahua': 'MX', 'America/Mazatlan': 'MX', 'America/Hermosillo': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR', 'America/Manaus': 'BR', 'America/Belem': 'BR',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA', 'America/Regina': 'CA', 'America/Montreal': 'CA',
};

/** The country their time zone points to: Asia/Tokyo is Japan, America/Chicago the US. Null when it can't tell. */
export function countryOfTimeZone(tz: string | null | undefined): string | null {
  if (!tz) return null;
  if (TZ[tz]) return TZ[tz];
  if (tz.startsWith('Australia/')) return 'AU';
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
  uae: 'AE', 'united arab emirates': 'AE', dubai: 'AE', france: 'FR', germany: 'DE', spain: 'ES', italy: 'IT', mexico: 'MX', brazil: 'BR', australia: 'AU',
  tokyo: 'JP', osaka: 'JP', kyoto: 'JP', shanghai: 'CN', beijing: 'CN', shenzhen: 'CN', guangzhou: 'CN', seoul: 'KR', busan: 'KR', taipei: 'TW', london: 'GB',
  paris: 'FR', berlin: 'DE', munich: 'DE', madrid: 'ES', barcelona: 'ES', rome: 'IT', milan: 'IT', 'mexico city': 'MX', 'sao paulo': 'BR', 'são paulo': 'BR',
  sydney: 'AU', melbourne: 'AU', toronto: 'CA', vancouver: 'CA', montreal: 'CA', mumbai: 'IN', delhi: 'IN', bangalore: 'IN', bengaluru: 'IN',
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
