import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { encryptPayload, generateVapidKeys, vapidAuthorization, allowedEndpoint, b64url, fromB64url } from '../supabase/functions/_shared/webpush.ts';

const hkdf = (salt: Buffer, ikm: Buffer, info: Buffer, len: number) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));

/** What a browser does with a push (RFC 8291), written independently with Node's crypto. */
function browserDecrypt(body: Uint8Array, ua: crypto.ECDH, auth: Buffer): string {
  const b = Buffer.from(body);
  const salt = b.subarray(0, 16), idlen = b[20], asPublic = b.subarray(21, 21 + idlen), ct = b.subarray(21 + idlen);
  const shared = ua.computeSecret(asPublic);
  const uaPublic = ua.getPublicKey();
  const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  assert.equal(plain[plain.length - 1], 2, 'single final record');
  return plain.subarray(0, plain.length - 1).toString();
}

test('push messages are encrypted so only that browser can read them', async () => {
  const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
  const auth = crypto.randomBytes(16);
  const msg = JSON.stringify({ title: 'Belluh', body: 'Maya wants to plan "Dinner" with you.' });
  const body = await encryptPayload(msg, b64url(ua.getPublicKey()), b64url(auth));
  assert.equal(browserDecrypt(body, ua, auth), msg);
  assert.ok(!Buffer.from(body).toString().includes('Dinner'), 'not readable on the wire');
  const other = crypto.createECDH('prime256v1'); other.generateKeys();
  assert.throws(() => browserDecrypt(body, other, auth), 'another browser cannot read it');
});

test('VAPID: a valid ES256 token for the push service, signed with our key', async () => {
  const keys = await generateVapidKeys();
  assert.equal(fromB64url(keys.publicKey).length, 65);
  const h = await vapidAuthorization('https://fcm.googleapis.com/fcm/send/abc', keys, 'mailto:hello@belluh.com', Date.UTC(2026, 9, 13));
  const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(h)!;
  assert.ok(m);
  const claims = JSON.parse(Buffer.from(fromB64url(m[2])).toString());
  assert.equal(claims.aud, 'https://fcm.googleapis.com');
  assert.equal(claims.sub, 'mailto:hello@belluh.com');
  const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: keys.privateJwk.x, y: keys.privateJwk.y }, format: 'jwk' });
  const ok = crypto.verify('sha256', Buffer.from(`${m[1]}.${m[2]}`), { key: pub, dsaEncoding: 'ieee-p1363' }, Buffer.from(fromB64url(m[3])));
  assert.ok(ok, 'signature verifies');
});

test('only real push services are ever called', () => {
  assert.ok(allowedEndpoint('https://fcm.googleapis.com/fcm/send/x'));
  assert.ok(allowedEndpoint('https://web.push.apple.com/abc'));
  assert.ok(allowedEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x'));
  assert.ok(!allowedEndpoint('http://fcm.googleapis.com/x'), 'https only');
  assert.ok(!allowedEndpoint('https://169.254.169.254/latest/meta-data'));
  assert.ok(!allowedEndpoint('https://evil.com/?fcm.googleapis.com'));
  assert.ok(!allowedEndpoint('https://push.apple.com.evil.com/x'));
  assert.ok(!allowedEndpoint('not a url'));
});
