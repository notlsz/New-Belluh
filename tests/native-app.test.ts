// The iOS and Android apps: detecting the app, the photo library feeding the same engine (dates and places from the
// plugin, batches marked done only after indexing), notification tokens, links and Share to Belluh, and the server
// side of APNs and FCM.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { IDBFactory } from 'fake-indexeddb';

// localStorage, as the app has it
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, String(v)); }, removeItem: (k: string) => { mem.delete(k); } };

const { isNative, nativePlatform, setPlatformForTests } = await import('../src/lib/native/platform.ts');
const photos = await import('../src/lib/native/photos.ts');
const { syncLibrary, notBeforeOf } = await import('../src/lib/native/library.ts');
const push = await import('../src/services/nativePush.ts');
const { inAppPath, openLink } = await import('../src/lib/native/links.ts');
const share = await import('../src/lib/native/share.ts');
const np = await import('../supabase/functions/_shared/nativepush.ts');
const { createMemoryEngine } = await import('../src/lib/memory/engine.ts');
const { LABELS, SENSITIVE } = await import('../src/lib/memory/vocab.ts');
const { parseCities } = await import('../src/lib/memory/geo.ts');
type NativeAsset = import('../src/lib/native/photos.ts').NativeAsset;

// ------------------------------------------------------------------------------------------------------- detection

test('A browser is not the app; the iOS and Android apps are', () => {
  setPlatformForTests(null);
  assert.equal(isNative(), false, 'Node, like a browser, is web');
  assert.equal(nativePlatform(), null);
  setPlatformForTests('ios');
  assert.equal(nativePlatform(), 'ios'); assert.equal(isNative(), true);
  setPlatformForTests('android');
  assert.equal(nativePlatform(), 'android');
  setPlatformForTests('web');
  assert.equal(isNative(), false);
  setPlatformForTests(null);
});

// ----------------------------------------------------------------------------------------------- dates and places

test('EXIF clocks and offsets become the engine\'s wall clock, instant and zone', () => {
  assert.equal(photos.exifWall('2026:10:01 18:30:05'), Date.UTC(2026, 9, 1, 18, 30, 5));
  assert.equal(photos.exifWall('0000:00:00 00:00:00'), null);
  assert.equal(photos.exifWall('not a date'), null);
  assert.equal(photos.offsetMinutes('+02:00'), 120);
  assert.equal(photos.offsetMinutes('-0530'), -330);
  assert.equal(photos.offsetMinutes('Z'), null);

  // Taken in Tokyo at 18:30 local (+09:00): the wall clock stays 18:30 wherever the phone is now
  let t = photos.timesOf({ createdAt: Date.UTC(2026, 9, 1, 9, 30), taken: '2026:10:01 18:30:00', offset: '+09:00' });
  assert.equal(t.wall, Date.UTC(2026, 9, 1, 18, 30));
  assert.equal(t.date, '2026-10-01T09:30:00.000Z');
  assert.equal(t.timeZone, '+09:00');
  // EXIF clock without an offset: the library's instant for the date
  t = photos.timesOf({ createdAt: Date.UTC(2026, 9, 1, 9, 30), taken: '2026:10:01 18:30:00' });
  assert.equal(t.wall, Date.UTC(2026, 9, 1, 18, 30)); assert.equal(t.date, '2026-10-01T09:30:00.000Z'); assert.equal(t.timeZone, null);
  // No EXIF (a video): the instant on this phone's clock
  t = photos.timesOf({ createdAt: Date.UTC(2026, 9, 1, 9, 30) }, () => -420);
  assert.equal(t.wall, Date.UTC(2026, 9, 1, 2, 30));
  assert.equal(t.date, '2026-10-01T09:30:00.000Z');
});

