# Product Requirements Document (PRD) - Personal Life OS & To-Do PWA

## 1. Overview
Aplikasi Progressive Web App (PWA) personal life-tracker & to-do list offline-first untuk perangkat iOS dan Android, dengan dukungan autentikasi akun dan sinkronisasi cloud.

## 2. Tech Stack
- Frontend: React (Vite) + TypeScript
- Styling: Tailwind CSS + Lucide Icons
- Local Database: Dexie.js (IndexedDB)
- Backend & Auth: Supabase (Auth + PostgreSQL Database)
- PWA Engine: vite-plugin-pwa (Service Worker + Workbox + Web Manifest)
- Notification: Web Notifications API + Background Periodic Sync

## 3. Modul & Fitur Utama

### A. Autentikasi & Otorisasi
- Autentikasi sederhana via Email & Password menggunakan Supabase Auth.
- Multi-device sync untuk akun pribadi yang terdaftar.

### B. Manajemen To-Do (Harian, Mingguan, Bulanan)
- Tampilan berbasis tab/filter: Harian, Mingguan, Bulanan.
- Atribut: Judul, deskripsi, kategori, tag, prioritas, tanggal, dan waktu jatuh tempo.
- Notifikasi pengingat lokal berdasarkan waktu jatuh tempo.
- Integrasi kalender: Tombol langsung "Add to Calendar" (.ics download & direct Google Calendar deep link).

### C. Wishlist (Barang & Tempat)
- Kategori: Barang Impian vs Destinasi/Tempat.
- Input estimasi biaya dan nominal target yang terkumpul.
- Kalkulasi otomatis: Persentase progress tabungan, sisa biaya, dan estimasi waktu pencapaian.

### D. Catatan Harian & Pencapaian (Daily Wins)
- Daily Quick Notes dengan dukungan checklist sederhana.
- Pelacak pencapaian harian (Daily Accomplishments / Gratitude Log).
- Metrik penyelesaian tugas otomatis dalam sehari (% success rate).

### E. Arsitektur Offline & PWA
- Offline-First: Semua operasi CRUD berjalan mulus di IndexedDB saat offline.
- Background Sync: Mengantrekan mutasi data saat offline dan menyinkronkan ke Supabase otomatis ketika online kembali.
- Standalone mode: UI mobile dengan navigasi bawah (bottom navigation bar) bebas benturan dengan UI browser bar.