// Service Worker for PrimeWay PWA
const CACHE_NAME = 'primeway-pwa-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
  '/IMG-20260215-WA0003.jpg'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets could not be cached during SW install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First with Cache Fallback for navigation, Cache-First for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and non-http(s) (e.g. chrome-extension://)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass Firebase API / Google API / Auth / Firestore calls to avoid stale auth data
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com')
  ) {
    return;
  }

  // Navigation / HTML requests: Network-First strategy
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If offline, return cached document or root
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Static Assets (JS, CSS, Images, Fonts, Icons): Cache-First with Network Fallback & Update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and fetch update in background (Stale-While-Revalidate for local assets)
        if (url.origin === self.location.origin) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // Fetch from network and cache
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback for failed image requests if needed
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
