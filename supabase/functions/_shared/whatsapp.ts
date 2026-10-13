// Thin client for the WhatsApp Cloud API and Gemini. Reads secrets from the edge function environment.

// WHATSAPP_API_BASE points tests at a stand-in for Meta's servers
const GRAPH = Deno.env.get('WHATSAPP_API_BASE') ?? 'https://graph.facebook.com/v21.0';

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
}

async function post(payload: unknown): Promise<string | null> {
  const res = await fetch(`${GRAPH}/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('WHATSAPP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('WhatsApp send failed', res.status, JSON.stringify(json).slice(0, 500));
    return null;
  }
  return json?.messages?.[0]?.id ?? null;
}

/** Free-form text. Only allowed inside the 24-hour window after the user's last message. */
export function sendText(toE164: string, body: string) {
  return post({
    messaging_product: 'whatsapp',
    to: toE164.replace('+', ''),
    type: 'text',
    text: { body: body.slice(0, 4000), preview_url: false },
  });
}

/** A Meta-approved template; required for anything sent outside the 24-hour window. */
export function sendTemplate(toE164: string, name: string, params: string[], language = 'en_US') {
  return post({
    messaging_product: 'whatsapp',
    to: toE164.replace('+', ''),
    type: 'template',
    template: {
      name,
      language: { code: language },
      components: [{ type: 'body', parameters: params.map(text => ({ type: 'text', text: text.slice(0, 200) })) }],
    },
  });
}

/** Asks Gemini for structured dates. Returns the parsed JSON, or null on any failure. */
export async function geminiJson(prompt: string, schema: unknown): Promise<unknown | null> {
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
  try {
    const res = await fetch(`${Deno.env.get('GEMINI_API_BASE') ?? 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env('GEMINI_API_KEY') },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0 },
      }),
    });
    if (!res.ok) {
      console.error('Gemini failed', res.status, (await res.text()).slice(0, 500));
      return null;
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error('Gemini error', e);
    return null;
  }
}
