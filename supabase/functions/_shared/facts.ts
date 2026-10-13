// "About us" facts (first met, anniversary, partner's birthday...) as stored by the Profile page.
// Pure helpers shared by the app and Belluh, unit-tested in Node.

export const FACT_LABELS: Record<string, string> = {
  firstMet: 'First met', firstDate: 'First date', firstKiss: 'First kiss', anniversary: 'Anniversary', partnerBday: "Partner's birthday",
};

export interface YMD { y: number; m: number; d: number }

/**
 * A stored fact date → a calendar date. Accepts "2020-05-01" (current format) and older ISO
 * timestamps. A timestamp at exactly UTC midnight came from a bare date picker, so its date part
 * is the date the person chose (reading it in local time would shift it a day in the Americas).
 */
export function parseFactDate(v: unknown): YMD | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const bare = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/.exec(v.trim());
  if (bare) {
    const y = +bare[1], m = +bare[2], d = +bare[3];
    return y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? { y, m, d } : null;
  }
  const t = new Date(v);
  if (Number.isNaN(t.getTime())) return null;
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}

export const ymdString = (x: YMD) => `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const ymdLabel = (x: YMD) => `${MONTHS[x.m - 1]} ${x.d}, ${x.y}`;

/** The stored JSON → "First met: May 1, 2020; Anniversary: June 14, 2021". Falls back to the raw text. */
export function readableFacts(content: string): string {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return content;
    const parts = Object.keys(FACT_LABELS).flatMap(k => {
      const ymd = parseFactDate(parsed[k]);
      return ymd ? [`${FACT_LABELS[k]}: ${ymdLabel(ymd)}`] : [];
    });
    return parts.length ? parts.join('; ') : '(no dates filled in yet)';
  } catch {
    return content;
  }
}
