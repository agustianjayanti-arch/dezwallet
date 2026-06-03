# Requirements Document

## Introduction

DezPay adalah aplikasi e-wallet berbasis web yang memungkinkan pengguna melakukan top up saldo, transfer antar pengguna, pembayaran menggunakan QR Code, request money, dan melihat riwayat transaksi secara real-time. Sistem ini mensimulasikan dompet digital modern dengan menerapkan konsep keamanan, pencatatan transaksi berbasis double-entry ledger, audit log, dan concurrency handling yang umum digunakan pada industri fintech.

Sistem terdiri dari dua aktor utama: **User** (pengguna akhir) dan **Admin** (pengelola sistem). Backend dibangun dengan Node.js/Express.js, database PostgreSQL, caching Redis, dan queue processing menggunakan BullMQ. Frontend menggunakan Vue 3 dengan Tailwind CSS.

## Glossary

- **System**: Aplikasi DezPay secara keseluruhan
- **Auth_Service**: Komponen yang menangani autentikasi dan otorisasi pengguna
- **Wallet_Service**: Komponen yang mengelola saldo dan mutasi dompet pengguna
- **Transfer_Service**: Komponen yang menangani transfer saldo antar pengguna
- **TopUp_Service**: Komponen yang menangani pengajuan dan persetujuan top up saldo
- **QR_Service**: Komponen yang menangani pembuatan dan pemrosesan pembayaran QR Code
- **Request_Service**: Komponen yang menangani permintaan uang antar pengguna
- **Notification_Service**: Komponen yang mengirimkan notifikasi kepada pengguna
- **Ledger_Service**: Komponen yang mencatat setiap transaksi menggunakan double-entry bookkeeping
- **Audit_Service**: Komponen yang mencatat seluruh aktivitas penting ke dalam audit log
- **Admin_Service**: Komponen yang menyediakan fungsionalitas pengelolaan sistem untuk admin
- **Queue_Service**: Komponen berbasis BullMQ yang memproses pekerjaan asinkron
- **User**: Pengguna terdaftar yang memiliki akun dan dompet di DezPay
- **Admin**: Pengelola sistem dengan hak akses khusus untuk monitoring dan moderasi
- **Wallet**: Dompet digital milik User yang menyimpan saldo
- **Transaction PIN**: Kode 6 digit yang digunakan User untuk mengotorisasi transaksi keuangan
- **JWT**: JSON Web Token yang digunakan sebagai token autentikasi sesi
- **Double-Entry Ledger**: Sistem pencatatan akuntansi di mana setiap transaksi dicatat sebagai debit dan kredit yang selalu seimbang
- **Ledger_Entry**: Satu baris pencatatan dalam double-entry ledger (debit atau kredit)
- **QR Code**: Kode dua dimensi yang merepresentasikan data pembayaran
- **Money_Request**: Permintaan pembayaran yang dikirim dari satu User ke User lain
- **Top_Up**: Proses penambahan saldo Wallet melalui metode pembayaran eksternal
- **Audit_Log**: Catatan permanen seluruh aktivitas penting yang terjadi di dalam System
- **Transfer**: Pemindahan saldo dari Wallet satu User ke Wallet User lain

---

## Requirements

### Requirement 1: Registrasi Pengguna

**User Story:** Sebagai calon pengguna, saya ingin mendaftarkan akun baru, sehingga saya dapat menggunakan layanan DezPay.

#### Acceptance Criteria

1. WHEN seorang calon pengguna mengirimkan nama lengkap, alamat email, dan password yang valid, THE Auth_Service SHALL membuat akun User baru dan Wallet dengan saldo awal nol.
2. WHEN seorang calon pengguna mengirimkan alamat email yang sudah terdaftar, THE Auth_Service SHALL mengembalikan respons error dengan kode HTTP 409 dan pesan yang menjelaskan bahwa email sudah digunakan.
3. THE Auth_Service SHALL menyimpan password User dalam bentuk hash menggunakan bcrypt sebelum disimpan ke database.
4. WHEN registrasi berhasil, THE Auth_Service SHALL mengembalikan data profil User beserta JWT yang valid.
5. IF password yang dikirimkan memiliki panjang kurang dari 8 karakter, THEN THE Auth_Service SHALL mengembalikan respons error dengan kode HTTP 400; password dengan panjang tepat 8 karakter dianggap valid dan diizinkan untuk melanjutkan proses registrasi.
6. THE Auth_Service SHALL memvalidasi format alamat email sebelum menyimpan data User.

