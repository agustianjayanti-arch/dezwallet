# API Documentation

## Overview

DezPay E-Wallet API adalah REST API yang dibangun dengan Express.js dan TypeScript. API ini dilengkapi dengan dokumentasi lengkap menggunakan Swagger/OpenAPI 3.0.

## Mengakses Dokumentasi API

### Development (Local)

Ketika API berjalan di local, akses dokumentasi interaktif di:

```
http://localhost:3000/api/docs
```

### JSON Specification

Untuk mendapatkan OpenAPI spec dalam format JSON:

```
http://localhost:3000/api/docs.json
```

## Endpoints yang Terdokumentasi

### 1. Authentication (`/api/auth`)

- **POST /register** - Daftar akun baru
- **POST /login** - Login dengan email & password
- **POST /logout** - Logout dan cabut session
- **PUT /password** - Ubah password
- **POST /create-pin** - Buat PIN transaksi
- **PUT /change-pin** - Ubah PIN transaksi
- **POST /verify-pin** - Verifikasi PIN transaksi

### 2. Wallet (`/api/wallet`)

- **GET /balance** - Cek saldo wallet
- **GET /transactions** - Riwayat transaksi (paginated)
- **GET /ledger** - Laporan pembukuan (ledger)

### 3. Transfers (`/api/transfers`)

- **POST /** - Buat transfer uang
- **GET /** - Daftar transfer
- **GET /:id** - Detail transfer

### 4. Top-ups (`/api/topups`)

- **POST /** - Buat top-up
- **GET /** - Daftar top-ups
- **GET /:id** - Detail top-up

### 5. QR Payments (`/api/qr`)

- **POST /generate** - Generate QR code pembayaran
- **POST /scan** - Scan & verifikasi QR code

### 6. Payment Requests (`/api/requests`)

- **POST /** - Buat payment request
- **GET /** - Daftar requests
- **PUT /:id** - Update request status

### 7. Notifications (`/api/notifications`)

- **GET /** - Daftar notifikasi
- **PUT /:id/read** - Mark notifikasi sebagai read
- **DELETE /:id** - Hapus notifikasi

### 8. Ledger (`/api/ledger`)

- **GET /** - Laporan pembukuan lengkap

### 9. Admin (`/api/admin`)

- **GET /users** - Daftar semua user
- **GET /users/:id** - Detail user
- **GET /transactions** - Semua transaksi
- **POST /notifications/send** - Kirim notifikasi broadcast
- **GET /audit-log** - Audit trail

## Security Features

### Headers yang Diatur

- `X-Content-Type-Options: nosniff` - Mencegah MIME sniffing
- `X-Frame-Options: DENY` - Mencegah clickjacking
- `X-XSS-Protection: 1; mode=block` - Proteksi XSS
- `Strict-Transport-Security` (production) - Enforce HTTPS

### CORS Configuration

- **Allowed Origins**: `http://localhost:5173` (Frontend), `http://localhost:3000` (API)
- **Allowed Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Credentials**: Supported

### Authentication

- Menggunakan **JWT (Bearer Token)**
- Token dikirim di header: `Authorization: Bearer <token>`
- Expires in: 24 jam

### Rate Limiting

- General API limiter: 100 requests per 15 minutes
- Auth-specific limiter: 5 requests per 15 minutes

## Testing

### Run Unit Tests

```bash
npm test                  # Run all tests
npm test:watch          # Watch mode
npm test:coverage       # Coverage report
```

### Run Integration Tests

```bash
npm test -- controllers # Run controller tests (requires DB + Redis)
```

## Deployment Considerations

- Set `NODE_ENV=production` untuk production
- Update `CORS_ORIGIN` environment variable untuk production domain
- Ensure database dan Redis connection strings are configured
- Generate strong `JWT_SECRET` untuk production
- Use environment-specific `.env` files

## Example Requests

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "budi@example.com",
    "password": "password123"
  }'
```

### Get Balance (Requires Token)

```bash
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer <jwt_token>"
```

## Health Check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-06-03T22:30:00.000Z"
  }
}
```
