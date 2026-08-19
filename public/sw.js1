// We generate a date string (e.g., "2026-08-17") to use as the cache name.
// This ensures that the cache name changes every day, effectively forcing
// the service worker to clear out the old cache and create a new one,
// downloading the latest version of your website files daily.
const today = new Date().toISOString().split('T')[0];
const CACHE_NAME = `sawyer-cache-${today}`;

// These are the core files needed for your application to load its shell.
// They will be immediately cached when the service worker installs.
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/sawyer.png'];

self.addEventListener('install', (event) => {
  // skipWaiting() forces the waiting service worker to become the active service worker.
  self.skipWaiting();
  
  event.waitUntil(
    // Open the new cache for today and add all app shell files.
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {
      // Catch errors silently during pre-caching, but in a real app,
      // you might want to log this or handle it depending on criticality.
    }))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // The activate event is the perfect time to clean up old caches.
    caches
      .keys()
      .then((keys) =>
        // Promise.all ensures all old caches are deleted before proceeding.
        // We filter out any cache key that doesn't match today's CACHE_NAME.
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      // claims() allows the service worker to take control of the page immediately
      // without needing a refresh.
      .then(() => self.clients.claim())
  );
});

// Cache-first for same-origin GET requests, falling back to the network and
// caching whatever it returns. This handles hashed JS/CSS bundles nicely.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle requests for the same origin.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Return the cached response if we have it.
      if (cached) return cached;

      // Otherwise, fetch it from the network.
      return fetch(request)
        .then((response) => {
          // Check if we received a valid response.
          if (response && response.status === 200) {
            // Clone the response because it's a stream and can only be consumed once.
            // We need one copy to put in the cache and one to return to the browser.
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached yet — fall back to the app shell so the
          // page still opens instead of showing a browser error.
          // This is a basic form of offline support.
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
