// Our Afterglow in the database: only the approved text and the sharing choices (memory_passports, owner only),
// the partner's shared sections (partner_passport(), which notes the read in their Activity), and Activity itself.
// The photos behind each line stay in this browser (localStorage), keyed by line text, never sent.
import { supabase } from '../lib/supabaseClient';
import { cleanPassport, type StoredPassport, type SharedPassport } from '../../supabase/functions/_shared/passport';

export interface PassportActivity { id: number; actor: 'partner' | 'bella'; channel: string | null; sections: string[]; created_at: string }
const EVIDENCE_KEY = 'belluh_passport_photos';

async function me(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export const passportStore = {
  async mine(): Promise<StoredPassport | null> {
    const id = await me(); if (!id) return null;
    const { data } = await supabase.from('memory_passports').select('user_id, title, sections, share_partner, share_bella, updated_at').eq('user_id', id).maybeSingle();
    return data ? { ...cleanPassport(data), updated_at: data.updated_at } : null;
  },
  async save(p: StoredPassport): Promise<boolean> {
    const id = await me(); if (!id) return false;
    const c = cleanPassport(p);
    const { error } = await supabase.from('memory_passports').upsert({ user_id: id, ...c, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    return !error;
  },
  async remove(): Promise<boolean> {
    const id = await me(); if (!id) return false;
    const { error } = await supabase.from('memory_passports').delete().eq('user_id', id);
    try { localStorage.removeItem(EVIDENCE_KEY); } catch { /* storage off */ }
    return !error;
  },
  async partner(): Promise<SharedPassport | null> {
    const { data, error } = await supabase.rpc('partner_passport');
    return error || !data ? null : data as SharedPassport;
  },
  async activity(): Promise<PassportActivity[]> {
    const id = await me(); if (!id) return [];
    const { data } = await supabase.from('passport_activity').select('id, actor, channel, sections, created_at').eq('owner_id', id).order('created_at', { ascending: false }).limit(50);
    return (data ?? []) as PassportActivity[];
  },
  photos(): Record<string, string[]> {
    try { return JSON.parse(localStorage.getItem(EVIDENCE_KEY) ?? '{}') ?? {}; } catch { return {}; }
  },
  setPhotos(m: Record<string, string[]>): void {
    try { localStorage.setItem(EVIDENCE_KEY, JSON.stringify(m)); } catch { /* storage full or off: photos just won't show */ }
  },
};
