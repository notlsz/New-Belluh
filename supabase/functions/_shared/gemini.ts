// Server-side Gemini calls with function calling. The API key never reaches the browser.

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
export async function chatWithTools(opts: {
  system: string;
  contents: GeminiContent[];
  tools: unknown[];
  runTool: (name: string, args: Record<string, unknown> | undefined) => Promise<Record<string, unknown>>;
  maxRounds?: number;
}): Promise<string | null> {
  const contents = [...opts.contents];
  let model = AGENT_MODEL();
  for (let round = 0; round <= (opts.maxRounds ?? 3); round++) {
    const body = (m: string) => ({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents,
      tools: [{ functionDeclarations: opts.tools }],
      generationConfig: genFor(m, 0.7),
    });
    let r = await callRaw(body(model), model);
    // The newer model unavailable to this key, or a request it rejects: finish the turn on the steady one
    if (!r.ok && model !== MODEL() && [400, 403, 404].includes(r.status)) { model = MODEL(); r = await callRaw(body(model), model); }
    const reply = r.content;
    if (!reply) return null;
    const calls = (reply.parts ?? []).filter(p => p.functionCall);
    // The model's parts go back verbatim (Gemini 3 needs its thought signatures); only visible text is the answer
    if (!calls.length) return (reply.parts ?? []).filter(p => !(p as any).thought).map(p => p.text ?? '').join('').trim();
    contents.push({ role: 'model', parts: reply.parts });
    const responses: GeminiPart[] = [];
    for (const p of calls) {
      const result = await opts.runTool(p.functionCall!.name, p.functionCall!.args);
      responses.push({ functionResponse: { name: p.functionCall!.name, response: result } });
    }
    contents.push({ role: 'user', parts: responses });
  }
  return null;
}

/** One structured JSON answer, no tools. */
export async function jsonAnswer(system: string, prompt: string, schema: unknown, images: { mimeType: string; data: string }[] = []): Promise<unknown | null> {
  const reply = await call({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [...images.map(inlineData => ({ inlineData })), { text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.6, maxOutputTokens: 8192, ...thinkingFor(MODEL()) },
  });
  const text = reply?.parts?.map(p => p.text ?? '').join('');
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}
