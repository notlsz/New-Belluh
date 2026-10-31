// Guides a couple makes and shares (see supabase/migrations/20261031020000_guides.sql), plus place search for adding to
// them: Photon (photon.komoot.io, OpenStreetMap data, free, no key).
import { supabase } from '../lib/supabaseClient';

export type GuideKind = 'travel' | 'food' | 'bars' | 'countries' | 'other';
export type Visibility = 'us' | 'link' | 'public';
export interface GuidePlace { id: string; name: string; kind: 'place' | 'country'; country: string | null; lat: number; lng: number; emoji: string | null; note: string | null }
export interface Guide { id: string; slug: string; user_id?: string; title: string; emoji: string; kind: GuideKind; description: string | null; visibility: Visibility; author_name: string | null; updated_at: string; places: GuidePlace[] }
export interface Found { name: string; detail: string; kind: 'place' | 'country'; country: string | null; lat: number; lng: number; emoji: string }

export const KIND_EMOJI: Record<GuideKind, string> = { travel: '🧳', food: '🍜', bars: '🍷', countries: '🌍', other: '💌' };
const SEL = 'id, slug, user_id, title, emoji, kind, description, visibility, author_name, updated_at, places:guide_places(id, name, kind, country, lat, lng, emoji, note, sort, created_at)';
const sortPlaces = (g: any): Guide => ({ ...g, places: [...(g.places ?? [])].sort((a: any, b: any) => a.sort - b.sort || String(a.created_at).localeCompare(String(b.created_at))) });

export const guideUrl = (slug: string) => `${window.location.origin}/g/${slug}`;

export const guides = {
  /** Ours: the ones you or your partner made */
  async ours(): Promise<Guide[]> {
    const { data } = await supabase.rpc('our_guides').select(SEL).order('updated_at', { ascending: false });
    return ((data as any[]) ?? []).map(sortPlaces);
  },
  /** From the community: public guides by other couples */
  async community(me: string): Promise<Guide[]> {
    const { data } = await supabase.from('guides').select(SEL).eq('visibility', 'public').neq('user_id', me).order('updated_at', { ascending: false }).limit(30);
    return (data ?? []).map(sortPlaces);
  },
  async bySlug(slug: string): Promise<Guide | null> {
    const { data } = await supabase.rpc('guide_by_slug', { s: slug });
    return data ? sortPlaces(data) : null;
  },
  async create(g: { title: string; emoji: string; kind: GuideKind; author_name: string | null }): Promise<Guide | null> {
    const { data } = await supabase.from('guides').insert(g).select(SEL).single();
    return data ? sortPlaces(data) : null;
  },
  async update(id: string, patch: Partial<Pick<Guide, 'title' | 'emoji' | 'kind' | 'description' | 'visibility'>>) {
    const { error } = await supabase.from('guides').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  },
  async remove(id: string) { const { error } = await supabase.from('guides').delete().eq('id', id); return !error; },
  async addPlace(guideId: string, p: Omit<GuidePlace, 'id' | 'note'> & { note?: string | null }, sort: number): Promise<GuidePlace | null> {
    const { data } = await supabase.from('guide_places').insert({ guide_id: guideId, ...p, sort }).select('id, name, kind, country, lat, lng, emoji, note').single();
    return data as GuidePlace | null;
  },
  async removePlace(id: string) { const { error } = await supabase.from('guide_places').delete().eq('id', id); return !error; },
};

// What kind of place it is, as a 3D emoji sticker
const PLACE_EMOJI: [RegExp, string][] = [
  [/cafe|coffee/, '☕'], [/restaurant|food|fast_food/, '🍜'], [/bar|pub|biergarten|nightclub/, '🍷'], [/bakery|pastry/, '🥐'],
  [/ice_cream/, '🍦'], [/park|garden|nature_reserve/, '🌳'], [/museum|gallery|arts/, '🖼️'], [/cinema|theatre/, '🎬'],
  [/beach/, '🏖️'], [/hotel|hostel|guest_house/, '🏨'], [/castle|monument|memorial|ruins/, '🏰'], [/attraction|viewpoint|theme_park/, '🎡'],
  [/zoo|aquarium/, '🦒'], [/stadium|sports/, '🏟️'], [/airport|aerodrome/, '✈️'], [/station|railway/, '🚆'],
  [/shop|mall|marketplace|clothes/, '🛍️'], [/place_of_worship|temple|shrine|church/, '⛩️'], [/mountain|peak|volcano/, '⛰️'],
];
export const emojiForPlace = (osm: string) => PLACE_EMOJI.find(([re]) => re.test(osm))?.[1] ?? '📍';

/** Places and countries matching what they typed, near where the map is looking */
export async function searchPlaces(q: string, near?: { lat: number; lng: number }, lang = 'en'): Promise<Found[]> {
  if (q.trim().length < 2) return [];
  const p = new URLSearchParams({ q: q.trim(), limit: '7' });
  if (['en', 'de', 'fr'].includes(lang)) p.set('lang', lang);
  if (near) { p.set('lat', near.lat.toFixed(3)); p.set('lon', near.lng.toFixed(3)); }
  try {
    const r = await fetch(`https://photon.komoot.io/api/?${p}`);
    const j = await r.json();
    return (j.features ?? []).filter((f: any) => f?.geometry?.coordinates && f.properties?.name).map((f: any) => {
      const pr = f.properties, isCountry = pr.type === 'country' || pr.osm_value === 'country';
      const detail = [pr.street && `${pr.street}${pr.housenumber ? ' ' + pr.housenumber : ''}`, pr.city, isCountry ? null : pr.country].filter(Boolean).join(', ');
      return { name: pr.name, detail, kind: isCountry ? 'country' : 'place', country: isCountry ? pr.name : pr.country ?? null, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], emoji: isCountry ? '🏳️' : emojiForPlace(`${pr.osm_key}:${pr.osm_value}`) } as Found;
    });
  } catch { return []; }
}
