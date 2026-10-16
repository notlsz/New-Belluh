// Things Belluh does, not just suggests: reminders it sets and sends itself, a table ready to book, a trip ready to
// book, flowers ready to order, gift ideas ready to buy. Pure logic (unit-tested in Node). Anything that reaches the partner or costs money still needs the person's tap:
// Belluh prepares the booking or the basket, the person finishes it.

import { zonedToUtc } from './plans.ts';

export interface ActionLink { label: string; url: string }

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** "remind me to call his mom Sunday at 5": a short reminder at a future local time (within a year). */
export function validateReminder(raw: unknown, timeZone: string, now = new Date()): { body: string; due_at: string } | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const body = clean(r.text, 300);
  if (body.length < 2) return null;
  const due = typeof r.at === 'string' ? zonedToUtc(r.at, timeZone) : null;
  if (!due) return null;
  const t = new Date(due).getTime();
  if (t < now.getTime() + 60_000 || t > now.getTime() + 366 * 86_400_000) return null;
  return { body, due_at: due };
}

/**
 * A table, ready to book: OpenTable with the date, time and party size filled in, and Google Maps for the place itself.
 * Belluh can't book on the person's behalf (no restaurant API takes bookings from a third party), so it gets them one tap away.
 */
export function tableLinks(raw: unknown, timeZone: string): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const what = clean(r.what, 80) || 'dinner';
  const where = clean(r.where, 80);
  const people = Math.min(20, Math.max(1, Math.round(Number(r.people ?? 2)) || 2));
  const start = typeof r.start === 'string' && zonedToUtc(r.start, timeZone) ? /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(r.start.trim()) : null;
  const term = [what, where].filter(Boolean).join(' ');
  const ot = new URL('https://www.opentable.com/s');
  if (start) ot.searchParams.set('dateTime', `${start[1]}T${start[2]}:00`);
  ot.searchParams.set('covers', String(people));
  ot.searchParams.set('term', term);
  const maps = new URL('https://www.google.com/maps/search/');
  maps.searchParams.set('api', '1');
  maps.searchParams.set('query', where ? `${what} near ${where}` : what);
  return [
    { label: 'Book a table on OpenTable', url: ot.toString() },
    { label: 'See it on Google Maps', url: maps.toString() },
  ];
}

/** Gift ideas drawn from what the partner has said they love or wished for, each one tap from a store. */
export function giftLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const ideas = (Array.isArray(r.ideas) ? r.ideas : []).map(i => clean(i, 80)).filter(i => i.length >= 2).slice(0, 3);
  return ideas.map(idea => {
    const u = new URL('https://www.amazon.com/s');
    u.searchParams.set('k', idea);
    return { label: idea.charAt(0).toUpperCase() + idea.slice(1), url: u.toString() };
  });
}

const dateOnly = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null);
const travelers = (v: unknown) => Math.min(10, Math.max(1, Math.round(Number(v ?? 2)) || 2));

/**
 * A trip (a honeymoon, an anniversary weekend, a getaway): flights, a place to stay and an Airbnb, each search with
 * the dates and travelers filled in. Belluh can't pay for anything, so the person books from here in a tap or two.
 */
export function tripLinks(raw: unknown, today = new Date()): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const to = clean(r.to, 80);
  if (to.length < 2) return [];
  const from = clean(r.from, 80);
  const todayIso = today.toISOString().slice(0, 10);
  let depart = dateOnly(r.depart), back = dateOnly(r.return);
  if (depart && depart < todayIso) { depart = null; back = null; }
  if (back && (!depart || back <= depart)) back = null;
  const people = travelers(r.people);
  const flights = new URL('https://www.google.com/travel/flights');
  // Google Flights reads the travelers from the sentence too ("for 2 adults"); without it, it searches for one
  flights.searchParams.set('q', `Flights to ${to}${from ? ` from ${from}` : ''}${depart ? ` on ${depart}` : ''}${back ? ` through ${back}` : ''} for ${people} adult${people === 1 ? '' : 's'}`);
  const stay = new URL('https://www.booking.com/searchresults.html');
  stay.searchParams.set('ss', to);
  if (depart && back) { stay.searchParams.set('checkin', depart); stay.searchParams.set('checkout', back); }
  stay.searchParams.set('group_adults', String(people));
  stay.searchParams.set('no_rooms', '1');
  const home = new URL(`https://www.airbnb.com/s/${encodeURIComponent(to)}/homes`);
  if (depart && back) { home.searchParams.set('checkin', depart); home.searchParams.set('checkout', back); }
  home.searchParams.set('adults', String(people));
  return [
    { label: `Flights to ${to}`, url: flights.toString() },
    { label: `Hotels in ${to}`, url: stay.toString() },
    { label: `Airbnbs in ${to}`, url: home.toString() },
  ];
}

