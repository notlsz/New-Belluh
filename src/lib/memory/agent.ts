// Belluh Memory's query and profile, after Rollup: the agent runs on Belluh's server (memory-agent) and turns a
// question or a JSON Schema into tool calls; each tool runs here, on the device, against the index (engine.runTool),
// and only its text goes back. Device ids never leave: tool results are tagged with short references ([3.2]) and the
// answer's references are turned back into ids here, most telling first.
// Pure of the network and the app: the transport and the engine are passed in (tests use fakes).

import type { Answer, MemoryEngine, MemoryErrorCode, Profile, QueryUpdate, ToolCall, ToolName, JsonSchema } from './types';
import { MAX_ROUNDS, checkQuestion, resolveRefs, tagResult, validateSchema, memLang } from '../../../supabase/functions/_shared/memoryrules.ts';

/** Same shape as MemoryError in types.ts (code + message), plus retryAfter; kept here so this file runs under plain Node. */
export class MemoryAgentError extends Error {
  name = 'MemoryError';
  code: MemoryErrorCode;
  retryAfter: number | null;
  constructor(code: MemoryErrorCode, message?: string, retryAfter: number | null = null) { super(message ?? code); this.code = code; this.retryAfter = retryAfter; }
}

export type ServerEvent =
  | { type: 'partial'; text: string }
  | { type: 'tools'; calls: { name: string; args: Record<string, unknown>; valid?: boolean }[]; parts: unknown[]; ticket: string }
  | { type: 'answer'; text: string; cited: string[]; declined: boolean }
  | { type: 'profile'; json: Record<string, unknown>; evidence: Record<string, string[]>; refused: { pointer: string; reason: string }[] }
  | { type: 'error'; code: string; message: string; retryAfter?: number; reset?: string };

/** Sends one step to the server agent and yields its lines; must stop when the signal aborts. */
export type Transport = (body: Record<string, unknown>, signal: AbortSignal) => AsyncIterable<ServerEvent>;

export interface ProgressStrings {
  search: string; places: string; placesIn: string; visits: string; days: string; months: string; year: string;
  facets: string; interests: string; trips: string; tripsIn: string; thinking: string;
}
export const PROGRESS_EN: ProgressStrings = {
  search: 'Searching your photos for “{q}”', places: 'Finding your places', placesIn: 'Finding your places in {city}',
  visits: 'Looking at your visits to {place}', days: 'Counting the days', months: 'Looking at your months', year: 'Looking at {year}',
  facets: 'Looking at what you photograph most', interests: 'Looking at what you love', trips: 'Looking at your trips',
  tripsIn: 'Looking at your trips in {year}', thinking: 'Reading your index',
};

const yearOf = (a: Record<string, unknown>) => {
  const f = typeof a.from === 'string' ? a.from.slice(0, 4) : null, t = typeof a.to === 'string' ? a.to.slice(0, 4) : null;
  return f && (!t || t === f) ? f : !f && t ? t : null;
};
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

/** A line about what the agent is doing, like "Looking at your trips in 2025". */
export function progressLine(call: { name: string; args: Record<string, unknown> }, P: ProgressStrings = PROGRESS_EN): string {
  const a = call.args ?? {}, s = (k: string) => String(a[k] ?? '').slice(0, 60), y = yearOf(a);
  switch (call.name) {
    case 'search_photos': return fill(P.search, { q: s('query') });
    case 'list_places': return a.city ? fill(P.placesIn, { city: s('city') }) : P.places;
    case 'list_visits': return fill(P.visits, { place: s('place') });
    case 'count_days': return P.days;
    case 'timeline': return y ? fill(P.year, { year: y }) : P.months;
    case 'facets': return P.facets;
    case 'interests': return P.interests;
    case 'trips': return y ? fill(P.tripsIn, { year: y }) : P.trips;
    default: return P.thinking;
  }
}

