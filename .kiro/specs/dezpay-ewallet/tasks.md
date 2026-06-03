 # Implementation Plan: DezPay E-Wallet

## Overview

Implementasi DezPay E-Wallet secara bertahap, dimulai dari project setup dan infrastruktur, dilanjutkan dengan backend services (Auth, Wallet, Transfer, TopUp, QR, Request, Notification, Ledger, Audit, Admin), kemudian frontend Vue 3, dan diakhiri dengan Docker Compose dan dokumentasi API. Setiap service diimplementasikan dengan unit test, property-based test (Jest + fast-check), dan integration test.

---

## Tasks

- [ ] 1. Project Setup dan Konfigurasi Infrastruktur
  - [ ] 1.1 Inisialisasi project Node.js/TypeScript dengan struktur direktori layered
    - Buat `package.json` dengan dependencies: express, pg, ioredis, bullmq, bcrypt, jsonwebtoken, zod, qrcode, uuid, swagger-ui-express, yamljs
    - Buat `tsconfig.json` dengan strict mode
    - Buat struktur direktori: `src/routes`, `src/controllers`, `src/services`, `src/repositories`, `src/middleware`, `src/queues`, `src/utils`, `src/config`, `src/swagger`, `src/types`
    - Buat `src/app.ts` (Express app factory) dan `src/server.ts` (entry point)
    - _Requirements: 14.1, 15.1_

  - [ ] 1.2 Konfigurasi koneksi PostgreSQL, Redis, dan environment variables
    - Buat `src/config/database.ts` dengan pg Pool dan helper `getClient()`
    - Buat `src/config/redis.ts` dengan ioredis client dan graceful fallback
    - Buat `src/config/env.ts` dengan validasi env vars menggunakan zod
    - Buat `.env.example` dengan semua variabel yang diperlukan
    - _Requirements: 14.2, 14.3_

  - [ ] 1.3 Buat database migrations dan seed data awal
    - Buat file migration SQL untuk semua tabel: `users`, `wallets`, `ledger_accounts`, `ledger_entries`, `transactions`, `transfers`, `topups`, `qr_payments`, `money_requests`, `notifications`, `audit_logs`, `admins`
    - Tambahkan semua index performa yang didefinisikan di design
    - Buat seed: system ledger account (transit account), satu admin default
    - Buat script `npm run migrate` dan `npm run seed`
    - _Requirements: 9.3, 9.4_

  - [ ] 1.4 Implementasi global middleware (error handler, JWT auth, rate limiter, request logger)
    - Buat `src/middleware/errorHandler.ts` dengan format respons error standar `{success, error: {code, message, details}}`
    - Buat `src/middleware/authenticate.ts` untuk validasi JWT dan cek sesi Redis
    - Buat `src/middleware/requireAdmin.ts` untuk otorisasi role admin
    - Buat `src/middleware/rateLimiter.ts` menggunakan express-rate-limit
    - Buat `src/middleware/requestLogger.ts` dengan structured JSON logging
    - _Requirements: 2.3, 15.4_


- [ ] 2. Utilitas dan Tipe Data Bersama
  - [ ] 2.1 Implementasi utility functions (hashing, JWT, validators)
    - Buat `src/utils/hash.ts`: `hashPassword(plain)`, `compareHash(plain, hash)` menggunakan bcrypt cost factor 10
    - Buat `src/utils/jwt.ts`: `signToken(payload, expiresIn)`, `verifyToken(token)` menggunakan jsonwebtoken
    - Buat `src/utils/validators.ts`: `isValidEmail(str)`, `isValidPassword(str)`, `isValidPin(str)`, `isValidAmount(n)`
    - Buat `src/utils/pagination.ts`: helper untuk offset/limit dari page/limit params
    - _Requirements: 1.3, 1.5, 1.6, 13.4_

  - [ ]* 2.2 Tulis property test untuk utility functions
    - **Property 3: Validasi Panjang Password** — `isValidPassword` menolak string < 8 karakter, menerima >= 8
    - **Property 4: Validasi Format Email** — `isValidEmail` menolak string tanpa `@` dan domain valid
    - **Property 5: Kredensial Tersimpan dalam Bentuk Hash** — `hashPassword` menghasilkan hash berbeda dari plaintext; `compareHash(plain, hash)` selalu `true`
    - **Validates: Requirements 1.3, 1.5, 1.6, 13.4**

  - [ ] 2.3 Definisikan TypeScript types dan interfaces untuk semua domain
    - Buat `src/types/user.ts`, `src/types/wallet.ts`, `src/types/transaction.ts`, `src/types/ledger.ts`, `src/types/notification.ts`, `src/types/audit.ts`
    - Definisikan enum: `UserStatus`, `TransactionType`, `TransactionStatus`, `TopUpStatus`, `QRStatus`, `MoneyRequestStatus`, `EntryType`, `ActorType`
    - _Requirements: 9.3, 10.2_


