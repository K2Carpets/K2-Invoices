// K2 Invoices - Network-first (auto-updates, offline fallback)
const CACHE = 'k2-invoices-v65';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Never cache Anthropic API calls
  if (req.url.includes('api.anthropic.com')) return;

  // NETWORK-FIRST: always try to fetch the latest from the network.
  // Fall back to the cached copy only if offline / fetch fails.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.open(CACHE).then((cache) => cache.match(req))
      )
  );
});
