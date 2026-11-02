// Bella in the app can look at the photos through the phone: when a message asks about the couple's own past ("when
// did we last go to Lisbon?"), the app asks Belluh Memory first, here, and sends Bella the answer with the message.
// Texting Bella never gets this (the phone isn't there); she has only the approved Passport.
import { createMemoryAgent } from './agent';
import { aiAllowed } from './consent';
import { loadEngine } from './engineRef';
import { httpTransport } from './transport';

const PAST = /\b(when|where|what|how (many|often|long)|which)\b.{0,40}\b(did|have|was|were)\b.{0,10}\b(we|i)\b|\b(last time|first time|remember when|our (trip|first|anniversary)|photos? of|pictures? of)\b|\b(cuándo|dónde|qué) (fuimos|comimos|estuvimos|hicimos)|la (última|primera) vez|\bquand (sommes|avons|étions)|\boù (sommes|avons)|la (dernière|première) fois|\bquando (fomos|estivemos|comemos|siamo|abbiamo)|\bonde (fomos|comemos)|a (última|primeira) vez|\bdove (siamo|abbiamo)|l['’](ultima|prima) volta|\bwann (waren|sind|haben) wir|\bwo (waren|haben) wir|das (letzte|erste) mal|前回|最後に|初めて.{0,6}(行|食)|いつ.{0,8}行った|どこで.{0,8}(食べ|行っ)|上次|第一次.{0,6}(去|吃)|什么时候.{0,6}去|我们在哪|지난번|마지막으로|처음.{0,6}(갔|먹)|언제.{0,6}갔|어디서.{0,6}먹었/iu;

export const looksLikeMemoryQuestion = (text: string) => text.length <= 1000 && PAST.test(text);

/** Answers from the photos for Bella, when Memory is on and allowed; null otherwise (or after 20 seconds). */
export async function photoAnswerFor(text: string, lang: string): Promise<{ question: string; answer: string } | null> {
  if (!aiAllowed() || !looksLikeMemoryQuestion(text)) return null;
  const engine = await loadEngine();
  if (!engine) return null;
  const s = engine.state();
  if (!(s.type === 'ready' || s.type === 'paused' || s.type === 'unfinished' || (s.type === 'indexing' && s.progress.searchable))) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const a = await createMemoryAgent({ engine, transport: httpTransport, allowed: aiAllowed, lang }).query(text, { signal: ctrl.signal });
    return a.declined || !a.text ? null : { question: text, answer: a.text };
  } catch { return null; } finally { clearTimeout(timer); }
}