const asset = (n: number, extra: Partial<NativeAsset> = {}): NativeAsset => ({
  id: `ph://${n}/L0/001`, key: Date.UTC(2026, 9, n), createdAt: Date.UTC(2026, 9, n, 10), mediaType: 'photo', width: 4032, height: 3024, path: `/cache/r/${n}.jpg`, ...extra,
});
/** What browserReader gives a 640 px copy with no EXIF: a content id, the file's date, no place */
const baseReader = { async read(f: File) { return { id: `content-${f.name}`, mediaType: 'photo' as const, wall: f.lastModified, date: new Date(f.lastModified).toISOString(), timeZone: null, lat: null, lng: null, w: 640, h: 480, thumb: new Blob(['t']), work: null }; } };

test('The library reader keeps the decoded copy but takes id, date, place, kind and size from the plugin', async () => {
  const a = asset(3, { taken: '2026:10:03 20:15:00', offset: '-07:00', lat: 37.3382, lng: -121.8863, mediaType: 'screenshot' });
  const f = photos.assetFile(a, new Blob(['jpeg']));
  const r = photos.nativeAwareReader(baseReader as any, 'ios');
  const got = (await r.read(f))!;
  assert.equal(got.id, await photos.nativeId('ios', a.id));
  assert.match(got.id, /^[0-9a-f]{32}$/);
  assert.equal(got.wall, Date.UTC(2026, 9, 3, 20, 15));
  assert.equal(got.date, '2026-10-04T03:15:00.000Z');
  assert.equal(got.timeZone, '-07:00');
  assert.deepEqual([got.lat, got.lng], [37.3382, -121.8863], 'the place the web picker strips');
  assert.equal(got.mediaType, 'screenshot');
  assert.deepEqual([got.w, got.h], [4032, 3024]);
  assert.ok(got.thumb, 'the preview still comes from decoding the copy');
  // (0, 0) is "no place", never the Gulf of Guinea
  const zero = (await r.read(photos.assetFile(asset(4, { lat: 0, lng: 0 }), new Blob(['x']))))!;
  assert.equal(zero.lat, null);
  // A file the person picked is read exactly as on the web
  const picked = new File(['x'], 'IMG_1.JPG', { type: 'image/jpeg', lastModified: 5 });
  assert.equal((await r.read(picked))!.id, 'content-IMG_1.JPG');
  // The same photo is the same id on the next read; another platform's id never collides
  assert.equal((await r.read(photos.assetFile(a, new Blob(['other bytes']))))!.id, got.id);
  assert.notEqual(await photos.nativeId('android', a.id), got.id);
});

// ---------------------------------------------------------------------------------------------- reading in batches

function fakeLibrary(n: number, o: { failAdd?: boolean } = {}) {
  const all = Array.from({ length: n }, (_, i) => asset(i + 1));
  let pos = 0;
  const commits: { cursor: any; ids: string[] }[] = [];
  const plugin = {
    async nextBatch({ limit }: { limit: number }) {
      const assets = all.slice(pos, pos + limit);
      pos += assets.length;
      return { assets, more: pos < all.length, cursor: assets.length ? { oldest: assets.at(-1)!.key, newest: assets[0].key } : {} };
    },
    async commit(c: { cursor: any; ids: string[] }) { commits.push(c); },
  };
  const added: File[][] = [];
  return { plugin, commits, added, addFiles: async (f: File[]) => { if (o.failAdd) throw new Error('storage full'); added.push(f); }, load: async (p: string) => new Blob([p]) };
}

