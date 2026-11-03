// Starts what only the iOS and Android apps have: belluh.com links, Share to Belluh, opening a notification's page,
// and keeping this phone's notification token with whoever is signed in. Loaded only inside the app (index.tsx).

import { nativePlatform } from './platform.ts';

export async function initNative(): Promise<void> {
  const platform = nativePlatform();
  if (!platform) return;
  document.documentElement.dataset.app = platform;
  const tasks: Promise<unknown>[] = [
    import('./links.ts').then(m => m.listenForLinks()),
    import('./share.ts').then(m => m.listenForShares()),
    import('../../services/nativePush.ts').then(m => m.listenForTaps(path => {
      if (`${window.location.pathname}${window.location.search}` !== path) window.location.assign(path);
    })),
    (async () => {
      const [{ supabase }, push] = await Promise.all([import('../supabaseClient'), import('../../services/nativePush.ts')]);
      supabase.auth.onAuthStateChange(event => {
        // A shared phone: the token follows whoever signs in; signing out stops this phone's notifications
        if (event === 'SIGNED_IN') void push.refreshNativePush(platform);
        if (event === 'SIGNED_OUT') void push.disableNativePush({ backend: { rpc: async () => ({ error: null }), deleteToken: async () => {}, test: async () => {} } });
      });
    })(),
  ];
  for (const r of await Promise.allSettled(tasks)) if (r.status === 'rejected') console.warn('belluh app: setup step failed', r.reason);
}
