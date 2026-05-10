/* global caches, self */
/**
 * Not registered. PWA teardown runs in client/src/pwaTeardown.ts before the app chunk loads.
 * Kept as a reference for a future, assets-only or Workbox-based worker.
 */
const CACHE_NAME = 'stackapps-v5';

function sameOrigin(url) {
  try {
    return new URL(url, self.location.href).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isApiPath(url) {
  try {
    return new URL(url, self.location.href).pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

function isAssetPath(path) {
  return path.startsWith('/assets/') && /\.(js|css|mjs)$/i.test(path);
}

function isValidAssetResponse(path, res) {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (/\.(js|mjs)$/i.test(path)) {
    return ct.includes('javascript') || ct.includes('ecmascript');
  }
  if (/\.css$/i.test(path)) {
    return ct.includes('text/css');
  }
  return true;
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;
  if (isApiPath(url) || !sameOrigin(url)) return;

  const path = new URL(url, self.location.href).pathname;
  if (!isAssetPath(path)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);
        if (response.ok) {
          if (isValidAssetResponse(path, response)) {
            await cache.put(request, response.clone());
            return response;
          }
          // 200 with wrong MIME: usually index.html for a missing file (host rewrite)
          const stale = await cache.match(request);
          if (stale) return stale;
          return new Response(null, { status: 503, statusText: 'Bad asset' });
        }
        const stale = await cache.match(request);
        if (stale) return stale;
        return response;
      } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
      }
    })(),
  );
});
