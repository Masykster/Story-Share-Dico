import { getSavedStories, removeSavedStory } from '../../data/idb-helper';
import { isLoggedIn } from '../../data/auth-model';
import { showFormattedDate } from '../../utils/index';

export default class SavedStoriesPage {
  async render() {
    if (!isLoggedIn()) {
      window.location.hash = '#/login';
      return '<section class="container"><p>Mengalihkan ke halaman login...</p></section>';
    }

    return `
      <section class="saved-section container">
        <div class="saved-header">
          <h1>Cerita Tersimpan</h1>
          <div class="search-wrapper">
            <label for="search-saved" class="sr-only">Cari cerita tersimpan</label>
            <input type="text" id="search-saved" class="search-input" placeholder="🔍 Cari berdasarkan nama atau deskripsi..." aria-label="Cari cerita tersimpan" />
          </div>
        </div>

        <div id="saved-stories-list" class="stories-list" role="list" aria-label="Daftar cerita tersimpan">
          <div class="loading-skeleton" aria-label="Memuat...">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!isLoggedIn()) return;

    this._allStories = [];
    await this._loadSavedStories();
    this._setupSearch();
  }

  async _loadSavedStories() {
    const listContainer = document.querySelector('#saved-stories-list');

    try {
      this._allStories = await getSavedStories();

      if (this._allStories.length === 0) {
        listContainer.innerHTML = '<p class="empty-text">Belum ada cerita tersimpan. Simpan cerita dari beranda!</p>';
        return;
      }

      this._renderStories(this._allStories);
    } catch (err) {
      listContainer.innerHTML = '<p class="error-text" role="alert">Gagal memuat cerita tersimpan.</p>';
    }
  }

  _renderStories(stories) {
    const listContainer = document.querySelector('#saved-stories-list');

    if (stories.length === 0) {
      listContainer.innerHTML = '<p class="empty-text">Tidak ada cerita yang cocok.</p>';
      return;
    }

    listContainer.innerHTML = stories.map((story) => this._createSavedCard(story)).join('');

    // Attach delete handlers
    listContainer.querySelectorAll('.btn-delete-saved').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await removeSavedStory(id);
        this._allStories = this._allStories.filter((s) => s.id !== id);

        const searchVal = document.querySelector('#search-saved')?.value.trim().toLowerCase() || '';
        const filtered = searchVal
          ? this._allStories.filter((s) =>
              s.name.toLowerCase().includes(searchVal) || s.description.toLowerCase().includes(searchVal)
            )
          : this._allStories;
        this._renderStories(filtered);
      });
    });
  }

  _setupSearch() {
    const searchInput = document.querySelector('#search-saved');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();

      if (!query) {
        this._renderStories(this._allStories);
        return;
      }

      const filtered = this._allStories.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
      this._renderStories(filtered);
    });
  }

  _createSavedCard(story) {
    return `
      <article class="story-card glass-card" role="listitem" tabindex="0" aria-label="Cerita tersimpan oleh ${story.name}">
        <div class="story-card__image-wrapper">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="story-card__image" loading="lazy" />
        </div>
        <div class="story-card__content">
          <h2 class="story-card__name">${story.name}</h2>
          <p class="story-card__desc">${story.description}</p>
          <time class="story-card__date" datetime="${story.createdAt}">${showFormattedDate(story.createdAt, 'id-ID')}</time>
          <button class="btn btn-secondary btn-sm btn-delete-saved" data-id="${story.id}" aria-label="Hapus cerita ${story.name} dari tersimpan">
            🗑️ Hapus
          </button>
        </div>
      </article>
    `;
  }
}