---

### Requirement 2: Login dan Manajemen Sesi

**User Story:** Sebagai pengguna terdaftar, saya ingin masuk ke akun saya, sehingga saya dapat mengakses fitur dompet digital.

#### Acceptance Criteria

1. WHEN seorang User mengirimkan email dan password yang benar, THE Auth_Service SHALL mengembalikan JWT dengan masa berlaku 24 jam.
2. WHEN seorang User mengirimkan email atau password yang salah, THE Auth_Service SHALL mengembalikan respons error dengan kode HTTP 401.
3. WHILE seorang User memiliki JWT yang valid dan sesi belum dicabut, THE Auth_Service SHALL mengizinkan akses ke seluruh endpoint yang memerlukan autentikasi; akses SHALL diblokir segera setelah sesi dicabut meskipun JWT belum kedaluwarsa.
4. WHEN seorang User melakukan logout, THE Auth_Service SHALL membatalkan sesi aktif sehingga JWT yang bersangkutan tidak dapat digunakan kembali.
5. WHEN seorang User mengirimkan permintaan ubah password dengan password lama yang benar dan password baru yang valid, THE Auth_Service SHALL memperbarui hash password dan membatalkan seluruh sesi aktif User tersebut.
6. IF akun User dalam status `frozen`, THEN THE Auth_Service SHALL mengembalikan respons error dengan kode HTTP 403 dan pesan yang menjelaskan bahwa akun dibekukan; respons HTTP 403 ini hanya dikembalikan ketika status akun benar-benar `frozen`.

---

### Requirement 3: Manajemen Dompet dan Saldo

**User Story:** Sebagai pengguna, saya ingin melihat saldo dan riwayat transaksi dompet saya, sehingga saya dapat memantau kondisi keuangan saya.

#### Acceptance Criteria

1. WHEN seorang User yang terautentikasi meminta informasi dompet, THE Wallet_Service SHALL mengembalikan saldo terkini beserta mata uang (IDR).
2. WHEN seorang User yang terautentikasi meminta riwayat transaksi, THE Wallet_Service SHALL mengembalikan daftar transaksi yang diurutkan berdasarkan waktu terbaru, dengan dukungan pagination menggunakan parameter `page` dan `limit`.
3. THE Wallet_Service SHALL memastikan saldo Wallet tidak pernah bernilai negatif pada setiap kondisi.
4. WHILE transaksi sedang diproses, THE Wallet_Service SHALL menggunakan database transaction dengan mekanisme rollback untuk menjaga konsistensi saldo; apabila pemrosesan transaksi berhenti atau gagal di tengah jalan, database transaction SHALL dilepaskan untuk menghindari deadlock.
5. THE Wallet_Service SHALL mengembalikan data saldo dari Redis Cache apabila cache tersedia, dan memperbarui cache setelah setiap mutasi saldo.
6. WHEN seorang User meminta mutasi saldo, THE Wallet_Service SHALL mengembalikan daftar Ledger_Entry yang terkait dengan Wallet User tersebut beserta keterangan tipe transaksi.

---

### Requirement 4: Transfer Saldo Antar Pengguna

**User Story:** Sebagai pengguna, saya ingin mentransfer saldo ke pengguna lain, sehingga saya dapat melakukan pembayaran atau berbagi dana secara digital.

#### Acceptance Criteria

