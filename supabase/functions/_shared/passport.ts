// Our Afterglow (Rollup Passport, for a couple): a short page of what each person's photos say about their taste,
// approved line by line by them. Only that approved text is stored (memory_passports); each section is shared with the
// partner and with Bella separately. Pure, so the app, Bella's context (agentdb) and the tests share the same rules.

export const SECTION_KEYS = ['music', 'food', 'travel', 'places', 'rhythm', 'firsts'] as const;
export type SectionKey = typeof SECTION_KEYS[number];
export const SECTION_EMOJI: Record<SectionKey, string> = { music: '🎵', food: '🍜', travel: '✈️', places: '📍', rhythm: '🌅', firsts: '🌟' };
export const LINES_MAX = 6;
export const LINE_MAX = 160;

/** What is stored: approved text only, never photos or device ids */
export interface StoredPassport {
  user_id?: string;
  title: string | null;
  sections: Partial<Record<SectionKey, string[]>>;
  share_partner: Partial<Record<SectionKey, boolean>>;
  share_bella: Partial<Record<SectionKey, boolean>>;
  updated_at?: string;
}
/** The partner's passport as the database hands it over: only the sections they share with you */
export interface SharedPassport { user_id?: string; title?: string | null; sections: Partial<Record<SectionKey, string[]>>; updated_at?: string }

const isKey = (k: string): k is SectionKey => (SECTION_KEYS as readonly string[]).includes(k);
const cleanLine = (s: unknown) => String(s ?? '').replace(/[—•·]/g, ',').replace(/\s+/g, ' ').trim().slice(0, LINE_MAX);
export const sameLine = (a: string, b: string) => normLine(a) === normLine(b);
const normLine = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Tidies what a person approved before it is saved: known sections, short lines, no duplicates, no empty sections. */
export function cleanPassport(p: { title?: unknown; sections?: unknown; share_partner?: unknown; share_bella?: unknown }): StoredPassport {
  const sections: Partial<Record<SectionKey, string[]>> = {};
  const src = p.sections && typeof p.sections === 'object' ? p.sections as Record<string, unknown> : {};
  for (const k of SECTION_KEYS) {
    const lines: string[] = [];
    for (const l of Array.isArray(src[k]) ? src[k] as unknown[] : []) { const c = cleanLine(l); if (c && !lines.some(x => sameLine(x, c)) && lines.length < LINES_MAX) lines.push(c); }
    if (lines.length) sections[k] = lines;
  }
  const flags = (v: unknown) => Object.fromEntries(SECTION_KEYS.map(k => [k, !!(v && typeof v === 'object' && (v as any)[k] === true)])) as Record<SectionKey, boolean>;
  const title = cleanLine(p.title).slice(0, 120) || null;
  return { title, sections, share_partner: flags(p.share_partner), share_bella: flags(p.share_bella) };
}

export type Who = 'me' | 'partner' | 'both';
export interface MergedLine { text: string; who: Who }
export interface MergedPassport { title: string | null; sections: Partial<Record<SectionKey, MergedLine[]>>; mine: SectionKey[]; theirs: SectionKey[] }

/**
 * "Us": both approved passports together, only what each chose to share with the other. My sections count only when
 * I share them with my partner; theirs only as the database handed them over (already only what they share), and
 * never a section their flags say is off. The same line from both is one line, marked as both.
 */
export function mergePassports(mine: StoredPassport | null, theirs: (SharedPassport & { share_partner?: Partial<Record<SectionKey, boolean>> }) | null): MergedPassport {
  const sections: Partial<Record<SectionKey, MergedLine[]>> = {};
  const mineKeys: SectionKey[] = [], theirKeys: SectionKey[] = [];
  for (const k of SECTION_KEYS) {
    const a = mine && mine.share_partner?.[k] === true ? (mine.sections?.[k] ?? []) : [];
    const theirFlagOff = theirs?.share_partner && theirs.share_partner[k] !== true;
    const b = theirs && !theirFlagOff ? (theirs.sections?.[k] ?? []) : [];
    if (a.length) mineKeys.push(k);
    if (b.length) theirKeys.push(k);
    const out: MergedLine[] = [];
    for (const t of a) { const c = cleanLine(t); if (c && !out.some(o => sameLine(o.text, c))) out.push({ text: c, who: 'me' }); }
    for (const t of b) {
      const c = cleanLine(t); if (!c) continue;
      const hit = out.find(o => sameLine(o.text, c));
      if (hit) hit.who = hit.who === 'me' ? 'both' : hit.who; else out.push({ text: c, who: 'partner' });
    }
    if (out.length) sections[k] = out;
  }
  const head = (t: string | null | undefined) => (t ?? '').split(/[,，、]/)[0].trim();
  const t1 = mineKeys.length ? head(mine?.title) : '', t2 = theirKeys.length ? head(theirs?.title) : '';
  const title = t1 && t2 ? (sameLine(t1, t2) ? t1 : `${t1}, ${t2}`) : (t1 || t2 || null);
  return { title, sections, mine: mineKeys, theirs: theirKeys };
}

const NAMES: Record<SectionKey, string> = { music: 'Music', food: 'Food', travel: 'Travel', places: 'Places', rhythm: 'Rhythm', firsts: 'Firsts' };

/** What Bella may see, for her context: my sections I share with Bella, and my partner's that they share with both me
 *  and Bella. Returns null when there is nothing. */
export function bellaPassportBlock(mine: StoredPassport | null, partner: StoredPassport | null, myName: string, partnerName: string | null): string | null {
  const lines: string[] = [];
  const add = (p: StoredPassport | null, who: string, needsPartnerShare: boolean) => {
    if (!p) return;
    const keys = SECTION_KEYS.filter(k => p.share_bella?.[k] === true && (!needsPartnerShare || p.share_partner?.[k] === true) && (p.sections?.[k]?.length ?? 0) > 0);
    if (!keys.length) return;
    lines.push(`${who}${p.title ? ` (${p.title})` : ''}:`);
    for (const k of keys) lines.push(`- ${NAMES[k]}: ${(p.sections[k] ?? []).map(cleanLine).join('; ')}`);
  };
  add(mine, myName, false);
  add(partner, partnerName ?? 'Their partner', true);
  return lines.length ? lines.join('\n') : null;
}

/** Which sections Bella read, for the owner's Activity */
export const bellaSections = (p: StoredPassport | null, needsPartnerShare = false): SectionKey[] =>
  p ? SECTION_KEYS.filter(k => p.share_bella?.[k] === true && (!needsPartnerShare || p.share_partner?.[k] === true) && (p.sections?.[k]?.length ?? 0) > 0) : [];

export const sectionKeys = (o: Record<string, unknown>) => Object.keys(o).filter(isKey);
