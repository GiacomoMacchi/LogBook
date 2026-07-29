const CACHE_NAME = 'logbook-v2';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // App shell locale: cache-first
      if (cached && ASSETS.some((a) => e.request.url.endsWith(a))) {
        return cached;
      }
      // Altre risorse (es. Leaflet/Chart.js da CDN, tile mappa): rete con fallback su cache
      return fetch(e.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(e.request, copy); } catch (err) { /* ignore */ }
          });
          return response;
        })
        .catch(() => cached);
    })
  );
});
