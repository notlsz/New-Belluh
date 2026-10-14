import { supabase } from '../lib/supabaseClient';

// Notifications in this browser: a service worker shows them; the subscription is saved to the person's account.

export type PushState = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

function keyBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
const b64 = (buf: ArrayBuffer | null) => (buf ? btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : '');

async function registration() {
  return (await navigator.serviceWorker.getRegistration('/')) ?? navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export async function pushState(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIOS() && !standalone() ? 'needs-install' : 'unsupported';
  }
  if (Notification.permission === 'denied') return 'blocked';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

/** Asks permission, subscribes this browser and saves it. Returns the new state. */
export async function enablePush(): Promise<PushState> {
  if (await pushState() === 'unsupported') return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'blocked' : 'off';
  const { data, error } = await supabase.functions.invoke('belluh-push', { body: { action: 'key' } });
  if (error || !data?.publicKey) throw new Error('Notifications are not set up yet');
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(data.publicKey) as unknown as BufferSource });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  // Same browser, new login: replace the old row (delete is allowed only on your own rows, so remove by endpoint first)
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  const { error: saveErr } = await supabase.from('push_subscriptions').insert({
    user_id: user.id, endpoint: sub.endpoint, p256dh: b64(sub.getKey('p256dh')), auth: b64(sub.getKey('auth')), user_agent: navigator.userAgent.slice(0, 280),
  });
  if (saveErr) { await sub.unsubscribe().catch(() => {}); throw new Error(saveErr.message); }
  await supabase.functions.invoke('belluh-push', { body: { action: 'test' } });
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker?.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe().catch(() => {});
  }
  return 'off';
}

/** Whether the backend has notifications (the table exists); the switch hides until it does. */
export async function pushAvailable(): Promise<boolean> {
  const { error } = await supabase.from('push_subscriptions').select('id').limit(1);
  return !error;
}
