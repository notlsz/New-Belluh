// A person's profile look (see supabase/migrations/20261031030000_profile_looks.sql)
import { supabase } from '../lib/supabaseClient';

export type Effect = 'none' | 'glow' | 'hearts' | 'sparkles' | 'flowers' | 'fire' | 'stars' | 'snow' | 'bubbles' | 'butterflies'
  | 'catears' | 'bunny' | 'halo' | 'horns' | 'crown' | 'headphones' | 'rainbow' | 'neon' | 'glitch' | 'orbit';
/** Effects over the whole profile, the way Discord's profile effects play over a card */
export type ProfileFx = 'none' | 'confetti' | 'petals' | 'hearts' | 'rain' | 'fireflies' | 'leaves' | 'snow' | 'bubbles' | 'stars' | 'butterflies';
export type Pattern = 'none' | 'dots' | 'hearts' | 'stars' | 'checks' | 'stripes';
export type NameFont = 'serif' | 'rounded' | 'bold' | 'script';
/** A name written by hand: strokes in a 600 by 160 box */
export interface NameInk { strokes: [number, number][][]; color: string; w: number }
export type BlockType = 'music' | 'movie' | 'book' | 'photo' | 'voice' | 'text' | 'link';
export interface Sticker { id: string; e?: string; photo?: string; x: number; y: number; r: number; s: number }
/** Anything placed freely on the profile, amo-style: x is % of the width, y is px from the top of the profile */
export type LayerKind = 'emoji' | 'photo' | 'text' | 'draw' | 'face' | 'shape' | 'video';
export type Shape = 'rect' | 'ellipse' | 'line' | 'arrow' | 'heart' | 'star';
/** A recorded face: a sprite sheet of transparent frames, played forward then back */
export interface Face { ref: string; n: number; cols: number }
export interface Layer { id: string; k: LayerKind; x: number; y: number; r: number; s: number; z: number; e?: string; photo?: string; text?: string; color?: string; font?: NameFont; bg?: boolean; pts?: [number, number][]; w?: number; face?: Face; shape?: Shape; sw?: number; sh?: number; op?: number }
export interface Block { id: string; type: BlockType; w: number; h: number; color: string; data: Record<string, string> }
export interface Look {
  bannerColor: string; bannerPattern: Pattern; bannerPhoto?: string | null;
  bg: string; bgPhoto?: string | null; accent: string; nameColor: string; nameFont: NameFont;
  effect: Effect; bio: string; stickers: Sticker[]; blocks: Block[];
  layers: Layer[]; extra: number; blank: boolean;
  pfx: ProfileFx; nameInk?: NameInk | null;
  face?: Face | null; facePfp?: boolean; bare?: boolean;
}
export const DEFAULT_LOOK: Look = { bannerColor: '#cde9f2', bannerPattern: 'dots', bannerPhoto: null, bg: '#fdfbfb', bgPhoto: null, accent: '#5e9db3', nameColor: '#0f172a', nameFont: 'serif', effect: 'none', bio: '', stickers: [], blocks: [], layers: [], extra: 0, blank: false, pfx: 'none', nameInk: null };

export async function loadLook(userId: string): Promise<Look> {
  const { data } = await supabase.from('profile_looks').select('look').eq('user_id', userId).maybeSingle();
  const l: Look = { ...DEFAULT_LOOK, ...((data?.look as Partial<Look>) ?? {}) };
  // Stickers from before the free canvas become layers where they were
  if (l.stickers.length) { l.layers = [...l.stickers.map((s, i) => ({ id: s.id, k: (s.photo ? 'photo' : 'emoji') as LayerKind, x: s.x, y: Math.round(s.y / 100 * 420), r: s.r, s: s.s, z: i + 1, e: s.e, photo: s.photo })), ...l.layers]; l.stickers = []; }
  return l;
}
export async function saveLook(userId: string, look: Look): Promise<boolean> {
  const { error } = await supabase.from('profile_looks').upsert({ user_id: userId, look, updated_at: new Date().toISOString() });
  return !error;
}

/** A Spotify or Apple Music link as an embeddable player, if it is one */
export function musicEmbed(url: string): { src: string; h: number } | null {
  try {
    const u = new URL(url.trim());
    if (/(^|\.)spotify\.com$/.test(u.hostname)) {
      const m = u.pathname.match(/\/(track|album|playlist|episode|artist)\/([A-Za-z0-9]+)/);
      return m ? { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, h: m[1] === 'track' || m[1] === 'episode' ? 152 : 352 } : null;
    }
    if (u.hostname === 'music.apple.com') return { src: `https://embed.music.apple.com${u.pathname}${u.search}`, h: u.searchParams.has('i') ? 175 : 450 };
  } catch { /* not a link */ }
  return null;
}



