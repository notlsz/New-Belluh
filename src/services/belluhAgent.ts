import { supabase } from '../lib/supabaseClient';

export type AgentRole = 'user' | 'belluh' | 'partner_note' | 'note_draft';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  body: string;
  meta: Record<string, any>;
  created_at: string;
}

const tz = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/New_York'; }
};

/** Calls the belluh-agent edge function. Returns null when it isn't deployed or fails, so callers can fall back. */
async function call<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke('belluh-agent', { body: { ...body, timezone: tz() } });
    if (error || !data || (data as any).error) return null;
    return data as T;
  } catch {
    return null;
  }
}

export const belluhAgent = {
  history: () => call<{ messages: AgentMessage[]; partner_name: string | null }>({ action: 'history' }),
  chat: (message: string, mode: 'chat' | 'mediate' = 'chat') => call<{ messages: AgentMessage[] }>({ action: 'chat', message, mode }),
  react: (entryId: string) => call<{ message: AgentMessage | null }>({ action: 'react', entry_id: entryId }),
  sendNote: (draftId: string, text?: string) => call<{ ok: boolean }>({ action: 'send_note', draft_id: draftId, text }),
  discardNote: (draftId: string) => call<{ ok: boolean }>({ action: 'discard_note', draft_id: draftId }),

  async memories(): Promise<{ id: string; fact: string }[]> {
    const { data, error } = await supabase.from('agent_memories').select('id, fact').order('created_at', { ascending: false });
    return error ? [] : (data ?? []);
  },
  async forget(id: string): Promise<boolean> {
    const { error } = await supabase.from('agent_memories').delete().eq('id', id);
    return !error;
  },
  async unreadNotes(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { count, error } = await supabase.from('partner_notes').select('id', { count: 'exact', head: true })
      .eq('to_user', user.id).is('read_at', null);
    return error ? 0 : (count ?? 0);
  },
  async markNotesRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('partner_notes').update({ read_at: new Date().toISOString() }).eq('to_user', user.id).is('read_at', null);
  },
};
