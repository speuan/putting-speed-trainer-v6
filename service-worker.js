/**
 * Service Worker for Golf Putting Speed Trainer PWA
 */

const CACHE_NAME = 'putting-speed-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/css/styles.css',
    '/src/js/app.js',
    '/src/js/camera/CameraController.js',
    '/src/js/ui/UIController.js',
    '/src/js/tracking/MarkerTracker.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - respond with cached assets when available
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
}); 