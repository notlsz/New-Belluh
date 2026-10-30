// What Bella says on her own (a reminder, a nudge, "how was it?", "found it") reaches people in the language they read
// Belluh in, the way it's written where they live: Mexico's Spanish, Portugal's Portuguese, Swiss German. Bella writes
// these in English; this rewrites them before they're sent. Their partner's words are never passed through here.
// The pure parts (which language, whether a rewrite kept what must not change) are unit-tested in Node.

const NAMES: Record<string, string> = {
  ja: 'Japanese (natural, warm, polite-casual, never stiff keigo)', fr: 'French (France, tu)', it: 'Italian (tu)',
  'pt-BR': 'Brazilian Portuguese (você, warm and informal)', 'pt-PT': 'European Portuguese from Portugal (tu, never Brazilian forms)',
  zh: 'Simplified Chinese (mainland)', de: 'German (du)', 'de-CH': 'Swiss Standard German (du, ss instead of ß)',
  es: 'Spanish from Spain (tú)', 'es-MX': 'Mexican Spanish (tú, never Spain forms like vosotros or vale)',
  'fr-CA': 'Québec French (tu)',
};

/** The language to write in, from the tag the app saved ("pt-PT", "ja-JP", "en-GB"); null means English, as is. */
export function languageFor(tag: string | null | undefined): string | null {
  if (!tag) return null;
  const [lang, region] = tag.split('-');
  if (!lang || lang === 'en') return null;
  return NAMES[`${lang}-${region}`] ?? NAMES[lang] ?? (lang === 'pt' ? NAMES['pt-BR'] : null);
}

const keep = (s: string) => [
  ...(s.match(/https?:\/\/\S+/g) ?? []),                 // links
  ...(s.match(/\b(PLAN IT|NOT NOW|DID IT|NOT YET|SKIP|NONE|STOP|START|LIST|HELP|LINK)\b/g) ?? []),   // reply words the inbox understands
  ...(s.match(/\d+\)/g) ?? []),                          // numbered choices
];

/** A rewrite is used only if it kept every link, reply word and numbered choice, and isn't empty or runaway. */
export function keptWhatMatters(original: string, rewritten: string | null | undefined): boolean {
  if (!rewritten || !rewritten.trim()) return false;
  if (rewritten.length > original.length * 3 + 200) return false;
  return keep(original).every(k => rewritten.includes(k));
}

export const REWRITE_PROMPT = (language: string, text: string) =>
  `Rewrite this message from Bella (a warm assistant for couples) in ${language}, the way a native speaker there would say it to a friend. ` +
  'Keep names, places, prices and anything in quotation marks exactly as they are; write dates and times the way people there write them. Keep links exactly. Keep words in ALL CAPS ' +
  '(they are reply commands) exactly, in English. Keep numbered choices like "1)" and line breaks. No emoji unless the original has them. ' +
  `Return JSON: {"text": string}.\n\nMessage:\n${text}`;

// Server side: look up the reader's language once per run and rewrite. Never fails a send: English goes out instead.
const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };
const cache = new Map<string, string | null>();

export async function readerTag(db: any, userId: string): Promise<string | null> {
  if (cache.has(userId)) return cache.get(userId)!;
  const { data } = await db.from('agent_settings').select('lang').eq('user_id', userId).maybeSingle();
  const tag = typeof data?.lang === 'string' ? data.lang : null;
  cache.set(userId, tag);
  return tag;
}

export async function localized(db: any, userId: string, text: string): Promise<string> {
  try {
    const language = languageFor(await readerTag(db, userId));
    if (!language || !text.trim() || !env('GEMINI_API_KEY')) return text;
    const { jsonAnswer } = await import('./gemini.ts');
    const out = await jsonAnswer('You translate short messages naturally and faithfully.', REWRITE_PROMPT(language, text),
      { type: 'OBJECT', properties: { text: { type: 'STRING' } }, required: ['text'] }) as { text?: string } | null;
    return keptWhatMatters(text, out?.text) ? out!.text!.trim() : text;
  } catch { return text; }
}
