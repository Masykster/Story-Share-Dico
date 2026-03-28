import { addStory } from '../../data/api';
import { isLoggedIn, getToken } from '../../data/auth-model';
import { addToOfflineQueue } from '../../data/idb-helper';
import CONFIG from '../../config';
import L from 'leaflet';

export default class AddStoryPage {
  #map = null;
  #marker = null;
  #selectedLat = null;
  #selectedLon = null;
  #mediaStream = null;
  #capturedBlob = null;

  async render() {
    if (!isLoggedIn()) {
      window.location.hash = '#/login';
      return '<section class="container"><p>Mengalihkan ke halaman login...</p></section>';
    }

    return `
      <section class="add-story-section container">
        <h1>Tambah Cerita Baru</h1>

        <form id="add-story-form" class="add-story-form glass-card" novalidate>
          <div class="form-group">
            <label for="story-description">Deskripsi Cerita</label>
            <textarea id="story-description" name="description" rows="4" placeholder="Ceritakan pengalamanmu..." required></textarea>
            <span class="error-msg" id="desc-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label for="story-photo">Upload Foto</label>
            <div class="photo-input-wrapper">
              <input type="file" id="story-photo" name="photo" accept="image/*" />
              <button type="button" id="camera-btn" class="btn btn-secondary" aria-label="Ambil foto dari kamera">
                📷 Kamera
              </button>
            </div>
            <span class="error-msg" id="photo-error" role="alert"></span>
          </div>

          <!-- Camera preview -->
          <div id="camera-container" class="camera-container hidden">
            <video id="camera-preview" autoplay playsinline aria-label="Preview kamera"></video>
            <div class="camera-actions">
              <button type="button" id="capture-btn" class="btn btn-primary">Ambil Foto</button>
              <button type="button" id="close-camera-btn" class="btn btn-secondary">Tutup Kamera</button>
            </div>
            <canvas id="camera-canvas" class="hidden"></canvas>
          </div>

          <div id="photo-preview-container" class="photo-preview-container hidden">
            <img id="photo-preview" alt="Preview foto yang dipilih" />
            <button type="button" id="remove-photo-btn" class="btn btn-secondary btn-sm" aria-label="Hapus foto">✕ Hapus</button>
          </div>

          <div class="form-group">
            <label>Pilih Lokasi (klik pada peta)</label>
            <div id="add-story-map" class="add-story-map" role="application" aria-label="Peta untuk memilih lokasi cerita"></div>
            <div class="coords-display">
              <span id="lat-display">Lat: -</span>
              <span id="lon-display">Lon: -</span>
            </div>
          </div>

          <button type="submit" id="submit-story-btn" class="btn btn-primary btn-full">
            <span class="btn-text">Kirim Cerita</span>
            <span class="btn-loader hidden" aria-hidden="true"></span>
          </button>
        </form>

        <div id="add-story-alert" class="alert hidden" role="alert"></div>
      </section>
    `;
  }

  async afterRender() {
    if (!isLoggedIn()) return;

    this._initMap();
    this._setupFileInput();
    this._setupCamera();
    this._setupForm();
  }