1. WHEN seorang User mengirimkan permintaan transfer dengan ID penerima, jumlah, dan Transaction PIN yang valid, THE Transfer_Service SHALL memindahkan saldo dari Wallet pengirim ke Wallet penerima secara atomik.
2. IF saldo Wallet pengirim kurang dari jumlah transfer, THEN THE Transfer_Service SHALL mengembalikan respons error dengan kode HTTP 422 dan membatalkan seluruh operasi transfer.
3. IF Transaction PIN yang dikirimkan tidak sesuai, THEN THE Transfer_Service SHALL mengembalikan respons error dengan kode HTTP 401 dan tidak memproses transfer.
4. IF ID penerima tidak ditemukan dalam sistem, THEN THE Transfer_Service SHALL mengembalikan respons error dengan kode HTTP 404.
5. WHEN transfer berhasil diproses, THE Ledger_Service SHALL mencatat empat Ledger_Entry: debit pada akun User pengirim, kredit pada akun sistem, debit pada akun sistem, dan kredit pada akun User penerima, sehingga total debit sama dengan total kredit; IF transfer gagal akibat validasi, THE Ledger_Service SHALL tetap mencatat Ledger_Entry dengan status gagal untuk keperluan audit trail.
6. WHEN transfer berhasil, THE Notification_Service SHALL mengirimkan notifikasi kepada pengirim dan penerima melalui Queue_Service.
7. THE Transfer_Service SHALL mengembalikan respons dalam waktu kurang dari 500ms untuk kondisi normal.
8. WHEN seorang User meminta status transfer, THE Transfer_Service SHALL mengembalikan status terkini beserta detail transaksi.

---

### Requirement 5: Top Up Saldo

**User Story:** Sebagai pengguna, saya ingin mengajukan top up saldo, sehingga saya dapat menambah dana ke dompet saya.

#### Acceptance Criteria

1. WHEN seorang User mengirimkan pengajuan top up dengan jumlah yang valid dan bukti pembayaran, THE TopUp_Service SHALL membuat catatan Top_Up dengan status `pending` dan mengembalikan ID pengajuan.
2. WHEN seorang Admin menyetujui pengajuan Top_Up, THE TopUp_Service SHALL menambahkan saldo ke Wallet User yang bersangkutan dan mengubah status Top_Up menjadi `approved`.
3. WHEN seorang Admin menolak pengajuan Top_Up, THE TopUp_Service SHALL mengubah status Top_Up menjadi `rejected` tanpa mengubah saldo Wallet User.
4. WHEN status Top_Up berubah, THE Notification_Service SHALL mengirimkan notifikasi kepada User yang mengajukan melalui Queue_Service.
5. WHEN seorang Admin menyetujui Top_Up, THE Ledger_Service SHALL mencatat Ledger_Entry yang sesuai untuk penambahan saldo; IF Ledger_Service tidak tersedia saat persetujuan, THE TopUp_Service SHALL tetap melanjutkan persetujuan dan penambahan saldo tanpa membatalkan operasi.
6. THE TopUp_Service SHALL memvalidasi bahwa jumlah top up berada dalam rentang minimum Rp10.000 hingga maksimum Rp10.000.000 per pengajuan.
7. WHEN seorang User meminta daftar riwayat top up, THE TopUp_Service SHALL mengembalikan seluruh pengajuan Top_Up milik User tersebut beserta statusnya.

---

### Requirement 6: Pembayaran dengan QR Code

**User Story:** Sebagai pengguna, saya ingin membuat dan memindai QR Code untuk pembayaran, sehingga saya dapat melakukan transaksi dengan cepat tanpa perlu memasukkan ID penerima secara manual.

#### Acceptance Criteria

1. WHEN seorang User meminta pembuatan QR Code dengan jumlah tertentu, THE QR_Service SHALL menghasilkan QR Code yang mengandung token unik, ID User pembuat, dan jumlah pembayaran, dengan masa berlaku 15 menit.
2. WHEN seorang User memindai QR Code yang valid dan mengirimkan konfirmasi pembayaran beserta Transaction PIN, THE QR_Service SHALL memproses pembayaran dari Wallet pemindai ke Wallet pembuat QR Code.
3. IF QR Code yang dipindai sudah melewati masa berlaku 15 menit, THEN THE QR_Service SHALL selalu mengembalikan respons error dengan kode HTTP 410 dan tidak memproses pembayaran, terlepas dari kondisi deteksi kedaluwarsa.
4. IF QR Code yang dipindai sudah pernah digunakan, THEN THE QR_Service SHALL mengembalikan respons error dengan kode HTTP 409 dan tidak memproses pembayaran.
5. WHEN pembayaran QR Code berhasil, THE Ledger_Service SHALL mencatat Ledger_Entry yang sesuai dan THE Notification_Service SHALL mengirimkan notifikasi kepada kedua pihak; WHEN pembayaran QR Code gagal akibat saldo tidak cukup atau QR Code kedaluwarsa, THE Ledger_Service SHALL tetap mencatat Ledger_Entry dengan status gagal dan THE Notification_Service SHALL mengirimkan notifikasi kegagalan kepada pihak yang relevan.
6. IF saldo Wallet pemindai kurang dari jumlah pada QR Code, THEN THE QR_Service SHALL mengembalikan respons error dengan kode HTTP 422.
7. THE QR_Service SHALL menyimpan token QR Code di Redis Cache untuk validasi cepat selama masa berlaku QR Code.