test('The library is read in batches and each batch is marked done only after the engine has it', async () => {
  const L = fakeLibrary(130);
  const r = await syncLibrary({ plugin: L.plugin, addFiles: L.addFiles, load: L.load, limit: 60 });
  assert.deepEqual(r, { added: 130, more: false });
  assert.deepEqual(L.added.map(b => b.length), [60, 60, 10]);
  assert.equal(L.commits.length, 3);
  assert.equal(L.commits[0].ids.length, 60);
  assert.equal(photos.assetOf(L.added[0][0])?.id, 'ph://1/L0/001', 'the reader can find what the plugin said about each copy');

  // One visit's share, then the rest next time
  const M = fakeLibrary(200);
  assert.deepEqual(await syncLibrary({ plugin: M.plugin, addFiles: M.addFiles, load: M.load, limit: 50, max: 100 }), { added: 100, more: true });

  // The engine failed: nothing is marked done, so the next visit tries the same photos again
  const F = fakeLibrary(10, { failAdd: true });
  await assert.rejects(syncLibrary({ plugin: F.plugin, addFiles: F.addFiles, load: F.load }));
  assert.equal(F.commits.length, 0);

  // A copy that went missing is skipped; the batch still moves on
  const G = fakeLibrary(3);
  const r2 = await syncLibrary({ plugin: G.plugin, addFiles: G.addFiles, load: async p => { if (p.endsWith('2.jpg')) throw new Error('gone'); return new Blob([p]); } });
  assert.equal(r2.added, 2); assert.equal(G.commits[0].ids.length, 3);

  // A plugin that says "more" but returns nothing never loops forever
  let calls = 0;
  await syncLibrary({ plugin: { nextBatch: async () => { calls++; return { assets: [], more: true, cursor: {} }; }, commit: async () => {} }, addFiles: async () => {}, load: L.load });
  assert.equal(calls, 1);
});

test('Only photos inside the engine\'s window are read', () => {
  const now = Date.UTC(2026, 10, 3);
  const nb = notBeforeOf({ options: { window: { kind: 'sliding', months: 12 } } } as any, null, now)!;
  assert.ok(Math.abs(nb - (now - 365.28 * 86_400_000)) < 86_400_000);
  assert.equal(notBeforeOf({ options: {} } as any, null, now), undefined);
});

const N_SENS = SENSITIVE.reduce((n: number, s: any) => n + s.prompts.length, 0);
const unit = (i: number) => { const v = new Float32Array(8); v[i % 8] = 1; return v; };

test('In the app, library photos go through the same engine and keep their date and place', async () => {
  const L = fakeLibrary(0);
  const tokyo = asset(7, { taken: '2026:10:07 19:00:00', offset: '+09:00', lat: 35.6595, lng: 139.7005 });
  const shot = asset(8, { mediaType: 'screenshot' });
  L.plugin.nextBatch = async () => ({ assets: [tokyo, shot], more: false, cursor: { newest: shot.key, oldest: tokyo.key } });
  const e = createMemoryEngine({
    idb: new IDBFactory(), now: () => Date.UTC(2026, 10, 3), uiLang: () => 'en',
    reader: photos.nativeAwareReader(baseReader as any, 'android'),
    understander: { async load({ onProgress }) { onProgress(1, 1); return { promptMatrix: null }; }, async image() { return { vec: unit(1), sims: new Float32Array(LABELS.length).fill(0.12), sens: new Float32Array(N_SENS).fill(0.1), faces: [] }; }, async text() { return unit(2); }, dispose() {} },
    ocr: async () => ({ read: async () => 'Omakase at Sushi Saito, table for 2', close: async () => {} }),
    cities: async () => parseCities(['#JP', 'Tokyo\t3569\t13969\t8336'].join('\n')),
    countryOf: () => 'Japan',
  });
  const r = await syncLibrary({ plugin: L.plugin, addFiles: f => e.addFiles(f, { source: 'library' }), load: L.load });
  await e.idle();
  assert.equal(r.added, 2);
  assert.equal(L.commits.length, 1, 'marked done after indexing');
  const items = await e.list!({ limit: 10 } as any);
  assert.equal(items.length, 2);
  const t = await e.item(await photos.nativeId('android', tokyo.id));
  assert.ok(t, 'indexed under the library id');
  assert.equal((t as any).date?.slice(0, 16), '2026-10-07T10:00', 'the instant from EXIF and its offset');
  assert.ok((t as any).location, 'the place the web picker strips');
  const s = await e.item(await photos.nativeId('android', shot.id));
  assert.equal((s as any).mediaType, 'screenshot');
  const reps = await e.reports!();
  assert.equal(reps[0]?.trigger, 'library');
});

