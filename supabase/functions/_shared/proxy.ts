// Pure request shaping for the Gemini proxy: the browser sends what it used to send to the Gemini SDK,
// and this turns it into a safe REST request. Unit-tested in Node.

export const ALLOWED_MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
// Older names the app used to send, mapped to what's current (previews get switched off)
const RENAMED: Record<string, string> = { 'gemini-3-flash-preview': 'gemini-3.8-flash', 'gemini-3.5-flash': 'gemini-3.8-flash', 'gemini-3.7-flash': 'gemini-3.8-flash' };
export const MAX_BODY_BYTES = 8 * 1024 * 1024; // voice notes arrive as base64
export const MAX_TEXT_CHARS = 60_000;

type Part = { text?: string; inlineData?: { mimeType: string; data: string } };
type Content = { role: 'user' | 'model'; parts: Part[] };

export interface ProxyRequest { model?: unknown; contents?: unknown; config?: unknown }

function toParts(x: unknown): Part[] | null {
  if (typeof x === 'string') return [{ text: x }];
  if (x && typeof x === 'object' && Array.isArray((x as any).parts)) {
    const parts: Part[] = [];
    for (const p of (x as any).parts) {
      if (typeof p?.text === 'string') parts.push({ text: p.text });
      else if (p?.inlineData && typeof p.inlineData.data === 'string' && typeof p.inlineData.mimeType === 'string'
        && /^audio\/|^image\//.test(p.inlineData.mimeType)) {
        parts.push({ inlineData: { mimeType: p.inlineData.mimeType, data: p.inlineData.data } });
      } else return null;
    }
    return parts;
  }
  return null;
}

/** Validates and converts an SDK-style request. Returns an error string instead of throwing. */
export function buildGeminiBody(req: ProxyRequest): { model: string; body: unknown } | { error: string } {
  const asked = typeof req.model === 'string' ? (RENAMED[req.model] ?? req.model) : '';
  const model = ALLOWED_MODELS.includes(asked) ? asked : 'gemini-3.8-flash';

  let contents: Content[] = [];
  if (Array.isArray(req.contents)) {
    for (const c of req.contents) {
      const parts = toParts(c);
      if (!parts) return { error: 'unsupported content' };
      contents.push({ role: (c as any)?.role === 'model' ? 'model' : 'user', parts });
    }
  } else {
    const parts = toParts(req.contents);
    if (!parts) return { error: 'unsupported content' };
    contents = [{ role: 'user', parts }];
  }
  if (!contents.length) return { error: 'empty request' };

  const textChars = contents.flatMap(c => c.parts).reduce((n, p) => n + (p.text?.length ?? 0), 0);
  if (textChars > MAX_TEXT_CHARS) return { error: 'request too long' };

  const cfg = (req.config && typeof req.config === 'object' ? req.config : {}) as Record<string, unknown>;
  // Generous cap: newer models count hidden "thinking" against it, and 2.5 models skip thinking entirely
  const generationConfig: Record<string, unknown> = { maxOutputTokens: 8192 };
  if (model.startsWith('gemini-2.5')) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  if (cfg.responseMimeType === 'application/json') generationConfig.responseMimeType = 'application/json';
  if (cfg.responseSchema && typeof cfg.responseSchema === 'object') generationConfig.responseSchema = cfg.responseSchema;
  if (typeof cfg.temperature === 'number') generationConfig.temperature = Math.max(0, Math.min(1.5, cfg.temperature));

  if (!model.startsWith('gemini-2.5') && typeof generationConfig.temperature !== 'number') generationConfig.temperature = 1;
  return { model, body: { contents, generationConfig } };
}
