// Notifications for the iOS and Android apps: APNs (token-based auth, a .p8 key) and Firebase Cloud Messaging (HTTP v1,
// a service account). The same message the browser gets (notify.ts pushTo). Off until the keys are set:
//   APNS_KEY_P8 (the .p8 file's text), APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID (default com.belluh.app)
//   FCM_SERVICE_ACCOUNT (the service account JSON from Firebase)
// Pure builders are exported for tests; network calls take a fetch so tests can stand in for Apple and Google.

import { b64url, fromB64url } from './webpush.ts';

export type NativeMessage = { title: string; body: string; url?: string; tag?: string };
export type SendResult = 'ok' | 'gone' | 'failed';
export interface ApnsConfig { keyP8: string; keyId: string; teamId: string; bundleId: string }
export interface FcmAccount { project_id: string; client_email: string; private_key: string; token_uri?: string }

const enc = new TextEncoder();
const json64 = (o: unknown) => b64url(enc.encode(JSON.stringify(o)));

/** The DER inside a PEM ("-----BEGIN PRIVATE KEY-----" ...), as bytes */
export function pemBytes(pem: string): Uint8Array {
  const body = pem.replace(/-----(BEGIN|END)[^-]+-----/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
  return fromB64url(body.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
}

// ------------------------------------------------------------------------------------------------------------ APNs

/** A provider token for APNs: ES256, kid = key id, iss = team id, iat in seconds (valid up to an hour) */
export async function apnsJwt(c: Pick<ApnsConfig, 'keyP8' | 'keyId' | 'teamId'>, now = Date.now()): Promise<string> {
  const key = await crypto.subtle.importKey('pkcs8', pemBytes(c.keyP8) as unknown as BufferSource, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = `${json64({ alg: 'ES256', kid: c.keyId })}.${json64({ iss: c.teamId, iat: Math.floor(now / 1000) })}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head)));
  return `${head}.${b64url(sig)}`;
}

export const APNS_HOSTS = { production: 'https://api.push.apple.com', sandbox: 'https://api.sandbox.push.apple.com' } as const;
export type ApnsEnv = keyof typeof APNS_HOSTS;

/** A device token is 64 or more hex characters */
export const okApnsToken = (t: string) => /^[0-9a-f]{64,200}$/i.test(t);

export function apnsRequest(token: string, m: NativeMessage, bundleId: string, jwt: string, env: ApnsEnv = 'production'): { url: string; init: RequestInit } {
  const headers: Record<string, string> = {
    authorization: `bearer ${jwt}`, 'apns-topic': bundleId, 'apns-push-type': 'alert', 'apns-priority': '10', 'content-type': 'application/json',
  };
  if (m.tag) headers['apns-collapse-id'] = m.tag.slice(0, 64);
  const body = { aps: { alert: { title: m.title, body: m.body }, sound: 'default', ...(m.tag ? { 'thread-id': m.tag } : {}) }, url: m.url ?? '/' };
  return { url: `${APNS_HOSTS[env]}/3/device/${token}`, init: { method: 'POST', headers, body: JSON.stringify(body) } };
}

let apnsCache: { jwt: string; at: number; keyId: string } | null = null;

/** Sends to one iPhone. A token from a debug build answers BadDeviceToken in production, so sandbox is tried once. */
export async function sendApns(token: string, m: NativeMessage, c: ApnsConfig, env: ApnsEnv = 'production', f: typeof fetch = fetch, now = Date.now()): Promise<{ result: SendResult; env: ApnsEnv }> {
  if (!okApnsToken(token)) return { result: 'gone', env };
  if (!apnsCache || apnsCache.keyId !== c.keyId || now - apnsCache.at > 40 * 60_000) apnsCache = { jwt: await apnsJwt(c, now), at: now, keyId: c.keyId };
  const once = async (e: ApnsEnv) => {
    const { url, init } = apnsRequest(token, m, c.bundleId, apnsCache!.jwt, e);
    const r = await f(url, init);
    let reason = '';
    if (r.status !== 200) { try { reason = (await r.json())?.reason ?? ''; } catch { /* no body */ } }
    return { status: r.status, reason };
  };
  try {
    let r = await once(env);
    if (r.status === 400 && r.reason === 'BadDeviceToken') {
      const other: ApnsEnv = env === 'production' ? 'sandbox' : 'production';
      const r2 = await once(other);
      if (r2.status === 200) return { result: 'ok', env: other };
      r = r2;
    }
    if (r.status === 200) return { result: 'ok', env };
    if (r.status === 410 || r.reason === 'BadDeviceToken' || r.reason === 'Unregistered' || r.reason === 'DeviceTokenNotForTopic') return { result: 'gone', env };
    if (r.status === 403) apnsCache = null;   // an expired or wrong provider token: make a new one next time
    return { result: 'failed', env };
  } catch { return { result: 'failed', env }; }
}

// ------------------------------------------------------------------------------------------------------------- FCM

export const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

/** The signed assertion Google trades for an access token (RS256) */
export async function googleAssertion(a: FcmAccount, now = Date.now()): Promise<string> {
  const key = await crypto.subtle.importKey('pkcs8', pemBytes(a.private_key) as unknown as BufferSource, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const iat = Math.floor(now / 1000);
  const head = `${json64({ alg: 'RS256', typ: 'JWT' })}.${json64({ iss: a.client_email, scope: FCM_SCOPE, aud: a.token_uri ?? 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 })}`;
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(head)));
  return `${head}.${b64url(sig)}`;
}

export function fcmMessage(token: string, m: NativeMessage) {
  return {
    message: {
      token,
      notification: { title: m.title, body: m.body },
      data: { url: m.url ?? '/', ...(m.tag ? { tag: m.tag } : {}) },
      android: { priority: 'high', notification: { ...(m.tag ? { tag: m.tag } : {}), default_sound: true } },
    },
  };
}

let fcmCache: { token: string; until: number; email: string } | null = null;

async function fcmAccess(a: FcmAccount, f: typeof fetch, now: number): Promise<string> {
  if (fcmCache && fcmCache.email === a.client_email && now < fcmCache.until) return fcmCache.token;
  const r = await f(a.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: await googleAssertion(a, now) }).toString(),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`fcm auth ${r.status}`);
  fcmCache = { token: j.access_token, until: now + Math.max(60, (j.expires_in ?? 3600) - 300) * 1000, email: a.client_email };
  return j.access_token;
}

export async function sendFcm(token: string, m: NativeMessage, a: FcmAccount, f: typeof fetch = fetch, now = Date.now()): Promise<SendResult> {
  if (!token || token.length > 4096) return 'gone';
  try {
    const access = await fcmAccess(a, f, now);
    const r = await f(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(a.project_id)}/messages:send`, {
      method: 'POST', headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' }, body: JSON.stringify(fcmMessage(token, m)),
    });
    if (r.ok) return 'ok';
    let code = '';
    try { const j = await r.json(); code = j?.error?.details?.find((d: any) => d?.errorCode)?.errorCode ?? j?.error?.status ?? ''; } catch { /* no body */ }
    if (r.status === 404 || code === 'UNREGISTERED' || (r.status === 400 && code === 'INVALID_ARGUMENT')) return 'gone';
    if (r.status === 401) fcmCache = null;
    return 'failed';
  } catch { return 'failed'; }
}

// ------------------------------------------------------------------------------------------------------ the config

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };

export function apnsConfig(): ApnsConfig | null {
  const keyP8 = env('APNS_KEY_P8'), keyId = env('APNS_KEY_ID'), teamId = env('APNS_TEAM_ID');
  if (!keyP8 || !keyId || !teamId) return null;
  return { keyP8, keyId, teamId, bundleId: env('APNS_BUNDLE_ID') ?? 'com.belluh.app' };
}

export function fcmAccount(): FcmAccount | null {
  const raw = env('FCM_SERVICE_ACCOUNT');
  if (!raw) return null;
  try { const a = JSON.parse(raw); return a?.project_id && a?.client_email && a?.private_key ? a : null; } catch { return null; }
}
