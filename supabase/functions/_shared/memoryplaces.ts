// Pure parts of memory-places (Belluh Memory): which OpenStreetMap features are venues, the Overpass query for a batch
// of 0.01 degree cells, and reading its answer. Shared with the unit tests.

export const MAX_VENUES = 150;
export const CELL_RE = /^-?\d{1,2}\.\d{2},-?\d{1,3}\.\d{2}$/;

export const bbox = (cell: string) => { const [a, b] = cell.split(',').map(Number); return [a, b, +(a + 0.01).toFixed(2), +(b + 0.01).toFixed(2)]; };

// Which OSM tags make a venue, and what kind we call it (the same words the device uses)
const AMENITY = ['restaurant', 'cafe', 'bar', 'pub', 'biergarten', 'fast_food', 'ice_cream', 'nightclub', 'music_venue', 'theatre', 'cinema', 'arts_centre', 'food_court', 'karaoke_box'];
const TOURISM = ['museum', 'gallery', 'attraction', 'viewpoint', 'zoo', 'aquarium', 'theme_park', 'hotel', 'camp_site'];
const LEISURE = ['park', 'garden', 'stadium', 'sports_centre', 'fitness_centre', 'golf_course', 'marina', 'nature_reserve', 'bowling_alley', 'ice_rink', 'swimming_pool', 'beach_resort'];
const SHOP = ['bakery', 'books', 'mall', 'wine', 'garden_centre'];

export interface Venue { name: string; kind: string; cuisine: string | null; lat: number; lng: number }
export interface CellPlaces { cell: string; neighborhood: string | null; city: string | null; metro: string | null; country: string | null; countryCode: string | null; venues: Venue[] }

export function kindOf(t: Record<string, string>): string | null {
  if (t.amenity && AMENITY.includes(t.amenity)) return t.amenity;
  if (t.amenity === 'marketplace') return 'marketplace';
  if (t.tourism && TOURISM.includes(t.tourism)) return t.tourism;
  if (t.leisure && LEISURE.includes(t.leisure)) return t.leisure === 'beach_resort' ? 'beach' : t.leisure;
  if (t.natural === 'beach') return 'beach';
  if (t.shop && SHOP.includes(t.shop)) return t.shop === 'wine' ? 'wine_bar' : t.shop;
  if (t.craft === 'brewery') return 'brewery';
  if (t.craft === 'winery') return 'winery';
  if (t.aeroway === 'aerodrome') return 'aerodrome';
  return null;
}


/** One Overpass query for a batch of cells: venues inside each cell, and the administrative areas around its centre */
export function overpassQuery(cells: string[]): string {
  const parts = cells.map((c, i) => {
    const [s, w, n, e] = bbox(c);
    const bb = `(${s},${w},${n},${e})`;
    const lat = ((s + n) / 2).toFixed(4), lng = ((w + e) / 2).toFixed(4);
    return `make cell name="${c}";out;
(nwr["amenity"~"^(${[...AMENITY, 'marketplace'].join('|')})$"]["name"]${bb};nwr["tourism"~"^(${TOURISM.join('|')})$"]["name"]${bb};nwr["leisure"~"^(${LEISURE.join('|')})$"]["name"]${bb};nwr["natural"="beach"]${bb};nwr["shop"~"^(${SHOP.join('|')})$"]["name"]${bb};nwr["craft"~"^(brewery|winery)$"]["name"]${bb};)->.v${i};
.v${i} out center tags ${MAX_VENUES};
is_in(${lat},${lng})->.a${i};
area.a${i}["boundary"="administrative"]["admin_level"~"^(2|4|5|6|7|8|9|10)$"]->.b${i};
.b${i} out tags;
area.a${i}["place"~"^(suburb|quarter|neighbourhood|city|town|village)$"]->.p${i};
.p${i} out tags;`;
  });
  return `[out:json][timeout:50][maxsize:67108864];\n${parts.join('\n')}`;
}

const nameOf = (t: Record<string, string>) => t['name:en'] || t.name || null;

/** Turns the Overpass answer (elements in order, a "cell" marker before each cell's results) into places per cell */
export function parseOverpass(elements: any[]): CellPlaces[] {
  const out: CellPlaces[] = [];
  let cur: (CellPlaces & { admin: { level: number; name: string; place?: string; cc?: string }[] }) | null = null;
  const finish = () => {
    if (!cur) return;
    const a = cur.admin.sort((x, y) => x.level - y.level);
    const at = (lv: number[]) => a.filter(x => lv.includes(x.level)).map(x => x.name);
    const country = a.find(x => x.level === 2);
    // City: the municipality (level 8; Japan's wards and some capitals use 7). Neighborhood: below it, or a place area.
    const city = at([8])[0] ?? at([7])[0] ?? a.find(x => x.place === 'city' || x.place === 'town')?.name ?? null;
    const hood = at([10])[0] ?? at([9])[0] ?? a.find(x => x.place && ['suburb', 'quarter', 'neighbourhood'].includes(x.place))?.name ?? null;
    // Metro: the wider area people name a city by (Tokyo for Shibuya, Greater London for Camden): 7, then 6, then 5, then 4
    const metro = [7, 6, 5, 4].map(l => at([l])[0]).find(n => n && n !== city) ?? null;
    out.push({ cell: cur.cell, neighborhood: hood && hood !== city ? hood : null, city, metro, country: country?.name ?? null, countryCode: country?.cc ?? null, venues: cur.venues.slice(0, MAX_VENUES) });
    cur = null;
  };
  for (const el of elements) {
    if (el.type === 'cell') { finish(); cur = { cell: el.tags?.name ?? el.name ?? '', neighborhood: null, city: null, metro: null, country: null, countryCode: null, venues: [], admin: [] }; continue; }
    if (!cur) continue;
    const t = el.tags ?? {};
    if (el.type === 'area') {
      const name = nameOf(t); if (!name) continue;
      if (t.boundary === 'administrative' && t.admin_level) cur.admin.push({ level: +t.admin_level, name, cc: t['ISO3166-1'] || t['ISO3166-1:alpha2'] });
      else if (t.place) cur.admin.push({ level: t.place === 'city' || t.place === 'town' || t.place === 'village' ? 8.5 : 9.5, name, place: t.place });
      continue;
    }
    const kind = kindOf(t); const name = nameOf(t) ?? (kind === 'beach' ? 'Beach' : null);
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
    if (!kind || !name || typeof lat !== 'number' || typeof lng !== 'number') continue;
    cur.venues.push({ name: name.slice(0, 80), kind, cuisine: t.cuisine ? t.cuisine.toLowerCase().slice(0, 60) : null, lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 });
  }
  finish();
  return out;
}

