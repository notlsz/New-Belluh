// Server-side Gemini calls with function calling. The API key never reaches the browser. When Gemini can't answer
// (out of quota, down), the turn carries on with a backup provider (backups.ts).

import { backups, askBackup, toJsonSchema, type Backup } from './backups.ts';

export interface GeminiPart { text?: string; inlineData?: { mimeType: string; data: string }; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: unknown }
export interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }

const MODEL = () => Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
// The agent (chat, texting, acting) runs on Google's newest generally available Flash model, which plans tool use and
// writes far better than 2.5. If that model ever refuses the request, the turn falls back to MODEL() on its own.
const AGENT_MODEL = () => Deno.env.get('GEMINI_AGENT_MODEL') || 'gemini-3.8-flash';

// 2.5 models spend output tokens on hidden "thinking"; short, warm replies don't need it
export const thinkingFor = (model: string) => (model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {});

/** Generation settings per model family: 3.x thinks for itself and wants temperature 1; 2.5 replies straight away. */
const genFor = (model: string, temperature: number) => (model.startsWith('gemini-2.5') ? { temperature, maxOutputTokens: 8192, ...thinkingFor(model) } : { temperature: 1, maxOutputTokens: 8192 });

async function call(body: unknown, model = MODEL()): Promise<GeminiContent | null> {
  const r = await callRaw(body, model);
  return r.ok ? r.content : null;
}

