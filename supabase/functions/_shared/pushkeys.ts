// Belluh's VAPID keys: made once, on first use, and kept in app_keys (service role only).
import { db } from './agentdb.ts';
import { generateVapidKeys, type VapidKeys } from './webpush.ts';

let cached: VapidKeys | null = null;
export async function vapidKeys(): Promise<VapidKeys> {
  if (cached) return cached;
  const { data } = await db.from('app_keys').select('value').eq('name', 'vapid').maybeSingle();
  if (data?.value) return (cached = data.value as VapidKeys);
  const fresh = await generateVapidKeys();
  // Two first calls at once: only one insert wins, and both read the winner
  await db.from('app_keys').insert({ name: 'vapid', value: fresh });
  const { data: won } = await db.from('app_keys').select('value').eq('name', 'vapid').single();
  return (cached = won!.value as VapidKeys);
}
export const PUSH_SUBJECT = () => Deno.env.get('PUSH_SUBJECT') ?? 'mailto:hello@belluh.com';
export const PUSH_EXTRA_HOSTS = () => (Deno.env.get('PUSH_TEST_HOSTS') ?? '').split(',').map(s => s.trim()).filter(Boolean);
