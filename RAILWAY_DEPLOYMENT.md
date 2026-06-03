# Panduan Deploy ke Railway

Railway adalah platform cloud yang simple dan powerful untuk deploy aplikasi. Berikut panduan step-by-step untuk deploy DezPay ke Railway.

## Prerequisites

- Railway account (gratis signup di https://railway.app)
- Git repository (GitHub, GitLab, atau Bitbucket)
- CLI Railway (optional tapi recommended)

## Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

## Step 2: Login ke Railway

```bash
railway login
```

Browser akan membuka login page. Login dengan akun Railway kamu.

## Step 3: Setup Project di Railway

### Option A: Via Dashboard (Recommended untuk Pertama Kali)

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Pilih "Deploy from GitHub"
4. Connect GitHub repository kamu
5. Railway akan auto-detect build setup

### Option B: Via CLI

```bash
cd c:\Users\User\Documents\dezWallet
railway init
```

Follow prompts untuk setup project.

## Step 4: Configure Backend Deployment

### 4.1 Environment Variables Backend

Di Railway Dashboard:

1. Go ke backend service
2. Click "Variables" tab
3. Add environment variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-production-secret-key-32-chars-min
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://yourdomain.com
```

### 4.2 Database Setup

Railway akan automatic create PostgreSQL plugin:

1. Di backend service, click "+ Add"
2. Pilih "PostgreSQL"
3. Railway akan auto-set `DATABASE_URL`

Atau manual:

```bash
railway add postgres
```

### 4.3 Redis Setup (Optional tapi Recommended)

```bash
railway add redis
```

Railway akan auto-set `REDIS_URL`.

## Step 5: Configure Frontend Deployment

### 5.1 Environment Variables Frontend

Di Railway Dashboard (frontend service):

1. Click "Variables" tab
2. Add variables:

```
VITE_API_URL=https://backend-production-url/api
VITE_APP_NAME=DezPay
VITE_APP_VERSION=1.0.0
```

### 5.2 Build & Deploy

Railway auto-detect dari vite.config.ts dan package.json scripts.

## Step 6: Custom Domain (Optional)

1. Beli domain di Namecheap, GoDaddy, atau provider lain
2. Di Railway dashboard, service kamu:
   - Click "Settings"
   - Add custom domain
   - Update DNS records sesuai instruksi Railway

## Step 7: Deploy

### Via Dashboard:

1. Push code ke GitHub
2. Railway auto-trigger deployment saat ada push
3. Monitor deployment progress di "Deployments" tab

### Via CLI:

```bash
# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

## Step 8: Run Migrations

Setelah backend deployed, jalankan migrations:

```bash
# Via Railway CLI
railway run npm run migrate
```

Atau manual di server:

1. Dashboard → Backend Service → "Connect"
2. Run command: `npm run migrate`

## Step 9: Verify Deployment

### Backend Health Check

```bash
curl https://your-backend-url/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-06-03T..."
  }
}
```

### API Documentation

```
https://your-backend-url/api/docs
```

### Frontend

```
https://your-frontend-url
```

## Troubleshooting

### Build Failed

Check logs:

```bash
railway logs --service backend
railway logs --service frontend
```

### Database Connection Error

Verify DATABASE_URL:

```bash
railway env
```

### Redis Connection Error

Jika Redis optional, Railway fallback to PostgreSQL (lihat src/config/redis.ts).

### Env Variables Not Loaded

```bash
# Trigger redeploy
railway redeploy --service backend
```

## Monitoring & Maintenance

### View Logs

```bash
railway logs --tail
```

### Check Status

```bash
railway status
```

### Scale Memory/CPU (Paid Plans)

Dashboard → Service → "Settings" → "Resources"

## Cost Estimation

Railway pricing (as of June 2024):

- **Free Plan**: $5/month credit (usually covers small projects)
- **PostgreSQL**: $5-15/month
- **Redis**: $2-5/month
- **Compute**: Pay as you use

DezPay estimated: $20-30/month untuk production-grade infrastructure.

## Automatic Deployments

GitHub Integration:

- Automatic deploy saat `git push` ke main branch
- Bisa set branch-specific deployments
- Pull request previews (dengan upgrade plan)

## Security Best Practices

1. **Secrets Management**:
   - Jangan push `.env` ke Git
   - Use Railway Variables untuk secrets
   - Rotate JWT_SECRET secara berkala

2. **HTTPS**:
   - Semua Railway URLs auto HTTPS
   - Custom domain juga auto SSL

3. **Rate Limiting**:
   - Already configured di middleware
   - Monitor di logs jika ada abuse

4. **Database Backups**:
   - Railway auto-backup PostgreSQL daily
   - Manual backup: Dashboard → PostgreSQL → "Backups"

## Next Steps

1. ✅ Create Railway account
2. ✅ Connect GitHub repository
3. ✅ Add environment variables
4. ✅ Deploy backend + database
5. ✅ Deploy frontend
6. ✅ Run migrations
7. ✅ Test endpoints
8. ✅ Setup custom domain (optional)
9. ✅ Monitor logs dan metrics

## Useful Commands

```bash
# Login/Logout
railway login
railway logout

# Project management
railway init          # Initialize new project
railway switch        # Switch between projects
railway list          # List all services

# Deployment
railway up            # Deploy
railway redeploy      # Force redeploy
railway logs --tail   # Stream logs

# Environment
railway env           # Show variables
railway env set KEY value  # Set variable
railway env delete KEY     # Delete variable

# Database
railway run "npm run seed"  # Run seeding
railway run "npm run migrate"  # Run migrations
```

## Links & Resources

- [Railway Docs](https://docs.railway.app)
- [Railway CLI Docs](https://docs.railway.app/cli/commands)
- [Pricing](https://railway.app/pricing)
- [Support](https://railway.app/support)

---

**Catatan**: Panduan ini asumsi kamu sudah punya Railway account. Jika belum, daftar gratis di https://railway.app
