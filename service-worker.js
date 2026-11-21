const CACHE_NAME = 'legendary-randomizer-v9';
const APP_FILES = ['./', './index.html', './dc.html', './pwa-setup.js', './version.json', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  // cache: reload fuerza archivos recientes también durante la instalación.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(
    APP_FILES.map(path => new Request(path, { cache: 'reload' }))
  )));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => /^legendary-randomizer-v\d+$/.test(key) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Las consultas de versión llevan un parámetro cambiante y no deben guardarse en caché.
  if (new URL(event.request.url).searchParams.has('check')) return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
