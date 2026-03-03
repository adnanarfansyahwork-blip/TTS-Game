# 📘 Dokumentasi Singkat: Logika, Algoritma & Penyelesaian Masalah

Proyek TTS Quest ini membutuhkan pemrosesan cerdas di latar belakang untuk menerjemahkan kumpulan teks mentah (kata & clue) menjadi papan catur (grid) teka-teki silang secara otomatis (*Crossword Generator Algoritma*), sekaligus pengelolaan pengalaman interaktif di sisi pengguna (UX). Berikut adalah ulasan dari *behind the scenes*.

---

## 1. Penjelasan Cara Kerja Algoritma (Crossword Generator)

Untuk membuat formasi teka-teki silang secara otomatis, file pelaksana `crosswordGenerator.js` (Frontend React) memproses alur kerja (*pipeline*) algoritma seperti berikut:

**A. Penyusunan dan Persiapan Kata:**
1. Keseluruhan susunan array kata diubah ke huruf kapital dan dihilangkan semua karakternya yang redundan misalnya spasi (Trim & UpperCase).
2. Terdapat **Sorting (Pengurutan):** Algoritma mengurutkan input kata murni secara leksikal berdasarkan *panjang kata* dari yang terpanjang ke terpendek. Alasan utamanya adalah: menjadikan kata yang sangat panjang sebagai "tulang punggung" (*spine*) jauh lebih menguntungkan untuk mencari singgungan (*intersections*) cabang-cabangnya bagi kata-kata yang mendampingi lebih kecil.

**B. Koordinat Grid (Sistem *Sparse Matrix* Hash Map):**
Sistem *tidak* memakai Array 2D polos sedari awal yang berpotensi meluapkan batas matriks (*Array Overflow*), karena posisi kata masih mengambang (float). Generator memakai Objek *Hash Table* dengan format kunci spasial `(x, y)` sebagai string hash (`key: "0,0"` merujuk nilai karakter `'A'`).

**C. Penempatan Silang (The Placement Phase):**
1. **Titik Jangkar Sentral (Anchor):** Kata urutan per-1 yang terpanjang dideklarasikan pada posisi Origin `(0, 0)` berarah Menurun/Mendatar (`across`). Status kata pertama `placed = true`.
2. Dimulailah Loop Iterasi untuk menemukan letak *word constraints* bagi tiap sisa kata *(kandidat)*:
   - Mencari kecocokan **karakter unik yang beririsan** (Intersection Mapping) antara huruf dalam 'Kata Kandidat' dibandingkan setiap huruf dari kumpulan kata yang *sudah ditanam* (`placed`).
   - Merumuskan arah lintasan kebalikan (kalau kata *spine* horizontal, kata cabang di-*set* vertikal `down`, dihitung mengguna offset indeks singgungan huruf).
   - Melakukan **Validasi Tabrakan (Collision/Parallelity Test):** Fungsi `isValidPlacement` memindai area target. Huruf dari perlintasan sumbu XY **wajib sama selaras**. Sedianya kotak/sel target kosong, blok-blok kiri-kanan serta atas-bawahnya harus absolut dikonfirmasi hampa udara. Tujuannya adalah meniadakan distorsi "teks paralel"—karena 2 kata yang bersebelahan/tertempel acak bisa menghasilkan pelafalan kata non-kamus dan merusak board TTS.
3. Seandainya koordinat target valid, algoritma akan melakukan **Scoring**. Skor dihitung: bernilai lebih tinggi bila titik singgung (`startX, startY`) mendekati titik pusat sumbu `(0,0)`, yang diformulakan `score = 100 - Math.abs(x) - Math.abs(y)`. Hal ini mendesain teka-teki merapat simetris di tengah halaman, bukan merambat panjanj ke satu jalur (*Dense Grid Approach*).
4. **Bounding Box & Normalisasi Zero-Indexed:** Begitu seluruh loop rampung mengeliminasi atau memasukkan candidate, koordinat `(x, y)` murni (yang rentan jatuh ke zona origin negatif / `-3, -2`) dikerangkeng batasan Bounding Box (`minX`,`minY`), selanjutnya digeser sejauh minusnya (`nx` = *x* - *minX*). Kemudian diproyesikan (`Map`/`Push`) ke susunan `Array` grid 2 dimensi seutuhnya untuk di-*render* ke UI peramban, ditambah label nomor.

---

## 2. Masalah yang Terjadi dan Pendekatan Cara Mengatasinya (Fixes)

Dalam tahap membangun UX *(User Experience)* TTS ini, beberapa tantangan struktural yang signifikan dan bug state muncul, berikut mitigasinya:

