const CACHE_NAME = 'arcanum-shell-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/arcanum-icon.svg', '/favicon.ico'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // O HTML de navegação nunca deve ficar preso a um bundle antigo: o Vite
  // troca os nomes dos assets a cada deploy e um shell desatualizado causa
  // tela vazia mesmo quando a API continua respondendo normalmente.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => response)
        .catch(() => caches.match('/index.html')),
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html'))),
  );
});
