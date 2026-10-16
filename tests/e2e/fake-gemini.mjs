// Scripted stand-in for Gemini. Records every request so the test can check what Belluh sent.
import http from 'node:http';
import fs from 'node:fs';
const LOG = process.env.GEMINI_LOG;
const reply = (res, parts) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] })); };
http.createServer((req, res) => {
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
    const rawBody = Buffer.concat(chunks).toString();
    // Stand-in for a browser push service: record the encrypted message and its headers
    if (req.url.startsWith('/push/')) {
      fs.appendFileSync(LOG, JSON.stringify({ url: req.url, push: Buffer.concat(chunks).toString('base64'), headers: { authorization: req.headers.authorization, encoding: req.headers['content-encoding'], ttl: req.headers.ttl, topic: req.headers.topic } }) + '\n');
      res.writeHead(req.url.startsWith('/push/gone') ? 410 : 201); return res.end();
    }
    // Stand-in for Twilio's SMS API (form-encoded): record what Belluh sends
    // Shopify's Global Catalog: answers with the trimmed real response in tests/fixtures-shopify-catalog.json
    if (req.url.startsWith('/shopify')) {
      fs.appendFileSync(LOG, JSON.stringify({ url: req.url, shopify: JSON.parse(Buffer.concat(chunks).toString() || '{}') }) + '\n');
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(fs.readFileSync(new URL('../fixtures-shopify-catalog.json', import.meta.url)));
    }
    if (req.url.startsWith('/twilio/')) {
      const form = Object.fromEntries(new URLSearchParams(rawBody));
      fs.appendFileSync(LOG, JSON.stringify({ url: req.url, sms: form, auth: req.headers.authorization }) + '\n');
      res.writeHead(201, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ sid: 'SM' + Date.now() + Math.random().toString(36).slice(2, 6) }));
    }
    const body = JSON.parse(rawBody || '{}');
    // Stand-in for Telegram's Bot API: record what Belluh sends
    if (req.url.startsWith('/telegram/')) {
      fs.appendFileSync(LOG, JSON.stringify({ url: req.url, telegram: body }) + '\n');
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, result: { message_id: Math.floor(Math.random() * 1e9) } }));
    }
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
    // A key without the newest model: Google answers 404 for it, and Belluh should finish on the steady one
    if (lastText.includes('older key') && !req.url.includes('gemini-2.5')) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end('{"error":{"code":404,"message":"model not found"}}'); }
    if (lastText.includes('talk like a person')) return reply(res, [{ text: '**Sure!** Here is the plan:\n- Ramen on 5th 🍜\n- Then a walk → home' }]);
    const props = body.generationConfig?.responseSchema?.properties ?? {};
    if (props.occasions) return reply(res, [{ text: JSON.stringify({ occasions: [{ label: "Dan's birthday", kind: 'birthday', month: 10, day: 20, year: null, repeats_yearly: true }] }) }]);
    if (props.action) return reply(res, [{ text: JSON.stringify({ action: 'Take a twenty-minute walk after dinner, phones at home.', why: 'You both wrote about quiet dinners this week.' }) }]);
    if (props.line) return reply(res, [{ text: JSON.stringify({ line: "Dan's birthday is in 12 days. He wrote that he misses shooting film, so I have an idea. Want me to plan it?" }) }]);
    if (props.insight) return reply(res, [{ text: JSON.stringify({ insight: 'Dinner came up for both of you this week, and both times it went quiet. This week, try the walk together.' }) }]);
    if (body.generationConfig?.responseMimeType === 'application/json') {
      return reply(res, [{ text: JSON.stringify({ reply: 'Three weeks ago you wrote about the same quiet dinner. Is work heavy for Dan right now?' }) }]);
    }
    const said = (body.contents ?? []).filter(c => c.role === 'user').flatMap(c => c.parts ?? []).map(p => p.text ?? '').join(' ').toLowerCase();
    if (lastText.includes('in your own words')) return reply(res, [{ text: said.includes('mute') ? '{"ok":true}' : "Pho is ready to order below, from the place you both loved. You just check out." }]);
    if (body.tools && !hasToolResult) {
      if (lastText.includes('plan a dinner')) {
        const day = (n) => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T19:00`; };
        return reply(res, [{ functionCall: { name: 'plan_with_partner', args: { title: 'Dinner at the Thai place', details: 'The one you both wrote about.', options: [{ start: day(3), minutes: 120 }, { start: day(4), minutes: 120, label: 'Saturday' }, { start: '2001-01-01T19:00', minutes: 60 }] } } }]);
      }
      const at = (n, h) => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}:00`; };
      if (lastText.includes('honeymoon')) return reply(res, [{ functionCall: { name: 'plan_trip', args: { to: 'Lisbon', from: 'San Jose', depart: at(200, 9).slice(0, 10), return: at(207, 9).slice(0, 10), people: 2 } } }]);
      if (lastText.includes('order us dinner')) return reply(res, [{ functionCall: { name: 'order_food', args: { what: 'pho', where: 'San Jose' } } }]);
      if (lastText.includes('get groceries for scampi')) return reply(res, [{ functionCall: { name: 'order_groceries', args: { items: ['shrimp', 'linguine', 'garlic'] } } }]);
      if (lastText.includes('get us a ride')) return reply(res, [{ functionCall: { name: 'book_ride', args: { to: 'Ramen Nagi, Palo Alto' } } }]);
      if (lastText.includes('something fun to do')) return reply(res, [{ functionCall: { name: 'find_experience', args: { what: 'jazz concert', where: 'San Francisco, CA', on: at(5, 9).slice(0, 10) } } }]);
      if (lastText.includes('buy a film camera')) return reply(res, [{ functionCall: { name: 'buy_item', args: { item: 'film camera', max_price: 150 } } }]);
      if (lastText.includes('send flowers')) return reply(res, [{ functionCall: { name: 'send_flowers', args: { what: 'peonies', where: 'Brooklyn', deliver_on: at(5, 9).slice(0, 10) } } }]);
      if (lastText.includes('become a lighthouse')) return reply(res, [{ functionCall: { name: 'take_shape', args: { label: 'lighthouse', path: 'M42 10 L58 10 L62 80 L70 80 L70 92 L30 92 L30 80 L38 80 Z' } } }]);
      if (lastText.includes('become a broken thing')) return reply(res, [{ functionCall: { name: 'take_shape', args: { label: 'x', emoji: '<img src=x>' } } }]);
      if (lastText.includes('remind me')) return reply(res, [{ functionCall: { name: 'remind_me', args: { text: 'Call his mom', at: at(2, 17) } } }]);
      if (lastText.includes('book a table')) return reply(res, [{ functionCall: { name: 'find_table', args: { what: 'ramen', where: 'San Jose', start: at(3, 19), people: 2 } } }]);
      if (lastText.includes('help me plan something for')) return reply(res, [{ functionCall: { name: 'gift_ideas', args: { ideas: ['film camera', 'poetry books'] } } }]);
      if (lastText.includes('journal this')) return reply(res, [{ functionCall: { name: 'write_entry', args: { text: 'Ramen night was perfect, we walked home the long way', shared: false } } }]);
      if (lastText.includes('sneaky')) return reply(res, [{ functionCall: { name: 'write_entry', args: { text: 'Dan is a terrible partner and I want to leave', shared: true } } }]);
      if (lastText.includes('remember')) return reply(res, [{ functionCall: { name: 'remember_fact', args: { fact: 'Dan needs ten minutes to himself after work.' } } }]);
      if (lastText.includes('tell dan')) return reply(res, [{ functionCall: { name: 'draft_note_to_partner', args: { text: "I miss you. Saturday coffee, phones away?" } } }]);
      if (lastText.includes('birthday')) return reply(res, [{ functionCall: { name: 'save_date', args: { label: "Dan's birthday", month: 10, day: 20, repeats_yearly: true } } }]);
      if (lastText.includes('pause reminders')) return reply(res, [{ functionCall: { name: 'set_reminders', args: { on: false } } }]);
      if (lastText.includes('remove the date')) return reply(res, [{ functionCall: { name: 'forget_date', args: { query: 'Lisbon trip' } } }]);
      if (lastText.includes('forget')) return reply(res, [{ functionCall: { name: 'forget_memory', args: { query: 'e' } } }]);
    }
    // After acting, Belluh talks like a person. "parrot" makes the first answer echo the tool output, so the test can
    // check that Belluh asks again for real words (the nudge) instead of showing "ok: true".
    if (hasToolResult) {
      const fr = last.find(p => p.functionResponse).functionResponse;
      if (said.includes('parrot') || said.includes('mute')) return reply(res, [{ text: 'Done. ok: true, note: ' + (fr.response.private_guidance ?? '').slice(0, 80) }]);
      if (fr.response.already_saved) return reply(res, [{ text: 'Done. I already had that one saved, so nothing new to add.' }]);
      if (fr.response.status !== 'done') return reply(res, [{ text: `I couldn't do that one. ${fr.response.private_guidance ?? ''}`.trim() }]);
      return reply(res, [{ text: `Done. ${{ order_groceries: 'Your groceries are each one tap from the cart, below.', book_ride: 'Your ride is ready below.', find_experience: 'A few things you two could do are below.', find_table: 'Your table is ready to book below.', order_food: 'Dinner is ready to order below.', buy_item: 'The best options are below, each one tap from checkout.', gift_ideas: 'A few gifts that fit him are below.', remind_me: "I'll remind you.", save_date: "Saved, I'll remind you before.", draft_note_to_partner: 'Your note is drafted for you to look over.' }[fr.name] ?? 'All set.'}` }]);
    }
    return reply(res, [{ text: 'Plain reply from the model.' }]);
  });
}).listen(3002, () => console.log('fake gemini on 3002'));
