// What Belluh Memory can recognise in a photo, on the device: a curated vocabulary for couples' lives (zero-shot labels
// from the image model's text tower), the prompts that mark sensitive photos, and the activities interests are built
// from, each with how often a typical adult photographs it (the baseline interests are scored against). Pure data.

import type { Sensitivity } from './types.ts';

export type LabelGroup =
  | 'food' | 'drink' | 'activity' | 'sport' | 'music' | 'travel' | 'nature' | 'city' | 'home' | 'pet'
  | 'celebration' | 'gift' | 'wedding' | 'baby' | 'people' | 'text' | 'other';

export interface LabelDef {
  name: string;
  group: LabelGroup;
  /** What the image model reads; defaults to the name */
  prompt?: string;
  /** The photo probably shows words worth reading (menus, signs, tickets) */
  text?: boolean;
  /** Cuisine, for food labels that name one */
  cuisine?: string;
}

const L = (group: LabelGroup, names: (string | [string, Partial<LabelDef>?])[]): LabelDef[] =>
  names.map(n => typeof n === 'string' ? { name: n, group } : { name: n[0], group, ...n[1] });

export const LABELS: LabelDef[] = [
  ...L('food', [
    ['ramen', { cuisine: 'japanese', prompt: 'a bowl of ramen noodle soup' }], ['sushi', { cuisine: 'japanese' }], ['sashimi', { cuisine: 'japanese' }],
    ['pizza', { cuisine: 'italian' }], ['pasta', { cuisine: 'italian' }], ['burger', { cuisine: 'american', prompt: 'a hamburger' }],
    ['tacos', { cuisine: 'mexican' }], ['burrito', { cuisine: 'mexican' }], ['dumplings', { cuisine: 'chinese' }], ['dim sum', { cuisine: 'chinese' }],
    ['hot pot', { cuisine: 'chinese' }], ['korean barbecue', { cuisine: 'korean' }], ['bibimbap', { cuisine: 'korean' }], ['pho', { cuisine: 'vietnamese', prompt: 'a bowl of pho' }],
    ['pad thai', { cuisine: 'thai' }], ['curry', { cuisine: 'indian' }], ['steak', { cuisine: 'steakhouse' }], ['barbecue', { cuisine: 'barbecue' }],
    ['fried chicken'], ['salad'], ['sandwich'], ['soup'], ['seafood', { cuisine: 'seafood' }], ['oysters', { cuisine: 'seafood' }], ['paella', { cuisine: 'spanish' }],
    ['tapas', { cuisine: 'spanish' }], ['croissant', { cuisine: 'french' }], ['pancakes'], ['brunch', { prompt: 'a brunch plate with eggs' }],
    ['breakfast'], ['bread'], ['cheese board'], ['cake'], ['dessert'], ['ice cream'], ['chocolate'], ['donuts'], ['macarons'], ['fruit'],
    ['home cooked meal', { prompt: 'a home cooked meal on a kitchen table' }], ['fine dining', { prompt: 'an elegant fine dining plate' }],
  ]),
  ...L('drink', [
    ['coffee', { prompt: 'a cup of coffee' }], ['latte', { prompt: 'a latte with latte art' }], ['tea', { prompt: 'a cup of tea' }], ['matcha'], ['bubble tea'],
    ['wine', { prompt: 'glasses of wine' }], ['cocktail'], ['beer', { prompt: 'a glass of beer' }], ['champagne toast', { prompt: 'a champagne toast' }], ['sake'], ['smoothie'],
  ]),
  ...L('activity', [
    ['hiking', { prompt: 'people hiking on a trail' }], ['camping', { prompt: 'a tent at a campsite' }], ['picnic'], ['road trip', { prompt: 'a road trip view from a car' }],
    ['boat ride', { prompt: 'a boat ride on the water' }], ['kayaking'], ['sailing'], ['scuba diving'], ['fishing'], ['horse riding'],
    ['board games', { prompt: 'friends playing board games' }], ['video games', { prompt: 'playing video games on a tv' }], ['bowling'], ['karaoke'],
    ['dancing'], ['painting', { prompt: 'painting on a canvas' }], ['pottery', { prompt: 'making pottery' }], ['cooking at home', { prompt: 'cooking in a home kitchen' }],
    ['baking', { prompt: 'baking cookies or bread' }], ['gardening'], ['reading a book'], ['movie night', { prompt: 'watching a movie at home' }], ['cinema', { prompt: 'a movie theater' }],
    ['shopping', { prompt: 'shopping in a store' }], ['amusement park'], ['zoo', { prompt: 'animals at a zoo' }], ['aquarium', { prompt: 'fish at an aquarium' }],
  ]),
  ...L('sport', [
    ['running', { prompt: 'a person running a race' }], ['cycling'], ['yoga'], ['gym workout', { prompt: 'a gym workout' }], ['swimming'], ['surfing'],
    ['skiing'], ['snowboarding'], ['ice skating'], ['rock climbing'], ['tennis'], ['golf'], ['basketball'], ['soccer'],
    ['baseball game', { prompt: 'a baseball game in a stadium' }], ['football game', { prompt: 'an american football game in a stadium' }], ['stadium', { prompt: 'a crowd in a sports stadium' }],
  ]),
  ...L('music', [
    ['concert', { prompt: 'a live concert on stage' }], ['music festival', { prompt: 'a crowd at a music festival' }], ['nightclub', { prompt: 'a dj in a nightclub' }],
    ['playing guitar'], ['playing piano'], ['theater show', { prompt: 'a theater stage show' }],
  ]),
  ...L('travel', [
    ['airplane window', { prompt: 'a view from an airplane window' }], ['airport'], ['hotel room'], ['train journey', { prompt: 'a train journey' }],
    ['famous landmark', { prompt: 'a famous landmark' }], ['temple', { prompt: 'an asian temple' }], ['castle'], ['old town street', { prompt: 'a narrow old town street in europe' }],
    ['cruise ship'], ['map', { text: true }],
  ]),
  ...L('nature', [
    ['beach', { prompt: 'a sandy beach and the ocean' }], ['ocean'], ['mountains'], ['lake'], ['forest'], ['waterfall'], ['desert'], ['snow'],
    ['sunset'], ['sunrise'], ['garden'], ['park', { prompt: 'a city park with trees and grass' }], ['flower field'], ['night sky', { prompt: 'a starry night sky' }],
    ['autumn leaves'], ['cherry blossoms'],
  ]),
  ...L('city', [
    ['city skyline'], ['street at night', { prompt: 'a city street at night' }], ['cafe', { prompt: 'the inside of a cozy cafe' }], ['restaurant', { prompt: 'the inside of a restaurant' }],
    ['bar', { prompt: 'the inside of a bar' }], ['market', { prompt: 'a busy street market' }], ['museum', { prompt: 'the inside of a museum' }], ['art gallery'],
    ['bookstore'], ['shop sign', { prompt: 'a shop sign with writing', text: true }], ['street sign', { text: true }],
  ]),
  ...L('home', [['living room'], ['bedroom'], ['kitchen'], ['cozy couch', { prompt: 'a cozy couch with blankets' }], ['houseplants']]),
  ...L('pet', [['dog'], ['cat'], ['puppy'], ['kitten'], ['bird'], ['horse'], ['rabbit']]),
  ...L('celebration', [
    ['birthday cake', { prompt: 'a birthday cake with candles' }], ['birthday party'], ['christmas tree'], ['halloween costume'], ['fireworks'],
    ['new year party', { prompt: "a new year's eve party" }], ['candlelit dinner', { prompt: 'a romantic candlelit dinner' }], ['party', { prompt: 'friends at a party' }],
  ]),
  ...L('gift', [['gift box', { prompt: 'a wrapped gift box' }], ['bouquet of flowers'], ['roses'], ['jewelry'], ['engagement ring'], ['love letter', { text: true }]]),
  ...L('wedding', [['wedding ceremony'], ['wedding dress'], ['wedding cake'], ['bride and groom']]),
  ...L('baby', [['baby'], ['toddler']]),
  ...L('people', [['selfie'], ['couple', { prompt: 'a happy couple' }], ['group of friends'], ['family photo']]),
  ...L('text', [
    ['menu', { prompt: 'a restaurant menu', text: true }], ['receipt', { text: true }], ['ticket', { prompt: 'a concert or train ticket', text: true }],
    ['document', { prompt: 'a printed document', text: true }], ['handwritten note', { text: true }], ['book page', { text: true }], ['poster', { text: true }],
    ['text message screenshot', { prompt: 'a screenshot of a text message conversation', text: true }],
  ]),
  ...L('other', [['car'], ['bicycle'], ['clothes', { prompt: 'an outfit of clothes' }], ['mirror selfie'], ['art', { prompt: 'a painting or artwork' }], ['architecture']]),
];