- [ ] 3. Auth_Service — Registrasi, Login, Sesi, dan PIN
  - [ ] 3.1 Implementasi repository layer untuk users dan sessions
    - Buat `src/repositories/userRepository.ts`: `createUser`, `findByEmail`, `findById`, `updatePasswordHash`, `updatePinHash`, `updateStatus`, `incrementPinAttempts`, `resetPinAttempts`, `setPinLock`
    - Buat `src/repositories/sessionRepository.ts` (Redis): `createSession`, `getSession`, `deleteSession`, `deleteAllUserSessions`
    - _Requirements: 1.1, 2.3, 2.4_

  - [ ] 3.2 Implementasi Auth_Service business logic
    - Buat `src/services/authService.ts` dengan method: `register`, `login`, `logout`, `changePassword`, `createTransactionPin`, `verifyTransactionPin`, `changeTransactionPin`, `validateToken`, `revokeAllSessions`
    - `register`: hash password, buat user + wallet + ledger_account dalam satu DB transaction, simpan sesi di Redis, kembalikan JWT
    - `login`: cek status frozen (HTTP 403), verifikasi password, buat sesi Redis dengan TTL 24 jam, kembalikan JWT
    - `logout`: hapus sesi dari Redis
    - `changePassword`: verifikasi password lama, hash baru, revoke semua sesi
    - `verifyTransactionPin`: cek pin_locked_until, compare hash, increment/reset attempts, lock 30 menit jika >= 5 gagal
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 3.3 Tulis property test untuk Auth_Service
    - **Property 1: Registrasi Membuat Akun dan Wallet dengan Saldo Nol** — setiap registrasi valid menghasilkan wallet balance = 0
    - **Property 2: Duplikasi Email Selalu Ditolak** — registrasi ulang email yang sama selalu HTTP 409
    - **Property 6: Login Berhasil Menghasilkan JWT 24 Jam** — JWT exp - iat == 86400 detik
    - **Property 7: Kredensial Salah Selalu Ditolak** — login dengan password salah selalu HTTP 401
    - **Property 8: Revokasi Sesi Setelah Logout** — token sebelum logout ditolak setelah logout
    - **Property 9: Ganti Password Membatalkan Semua Sesi** — semua token lama ditolak setelah ganti password
    - **Property 10: Akun Frozen Selalu Ditolak Login** — akun frozen selalu HTTP 403
    - **Property 25: Pengguna Tanpa PIN Tidak Bisa Bertransaksi** — user tanpa PIN mendapat HTTP 403
    - **Property 26: Blokir Transaksi Setelah 5 Kali PIN Salah** — setelah 5 kali salah, transaksi diblokir 30 menit
    - **Property 27: Perubahan PIN Memerlukan Verifikasi Ganda** — ganti PIN ditolak jika PIN lama atau password salah
    - **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 13.1, 13.2, 13.3**

  - [ ] 3.4 Implementasi Auth routes dan controllers
    - Buat `src/controllers/authController.ts`: `register`, `login`, `logout`, `changePassword`, `createPin`, `changePin`
    - Buat `src/routes/authRoutes.ts`: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `PUT /api/auth/password`, `POST /api/auth/pin`, `PUT /api/auth/pin`
    - Tambahkan validasi input dengan zod pada setiap endpoint
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.4, 2.5, 13.1, 13.3_


- [ ] 4. Ledger_Service — Double-Entry Bookkeeping
  - [ ] 4.1 Implementasi Ledger_Service dan repository
    - Buat `src/repositories/ledgerRepository.ts`: `insertLedgerEntry`, `getEntriesByTransactionId`, `getAccountBalance`, `createLedgerAccount`
    - Buat `src/services/ledgerService.ts` dengan method: `recordTransferEntries`, `recordTopUpEntries`, `recordQRPaymentEntries`, `getLedgerEntriesByTransaction`, `getAccountBalance`
    - Setiap `record*Entries` menerima `pgClient` aktif untuk atomicity dengan mutasi saldo
    - `recordTransferEntries` membuat tepat 4 entries: DEBIT pengirim, CREDIT sistem transit, DEBIT sistem transit, CREDIT penerima
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 4.5_

  - [ ]* 4.2 Tulis property test untuk Ledger_Service
    - **Property 16: Invariant Double-Entry Bookkeeping** — SUM(debit) == SUM(credit) untuk setiap transaksi
    - **Property 17: Kelengkapan Atribut Ledger Entry** — semua atribut wajib tidak null dan valid
    - **Property 18: Konsistensi Saldo Akun Ledger** — `getAccountBalance()` == SUM(credit) - SUM(debit)
    - **Validates: Requirements 9.1, 9.3, 9.5**

  - [ ] 4.3 Implementasi Ledger routes dan controllers
    - Buat `src/controllers/ledgerController.ts`: `getEntriesByTransaction`, `getAccountBalance`
    - Buat `src/routes/ledgerRoutes.ts`: `GET /api/ledger/transactions/:txId`, `GET /api/ledger/accounts/:accountId/balance`
    - _Requirements: 9.6_


