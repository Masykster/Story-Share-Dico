ini adalah update dari task sebelumnya 
**Ingat tetap pertahankan kriteria sebelumnya yang sudah ada dan dibuat**

Kriteria 1: Mempertahankan Seluruh Kriteria Wajib Submission Sebelumnya

Berikut adalah daftar kriteria pada submission sebelumnya yang perlu dipertahankan.

- Menerapkan SPA dan Transisi Halaman.
- Menampilkan Data dan Marker Pada Peta.
- Memiliki Fitur Tambah Data Baru.
- Menerapkan Aksesibilitas sesuai dengan Standar.

Kriteria 2: Menerapkan Push Notification
Salah satu background execution dalam aplikasi web adalah push notification. Anda wajib menerapkan push notification dari API yang sebelumnya digunakan.

- Dapat menampilkan push notification dasar dari server melalui service worker.

Detailnya:
Push notification harus tampil melalui trigger data dari API, yaitu dengan membuat data story baru.

- Dapat menyesuaikan isi notifikasi (judul, icon, pesan) secara dinamis.
- Menampilkan notifikasi secara dinamis dengan memanfaatkan data event yang dibawa oleh service worker.

- Menyajikan notifikasi secara lebih komprehensif dengan menghadirkan berbagai fitur lanjutan.
- Menambahkan button toggle untuk enable/disable langganan push notification.
- Menambahkan action untuk navigasi menuju halaman detail data terkait.

Kriteria 3: Implementasi PWA dengan Dukungan Instalasi dan Mode Offline
Aplikasi harus memiliki pengalaman pengguna yang baik, setidaknya menerapkan dukungan instalasi ke homescreen dan dapat diakses secara offline.

Dapat membuat aplikasi yang installable dan dapat diakses dalam keadaan offline (walau hanya app shell).

Detailnya:

Fitur atau pop-up installable apps muncul baik pada perangkat mobile atau desktop.
Aplikasi dapat diakses secara offline, walau hanya application shell yang tetap tampil.

Dapat meningkatkan pengalaman pengguna PWA dengan menambahkan fitur lanjutan seperti screenshots, shortcuts, dan pengaturan tema pada Web App Manifest.

Detailnya:

Terdapat contoh screenshot aplikasi pada Web App Manifest.
Tidak ada warning atau recommended action pada Web App Manifest jika dilihat dari Chrome Dev Tools (Application -> Manifest).

Dapat mengatur agar aplikasi tetap dapat diakses sebagian saat offline dengan melakukan cache pada data dinamis menggunakan strategi caching yang sesuai.

Detailnya:
Ketika diakses dalam keadaan offline, konten dinamis seperti data dari API masih tetap muncul dan dapat dilihat dengan baik oleh pengguna.

Kriteria 4: Penerapan IndexedDB
Aplikasi memiliki sebuah fitur (create, read, dan delete) yang memanfaatkan IndexedDB. Berikut ketentuan detailnya.

- Dapat menampilkan, menyimpan dan menghapus data dari API pada indexedDB.

Detailnya:

Terdapat sebuah fitur (create, read, dan delete) yang memanfaatkan IndexedDB.
Fitur dapat diakses/digunakan dengan baik dari sisi user.

- Dapat melakukan interaktivitas pada data yang ditampilkan, seperti filter, sorting, searching dan lain sebagainya.

Detailnya:

Menerapkan ketentuan basic.
Fitur yang diimplementasi memiliki interaktivitas seperti filter, sorting, searching, dan lain sebagainya.

- Dapat melakukan synchronize data yang disimpan secara offline saat perangkat tidak terhubung ke internet dan mengirimnya ketika sudah online.

Detailnya:

Pada fitur yang sama atau fitur baru, aplikasi memiliki sebuah fitur untuk melakukan synchronize data offline dan online. Jadi dalam keadaan offline, aplikasi masih dapat membuat data baru, jika koneksi sudah kembali online, data tersebut akan di-sync dengan API.