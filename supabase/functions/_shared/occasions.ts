// Pure logic shared by the WhatsApp and SMS webhooks and the reminder job.
// No Deno or Supabase imports here, so it runs (and is tested) anywhere with Web Crypto.

export const OCCASION_KINDS = [
  'birthday', 'anniversary', 'first_date', 'first_met', 'first_kiss', 'holiday', 'trip', 'other',
] as const;
export type OccasionKind = typeof OCCASION_KINDS[number];

export interface ExtractedOccasion {
  label: string;
  kind: OccasionKind;
  month: number;
  day: number;
  year: number | null;
  repeats_yearly: boolean;
}

export interface StoredOccasion extends ExtractedOccasion {
  id: string;
  mentioned_at: string; // ISO timestamp
}

export interface LocalDate { y: number; m: number; d: number }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- Meta webhook signature ----------

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Checks Meta's X-Hub-Signature-256 header ("sha256=<hex>") against the raw request body. */
export async function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !appSecret || !header.startsWith('sha256=')) return false;
  const given = hexToBytes(header.slice('sha256='.length));
  if (!given || given.length !== 32) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(rawBody)));
  let diff = 0;
  for (let i = 0; i < 32; i++) diff |= expected[i] ^ given[i];
  return diff === 0;
}

// ---------- Incoming text commands ----------

export type Command =
  | { type: 'link'; code: string }
  | { type: 'list' }
  | { type: 'forget'; query: string }
  | { type: 'stop' }
  | { type: 'start' }
  | { type: 'help' }
  | { type: 'send_note' }
  | { type: 'discard_note' }
  | { type: 'pick'; option: number }
  | { type: 'none'; note: string }
  | { type: 'checkin'; status: 'done' | 'not_yet' | 'skipped' }
  | { type: 'offer'; accept: boolean }
  | { type: 'capture'; text: string };

