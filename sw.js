// Enhanced Service Worker for PWA functionality
const CACHE_NAME = 'projector-crm-v2';
const STATIC_CACHE_NAME = 'projector-crm-static-v2';

// Core app resources that should always be cached
const urlsToCache = [
  '/',
  '/manifest.json'
  // Note: christie.svg is cached dynamically to avoid 404 errors
];

// Install event - cache resources with error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache resources individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null; // Continue with other resources
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker installation failed:', err);
      })
  );
});

// Fetch event - serve from cache when offline with dynamic caching
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network and cache dynamic assets
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response before caching
            const responseToCache = networkResponse.clone();

            // Cache static assets (JS, CSS, images)
            if (event.request.url.includes('/assets/') || 
                event.request.url.includes('.js') || 
                event.request.url.includes('.css') ||
                event.request.url.includes('.svg') ||
                event.request.url.includes('.png') ||
                event.request.url.includes('.jpg') ||
                event.request.url.includes('.ico')) {
              
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.warn('Failed to cache asset:', event.request.url, err);
                });
            }

            return networkResponse;
          })
          .catch((error) => {
            console.warn('Network request failed:', event.request.url, error);
            // Return a fallback response for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/') || new Response('Offline', { status: 503 });
            }
            throw error;
          });
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});