### 🐛 Bug 1: Sinkronisasi Ketikan (Keyboard Confirm Constraint)
- **Problem Mendasar:** Interupsi state saat pemain di Desktop mengetik keyboard untuk menyelesaikan kata berpotongan. Kotak (*cells*) irisan diisi warna oleh "Kata Mendatar", akan kehilangan state lokal `typedLetters` saat memverifikasi susunan bagi "Kata Menurun" / arah lawannya. Fitur centang *(Auto-Confirm)* gagal merespon karena deteksi memori tersendat.
- **Resolusi (Hotfix):** Sinkronisasi pengecekan array *Effect Hook*. Pemrograman memodifikasi rutin scanning untuk mempercayai paramater **Hint Cell**, maupun state silang `isFilledByCrossing` agar mem-verifikasi huruf di titik tabrakan lintas arah, yang mengesampingkan kekakuan *event listener* `typedLetters` lokal. Kedua array data `x,y` visual grid dikoordinasikan ulang berpedoman `nx` dan `ny` dari Response payload Backend. API Response tidak menelurkan variabel kuno `startX/Y` - Hal ini pun telah dikorelasi. *[FIXED ✅]*

### 🐛 Bug 2: Polusi Sesi ("Modal Kemenangan Berhantu" Antar State Ruang)
- **Problem Mendasar:** Apabila pemain sukses meraih *"Level Selesai!"*, UI Menang muncul. Sewaktu pemain mengklik "Lanjut Ke Level Berikunya", Modal Menang persisten macet menutupi layout grid level baru. Hal ini akibat SPA React Router DOM cuma sekadar *replace* rute link dari `/play/1` menyeberang ke `/play/2` *tanpa unmounting* komponen; state internal komponen usang enggan dibersihkan. Timer waktu macet (gak mulai hitungan dari Nol awal).
- **Resolusi (Hotfix):** Penerapan *Dependency Binding* pada LifeCycle `useEffect`. Trigger dipantau sewaktu token parameter URL spesifik *[level]* diubah player (walau 1 instance / component page sama). React akan memaksa me-reset (`setVariable([])`) lusinan state di Game, semisal `solved`, daftar jawaban pemain `typedLetters`, memori `completedWords`, jumlah `hintedCell`. Sedangkan Time Stamp diubah strukturnya menjauhi *useState* re-render pelan, bertransisi pada variabel performa `useRef (Date.now())` dipadu binding level. *[FIXED ✅]*

### 🐛 Bug 3: Eksploitasi Hak Akses (Privilege Escalation di Panel Administrator)
- **Problem Mendasar:** Kesenjangan pengamanan antar-komponen (Authorization Bypass). Player yang mendaftar dan *"Login"* sekadar mendapatkan sebuah token dengan format name general, disimpan di `localStorage` bertajuk string `"admin_token"`. Frontend cuma men-detect eksistensi ada/tidaknya token file tersebut sehingga meloloskan pemain *Newbie* merobos masuk "Pintu Page Pembuat TTS" (Panel Konten Author API).
- **Resolusi (Hotfix):** Pemotongan otoritas secara dua arah (Frontend maupun Backend Middleware). 
   - Di ranah Axios Controller Backend API (PHP Laravel): Token dikodifikasikan bercabang sesuai derajatnya (`auth_token` bagi segala layer player, eksklusif khusus admin dibekali token extra bernama `admin_token`).
   - Di ranah React Frontend: Pengkondisian berlapis (Security Barrier). Melakukan rute-blokir, page Admin ter-lock di state awal "*Loading verify*", memanggil REST Endpoint validasi API `/api/check-admin` menuju Middleware Sanctum saat DOM dikonstruksi. Memastikan response Server Database (Bukan localStorage murni) meretur status **Role = Admin**, barulah dashboard diizinkan melukis alat generator TTS. Semua API Route untuk Create TTS diselimuti 403 HTTP Access Denied bagi non-admin. *[FIXED ✅]*

---

## 3. Fitur Tambahan Cerdas (Extra) Berbasis UX

Proyek ini telah dikalibrasi di luar prasyarat standar kelulusan minimum, dibubuhi beragam logika untuk mempermanis estetika maupun ketangguhan fungsi nyata, di antaranya:

1. **Adapter Responsif & Proporsional Visual Lensa Game:**
   Mengadopsi kalkulasi responsif hibrida untuk "Memampatkan Grid Box TTS" dan merangkai radius Lingkaran Wheel di mobile mendasarkan logaritma layar `window.innerHeight * 0.3`. Konsekuensinya: Huruf Lingkaran Keyboard tidak numpuk berdesakan, sisa-sisa grid kotak aman dibaca di ruang atasnya bagi ukuran *Handphone* berlayar kerdil tanpa harus scroll panik. Elemen dibalut desain kekinian *Glassmorphism*.