test('In the app, getMemory() gives the engine the library reader and forgets the library when Memory is deleted', async () => {
  setPlatformForTests('android');
  try {
    const m = await import('../src/lib/memory/index.ts');
    const e = await m.getMemory() as any;
    assert.ok(e.deps.reader, 'a reader that knows library copies');
    const a = asset(9, { lat: 48.8566, lng: 2.3522, taken: '2026:10:09 12:00:00', offset: '+02:00' });
    const f = photos.assetFile(a, new Blob(['x']));
    // The reader decodes with the browser reader (not in Node); the plugin's facts are what it adds on top
    const swapped = photos.nativeAwareReader(baseReader as any, 'android');
    assert.equal((await swapped.read(f))!.lat, 48.8566);
    assert.equal(typeof e.deps.onDeleted, 'function');
    await e.deps.onDeleted();   // outside the app the plugin call fails quietly
  } finally { setPlatformForTests(null); }
});

// ------------------------------------------------------------------------------------------------- notifications

function fakePush(o: { perm?: string; after?: string; token?: string; fail?: string } = {}) {
  const handlers = new Map<string, (x: any) => void>();
  const calls: string[] = [];
  let perm = o.perm ?? 'prompt';
  const bridge = {
    async checkPermissions() { return { receive: perm as any }; },
    async requestPermissions() { calls.push('ask'); perm = o.after ?? 'granted'; return { receive: perm as any }; },
    async register() { calls.push('register'); setTimeout(() => o.fail ? handlers.get('registrationError')?.({ error: o.fail }) : handlers.get('registration')?.({ value: o.token ?? 'a'.repeat(64) }), 0); },
    async unregister() { calls.push('unregister'); },
    async addListener(ev: string, cb: (x: any) => void) { handlers.set(ev, cb); return { remove: async () => { handlers.delete(ev); } }; },
  };
  const saved: any[] = [], deleted: string[] = [];
  let tested = 0;
  const ready = async () => true;
  const backend = { async rpc(fn: string, args: any) { saved.push({ fn, ...args }); return { error: null }; }, async deleteToken(t: string) { deleted.push(t); }, async test() { tested++; } };
  return { bridge, backend, ready, calls, saved, deleted, tested: () => tested, handlers };
}

test('Turning notifications on in the app asks once, saves the APNs or FCM token and sends a test', async () => {
  mem.clear();
  const P = fakePush({ token: 'f'.repeat(64) });
  assert.equal(await push.nativePushState(P.bridge as any, P.ready), 'off');
  assert.equal(await push.enableNativePush('ios', { bridge: P.bridge as any, backend: P.backend, appVersion: '1.0', ready: P.ready }), 'on');
  assert.deepEqual(P.calls, ['ask', 'register']);
  assert.deepEqual(P.saved, [{ fn: 'register_native_push', p_platform: 'ios', p_token: 'f'.repeat(64), p_app_version: '1.0' }]);
  assert.equal(P.tested(), 1);
  assert.equal(await push.nativePushState(P.bridge as any, P.ready), 'on');
  assert.equal(P.handlers.size, 0, 'listeners removed once the token came');

  // Signed in as someone else on this phone: the token moves to them
  await push.refreshNativePush('ios', { backend: P.backend });
  assert.equal(P.saved.length, 2);

  // Off: the token leaves the account and the phone unregisters
  assert.equal(await push.disableNativePush({ bridge: P.bridge as any, backend: P.backend }), 'off');
  assert.deepEqual(P.deleted, ['f'.repeat(64)]);
  assert.ok(P.calls.includes('unregister'));
  assert.equal(await push.nativePushState(P.bridge as any, P.ready), 'off');

  // Said no: blocked, nothing saved
  const N = fakePush({ after: 'denied' });
  assert.equal(await push.enableNativePush('android', { bridge: N.bridge as any, backend: N.backend, ready: N.ready }), 'blocked');
  assert.equal(N.saved.length, 0);
  assert.equal(await push.nativePushState(N.bridge as any, N.ready), 'blocked');

  // An Android build without Firebase config: unsupported, and the token is never asked for (it would crash)
  const U = fakePush();
  assert.equal(await push.enableNativePush('android', { bridge: U.bridge as any, backend: U.backend, ready: async () => false }), 'unsupported');
  assert.equal(await push.nativePushState(U.bridge as any, async () => false), 'unsupported');
  assert.deepEqual(U.calls, []);

  // APNs or FCM failed: an error, nothing saved
  const E = fakePush({ perm: 'granted', fail: 'no aps-environment' });
  await assert.rejects(push.enableNativePush('ios', { bridge: E.bridge as any, backend: E.backend, ready: E.ready }), /aps-environment/);
  assert.equal(E.saved.length, 0);
});