  _initMap() {
    this.#map = L.map('add-story-map', {
      center: [CONFIG.MAP_DEFAULT_LAT, CONFIG.MAP_DEFAULT_LNG],
      zoom: CONFIG.MAP_DEFAULT_ZOOM,
    });

    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    });

    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    });

    darkLayer.addTo(this.#map);
    L.control.layers({ 'Dark Mode': darkLayer, 'Street Map': osmLayer }).addTo(this.#map);

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.#selectedLat = lat;
      this.#selectedLon = lng;

      document.querySelector('#lat-display').textContent = `Lat: ${lat.toFixed(5)}`;
      document.querySelector('#lon-display').textContent = `Lon: ${lng.toFixed(5)}`;

      if (this.#marker) {
        this.#marker.setLatLng(e.latlng);
      } else {
        this.#marker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: 'custom-marker selected-marker',
            html: '<div class="marker-dot pulse"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(this.#map);
      }
    });
  }

  _setupFileInput() {
    const fileInput = document.querySelector('#story-photo');
    const previewContainer = document.querySelector('#photo-preview-container');
    const previewImg = document.querySelector('#photo-preview');
    const removeBtn = document.querySelector('#remove-photo-btn');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.#capturedBlob = null;
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    removeBtn.addEventListener('click', () => {
      fileInput.value = '';
      this.#capturedBlob = null;
      previewContainer.classList.add('hidden');
      previewImg.src = '';
    });
  }

  _setupCamera() {
    const cameraBtn = document.querySelector('#camera-btn');
    const cameraContainer = document.querySelector('#camera-container');
    const video = document.querySelector('#camera-preview');
    const captureBtn = document.querySelector('#capture-btn');
    const closeCameraBtn = document.querySelector('#close-camera-btn');
    const canvas = document.querySelector('#camera-canvas');
    const previewContainer = document.querySelector('#photo-preview-container');
    const previewImg = document.querySelector('#photo-preview');

    cameraBtn.addEventListener('click', async () => {
      try {
        this.#mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        video.srcObject = this.#mediaStream;
        cameraContainer.classList.remove('hidden');
      } catch (err) {
        alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
      }
    });

    captureBtn.addEventListener('click', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        this.#capturedBlob = blob;
        previewImg.src = URL.createObjectURL(blob);
        previewContainer.classList.remove('hidden');

        // Clear file input
        document.querySelector('#story-photo').value = '';

        this._stopCamera();
      }, 'image/jpeg', 0.85);
    });

    closeCameraBtn.addEventListener('click', () => {
      this._stopCamera();
    });
  }

  _stopCamera() {
    const cameraContainer = document.querySelector('#camera-container');
    const video = document.querySelector('#camera-preview');

    if (this.#mediaStream) {
      this.#mediaStream.getTracks().forEach((track) => track.stop());
      this.#mediaStream = null;
    }
    if (video) video.srcObject = null;
    if (cameraContainer) cameraContainer.classList.add('hidden');
  }

  async cleanup() {
    this._stopCamera();
  }

  _setupForm() {
    const form = document.querySelector('#add-story-form');
    const alertBox = document.querySelector('#add-story-alert');
    const submitBtn = document.querySelector('#submit-story-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._clearErrors();

      const description = document.querySelector('#story-description').value.trim();
      const fileInput = document.querySelector('#story-photo');
      const photo = this.#capturedBlob || (fileInput.files.length > 0 ? fileInput.files[0] : null);

      if (!this._validateForm(description, photo)) return;

      this._setLoading(submitBtn, true);

      // Check if offline
      if (!navigator.onLine) {
        try {
          // Convert photo to base64 for offline storage
          const reader = new FileReader();
          reader.onload = async () => {
            const offlineData = {
              description,
              photoBase64: reader.result,
              lat: this.#selectedLat,
              lon: this.#selectedLon,
              token: getToken(),
              createdAt: new Date().toISOString(),
            };
            await addToOfflineQueue(offlineData);
            this._showAlert(alertBox, '📡 Offline — cerita disimpan dan akan dikirim saat online kembali.', 'success');
            this._stopCamera();

            // Register sync
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
              const registration = await navigator.serviceWorker.ready;
              await registration.sync.register('sync-stories');
            }

            setTimeout(() => {
              window.location.hash = '#/';
            }, 2000);
          };
          reader.readAsDataURL(photo);
        } catch (err) {
          this._showAlert(alertBox, 'Gagal menyimpan cerita offline.', 'error');
        } finally {
          this._setLoading(submitBtn, false);
        }
        return;
      }

      try {
        const data = { description, photo };
        if (this.#selectedLat != null && this.#selectedLon != null) {
          data.lat = this.#selectedLat;
          data.lon = this.#selectedLon;
        }
        const result = await addStory(data);

        if (result.error) {
          this._showAlert(alertBox, result.message, 'error');
        } else {
          this._showAlert(alertBox, 'Cerita berhasil ditambahkan!', 'success');
          this._stopCamera();
          setTimeout(() => {
            window.location.hash = '#/';
          }, 1200);
        }
      } catch (err) {
        this._showAlert(alertBox, 'Gagal mengirim cerita. Coba lagi.', 'error');
      } finally {
        this._setLoading(submitBtn, false);
      }
    });
  }

  _validateForm(description, photo) {
    let valid = true;
    if (!description) {
      document.querySelector('#desc-error').textContent = 'Deskripsi wajib diisi.';
      valid = false;
    }
    if (!photo) {
      document.querySelector('#photo-error').textContent = 'Foto wajib diunggah atau diambil dari kamera.';
      valid = false;
    } else if (photo.size > 1024 * 1024) {
      document.querySelector('#photo-error').textContent = 'Ukuran foto maksimal 1MB.';
      valid = false;
    }
    return valid;
  }

  _clearErrors() {
    document.querySelectorAll('.error-msg').forEach((el) => (el.textContent = ''));
    const alert = document.querySelector('#add-story-alert');
    alert.classList.add('hidden');
    alert.textContent = '';
  }

  _showAlert(el, message, type) {
    el.textContent = message;
    el.className = `alert alert-${type}`;
    el.classList.remove('hidden');
  }

  _setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
      text.classList.add('hidden');
      loader.classList.remove('hidden');
      btn.disabled = true;
    } else {
      text.classList.remove('hidden');
      loader.classList.add('hidden');
      btn.disabled = false;
    }
  }
}
