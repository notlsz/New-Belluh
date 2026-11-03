// The partner's words from a "how we met" import wait here for the partner's yes (story_approvals). Reads both sides'
// pending rows (RLS shows each person only theirs and their partner's), and decides through decide_story_approval,
// which writes the journal entry when approved and forgets the words when declined.
import { supabase } from '../lib/supabaseClient';
import type { StoryApproval } from '../lib/storyApproval';
import type { ChapterPending } from '../lib/datingImport';

export async function listApprovals(): Promise<StoryApproval[]> {
  const { data, error } = await supabase.from('story_approvals').select('id, owner_id, partner_id, title, lines, day, status, decided_at').eq('status', 'pending').order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []) as StoryApproval[];
}

export async function addApproval(p: ChapterPending, partnerId: string | null): Promise<boolean> {
  const { error } = await supabase.from('story_approvals').insert({ ...p, partner_id: partnerId });
  return !error;
}

/** Resolves to the new journal entry's id when approved, null when declined, and throws when it can't be decided */
export async function decideApproval(id: string, approve: boolean): Promise<string | null> {
  const { data, error } = await supabase.rpc('decide_story_approval', { p_id: id, p_approve: approve });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}

export async function withdrawApproval(id: string): Promise<boolean> {
  const { error } = await supabase.from('story_approvals').delete().eq('id', id);
  return !error;
}
