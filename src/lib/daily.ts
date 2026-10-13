// Pure helpers for streaks and the daily question (unit-tested).

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Days in a row with at least one entry, ending today or yesterday. */
export function computeStreak(dates: Date[], now = new Date()): number {
  const days = new Set(dates.map(dayKey));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(cursor))) { n++; cursor.setDate(cursor.getDate() - 1); }
  return n;
}

/** The same question for both partners on the same calendar day. */
export function questionForDay(questions: string[], now = new Date()): string {
  const local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000;
  return questions[((local % questions.length) + questions.length) % questions.length];
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/**
 * Your partner's answer to today's question is locked until you answer too. Anything that reads the
 * journal for you (AI features, letters, stats) gets the entries without it, so nothing gives it away.
 */
export function hideLockedAnswer<T extends { id: string; userId: string; prompt?: string; timestamp: Date }>(
  entries: T[], userId: string, todaysPrompt: string, now = new Date(),
): T[] {
  const today = (e: T) => e.prompt === todaysPrompt && isSameDay(e.timestamp, now);
  if (entries.some(e => e.userId === userId && today(e))) return entries;
  return entries.filter(e => e.userId === userId || !today(e));
}