---

### Requirement 7: Request Money (Permintaan Uang)

**User Story:** Sebagai pengguna, saya ingin meminta uang kepada pengguna lain, sehingga saya dapat menagih pembayaran secara digital.

#### Acceptance Criteria

1. WHEN seorang User mengirimkan permintaan uang dengan ID target User dan jumlah yang valid, THE Request_Service SHALL membuat catatan Money_Request dengan status `pending` dan mengirimkan notifikasi kepada target User.
2. WHEN target User menyetujui Money_Request dengan Transaction PIN yang valid, THE Request_Service SHALL memproses transfer saldo dari Wallet target ke Wallet pemohon dan mengubah status Money_Request menjadi `accepted`.
3. WHEN target User menolak Money_Request, THE Request_Service SHALL mengubah status Money_Request menjadi `rejected` tanpa memproses transfer.
4. IF saldo Wallet target User kurang dari jumlah yang diminta saat persetujuan, THEN THE Request_Service SHALL mengembalikan respons error dengan kode HTTP 422 dan tidak memproses transfer.
5. WHEN status Money_Request berubah, THE Notification_Service SHALL mengirimkan notifikasi kepada pemohon melalui Queue_Service.
6. THE Request_Service SHALL membatalkan Money_Request secara otomatis apabila tidak ada respons dalam 72 jam, dan mengubah statusnya menjadi `expired`.
7. WHEN seorang User meminta daftar Money_Request, THE Request_Service SHALL mengembalikan daftar permintaan yang dikirim maupun diterima oleh User tersebut beserta statusnya.

---

### Requirement 8: Sistem Notifikasi

**User Story:** Sebagai pengguna, saya ingin menerima notifikasi untuk setiap aktivitas penting, sehingga saya selalu mengetahui perubahan pada akun dan dompet saya.

#### Acceptance Criteria

1. WHEN sebuah transaksi transfer berhasil, THE Notification_Service SHALL membuat notifikasi untuk pengirim dan penerima melalui Queue_Service dalam waktu kurang dari 5 detik setelah transaksi selesai.
2. WHEN status Top_Up berubah menjadi `approved` atau `rejected`, THE Notification_Service SHALL membuat notifikasi untuk User yang bersangkutan; IF Notification_Service tidak tersedia saat perubahan status, THE System SHALL menerima bahwa notifikasi tersebut tidak terkirim tanpa membatalkan operasi utama.
3. WHEN seorang User menerima Money_Request baru, THE Notification_Service SHALL membuat notifikasi yang berisi nama pemohon dan jumlah yang diminta.
4. WHEN pembayaran QR Code berhasil, THE Notification_Service SHALL membuat notifikasi untuk pembuat QR Code dan pemindai.
5. WHEN seorang User yang terautentikasi meminta daftar notifikasi, THE Notification_Service SHALL mengembalikan daftar notifikasi yang diurutkan berdasarkan waktu terbaru dengan dukungan pagination.
6. WHEN seorang User menandai notifikasi sebagai telah dibaca, THE Notification_Service SHALL memperbarui status notifikasi tersebut menjadi `read`.
7. THE Notification_Service SHALL memproses antrian notifikasi menggunakan Queue_Service sehingga kegagalan pengiriman notifikasi tidak memblokir proses transaksi utama; IF pengiriman notifikasi gagal, THE Notification_Service SHALL menghapus notifikasi tersebut dari antrian tanpa melakukan retry.

---

### Requirement 9: Double-Entry Ledger

**User Story:** Sebagai sistem, saya perlu mencatat setiap transaksi keuangan menggunakan double-entry bookkeeping, sehingga integritas data keuangan selalu terjaga dan dapat diaudit.

#### Acceptance Criteria

