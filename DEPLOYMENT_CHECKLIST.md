# Deployment Checklist

Gunakan checklist ini untuk memastikan semua siap sebelum deploy ke production.

## Pre-Deployment (Development)

- [ ] Semua tests passing

  ```bash
  npm test  # backend
  npm test -- --run  # frontend
  ```

- [ ] No TypeScript errors

  ```bash
  npm run build  # both
  ```

- [ ] Environment variables configured
  - [ ] `.env` ter-setup di local
  - [ ] `.env.example` updated dengan semua required vars
  - [ ] Secrets tidak ter-commit

- [ ] Git repository clean

  ```bash
  git status  # harus clean
  ```

- [ ] All code committed
  ```bash
  git add .
  git commit -m "Prepare for deployment"
  git push
  ```

## Railway Setup

- [ ] Railway account created
- [ ] GitHub/GitLab repository connected
- [ ] Project created di Railway dashboard
- [ ] Backend service configured
  - [ ] railway.json exists
  - [ ] Procfile exists
  - [ ] Build command correct: `npm install && npm run build`
  - [ ] Start command correct: `npm run start`

- [ ] Frontend service configured
  - [ ] railway.json exists
  - [ ] Procfile exists
  - [ ] Build command correct: `npm install && npm run build`
  - [ ] Start command correct: `npm run preview`

## Environment Variables - Backend

```
NODE_ENV=production
PORT=3000 (auto via Railway)
DATABASE_URL=<from Railway PostgreSQL plugin>
REDIS_URL=<from Railway Redis plugin> (optional)
JWT_SECRET=<strong-32-char-minimum>
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

- [ ] All variables set di Railway dashboard
- [ ] DATABASE_URL pointing ke production DB
- [ ] JWT_SECRET is strong (32+ chars, mixed case, symbols)
- [ ] CORS_ORIGIN updated dengan production frontend URL

## Environment Variables - Frontend

```
VITE_API_URL=https://your-backend-url/api
VITE_APP_NAME=DezPay
VITE_APP_VERSION=1.0.0
```

- [ ] VITE_API_URL correct
- [ ] Points ke production backend

## Database

- [ ] PostgreSQL service created di Railway
  - [ ] DATABASE_URL auto-generated
  - [ ] Credentials aman (Railway managed)

- [ ] Database migrated

  ```bash
  railway run npm run migrate
  ```

- [ ] (Optional) Database seeded dengan initial admin user

  ```bash
  railway run npm run seed
  ```

- [ ] Backup enabled
  - [ ] Railway auto-backup enabled (default)
  - [ ] Manual backup created before deploy

## Redis (Optional)

- [ ] Redis service created (jika needed)
  - [ ] REDIS_URL auto-generated
  - [ ] Connection tested

## First Deployment

- [ ] Trigger deployment
  - [ ] Via git push ke main branch, atau
  - [ ] Manual deploy via Railway CLI: `railway up`

- [ ] Monitor deployment progress
  - [ ] Build logs: no errors
  - [ ] Deploy logs: no errors
  - [ ] Service status: healthy

## Post-Deployment Tests

- [ ] Health check endpoint

  ```bash
  curl https://your-backend-url/health
  ```

  Expected: `{"success": true, "data": {"status": "ok"}}`

- [ ] API documentation accessible

  ```
  https://your-backend-url/api/docs
  ```

- [ ] Frontend loads

  ```
  https://your-frontend-url
  ```

- [ ] Login/register flow works
  - [ ] Register new user
  - [ ] Login dengan credentials
  - [ ] JWT token received
  - [ ] Access protected endpoints

- [ ] API endpoints tested
  - [ ] GET /api/wallet/balance - returns wallet info
  - [ ] GET /api/wallet/transactions - returns history
  - [ ] POST /api/transfers - create transfer
  - [ ] Other critical endpoints

- [ ] Error handling works
  - [ ] Invalid credentials return 401
  - [ ] Missing required fields return 400
  - [ ] Rate limiting active (check headers)

- [ ] Security verified
  - [ ] CORS headers correct
  - [ ] Security headers present
    - [ ] X-Content-Type-Options: nosniff
    - [ ] X-Frame-Options: DENY
    - [ ] Strict-Transport-Security (HTTPS)
  - [ ] HTTPS enforced

- [ ] Frontend PWA features
  - [ ] Service worker registered
  - [ ] Offline mode works (optional test)
  - [ ] Install prompt appears (mobile)

## Monitoring

- [ ] Logs configured

  ```bash
  railway logs --tail --service backend
  ```

- [ ] Error alerts setup (Railway notifications)

- [ ] Performance monitoring
  - [ ] Response times acceptable
  - [ ] No 5xx errors in logs

## Custom Domain (Optional)

- [ ] Domain purchased
- [ ] Domain added di Railway
- [ ] DNS records updated
  - [ ] CNAME pointing ke Railway
- [ ] SSL certificate issued (auto Railway)
- [ ] Both www dan non-www working
- [ ] Redirect configured (if needed)

## Post-Launch Monitoring

- [ ] Daily check logs
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Database connection healthy
- [ ] Redis connection (if used) healthy

## Rollback Plan (If Issues)

- [ ] Previous version tagged in Git

  ```bash
  git tag v1.0.0-production
  ```

- [ ] Rollback procedure documented

  ```bash
  railway rollback  # revert to previous deployment
  ```

- [ ] Database backup available
- [ ] Team alerted procedure setup

## Documentation

- [ ] Deployment documentation updated
- [ ] Runbook created for common issues
- [ ] Team trained on deployment process
- [ ] On-call procedure documented

---

## Quick Troubleshooting

| Issue                        | Fix                                   |
| ---------------------------- | ------------------------------------- |
| Build failed                 | Check `railway logs` for errors       |
| Env vars not loaded          | Run `railway redeploy`                |
| DB connection error          | Verify DATABASE_URL in Railway        |
| Frontend can't reach API     | Check CORS_ORIGIN and VITE_API_URL    |
| Rate limiting too aggressive | Adjust limits in rateLimiter.ts       |
| Memory issues                | Upgrade Railway tier or optimize code |

---

**Status**: Ready for Deployment
**Last Checked**: June 3, 2024
**Deployed Version**: v1.0.0
