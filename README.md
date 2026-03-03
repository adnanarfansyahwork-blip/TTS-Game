# 🧩 TTS Quest (Quiz GenZ)

![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

**TTS Quest** adalah permainan Teka-Teki Silang (TTS) modern berbasis web SPA (Single Page Application) yang sangat interaktif dan responsif untuk mobile maupun desktop. 

Aplikasi ini dibuat sebagai pemenuhan tes *Software Engineer*, mencakup **Admin Panel** (TTS Creator) dengan algoritma *auto-crossword generator* di sisi client, dan **Player Dashboard** yang meniru *feel* game puzzle native populer (seperti Wordscapes) dengan fitur *word wheel swipe*, input keyboard cerdas, *timer*, dan *hint system*.

---

## ✨ Fitur Utama (Sesuai Requirement)

### 1. TTS Creator / Admin Panel (Khusus Role Admin)
- 📝 Form input dinamis untuk **Kata** dan **Clue** (Min. 5 kata, Maks. 15 kata).
- 🧠 **Algoritma Generator Otomatis:** Sistem secara pintar akan menyusun papan kotak saling silang (intersection) jika ada huruf yang sama antar kata.
- 👁️ **Live Visual Preview:** Admin bisa melihat bentuk grid sebelum disimpan ke database.
- 💾 Kemampuan *Publish* puzzle dan tab **History** berisi daftar TTS yang pernah dibuat.

### 2. TTS Player (Gameplay User)
- 🎮 Grid interaktif yang menyesuaikan ukuran layar secara otomatis (responsive).
- 📲 **Dua Mode Input:** 
  1. Melingkar (*Word Wheel* gaya Wordscapes) yang bisa di-**swipe**.
  2. Input **Keyboard** konvensional dengan *auto-advance focus* ke kotak berikutnya.
- 📜 Daftar *clue/petunjuk* yang interaktif (tercoret otomatis saat kata terjawab).
- 🏆 Visual *feedback* seketika (kotak menyala emas saat jawaban benar secara instan).
- 🔔 *Win Modal Notification* lengkap dengan catatan Waktu (Timer) dan Bintang (Score).

### 3. Akses & Berbagi Puzzle (Shareable)
- 🔗 Tiap puzzle memiliki susunan *routing URL unik* (contoh: `/play/1`, `/play/2`).
- 🔓 Puzzle **terbuka untuk publik** (bisa diakses dan dimainkan tanpa perlu registrasi/login).
- 🗺️ Halaman beranda (*Home*) yang menyajikan roadmap *level selection* interaktif berurut.

### 4. Extra Feature (Nilai Tambah UI/UX)
- 💡 **Sistem Bantuan (Hint):** Tombol bohlam untuk menyingkap satu huruf acak.
- ⏳ **Stopwatch Timer:** Menghitung total durasi penyelesaian level.
- 🔄 **Shuffle Wheel:** Tombol untuk mengacak tata letak huruf di roda swipe.
- 🔐 **Pita Keamanan Role-Based:** Pengguna biasa (Player) terblokir ketat (*HTTP 403*) jika mencoba mengakses endpoint atau page Panel Admin, dicegah sejak lapis Backend Middleware (*Sanctum*).

---

## 📸 Screenshots Demo

<div align="center">
  <img src="public/screenshots/home.webp" width="30%" alt="Roadmap Home Page" />
  <img src="public/screenshots/gameplay.png" width="30%" alt="In-Game Player Area" />
  <img src="public/screenshots/admin.png" width="30%" alt="Admin Puzzle Generator" />
</div>

> *Screenshot asli tersimpan di folder `/public/screenshots/` (Jika gambar rusak saat dibaca di local markdown reader).*

---

## 🚀 Tech Stack & Arsitektur

- **Backend / API Server:** Laravel 11 (PHP 8.2+), ekosistem REST API.
- **Database:** SQLite (Default, sangat *portable* tidak butuh install MySQL/MariaDB daemon untuk mereview).
- **Authentication:** Laravel Sanctum (Token-Based dengan *Role Differentiation*: `auth_token` vs `admin_token`).
- **Frontend / Client:** React 18, React Router DOM v6, Axios.
- **Styling:** *Vanilla CSS Custom* murni (Gaya *Glassmorphism*, gradien warna dinamis, dan keyframes micro-animation) di dalam file tunggal `app.css`. Tanpa bloated utility framework.
- **Build Tool:** Vite.js.

---

## 🛠️ Panduan Instalasi & Menjalankan di Lokal

### Prasyarat:
- **PHP 8.2** atau lebih baru.
- **Composer** (PHP Package Manager).
- **Node.js** (v18+) dan **npm**.

### Langkah-langkah:

**1. Clone atau Ekstrak Repository Project**
Jalankan perintah clone berikut di Terminal/Command Prompt untuk mengunduh source code (atau sedot via file .zip):
```bash
git clone https://github.com/adnanarfansyahwork-blip/TTS-Game.git
cd TTS-Game
```

**2. Setup Backend (Laravel)**
Jalankan perintah berikut berurutan di terminal:
```bash
composer install
cp .env.example .env     # (Windows CMD: copy .env.example .env)
php artisan key:generate
```

**3. Migrasi Database dan Data Awal (Wajib!)**
Sistem menggunakan Seeder khusus untuk membuat akun *Admin* dan men-generate sampel puzzle *Level 1-3*.
```bash
php artisan migrate:fresh --seed
```
*Akun Administrator yang digenerate:*
- **Email:** `admin@admin.com`
- **Password:** `password123`

**4. Setup Frontend (React / Vite)**
Pada terminal yang sama (atau tab terminal baru), install library javascript:
```bash
npm install
```

**5. Menjalankan Development Server**
Karena ini menggunakan Laravel + Vite secara bersamaan, buka **2 jendela terminal terpisah** di dalam folder project:

- **Terminal 1 (Menjalankan API Server):**
  ```bash
  php artisan serve
  ```
- **Terminal 2 (Menjalankan Frontend Asset Bundler):**
  ```bash
  npm run dev
  ```

Akses App di Browser: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

*(Catatan: Anda sudah bisa langsung menekan tombol "Level 1" di halaman utama tanpa perlu login untuk mencoba sistemnya).*

---

## 📂 Struktur Penting Direktori Aplikasi

Project ini mengikuti Standar Monolith SPA Laravel 11 terbaru:
- `/routes/api.php` ➔ Jalur routing REST API backend beserta proteksi *middleware* otorisasi admin.
- `/app/Http/Controllers/` ➔ Terdapat `PuzzleController.php` (menangani database TTS) dan `AuthController.php` (login/token logic).
- `/database/seeders/DatabaseSeeder.php` ➔ Data susunan array matriks awal Grid contoh TTS untuk memperlancar proses testing Anda.
- `/resources/js/` ➔ **Pusat Frontend React**, berisi pages *SPA*.
- `/resources/js/lib/crosswordGenerator.js` ➔ **CORE ALGORITHM**. Source code utama dari otak matematis yang mengatur logika intersection (*persinggungan tata letak*) generator papan TTS secara prosedural.
- `/resources/css/app.css` ➔ Sumber UI/UX (Desain *Grassland/Meadow* kekinian).
- `/ALGORITHM_DOCS.md` ➔ Lembar lampiran khusus yang membahas bedah algoritma `crosswordGenerator.js` dan laporan Bugfix selama development test ini.
