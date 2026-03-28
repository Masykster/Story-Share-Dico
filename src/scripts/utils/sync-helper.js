import { getOfflineQueue, removeFromOfflineQueue } from '../data/idb-helper';
import { getToken } from '../data/auth-model';
import CONFIG from '../config';

export async function syncOfflineStories() {
  try {
    const queue = await getOfflineQueue();
    if (!queue || queue.length === 0) return;

    const token = getToken();
    if (!token) return;

    let syncedCount = 0;

    for (const item of queue) {
      try {
        const formData = new FormData();
        formData.append('description', item.description);

        // Convert base64 photo back to blob
        if (item.photoBase64) {
          const res = await fetch(item.photoBase64);
          const blob = await res.blob();
          formData.append('photo', blob, 'photo.jpg');
        }

        if (item.lat != null && item.lon != null) {
          formData.append('lat', item.lat);
          formData.append('lon', item.lon);
        }

        const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          await removeFromOfflineQueue(item.id);
          syncedCount++;
        }
      } catch (err) {
        console.error('[Sync] Failed to sync item:', item.id, err);
      }
    }

    if (syncedCount > 0) {
      console.log(`[Sync] Synced ${syncedCount} stories`);
      // Refresh the page if on home
      if (window.location.hash === '#/' || window.location.hash === '') {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }
  } catch (err) {
    console.error('[Sync] Error:', err);
  }
}
