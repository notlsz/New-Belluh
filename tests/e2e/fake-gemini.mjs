// Scripted stand-in for Gemini. Records every request so the test can check what Belluh sent.
import http from 'node:http';
import fs from 'node:fs';
const LOG = process.env.GEMINI_LOG;
const reply = (res, parts) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] })); };
http.createServer((req, res) => {
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    fs.appendFileSync(LOG, JSON.stringify({ url: req.url, key: req.headers['x-goog-api-key'], body }) + '\n');
    const last = body.contents?.at(-1)?.parts ?? [];
    const lastText = last.map(p => p.text ?? '').join(' ').toLowerCase();
    const hasToolResult = last.some(p => p.functionResponse);
    const props = body.generationConfig?.responseSchema?.properties ?? {};
    if (props.action) return reply(res, [{ text: JSON.stringify({ action: 'Take a twenty-minute walk after dinner, phones at home.', why: 'You both wrote about quiet dinners this week.' }) }]);
    if (props.insight) return reply(res, [{ text: JSON.stringify({ insight: 'Dinner came up for both of you this week, and both times it went quiet. This week, try the walk together.' }) }]);
    if (body.generationConfig?.responseMimeType === 'application/json') {
      return reply(res, [{ text: JSON.stringify({ reply: 'Three weeks ago you wrote about the same quiet dinner. Is work heavy for Dan right now?' }) }]);
    }
    if (body.tools && !hasToolResult) {
      if (lastText.includes('remember')) return reply(res, [{ functionCall: { name: 'remember_fact', args: { fact: 'Dan needs ten minutes to himself after work.' } } }]);
      if (lastText.includes('tell dan')) return reply(res, [{ functionCall: { name: 'draft_note_to_partner', args: { text: "I miss you. Saturday coffee, phones away?" } } }]);
      if (lastText.includes('birthday')) return reply(res, [{ functionCall: { name: 'save_date', args: { label: "Dan's birthday", month: 10, day: 20, repeats_yearly: true } } }]);
      if (lastText.includes('forget')) return reply(res, [{ functionCall: { name: 'forget_memory', args: { query: 'e' } } }]);
    }
    if (hasToolResult) return reply(res, [{ text: 'Done. ' + JSON.stringify(last[0].functionResponse.response).slice(0, 120) }]);
    return reply(res, [{ text: 'Plain reply from the model.' }]);
  });
}).listen(3002, () => console.log('fake gemini on 3002'));
