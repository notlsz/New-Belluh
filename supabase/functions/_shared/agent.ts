// Pure logic for the Belluh agent: what it may see, how it is told to behave, and validation of what it asks to do.
// No Deno or Supabase imports, so it is unit-tested in Node.

import { daysInMonth, formatMonthDay, nextOccurrence, daysBetween, type LocalDate } from './occasions.ts';

export interface EntryRow {
  id: string;
  user_id: string;
  content: string | null;
  title?: string | null;
  mood?: string | null;
  is_shared: boolean | null;
  tags?: string[] | null;
  created_at: string;
}

export interface OccasionRow {
  label: string; month: number; day: number; year: number | null; repeats_yearly: boolean;
}

const SYSTEM_TAGS = ['system_circle_def', 'system_circle_member', 'system_facts', 'system_circle_metadata'];

/**
 * The privacy rule, in one place: Belluh sees all of your own entries, and only the
 * entries your connected partner chose to share. Never anyone else's, never their private ones.
 */
export function visibleEntries(viewerId: string, partnerIds: string[], rows: EntryRow[]): EntryRow[] {
  const partners = new Set(partnerIds);
  return rows.filter(r => {
    if (!r.content || !r.content.trim()) return false;
    if (r.tags?.some(t => SYSTEM_TAGS.includes(t))) return false;
    if (r.user_id === viewerId) return true;
    return partners.has(r.user_id) && r.is_shared === true;
  });
}

const fmtDate = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export function entriesBlock(entries: EntryRow[], names: Record<string, string>, viewerId: string, limit = 40): string {
  if (!entries.length) return '(No journal entries yet.)';
  return [...entries]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(e => {
      const who = e.user_id === viewerId ? `${names[viewerId] ?? 'Me'} (you)` : names[e.user_id] ?? 'Partner';
      const privacy = e.user_id === viewerId && !e.is_shared ? ' [private: only you can see this]' : '';
      const mood = e.mood ? ` mood: ${e.mood}.` : '';
      return `- ${fmtDate(e.created_at)} ${who}${privacy}:${mood} ${String(e.content).replace(/\s+/g, ' ').slice(0, 600)}`;
    })
    .join('\n');
}

export function occasionsBlock(rows: OccasionRow[], today: LocalDate): string {
  const upcoming = rows
    .map(o => ({ o, next: nextOccurrence(o, today) }))
    .filter((x): x is { o: OccasionRow; next: LocalDate } => x.next !== null)
    .sort((a, b) => daysBetween(today, a.next) - daysBetween(today, b.next))
    .slice(0, 15);
  if (!upcoming.length) return '(No saved dates.)';
  return upcoming.map(({ o, next }) => `- ${o.label}: ${formatMonthDay(o.month, o.day)} (in ${daysBetween(today, next)} days)`).join('\n');
}

export interface PersonContext {
  myName: string;
  partnerName: string | null;
  memories: string[];
  entries: string;   // from entriesBlock
  dates: string;     // from occasionsBlock
  today: string;     // YYYY-MM-DD
}

export function systemPrompt(c: PersonContext): string {
  const partner = c.partnerName ?? 'their partner';
  return `You are Belluh, the AI inside Belluh, a shared journal for couples. You are talking with ${c.myName}${c.partnerName ? `, who is with ${c.partnerName}` : ''}. Today is ${c.today}.

Who you are
- The thoughtful friend who has read the journal: warm, specific, brief. Two to five sentences unless asked for more.
- You point ${c.myName} back toward ${partner}. You are a voice in the room, never a third person in the relationship. Don't flirt, don't play a romantic role, and don't try to become the person they confide in instead of ${partner}.
- Quote or refer to specific entries and dates when it helps. Never invent memories.
- Don't take sides. When there's friction, name what each person seems to need.
- Plain text only. No markdown, no asterisks, no headings, no lists unless asked.

Privacy
- You only see ${c.myName}'s own entries and the entries ${partner} chose to share. Anything marked [private] is ${c.myName}'s own private writing: never suggest sharing it or put its contents in a note to ${partner} unless ${c.myName} explicitly asks.
- If asked what ${partner} wrote privately, say you can't see private entries.

Actions (use the tools; don't just describe them)
- remember_fact: when ${c.myName} tells you something lasting about themselves, ${partner} or the relationship (a preference, a sensitivity, a ritual, an important history). One short sentence. Don't store passing moods.
- forget_memory: when they ask you to forget something.
- save_date: when they mention a specific date worth remembering (birthday, anniversary, plan).
- draft_note_to_partner: when they want to tell ${partner} something, or you've helped them find words they want to send. This only drafts it; ${c.myName} approves before anything is sent. Write it in ${c.myName}'s voice, first person.

Safety
- If anyone describes being hurt, threatened, controlled or afraid of ${partner}, take it seriously, don't coach them to smooth it over, and encourage them to reach out to someone they trust or a domestic violence hotline (in the US, 1-800-799-7233).
- If someone mentions wanting to harm themselves, respond with care and point them to the 988 Suicide & Crisis Lifeline (call or text 988 in the US).

What you remember about them
${c.memories.length ? c.memories.map(m => `- ${m}`).join('\n') : '(Nothing yet.)'}

Their saved dates
${c.dates}

Recent journal (newest first)
${c.entries}`;
}

