const DB_NAME = 'storyshare-db';
const DB_VERSION = 1;
const STORE_STORIES = 'stories';
const STORE_SAVED = 'saved-stories';
const STORE_QUEUE = 'offline-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SAVED)) {
        db.createObjectStore(STORE_SAVED, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ Cached Stories (from API) ============

export async function cacheStories(stories) {
  const db = await openDB();
  const tx = db.transaction(STORE_STORIES, 'readwrite');
  const store = tx.objectStore(STORE_STORIES);
  for (const story of stories) {
    store.put(story);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_STORIES, 'readonly');
  const store = tx.objectStore(STORE_STORIES);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ============ Saved/Bookmarked Stories ============

export async function saveStory(story) {
  const db = await openDB();
  const tx = db.transaction(STORE_SAVED, 'readwrite');
  tx.objectStore(STORE_SAVED).put({ ...story, savedAt: new Date().toISOString() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_SAVED, 'readonly');
  const request = tx.objectStore(STORE_SAVED).getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeSavedStory(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_SAVED, 'readwrite');
  tx.objectStore(STORE_SAVED).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function isStorySaved(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_SAVED, 'readonly');
  const request = tx.objectStore(STORE_SAVED).get(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ Offline Queue ============

export async function addToOfflineQueue(data) {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, 'readwrite');
  tx.objectStore(STORE_QUEUE).add(data);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, 'readonly');
  const request = tx.objectStore(STORE_QUEUE).getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromOfflineQueue(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, 'readwrite');
  tx.objectStore(STORE_QUEUE).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearOfflineQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, 'readwrite');
  tx.objectStore(STORE_QUEUE).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
