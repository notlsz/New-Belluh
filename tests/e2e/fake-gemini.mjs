// Scripted stand-in for Gemini. Records every request so the test can check what Belluh sent.
import http from 'node:http';
import fs from 'node:fs';
const LOG = process.env.GEMINI_LOG;
const reply = (res, parts) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] })); };
http.createServer((req, res) => {
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
    const rawBody = Buffer.concat(chunks).toString();
    // Stand-in for Twilio's SMS API (form-encoded): record what Belluh sends
    if (req.url.startsWith('/twilio/')) {
      const form = Object.fromEntries(new URLSearchParams(rawBody));
      fs.appendFileSync(LOG, JSON.stringify({ url: req.url, sms: form, auth: req.headers.authorization }) + '\n');
      res.writeHead(201, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ sid: 'SM' + Date.now() + Math.random().toString(36).slice(2, 6) }));
    }
    const body = JSON.parse(rawBody || '{}');
    // Stand-in for Meta's WhatsApp Cloud API: record what Belluh sends
    if (req.url.startsWith('/graph/')) {
      fs.appendFileSync(LOG, JSON.stringify({ url: req.url, whatsapp: body }) + '\n');
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ messages: [{ id: 'wamid.' + Date.now() + Math.random().toString(36).slice(2, 6) }] }));
    }
    fs.appendFileSync(LOG, JSON.stringify({ url: req.url, key: req.headers['x-goog-api-key'], body }) + '\n');
    const last = body.contents?.at(-1)?.parts ?? [];
    const lastText = last.map(p => p.text ?? '').join(' ').toLowerCase();
    const hasToolResult = last.some(p => p.functionResponse);
    const props = body.generationConfig?.responseSchema?.properties ?? {};
    if (props.occasions) return reply(res, [{ text: JSON.stringify({ occasions: [{ label: "Dan's birthday", kind: 'birthday', month: 10, day: 20, year: null, repeats_yearly: true }] }) }]);
    if (props.action) return reply(res, [{ text: JSON.stringify({ action: 'Take a twenty-minute walk after dinner, phones at home.', why: 'You both wrote about quiet dinners this week.' }) }]);
    if (props.insight) return reply(res, [{ text: JSON.stringify({ insight: 'Dinner came up for both of you this week, and both times it went quiet. This week, try the walk together.' }) }]);
    if (body.generationConfig?.responseMimeType === 'application/json') {
      return reply(res, [{ text: JSON.stringify({ reply: 'Three weeks ago you wrote about the same quiet dinner. Is work heavy for Dan right now?' }) }]);
    }
    if (body.tools && !hasToolResult) {
      if (lastText.includes('plan a dinner')) {
        const day = (n) => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T19:00`; };
        return reply(res, [{ functionCall: { name: 'plan_with_partner', args: { title: 'Dinner at the Thai place', details: 'The one you both wrote about.', options: [{ start: day(3), minutes: 120 }, { start: day(4), minutes: 120, label: 'Saturday' }, { start: '2001-01-01T19:00', minutes: 60 }] } } }]);
      }
      if (lastText.includes('remember')) return reply(res, [{ functionCall: { name: 'remember_fact', args: { fact: 'Dan needs ten minutes to himself after work.' } } }]);
      if (lastText.includes('tell dan')) return reply(res, [{ functionCall: { name: 'draft_note_to_partner', args: { text: "I miss you. Saturday coffee, phones away?" } } }]);
      if (lastText.includes('birthday')) return reply(res, [{ functionCall: { name: 'save_date', args: { label: "Dan's birthday", month: 10, day: 20, repeats_yearly: true } } }]);
      if (lastText.includes('pause reminders')) return reply(res, [{ functionCall: { name: 'set_reminders', args: { on: false } } }]);
      if (lastText.includes('remove the date')) return reply(res, [{ functionCall: { name: 'forget_date', args: { query: 'Lisbon trip' } } }]);
      if (lastText.includes('forget')) return reply(res, [{ functionCall: { name: 'forget_memory', args: { query: 'e' } } }]);
    }
    if (hasToolResult) return reply(res, [{ text: 'Done. ' + JSON.stringify(last[0].functionResponse.response).slice(0, 120) }]);
    return reply(res, [{ text: 'Plain reply from the model.' }]);
  });
}).listen(3002, () => console.log('fake gemini on 3002'));
