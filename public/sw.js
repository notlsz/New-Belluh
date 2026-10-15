// Belluh's service worker: only shows notifications (no caching, so the app is always fresh).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let m = {};
  try { m = event.data ? event.data.json() : {}; } catch { m = { body: event.data && event.data.text() }; }
  const title = typeof m.title === 'string' ? m.title.slice(0, 80) : 'Belluh';
  event.waitUntil(self.registration.showNotification(title, {
    body: typeof m.body === 'string' ? m.body.slice(0, 300) : '',
    icon: '/icon-192.png', badge: '/badge-96.png',
    tag: typeof m.tag === 'string' ? m.tag : undefined,
    data: { url: typeof m.url === 'string' && m.url.startsWith('/') ? m.url : '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin === self.location.origin) { await w.focus(); return w.navigate(url); }
    }
    return self.clients.openWindow(url);
  })());
});