1. THE Ledger_Service SHALL mencatat setiap transaksi keuangan sebagai pasangan Ledger_Entry debit dan kredit sehingga total debit selalu sama dengan total kredit.
2. WHEN sebuah transfer diproses, THE Ledger_Service SHALL membuat tepat empat Ledger_Entry: debit akun User pengirim, kredit akun sistem perantara, debit akun sistem perantara, dan kredit akun User penerima.
3. THE Ledger_Service SHALL menyimpan setiap Ledger_Entry dengan atribut: ID transaksi referensi, ID akun ledger, tipe (debit/kredit), jumlah, dan timestamp.
4. THE Ledger_Service SHALL memastikan seluruh operasi pencatatan Ledger_Entry dilakukan dalam satu database transaction yang sama dengan operasi mutasi saldo.
5. WHEN saldo sebuah akun ledger dihitung, THE Ledger_Service SHALL menghasilkan nilai yang konsisten dengan selisih total kredit dan total debit pada akun tersebut.
6. THE Ledger_Service SHALL menyediakan endpoint untuk mengambil seluruh Ledger_Entry yang terkait dengan sebuah transaksi berdasarkan ID transaksi.

---

### Requirement 10: Audit Log

**User Story:** Sebagai admin, saya ingin melihat audit log seluruh aktivitas penting, sehingga saya dapat melakukan investigasi dan memastikan kepatuhan sistem.

#### Acceptance Criteria

1. THE Audit_Service SHALL mencatat Audit_Log untuk setiap aktivitas berikut: login berhasil, login gagal, perubahan password, pembuatan transaksi, persetujuan/penolakan top up, pembekuan akun, dan perubahan data pengguna oleh admin.
2. WHEN sebuah Audit_Log dibuat, THE Audit_Service SHALL menyimpan atribut: ID aktor (User atau Admin), tipe aksi, ID entitas yang terpengaruh, timestamp, dan alamat IP asal permintaan.
3. THE Audit_Log SHALL bersifat append-only sehingga tidak ada Audit_Log yang dapat diubah atau dihapus setelah dibuat.
4. WHEN seorang Admin meminta daftar Audit_Log, THE Audit_Service SHALL mengembalikan daftar yang dapat difilter berdasarkan tipe aksi, ID aktor, dan rentang waktu, dengan dukungan pagination.
5. THE Audit_Service SHALL mencatat Audit_Log secara asinkron melalui Queue_Service sehingga tidak menambah latensi pada operasi utama; IF Queue_Service tidak tersedia, THE System SHALL melanjutkan operasi utama tanpa pencatatan dan menerima celah audit yang terjadi; WHEN Queue_Service mengalami penundaan, THE System SHALL mengizinkan dampak latensi minimal pada operasi utama.

---

### Requirement 11: Manajemen Pengguna oleh Admin

**User Story:** Sebagai admin, saya ingin mengelola akun pengguna, sehingga saya dapat menjaga keamanan dan ketertiban platform.

#### Acceptance Criteria

1. WHEN seorang Admin meminta daftar pengguna, THE Admin_Service SHALL mengembalikan daftar User dengan informasi profil, status akun, dan saldo Wallet, dengan dukungan pencarian berdasarkan nama atau email dan pagination.
2. WHEN seorang Admin membekukan akun User, THE Admin_Service SHALL mengubah status akun User menjadi `frozen` dan THE Audit_Service SHALL mencatat aksi tersebut ke Audit_Log.
3. WHEN seorang Admin mengaktifkan kembali akun User yang dibekukan, THE Admin_Service SHALL mengubah status akun User menjadi `active` dan THE Audit_Service SHALL mencatat aksi tersebut ke Audit_Log.
4. WHILE akun User berstatus `frozen`, THE Auth_Service SHALL menolak seluruh permintaan login dari User tersebut.
5. WHEN seorang Admin meminta detail seorang User, THE Admin_Service SHALL mengembalikan profil lengkap, riwayat transaksi, dan riwayat top up User tersebut.

---

### Requirement 12: Monitoring Transaksi oleh Admin

**User Story:** Sebagai admin, saya ingin memantau seluruh transaksi yang terjadi di platform, sehingga saya dapat mendeteksi aktivitas mencurigakan dan memastikan sistem berjalan dengan benar.

#### Acceptance Criteria

