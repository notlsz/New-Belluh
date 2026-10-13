// Pure logic for Belluh's weekly loop (unit-tested in Node).
// Sunday: a private insight for each person + one shared thing to try. Wednesday: a check-in.

import { isoDate, type LocalDate } from './occasions.ts';
import type { EntryRow } from './agent.ts';

export type LocalDateTime = LocalDate & { hour: number };
export type CheckinStatus = 'done' | 'not_yet' | 'skipped';

export function weekday(d: LocalDate): number {
  return new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay(); // 0 = Sunday
}

/** The Sunday that starts the week containing this date. */
export function weekStart(d: LocalDate): string {
  const t = new Date(Date.UTC(d.y, d.m - 1, d.d));
  t.setUTCDate(t.getUTCDate() - t.getUTCDay());
  return isoDate({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

export function previousWeekStart(start: string): string {
  const t = new Date(`${start}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 7);
  return t.toISOString().slice(0, 10);
}

/** Sunday from 9am local: time for the weekly insight. */
export const isWeeklyDue = (n: LocalDateTime) => weekday(n) === 0 && n.hour >= 9;
/** Wednesday from 6pm local: time for the check-in. */
export const isCheckinDue = (n: LocalDateTime) => weekday(n) === 3 && n.hour >= 18;

/** A couple is stored once, with the smaller id first. */
export function pairOf(a: string, b: string | null): { user_a: string; user_b: string | null } {
  if (!b) return { user_a: a, user_b: null };
  return a < b ? { user_a: a, user_b: b } : { user_a: b, user_b: a };
}

export interface LastWeek {
  action: string;
  checkins: { name: string; status: CheckinStatus }[];
}

const STATUS_WORDS: Record<CheckinStatus, string> = { done: 'did it', not_yet: "hadn't yet", skipped: 'skipped it' };

function lastWeekLine(last: LastWeek | null): string {
  if (!last) return 'This is their first week with Belluh.';
  const how = last.checkins.length
    ? last.checkins.map(c => `${c.name} ${STATUS_WORDS[c.status]}`).join('; ')
    : 'nobody checked in';
  return `Last week's thing to try was "${last.action}". ${how}.`;
}

export const ACTION_SCHEMA = {
  type: 'OBJECT',
  properties: { action: { type: 'STRING' }, why: { type: 'STRING' } },
  required: ['action', 'why'],
};

/**
 * The shared action is written ONLY from entries both people chose to share,
 * because both partners see it. Private entries are filtered out here, whatever the caller passes.
 */
export function pairActionPrompt(opts: {
  names: Record<string, string>;
  entries: EntryRow[];
  lastWeek: LastWeek | null;
  today: string;
}): string {
  const shared = opts.entries
    .filter(e => e.is_shared === true && e.content?.trim())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 40)
    .map(e => `- ${e.created_at.slice(0, 10)} ${opts.names[e.user_id] ?? 'Partner'}: ${String(e.content).replace(/\s+/g, ' ').slice(0, 500)}`)
    .join('\n') || '(No shared entries yet.)';
  const people = Object.values(opts.names).join(' and ');
  return [
    `You are Belluh, the AI in a shared journal for couples. Today is ${opts.today}. Choose ONE small thing ${people} can try together this week.`,
    'It must be concrete, doable in under an hour, and grounded in something specific from their shared entries (a tension, a ritual they love, something one of them wished for).',
    'Write it as a short instruction to both of them, under 20 words, warm and plain. No therapy jargon, no markdown.',
    "Also give a one-sentence 'why' that points to what you noticed, without quoting anything word for word.",
    lastWeekLine(opts.lastWeek) + ' If it helped, build on it; if they skipped it, try something lighter.',
    '',
    'Shared entries (newest first):',
    shared,
  ].join('\n');
}

export const INSIGHT_SCHEMA = {
  type: 'OBJECT',
  properties: { insight: { type: 'STRING' } },
  required: ['insight'],
};

export function personalInsightInstruction(action: string | null, lastWeek: LastWeek | null): string {
  return [
    "It's Sunday. Write this week's insight for them: two or three sentences naming one pattern you noticed across the past week, specific and kind.",
    action ? `End by pointing to this week's thing to try together: "${action}".` : 'End with one small thing they could try this week.',
    lastWeekLine(lastWeek),
    'Return JSON: {"insight": string}. Plain text inside, no markdown.',
  ].join(' ');
}

export function validateAction(raw: unknown): { action: string; why: string } | null {
  const r = raw as { action?: unknown; why?: unknown } | null;
  const action = typeof r?.action === 'string' ? r.action.replace(/\s+/g, ' ').trim() : '';
  const why = typeof r?.why === 'string' ? r.why.replace(/\s+/g, ' ').trim().slice(0, 400) : '';
  if (action.length < 3 || action.length > 300) return null;
  return { action, why };
}

export function checkinMessage(action: string, partnerName: string | null): string {
  return partnerName
    ? `Midweek check-in: did you and ${partnerName} get to try this? "${action}"`
    : `Midweek check-in: did you get to try this? "${action}"`;
}