// Search that finds the real thing: several sources at once, ranked by how closely the title (and artist or author)
// matches what was typed, the same item merged across sources, and the best cover kept.
export interface Found { title: string; by: string; year: string; cover: string | null; preview?: string | null; url?: string | null; kind?: string }
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff ]+/g, ' ').replace(/\s+/g, ' ').trim();
function score(q: string, x: Found): number {
  const nq = norm(q), t = norm(x.title), b = norm(x.by), both = `${t} ${b}`;
  if (!nq) return 0;
  let s = 0;
  if (t === nq) s += 100; else if (t.startsWith(nq)) s += 70; else if (nq.startsWith(t) && t.length > 2) s += 60; else if (t.includes(nq)) s += 45;
  const words = nq.split(' ').filter(w => w.length > 1);
  s += words.filter(w => both.includes(w)).length / Math.max(1, words.length) * 40;
  if (x.cover) s += 12;
  // Title and artist (or author) together spell out what was typed: the strongest sign it's the one
  if (b && (`${t} ${b}` === nq || `${b} ${t}` === nq || (nq.includes(t) && b.split(' ').every(w => nq.includes(w))))) s += 90;
  else if (b && b.split(' ').filter(w => w.length > 1).every(w => nq.includes(w))) s += 30;
  // Remixes, bootlegs, covers and study guides only when asked for
  const junk = /karaoke|kidz bop|tribute|instrumental|cover|made famous|8-bit|lullaby|bootleg|remix|sped up|slowed|nightcore|reverb|piano version|cello version|acoustic|live|edit\b|version|mashup|summary|study guide|workbook|sparknotes|cliffsnotes/i;
  const asked = junk.test(q);
  if (!asked && junk.test(`${x.title} ${x.by} ${x.kind ?? ''}`)) s -= 60;
  // Each source already ranks by popularity: keep a little of that order
  s += Math.max(0, 15 - ((x as any)._i ?? 15));
  return s;
}
function rank(q: string, all: Found[], n = 8): Found[] {
  const seen = new Map<string, Found>();
  for (const x of all) {
    const k = `${norm(x.title)}|${norm(x.by).split(' ').slice(0, 2).join(' ')}`;
    const was = seen.get(k);
    // Keep the name in the script the search was typed in (Haruki Murakami for "murakami", 村上春樹 for "村上")
    const latin = /^[\x00-\x7f\u00c0-\u024f\s]*$/;
    if (!was) seen.set(k, x); else seen.set(k, { ...was, by: latin.test(q) && !latin.test(was.by) && latin.test(x.by) ? x.by : was.by, cover: was.cover ?? x.cover, year: was.year || x.year, preview: was.preview ?? x.preview, url: was.url ?? x.url });
  }
  // The artist or author who shows up most for this search is usually the original
  const lead = (x: Found) => norm(x.by).split(' ').slice(0, 2).join(' ');
  const freq = new Map<string, number>(); for (const x of all) if (x.by) freq.set(lead(x), (freq.get(lead(x)) ?? 0) + 1);
  const pop = (x: Found) => Math.min(30, ((freq.get(lead(x)) ?? 1) - 1) * 12);
  return [...seen.values()].sort((a, b) => score(q, b) + pop(b) - score(q, a) - pop(a)).slice(0, n);
}
const big = (u?: string | null, size = '600x600') => (u ? u.replace(/\/\d+x\d+bb\./, `/${size}bb.`) : null);
const getJson = (u: string) => fetch(u).then(r => (r.ok ? r.json() : null)).catch(() => null);
const country = () => { try { const l = navigator.language.split('-')[1]; return l && l.length === 2 ? l : 'US'; } catch { return 'US'; } };

/** Songs, with album art and a 30-second preview, the way Instagram's music sticker finds them (Apple's catalog) */
export async function findSongs(q: string): Promise<Found[]> {
  const t = q.trim(); if (t.length < 2) return [];
  const [local, us] = await Promise.all([
    getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(t)}&media=music&entity=song&limit=15&country=${country()}`),
    country() === 'US' ? null : getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(t)}&media=music&entity=song&limit=10&country=US`),
  ]);
  const rows = [...(local?.results ?? []), ...(us?.results ?? [])];
  return rank(t, rows.map((r: any, i: number) => ({ _i: i, title: r.trackName, by: r.artistName, year: (r.releaseDate ?? '').slice(0, 4), cover: big(r.artworkUrl100), preview: r.previewUrl ?? null, url: r.trackViewUrl ?? null, kind: r.collectionName })));
}

