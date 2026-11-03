// The partner's words wait for the partner's yes. When a person brings their story from a dating app, any line that may
// be the partner's (a screenshot can't tell who wrote what) is held as a pending approval; only the partner can approve
// or decline it, and it reaches the shared story only once approved. The database enforces the same rules
// (supabase/migrations/20261102080000_story_approvals.sql: decide_story_approval). Pure, so it's unit-tested.

export type ApprovalStatus = 'pending' | 'approved' | 'declined';
export interface StoryApproval {
  id: string;
  owner_id: string;
  /** Null until known: then whoever is connected to the owner as their partner may decide */
  partner_id: string | null;
  title: string;
  lines: string[];
  day: string;
  status: ApprovalStatus;
  decided_at?: string | null;
}

/** Only the partner decides, never the person who brought the lines, and only once */
export function canDecide(a: StoryApproval, me: string, partnerOfOwner: string | null): boolean {
  if (a.status !== 'pending' || !me || me === a.owner_id) return false;
  return a.partner_id ? a.partner_id === me : !!partnerOfOwner && partnerOfOwner === me;
}

/** The new state after a decision. A decline forgets the words. Throws when this person may not decide. */
export function decide(a: StoryApproval, me: string, partnerOfOwner: string | null, approve: boolean, now = new Date()): StoryApproval {
  if (!canDecide(a, me, partnerOfOwner)) throw new Error('not yours to decide');
  return { ...a, partner_id: a.partner_id ?? me, status: approve ? 'approved' : 'declined', lines: approve ? a.lines : [], decided_at: now.toISOString() };
}

/** Whether the lines show in the shared story */
export const inSharedStory = (a: Pick<StoryApproval, 'status'>) => a.status === 'approved';

/** What each person sees: the partner, what to approve; the owner, what is still waiting */
export function approvalsFor(list: StoryApproval[], me: string, partnerOf: (owner: string) => string | null) {
  return {
    toDecide: list.filter(a => canDecide(a, me, partnerOf(a.owner_id))),
    waiting: list.filter(a => a.owner_id === me && a.status === 'pending'),
  };
}
