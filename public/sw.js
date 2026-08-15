// Bump this string every time you redeploy so old caches get cleared out.
const CACHE_NAME = 'sawyer-cache-v1'

const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/sawyer.png']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

// Cache-first for same-origin GET requests, falling back to the network and
// caching whatever it returns (this is how the hashed JS/CSS bundles from a
// Vite build end up cached automatically, without listing them by name).
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline and not cached yet — fall back to the app shell so the
          // page still opens instead of showing a browser error.
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
        })
    })
  )
})