/** Prompts that mark a photo sensitive. Each kind has a few phrasings; the best one counts. */
export const SENSITIVE: { kind: Sensitivity; prompts: string[] }[] = [
  { kind: 'id', prompts: ['an identity card with a photo of a face', 'a passport photo page', "a driver's license card", 'an ID card'] },
  { kind: 'payment', prompts: ['a credit card', 'a bank debit card with numbers'] },
  { kind: 'credential', prompts: ['a screenshot of a password', 'a screenshot of a verification code', 'a QR code for logging in'] },
  { kind: 'health', prompts: ['a medical prescription', 'a medical test report', 'an x-ray scan', 'a hospital document'] },
  { kind: 'nudity', prompts: ['a nude person', 'naked body'] },
];

/** Text read from an image that marks it sensitive whatever it shows (checked on the device). */
export function sensitiveText(text: string | null | undefined): Sensitivity | null {
  if (!text) return null;
  const t = text.toLowerCase();
  const digits = (text.match(/\b(?:\d[ -]?){13,19}\b/g) ?? []).map(s => s.replace(/\D/g, ''));
  if (digits.some(luhn) || /\b(cvv|cvc|card number|expiry date|valid thru)\b/.test(t)) return 'payment';
  if (/\b(passport|driver'?s licen[cs]e|identity card|date of birth|national id|personalausweis|carte d'identit|documento de identidad)\b/.test(t)) return 'id';
  if (/\b(password|passcode|verification code|one[- ]time (code|password)|2fa|otp|security code|recovery code|seed phrase)\b/.test(t)) return 'credential';
  if (/\b(prescription|diagnosis|patient|blood test|lab results|medical record|dosage|rx\b)/.test(t)) return 'health';
  return null;
}