/** Movies and shows: Apple's catalog, Wikipedia and TVmaze, with the best poster from any of them */
export async function findMovies(q: string): Promise<Found[]> {
  const t = q.trim(); if (t.length < 2) return [];
  const lang = (() => { try { return navigator.language.split('-')[0] || 'en'; } catch { return 'en'; } })();
  const wiki = (host: string) => getJson(`https://${host}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(t)}&gsrlimit=12&prop=pageimages%7Cdescription&piprop=thumbnail&pithumbsize=500&format=json&origin=*`)
    .then(j => Object.values<any>(j?.query?.pages ?? {}).filter(p => /film|movie|television|tv series|miniseries|anime|documentary|sitcom|series|映画|ドラマ|電影|电影|电视剧|série|serie|Fernsehserie/i.test(p.description ?? ''))
      .map(p => ({ title: String(p.title).replace(/ \((\d{4} )?(film|TV series|miniseries|American TV series|British TV series)\)$/i, ''), by: '', year: (String(p.description ?? '').match(/\b(19|20)\d{2}\b/) ?? [''])[0], cover: p.thumbnail?.source ?? null, kind: /film|movie|documentary|映画|电影|電影/i.test(p.description) ? 'film' : 'series' } as Found)));
  const [apple, appleTv, en, local, tv] = await Promise.all([
    getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(t)}&media=movie&entity=movie&limit=10&country=${country()}`),
    getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(t)}&media=tvShow&entity=tvSeason&limit=6&country=${country()}`),
    wiki('en'), lang !== 'en' ? wiki(lang) : Promise.resolve([] as Found[]),
    getJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(t)}`),
  ]);
  const all: Found[] = [
    ...(apple?.results ?? []).map((r: any, i: number) => ({ _i: i, title: r.trackName, by: r.artistName ?? '', year: (r.releaseDate ?? '').slice(0, 4), cover: big(r.artworkUrl100, '600x900'), url: r.trackViewUrl ?? null, kind: 'film' })),
    ...(appleTv?.results ?? []).map((r: any) => ({ title: String(r.artistName ?? r.collectionName).replace(/, Season \d+$/i, ''), by: '', year: (r.releaseDate ?? '').slice(0, 4), cover: big(r.artworkUrl100, '600x900'), kind: 'series' })),
    ...(en ?? []), ...(local ?? []),
    ...((tv ?? []) as any[]).slice(0, 6).map(x => ({ title: x.show.name, by: '', year: (x.show.premiered ?? '').slice(0, 4), cover: x.show.image?.original?.replace('http:', 'https:') ?? x.show.image?.medium?.replace('http:', 'https:') ?? null, kind: 'series' })),
  ];
  // Directors from Apple aren't the "by" people expect; match on title and year
  return rank(t, all.map(x => ({ ...x, by: x.year })));
}

/** Books: Open Library and Google Books together, real editions with covers */
export async function findBooks(q: string): Promise<Found[]> {
  const t = q.trim(); if (t.length < 2) return [];
  const [ol, gb] = await Promise.all([
    getJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(t)}&limit=12&fields=title,author_name,cover_i,first_publish_year,key,edition_count`),
    getJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(t)}&maxResults=12&printType=books`),
  ]);
  const all: Found[] = [
    ...(ol?.docs ?? []).sort((a: any, b: any) => (b.edition_count ?? 0) - (a.edition_count ?? 0)).map((d: any, i: number) => ({ _i: i, title: d.title, by: (d.author_name ?? [])[0] ?? '', year: String(d.first_publish_year ?? ''), cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null, url: d.key ? `https://openlibrary.org${d.key}` : null })),
    ...(gb?.items ?? []).map((i: any) => ({ title: i.volumeInfo?.title, by: (i.volumeInfo?.authors ?? [])[0] ?? '', year: (i.volumeInfo?.publishedDate ?? '').slice(0, 4), cover: (i.volumeInfo?.imageLinks?.thumbnail ?? i.volumeInfo?.imageLinks?.smallThumbnail ?? '').replace('http:', 'https:').replace('&edge=curl', '').replace('zoom=1', 'zoom=2') || null, url: i.volumeInfo?.infoLink ?? null })).filter((x: Found) => x.title),
  ];
  return rank(t, all);
}
