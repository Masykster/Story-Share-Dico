import { getStories } from '../../data/api';
import { isLoggedIn } from '../../data/auth-model';
import { showFormattedDate } from '../../utils/index';
import { cacheStories, getCachedStories, saveStory, isStorySaved } from '../../data/idb-helper';
import CONFIG from '../../config';
import L from 'leaflet';

export default class HomePage {
  #map = null;
  #markers = [];
  #markerGroup = null;

  async render() {
    if (!isLoggedIn()) {
      window.location.hash = '#/login';
      return '<section class="container"><p>Mengalihkan ke halaman login...</p></section>';
    }

    return `
      <section class="home-section container">
        <div class="home-header">
          <h1>Cerita Terbaru</h1>
          <a href="#/add" class="btn btn-primary btn-add" aria-label="Tambah cerita baru">
            <span aria-hidden="true">＋</span> Tambah Cerita
          </a>
        </div>

        <div class="home-layout">
          <div class="stories-list" id="stories-list" role="list" aria-label="Daftar cerita">
            <div class="loading-skeleton" aria-label="Memuat cerita...">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          </div>

          <div class="map-wrapper">
            <div id="stories-map" class="stories-map" role="application" aria-label="Peta lokasi cerita"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!isLoggedIn()) return;

    this._initMap();
    await this._loadStories();
  }

  _initMap() {
    this.#map = L.map('stories-map', {
      center: [CONFIG.MAP_DEFAULT_LAT, CONFIG.MAP_DEFAULT_LNG],
      zoom: CONFIG.MAP_DEFAULT_ZOOM,
      zoomControl: true,
    });

    // Tile layers
    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    });

    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 18,
    });

    // Default layer
    darkLayer.addTo(this.#map);

    // Layer control
    const baseMaps = {
      'Dark Mode': darkLayer,
      'Street Map': osmLayer,
      'Satelit': satelliteLayer,
    };
    L.control.layers(baseMaps).addTo(this.#map);

    this.#markerGroup = L.layerGroup().addTo(this.#map);
  }

  async _loadStories() {
    const listContainer = document.querySelector('#stories-list');
    let stories = [];

    try {
      const result = await getStories({ location: 1, size: 20 });

      if (result.error) {
        // Try offline fallback
        stories = await getCachedStories();
        if (stories.length === 0) {
          listContainer.innerHTML = `<p class="error-text" role="alert">Gagal memuat cerita: ${result.message}</p>`;
          return;
        }
        this._showOfflineBanner(listContainer);
      } else {
        stories = result.listStory || [];
        // Cache for offline
        if (stories.length > 0) {
          await cacheStories(stories);
        }
      }
    } catch (err) {
      // Offline: load from IndexedDB
      stories = await getCachedStories();
      if (stories.length === 0) {
        listContainer.innerHTML = '<p class="error-text" role="alert">Gagal terhubung ke server. Tidak ada data offline.</p>';
        return;
      }
      this._showOfflineBanner(listContainer);
    }

    if (stories.length === 0) {
      listContainer.innerHTML = '<p class="empty-text">Belum ada cerita. Jadilah yang pertama!</p>';
      return;
    }

    await this._renderStories(stories, listContainer);
  }

  _showOfflineBanner(container) {
    const existing = container.querySelector('.offline-banner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = '📡 Mode offline — menampilkan data tersimpan';
    container.prepend(banner);
  }

  async _renderStories(stories, listContainer) {
    // Build cards with save state
    const cardPromises = stories.map(async (story) => {
      const saved = await isStorySaved(story.id);
      return this._createStoryCard(story, saved);
    });
    const cards = await Promise.all(cardPromises);
    listContainer.innerHTML = cards.join('');

    // Add markers
    stories.forEach((story) => {
      if (story.lat != null && story.lon != null) {
        const marker = L.marker([story.lat, story.lon], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-dot"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        });

        marker.bindPopup(`
          <div class="map-popup">
            <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" width="150" />
            <strong>${story.name}</strong>
            <p>${story.description.substring(0, 80)}${story.description.length > 80 ? '...' : ''}</p>
          </div>
        `);

        marker.storyId = story.id;
        marker.addTo(this.#markerGroup);
        this.#markers.push(marker);
      }
    });

    // Sync: click story card → highlights marker on map
    listContainer.querySelectorAll('.story-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Don't trigger card click on save button
        if (e.target.closest('.btn-save-story')) return;

        const storyId = card.dataset.id;
        const marker = this.#markers.find((m) => m.storyId === storyId);
        if (marker) {
          this.#map.flyTo(marker.getLatLng(), 13, { duration: 0.8 });
          marker.openPopup();

          // highlight active
          listContainer.querySelectorAll('.story-card').forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
        }
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Save button handlers
    listContainer.querySelectorAll('.btn-save-story').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.id;
        const story = stories.find((s) => s.id === storyId);
        if (!story) return;

        await saveStory(story);
        btn.textContent = '✓ Tersimpan';
        btn.disabled = true;
        btn.classList.add('saved');
      });
    });

    // Fit bounds if markers exist
    if (this.#markers.length > 0) {
      const group = L.featureGroup(this.#markers);
      this.#map.fitBounds(group.getBounds().pad(0.2));
    }
  }

  _createStoryCard(story, isSaved = false) {
    return `
      <article class="story-card glass-card" data-id="${story.id}" tabindex="0" role="listitem" aria-label="Cerita oleh ${story.name}">
        <div class="story-card__image-wrapper">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="story-card__image" loading="lazy" />
        </div>
        <div class="story-card__content">
          <h2 class="story-card__name">${story.name}</h2>
          <p class="story-card__desc">${story.description}</p>
          <div class="story-card__footer">
            <time class="story-card__date" datetime="${story.createdAt}">${showFormattedDate(story.createdAt, 'id-ID')}</time>
            <button class="btn btn-sm btn-save-story ${isSaved ? 'saved' : ''}" data-id="${story.id}" ${isSaved ? 'disabled' : ''} aria-label="${isSaved ? 'Sudah tersimpan' : 'Simpan cerita'}">
              ${isSaved ? '✓ Tersimpan' : '🔖 Simpan'}
            </button>
          </div>
          ${story.lat != null ? `<span class="story-card__location" aria-label="Memiliki lokasi">📍</span>` : ''}
        </div>
      </article>
    `;
  }
}