/** Short replies people send from their phone. Anything else is a message to Belluh. */
export function parseCommand(raw: string): Command {
  // Telegram: the Connect button opens the chat with "/start <code>", and its menu sends commands as "/help", "/list@BelluhBot"
  const tgStart = /^\/start\s+([a-z0-9]{6})$/i.exec(raw.trim());
  if (tgStart) return { type: 'link', code: tgStart[1].toUpperCase() };
  const text = raw.trim().replace(/^\/(start|help|list|stop)(@\w+)?$/i, '$1');
  const lower = text.toLowerCase().replace(/[’]/g, "'");
  const link = /^link\s+([a-z0-9]{6})$/i.exec(text);
  if (link) return { type: 'link', code: link[1].toUpperCase() };
  if (/^(list|dates|my dates)$/.test(lower)) return { type: 'list' };
  const forget = /^(forget|delete|remove)\s+(.+)$/i.exec(text);
  if (forget) return { type: 'forget', query: forget[2].trim() };
  if (/^(stop|unsubscribe|stop reminders)$/.test(lower)) return { type: 'stop' };
  if (/^(start|resume|start reminders)$/.test(lower)) return { type: 'start' };
  if (/^(help|\?|commands)$/.test(lower)) return { type: 'help' };
  if (/^(send|send it|yes,? send( it)?|send the note)[.!]?$/.test(lower)) return { type: 'send_note' };
  if (/^(discard|don'?t send( it)?|do not send( it)?)[.!]?$/.test(lower)) return { type: 'discard_note' };
  const pick = /^(?:option\s*|#)?([1-3])[.)!]?$/.exec(lower);
  if (pick) return { type: 'pick', option: Number(pick[1]) };
  const none = /^none(?:\s+of\s+(?:these|them))?(?:\s+works?)?\b[\s,.:;!-]*(.*)$/is.exec(text);
  if (none) return { type: 'none', note: none[1].trim() };
  if (/^(did it|we did it|done)[.!]*$/.test(lower)) return { type: 'checkin', status: 'done' };
  if (/^not yet[.!]*$/.test(lower)) return { type: 'checkin', status: 'not_yet' };
  if (/^(skip|skipped|skip it)[.!]*$/.test(lower)) return { type: 'checkin', status: 'skipped' };
  if (/^(plan it|yes,? plan it|help me plan it)[.!]*$/.test(lower)) return { type: 'offer', accept: true };
  if (/^(not now|no thanks|maybe later)[.!]*$/.test(lower)) return { type: 'offer', accept: false };
  return { type: 'capture', text };
}

/** WhatsApp's wa_id is digits only; store numbers as E.164. */
export function toE164(waId: string): string {
  return '+' + waId.replace(/\D/g, '');
}

// ---------- Dates ----------

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/** Today's calendar date in an IANA time zone. */
export function localDateParts(now: Date, timeZone: string): LocalDate & { hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), hour: get('hour') };
}

function toUtcDay(x: LocalDate): number {
  return Date.UTC(x.y, x.m - 1, x.d) / 86_400_000;
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  return toUtcDay(to) - toUtcDay(from);
}

/** The next date this occasion falls on, today included. Feb 29 falls on Feb 28 in non-leap years. */
export function nextOccurrence(o: Pick<ExtractedOccasion, 'month' | 'day' | 'year' | 'repeats_yearly'>, today: LocalDate): LocalDate | null {
  if (!o.repeats_yearly) {
    if (o.year == null) return null;
    const once = { y: o.year, m: o.month, d: Math.min(o.day, daysInMonth(o.year, o.month)) };
    return daysBetween(today, once) >= 0 ? once : null;
  }
  for (const y of [today.y, today.y + 1]) {
    const cand = { y, m: o.month, d: Math.min(o.day, daysInMonth(y, o.month)) };
    if (daysBetween(today, cand) >= 0) return cand;
  }
  return null;
}

export type ReminderStage = 'week_before' | 'day_of';

export function reminderStage(daysUntil: number): ReminderStage | null {
  if (daysUntil === 7) return 'week_before';
  if (daysUntil === 0) return 'day_of';
  return null;
}

export function isoDate(x: LocalDate): string {
  return `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;
}

export function formatMonthDay(m: number, d: number): string {
  return `${MONTHS_LONG[m - 1]} ${d}`;
}

export function formatShortDate(iso: string, timeZone: string): string {
  const p = localDateParts(new Date(iso), timeZone);
  return `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
}

// ---------- Extraction (Gemini) ----------

export const EXTRACTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    occasions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING', description: "Short name, e.g. \"Maya's birthday\" or \"Our anniversary\"" },
          kind: { type: 'STRING', enum: [...OCCASION_KINDS] },
          month: { type: 'INTEGER' },
          day: { type: 'INTEGER' },
          year: { type: 'INTEGER', nullable: true },
          repeats_yearly: { type: 'BOOLEAN' },
        },
        required: ['label', 'kind', 'month', 'day', 'repeats_yearly'],
      },
    },
  },
  required: ['occasions'],
};

export function buildExtractionPrompt(message: string, today: LocalDate): string {
  return [
    'You extract dates a person wants remembered from one text message (WhatsApp or SMS) to Belluh, a journal app for couples.',
    `Today is ${isoDate(today)}. Resolve relative dates ("next Friday", "in two weeks") against today.`,
    'Return every specific calendar date in the message that names an occasion: birthdays, anniversaries, firsts, trips, holidays, plans.',
    'Birthdays, anniversaries and firsts repeat yearly. One-off plans and trips do not repeat and need a year.',
    'Use a short label in the writer\'s own words, e.g. "Maya\'s birthday", "Our anniversary", "Trip to Lisbon".',
    'If the message has no specific date, return an empty list. Never invent a date.',
    '',
    'Message:',
    message.slice(0, 2000),
  ].join('\n');
}