- [ ] 5. Wallet_Service — Saldo dan Riwayat Transaksi
  - [ ] 5.1 Implementasi Wallet_Service dan repository
    - Buat `src/repositories/walletRepository.ts`: `findByUserId`, `debitWallet`, `creditWallet`, `getTransactionHistory`, `getLedgerEntries`
    - `debitWallet` dan `creditWallet` menggunakan `SELECT ... FOR UPDATE` dan menerima `pgClient`
    - Buat `src/services/walletService.ts` dengan method: `getBalance`, `getTransactionHistory`, `getLedgerEntries`, `validateSufficientBalance`, `debitWallet`, `creditWallet`
    - `getBalance`: cek Redis cache `balance:{userId}` (TTL 60 detik), fallback ke PostgreSQL jika cache miss atau Redis tidak tersedia
    - Cache di-invalidate setelah setiap mutasi saldo
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 14.2, 14.3_

  - [ ]* 5.2 Tulis property test untuk Wallet_Service
    - **Property 11: Saldo Wallet Tidak Pernah Negatif** — debit melebihi saldo selalu gagal, saldo tetap >= 0
    - **Property 12: Riwayat Transaksi Terurut Descending** — hasil selalu terurut `created_at` DESC, pagination tepat
    - **Property 13: Atomicity Mutasi Saldo** — kegagalan di tengah operasi menyebabkan rollback penuh
    - **Property 36: Fallback ke PostgreSQL Saat Redis Tidak Tersedia** — data valid dikembalikan meski Redis down
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 14.3**

  - [ ] 5.3 Implementasi Wallet routes dan controllers
    - Buat `src/controllers/walletController.ts`: `getBalance`, `getTransactionHistory`, `getLedgerEntries`
    - Buat `src/routes/walletRoutes.ts`: `GET /api/wallet/balance`, `GET /api/wallet/transactions`, `GET /api/wallet/ledger`
    - Semua endpoint memerlukan autentikasi JWT
    - _Requirements: 3.1, 3.2, 3.6_


- [ ] 6. Queue_Service — BullMQ Setup dan Processors
  - [ ] 6.1 Implementasi BullMQ queues dan job processors
    - Buat `src/queues/queues.ts`: definisikan `notificationQueue`, `auditQueue`, `moneyRequestExpiryQueue` menggunakan BullMQ
    - Buat `src/queues/processors/notificationProcessor.ts`: INSERT ke tabel `notifications`, hapus job dari queue jika gagal (no retry per Requirement 8.7)
    - Buat `src/queues/processors/auditProcessor.ts`: INSERT ke tabel `audit_logs`
    - Buat `src/queues/processors/moneyRequestExpiryProcessor.ts`: UPDATE status `money_requests` menjadi `expired`
    - Buat `src/queues/worker.ts` untuk menginisialisasi semua workers
    - _Requirements: 8.7, 10.5, 14.4_

  - [ ] 6.2 Implementasi Audit_Service
    - Buat `src/services/auditService.ts` dengan method: `log(actorId, actorType, action, entityId, entityType, ipAddress, metadata)`, `getAuditLogs(filters, page, limit)`
    - `log()` hanya meng-enqueue job ke `auditQueue` dan langsung return (non-blocking)
    - Buat `src/repositories/auditRepository.ts`: `insertAuditLog` (INSERT only), `getAuditLogs` dengan filter dan pagination
    - Tabel `audit_logs` tidak memiliki UPDATE/DELETE — enforce di repository layer
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 6.3 Tulis property test untuk Audit_Service
    - **Property 32: Audit Log Append-Only** — tidak ada UPDATE/DELETE yang berhasil pada audit_logs
    - **Property 33: Kelengkapan Atribut Audit Log** — semua atribut wajib tidak null
    - **Property 34: Filter Audit Log Konsisten** — semua hasil memenuhi semua kriteria filter
    - **Validates: Requirements 10.2, 10.3, 10.4**


