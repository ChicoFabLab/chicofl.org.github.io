const CACHE_NAME = 'gatekeeper-v1';
const ASSETS = [
  'WebApp.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install: Cache all files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch: Serve from cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

