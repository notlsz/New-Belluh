// The Clarity page's requests, one signed-in person at a time. The store is passed in (Supabase in the edge function,
// memory in tests), so what it reads and deletes is tested. Every read is the person's own: the store queries by their
// id, and ownItems() drops anything that isn't theirs anyway. Off by default; "off" deletes everything Clarity holds.

import { summarize, clarityInstruction, ownItems, type ClarityItem, type QuestionKey } from './clarity.ts';
import { dvSignal, withDvLine, dvReply, crisisSignal, withCrisisLine } from './safety.ts';

export interface Reflection { id: string; key: string; text: string; created_at: string }
export interface TalkMessage { id: string; role: 'user' | 'bella'; body: string; created_at: string }

export interface ClarityStore {
  isOn(uid: string): Promise<boolean>;
  turnOn(uid: string): Promise<void>;
  /** Deletes the setting, the answers and the talk with Bella */
  wipe(uid: string): Promise<void>;
  /** The person's own journal entries (private and shared) and their own messages to Bella since a date */
  writing(uid: string, sinceIso: string): Promise<ClarityItem[]>;
  /** One of the person's own entries or messages in full, or null */
  item(uid: string, kind: 'entry' | 'chat', id: string): Promise<ClarityItem | null>;
  reflections(uid: string): Promise<Reflection[]>;
  addReflection(uid: string, key: string, text: string): Promise<Reflection>;
  deleteReflection(uid: string, id: string): Promise<void>;
  talk(uid: string): Promise<TalkMessage[]>;
  addTalk(uid: string, role: 'user' | 'bella', body: string): Promise<TalkMessage>;
  profile(uid: string): Promise<{ name: string; country: string }>;
}

/** Bella's answer for the page: (system, conversation) → text, or null when no model answered */
export type Model = (system: string, turns: { role: 'user' | 'model'; text: string }[]) => Promise<string | null>;

export interface Out { status: number; body: unknown }
const ok = (body: unknown): Out => ({ status: 200, body });
const bad = (error: string, status = 400): Out => ({ status, body: { error } });
const QUESTIONS: QuestionKey[] = ['want', 'unsaid', 'change', 'line'];

export async function handleClarity(store: ClarityStore, uid: string, body: any, model: Model, now = Date.now()): Promise<Out> {
  const action = typeof body?.action === 'string' ? body.action : '';
  if (action === 'status') return ok({ on: await store.isOn(uid) });
  if (action === 'on') { await store.turnOn(uid); return ok({ on: true }); }
  if (action === 'off') { await store.wipe(uid); return ok({ on: false, deleted: true }); }
  // Everything else only while it's on
  if (!(await store.isOn(uid))) return bad('Clarity is off', 403);

  const view = async () => {
    const [{ country }, writing, answers] = await Promise.all([store.profile(uid), store.writing(uid, new Date(now - 365 * 86_400_000).toISOString()), store.reflections(uid)]);
    const items: ClarityItem[] = [...ownItems(uid, writing), ...answers.map(a => ({ kind: 'answer' as const, id: a.id, owner: uid, text: a.text, at: a.created_at }))];
    return { summary: summarize(uid, items, country, now), answers, country };
  };

  switch (action) {
    case 'view': {
      const v = await view();
      return ok({ on: true, ...v.summary, answers: v.answers, talk: await store.talk(uid) });
    }
    case 'open': {
      const kind = body?.kind === 'chat' ? 'chat' : body?.kind === 'entry' ? 'entry' : null;
      const id = typeof body?.id === 'string' ? body.id : '';
      if (!kind || !id) return bad('kind and id');
      const it = await store.item(uid, kind, id);
      if (!it || it.owner !== uid) return bad('Not found', 404);
      return ok({ kind, id, at: it.at, text: it.text });
    }
    case 'answer': {
      const key = QUESTIONS.includes(body?.key) ? body.key : null;
      const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 4000) : '';
      if (!key || !text) return bad('key and text');
      return ok({ answer: await store.addReflection(uid, key, text) });
    }
    case 'forget': {
      if (typeof body?.id !== 'string') return bad('id');
      await store.deleteReflection(uid, body.id);
      return ok({ ok: true });
    }
    case 'talk': {
      const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 4000) : '';
      if (!text) return bad('text');
      const [v, past, me] = await Promise.all([view(), store.talk(uid), store.profile(uid)]);
      const mine = await store.addTalk(uid, 'user', text);
      // The fixed checks run before and after the model, as in every chat: abuse first, then self-harm
      const abuse = v.summary.safety.abuse || dvSignal(text);
      const crisis = crisisSignal(text);
      const summary = abuse && !v.summary.safety.abuse ? { ...v.summary, safety: { ...v.summary.safety, abuse: true } } : v.summary;
      const system = clarityInstruction(summary, v.answers, me.name, v.country);
      const turns = [...past.slice(-20), mine].map(m => ({ role: m.role === 'bella' ? 'model' as const : 'user' as const, text: m.body }));
      // Abuse in this very message: fixed words and the line, never the model
      let reply = dvSignal(text) ? dvReply(v.country)
        : (await model(system, turns).catch(() => null))?.trim() || (abuse || crisis ? '' : "I'm having trouble thinking right now. Try me again in a moment.");
      if (!scoreFree(reply)) reply = "I won't put a number on your relationship: no score can say what it's worth to you. What I can do is show you what you've written, and ask what you want.";
      if (abuse) reply = withDvLine(reply, v.country);
      if (crisis) reply = withCrisisLine(reply, v.country);
      const bella = await store.addTalk(uid, 'bella', reply.trim());
      return ok({ messages: [mine, bella] });
    }
    default:
      return bad('Unknown action');
  }
}

/** A model reply that would break the rules is not shown: a score, a percentage about the relationship */
export function scoreFree(reply: string): boolean {
  return !/\b\d{1,3}\s?%|\b(compatibility|relationship)\s+score\b|\bscore\s+of\s+\d/i.test(reply);
}
