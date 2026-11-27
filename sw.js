const OLD_CACHES = ['tp-pwa-v1', 'tp-pwa-v2'];

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    ...OLD_CACHES.map(name => caches.delete(name)),
    self.clients.claim()
  ]));
});

self.addEventListener('push', event => {
  let message;
  try {
    message = event.data?.json();
  } catch {
    message = null;
  }
  const destination = message?.destination;
  if (!['kalender', 'toys', 'chat'].includes(destination)) return;
  event.waitUntil(self.registration.showNotification('Neues in Love and Pain', {
    tag: message.id,
    data: { destination }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = event.notification.data?.destination;
  if (!['kalender', 'toys', 'chat'].includes(destination)) return;
  const url = new URL(self.registration.scope);
  url.searchParams.set('push', destination);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).pathname === url.pathname);
    if (existing) {
      const navigated = await existing.navigate(url.href);
      if (navigated) return navigated.focus();
    }
    return self.clients.openWindow(url.href);
  })());
});
