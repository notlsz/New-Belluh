// Our Afterglow on the device: the Belluh schema profile() fills, turning the filled profile into a draft the person
// approves line by line, the photos behind each line (kept only here), and the ways to bring it anywhere.
import type { JsonSchema, Profile } from './types';
import { eventLines, type EventRec, type EventWords } from './events.ts';
import { SECTION_KEYS, LINES_MAX, LINE_MAX, type SectionKey, type StoredPassport } from '../../../supabase/functions/_shared/passport.ts';

export { SECTION_KEYS, SECTION_EMOJI, mergePassports, cleanPassport, type SectionKey, type StoredPassport, type SharedPassport, type MergedPassport } from '../../../supabase/functions/_shared/passport.ts';

const list = (description: string) => ({ type: 'array', items: { type: 'string' }, description: `${description} Up to ${LINES_MAX} short lines, most telling first, each under 90 characters. Null if the photos don't show it.` });

/** The schema Our Afterglow fills. Plain taste, nothing sensitive (the server screens it anyway). */
export const PASSPORT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Two short phrases joined by a comma that capture their most telling habits from the photos, like "Sunrise runner, ramen regular". 2 to 6 words. No names.' },
    music: list('Music they go to or play: concerts, artists, genres, venues, with how often ("House shows, about monthly").'),
    events: list('Concerts, festivals, games, shows and races they went to, from the events tool, grouped with how many this year ("House shows, nine this year", "Warriors games, three this year").'),
    food: list('Food and drink they come back to: cuisines, dishes, cafes and restaurants by name ("Matcha most mornings", "Sushi at Kura, 6 times").'),
    travel: list('Trips: where and when, and how they like to travel ("Lisbon twice, 2024 and 2025", "Weekend trips by train").'),
    places: list('Places near home they return to: venues, parks, markets, neighborhoods by name.'),
    rhythm: list('Their rhythm: when and how they spend their time ("Weekend mornings at the market", "Late dinners on Fridays").'),
    firsts: list('Firsts with dates: first trip somewhere, first concert, first time trying something ("First trip to Japan, April 2024").'),
  },
  required: ['title', ...SECTION_KEYS],
  additionalProperties: false,
};

export interface DraftLine { id: string; text: string; evidence: string[] }
export interface PassportDraft { title: string; sections: Record<SectionKey, DraftLine[]> }

let n = 0;
const lineId = () => `l${Date.now().toString(36)}${(n++).toString(36)}`;
const emptySections = () => Object.fromEntries(SECTION_KEYS.map(k => [k, []])) as Record<SectionKey, DraftLine[]>;

/** A filled profile as a draft: each line with the photos behind it (the line's own pointer, else its section's). */
export function draftFromProfile(p: Profile): PassportDraft {
  const sections = emptySections();
  for (const k of SECTION_KEYS) {
    const v = p.json?.[k];
    if (!Array.isArray(v)) continue;
    v.forEach((t, i) => {
      if (typeof t !== 'string' || !t.trim() || sections[k].length >= LINES_MAX) return;
      sections[k].push({ id: lineId(), text: t.trim().slice(0, LINE_MAX), evidence: p.evidence?.[`/${k}/${i}`] ?? p.evidence?.[`/${k}`] ?? [] });
    });
  }
  const title = typeof p.json?.title === 'string' ? p.json.title.trim().slice(0, 120) : '';
  return { title, sections };
}

export function draftFromStored(s: StoredPassport, evidence: Record<string, string[]> = {}): PassportDraft {
  const sections = emptySections();
  for (const k of SECTION_KEYS) for (const t of s.sections?.[k] ?? []) sections[k].push({ id: lineId(), text: t, evidence: evidence[`${k}:${t}`] ?? [] });
  return { title: s.title ?? '', sections };
}

/**
 * The Events lines from the device ("House shows, nine this year"), added when the AI wrote none: events are counted on
 * this device from venues, what photos show and tickets, so the numbers are exact. The photos behind each line stay here.
 */
export function withEventLines(d: PassportDraft, events: EventRec[], o: { words: EventWords; lang?: string; num?: (n: number) => string; date?: (day: string) => string; now?: number }): PassportDraft {
  if (d.sections.events?.length || !events.length) return d;
  const lines = eventLines(events, o.now ?? Date.now(), o.words, { lang: o.lang, num: o.num, date: o.date, max: LINES_MAX });
  if (!lines.length) return d;
  return { ...d, sections: { ...d.sections, events: lines.map(l => ({ id: lineId(), text: l.text.slice(0, LINE_MAX), evidence: l.ids })) } };
}

/** What gets stored: the text only. The photos behind each line stay on this device (evidenceMap). */
export function storedFromDraft(d: PassportDraft, share: Pick<StoredPassport, 'share_partner' | 'share_bella'>): StoredPassport {
  return { title: d.title.trim() || null, sections: Object.fromEntries(SECTION_KEYS.map(k => [k, d.sections[k].map(l => l.text.trim()).filter(Boolean)]).filter(([, v]) => (v as string[]).length)), ...share };
}
export const evidenceMap = (d: PassportDraft) => Object.fromEntries(SECTION_KEYS.flatMap(k => d.sections[k].filter(l => l.evidence.length).map(l => [`${k}:${l.text.trim()}`, l.evidence])));

// ---------- Bring it anywhere ----------

export interface ExportLabels { heading: string; sections: Record<SectionKey, string>; footer: string; aiIntro: string }

export function toMarkdown(s: StoredPassport, name: string, L: ExportLabels): string {
  const out = [`# ${L.heading.replace('{name}', name)}`, ''];
  if (s.title) out.push(`*${s.title}*`, '');
  for (const k of SECTION_KEYS) {
    const lines = s.sections?.[k] ?? [];
    if (!lines.length) continue;
    out.push(`## ${L.sections[k]}`, ...lines.map(l => `- ${l}`), '');
  }
  out.push(`_${L.footer}_`);
  return out.join('\n');
}

export function toJson(s: StoredPassport, name: string): string {
  return JSON.stringify({ format: 'belluh-afterglow', version: 1, name, title: s.title, sections: Object.fromEntries(SECTION_KEYS.filter(k => s.sections?.[k]?.length).map(k => [k, s.sections[k]])), exported_at: new Date().toISOString() }, null, 2);
}

/** A ready text to paste into ChatGPT or Claude */
export function forAssistant(s: StoredPassport, name: string, L: ExportLabels): string {
  return `${L.aiIntro.replace('{name}', name)}\n\n${toMarkdown(s, name, L)}`;
}
