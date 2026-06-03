# Quick Deploy Guide - Railway

Panduan cepat untuk deploy DezPay ke Railway dalam 5 menit.

## Prerequisite (2 menit)

1. **Sign up Railway** (jika belum)
   - Go to https://railway.app
   - Click "Get Started"
   - Login via GitHub/GitLab/Email

2. **Have GitHub repository ready**
   - Your code sudah di-push ke GitHub
   - `main` branch adalah production

3. **Have production secrets ready**
   ```
   JWT_SECRET       (min 32 chars)
   ADMIN_PASSWORD   (for seeding)
   ```

## Step 1: Create Project (1 menit)

1. Go to Railway dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Select repository: `dezWallet`
5. Click **"Create Project"**

Railway akan auto-detect Node.js + PostgreSQL setup.

## Step 2: Add PostgreSQL (1 menit)

1. Di project, click **"+ Add Service"**
2. Select **"PostgreSQL"**
3. Choose plan (Free tier OK untuk start)
4. Railway akan auto-set DATABASE_URL

Verify:

```bash
railway env  # Should show DATABASE_URL
```

## Step 3: Add Redis (optional, 1 menit)

1. Click **"+ Add Service"**
2. Select **"Redis"**
3. Railway akan auto-set REDIS_URL

## Step 4: Configure Backend Service (2 menit)

1. Di project, select **"backend"** service
2. Go ke **"Settings"** tab
3. Set these environment variables:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-key-32-chars-minimum-here!
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://yourdomain.com
ADMIN_EMAIL=admin@dezpay.id
ADMIN_PASSWORD=Admin@DezPay2024!
```

4. Click **"Save"**

## Step 5: Configure Frontend Service (1 menit)

1. Select **"frontend"** service
2. Go ke **"Settings"** tab
3. Set environment variable:

```
VITE_API_URL=https://{your-backend-railway-url}/api
```

Replace `{your-backend-railway-url}` dengan actual Railway URL backend kamu.

Get backend URL:

- Go ke backend service
- Check "Domains" section
- Copy the `.railway.app` URL

4. Click **"Save"**

## Step 6: Trigger Deployment (auto)

Railway akan auto-deploy saat:

- Code di-push ke main branch
- Environment variables berubah

Atau manual deploy:

1. Go ke project
2. Click **"Deployments"**
3. Find latest deployment
4. Click **"Redeploy"** (jika perlu)

## Step 7: Run Migrations (1 menit)

Setelah deploy berhasil, jalankan migrations:

**Via Railway CLI** (recommended):

```bash
railway link  # Link local project ke Railway project
railway run npm run migrate
railway run npm run seed  # Optional: seed initial data
```

**Via Railway Dashboard**:

1. Go ke backend service
2. Click **"Connect"** (di top right)
3. Run command: `npm run migrate`
4. Then: `npm run seed`

## Step 8: Verify Deployment (1 menit)

### Check Status

```bash
railway status
```

### Test Backend

```bash
curl https://{your-backend-url}/health
# Should return: {"success": true, "data": {"status": "ok"}}
```

### Test API Docs

```
https://{your-backend-url}/api/docs
```

### Test Frontend

```
https://{your-frontend-url}
```

### Test Login

1. Open frontend URL
2. Register new account
3. Login dengan credentials
4. Check balance/transactions

## Step 9: Setup Custom Domain (optional, 2 menit)

1. Buy domain (Namecheap, GoDaddy, etc)
2. At Railway dashboard:
   - Backend service → Settings → Domains
   - Add: `api.yourdomain.com`
   - Copy CNAME record

3. At domain registrar:
   - Add CNAME record
   - `api` → `{railway-backend-url}`
   - Wait for DNS propagation (5-15 min)

## Done! 🎉

Your application is now live:

- **Frontend**: `https://yourdomain.com` (or Railway URL)
- **API**: `https://api.yourdomain.com/api` (or Railway URL)
- **Docs**: `https://api.yourdomain.com/api/docs`

## Troubleshooting

### Build Failed

```bash
railway logs --service backend
railway logs --service frontend
```

Check untuk:

- Missing dependencies
- TypeScript errors
- Wrong environment variables

### App Crashes

```bash
railway logs --tail --service backend
```

Common issues:

- `DATABASE_URL` not set
- `JWT_SECRET` missing
- Port conflict (Railway auto-assigns)

### Database Connection Error

```bash
railway env
```

Verify:

- DATABASE_URL exists
- Format: `postgresql://user:pass@host:port/db`

### Frontend Can't Reach API

Check:

- VITE_API_URL correct
- CORS_ORIGIN in backend includes frontend URL
- API service is running

### Fix & Redeploy

```bash
# Fix code locally
git add .
git commit -m "Fix issue"
git push origin main

# Railway auto-redeploy, or:
railway redeploy --service backend
```

## Monitoring

### View Real-time Logs

```bash
railway logs --tail
```

### Check Metrics

Railway dashboard → Service → Metrics

- CPU usage
- Memory usage
- Network I/O

### Set Alerts

Railway dashboard → Project Settings → Alerts

## Common Commands

```bash
# Setup
railway login
railway link

# Deployment
railway up
railway redeploy
railway logs

# Database
railway run npm run migrate
railway run npm run seed
railway run npm run test

# Env management
railway env
railway env set KEY value
railway env delete KEY

# Rollback
railway rollback
```

## Documentation Links

- Full guide: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- Checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Architecture: [RAILWAY_ARCHITECTURE.md](./RAILWAY_ARCHITECTURE.md)
- API Docs: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

**Time to Deploy**: ~10 minutes
**Cost**: $5-30/month
**Difficulty**: Easy
**Maintenance**: Minimal (Railway managed)

---

**Need help?**

- Railway Docs: https://docs.railway.app
- Railway Support: https://railway.app/support
- Our Docs: See above links