- [ ] 7. Transfer_Service — Transfer Saldo Antar Pengguna
  - [ ] 7.1 Implementasi Transfer_Service dan repository
    - Buat `src/repositories/transferRepository.ts`: `createTransfer`, `findById`, `getTransferHistory`
    - Buat `src/services/transferService.ts` dengan method: `initiateTransfer`, `getTransferStatus`, `getTransferHistory`
    - `initiateTransfer`: verifikasi PIN (cek lock, compare hash, increment/reset attempts), cek penerima ada (HTTP 404), BEGIN TRANSACTION, SELECT wallet FOR UPDATE (pengirim & penerima), validasi saldo (HTTP 422), debit pengirim, credit penerima, INSERT ke `transactions` + `transfers`, panggil `ledgerService.recordTransferEntries`, COMMIT, invalidate Redis cache, enqueue notifikasi, enqueue audit log
    - Rollback penuh jika ada kegagalan di tengah transaksi
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 7.2 Tulis property test untuk Transfer_Service
    - **Property 14: Konservasi Dana pada Transfer** — `sender_after == sender_before - amount` dan `receiver_after == receiver_before + amount`
    - **Property 15: PIN Salah Tidak Memproses Transfer** — transfer tidak diproses, saldo tidak berubah, HTTP 401
    - **Property 37: Konservasi Dana pada Concurrent Transfers** — total saldo sistem sama sebelum dan sesudah concurrent transfers
    - **Validates: Requirements 4.1, 4.3, 14.5**

  - [ ] 7.3 Implementasi Transfer routes dan controllers
    - Buat `src/controllers/transferController.ts`: `initiateTransfer`, `getTransferStatus`, `getTransferHistory`
    - Buat `src/routes/transferRoutes.ts`: `POST /api/transfers`, `GET /api/transfers/:id`, `GET /api/transfers`
    - Middleware: cek PIN sudah dibuat (HTTP 403 jika belum)
    - _Requirements: 4.1, 4.7, 4.8, 13.5_


- [ ] 8. Checkpoint — Verifikasi Core Financial Services
  - Pastikan semua tests untuk Auth, Ledger, Wallet, dan Transfer lulus
  - Verifikasi double-entry invariant dengan integration test: register dua user, transfer, cek SUM(debit) == SUM(credit)
  - Verifikasi concurrent transfer safety: jalankan 10 transfer paralel, cek total saldo tidak berubah
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan.

- [ ] 9. TopUp_Service — Pengajuan dan Persetujuan Top Up
  - [ ] 9.1 Implementasi TopUp_Service dan repository
    - Buat `src/repositories/topupRepository.ts`: `createTopUp`, `findById`, `updateStatus`, `getTopUpHistory`, `getAllPending`
    - Buat `src/services/topupService.ts` dengan method: `submitTopUp`, `approveTopUp`, `rejectTopUp`, `getTopUpHistory`, `getAllPendingTopUps`
    - `submitTopUp`: validasi amount (10000–10000000, HTTP 422 jika di luar range), INSERT ke `transactions` + `topups` dengan status `pending`
    - `approveTopUp`: BEGIN TRANSACTION, credit wallet user, INSERT ke `transactions`, panggil `ledgerService.recordTopUpEntries` (lanjutkan meski ledger gagal per Requirement 5.5), UPDATE status `approved`, COMMIT, enqueue notifikasi, enqueue audit log
    - `rejectTopUp`: UPDATE status `rejected`, enqueue notifikasi, enqueue audit log
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 9.2 Tulis property test untuk TopUp_Service
    - **Property 19: Validasi Rentang Jumlah Top Up** — ditolak jika < 10000 atau > 10000000, diterima jika dalam range
    - **Property 20: Approval Top Up Menambah Saldo Secara Tepat** — saldo bertambah tepat sebesar amount, status `approved`
    - **Property 21: Rejection Top Up Tidak Mengubah Saldo** — saldo tidak berubah, status `rejected`
    - **Validates: Requirements 5.2, 5.3, 5.6**

  - [ ] 9.3 Implementasi TopUp routes dan controllers
    - Buat `src/controllers/topupController.ts`: `submitTopUp`, `approveTopUp`, `rejectTopUp`, `getTopUpHistory`, `getAllPending`
    - Buat `src/routes/topupRoutes.ts`: `POST /api/topups`, `GET /api/topups`, `GET /api/admin/topups/pending`, `PUT /api/admin/topups/:id/approve`, `PUT /api/admin/topups/:id/reject`
    - Admin endpoints memerlukan middleware `requireAdmin`
    - _Requirements: 5.1, 5.2, 5.3, 5.7_


- [ ] 10. QR_Service — Generate dan Proses Pembayaran QR Code
  - [ ] 10.1 Implementasi QR_Service dan repository
    - Buat `src/repositories/qrRepository.ts`: `createQRPayment`, `findByToken`, `markAsUsed`, `getQRStatus`
    - Buat `src/services/qrService.ts` dengan method: `generateQRCode`, `processQRPayment`, `getQRStatus`
    - `generateQRCode`: generate UUID token unik, simpan di Redis `qr:{token}` dengan TTL 900 detik, INSERT ke `qr_payments` dengan status `active` dan `expires_at = now + 15 menit`, generate QR image menggunakan library `qrcode`
    - `processQRPayment`: cek token di Redis (tidak ada → HTTP 410), cek status di DB (used → HTTP 409), verifikasi PIN, cek saldo (HTTP 422), BEGIN TRANSACTION, debit scanner, credit creator, INSERT ke `transactions`, panggil `ledgerService.recordQRPaymentEntries`, UPDATE `qr_payments` status `used`, hapus dari Redis, COMMIT, enqueue notifikasi kedua pihak
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 10.2 Tulis property test untuk QR_Service
    - **Property 22: Token QR Unik dan Berlaku 15 Menit** — token unik, `expires_at - created_at == 900 detik`
    - **Property 23: QR Expired Selalu Ditolak** — token expired selalu HTTP 410
    - **Property 24: QR Idempotency — Tidak Bisa Digunakan Dua Kali** — token used selalu HTTP 409
    - **Validates: Requirements 6.1, 6.3, 6.4**

  - [ ] 10.3 Implementasi QR routes dan controllers
    - Buat `src/controllers/qrController.ts`: `generateQRCode`, `processQRPayment`, `getQRStatus`
    - Buat `src/routes/qrRoutes.ts`: `POST /api/qr/generate`, `POST /api/qr/pay`, `GET /api/qr/:token/status`
    - Middleware: cek PIN sudah dibuat pada endpoint `processQRPayment`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 13.5_