2. **Word Wheel Slider "Wordscapes-style" + Shuffler:**
   Pemain Ponsel dihadapkan pada UI piring bundar dinamis, memutar abjad yang diusap ujung jari (Swipe Trace Event System). Turut disertakan alat kocok rotasi visual **(Shuffle / Re-randomize button 🔄)** untuk merangsang kreativitas tebakan otak.

3. **Global Ranking Leaderboard (Prestise Player):**
   Tidak ada poin main jika tidak dihargai! Sebuah instansi statistik server khusus disusun merating kompetisi para *User Reguler*. Skor persaingan memadukan bobot Waktu Pemecahan Level (Timer Detik Kecepatan) yang disubsidi jumlah Penalti Hint Pertolongan (💡).

4. **Roadmap Latar Interaktif & Progress Unlock (Level Lock):**
   Di antarmuka dasbor `Home` user diskenariokan peta perjalanan Level bagaikan App Mobile Asli bergaya UI Vertikal Line-dots path. Ada integrasi ikon "Gembok Terkunci 🔒" pada tahapan TTS level advanced bilamana level dasar 1 belum direbut. Status kemajuan level (Stage Unlock/Save) dikonjugasikan lewat token API dan persistensi internal storage.

5. **Auto-Select Navigasi Lintas Petak Otomatis yang Halus Fokusnya:**
   Selain konfirmasi kata otomasi pasca ejaan (Golden Alert Colors Animation), kursor seleksi proaktif melangkah ke grid *neighboring cell* tiap ketukan Keyboard fisik di PC, meniru pengalaman TTS majalah teka-teki sesungguhnya—dibimbing tanda sorotan transparan lintas matriks.

6. **Sound Effects (Web Audio API):**
   Sistem suara programatik menggunakan Web Audio API tanpa memerlukan file audio eksternal. Suara di-generate secara real-time dengan oscillator dan gain node:
   - `playSelect()` - Bunyi saat memilih huruf di wheel (frequency: 800Hz)
   - `playCorrect()` - Melodi naik saat kata benar (C5→E5→G5)
   - `playWin()` - Fanfare kemenangan saat level selesai (C5→E5→G5→C6→E6)
   - `playHint()` - Notifikasi saat menggunakan hint
   - `playShuffle()` - Efek acak saat shuffle wheel
   - Toggle sound on/off dengan preferensi tersimpan di localStorage.

7. **Dark Mode System:**
   Implementasi tema gelap menggunakan CSS Custom Properties (CSS Variables) dengan transisi halus 0.3s:
   - Theme Manager singleton (`theme.js`) mengatur `data-theme` attribute pada document.
   - CSS variables untuk warna background, card, text yang berubah sesuai tema.
   - Preferensi tersimpan di localStorage key `dark_mode`.
   - Desain dark mode: gradient biru-ungu gelap (#0f0f23 → #16213e) menggantikan meadow hijau.

8. **Share to Social Media:**
   Fitur berbagi pencapaian dengan format:
   ```
   🎮 TTS Quest - Level X selesai!
   ⏱️ Waktu: XX detik
   💡 Hints: X/2
   🏆 Score: XXXX
   
   🔗 Main juga yuk: [URL]
   ```
   Menggunakan Web Share API (mobile) dengan fallback ke clipboard (desktop).

9. **Replay Level Button:**
   Tombol untuk mengulang level dari awal, implementasi sederhana dengan `window.location.reload()`.

---

## 4. Security Enhancements (Pengamanan Lanjutan)

### 🔒 Leaderboard Anti-Cheat System
- **Problem:** Score bisa dimanipulasi dari client-side tanpa validasi server.
- **Solusi:**
  1. **Answer Verification:** Server memverifikasi setiap kata yang dijawab dengan data puzzle asli.
  2. **Time Validation:** Minimum waktu 3 detik per kata untuk mencegah bot/script.
  3. **Hint Tracking:** Jumlah hint yang digunakan dilacak di database, bukan dari client.

### 🔒 Hint Limit System
- **Pembatasan:** Maksimal 2 hint per level per user.
- **Tracking:** Disimpan di tabel `user_progress` kolom `hints_used`.
- **API Endpoints:**
  - `GET /api/hint-status/{puzzleId}` - Cek sisa hint
  - `POST /api/use-hint` - Gunakan hint (return error jika sudah 2x)

### 🔒 Guest vs Logged-in User Progress Separation
- **Problem:** Progress guest tercampur dengan user login karena sama-sama pakai localStorage.
- **Solusi:**
  - Guest: localStorage key `guest_completed_levels`
  - Logged-in: Database only (ignore localStorage, clear saat login)
  - Key `completed_levels` di-cleanup untuk backward compatibility.
