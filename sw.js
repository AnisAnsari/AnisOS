/* ============================================================================
 *  ANIS OS — Service Worker (PWA)
 * ----------------------------------------------------------------------------
 *  Strategy
 *    • Install : precache the core app shell (graceful if an asset is missing)
 *    • Navigate: network-first → cached copy → offline.html
 *    • Static  : stale-while-revalidate for same-origin assets
 *    • CDNs    : left to the network (keeps the runtime cache small)
 *  Update    : new versions skipWaiting + notify clients to refresh.
 * ========================================================================== */
'use strict';

const VERSION = 'anis-os-v1.0.0';
const CORE_CACHE = `${VERSION}-core`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

/** Files that make up the offline app shell. Keep this list in sync with the repo. */
const CORE_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/data.js',
  './assets/js/theme.js',
  './assets/js/animation.js',
  './assets/js/app.js',
  './assets/js/interaction.js',
  './assets/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_URLS).catch(() => { /* never block install */ }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
  // Tell open tabs that a fresh version is live.
  self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage({ type: 'SW_UPDATE' }));
  });
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigation → network-first, offline.html last resort.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('./offline.html'))
        )
    );
    return;
  }

  // Same-origin static assets → stale-while-revalidate.
  if (sameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
  // Cross-origin requests (CDNs) flow through untouched.
});

/* Background Sync placeholder — attach a real job (analytics outbox, form queue)
   by replacing the waitUntil callback. */
self.addEventListener('sync', (event) => {
  if (event.tag === 'anis-os-sync') {
    event.waitUntil(/* placeholder */ Promise.resolve());
  }
});
