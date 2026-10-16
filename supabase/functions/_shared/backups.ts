// Backup AI providers. Gemini answers first; when it can't (out of free quota, down, or refusing the request), the same
// turn continues on the next provider that has a key: Groq, then Cerebras, then OpenRouter. All three speak the OpenAI
// chat format with tool calling, so Belluh's tools, prompts and conversation carry over unchanged. Groq and Cerebras do
// not train on what they're sent. A provider with no key is simply skipped.

import type { GeminiContent, GeminiPart } from './gemini.ts';

export interface Backup { name: string; base: string; key: string; model: string }

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };

/** The backups that have keys, in order. */
export function backups(): Backup[] {
  const list: Backup[] = [
    { name: 'groq', base: env('GROQ_API_BASE') || 'https://api.groq.com/openai/v1', key: env('GROQ_API_KEY') ?? '', model: env('GROQ_MODEL') || 'openai/gpt-oss-120b' },
    { name: 'cerebras', base: env('CEREBRAS_API_BASE') || 'https://api.cerebras.ai/v1', key: env('CEREBRAS_API_KEY') ?? '', model: env('CEREBRAS_MODEL') || 'gpt-oss-120b' },
    { name: 'openrouter', base: env('OPENROUTER_API_BASE') || 'https://openrouter.ai/api/v1', key: env('OPENROUTER_API_KEY') ?? '', model: env('OPENROUTER_MODEL') || 'openai/gpt-oss-120b' },
  ];
  return list.filter(b => b.key);
}

/** Gemini's schema dialect ("OBJECT", "STRING", nullable) as standard JSON Schema. */
export function toJsonSchema(s: any): any {
  if (!s || typeof s !== 'object') return s;
  const out: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === 'type' && typeof v === 'string') out.type = v.toLowerCase();
    else if (k === 'nullable') continue;
    else if (k === 'properties' && v && typeof v === 'object') out.properties = Object.fromEntries(Object.entries(v as any).map(([pk, pv]) => [pk, toJsonSchema(pv)]));
    else if (k === 'items') out.items = toJsonSchema(v);
    else out[k] = v;
  }
  if (s.nullable && typeof out.type === 'string') out.type = [out.type, 'null'];
  return out;
}

/** Belluh's tool declarations, as OpenAI-style tools. */
export const toOpenAITools = (decls: any[]) => decls.map(d => ({
  type: 'function',
  function: { name: d.name, description: d.description ?? '', parameters: toJsonSchema(d.parameters ?? { type: 'OBJECT', properties: {} }) },
}));

/** A Gemini conversation as OpenAI chat messages; tool calls and their results are paired by id, in order. */
export function toOpenAIMessages(system: string, contents: GeminiContent[]): any[] {
  const messages: any[] = [{ role: 'system', content: system }];
  let n = 0;
  const pending: string[] = [];
  for (const c of contents) {
    const parts = c.parts ?? [];
    const text = parts.filter(p => typeof p.text === 'string' && !(p as any).thought).map(p => p.text).join('');
    if (c.role === 'model') {
      const calls = parts.filter(p => p.functionCall).map(p => {
        const id = `call_${++n}`; pending.push(id);
        return { id, type: 'function', function: { name: p.functionCall!.name, arguments: JSON.stringify(p.functionCall!.args ?? {}) } };
      });
      messages.push({ role: 'assistant', content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
    } else {
      for (const p of parts) {
        const fr = (p as any).functionResponse;
        if (fr) messages.push({ role: 'tool', tool_call_id: pending.shift() ?? `call_${++n}`, content: JSON.stringify(fr.response ?? {}) });
      }
      if (text) messages.push({ role: 'user', content: text });
    }
  }
  return messages;
}

/** An OpenAI chat reply as a Gemini turn, so the rest of the loop doesn't care who answered. */
export function fromOpenAIMessage(m: any): GeminiContent | null {
  if (!m) return null;
  const parts: GeminiPart[] = [];
  if (typeof m.content === 'string' && m.content.trim()) parts.push({ text: m.content });
  for (const tc of m.tool_calls ?? []) {
    let args: Record<string, unknown> = {};
    try { args = typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments || '{}') : (tc.function?.arguments ?? {}); } catch { args = {}; }
    if (tc.function?.name) parts.push({ functionCall: { name: tc.function.name, args } });
  }
  return parts.length ? { role: 'model', parts } : null;
}

/** One request to a backup. Returns null on any failure, so the caller moves to the next one. */
export async function askBackup(b: Backup, body: { system: string; contents: GeminiContent[]; tools?: any[]; toolsOn?: boolean; json?: boolean; temperature?: number }, fetchImpl: typeof fetch = fetch): Promise<GeminiContent | null> {
  const req: any = {
    model: b.model,
    messages: toOpenAIMessages(body.system, body.contents),
    temperature: body.temperature ?? 0.7,
    max_tokens: 4096,
  };
  if (body.tools?.length) { req.tools = toOpenAITools(body.tools); req.tool_choice = body.toolsOn === false ? 'none' : 'auto'; }
  if (body.json) req.response_format = { type: 'json_object' };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetchImpl(`${b.base}/chat/completions`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${b.key}`, ...(b.name === 'openrouter' ? { 'HTTP-Referer': 'https://belluh.com', 'X-Title': 'Belluh' } : {}) },
      body: JSON.stringify(req),
    }).finally(() => clearTimeout(timer));
    if (!res.ok) { console.error('Backup failed', b.name, res.status, (await res.text()).slice(0, 300)); return null; }
    const json = await res.json();
    return fromOpenAIMessage(json?.choices?.[0]?.message);
  } catch (e) {
    console.error('Backup failed', b.name, String(e).slice(0, 200));
    return null;
  }
}
