const CACHE_NAME = 'storyshare-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.webmanifest',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API requests: network first, fallback to cache
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // App shell and static assets: cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((response) => {
          // Cache successful responses for static assets
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to index.html for navigation requests (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});

// Push notification
self.addEventListener('push', (event) => {
  let data = {
    title: 'StoryShare',
    options: {
      body: 'Ada cerita baru!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: { url: '/' },
    },
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data.title = pushData.title || data.title;
      data.options = {
        ...data.options,
        body: pushData.options?.body || data.options.body,
        data: pushData.options?.data || data.options.data,
      };
    } catch (e) {
      data.options.body = event.data.text();
    }
  }

  // Add action buttons
  data.options.actions = [
    { action: 'open', title: 'Buka Aplikasi' },
    { action: 'close', title: 'Tutup' },
  ];

  event.waitUntil(
    self.registration.showNotification(data.title, data.options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Background sync for offline stories
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-queue', 'readonly');
    const store = tx.objectStore('offline-queue');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const items = request.result;
        if (!items || items.length === 0) {
          resolve();
          return;
        }

        for (const item of items) {
          try {
            const formData = new FormData();
            formData.append('description', item.description);

            // Convert base64 photo back to blob
            if (item.photoBase64) {
              const response = await fetch(item.photoBase64);
              const blob = await response.blob();
              formData.append('photo', blob, 'photo.jpg');
            }

            if (item.lat != null && item.lon != null) {
              formData.append('lat', item.lat);
              formData.append('lon', item.lon);
            }

            const apiResponse = await fetch('https://story-api.dicoding.dev/v1/stories', {
              method: 'POST',
              headers: { Authorization: `Bearer ${item.token}` },
              body: formData,
            });

            if (apiResponse.ok) {
              // Remove from offline queue
              const deleteTx = db.transaction('offline-queue', 'readwrite');
              deleteTx.objectStore('offline-queue').delete(item.id);
            }
          } catch (err) {
            console.error('[SW] Sync failed for item:', item.id, err);
          }
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[SW] Sync error:', err);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('storyshare-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('stories')) {
        db.createObjectStore('stories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('saved-stories')) {
        db.createObjectStore('saved-stories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
