// A person's profile look (see supabase/migrations/20261031030000_profile_looks.sql)
import { supabase } from '../lib/supabaseClient';

export type Effect = 'none' | 'glow' | 'hearts' | 'sparkles' | 'flowers' | 'fire' | 'stars' | 'snow' | 'bubbles' | 'butterflies';
export type Pattern = 'none' | 'dots' | 'hearts' | 'stars' | 'checks' | 'stripes';
export type NameFont = 'serif' | 'rounded' | 'bold' | 'script';
export type BlockType = 'music' | 'book' | 'photo' | 'voice' | 'text' | 'link';
export interface Sticker { id: string; e?: string; photo?: string; x: number; y: number; r: number; s: number }
/** Anything placed freely on the profile, amo-style: x is % of the width, y is px from the top of the profile */
export type LayerKind = 'emoji' | 'photo' | 'text' | 'draw';
export interface Layer { id: string; k: LayerKind; x: number; y: number; r: number; s: number; z: number; e?: string; photo?: string; text?: string; color?: string; font?: NameFont; bg?: boolean; pts?: [number, number][]; w?: number }
export interface Block { id: string; type: BlockType; w: number; h: number; color: string; data: Record<string, string> }
export interface Look {
  bannerColor: string; bannerPattern: Pattern; bannerPhoto?: string | null;
  bg: string; bgPhoto?: string | null; accent: string; nameColor: string; nameFont: NameFont;
  effect: Effect; bio: string; stickers: Sticker[]; blocks: Block[];
  layers: Layer[]; extra: number; blank: boolean;
}
export const DEFAULT_LOOK: Look = { bannerColor: '#cde9f2', bannerPattern: 'dots', bannerPhoto: null, bg: '#fdfbfb', bgPhoto: null, accent: '#5e9db3', nameColor: '#0f172a', nameFont: 'serif', effect: 'none', bio: '', stickers: [], blocks: [], layers: [], extra: 0, blank: false };

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
