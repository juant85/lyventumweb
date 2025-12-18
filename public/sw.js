// Service Worker - Conservative Caching Strategy
// Only caches static assets, does NOT cache API calls or Supabase data

const CACHE_NAME = 'lyventum-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    // Note: Vite bundles will be auto-cached on first load
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - Network-first strategy for safety
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests (Supabase, external APIs)
    if (url.origin !== location.origin) {
        return;
    }

    // Skip Supabase API calls (always get fresh data)
    if (url.pathname.includes('/auth/') || url.pathname.includes('/rest/')) {
        return;
    }

    // Network-first strategy for HTML
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // Cache-first for static assets (JS, CSS, images)
    if (
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('[SW] Serving from cache:', request.url);
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then((response) => {
                            // Cache successful responses
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, responseClone);
                                    });
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // Default: just fetch without caching
    event.respondWith(fetch(request));
});

// Message event - allow cache clearing from app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing cache on request');
        event.waitUntil(
            caches.delete(CACHE_NAME)
                .then(() => {
                    return self.clients.matchAll();
                })
                .then((clients) => {
                    clients.forEach((client) => {
                        client.postMessage({ type: 'CACHE_CLEARED' });
                    });
                })
        );
    }
});