function luhn(n: string): boolean {
  if (n.length < 13 || n.length > 19 || /^(\d)\1+$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = +n[n.length - 1 - i];
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

// Interests: activities on a small taxonomy, after Rollup's. Nothing about health, religion, politics, sexuality or
// children. `typical` is how many days a year a typical adult does it AND takes a photo of it: our own estimates from
// public camera-roll and time-use surveys (BLS American Time Use Survey shares, Google Photos / Instagram category
// shares), rounded; they are a yardstick, not a measurement. Interests are scored against it, scaled to how many days a
// year this person takes photos at all (TYPICAL_PHOTO_DAYS a year for the typical adult).
export const TYPICAL_PHOTO_DAYS = 120;

export interface ActivityDef {
  id: string; name: string;
  kind: 'activity' | 'food' | 'music' | 'travel' | 'place' | 'other';
  labels?: string[];
  cuisines?: string[];
  /** Venue kinds (from places) that count */
  venues?: string[];
  typical: number;
}

export const ACTIVITIES: ActivityDef[] = [
  { id: 'food.coffee', name: 'Coffee', kind: 'food', labels: ['coffee', 'latte'], venues: ['cafe'], typical: 15 },
  { id: 'food.tea', name: 'Tea and matcha', kind: 'food', labels: ['tea', 'matcha', 'bubble tea'], typical: 3 },
  { id: 'food.ramen', name: 'Ramen', kind: 'food', labels: ['ramen'], cuisines: ['ramen'], typical: 1.5 },
  { id: 'food.sushi', name: 'Sushi', kind: 'food', labels: ['sushi', 'sashimi'], cuisines: ['sushi'], typical: 2 },
  { id: 'food.pizza', name: 'Pizza', kind: 'food', labels: ['pizza'], cuisines: ['pizza'], typical: 3 },
  { id: 'food.italian', name: 'Pasta and Italian', kind: 'food', labels: ['pasta'], cuisines: ['italian'], typical: 3 },
  { id: 'food.burgers', name: 'Burgers', kind: 'food', labels: ['burger'], cuisines: ['burger'], typical: 2 },
  { id: 'food.mexican', name: 'Tacos and Mexican', kind: 'food', labels: ['tacos', 'burrito'], cuisines: ['mexican'], typical: 2 },
  { id: 'food.chinese', name: 'Dumplings and Chinese', kind: 'food', labels: ['dumplings', 'dim sum', 'hot pot'], cuisines: ['chinese'], typical: 2 },
  { id: 'food.korean', name: 'Korean food', kind: 'food', labels: ['korean barbecue', 'bibimbap'], cuisines: ['korean'], typical: 1 },
  { id: 'food.southeast_asian', name: 'Thai and Vietnamese', kind: 'food', labels: ['pho', 'pad thai'], cuisines: ['thai', 'vietnamese'], typical: 1.5 },
  { id: 'food.indian', name: 'Curry and Indian', kind: 'food', labels: ['curry'], cuisines: ['indian'], typical: 1.5 },
  { id: 'food.seafood', name: 'Seafood', kind: 'food', labels: ['seafood', 'oysters'], cuisines: ['seafood'], typical: 1.5 },
  { id: 'food.steak', name: 'Steak and barbecue', kind: 'food', labels: ['steak', 'barbecue'], cuisines: ['steak_house', 'barbecue'], typical: 1.5 },
  { id: 'food.brunch', name: 'Brunch', kind: 'food', labels: ['brunch', 'pancakes', 'breakfast', 'croissant'], cuisines: ['breakfast', 'brunch'], typical: 5 },
  { id: 'food.desserts', name: 'Desserts', kind: 'food', labels: ['cake', 'dessert', 'ice cream', 'chocolate', 'donuts', 'macarons'], venues: ['ice_cream', 'bakery'], typical: 7 },
  { id: 'food.fine_dining', name: 'Fine dining', kind: 'food', labels: ['fine dining', 'candlelit dinner'], typical: 1 },
  { id: 'food.home_cooking', name: 'Cooking at home', kind: 'food', labels: ['home cooked meal', 'cooking at home', 'baking'], typical: 6 },
  { id: 'drinks.wine', name: 'Wine', kind: 'food', labels: ['wine'], venues: ['winery', 'wine_bar'], typical: 3 },
  { id: 'drinks.cocktails', name: 'Cocktails', kind: 'food', labels: ['cocktail'], venues: ['bar'], typical: 3 },
  { id: 'drinks.beer', name: 'Beer', kind: 'food', labels: ['beer'], venues: ['pub', 'biergarten', 'brewery'], typical: 3 },
  { id: 'sports.hiking', name: 'Hiking', kind: 'activity', labels: ['hiking', 'mountains', 'waterfall'], typical: 2 },
  { id: 'sports.running', name: 'Running', kind: 'activity', labels: ['running'], typical: 1 },
  { id: 'sports.cycling', name: 'Cycling', kind: 'activity', labels: ['cycling'], typical: 1 },
  { id: 'sports.yoga', name: 'Yoga', kind: 'activity', labels: ['yoga'], typical: 0.5 },
  { id: 'sports.gym', name: 'Working out', kind: 'activity', labels: ['gym workout'], venues: ['fitness_centre'], typical: 1.5 },
  { id: 'sports.swimming', name: 'Swimming', kind: 'activity', labels: ['swimming'], typical: 1 },
  { id: 'sports.surfing', name: 'Surfing', kind: 'activity', labels: ['surfing'], typical: 0.2 },
  { id: 'sports.snow', name: 'Skiing and snowboarding', kind: 'activity', labels: ['skiing', 'snowboarding'], typical: 0.4 },
  { id: 'sports.skating', name: 'Ice skating', kind: 'activity', labels: ['ice skating'], typical: 0.2 },
  { id: 'sports.climbing', name: 'Climbing', kind: 'activity', labels: ['rock climbing'], typical: 0.2 },
  { id: 'sports.tennis', name: 'Tennis', kind: 'activity', labels: ['tennis'], typical: 0.3 },
  { id: 'sports.golf', name: 'Golf', kind: 'activity', labels: ['golf'], venues: ['golf_course'], typical: 0.3 },
  { id: 'sports.games', name: 'Going to games', kind: 'activity', labels: ['stadium', 'baseball game', 'football game', 'basketball', 'soccer'], venues: ['stadium'], typical: 1 },
  { id: 'outdoors.beach', name: 'Beach days', kind: 'place', labels: ['beach', 'ocean'], venues: ['beach'], typical: 4 },
  { id: 'outdoors.parks', name: 'Parks and gardens', kind: 'place', labels: ['park', 'garden', 'flower field', 'cherry blossoms'], venues: ['park', 'garden'], typical: 5 },
  { id: 'outdoors.camping', name: 'Camping', kind: 'activity', labels: ['camping'], venues: ['camp_site'], typical: 0.5 },
  { id: 'outdoors.water', name: 'On the water', kind: 'activity', labels: ['boat ride', 'kayaking', 'sailing', 'scuba diving', 'fishing'], venues: ['marina'], typical: 0.8 },
  { id: 'outdoors.sunsets', name: 'Sunsets and skies', kind: 'other', labels: ['sunset', 'sunrise', 'night sky'], venues: ['viewpoint'], typical: 6 },
  { id: 'music.live', name: 'Live music', kind: 'music', labels: ['concert', 'music festival'], venues: ['music_venue'], typical: 0.8 },
  { id: 'music.nightlife', name: 'Nightlife and dancing', kind: 'music', labels: ['nightclub', 'dancing'], venues: ['nightclub'], typical: 0.6 },
  { id: 'music.karaoke', name: 'Karaoke', kind: 'music', labels: ['karaoke'], venues: ['karaoke_box'], typical: 0.3 },
  { id: 'music.playing', name: 'Playing music', kind: 'music', labels: ['playing guitar', 'playing piano'], typical: 0.5 },
  { id: 'arts.theater', name: 'Theater and shows', kind: 'activity', labels: ['theater show'], venues: ['theatre'], typical: 0.4 },
  { id: 'arts.museums', name: 'Museums and galleries', kind: 'place', labels: ['museum', 'art gallery'], venues: ['museum', 'gallery', 'arts_centre'], typical: 1.5 },
  { id: 'arts.making', name: 'Making art', kind: 'activity', labels: ['painting', 'pottery'], typical: 0.4 },
  { id: 'leisure.movies', name: 'Movies', kind: 'activity', labels: ['cinema', 'movie night'], venues: ['cinema'], typical: 1 },
  { id: 'leisure.games', name: 'Games', kind: 'activity', labels: ['board games', 'video games', 'bowling'], venues: ['bowling_alley'], typical: 1 },
  { id: 'leisure.reading', name: 'Books', kind: 'activity', labels: ['reading a book', 'bookstore', 'book page'], venues: ['books'], typical: 1 },
  { id: 'leisure.parks', name: 'Zoos, aquariums and theme parks', kind: 'place', labels: ['amusement park', 'zoo', 'aquarium'], venues: ['zoo', 'aquarium', 'theme_park'], typical: 0.6 },
  { id: 'leisure.markets', name: 'Markets and shopping', kind: 'place', labels: ['market', 'shopping'], venues: ['marketplace', 'mall'], typical: 3 },
  { id: 'home.gardening', name: 'Gardening', kind: 'activity', labels: ['gardening', 'houseplants'], venues: ['garden_centre'], typical: 1 },
  { id: 'pets.dogs', name: 'Dogs', kind: 'other', labels: ['dog', 'puppy'], typical: 10 },
  { id: 'pets.cats', name: 'Cats', kind: 'other', labels: ['cat', 'kitten'], typical: 8 },
  { id: 'travel.flights', name: 'Flying', kind: 'travel', labels: ['airplane window', 'airport'], venues: ['aerodrome'], typical: 2 },
  { id: 'travel.sightseeing', name: 'Sightseeing', kind: 'travel', labels: ['famous landmark', 'temple', 'castle', 'old town street', 'architecture'], venues: ['attraction'], typical: 3 },
  { id: 'travel.road_trips', name: 'Road trips', kind: 'travel', labels: ['road trip'], typical: 1 },
  { id: 'travel.trains', name: 'Train journeys', kind: 'travel', labels: ['train journey'], typical: 1 },
];

export const LABEL_BY_NAME = new Map(LABELS.map(l => [l.name, l]));
export const promptOf = (l: LabelDef) => `a photo of ${l.prompt ?? l.name}.`;
