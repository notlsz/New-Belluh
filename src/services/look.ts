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

/** Books by title or author from Open Library, with a cover */
export async function findBooks(q: string): Promise<{ title: string; author: string; cover: string | null }[]> {
  if (q.trim().length < 2) return [];
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q.trim())}&limit=6&fields=title,author_name,cover_i`);
    const j = await r.json();
    return (j.docs ?? []).map((d: any) => ({ title: d.title, author: (d.author_name ?? [])[0] ?? '', cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null }));
  } catch { return []; }
}

/** Movies and shows by title, with a poster: Wikipedia for films and series, TVmaze for shows */
export async function findMovies(q: string): Promise<{ title: string; year: string; kind: string; poster: string | null }[]> {
  const t = q.trim(); if (t.length < 2) return [];
  const wiki = fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(t)}&gsrlimit=10&prop=pageimages%7Cdescription&piprop=thumbnail&pithumbsize=342&format=json&origin=*`)
    .then(r => r.json()).then(j => Object.values<any>(j.query?.pages ?? {}).sort((a, b) => a.index - b.index)
      .filter(p => /film|movie|television|tv series|miniseries|anime|documentary|sitcom/i.test(p.description ?? ''))
      .map(p => ({ title: String(p.title).replace(/ \((\d{4} )?(film|TV series|miniseries)\)$/i, ''), year: (String(p.description).match(/\b(19|20)\d{2}\b/) ?? [''])[0], kind: /film|movie|documentary/i.test(p.description) ? 'film' : 'series', poster: p.thumbnail?.source ?? null })))
    .catch(() => []);
  const tv = fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(t)}`).then(r => r.json())
    .then((a: any[]) => a.slice(0, 4).map(x => ({ title: x.show.name, year: (x.show.premiered ?? '').slice(0, 4), kind: 'series', poster: x.show.image?.medium?.replace('http:', 'https:') ?? null })))
    .catch(() => []);
  const [a, b] = await Promise.all([wiki, tv]);
  const seen = new Set<string>(), out: { title: string; year: string; kind: string; poster: string | null }[] = [];
  for (const x of [...a, ...b]) { const k = x.title.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(x); } }
  return out.slice(0, 8);
}
