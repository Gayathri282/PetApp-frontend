// Basic Service Worker for PWA support
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests (frontend pages, assets)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn('Fetch failed for same-origin request:', err);
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
  }
});
