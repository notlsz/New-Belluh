// Order webhooks from shops (UCP's order capability) are signed: an HTTP Message Signature (RFC 9421, ES256 over
// P-256) covering the method, host, path, Content-Digest (RFC 9530) and content type, with the key named by keyid in
// the shop's own profile (the URL in the UCP-Agent header). Belluh accepts an order event only when the digest matches
// the body, the signature checks out with a key that shop publishes, the event is fresh, and the profile belongs to
// the shop the checkout was opened at (checked by the caller with sameShop). Pure and WebCrypto only, so it's tested in Node.

const b64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));

/** The profile URL from UCP-Agent: `profile="https://shop.example/.well-known/ucp"` (an RFC 8941 dictionary). */
export function agentProfile(header: string | null): string | null {
  const m = header ? /(?:^|[,;\s])profile="(https:\/\/[^"]{1,300})"/.exec(header) : null;
  return m ? m[1] : null;
}

interface SigInput { label: string; components: string[]; params: string; keyid: string | null; created: number | null }

/** `sig1=("@method" "@path" ...);created=1;keyid="k"` as its parts. */
export function parseSignatureInput(h: string | null): SigInput | null {
  const m = h ? /^\s*([a-zA-Z0-9_-]+)=\(([^)]*)\)(.*)$/.exec(h.split(/,(?=\s*[a-zA-Z0-9_-]+=\()/)[0]) : null;
  if (!m) return null;
  const components = [...m[2].matchAll(/"([^"]+)"/g)].map(x => x[1].toLowerCase());
  const params = `(${m[2].trim()})${m[3].trim()}`;
  const keyid = /;keyid="([^"]+)"/.exec(m[3])?.[1] ?? null;
  const created = Number(/;created=(\d+)/.exec(m[3])?.[1]);
  return { label: m[1], components, params, keyid, created: Number.isFinite(created) ? created : null };
}

/** The signature base RFC 9421 signs, from the covered components; null if one is missing. */
export function signatureBase(input: SigInput, req: { method: string; authority: string; path: string; headers: Record<string, string | null> }): string | null {
  const lines: string[] = [];
  for (const c of input.components) {
    const v = c === '@method' ? req.method.toUpperCase() : c === '@authority' ? req.authority.toLowerCase() : c === '@path' ? req.path
      : c.startsWith('@') ? null : req.headers[c]?.trim() ?? null;
    if (v == null) return null;
    lines.push(`"${c}": ${v}`);
  }
  lines.push(`"@signature-params": ${input.params}`);
  return lines.join('\n');
}

export async function digestOk(header: string | null, body: string): Promise<boolean> {
  const m = header ? /sha-256=:([A-Za-z0-9+/=]+):/.exec(header) : null;
  if (!m) return false;
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
  return toB64(d) === m[1];
}

export interface Delivery { method: string; authority: string; path: string; headers: Record<string, string | null>; body: string }

/**
 * Whether this delivery is a genuine, fresh order event from the shop at `profile`. `fetchProfile` loads that shop's
 * profile JSON (its signing_keys). Required: a digest of this body, method, path and digest covered, created within
 * 15 minutes, and an ES256 signature that verifies with the key the shop publishes under keyid.
 */
export async function verifyOrderWebhook(d: Delivery, fetchProfile: (url: string) => Promise<unknown>, now = Date.now()): Promise<{ ok: boolean; profile: string | null; why?: string }> {
  const profile = agentProfile(d.headers['ucp-agent']);
  if (!profile) return { ok: false, profile, why: 'no profile' };
  if (!(await digestOk(d.headers['content-digest'], d.body))) return { ok: false, profile, why: 'digest' };
  const input = parseSignatureInput(d.headers['signature-input']);
  if (!input || !input.keyid) return { ok: false, profile, why: 'input' };
  for (const need of ['@method', '@path', 'content-digest']) if (!input.components.includes(need)) return { ok: false, profile, why: `uncovered ${need}` };
  const ts = input.created ?? Number(d.headers['webhook-timestamp']);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 15 * 60) return { ok: false, profile, why: 'stale' };
  const sig = new RegExp(`(?:^|,)\\s*${input.label}=:([A-Za-z0-9+/=]+):`).exec(d.headers['signature'] ?? '');
  const base = signatureBase(input, d);
  if (!sig || !base) return { ok: false, profile, why: 'signature' };
  let doc: any;
  try { doc = await fetchProfile(profile); } catch { return { ok: false, profile, why: 'profile' }; }
  const keys = [...(Array.isArray(doc?.signing_keys) ? doc.signing_keys : []), ...(Array.isArray(doc?.ucp?.signing_keys) ? doc.ucp.signing_keys : [])];
  const jwk = keys.find((k: any) => k?.kid === input.keyid && k?.kty === 'EC' && k?.crv === 'P-256');
  if (!jwk) return { ok: false, profile, why: 'key' };
  try {
    const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64(sig[1]), new TextEncoder().encode(base));
    return ok ? { ok, profile } : { ok, profile, why: 'bad signature' };
  } catch { return { ok: false, profile, why: 'verify' }; }
}