- [ ] 11. Request_Service — Permintaan Uang Antar Pengguna
  - [ ] 11.1 Implementasi Request_Service dan repository
    - Buat `src/repositories/requestRepository.ts`: `createMoneyRequest`, `findById`, `updateStatus`, `getMoneyRequests`, `expireStaleRequests`
    - Buat `src/services/requestService.ts` dengan method: `createMoneyRequest`, `approveMoneyRequest`, `rejectMoneyRequest`, `getMoneyRequests`, `expireStaleRequests`
    - `createMoneyRequest`: INSERT ke `money_requests` dengan status `pending` dan `expires_at = now + 72 jam`, enqueue BullMQ delayed job ke `moneyRequestExpiryQueue` dengan delay 72 jam, enqueue notifikasi ke target user
    - `approveMoneyRequest`: verifikasi PIN, cek saldo target (HTTP 422), BEGIN TRANSACTION, debit target, credit requester, INSERT ke `transactions`, panggil `ledgerService.recordTransferEntries`, UPDATE status `accepted`, batalkan delayed job expiry, COMMIT, enqueue notifikasi ke requester
    - `rejectMoneyRequest`: UPDATE status `rejected`, batalkan delayed job expiry, enqueue notifikasi ke requester
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 11.2 Tulis property test untuk Request_Service
    - **Property 28: Money Request Expired Setelah 72 Jam** — status berubah `expired` setelah 72 jam tanpa respons
    - **Property 29: Notifikasi Money Request Mengandung Data Lengkap** — payload notifikasi mengandung nama pemohon dan jumlah
    - **Validates: Requirements 7.6, 8.3**

  - [ ] 11.3 Implementasi Request routes dan controllers
    - Buat `src/controllers/requestController.ts`: `createMoneyRequest`, `approveMoneyRequest`, `rejectMoneyRequest`, `getMoneyRequests`
    - Buat `src/routes/requestRoutes.ts`: `POST /api/requests`, `GET /api/requests`, `PUT /api/requests/:id/approve`, `PUT /api/requests/:id/reject`
    - Middleware: cek PIN sudah dibuat pada endpoint `approveMoneyRequest`
    - _Requirements: 7.1, 7.2, 7.3, 7.7, 13.5_