/** Validates model output; drops anything malformed rather than saving a wrong date. */
export function normalizeExtracted(raw: unknown): ExtractedOccasion[] {
  const list = (raw as { occasions?: unknown })?.occasions;
  if (!Array.isArray(list)) return [];
  const out: ExtractedOccasion[] = [];
  for (const item of list.slice(0, 10)) {
    const r = item as Record<string, unknown>;
    const label = typeof r.label === 'string' ? r.label.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
    const month = Number(r.month), day = Number(r.day);
    const year = r.year == null || r.year === '' ? null : Number(r.year);
    if (!label || !Number.isInteger(month) || month < 1 || month > 12) continue;
    // Feb 29 is valid as a yearly date even without a year
    const maxDay = year != null && Number.isInteger(year) ? daysInMonth(year, month) : daysInMonth(2000, month);
    if (!Number.isInteger(day) || day < 1 || day > maxDay) continue;
    if (year != null && (!Number.isInteger(year) || year < 1900 || year > 2100)) continue;
    const kind = (OCCASION_KINDS as readonly string[]).includes(r.kind as string) ? r.kind as OccasionKind : 'other';
    let repeats = typeof r.repeats_yearly === 'boolean' ? r.repeats_yearly : true;
    if (!repeats && year == null) repeats = true; // a one-off with no year can't be scheduled
    out.push({ label, kind, month, day, year, repeats_yearly: repeats });
  }
  return out;
}

// ---------- Replies ----------

export const HELP_TEXT =
  "I'm Belluh, the same Belluh as in the app. Text me like you'd talk to me there: what's on your mind, a date to remember " +
  "(\"Maya's birthday is May 12\"), or \"plan a dinner with Maya this week\". Notes and plans from your partner come here too.\n\n" +
  'Ask me to remind you of something ("remind me to call his mom Sunday at 5") and I will. ' +
  'LIST shows your dates. FORGET <name> removes one. STOP pauses my messages, START turns them back on.';

export const NOT_LINKED_TEXT =
  "Hi, I'm Belluh. To save dates here, open Belluh, go to Me → Settings, and tap Connect WhatsApp. It opens WhatsApp with the code ready to send.";

export const NOT_LINKED_TELEGRAM_TEXT =
  "Hi, I'm Belluh. To connect, open Belluh, go to Me → Settings, and tap Connect Telegram. It brings you back here, already linked.";

export const NOT_LINKED_SMS_TEXT =
  "Hi, I'm Belluh. To save dates by text, open Belluh, go to Me → Settings, and tap Connect by text. It opens Messages with the code ready to send.";

export const NO_DATE_TEXT =
  "I didn't find a date in that. Try something like \"Maya's birthday is May 12\" or \"our anniversary is June 3\".\n\n" +
  "I only keep dates here. Your journal lives in the Belluh app.";

export function savedReply(saved: ExtractedOccasion[], alreadyKnown: { label: string; mentioned_at: string }[], timeZone: string): string {
  const lines: string[] = [];
  for (const o of saved) {
    const when = formatMonthDay(o.month, o.day) + (o.repeats_yearly ? '' : `, ${o.year}`);
    lines.push(`Saved: ${o.label}, ${when} ✓`);
  }
  for (const k of alreadyKnown) {
    lines.push(`Already saved: ${k.label} (you told me on ${formatShortDate(k.mentioned_at, timeZone)})`);
  }
  if (saved.length) lines.push('', "I'll remind you a week before and on the day.");
  return lines.join('\n');
}

export function listReply(occasions: StoredOccasion[], today: LocalDate, timeZone: string): string {
  const upcoming = occasions
    .map(o => ({ o, next: nextOccurrence(o, today) }))
    .filter((x): x is { o: StoredOccasion; next: LocalDate } => x.next !== null)
    .sort((a, b) => daysBetween(today, a.next) - daysBetween(today, b.next));
  if (!upcoming.length) return "I don't have any dates yet. Text me one, like \"Maya's birthday is May 12\".";
  const lines = upcoming.slice(0, 20).map(({ o, next }) => {
    const days = daysBetween(today, next);
    const soon = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
    return `${o.label}: ${formatMonthDay(o.month, o.day)} (${soon}). You told me on ${formatShortDate(o.mentioned_at, timeZone)}.`;
  });
  if (upcoming.length > 20) lines.push(`…and ${upcoming.length - 20} more in the app.`);
  return 'Here is everything I remember, soonest first:\n\n' + lines.join('\n');
}

/** Template parameters for the approved "occasion_reminder" template. */
export function reminderParams(o: StoredOccasion, stage: ReminderStage, timeZone: string): string[] {
  return [
    o.label,
    stage === 'day_of' ? 'today' : 'in one week',
    formatMonthDay(o.month, o.day),
    formatShortDate(o.mentioned_at, timeZone),
  ];
}