1. WHEN seorang Admin meminta daftar transaksi, THE Admin_Service SHALL mengembalikan seluruh transaksi di platform yang dapat difilter berdasarkan tipe transaksi, status, rentang waktu, dan ID User, dengan dukungan pagination.
2. WHEN seorang Admin meminta statistik platform, THE Admin_Service SHALL mengembalikan data agregat yang mencakup: total transaksi, total volume transfer, jumlah pengguna aktif, dan jumlah pengajuan top up yang menunggu persetujuan.
3. WHEN seorang Admin meminta detail sebuah transaksi, THE Admin_Service SHALL mengembalikan informasi lengkap termasuk seluruh Ledger_Entry yang terkait.
4. THE Admin_Service SHALL mengembalikan data statistik dari Redis Cache apabila cache tersedia, dan memperbarui cache setiap 5 menit; IF interval cache melebihi 5 menit, THE Admin_Service SHALL tetap melayani permintaan statistik dengan data yang mungkin tidak terkini.

---

### Requirement 13: Keamanan dan Validasi Transaksi PIN

**User Story:** Sebagai pengguna, saya ingin mengamankan transaksi keuangan saya dengan PIN, sehingga tidak ada pihak lain yang dapat melakukan transaksi atas nama saya.

#### Acceptance Criteria

1. WHEN seorang User baru berhasil mendaftar, THE Auth_Service SHALL meminta User untuk membuat Transaction PIN berupa 6 digit angka sebelum dapat melakukan transaksi keuangan pertama.
2. WHEN seorang User mengirimkan Transaction PIN yang salah sebanyak 5 kali atau lebih berturut-turut, THE Auth_Service SHALL memblokir kemampuan transaksi User tersebut selama 30 menit dan mencatat kejadian tersebut ke Audit_Log.
3. WHEN seorang User ingin mengubah Transaction PIN, THE Auth_Service SHALL memverifikasi Transaction PIN lama dan password akun sebelum menyimpan Transaction PIN baru.
4. THE Auth_Service SHALL menyimpan Transaction PIN dalam bentuk hash menggunakan bcrypt.
5. IF seorang User belum membuat Transaction PIN, THEN THE Transfer_Service, THE QR_Service, dan THE Request_Service SHALL mengembalikan respons error dengan kode HTTP 403 yang menginstruksikan User untuk membuat Transaction PIN terlebih dahulu.

---

### Requirement 14: Performa dan Skalabilitas

**User Story:** Sebagai pengguna, saya ingin aplikasi merespons dengan cepat, sehingga pengalaman penggunaan terasa lancar dan tidak mengganggu.

#### Acceptance Criteria

1. THE System SHALL mengembalikan respons untuk seluruh endpoint API dalam waktu kurang dari 500ms pada kondisi beban normal dengan 100 pengguna konkuren.
2. THE Wallet_Service SHALL menggunakan Redis Cache untuk menyimpan data saldo yang sering diakses, dengan TTL (Time-To-Live) 60 detik.
3. WHEN Redis Cache tidak tersedia, THE System SHALL mengambil data langsung dari database PostgreSQL tanpa mengembalikan error kepada pengguna.
4. THE Queue_Service SHALL memproses antrian notifikasi dan audit log secara asinkron menggunakan BullMQ sehingga operasi tersebut tidak memblokir respons API utama.
5. THE System SHALL mendukung eksekusi 100 permintaan konkuren atau lebih tanpa mengalami race condition pada operasi mutasi saldo, dengan menggunakan mekanisme database transaction dan row-level locking PostgreSQL.

---

### Requirement 15: Dokumentasi dan Observabilitas API

**User Story:** Sebagai developer, saya ingin seluruh endpoint API terdokumentasi dengan baik, sehingga integrasi dan pengembangan lebih lanjut dapat dilakukan dengan mudah.

#### Acceptance Criteria

1. THE System SHALL menyediakan dokumentasi API interaktif menggunakan Swagger UI yang dapat diakses pada endpoint `/api/docs`.
2. THE System SHALL mendokumentasikan seluruh endpoint API termasuk: parameter request, format response, kode HTTP yang mungkin dikembalikan, dan contoh payload.
3. THE System SHALL menyertakan skema autentikasi JWT pada dokumentasi Swagger sehingga endpoint yang memerlukan autentikasi dapat diuji langsung dari Swagger UI.
4. THE Audit_Service SHALL mencatat seluruh error dengan kode HTTP 500 ke dalam log sistem beserta stack trace untuk keperluan debugging; error dengan kode HTTP selain 500 tidak perlu disertai stack trace.