- [ ] 12. Notification_Service — Notifikasi Berbasis Queue
  - [ ] 12.1 Implementasi Notification_Service dan repository
    - Buat `src/repositories/notificationRepository.ts`: `insertNotification`, `getNotifications`, `markAsRead`, `markAllAsRead`
    - Buat `src/services/notificationService.ts` dengan method: `createNotification`, `getNotifications`, `markAsRead`, `markAllAsRead`
    - `createNotification`: enqueue job ke `notificationQueue` (non-blocking, tidak menunggu hasil)
    - `getNotifications`: query dengan ORDER BY `created_at DESC` dan pagination
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 12.2 Tulis property test untuk Notification_Service
    - **Property 30: Notifikasi Terurut Descending** — hasil selalu terurut `created_at` DESC, pagination tepat
    - **Property 31: Mark As Read Mengubah Status Notifikasi** — status berubah `read` dan tidak bisa kembali ke `unread`
    - **Validates: Requirements 8.5, 8.6**

  - [ ] 12.3 Implementasi Notification routes dan controllers
    - Buat `src/controllers/notificationController.ts`: `getNotifications`, `markAsRead`, `markAllAsRead`
    - Buat `src/routes/notificationRoutes.ts`: `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
    - _Requirements: 8.5, 8.6_


- [ ] 13. Admin_Service — Manajemen Pengguna dan Monitoring
  - [ ] 13.1 Implementasi Admin_Service dan repository
    - Buat `src/repositories/adminRepository.ts`: `findAdminByEmail`, `findAdminById`
    - Buat `src/repositories/adminDataRepository.ts`: `listUsers`, `getUserDetail`, `listAllTransactions`, `getTransactionDetail`, `getPlatformStats`
    - Buat `src/services/adminService.ts` dengan method: `listUsers`, `getUserDetail`, `freezeAccount`, `unfreezeAccount`, `listAllTransactions`, `getTransactionDetail`, `getPlatformStats`
    - `getPlatformStats`: cek Redis cache `stats:platform` (TTL 5 menit), fallback ke PostgreSQL jika cache miss atau Redis tidak tersedia, kembalikan data meski cache stale
    - `freezeAccount` dan `unfreezeAccount`: UPDATE status user, enqueue audit log
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 13.2 Tulis property test untuk Admin_Service
    - **Property 35: Filter Transaksi Admin Konsisten** — semua hasil memenuhi semua kriteria filter
    - **Validates: Requirements 12.1**

  - [ ] 13.3 Implementasi Admin routes, controllers, dan auth admin
    - Buat `src/controllers/adminController.ts`: `login`, `listUsers`, `getUserDetail`, `freezeAccount`, `unfreezeAccount`, `listAllTransactions`, `getTransactionDetail`, `getPlatformStats`, `getAuditLogs`
    - Buat `src/routes/adminRoutes.ts`: `POST /api/admin/login`, `GET /api/admin/users`, `GET /api/admin/users/:id`, `PUT /api/admin/users/:id/freeze`, `PUT /api/admin/users/:id/unfreeze`, `GET /api/admin/transactions`, `GET /api/admin/transactions/:id`, `GET /api/admin/stats`, `GET /api/admin/audit-logs`
    - Semua endpoint (kecuali login) memerlukan middleware `requireAdmin`
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 12.1, 12.2, 12.3, 12.4_


- [ ] 14. Checkpoint — Verifikasi Semua Backend Services
  - Pastikan semua unit test dan property test lulus (`npx jest --runInBand`)
  - Jalankan integration test end-to-end: register → login → create PIN → transfer → check balance → check notifications
  - Jalankan admin flow: login admin → list users → freeze user → verify frozen user cannot login
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan ke API docs dan frontend.

- [ ] 15. Dokumentasi API dengan Swagger
  - [ ] 15.1 Setup Swagger UI dan definisi OpenAPI 3.0
    - Install `swagger-ui-express` dan `swagger-jsdoc`
    - Buat `src/swagger/swagger.ts` dengan konfigurasi OpenAPI 3.0: info, servers, security schemes (JWT Bearer)
    - Buat `src/swagger/schemas/` dengan definisi schema untuk semua request/response bodies
    - Mount Swagger UI pada `GET /api/docs`
    - _Requirements: 15.1, 15.2, 15.3_

  - [ ] 15.2 Dokumentasikan semua endpoint dengan JSDoc annotations
    - Tambahkan `@swagger` JSDoc annotations pada semua route files
    - Dokumentasikan: parameter request, format response, kode HTTP yang mungkin, contoh payload
    - Tambahkan security requirement `bearerAuth` pada semua endpoint yang memerlukan autentikasi
    - Dokumentasikan endpoint: Auth (6), Wallet (3), Transfer (3), TopUp (5), QR (3), Request (4), Notification (3), Admin (9), Ledger (2)
    - _Requirements: 15.2, 15.3_


- [ ] 16. Frontend — Vue 3 Setup dan Konfigurasi
  - [ ] 16.1 Inisialisasi project Vue 3 dengan Vite, Pinia, Vue Router, dan Tailwind CSS
    - Buat project Vue 3 dengan Vite di direktori `frontend/`
    - Install dependencies: pinia, vue-router, tailwindcss, axios, qrcode, @vueuse/core
    - Konfigurasi Tailwind CSS dengan custom color palette DezPay
    - Buat struktur direktori: `src/views`, `src/components`, `src/stores`, `src/composables`, `src/api`, `src/router`, `src/types`
    - Konfigurasi Vite proxy untuk API backend (`/api` → `http://localhost:3000`)
    - _Requirements: 14.1_

  - [ ] 16.2 Implementasi API client dan Pinia stores dasar
    - Buat `src/api/client.ts`: axios instance dengan base URL, interceptor untuk JWT header, interceptor untuk handle 401 (redirect ke login)
    - Buat `src/api/auth.ts`, `src/api/wallet.ts`, `src/api/transfer.ts`, `src/api/topup.ts`, `src/api/qr.ts`, `src/api/request.ts`, `src/api/notification.ts`, `src/api/admin.ts`
    - Buat `src/stores/authStore.ts`: state user, token, isAuthenticated; actions login, logout, register
    - Buat `src/stores/walletStore.ts`: state balance, transactions; actions fetchBalance, fetchTransactions
    - Buat `src/stores/notificationStore.ts`: state notifications, unreadCount; actions fetchNotifications, markAsRead
    - _Requirements: 2.1, 3.1, 3.2_


