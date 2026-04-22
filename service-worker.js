/**
 * Service Worker for Golf Putting Speed Trainer PWA
 */

const CACHE_NAME = 'putting-speed-v7';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './src/assets/icon.svg',
    './src/css/styles.css',
    './src/js/app.js',
    './src/js/analysis/AnalysisController.js',
    './src/js/camera/CameraController.js',
    './src/js/recording/RecordingController.js',
    './src/js/tracking/MarkerTracker.js',
    './src/js/ui/UIController.js',
    './src/js/utils/geometry.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache.map(url => new URL(url, self.registration.scope).toString()));
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
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(networkResponse => {
                    return networkResponse;
                });
            })
    );
}); 
