// Stand-in for Supabase's API gateway: /rest/v1 -> PostgREST, /auth/v1/user -> JWT check, /functions/v1/<name> -> Deno
import http from 'node:http';
import crypto from 'node:crypto';
const SECRET = process.env.JWT_SECRET;
const FN = { 'belluh-agent': 8101, 'gemini-proxy': 8102 };
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
  if (u.pathname.startsWith('/rest/v1')) return forward(req, res, 3001, req.url.replace('/rest/v1', '') || '/');
  if (u.pathname === '/auth/v1/user') {
    const c = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!c || !c.sub) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"message":"invalid"}'); }
    res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: c.sub, aud: 'authenticated', role: 'authenticated', email: c.email }));
  }
  const m = /^\/functions\/v1\/([\w-]+)/.exec(u.pathname);
  if (m && FN[m[1]]) {
    if (req.method !== 'OPTIONS') {
      const c = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!c) { res.writeHead(401); return res.end('Invalid JWT'); } // Supabase verifies JWTs before functions run
    }
    return forward(req, res, FN[m[1]], '/');
  }
  res.writeHead(404); res.end('no route');
}).listen(3000, () => console.log('gateway on 3000'));