async function callRaw(body: unknown, model: string): Promise<{ ok: boolean; status: number; content: GeminiContent | null }> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Missing secret GEMINI_API_KEY');
  const res = await fetch(`${Deno.env.get('GEMINI_API_BASE') ?? 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('Gemini failed', model, res.status, (await res.text()).slice(0, 500));
    return { ok: false, status: res.status, content: null };
  }
  const json = await res.json();
  return { ok: true, status: res.status, content: json?.candidates?.[0]?.content ?? null };
}

/**
 * Runs a conversation turn, executing tool calls through `runTool` until the model answers in text
 * (at most `maxRounds` tool rounds). Returns the final text, or null if the model failed.
 */
/** True when a reply parrots tool output ("ok: true", "note:", JSON keys) instead of talking to the person. */
export function looksLikeToolEcho(text: string): boolean {
  return /\b(?:ok|success)\s*["']?\s*[:=]\s*["']?(?:true|false)\b|\bstatus\s*["']?\s*:\s*["']?(?:done|could not)|\bprivate_guidance\b|"\w+"\s*:|functionResponse|function_?call|tool_code|default_api|already_saved|^\s*done\.?\s*(?:ok\b|note\b|\{)/i.test(text);
}

// What the model sees after a tool runs: plainly marked as private guidance, so it talks instead of quoting it
const forModel = (r: Record<string, unknown>) => {
  const { ok, note, error, ...rest } = r ?? {};
  return { status: ok === false || error ? 'could not do it' : 'done', ...(note || error ? { private_guidance: String(note ?? error) } : {}), ...rest };
};

const NUDGE = 'Now reply to them as Belluh, in your own words: one to three natural sentences saying what you did or found and what you would pick. Never quote tool results, their keys or their guidance.';

export async function chatWithTools(opts: {
  system: string;
  contents: GeminiContent[];
  tools: unknown[];
  runTool: (name: string, args: Record<string, unknown> | undefined) => Promise<Record<string, unknown>>;
  maxRounds?: number;
  /** Filled with the tools that worked this turn, in order */
  ran?: string[];
}): Promise<string | null> {
  const contents = [...opts.contents];
  let model = AGENT_MODEL();
  let usedTools = false;
  // Once a backup has answered in this turn, the rest of the turn stays with it
  let via: Backup | null = null;
  const viaBackup = async (toolsOn: boolean) => {
    for (const b of via ? [via] : backups()) {
      const c = await askBackup(b, { system: opts.system, contents, tools: opts.tools, toolsOn });
      if (c) { via = b; return c; }
    }
    return null;
  };
  const ask = async (toolsOn: boolean) => {
    if (via) return viaBackup(toolsOn);
    const c = await askGemini(toolsOn);
    return c ?? viaBackup(toolsOn);
  };
  const askGemini = async (toolsOn: boolean) => {
    const body = (m: string) => ({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents,
      tools: [{ functionDeclarations: opts.tools }],
      ...(toolsOn ? {} : { toolConfig: { functionCallingConfig: { mode: 'NONE' } } }),
      generationConfig: genFor(m, 0.7),
    });
    let r = await callRaw(body(model), model);
    // The newer model unavailable to this key, or a request it rejects: finish the turn on the steady one
    if (!r.ok && model !== MODEL() && [400, 403, 404].includes(r.status)) { model = MODEL(); r = await callRaw(body(model), model); }
    return r.content;
  };
  // Only visible words count as the answer (never hidden thoughts)
  const words = (c: GeminiContent) => (c.parts ?? []).filter(p => !(p as any).thought && !p.functionCall).map(p => p.text ?? '').join('').trim();
  // After acting, a reply that parrots tool output or says nothing gets one more try, in words only
  const finish = async (last: GeminiContent | null): Promise<string | null> => {
    const text = last ? words(last) : '';
    if (!usedTools || (text && !looksLikeToolEcho(text))) return text || null;
    if (last && text) contents.push({ role: 'model', parts: last.parts });
    const tail = contents[contents.length - 1];
    if (tail?.role === 'user') tail.parts = [...tail.parts, { text: NUDGE }]; else contents.push({ role: 'user', parts: [{ text: NUDGE }] });
    const again = await ask(false);
    const retry = again ? words(again) : '';
    return retry && !looksLikeToolEcho(retry) ? retry : null;
  };
  for (let round = 0; round <= (opts.maxRounds ?? 3); round++) {
    const reply = await ask(true);
    if (!reply) return usedTools ? finish(null) : null;
    const calls = (reply.parts ?? []).filter(p => p.functionCall);
    if (!calls.length) return finish(reply);
    // The model's parts go back verbatim (Gemini 3 needs its thought signatures)
    contents.push({ role: 'model', parts: reply.parts });
    const responses: GeminiPart[] = [];
    for (const p of calls) {
      const result = await opts.runTool(p.functionCall!.name, p.functionCall!.args);
      if (result?.ok !== false && !result?.error) opts.ran?.push(p.functionCall!.name);
      responses.push({ functionResponse: { name: p.functionCall!.name, response: forModel(result) } });
    }
    usedTools = true;
    contents.push({ role: 'user', parts: responses });
  }
  // Still calling tools after every round: ask for the words
  return finish(null);
}

/** One structured JSON answer, no tools. */
export async function jsonAnswer(system: string, prompt: string, schema: unknown, images: { mimeType: string; data: string }[] = []): Promise<unknown | null> {
  const reply = await call({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [...images.map(inlineData => ({ inlineData })), { text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.6, maxOutputTokens: 8192, ...thinkingFor(MODEL()) },
  });
  const parse = (t: string | undefined) => { try { return t ? JSON.parse(t.replace(/^```(?:json)?\s*|\s*```$/g, '')) : null; } catch { return null; } };
  const out = parse(reply?.parts?.map(p => p.text ?? '').join(''));
  if (out || images.length) return out;
  // Gemini couldn't answer: the backups get the same question, with the shape spelled out
  const shaped = `${system}\n\nAnswer with one JSON object only, matching this JSON Schema:\n${JSON.stringify(toJsonSchema(schema))}`;
  for (const b of backups()) {
    const c = await askBackup(b, { system: shaped, contents: [{ role: 'user', parts: [{ text: prompt }] }], json: true, temperature: 0.6 });
    const o = parse(c?.parts?.map(p => p.text ?? '').join(''));
    if (o) return o;
  }
  return null;
}
