// "Bring your story from the app you met on": reads a dating app's data export on this device, finds the match with
// the partner, and proposes a "How we met" chapter the person ticks line by line. Nothing is uploaded. Every other match
// is summarised for picking and then dropped (keepOnly), so it never outlives the picker. Pure, so it's unit-tested;
// the screen is src/components/HowWeMet.tsx and the formats (with sources) are in docs/growth/research/dating-apps.md.

import { listZip, isZip } from './zip.ts';
import type { DatingApp } from './datingApps.ts';

/** One line of a conversation. mine is true when the export says the person wrote it, null when it can't tell. */
export interface ChatLine { at: number | null; text: string; mine: boolean | null }

export interface MatchThread {
  id: string;
  matchedAt: number | null;
  /** The person answered Hinge's "did you meet?" with yes, at this time */
  weMet: number | null;
  lines: ChatLine[];
}

export interface ImportResult { app: 'tinder' | 'hinge' | 'generic'; threads: MatchThread[] }

const MAX_LINES = 400;                 // per thread: the first messages are what a "how we met" chapter needs
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', nbsp: ' ', ndash: '–' };
/** Tinder stores messages HTML-escaped ("don&rsquo;t") */
export const unescapeHtml = (s: string) => String(s ?? '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
  .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** "2023-03-12 18:22:01" (Hinge, UTC), ISO, "Tue, 30 Nov 2021 05:08:21 GMT" (Tinder), or epoch seconds/ms */
export function toTime(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v < 1e11 ? v * 1000 : v;
  if (typeof v !== 'string' || !v.trim()) return null;
  let s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s = s.replace(' ', 'T') + 'Z';
  const t = Date.parse(s);
  return Number.isFinite(t) && t > Date.UTC(2000, 0, 1) && t < Date.now() + 86_400_000 ? t : null;
}

const cap = (lines: ChatLine[]) => lines.filter(l => l.text).sort((x, y) => (x.at ?? Infinity) - (y.at ?? Infinity)).slice(0, MAX_LINES);

// ------------------------------------------------------------------------------------------------------------ Tinder
// data.json: { Messages: [{ match_id, messages: [{ to, from: "You", message, sent_date, type? }] }], Usage, User, ... }
// The export holds only the messages the person sent, and no match dates per match.
export const looksTinder = (j: any) => !!j && Array.isArray(j.Messages) && j.Messages.every((m: any) => m && typeof m === 'object' && 'messages' in m);

export function parseTinder(j: any): MatchThread[] {
  if (!looksTinder(j)) return [];
  return (j.Messages as any[]).map((m, i) => {
    const lines: ChatLine[] = (Array.isArray(m.messages) ? m.messages : [])
      // gifs, gestures, games and contact cards aren't words; a type of "1" is plain text
      .filter((x: any) => x && (x.type == null || String(x.type) === '1'))
      .map((x: any) => ({ at: toTime(x.sent_date), text: unescapeHtml(x.message ?? ''), mine: x.from == null || /^you$/i.test(String(x.from)) ? true : null }));
    return { id: `t${i}`, matchedAt: null, weMet: null, lines: cap(lines) };
  }).filter(t => t.lines.length);
}

// ------------------------------------------------------------------------------------------------------------- Hinge
// matches.json: [{ like?: [{ timestamp, like: [{ timestamp, comment? }] }], match?: [{ timestamp }], chats?: [{ body,
// timestamp }], we_met?: [{ timestamp, did_meet_subject }], block?: [...] }]. Only the person's own messages are in it.
const HINGE_KEYS = ['chats', 'match', 'like', 'we_met', 'block', 'voice_notes'];
export const looksHinge = (j: any) => Array.isArray(j) && j.length > 0 && j.every((t: any) => t && typeof t === 'object' && !Array.isArray(t) && Object.keys(t).length > 0 && Object.keys(t).every(k => HINGE_KEYS.includes(k)));

export function parseHinge(j: any): MatchThread[] {
  if (!looksHinge(j)) return [];
  return (j as any[]).map((t, i) => {
    const matchedAt = Array.isArray(t.match) && t.match.length ? toTime(t.match[0]?.timestamp) : null;
    if (matchedAt == null) return null;            // a like that never matched, or a removal: not a story
    const lines: ChatLine[] = [];
    for (const l of Array.isArray(t.like) ? t.like : []) for (const r of Array.isArray(l?.like) ? l.like : []) if (r?.comment) lines.push({ at: toTime(r.timestamp ?? l.timestamp), text: unescapeHtml(r.comment), mine: true });
    for (const c of Array.isArray(t.chats) ? t.chats : []) lines.push({ at: toTime(c?.timestamp), text: unescapeHtml(c?.body ?? ''), mine: true });
    const met = (Array.isArray(t.we_met) ? t.we_met : []).find((w: any) => /^(yes|true)$/i.test(String(w?.did_meet_subject ?? '')));
    return { id: `h${i}`, matchedAt, weMet: met ? toTime(met.timestamp) : null, lines: cap(lines) };
  }).filter((t): t is MatchThread => !!t);
}

// ----------------------------------------------------------------------------------------------------------- generic
// For apps whose export format isn't verified (Bumble, Grindr, happn, OkCupid...): any array of objects with a text and
// a time, grouped by a conversation key when there is one. Sides are only trusted when the export says so outright.
const TEXT_KEYS = ['message', 'body', 'text', 'content', 'msg'];
const TIME_KEYS = ['sent_date', 'timestamp', 'sent_at', 'sentAt', 'created_at', 'createdAt', 'date', 'time'];
const GROUP_KEYS = ['match_id', 'conversation_id', 'conversationId', 'chat_id', 'thread_id', 'match', 'conversation', 'recipient', 'to'];
const firstKey = (o: any, keys: string[]) => keys.find(k => o && o[k] != null && o[k] !== '');
function sideOf(o: any): boolean | null {
  const from = o.from ?? o.sender ?? o.author ?? o.direction ?? o.type;
  if (o.is_mine === true || o.isMine === true || o.mine === true) return true;
  if (typeof from === 'string' && /^(you|me|self|sent|outgoing|out)$/i.test(from)) return true;
  return null;
}

export function parseGeneric(j: any): MatchThread[] {
  const out: MatchThread[] = [];
  const seen = new Set<any>();
  const visit = (node: any, depth: number) => {
    if (!node || typeof node !== 'object' || depth > 6 || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      const msgs = node.filter(o => o && typeof o === 'object' && !Array.isArray(o) && firstKey(o, TEXT_KEYS) && typeof o[firstKey(o, TEXT_KEYS)!] === 'string' && firstKey(o, TIME_KEYS));
      if (msgs.length >= 1 && msgs.length >= node.length / 2) {
        const gk = GROUP_KEYS.find(k => msgs.every(o => o[k] != null && typeof o[k] !== 'object'));
        const groups = new Map<string, any[]>();
        for (const o of msgs) { const k = gk ? String(o[gk]) : 'all'; groups.set(k, [...(groups.get(k) ?? []), o]); }
        for (const list of groups.values()) {
          const lines = list.map(o => ({ at: toTime(o[firstKey(o, TIME_KEYS)!]), text: unescapeHtml(o[firstKey(o, TEXT_KEYS)!]), mine: sideOf(o) }));
          out.push({ id: `g${out.length}`, matchedAt: null, weMet: null, lines: cap(lines) });
        }
        return;
      }
      node.forEach(x => visit(x, depth + 1));
      return;
    }
    // A thread object: { messages: [...] } or { chats: [...] } nested under a match
    for (const v of Object.values(node)) visit(v, depth + 1);
  };
  visit(j, 0);
  return out.filter(t => t.lines.length);
}

/** Reads one parsed JSON file with the parser its shape calls for */
export function parseExportJson(j: any): ImportResult | null {
  if (looksTinder(j)) return { app: 'tinder', threads: parseTinder(j) };
  if (looksHinge(j)) return { app: 'hinge', threads: parseHinge(j) };
  const g = parseGeneric(j);
  return g.length ? { app: 'generic', threads: g } : null;
}

export interface ExportFile { name: string; bytes: Uint8Array }

/** A dropped export: a zip (every JSON inside is tried, the chat files first) or a JSON file. Null when nothing reads. */
export async function readExport(files: ExportFile[]): Promise<ImportResult | null> {
  const jsons: { name: string; read: () => Promise<Uint8Array> }[] = [];
  for (const f of files) {
    if (isZip(f.bytes)) {
      for (const e of listZip(f.bytes)) if (/\.json$/i.test(e.name) && !/(^|\/)__MACOSX\//.test(e.name)) jsons.push(e);
    } else jsons.push({ name: f.name, read: async () => f.bytes });
  }
  // data.json (Tinder) and matches.json (Hinge) first; media, prompts and user files can't hold a match
  const rank = (n: string) => /(^|\/)(data|matches|messages|chats?|conversations?)\.json$/i.test(n) ? 0 : /(user|prompts|media|subscriptions|selfie)/i.test(n) ? 2 : 1;
  jsons.sort((x, y) => rank(x.name) - rank(y.name));
  const dec = new TextDecoder();
  for (const f of jsons) {
    let j: any;
    try { j = JSON.parse(dec.decode(await f.read()).replace(/^﻿/, '')); } catch { continue; }
    const r = parseExportJson(j);
    if (r && r.threads.length) return r;
  }
  return null;
}

// ------------------------------------------------------------------------------------------------------ the right one

export interface MatchHint { partnerName?: string | null; around?: number | null; words?: string | null }
export interface Candidate { id: string; score: number; matchedAt: number | null; firstAt: number | null; lastAt: number | null; count: number; preview: string; weMet: boolean }

const DAY = 86_400_000;
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/**
 * The matches most likely to be the partner, best first. Names are often hidden in exports, so it leans on what is
 * there: their first name in the person's own lines ("Hi Sam"), the day they think they matched, words they remember,
 * Hinge's "we met", and a long conversation that ran until the person stopped using the app.
 */
export function rankMatches(threads: MatchThread[], hint: MatchHint = {}, limit = 8): Candidate[] {
  const name = norm(String(hint.partnerName ?? '').trim().split(/\s+/)[0] ?? '');
  const words = norm(String(hint.words ?? '').trim());
  const latest = Math.max(0, ...threads.map(t => t.lines[t.lines.length - 1]?.at ?? t.matchedAt ?? 0));
  return threads.map(t => {
    const firstAt = t.lines.find(l => l.at != null)?.at ?? null;
    const lastAt = [...t.lines].reverse().find(l => l.at != null)?.at ?? null;
    const all = norm(t.lines.map(l => l.text).join(' \n '));
    let score = Math.min(3, Math.log2(1 + t.lines.length));
    if (name.length >= 2 && new RegExp(`(^|[^\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(all)) score += 6;
    if (words.length >= 3 && all.includes(words)) score += 6;
    const when = t.matchedAt ?? firstAt;
    if (hint.around && when) { const d = Math.abs(when - hint.around) / DAY; score += d <= 3 ? 6 : d <= 14 ? 4 : d <= 60 ? 2 : 0; }
    if (t.weMet) score += 4;
    if (lastAt && latest && latest - lastAt < 30 * DAY && t.lines.length >= 10) score += 1;
    const preview = (t.lines.find(l => l.text.length >= 2)?.text ?? '').slice(0, 80);
    return { id: t.id, score, matchedAt: t.matchedAt, firstAt, lastAt, count: t.lines.length, preview, weMet: !!t.weMet };
  }).sort((x, y) => y.score - x.score || y.count - x.count).slice(0, limit);
}

/** Keeps the chosen match and lets go of every other one: the caller replaces what it held with this */
export function keepOnly(result: ImportResult, id: string): MatchThread | null {
  const kept = result.threads.find(t => t.id === id) ?? null;
  result.threads.length = 0;
  return kept ? { ...kept, lines: kept.lines.map(l => ({ ...l })) } : null;
}

// Plans for a first date, in the languages Belluh speaks
const PLAN = /\b(drinks?|a drink|coffee|dinner|lunch|brunch|grab a|meet up|meet you|wanna meet|want to meet|go out|this (weekend|saturday|sunday|friday)|on (saturday|sunday|friday|thursday)|tomorrow night|first date|un verre|boire un|un café|dîner|déjeuner|se voir|on se voit|ce week-end|un caffè|aperitivo|cena|pranzo|ci vediamo|uscire|kaffee|treffen|abendessen|auf einen drink|wochenende|tomar algo|un café|cenar|quedar|quedamos|nos vemos|este finde|um café|jantar|almoçar|nos vemos|bora sair|fim de semana)\b|飲み|カフェ|ご飯|ごはん|ランチ|ディナー|会いません|会いたい|今度|週末|喝咖啡|吃饭|吃個飯|见面|見面|约会|週末|周末|만나|커피|저녁|밥 먹|주말/i;
/** The first line that plans the first date, if the conversation shows one */
export const firstPlanLine = (lines: ChatLine[]) => lines.find(l => PLAN.test(l.text)) ?? null;

/** A few of the first lines worth keeping: real sentences, not one-word replies, first ones first */
export function openingLines(lines: ChatLine[], n = 6): ChatLine[] {
  const plan = firstPlanLine(lines);
  const out = lines.filter(l => l.text.replace(/\s/g, '').length >= 2).slice(0, n);
  if (plan && !out.includes(plan)) out.push(plan);
  return out;
}

// ------------------------------------------------------------------------------------------------------------- saving

/** The app's name may go in the shared story: never by default in discreet mode, or for an app that hints at sexuality */
export const showAppByDefault = (app: Pick<DatingApp, 'sensitive'> | null, discreet: boolean) => !!app && !discreet && !app.sensitive;

export const FROM_DATING_APP = 'from_dating_app';
const p2 = (n: number) => String(n).padStart(2, '0');
/** The local calendar day of a time, YYYY-MM-DD */
export const dayOf = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };

export interface ChapterInput {
  userId: string; circleId: string; shared: boolean;
  app: DatingApp | null;
  /** The person chose to name the app in their story */
  showApp: boolean;
  matchedDay: string | null;          // YYYY-MM-DD
  /** The chapter's words, already written in the reader's language (with or without the app's name) */
  text: string;
  title: string;
  /** Lines they ticked */
  lines: ChatLine[];
  /** The occasion's label, e.g. "The day we matched" */
  dayLabel: string;
}

export interface ChapterEntry { user_id: string; content: string; title: string; type: string; is_shared: boolean; date: string; tags: string[] }
export interface ChapterOccasion { user_id: string; kind: 'anniversary'; label: string; month: number; day: number; year: number; repeats_yearly: true; source: 'app' }
/** The partner's words, held until the partner approves them (supabase table story_approvals) */
export interface ChapterPending { owner_id: string; title: string; lines: string[]; day: string; is_shared: boolean; tags: string[] }
export interface ChapterRows { entry: ChapterEntry; occasion: ChapterOccasion | null; pending: ChapterPending | null }

export const quote = (s: string) => `“${s.replace(/^["“”]+|["“”]+$/g, '').trim()}”`;

/**
 * The rows to save. Lines the export says the person wrote go into the entry. Any other line may be the partner's
 * words, so it waits for the partner's yes (pending). The app's name and tag appear only when showApp is on.
 */
export function chapterRows(c: ChapterInput): ChapterRows {
  const tags = [`circle:${c.circleId}`, FROM_DATING_APP, ...(c.showApp && c.app ? [`dating_app:${c.app.id}`] : [])];
  const mine = c.lines.filter(l => l.mine === true).map(l => quote(l.text));
  const theirs = c.lines.filter(l => l.mine !== true).map(l => l.text.trim()).filter(Boolean);
  const day = c.matchedDay ?? dayOf(c.lines.find(l => l.at != null)?.at ?? Date.now());
  const entry: ChapterEntry = {
    user_id: c.userId, title: c.title, type: 'Milestone', is_shared: c.shared, date: `${day}T12:00:00.000Z`, tags,
    content: [c.text, ...mine].filter(Boolean).join('\n\n'),
  };
  let occasion: ChapterOccasion | null = null;
  if (c.matchedDay && /^\d{4}-\d{2}-\d{2}$/.test(c.matchedDay)) {
    const [y, m, d] = c.matchedDay.split('-').map(Number);
    occasion = { user_id: c.userId, kind: 'anniversary', label: c.dayLabel.slice(0, 120), month: m, day: d, year: y, repeats_yearly: true, source: 'app' };
  }
  const pending: ChapterPending | null = theirs.length ? { owner_id: c.userId, title: c.title, lines: theirs.slice(0, 12).map(s => s.slice(0, 500)), day, is_shared: c.shared, tags } : null;
  return { entry, occasion, pending };
}
