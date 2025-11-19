const CACHE_NAME = 'dermatologica-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// On install, pre-cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Activate worker immediately
  );
});

// On activate, clean up old caches to save space
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim()) // Take control of all open pages
  );
});

// On fetch, use stale-while-revalidate strategy for all GET requests
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Prevents caching of API calls to Gemini
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // Fetch from network in the background to update the cache
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Check for valid response before caching
            // This will cache opaque responses from CDNs
            if (networkResponse) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed; returning offline page if available.', error);
            // Optionally, return an offline fallback page here if network fails and item is not in cache
          });

        // Return cached response immediately if it exists, otherwise wait for the network
        return cachedResponse || fetchPromise;
      });
    })
  );
});