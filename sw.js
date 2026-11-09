const CACHE_NAME = 'frequence-shell-v4';
const VERSION = 'v4';
const ASSETS = [
  `./?${VERSION}`,
  `./index.html?${VERSION}`,
  `./styles.css?${VERSION}`,
  `./app.js?${VERSION}`,
  `./manifest.webmanifest?${VERSION}`,
  `./icon.svg?${VERSION}`,
  `./icon-180.png?${VERSION}`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isEntry = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html');
  const networkRequest = isEntry ? new Request(event.request, { cache: 'no-store' }) : event.request;
  event.respondWith(
    fetch(networkRequest)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(`./index.html?${VERSION}`)))
  );
});