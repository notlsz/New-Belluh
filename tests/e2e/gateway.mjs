// Stand-in for Supabase's API gateway: /rest/v1 -> PostgREST, /auth/v1/user -> JWT check, /functions/v1/<name> -> Deno
import http from 'node:http';
import crypto from 'node:crypto';
const SECRET = process.env.JWT_SECRET;
const FN = { 'belluh-agent': 8101, 'gemini-proxy': 8102, 'belluh-weekly': 8103, 'whatsapp-webhook': 8104, 'occasion-reminders': 8105, 'belluh-calendar': 8106, 'sms-webhook': 8107, 'belluh-push': 8108, 'belluh-nudges': 8109, 'telegram-webhook': 8110, 'linq-webhook': 8111, 'vapi-webhook': 8112 };
const STORE = new Map(); // bucket/path -> { type, body }
const NO_VERIFY_JWT = new Set(['belluh-weekly', 'whatsapp-webhook', 'occasion-reminders', 'belluh-calendar', 'sms-webhook', 'belluh-nudges', 'telegram-webhook', 'linq-webhook', 'vapi-webhook']); // cron jobs check their own secret; the calendar feed checks its token
const verify = (tok) => {
  const [h, p, s] = (tok || '').split('.');
  if (!s) return null;
  const sig = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
  if (sig !== s) return null;
  return JSON.parse(Buffer.from(p, 'base64url').toString());
};
const forward = (req, res, port, path) => {
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
    const body = Buffer.concat(chunks);
    const r = http.request({ host: '127.0.0.1', port, path, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${port}` } }, up => {
      res.writeHead(up.statusCode, up.headers); up.pipe(res);
    });
    r.on('error', e => { res.writeHead(502); res.end(String(e)); });
    r.end(body);
  });
};
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer, accept-profile, content-profile, range, x-supabase-api-version', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': 'content-range' };
http.createServer((req, res) => {
  // Like Supabase's gateway: answer browser preflights and allow cross-origin calls
  const wh = res.writeHead.bind(res);
  res.writeHead = (code, headers = {}) => wh(code, { ...headers, ...CORS });
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://x');
  // Minimal storage stand-in (service role only), enough to test moving old media
  const st = /^\/storage\/v1\/object\/(?:(public)\/)?([\w-]+)\/(.+)$/.exec(u.pathname);
  if (st) {
    const [, isPublic, bucket, rawPath] = st;
    const key = `${bucket}/${decodeURIComponent(rawPath)}`;
    const claims = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!(isPublic && req.method === 'GET' && bucket === 'journal-media') && claims?.role !== 'service_role') { res.writeHead(403); return res.end('forbidden'); }
    if (req.method === 'GET') {
      const o = STORE.get(key);
      if (!o) { res.writeHead(404); return res.end('{"error":"not_found"}'); }
      res.writeHead(200, { 'content-type': o.type }); return res.end(o.body);
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
        if (STORE.has(key) && req.headers['x-upsert'] !== 'true') { res.writeHead(409); return res.end('exists'); }
        STORE.set(key, { type: req.headers['content-type'] || 'application/octet-stream', body: Buffer.concat(chunks) });
        res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ Key: key }));
      });
      return;
    }
    if (req.method === 'DELETE') { const had = STORE.delete(key); res.writeHead(had ? 200 : 404); return res.end(); }
  }
  if (u.pathname === '/__storage') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify([...STORE.keys()])); }
  if (u.pathname.startsWith('/rest/v1')) return forward(req, res, 3001, req.url.replace('/rest/v1', '') || '/');
  // Password sign-in for the login-screen test (local test accounts only, one shared test password)
  if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'password') {
    const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', async () => {
      const { email, password } = JSON.parse(Buffer.concat(chunks).toString() || '{}');
      const ids = { 'maya@test.com': '11111111-1111-1111-1111-111111111111', 'dan@test.com': '22222222-2222-2222-2222-222222222222', 'jimmy@test.com': 'aaaaaaaa-0000-0000-0000-000000000001' };
      if (!ids[email] || password !== process.env.TEST_PASSWORD) { res.writeHead(400, { 'content-type': 'application/json' }); return res.end('{"error":"invalid_grant","error_description":"Invalid login credentials"}'); }
      const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
      const exp = Math.floor(Date.now() / 1000) + 3600, h = b({ alg: 'HS256', typ: 'JWT' }), pl = b({ sub: ids[email], email, role: 'authenticated', aud: 'authenticated', exp });
      const access_token = `${h}.${pl}.${crypto.createHmac('sha256', SECRET).update(`${h}.${pl}`).digest('base64url')}`;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ access_token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'local', user: { id: ids[email], email, aud: 'authenticated', role: 'authenticated', created_at: '2025-04-04T00:00:00Z', app_metadata: { provider: 'email' }, user_metadata: {} } }));
    });
    return;
  }
  if (u.pathname === '/auth/v1/logout') { res.writeHead(204); return res.end(); }
  if (u.pathname === '/auth/v1/user') {
    const c = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!c || !c.sub) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"message":"invalid"}'); }
    res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: c.sub, aud: 'authenticated', role: 'authenticated', email: c.email }));
  }
  const m = /^\/functions\/v1\/([\w-]+)/.exec(u.pathname);
  if (m && FN[m[1]]) {
    if (req.method !== 'OPTIONS' && !NO_VERIFY_JWT.has(m[1])) {
      const c = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!c) { res.writeHead(401); return res.end('Invalid JWT'); } // Supabase verifies JWTs before functions run
    }
    return forward(req, res, FN[m[1]], '/' + u.search);
  }
  res.writeHead(404); res.end('no route');
}).listen(3000, () => console.log('gateway on 3000'));