test('A notification opens its page inside Belluh, never another site', () => {
  assert.equal(push.pathFromNotification({ url: '/?tab=belluh' }), '/?tab=belluh');
  assert.equal(push.pathFromNotification({ url: '//evil.example' }), '/');
  assert.equal(push.pathFromNotification({ url: 'https://evil.example' }), '/');
  assert.equal(push.pathFromNotification(null), '/');
});

// ---------------------------------------------------------------------------------------------- links and sharing

test('belluh.com links open their page in the app; other links do not', () => {
  assert.equal(inAppPath('https://belluh.com/?invite=abc123'), '/?invite=abc123');
  assert.equal(inAppPath('https://www.belluh.com/afterglow'), '/afterglow');
  assert.equal(inAppPath('https://belluh.com/.well-known/apple-app-site-association'), null);
  assert.equal(inAppPath('https://evil.com/?invite=abc'), null);
  assert.equal(inAppPath('http://belluh.com/afterglow'), null);
  assert.equal(inAppPath('nonsense'), null);
  const went: string[] = [];
  assert.equal(openLink('https://belluh.com/afterglow', { current: () => '/afterglow', go: p => went.push(p) }), false, 'already there');
  assert.equal(openLink('https://belluh.com/?invite=x', { current: () => '/', go: p => went.push(p) }), true);
  assert.deepEqual(went, ['/?invite=x']);
});

test('Shared screenshots go into Memory, or wait on the phone until Memory is on', async () => {
  mem.clear();
  const added: File[][] = [];
  let on = false;
  const d = { memoryOn: () => on, load: async (p: string) => new Blob([p]), add: async (f: File[]) => { added.push(f); } };
  assert.equal(await share.receiveShared([{ path: '/c/1.png', mimeType: 'image/png' }], d), 0);
  assert.equal(share.pendingShares().length, 1);
  on = true;
  assert.equal(await share.receiveShared([{ path: '/c/2.jpeg', mimeType: 'image/jpeg' }], d), 2);
  assert.equal(share.pendingShares().length, 0);
  assert.match(added[0][0].name, /^Screenshot shared 1\.png$/, 'named so the engine reads its text as a plan');
  assert.match(added[0][1].name, /\.jpg$/);
});

// --------------------------------------------------------------------------------------------- APNs and FCM (server)

const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const apns = { keyP8: ec.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string, keyId: 'ABC123DEFG', teamId: 'TEAM123456', bundleId: 'com.belluh.app' };
const msg = { title: 'Belluh', body: 'Mia picked Friday', url: '/?tab=belluh', tag: 'plan' };

