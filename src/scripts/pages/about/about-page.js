export default class AboutPage {
  async render() {
    return `
      <section class="about-section container">
        <div class="about-card glass-card">
          <h1>Tentang StoryShare</h1>
          <p class="about-desc">
            <strong>StoryShare</strong> adalah platform berbagi cerita yang menghubungkan 
            pengalaman dari berbagai penjuru dunia. Bagikan momen spesialmu bersama foto 
            dan lokasi, lalu temukan cerita inspiratif dari orang lain di peta interaktif.
          </p>
          <div class="about-features">
            <div class="feature-item glass-card">
              <span class="feature-icon" aria-hidden="true">📸</span>
              <h2>Bagikan Cerita</h2>
              <p>Unggah foto dan ceritamu dengan mudah langsung dari browser atau kamera.</p>
            </div>
            <div class="feature-item glass-card">
              <span class="feature-icon" aria-hidden="true">🗺️</span>
              <h2>Jelajahi Peta</h2>
              <p>Lihat cerita dari seluruh penjuru dunia melalui peta interaktif.</p>
            </div>
            <div class="feature-item glass-card">
              <span class="feature-icon" aria-hidden="true">🌟</span>
              <h2>Inspirasi Bersama</h2>
              <p>Temukan inspirasi dari pengalaman dan sudut pandang orang lain.</p>
            </div>
          </div>
          <p class="about-footer">
            Dibangun dengan ❤️ menggunakan Dicoding Story API.
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // No additional logic needed
  }
}