export const MEDIATE_INSTRUCTION =
  'This message is in mediation mode: they are upset with their partner and want help saying it well. ' +
  'First acknowledge the feeling in one sentence. Then offer one way to say it that names the feeling and the need without blame. ' +
  'If they want to send it, use draft_note_to_partner.';

export const REACT_INSTRUCTION =
  'They just wrote the journal entry below. Decide whether a short reply from you would genuinely help: ' +
  'a connection to something earlier in the journal, a gentle question, or noticing a pattern. ' +
  'If you have nothing specific to add, reply with an empty string. Never reply with generic praise. ' +
  'At most two sentences. Return JSON: {"reply": string}.';

export const TOOL_DECLARATIONS = [
  {
    name: 'remember_fact',
    description: 'Remember a lasting fact about the user, their partner, or the relationship.',
    parameters: { type: 'OBJECT', properties: { fact: { type: 'STRING' } }, required: ['fact'] },
  },
  {
    name: 'forget_memory',
    description: 'Forget remembered facts that match a few words.',
    parameters: { type: 'OBJECT', properties: { query: { type: 'STRING' } }, required: ['query'] },
  },
  {
    name: 'save_date',
    description: 'Save a date to remember and remind them about.',
    parameters: {
      type: 'OBJECT',
      properties: {
        label: { type: 'STRING' }, month: { type: 'INTEGER' }, day: { type: 'INTEGER' },
        year: { type: 'INTEGER', nullable: true }, repeats_yearly: { type: 'BOOLEAN' },
      },
      required: ['label', 'month', 'day', 'repeats_yearly'],
    },
  },
  {
    name: 'draft_note_to_partner',
    description: "Draft a note to the user's partner, in the user's voice. The user approves it before it is sent.",
    parameters: { type: 'OBJECT', properties: { text: { type: 'STRING' } }, required: ['text'] },
  },
];

export type ToolCall =
  | { name: 'remember_fact'; fact: string }
  | { name: 'forget_memory'; query: string }
  | { name: 'save_date'; label: string; month: number; day: number; year: number | null; repeats_yearly: boolean }
  | { name: 'draft_note_to_partner'; text: string };

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Model output is untrusted: validate every tool call before acting on it. */
export function validateToolCall(name: string, args: Record<string, unknown> | undefined): ToolCall | null {
  const a = args ?? {};
  switch (name) {
    case 'remember_fact': { const fact = clean(a.fact, 300); return fact ? { name, fact } : null; }
    case 'forget_memory': { const query = clean(a.query, 100); return query.length >= 2 ? { name, query } : null; }
    case 'draft_note_to_partner': {
      const text = typeof a.text === 'string' ? a.text.trim().slice(0, 1000) : '';
      return text ? { name, text } : null;
    }
    case 'save_date': {
      const label = clean(a.label, 120);
      const month = Number(a.month), day = Number(a.day);
      const year = a.year == null ? null : Number(a.year);
      if (!label || !Number.isInteger(month) || month < 1 || month > 12) return null;
      if (year != null && (!Number.isInteger(year) || year < 1900 || year > 2100)) return null;
      if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year ?? 2000, month)) return null;
      let repeats = a.repeats_yearly !== false;
      if (!repeats && year == null) repeats = true;
      return { name, label, month, day, year, repeats_yearly: repeats };
    }
    default: return null;
  }
}

/** Strips markdown the model sometimes adds anyway. */
export function cleanReply(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(\S.*?)\*/g, '$1$2')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4000);
}