test('APNs provider tokens are ES256 JWTs Apple can verify', async () => {
  const jwt = await np.apnsJwt(apns, Date.UTC(2026, 10, 3));
  const [h, p, s] = jwt.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url').toString()), { alg: 'ES256', kid: 'ABC123DEFG' });
  assert.deepEqual(JSON.parse(Buffer.from(p, 'base64url').toString()), { iss: 'TEAM123456', iat: Date.UTC(2026, 10, 3) / 1000 });
  assert.ok(crypto.verify('sha256', Buffer.from(`${h}.${p}`), { key: ec.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url')));
  const { url, init } = np.apnsRequest('ab'.repeat(32), msg, 'com.belluh.app', jwt);
  assert.equal(url, `https://api.push.apple.com/3/device/${'ab'.repeat(32)}`);
  const hd = init.headers as Record<string, string>;
  assert.equal(hd['apns-topic'], 'com.belluh.app'); assert.equal(hd['apns-push-type'], 'alert'); assert.equal(hd['apns-collapse-id'], 'plan');
  assert.deepEqual(JSON.parse(init.body as string), { aps: { alert: { title: 'Belluh', body: 'Mia picked Friday' }, sound: 'default', 'thread-id': 'plan' }, url: '/?tab=belluh' });
});

test('A debug build\'s token is retried on the APNs sandbox; uninstalled phones are forgotten', async () => {
  const hits: string[] = [];
  const f = (async (url: string) => {
    hits.push(new URL(url).host);
    if (url.includes('api.push.apple.com')) return new Response(JSON.stringify({ reason: 'BadDeviceToken' }), { status: 400 });
    return new Response('', { status: 200 });
  }) as typeof fetch;
  assert.deepEqual(await np.sendApns('cd'.repeat(32), msg, apns, 'production', f), { result: 'ok', env: 'sandbox' });
  assert.deepEqual(hits, ['api.push.apple.com', 'api.sandbox.push.apple.com']);
  const gone = (async () => new Response(JSON.stringify({ reason: 'Unregistered' }), { status: 410 })) as typeof fetch;
  assert.equal((await np.sendApns('cd'.repeat(32), msg, apns, 'production', gone)).result, 'gone');
  assert.equal((await np.sendApns('not-a-token', msg, apns, 'production', f)).result, 'gone');
});

const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const account = { project_id: 'belluh-app', client_email: 'push@belluh-app.iam.gserviceaccount.com', private_key: rsa.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string };

test('FCM: a signed service-account assertion, then the HTTP v1 message', async () => {
  const a = await np.googleAssertion(account, Date.UTC(2026, 10, 3));
  const [h, p, s] = a.split('.');
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  assert.equal(claims.scope, np.FCM_SCOPE); assert.equal(claims.aud, 'https://oauth2.googleapis.com/token'); assert.equal(claims.exp - claims.iat, 3600);
  assert.ok(crypto.verify('sha256', Buffer.from(`${h}.${p}`), rsa.publicKey, Buffer.from(s, 'base64url')));

  const sent: any[] = [];
  const f = (async (url: string, init: RequestInit) => {
    if (url.includes('oauth2')) return new Response(JSON.stringify({ access_token: 'ya29.x', expires_in: 3600 }), { status: 200 });
    sent.push({ url, auth: (init.headers as any).authorization, body: JSON.parse(init.body as string) });
    return new Response(JSON.stringify({ name: 'projects/belluh-app/messages/1' }), { status: 200 });
  }) as typeof fetch;
  assert.equal(await np.sendFcm('fcm-token-1234567890', msg, account, f), 'ok');
  assert.equal(sent[0].url, 'https://fcm.googleapis.com/v1/projects/belluh-app/messages:send');
  assert.equal(sent[0].auth, 'Bearer ya29.x');
  assert.deepEqual(sent[0].body.message.notification, { title: 'Belluh', body: 'Mia picked Friday' });
  assert.deepEqual(sent[0].body.message.data, { url: '/?tab=belluh', tag: 'plan' });
  const unreg = (async (url: string) => url.includes('oauth2')
    ? new Response(JSON.stringify({ access_token: 'ya29.x' }), { status: 200 })
    : new Response(JSON.stringify({ error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] } }), { status: 404 })) as typeof fetch;
  assert.equal(await np.sendFcm('fcm-token-1234567890', msg, account, unreg), 'gone');
});