- [ ] 17. Frontend — Halaman Autentikasi dan Onboarding
  - [ ] 17.1 Implementasi halaman Register, Login, dan Create PIN
    - Buat `src/views/RegisterView.vue`: form nama, email, password dengan validasi client-side (panjang password >= 8, format email)
    - Buat `src/views/LoginView.vue`: form email, password; handle HTTP 403 (akun frozen) dengan pesan yang jelas
    - Buat `src/views/CreatePinView.vue`: form 6 digit PIN dengan konfirmasi; redirect ke dashboard setelah berhasil
    - Buat `src/router/index.ts` dengan route guards: redirect ke login jika belum auth, redirect ke create-pin jika belum punya PIN
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 2.1, 2.6, 13.1_

  - [ ] 17.2 Implementasi layout utama dan komponen navigasi
    - Buat `src/components/layout/AppLayout.vue`: sidebar navigasi, header dengan info user dan notifikasi badge
    - Buat `src/components/layout/AdminLayout.vue`: layout khusus admin dengan menu admin
    - Buat `src/components/common/NotificationBell.vue`: ikon dengan badge unread count, dropdown notifikasi terbaru
    - Buat `src/components/common/LoadingSpinner.vue`, `ErrorAlert.vue`, `SuccessToast.vue`
    - _Requirements: 8.5_


- [ ] 18. Frontend — Dashboard, Wallet, dan Transaksi
  - [ ] 18.1 Implementasi halaman Dashboard dan Wallet
    - Buat `src/views/DashboardView.vue`: tampilkan saldo terkini, 5 transaksi terakhir, shortcut ke fitur utama
    - Buat `src/views/WalletView.vue`: saldo lengkap, riwayat transaksi dengan pagination, filter tipe transaksi
    - Buat `src/components/wallet/BalanceCard.vue`: tampilkan saldo dengan animasi loading
    - Buat `src/components/wallet/TransactionList.vue`: list transaksi dengan icon tipe, amount berwarna (merah/hijau), timestamp
    - _Requirements: 3.1, 3.2_

  - [ ] 18.2 Implementasi halaman Transfer
    - Buat `src/views/TransferView.vue`: form cari penerima (by email/ID), input jumlah, input PIN, konfirmasi sebelum submit
    - Buat `src/components/transfer/ReceiverSearch.vue`: search user by email dengan debounce
    - Buat `src/components/transfer/PinInput.vue`: komponen input PIN 6 digit yang reusable (digunakan di Transfer, QR Pay, Request Approve)
    - Handle error: saldo tidak cukup (HTTP 422), PIN salah (HTTP 401), penerima tidak ditemukan (HTTP 404)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 18.3 Implementasi halaman Top Up
    - Buat `src/views/TopUpView.vue`: form jumlah (validasi 10000–10000000), upload bukti pembayaran, riwayat top up dengan status badge
    - Buat `src/components/topup/TopUpForm.vue`: input jumlah dengan format IDR, upload file
    - Buat `src/components/topup/TopUpHistoryList.vue`: list riwayat dengan status badge (pending/approved/rejected)
    - _Requirements: 5.1, 5.6, 5.7_


- [ ] 19. Frontend — QR Code, Request Money, dan Notifikasi
  - [ ] 19.1 Implementasi halaman QR Code
    - Buat `src/views/QRView.vue`: tab "Generate QR" dan "Scan QR"
    - Buat `src/components/qr/GenerateQR.vue`: input jumlah, tampilkan QR image dengan countdown timer 15 menit, tombol refresh
    - Buat `src/components/qr/ScanQR.vue`: input token QR (atau scan via kamera jika tersedia), konfirmasi jumlah, input PIN
    - Handle error: QR expired (HTTP 410), QR sudah digunakan (HTTP 409), saldo tidak cukup (HTTP 422)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [ ] 19.2 Implementasi halaman Request Money
    - Buat `src/views/RequestView.vue`: tab "Kirim Request" dan "Daftar Request"
    - Buat `src/components/request/CreateRequest.vue`: form cari target user, input jumlah dan catatan
    - Buat `src/components/request/RequestList.vue`: list request masuk dan keluar dengan status badge, tombol approve/reject untuk request masuk
    - Buat `src/components/request/ApproveRequestModal.vue`: konfirmasi jumlah, input PIN
    - _Requirements: 7.1, 7.2, 7.3, 7.7_

  - [ ] 19.3 Implementasi halaman Notifikasi
    - Buat `src/views/NotificationView.vue`: list semua notifikasi dengan pagination, tombol "Tandai Semua Dibaca"
    - Buat `src/components/notification/NotificationItem.vue`: tampilkan icon tipe, pesan, timestamp, status read/unread
    - Integrasikan dengan `notificationStore` untuk update badge count secara reaktif
    - _Requirements: 8.5, 8.6_


