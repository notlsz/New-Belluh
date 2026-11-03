// Clarity's calls (supabase/functions/belluh-clarity). Only the signed-in person's own page; nothing here is cached,
// logged to analytics or kept in the browser.
import { supabase } from '../lib/supabaseClient';
import type { PatternKey, StepKey, QuestionKey, Pattern, Counselling } from '../../supabase/functions/_shared/clarity';

export type { PatternKey, StepKey, QuestionKey, Pattern, Counselling };
export interface ClarityAnswer { id: string; key: QuestionKey; text: string; created_at: string }
export interface ClarityTalk { id: string; role: 'user' | 'bella'; body: string; created_at: string }
export interface ClarityView {
  on: true; windowDays: number; written: number; patterns: Pattern[]; balance: { warm: number; hard: number };
  safety: { abuse: boolean; crisis: boolean; dvLine: string | null; crisisLine: string | null };
  steps: StepKey[]; questions: QuestionKey[]; counselling: Counselling | null; answers: ClarityAnswer[]; talk: ClarityTalk[];
}

async function call<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke('belluh-clarity', { body });
    if (error || !data || (data as any).error) return null;
    return data as T;
  } catch {
    return null;
  }
}

export const clarityApi = {
  status: () => call<{ on: boolean }>({ action: 'status' }),
  on: () => call<{ on: true }>({ action: 'on' }),
  off: () => call<{ on: false; deleted: true }>({ action: 'off' }),
  view: () => call<ClarityView>({ action: 'view' }),
  open: (kind: 'entry' | 'chat', id: string) => call<{ text: string; at: string }>({ action: 'open', kind, id }),
  answer: (key: QuestionKey, text: string) => call<{ answer: ClarityAnswer }>({ action: 'answer', key, text }),
  forget: (id: string) => call<{ ok: true }>({ action: 'forget', id }),
  talk: (text: string) => call<{ messages: ClarityTalk[] }>({ action: 'talk', text }),
};
export type ClarityApi = typeof clarityApi;
