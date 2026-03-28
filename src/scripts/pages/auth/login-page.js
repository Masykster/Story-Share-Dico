import { login } from '../../data/api';
import { setToken, setUserName } from '../../data/auth-model';

export default class LoginPage {
  async render() {
    return `
      <section class="auth-section">
        <div class="auth-card glass-card">
          <div class="auth-header">
            <h1>Masuk</h1>
            <p>Masuk ke akun StoryShare kamu</p>
          </div>
          <form id="login-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" name="email" placeholder="nama@email.com" required autocomplete="email" />
              <span class="error-msg" id="email-error" role="alert"></span>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" name="password" placeholder="Minimal 8 karakter" required minlength="8" autocomplete="current-password" />
              <span class="error-msg" id="password-error" role="alert"></span>
            </div>
            <button type="submit" id="login-submit-btn" class="btn btn-primary">
              <span class="btn-text">Masuk</span>
              <span class="btn-loader hidden" aria-hidden="true"></span>
            </button>
          </form>
          <div id="login-alert" class="alert hidden" role="alert"></div>
          <p class="auth-switch">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#login-form');
    const emailInput = document.querySelector('#login-email');
    const passwordInput = document.querySelector('#login-password');
    const alertBox = document.querySelector('#login-alert');
    const submitBtn = document.querySelector('#login-submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._clearErrors();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!this._validate(email, password)) return;

      this._setLoading(submitBtn, true);

      try {
        const result = await login({ email, password });
        if (result.error) {
          this._showAlert(alertBox, result.message, 'error');
        } else {
          setToken(result.loginResult.token);
          setUserName(result.loginResult.name);
          this._showAlert(alertBox, 'Login berhasil! Mengalihkan...', 'success');
          setTimeout(() => {
            window.location.hash = '#/';
          }, 800);
        }
      } catch (err) {
        this._showAlert(alertBox, 'Gagal terhubung ke server.', 'error');
      } finally {
        this._setLoading(submitBtn, false);
      }
    });
  }

  _validate(email, password) {
    let valid = true;
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
    const alert = document.querySelector('#login-alert');
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