export interface AgentOptions {
  engine: MemoryEngine | (() => Promise<MemoryEngine | null>);
  transport: Transport;
  /** Has the person allowed AI answers from their photos? Checked before every call. */
  allowed: () => boolean;
  lang?: string;
  progress?: ProgressStrings;
  today?: () => string;
  /** Steps before the driver gives up on a server that keeps asking for tools (the server stops at MAX_ROUNDS itself) */
  maxRounds?: number;
}

const SERVER_CODES: Record<string, MemoryErrorCode> = {
  rate_limited: 'rateLimited', quota_exceeded: 'rateLimited', not_consented: 'notConsented', invalid_schema: 'invalidSchema',
  question_too_long: 'declined', agent_unavailable: 'network', unauthorized: 'notConsented', too_large: 'invalidSchema',
};
const toError = (e: Extract<ServerEvent, { type: 'error' }>) => new MemoryAgentError(SERVER_CODES[e.code] ?? 'internal', e.message, e.retryAfter ?? null);

const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function createMemoryAgent(o: AgentOptions) {
  const lang = memLang(o.lang ?? 'en');
  const maxRounds = o.maxRounds ?? MAX_ROUNDS;
  const engine = async () => {
    const e = typeof o.engine === 'function' ? await (o.engine as () => Promise<MemoryEngine | null>)() : o.engine;
    if (!e) throw new MemoryAgentError('unsupported', 'Memory is not available on this device.');
    const s = e.state();
    const searchable = s.type === 'ready' || s.type === 'paused' || s.type === 'unfinished' || (s.type === 'indexing' && s.progress.searchable);
    if (!searchable) throw new MemoryAgentError(s.type === 'notStarted' ? 'notStarted' : 'noIndex', 'Nothing has been indexed yet.');
    return e;
  };

  /**
   * The loop both share: one server step, then the tools it asked for, run here, until a final line. Yields progress
   * and partial answers as they come; returns the final line and the references collected.
   */
  async function* run(first: Record<string, unknown>, signal: AbortSignal): AsyncGenerator<QueryUpdate, { final: ServerEvent; refs: Record<string, string[]> }> {
    if (!o.allowed()) throw new MemoryAgentError('notConsented', 'Allow AI answers from your photos first.');
    const e = await engine();
    const rounds: { parts: unknown[]; results: { name: string; text: string }[] }[] = [];
    const refs: Record<string, string[]> = {};
    let ticket: string | undefined;
    let k = 0;
    for (let step = 0; step <= maxRounds; step++) {
      if (signal.aborted) throw new MemoryAgentError('cancelled');
      let final: ServerEvent | null = null, tools: Extract<ServerEvent, { type: 'tools' }> | null = null, partial = false;
      for await (const ev of o.transport({ ...first, consent: true, lang, today: (o.today ?? localDay)(), rounds, ...(ticket ? { ticket } : {}) }, signal)) {
        if (signal.aborted) throw new MemoryAgentError('cancelled');
        if (ev.type === 'partial') { partial = partial || !!ev.text; yield { type: 'partialAnswer', text: ev.text }; }
        else if (ev.type === 'error') throw toError(ev);
        else if (ev.type === 'tools') { tools = ev; break; }
        else { final = ev; break; }
      }
      if (final) return { final, refs };
      if (!tools) throw new MemoryAgentError('network', 'The agent stopped answering.');
      // It wrote a little, then went back to reading the index: the app clears what it showed
      if (partial) yield { type: 'partialAnswer', text: '' };
      for (const c of tools.calls) yield { type: 'progress', text: progressLine(c, o.progress) };
      const results = await Promise.all(tools.calls.map(async c => {
        if (c.valid === false) return { name: c.name, text: 'This call could not run: check its arguments.' };
        const n = ++k;
        try {
          const r = await e.runTool({ name: c.name as ToolName, args: c.args ?? {} } as ToolCall);
          const t = tagResult(n, r);
          Object.assign(refs, t.refs);
          return { name: c.name, text: t.text };
        } catch { return { name: c.name, text: `[${n}] (nothing found)` }; }
      }));
      if (signal.aborted) throw new MemoryAgentError('cancelled');
      rounds.push({ parts: tools.parts, results });
      ticket = tools.ticket;
    }
    throw new MemoryAgentError('internal', 'The agent took too many steps.');
  }

  /** Streams progress lines, partial answers and the final answer. Leaving the loop cancels the question. */
  async function* queryUpdates(question: string, opts: { signal?: AbortSignal } = {}): AsyncGenerator<QueryUpdate, void> {
    const c = checkQuestion(question, lang) as any;
    if (!c.ok && !c.declined) throw new MemoryAgentError('declined', 'Questions can be up to 1,000 characters.');
    // Refused here, on the device: nothing is sent
    if (!c.ok) { yield { type: 'answer', answer: { text: c.text, assetIdentifiers: [], declined: true } }; return; }
    const ctrl = new AbortController();
    const stop = () => ctrl.abort();
    opts.signal?.addEventListener('abort', stop);
    try {
      const it = run({ kind: 'query', question: c.question }, ctrl.signal);
      for (;;) {
        const r: any = await it.next();
        if (r.done) {
          const f = r.value.final;
          if (f.type !== 'answer') throw new MemoryAgentError('internal', 'Unexpected reply.');
          const answer: Answer = { text: f.text, assetIdentifiers: f.declined ? [] : resolveRefs(f.cited ?? [], r.value.refs), declined: !!f.declined };
          yield { type: 'answer', answer };
          return;
        }
        yield r.value as QueryUpdate;
      }
    } finally {
      // Leaving the loop early (break, return, throw) aborts the request in flight
      ctrl.abort();
      opts.signal?.removeEventListener('abort', stop);
    }
  }

  async function query(question: string, opts: { signal?: AbortSignal } = {}): Promise<Answer> {
    for await (const u of queryUpdates(question, opts)) if (u.type === 'answer') return u.answer;
    throw new MemoryAgentError('internal', 'No answer.');
  }

  /** Fills a JSON Schema from the photos. Evidence comes back as device ids keyed by JSON Pointer. */
  async function profile(schema: JsonSchema, opts: { signal?: AbortSignal; onProgress?: (line: string) => void } = {}): Promise<Profile> {
    const v = validateSchema(schema) as any;
    if (!v.ok) throw new MemoryAgentError('invalidSchema', v.error);
    const ctrl = new AbortController();
    const stop = () => ctrl.abort();
    opts.signal?.addEventListener('abort', stop);
    try {
      const it = run({ kind: 'profile', schema }, ctrl.signal);
      for (;;) {
        const r: any = await it.next();
        if (r.done) {
          const f = r.value.final;
          if (f.type !== 'profile') throw new MemoryAgentError('internal', 'Unexpected reply.');
          const evidence: Record<string, string[]> = {};
          for (const [ptr, cited] of Object.entries(f.evidence ?? {})) { const ids = resolveRefs(cited as string[], r.value.refs); if (ids.length) evidence[ptr] = ids; }
          return { json: f.json, evidence, refused: f.refused ?? [] };
        }
        if (r.value.type === 'progress') opts.onProgress?.(r.value.text);
      }
    } finally {
      ctrl.abort();
      opts.signal?.removeEventListener('abort', stop);
    }
  }

  return { query, queryUpdates, profile };
}
export type MemoryAgent = ReturnType<typeof createMemoryAgent>;

/** Reads an NDJSON body line by line (the memory-agent's reply). */
export async function* ndjson(body: ReadableStream<Uint8Array>, signal: AbortSignal): AsyncGenerator<ServerEvent> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      if (signal.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (line) { try { yield JSON.parse(line) as ServerEvent; } catch { /* skip */ } }
      }
    }
    if (buf.trim()) { try { yield JSON.parse(buf.trim()) as ServerEvent; } catch { /* skip */ } }
  } finally { reader.cancel().catch(() => {}); }
}
