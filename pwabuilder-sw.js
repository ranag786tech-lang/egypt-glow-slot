// Import Workbox from Google CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `pwabuilder-page-${CACHE_VERSION}`;
const OFFLINE_FALLBACK_PAGE = "offline.html"; // Make sure this file exists in your root directory

// Assets to precache immediately on install
const PRECACHE_ASSETS = [
  OFFLINE_FALLBACK_PAGE,
  "/",
  "/index.html",
  "/styles.css", // Update with your actual CSS path if different
  "/app.js"      // Update with your actual JS path if different
];

// Skip waiting to activate new service worker immediately
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Install Event: Cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache and adding precache assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith("pwabuilder-page-") && cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Enable Navigation Preload if supported
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Fetch Event: Handle page navigation and fallback to offline page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Try using navigation preload if available
        const preloadResp = await event.preloadResponse;
        if (preloadResp) {
          return preloadResp;
        }

        // Otherwise, fetch from network
        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        // Network failed, serve the offline fallback page from cache
        console.log("Network request failed; serving offline fallback page.", error);
        const cache = await caches.open(CACHE_NAME);
        const cachedResp = await cache.match(OFFLINE_FALLBACK_PAGE);
        return cachedResp;
      }
    })());
  }
});