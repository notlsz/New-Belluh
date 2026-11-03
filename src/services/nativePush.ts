// Notifications in the iOS and Android apps: APNs or FCM through @capacitor/push-notifications. The token is saved to
// the person's account (register_native_push), and belluh-push sends a test. Same states as the web switch, so
// NotificationsToggle works unchanged. Tapping a notification opens its page in the app.

import type { PushState } from './push.ts';

type Perm = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';
export interface PushBridge {
  checkPermissions(): Promise<{ receive: Perm }>;
  requestPermissions(): Promise<{ receive: Perm }>;
  register(): Promise<void>;
  unregister(): Promise<void>;
  addListener(event: string, cb: (x: any) => void): Promise<{ remove(): Promise<void> }>;
}
export interface PushBackend {
  rpc(fn: string, args: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
  deleteToken(token: string): Promise<void>;
  test(): Promise<void>;
}

const KEY = 'belluh_native_push_token';
const store = {
  get: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  set: (t: string | null) => { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch { /* storage off */ } },
};

/** Android builds without Firebase config can't get a token (asking would crash), so the switch says unsupported */
async function buildReady(): Promise<boolean> {
  try { return (await (await import('../lib/native/photos.ts')).BelluhPhotos.pushReady()).ready; } catch { return false; }
}

async function bridge(): Promise<PushBridge> {
  return (await import('@capacitor/push-notifications')).PushNotifications as unknown as PushBridge;
}
async function backend(): Promise<PushBackend> {
  const { supabase } = await import('../lib/supabaseClient');
  return {
    rpc: (fn, args) => supabase.rpc(fn, args) as any,
    deleteToken: async token => { await supabase.from('native_push_tokens').delete().eq('token', token); },
    test: async () => { await supabase.functions.invoke('belluh-push', { body: { action: 'test' } }); },
  };
}

/** Waits for the token from APNs or FCM after register() (or an error) */
export function nextToken(b: PushBridge, timeoutMs = 20_000): Promise<string> {
  return new Promise((ok, no) => {
    const subs: Promise<{ remove(): Promise<void> }>[] = [];
    const done = (f: () => void) => { clearTimeout(t); subs.forEach(s => s.then(h => h.remove()).catch(() => {})); f(); };
    const t = setTimeout(() => done(() => no(new Error('No token from the notification service'))), timeoutMs);
    subs.push(b.addListener('registration', (x: { value: string }) => done(() => ok(x.value))));
    subs.push(b.addListener('registrationError', (e: { error: string }) => done(() => no(new Error(e?.error ?? 'Registration failed')))));
  });
}

export async function nativePushState(b?: PushBridge, ready: () => Promise<boolean> = buildReady): Promise<PushState> {
  if (!(await ready())) return 'unsupported';
  try {
    const p = await (b ?? await bridge()).checkPermissions();
    if (p.receive === 'denied') return 'blocked';
    return p.receive === 'granted' && store.get() ? 'on' : 'off';
  } catch { return 'unsupported'; }
}

export async function enableNativePush(platform: 'ios' | 'android', deps: { bridge?: PushBridge; backend?: PushBackend; appVersion?: string; ready?: () => Promise<boolean> } = {}): Promise<PushState> {
  if (!(await (deps.ready ?? buildReady)())) return 'unsupported';
  const b = deps.bridge ?? await bridge();
  let p = await b.checkPermissions();
  if (p.receive === 'prompt' || p.receive === 'prompt-with-rationale') p = await b.requestPermissions();
  if (p.receive !== 'granted') return p.receive === 'denied' ? 'blocked' : 'off';
  const waiting = nextToken(b);
  await b.register();
  const token = await waiting;
  const be = deps.backend ?? await backend();
  const { error } = await be.rpc('register_native_push', { p_platform: platform, p_token: token, p_app_version: deps.appVersion ?? null });
  if (error) throw new Error(error.message);
  store.set(token);
  await be.test().catch(() => {});
  return 'on';
}

export async function disableNativePush(deps: { bridge?: PushBridge; backend?: PushBackend } = {}): Promise<PushState> {
  const token = store.get();
  if (token) { await (deps.backend ?? await backend()).deleteToken(token).catch(() => {}); store.set(null); }
  await (deps.bridge ?? await bridge()).unregister().catch(() => {});
  return 'off';
}

/** A page inside Belluh from a notification's url ("/?tab=belluh"); anything else opens home */
export function pathFromNotification(data: unknown): string {
  const url = (data as any)?.url;
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}

/** Tapping a notification opens its page */
export async function listenForTaps(go: (path: string) => void, b?: PushBridge): Promise<void> {
  const br = b ?? await bridge();
  await br.addListener('pushNotificationActionPerformed', (a: { notification?: { data?: unknown } }) => go(pathFromNotification(a?.notification?.data)));
}

/** Signed in again on the same phone: move the saved token to this account */
export async function refreshNativePush(platform: 'ios' | 'android', deps: { backend?: PushBackend } = {}): Promise<void> {
  const token = store.get();
  if (!token) return;
  await (deps.backend ?? await backend()).rpc('register_native_push', { p_platform: platform, p_token: token, p_app_version: null }).catch(() => {});
}