/** Flowers: florists near where they're going, and the arrangement to order for delivery. */
export function flowerLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const what = clean(r.what, 60) || 'flowers';
  const where = clean(r.where, 80);
  // UrbanStems delivers nationwide (same day in many cities) and its search lands on real arrangements
  const shop = new URL('https://urbanstems.com/search');
  shop.searchParams.set('q', what);
  const maps = new URL('https://www.google.com/maps/search/');
  maps.searchParams.set('api', '1');
  maps.searchParams.set('query', where ? `florist near ${where}` : 'florist near me');
  return [
    { label: `Order ${what} for delivery`, url: shop.toString() },
    { label: where ? `Florists near ${where}` : 'Florists near you', url: maps.toString() },
  ];
}

/**
 * Dinner, delivered: the dish or restaurant ready to order on DoorDash and Uber Eats, delivered to where they are.
 * Belluh can't check out for them (neither app takes orders from a third party), so the order is one tap from placed.
 */
export function foodLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const what = clean(r.what, 60);
  if (what.length < 2) return [];
  const where = clean(r.where, 80);
  const dd = new URL(`https://www.doordash.com/search/store/${encodeURIComponent(what)}/`);
  const ue = new URL('https://www.ubereats.com/search');
  ue.searchParams.set('q', what);
  if (where) ue.searchParams.set('pl', where);
  return [
    { label: `Order ${what} on DoorDash`, url: dd.toString() },
    { label: `Order ${what} on Uber Eats`, url: ue.toString() },
  ];
}

/**
 * Something to buy (a gift, a replacement, something for the house): the item ready to buy at Amazon and Target, and
 * compared across stores. Budget narrows the search. The person checks out.
 */
export function buyLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const item = clean(r.item, 80);
  if (item.length < 2) return [];
  const max = Math.round(Number(r.max_price));
  const amazon = new URL('https://www.amazon.com/s');
  amazon.searchParams.set('k', item);
  if (max > 0) amazon.searchParams.set('rh', `p_36:-${max * 100}`);
  const target = new URL('https://www.target.com/s');
  target.searchParams.set('searchTerm', item);
  const shop = new URL('https://www.google.com/search');
  shop.searchParams.set('udm', '28'); // Google Shopping (tbm=shop now drops to plain search)
  shop.searchParams.set('q', max > 0 ? `${item} under $${max}` : item);
  return [
    { label: `Buy ${item} on Amazon`, url: amazon.toString() },
    { label: `Buy ${item} at Target`, url: target.toString() },
    { label: 'Compare prices', url: shop.toString() },
  ];
}

/** Groceries: each item ready to add to an Instacart cart from stores near them. */
export function groceryLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const items = (Array.isArray(r.items) ? r.items : []).map(i => clean(i, 50)).filter(i => i.length >= 2).slice(0, 5);
  return items.map(i => {
    const u = new URL('https://www.instacart.com/store/s');
    u.searchParams.set('k', i);
    return { label: `Add ${i}`, url: u.toString() };
  });
}