- [ ] 20. Frontend — Panel Admin
  - [ ] 20.1 Implementasi halaman Admin Dashboard dan User Management
    - Buat `src/views/admin/AdminDashboardView.vue`: tampilkan statistik platform (total transaksi, volume transfer, pengguna aktif, pending top up)
    - Buat `src/views/admin/AdminUsersView.vue`: tabel pengguna dengan search (nama/email), pagination, tombol freeze/unfreeze
    - Buat `src/views/admin/AdminUserDetailView.vue`: profil lengkap, riwayat transaksi, riwayat top up user
    - Buat `src/components/admin/UserStatusBadge.vue`: badge status active/frozen
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 12.2_

  - [ ] 20.2 Implementasi halaman Admin Transactions, TopUp Approval, dan Audit Log
    - Buat `src/views/admin/AdminTransactionsView.vue`: tabel semua transaksi dengan filter (tipe, status, rentang waktu, user ID), pagination
    - Buat `src/views/admin/AdminTopUpsView.vue`: daftar top up pending dengan tombol approve/reject, form alasan penolakan
    - Buat `src/views/admin/AdminAuditLogView.vue`: tabel audit log dengan filter (tipe aksi, aktor, rentang waktu), pagination
    - Buat `src/views/admin/AdminTransactionDetailView.vue`: detail transaksi lengkap termasuk ledger entries
    - _Requirements: 10.4, 12.1, 12.3, 5.2, 5.3_


- [ ] 21. Docker Compose dan Containerization
  - [ ] 21.1 Buat Dockerfile untuk backend dan frontend
    - Buat `backend/Dockerfile`: multi-stage build (builder stage dengan TypeScript compile, production stage dengan Node.js slim)
    - Buat `frontend/Dockerfile`: multi-stage build (builder stage dengan Vite build, production stage dengan Nginx)
    - Buat `frontend/nginx.conf`: konfigurasi Nginx untuk SPA routing (fallback ke `index.html`)
    - Buat `.dockerignore` untuk backend dan frontend
    - _Requirements: 14.1_

  - [ ] 21.2 Buat Docker Compose untuk development dan production
    - Buat `docker-compose.yml` dengan services: `postgres`, `redis`, `backend`, `frontend`
    - Konfigurasi `postgres`: image `postgres:16-alpine`, volume untuk data persistence, health check
    - Konfigurasi `redis`: image `redis:7-alpine`, volume untuk data persistence
    - Konfigurasi `backend`: build dari Dockerfile, depends_on postgres dan redis dengan health check, env vars dari `.env`
    - Konfigurasi `frontend`: build dari Dockerfile, depends_on backend
    - Buat `docker-compose.dev.yml` untuk development dengan hot reload (volume mount source code)
    - _Requirements: 14.1, 14.4_


- [ ] 22. Final Checkpoint — Verifikasi End-to-End
  - Jalankan `docker-compose up` dan verifikasi semua services berjalan
  - Jalankan full test suite: `npx jest --runInBand --coverage` dan pastikan coverage >= 80%
  - Verifikasi Swagger UI dapat diakses di `GET /api/docs` dan semua endpoint terdokumentasi
  - Jalankan smoke test: register → login → create PIN → top up (admin approve) → transfer → QR payment → request money → check notifications → check audit log
  - Tanyakan kepada user jika ada pertanyaan atau penyesuaian yang diperlukan.

---

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke fase berikutnya
- Property tests memvalidasi correctness properties universal yang didefinisikan di design document
- Unit tests memvalidasi contoh spesifik dan edge cases
- Semua operasi keuangan menggunakan database transaction dengan `SELECT ... FOR UPDATE` untuk mencegah race condition
- Redis digunakan sebagai cache dengan graceful fallback ke PostgreSQL
- BullMQ memastikan notifikasi dan audit log tidak memblokir respons API utama


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "3.1", "4.1"] },
    { "id": 4, "tasks": ["3.2", "4.2", "6.1"] },
    { "id": 5, "tasks": ["3.3", "4.3", "5.1"] },
    { "id": 6, "tasks": ["3.4", "5.2", "6.2"] },
    { "id": 7, "tasks": ["5.3", "6.3", "7.1"] },
    { "id": 8, "tasks": ["7.2", "9.1"] },
    { "id": 9, "tasks": ["7.3", "9.2", "10.1"] },
    { "id": 10, "tasks": ["9.3", "10.2", "11.1"] },
    { "id": 11, "tasks": ["10.3", "11.2", "12.1"] },
    { "id": 12, "tasks": ["11.3", "12.2", "13.1"] },
    { "id": 13, "tasks": ["12.3", "13.2"] },
    { "id": 14, "tasks": ["13.3", "15.1"] },
    { "id": 15, "tasks": ["15.2", "16.1"] },
    { "id": 16, "tasks": ["16.2"] },
    { "id": 17, "tasks": ["17.1", "17.2"] },
    { "id": 18, "tasks": ["18.1", "18.2", "18.3"] },
    { "id": 19, "tasks": ["19.1", "19.2", "19.3"] },
    { "id": 20, "tasks": ["20.1", "20.2"] },
    { "id": 21, "tasks": ["21.1"] },
    { "id": 22, "tasks": ["21.2"] }
  ]
}
```
