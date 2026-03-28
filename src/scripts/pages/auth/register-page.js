import { register } from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="auth-section">
        <div class="auth-card glass-card">
          <div class="auth-header">
            <h1>Daftar</h1>
            <p>Buat akun StoryShare baru</p>
          </div>
          <form id="register-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="register-name">Nama</label>
              <input type="text" id="register-name" name="name" placeholder="Nama lengkap" required autocomplete="name" />
              <span class="error-msg" id="name-error" role="alert"></span>
            </div>
            <div class="form-group">
              <label for="register-email">Email</label>
              <input type="email" id="register-email" name="email" placeholder="nama@email.com" required autocomplete="email" />
              <span class="error-msg" id="email-error" role="alert"></span>
            </div>
            <div class="form-group">
              <label for="register-password">Password</label>
              <input type="password" id="register-password" name="password" placeholder="Minimal 8 karakter" required minlength="8" autocomplete="new-password" />
              <span class="error-msg" id="password-error" role="alert"></span>
            </div>
            <button type="submit" id="register-submit-btn" class="btn btn-primary">
              <span class="btn-text">Daftar</span>
              <span class="btn-loader hidden" aria-hidden="true"></span>
            </button>
          </form>
          <div id="register-alert" class="alert hidden" role="alert"></div>
          <p class="auth-switch">Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#register-form');
    const alertBox = document.querySelector('#register-alert');
    const submitBtn = document.querySelector('#register-submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._clearErrors();

      const name = document.querySelector('#register-name').value.trim();
      const email = document.querySelector('#register-email').value.trim();
      const password = document.querySelector('#register-password').value;

      if (!this._validate(name, email, password)) return;

      this._setLoading(submitBtn, true);

      try {
        const result = await register({ name, email, password });
        if (result.error) {
          this._showAlert(alertBox, result.message, 'error');
        } else {
          this._showAlert(alertBox, 'Registrasi berhasil! Mengalihkan ke login...', 'success');
          setTimeout(() => {
            window.location.hash = '#/login';
          }, 1200);
        }
      } catch (err) {
        this._showAlert(alertBox, 'Gagal terhubung ke server.', 'error');
      } finally {
        this._setLoading(submitBtn, false);
      }
    });
  }

  _validate(name, email, password) {
    let valid = true;
    if (!name) {
      document.querySelector('#name-error').textContent = 'Nama wajib diisi.';
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.querySelector('#email-error').textContent = 'Masukkan email yang valid.';
      valid = false;
    }
    if (!password || password.length < 8) {
      document.querySelector('#password-error').textContent = 'Password minimal 8 karakter.';
      valid = false;
    }
    return valid;
  }

  _clearErrors() {
    document.querySelectorAll('.error-msg').forEach((el) => (el.textContent = ''));
    const alert = document.querySelector('#register-alert');
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
