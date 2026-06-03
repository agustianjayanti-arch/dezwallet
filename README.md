# DezPay - Quick Start Guide

## Project Structure

```
dezWallet/
├── backend/              # Express.js + TypeScript API
├── frontend/             # Vue 3 + Vite PWA
├── docker-compose.yml    # Local development setup
└── README.md            # This file
```

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+ (optional, fallback to PostgreSQL)
- npm atau yarn

### Setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.development

# Run migrations & seed (backend)
cd backend
npm run migrate
npm run seed

# Start dev servers (dari root atau separate terminals)
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:3000
Swagger Docs: http://localhost:3000/api/docs

## Features

✅ **User Authentication** - Register, login, change password
✅ **E-Wallet** - Check balance, transaction history, ledger
✅ **Transfers** - Send money to other users
✅ **Top-ups** - Add balance via bank transfer
✅ **QR Payments** - Generate & scan payment QR codes
✅ **Payment Requests** - Request money from other users
✅ **Admin Dashboard** - Manage users, view all transactions
✅ **Notifications** - Real-time push notifications
✅ **PWA** - Works offline, installable on mobile
✅ **Security** - JWT auth, rate limiting, security headers
✅ **Testing** - Unit & integration tests included

## Testing

```bash
# Backend tests
cd backend
npm test              # Run all tests
npm test:watch       # Watch mode
npm test:coverage    # Coverage report

# Frontend tests
cd frontend
npm test -- --run    # Run once
npm test             # Watch mode
npm test:ui          # Test UI dashboard
```

## Build & Deployment

### Docker (Optional)

```bash
docker-compose up --build
```

### Railway Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for complete guide.

Quick:

1. Push ke GitHub
2. Connect repository di Railway dashboard
3. Add environment variables
4. Deploy!

### Manual Deployment

```bash
# Backend build
cd backend
npm run build
npm run start

# Frontend build
cd frontend
npm run build
npx http-server dist/  # or use your web server
```

## Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- [Testing Setup](./TESTING.md)

## Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Language**: TypeScript 5
- **Database**: PostgreSQL 12+
- **Cache**: Redis 6+ (optional)
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcrypt
- **Validation**: Zod
- **Job Queue**: BullMQ
- **API Docs**: Swagger/OpenAPI 3.0

### Frontend

- **Framework**: Vue 3
- **Build**: Vite 5
- **State**: Pinia
- **Router**: Vue Router 4
- **HTTP**: Axios
- **Styling**: Tailwind CSS
- **PWA**: vite-plugin-pwa
- **Icons**: Heroicons Vue

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Issues: GitHub Issues
- Email: support@dezpay.id
- Docs: See documentation files above

---

**Last Updated**: June 3, 2024
**Current Version**: 1.0.0
