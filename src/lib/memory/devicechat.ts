// Bella looks things up on the phone mid-chat, the app's half (the server's is supabase/functions/_shared/devicetools.ts).
// The app sends the message offering look_in_photos; when Bella asks for it, the reply carries the lookups instead of
// an answer. Each runs here, on the device (engine.runTool, sensitive items always left out), and only its text goes
// back, every line tagged [k.i]; device ids stay here. Bella's answer cites tags, which turn back into ids for the
// thumbnails. Runs only while Memory is searchable and AI answers from photos are allowed (the Privacy Center switch),
// checked again before every lookup. Pure of the network and the app: send and the engine are passed in.

import type { MemoryEngine, ToolCall, ToolName } from './types.ts';
import { isSearchable } from './types.ts';
import { checkQuestion, memLang, resolveRefs, tagResult } from '../../../supabase/functions/_shared/memoryrules.ts';

export interface DeviceStep { calls: { name: string; args: Record<string, unknown>; valid?: boolean }[]; parts: unknown[]; ticket: string }
export interface ChatReply { messages: { id: string; role: string; body: string; meta: Record<string, any>; created_at: string }[]; device?: DeviceStep }
/** One request to Bella with this `device` field (absent: an ordinary message) */
export type Send = (device: Record<string, unknown> | null) => Promise<ChatReply | null>;

export const DEVICE_ROUNDS = 3;
const OFF_TEXT = 'Not available: they turned off AI answers from their photos.';
const BAD_TEXT = 'This lookup could not run: check its arguments.';

/** May Bella look in the photos for this message? Memory searchable, AI answers allowed, and not a question it must refuse. */
export function deviceAllowed(text: string, engine: MemoryEngine | null, allowed: () => boolean, lang = 'en'): boolean {
  if (!engine || !allowed() || !isSearchable(engine.state())) return false;
  const c = checkQuestion(text, memLang(lang)) as { ok: boolean };
  return c.ok;
}

export interface DeviceChatResult {
  /** Every message the turn added, in order (the person's, then Bella's) */
  messages: ChatReply['messages'];
  /** Bella's message id -> the device ids its tags cite, most telling first (kept on this device only) */
  cites: Record<string, string[]>;
  /** Lookups that ran on the device */
  lookups: number;
  /** The last reply was null (no connection) */
  failed: boolean;
}

/**
 * Sends one message, running Bella's lookups on the device in between. `onLookup` gets each lookup as it starts, for a
 * "Looking at your trips" line. Without a usable engine it's an ordinary message.
 */
export async function chatWithDevice(o: {
  text: string; send: Send; engine: MemoryEngine | null; allowed: () => boolean; lang?: string;
  maxRounds?: number; onLookup?: (call: { name: string; args: Record<string, unknown> }) => void; citeLimit?: number;
}): Promise<DeviceChatResult> {
  const on = deviceAllowed(o.text, o.engine, o.allowed, o.lang);
  const messages: ChatReply['messages'] = [];
  const refs: Record<string, string[]> = {};
  const rounds: { parts: unknown[]; results: { text: string }[] }[] = [];
  let k = 0, lookups = 0;
  let reply = await o.send(on ? { on: true } : null);
  if (reply?.messages) messages.push(...reply.messages);
  const max = o.maxRounds ?? DEVICE_ROUNDS;
  while (reply?.device && on && rounds.length < max) {
    const step = reply.device;
    const results = [];
    for (const c of step.calls ?? []) {
      // Checked before every lookup: turning AI answers off in the Privacy Center stops the next one
      if (!o.allowed()) { results.push({ text: OFF_TEXT }); continue; }
      if (c.valid === false) { results.push({ text: BAD_TEXT }); continue; }
      const n = ++k;
      o.onLookup?.(c);
      try {
        const r = await o.engine!.runTool({ name: c.name as ToolName, args: c.args ?? {} } as ToolCall);
        const t = tagResult(n, r);
        Object.assign(refs, t.refs);
        results.push({ text: t.text });
        lookups++;
      } catch { results.push({ text: `[${n}] (nothing found)` }); }
    }
    rounds.push({ parts: step.parts, results });
    reply = await o.send({ ticket: step.ticket, rounds });
    if (reply?.messages) messages.push(...reply.messages);
  }
  const cites: Record<string, string[]> = {};
  for (const m of messages) {
    const cited = Array.isArray(m.meta?.cited) ? m.meta.cited.filter((x: unknown) => typeof x === 'string') : [];
    if (m.role === 'belluh' && cited.length) { const ids = resolveRefs(cited, refs, o.citeLimit ?? 6); if (ids.length) cites[m.id] = ids; }
  }
  return { messages, cites, lookups, failed: !reply };
}

// ---------- the photos behind Bella's answers, remembered on this device only ----------

const CITES_KEY = 'belluh_bella_cites';
const CITES_MAX = 200;
export function loadCites(): Record<string, string[]> {
  try { const v = JSON.parse(localStorage.getItem(CITES_KEY) ?? '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
export function saveCites(add: Record<string, string[]>): Record<string, string[]> {
  const next = { ...loadCites(), ...add };
  const keys = Object.keys(next);
  for (const key of keys.slice(0, Math.max(0, keys.length - CITES_MAX))) delete next[key];
  try { localStorage.setItem(CITES_KEY, JSON.stringify(next)); } catch { /* storage off: shown this visit only */ }
  return next;
}
/** Forgets them all (with the index: deleting Memory) */
export function clearCites(): void { try { localStorage.removeItem(CITES_KEY); } catch { /* nothing kept */ } }
