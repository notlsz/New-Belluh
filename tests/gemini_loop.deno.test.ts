// Deno test: the tool loop executes model tool calls, feeds results back, and returns the final text.
// Run: deno test --allow-env tests/gemini_loop.deno.test.ts
import { chatWithTools } from '../supabase/functions/_shared/gemini.ts';

Deno.test('tool loop: runs a tool call, then returns the text answer', async () => {
  Deno.env.set('GEMINI_API_KEY', 'test');
  const bodies: any[] = [];
  const replies = [
    { candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'remember_fact', args: { fact: 'Dan needs ten minutes after work' } } }] } }] },
    { candidates: [{ content: { role: 'model', parts: [{ text: "Got it. I'll remember that." }] } }] },
  ];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify(replies.shift()), { status: 200 });
  }) as typeof fetch;
  const ran: string[] = [];
  try {
    const out = await chatWithTools({
      system: 'sys', tools: [], contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      runTool: async (name, args) => { ran.push(`${name}:${args?.fact}`); return { ok: true }; },
    });
    if (out !== "Got it. I'll remember that.") throw new Error('wrong final text: ' + out);
    if (ran.join() !== 'remember_fact:Dan needs ten minutes after work') throw new Error('tool not run: ' + ran);
    const second = bodies[1].contents;
    if (second.at(-1).parts[0].functionResponse.name !== 'remember_fact') throw new Error('tool result not sent back');
    if (bodies[0].systemInstruction.parts[0].text !== 'sys') throw new Error('system prompt missing');
  } finally { globalThis.fetch = realFetch; }
});

Deno.test('tool loop: returns null when Gemini errors', async () => {
  Deno.env.set('GEMINI_API_KEY', 'test');
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
  try {
    const out = await chatWithTools({ system: 's', tools: [], contents: [], runTool: async () => ({}) });
    if (out !== null) throw new Error('expected null');
  } finally { globalThis.fetch = realFetch; }
});