/** A ride there: Uber with the destination filled in, and Lyft. Pickup is where they are when they open it. */
export function rideLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const to = clean(r.to, 120);
  if (to.length < 2) return [];
  const uber = new URL('https://m.uber.com/ul/');
  uber.searchParams.set('action', 'setPickup');
  uber.searchParams.set('pickup', 'my_location');
  uber.searchParams.set('dropoff[formatted_address]', to);
  const lyft = new URL('https://ride.lyft.com/');
  lyft.searchParams.set('destination[address]', to);
  return [
    { label: `Uber to ${to}`, url: uber.toString() },
    { label: `Lyft to ${to}`, url: lyft.toString() },
  ];
}

const STATES: Record<string, string> = { alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca', colorado: 'co', connecticut: 'ct', delaware: 'de', florida: 'fl', georgia: 'ga', hawaii: 'hi', idaho: 'id', illinois: 'il', indiana: 'in', iowa: 'ia', kansas: 'ks', kentucky: 'ky', louisiana: 'la', maine: 'me', maryland: 'md', massachusetts: 'ma', michigan: 'mi', minnesota: 'mn', mississippi: 'ms', missouri: 'mo', montana: 'mt', nebraska: 'ne', nevada: 'nv', 'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny', 'north carolina': 'nc', 'north dakota': 'nd', ohio: 'oh', oklahoma: 'ok', oregon: 'or', pennsylvania: 'pa', 'rhode island': 'ri', 'south carolina': 'sc', 'south dakota': 'sd', tennessee: 'tn', texas: 'tx', utah: 'ut', vermont: 'vt', virginia: 'va', washington: 'wa', 'west virginia': 'wv', wisconsin: 'wi', wyoming: 'wy', 'district of columbia': 'dc' };
// Big cities people name without a state
const CITY_STATE: Record<string, string> = { 'san francisco': 'ca', 'los angeles': 'ca', 'san jose': 'ca', 'san diego': 'ca', oakland: 'ca', 'palo alto': 'ca', 'new york': 'ny', 'new york city': 'ny', nyc: 'ny', brooklyn: 'ny', manhattan: 'ny', chicago: 'il', boston: 'ma', seattle: 'wa', austin: 'tx', houston: 'tx', dallas: 'tx', miami: 'fl', atlanta: 'ga', denver: 'co', portland: 'or', philadelphia: 'pa', washington: 'dc', 'las vegas': 'nv', nashville: 'tn', phoenix: 'az' };
const slugify = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Eventbrite's place in its URLs is "state--city" ("ca--san-francisco"); without a state the page is a dead end. */
export function eventbritePlace(where: string): string {
  const parts = where.split(',').map(x => x.trim()).filter(Boolean);
  if (!parts.length) return 'united-states';
  const city = parts[0].toLowerCase();
  const tail = (parts[1] ?? '').toLowerCase();
  const st = /^[a-z]{2}$/.test(tail) ? tail : STATES[tail] ?? CITY_STATE[city];
  if (!st) return 'united-states';
  return `${st}--${slugify(city === 'nyc' || city === 'manhattan' ? 'new york' : city)}`;
}

/** Something to do together (a concert, a class, a tasting): tickets and experiences near them, on the day if given. */
export function experienceLinks(raw: unknown): ActionLink[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const what = clean(r.what, 60);
  if (what.length < 2) return [];
  const where = clean(r.where, 60);
  const day = dateOnly(r.on);
  const slug = eventbritePlace(where);
  const eb = new URL(`https://www.eventbrite.com/d/${slug}/${encodeURIComponent(what.toLowerCase().replace(/\s+/g, '-'))}/`);
  if (day) { eb.searchParams.set('start_date', day); eb.searchParams.set('end_date', day); }
  const ab = new URL(`https://www.airbnb.com/s/${encodeURIComponent(where || 'nearby')}/experiences`);
  ab.searchParams.set('query', what);
  if (day) { ab.searchParams.set('checkin', day); ab.searchParams.set('checkout', day); }
  return [
    { label: `Tickets for ${what}`, url: eb.toString() },
    { label: `${what.charAt(0).toUpperCase() + what.slice(1)} experiences`, url: ab.toString() },
  ];
}
