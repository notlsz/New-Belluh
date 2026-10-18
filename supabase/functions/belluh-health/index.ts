// Temporary check of which AI keys work (status codes and model names only, never keys). Needs HEALTH_TOKEN.
Deno.serve(async (req) => {
  const t = Deno.env.get('HEALTH_TOKEN');
  if (!t || req.headers.get('x-health-token') !== t) return new Response('no', { status: 403 });
  const out: Record<string, unknown> = {};
  const key = Deno.env.get('OPENAI_API_KEY');
  out.openai_key = key ? `present (${key.slice(0, 3)}…, ${key.length} chars)` : 'missing';
  if (key) {
    const m = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
    const mj = await m.json().catch(() => ({}));
    out.models_status = m.status;
    out.models_error = mj?.error?.message?.slice(0, 200);
    out.chat_models = (mj?.data ?? []).map((x: any) => x.id).filter((id: string) => /^(gpt-[45]|o\d)/.test(id) && !/audio|realtime|search|transcribe|tts|image/.test(id)).slice(0, 40);
    for (const model of ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini']) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Say hi in two words.' }],
          tools: [{ type: 'function', function: { name: 'noop', description: 'Does nothing', parameters: { type: 'object', properties: {} } } }] }),
      });
      const j = await r.json().catch(() => ({}));
      out[`chat_${model}`] = `${r.status} ${j?.error?.code ?? ''} ${j?.error?.message?.slice(0, 120) ?? (j?.choices?.[0]?.message?.content ?? '').slice(0, 40)}`;
    }
  }
  return Response.json(out);
});
