// Server-side Gemini calls with function calling. The API key never reaches the browser.

export interface GeminiPart { text?: string; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: unknown }
export interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }

const MODEL = () => Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

// 2.5 models spend output tokens on hidden "thinking"; short, warm replies don't need it
export const thinkingFor = (model: string) => (model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {});

async function call(body: unknown): Promise<GeminiContent | null> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Missing secret GEMINI_API_KEY');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('Gemini failed', res.status, (await res.text()).slice(0, 500));
    return null;
  }
  const json = await res.json();
  return json?.candidates?.[0]?.content ?? null;
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
  for (let round = 0; round <= (opts.maxRounds ?? 3); round++) {
    const reply = await call({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents,
      tools: [{ functionDeclarations: opts.tools }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, ...thinkingFor(MODEL()) },
    });
    if (!reply) return null;
    const calls = (reply.parts ?? []).filter(p => p.functionCall);
    if (!calls.length) return (reply.parts ?? []).map(p => p.text ?? '').join('').trim();
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
export async function jsonAnswer(system: string, prompt: string, schema: unknown): Promise<unknown | null> {
  const reply = await call({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.6, maxOutputTokens: 8192, ...thinkingFor(MODEL()) },
  });
  const text = reply?.parts?.map(p => p.text ?? '').join('');
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}
