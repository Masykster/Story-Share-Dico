import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { isLoggedIn, removeToken, getUserName } from '../data/auth-model';
import { subscribePush, unsubscribePush, isCurrentlySubscribed } from '../utils/push-notification';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  #updateNav() {
    const navList = document.querySelector('#nav-list');
    if (!navList) return;

    if (isLoggedIn()) {
      navList.innerHTML = `
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/add">Tambah Cerita</a></li>
        <li><a href="#/saved">Tersimpan</a></li>
        <li><a href="#/about">About</a></li>
        <li><button id="push-toggle-btn" class="nav-push-btn" aria-label="Toggle push notification">🔔 Notifikasi</button></li>
        <li><a href="#" id="logout-btn" class="nav-logout">Logout (${getUserName()})</a></li>
      `;

      const logoutBtn = document.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          removeToken();
          window.location.hash = '#/login';
        });
      }

      // Async: update push button state (non-blocking)
      this.#setupPushButton();
    } else {
      navList.innerHTML = `
        <li><a href="#/login">Masuk</a></li>
        <li><a href="#/register">Daftar</a></li>
        <li><a href="#/about">About</a></li>
      `;
    }
  }

  async #setupPushButton() {
    const pushBtn = document.querySelector('#push-toggle-btn');
    if (!pushBtn) return;

    // Check current subscription status asynchronously
    try {
      const subscribed = await isCurrentlySubscribed();
      if (subscribed) {
        pushBtn.textContent = '🔕 Notifikasi Aktif';
        pushBtn.classList.add('subscribed');
      }
    } catch (e) {
      // Service worker not available, ignore
    }

    pushBtn.addEventListener('click', async () => {
      try {
        const subscribed = await isCurrentlySubscribed();
        if (subscribed) {
          await unsubscribePush();
          pushBtn.textContent = '🔔 Notifikasi';
          pushBtn.classList.remove('subscribed');
        } else {
          await subscribePush();
          pushBtn.textContent = '🔕 Notifikasi Aktif';
          pushBtn.classList.add('subscribed');
        }
      } catch (err) {
        console.error('[Push] Toggle error:', err);
        alert(`Gagal: ${err.message}`);
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    // Cleanup current page before navigating
    if (this.currentPage && typeof this.currentPage.cleanup === 'function') {
      await this.currentPage.cleanup();
    }
    this.currentPage = page;

    if (!page) {
      this.#content.innerHTML = `
        <section class="container">
          <h1>404 - Halaman Tidak Ditemukan</h1>
          <p>Halaman yang kamu cari tidak ada.</p>
          <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
        </section>
      `;
      return;
    }

    // Custom View Transition
    if (document.startViewTransition) {
      const transition = document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
        this.#updateNav();
      });
      await transition.finished;
      await page.afterRender();
    } else {
      this.#content.innerHTML = await page.render();
      this.#updateNav();
      await page.afterRender();
    }
  }
}

export default App;
