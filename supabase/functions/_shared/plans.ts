// Pure logic for planning together and calendars (unit-tested in Node, used by the server and the app).

export interface PlanOption { id: string; starts_at: string; minutes: number; label?: string | null }
export interface PlanDraft { title: string; details: string | null; options: PlanOption[] }

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Minutes between UTC and the given zone at that instant (e.g. -240 for New York in October). */
function zoneOffsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - utcMs) / 60000);
}

/** "2026-10-17T19:00" in the person's time zone → an exact instant (ISO, UTC). */
export function zonedToUtc(local: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(local.trim());
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (Number.isNaN(guess)) return null;
  let utc = guess - zoneOffsetMinutes(guess, timeZone) * 60000;
  utc = guess - zoneOffsetMinutes(utc, timeZone) * 60000; // settle across a DST change
  return new Date(utc).toISOString();
}

/**
 * Validates what Belluh proposes before it reaches the partner: a real title, 1-3 times,
 * each in the future (within about four months), each 15 minutes to 12 hours long.
 */
export function validatePlan(raw: unknown, timeZone: string, now = new Date()): PlanDraft | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const title = clean(r.title, 140);
  if (title.length < 2) return null;
  const details = clean(r.details, 1000) || null;
  const list = Array.isArray(r.options) ? r.options.slice(0, 3) : [];
  const options: PlanOption[] = [];
  for (const [i, o] of list.entries()) {
    const x = (o ?? {}) as Record<string, unknown>;
    const starts = typeof x.start === 'string' ? zonedToUtc(x.start, timeZone) : null;
    if (!starts) continue;
    const t = new Date(starts).getTime();
    if (t < now.getTime() + 10 * 60000 || t > now.getTime() + 120 * 86400000) continue;
    const minutes = Math.min(720, Math.max(15, Math.round(Number(x.minutes ?? 120)) || 120));
    options.push({ id: 'abc'[i], starts_at: starts, minutes, label: clean(x.label, 60) || null });
  }
  return options.length ? { title, details, options } : null;
}

/** "Sat, Oct 17 · 7:00 PM" in the person's own time zone. */
export function formatOption(o: Pick<PlanOption, 'starts_at'>, timeZone: string): string {
  const d = new Date(o.starts_at);
  const day = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(d);
  return `${day} · ${time}`;
}

/** Local calendar date of an option, for saving it as a date with reminders. */
export function localDateOf(iso: string, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

// ---------- calendars ----------

const icsStamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const pad = (n: number) => String(n).padStart(2, '0');

export interface CalEvent { uid: string; title: string; starts_at: string; minutes: number; details?: string | null }
export interface CalDate { uid: string; title: string; month: number; day: number; year: number | null; repeats_yearly: boolean }

/** Folds long lines to 75 octets as the iCalendar spec requires. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
}

export function icsCalendar(name: string, events: CalEvent[], dates: CalDate[] = [], now = new Date()): string {
  const stamp = icsStamp(now.toISOString());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Belluh//Belluh//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(name)}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H'];
  for (const e of events) {
    const end = new Date(new Date(e.starts_at).getTime() + e.minutes * 60000).toISOString();
    lines.push('BEGIN:VEVENT', `UID:${e.uid}@belluh.com`, `DTSTAMP:${stamp}`, `DTSTART:${icsStamp(e.starts_at)}`, `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsText(e.title)}`, ...(e.details ? [`DESCRIPTION:${icsText(e.details)}`] : []), 'END:VEVENT');
  }
  for (const d of dates) {
    const year = d.repeats_yearly ? (d.year ?? now.getUTCFullYear()) : d.year;
    if (!year) continue;
    const start = `${year}${pad(d.month)}${pad(d.day)}`;
    const next = new Date(Date.UTC(year, d.month - 1, d.day + 1));
    const end = `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`;
    lines.push('BEGIN:VEVENT', `UID:${d.uid}@belluh.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${icsText(d.title)}`, ...(d.repeats_yearly ? ['RRULE:FREQ=YEARLY'] : []), 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** One-tap "Add to Google Calendar" link for a confirmed plan. */
export function googleCalendarUrl(e: CalEvent): string {
  const end = new Date(new Date(e.starts_at).getTime() + e.minutes * 60000).toISOString();
  const q = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${icsStamp(e.starts_at)}/${icsStamp(end)}`, details: e.details ?? 'Planned together in Belluh' });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
