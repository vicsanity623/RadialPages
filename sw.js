const CACHE_NAME = 'vicsanity-v1.0.0'; // Change this string to force a cache clear on all devices
const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// 1. Install Event: Cache core files immediately
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Force this SW to become active immediately
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// 2. Activate Event: Clean up old caches (Force Update logic)
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim(); // Take control of the page immediately
});

// 3. Fetch Event: Network First, then Cache (The "Freshness" Strategy)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // If network fetch succeeds, update the cache with the new version
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // If network fails (offline), return cached version
                return caches.match(e.request);
            })
    );
});
