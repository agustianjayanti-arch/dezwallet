# Railway Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RAILWAY PLATFORM                              │
│                                                                       │
│  ┌──────────────────┐        ┌──────────────────┐                   │
│  │   Frontend App   │        │   Backend API    │                   │
│  │   (Vue 3 + PWA)  │        │ (Express + Node) │                   │
│  ├──────────────────┤        ├──────────────────┤                   │
│  │ - Build: Vite    │        │ - Build: tsc     │                   │
│  │ - Port: 5173*    │        │ - Port: 3000     │                   │
│  │ - Runtime: Node  │        │ - Runtime: Node  │                   │
│  │ - Memory: 512MB  │        │ - Memory: 1GB    │                   │
│  └────────┬─────────┘        └────────┬─────────┘                   │
│           │ HTTPS                     │ HTTPS                       │
│           │                           │                             │
│           │                    ┌──────┴──────┐                      │
│           │                    │             │                      │
│           │                  ┌─▼─────┐  ┌───▼──┐                   │
│           │                  │ Postgres │ Redis │                   │
│           │                  │   12+    │ (opt) │                   │
│           │                  └─────────┘ └──────┘                   │
│           │                                                          │
│           └────────────────────────────────────────────────────────┘
│
│  Environment:
│  - NODE_ENV = production
│  - Auto HTTPS + SSL
│  - Auto backups (Postgres)
│  - Monitoring & logs
│  - Auto-deploy on git push
│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    USER ACCESS                                       │
│                                                                       │
│  https://yourdomain.com              https://api.yourdomain.com     │
│  (or auto-generated Railway URL)     (or auto-generated Railway URL)│
│                                                                       │
│  ├─ Frontend PWA                     ├─ REST API                    │
│  ├─ Offline support                  ├─ WebSocket (future)          │
│  ├─ Installable                      ├─ Swagger/OpenAPI Docs        │
│  └─ Mobile responsive                └─ Health check endpoint       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

User
  │
  ├─► Browser / Mobile App
  │   │
  │   ├─► HTTPS
  │   │
  │   ├─► Frontend Service (Railway)
  │   │   ├─ Vue 3 SPA
  │   │   ├─ Service Worker
  │   │   └─ Static assets
  │   │
  │   └─► API Requests
  │       │
  │       ├─► Backend Service (Railway)
  │       │   ├─ Express.js
  │       │   ├─ Rate limiting
  │       │   ├─ JWT validation
  │       │   └─ CORS enabled
  │       │
  │       └─► Database Layer
  │           ├─ PostgreSQL (primary)
  │           ├─ Redis (cache/queue)
  │           └─ Automatic backups
```

## Data Flow

### Request Path

```
User Request
   ↓
CDN / Railway Proxy
   ↓
Frontend Service (Vue 3)
   ↓
API Call to Backend
   ↓
Backend Service (Express)
   ↓
Authentication (JWT)
   ↓
Rate Limiting
   ↓
Business Logic
   ↓
Database Query (Postgres)
   ↓
Cache Check (Redis)
   ↓
Response
```

## Deployment Sequence

```
1. Developer pushes to GitHub
   ↓
2. Railway detects push
   ↓
3. Build process starts
   ├─ Backend: npm install && npm run build
   └─ Frontend: npm install && npm run build
   ↓
4. Tests run (optional)
   ↓
5. Services deploy
   ├─ Backend: npm run start
   ├─ Frontend: npm run preview (static serve)
   └─ Database: auto-provisioned
   ↓
6. Health checks pass
   ↓
7. Services go live
   ↓
8. Traffic routed to new deployment
```

## Environment Variables Mapping

### Backend Production

```
Environment: Railway
├─ NODE_ENV = production (explicit)
├─ PORT = auto (Railway assigns)
├─ DATABASE_URL = postgresql://... (auto-provisioned)
├─ REDIS_URL = redis://... (auto-provisioned)
├─ JWT_SECRET = your-secret-key
├─ CORS_ORIGIN = https://yourdomain.com
└─ Other configs...
```

### Frontend Production

```
Environment: Railway
├─ VITE_API_URL = https://api.yourdomain.com
├─ VITE_APP_NAME = DezPay
└─ VITE_APP_VERSION = 1.0.0
```

## Storage & Persistence

```
Railway Postgres (Built-in)
├─ Auto backups daily
├─ Point-in-time restore
├─ Connection pooling
└─ SSL encrypted

Railway Redis (Optional)
├─ Session cache
├─ Rate limit counters
├─ Job queue
└─ Pub/Sub messaging

Application Logs
├─ Query logs
├─ Request logs
├─ Error logs
└─ Access logs (auto-collected)
```

## Security Architecture

```
HTTPS/TLS Encryption
   ↓
Railway Network
   ↓
Service Isolation
   ├─ Frontend container
   ├─ Backend container
   └─ Database container (no direct internet)
   ↓
Credentials
├─ JWT tokens (user auth)
├─ Database passwords (Railway managed)
├─ API keys (environment variables)
└─ Secrets (not in code/git)
   ↓
Rate Limiting
├─ General: 100 req/15min
├─ Auth: 5 req/15min
└─ Burst protection
   ↓
CORS Validation
└─ Whitelist only known domains
```

## Monitoring & Observability

```
Railway Dashboard
├─ Deployment history
├─ Real-time metrics
│  ├─ CPU usage
│  ├─ Memory usage
│  ├─ Network I/O
│  └─ Disk usage
├─ Logs
│  ├─ Build logs
│  ├─ Runtime logs
│  └─ Error logs
└─ Alerts
   ├─ Service down
   ├─ High memory
   └─ Build failures
```

## Scaling Scenarios

```
Default (Free/Hobby Plan):
├─ Backend: 512MB memory
├─ Frontend: 256MB memory
├─ Database: 10GB
└─ Perfect for MVP/demo

Production (Pro Plan+):
├─ Backend: 2GB memory (with scaling)
├─ Frontend: 512MB memory (with scaling)
├─ Database: 100GB+ (with replication)
├─ Load balancer (optional)
└─ Multiple replicas (optional)
```

## Disaster Recovery

```
Problem             Solution               Time
────────────────────────────────────────────────
Service down        Auto-restart           < 1 min
Database fails      Restore from backup    < 5 min
Deployment error    Rollback to prev       < 2 min
Data loss           Point-in-time restore  varies
```

## Cost Breakdown (Estimated)

```
Component           Free/Month   Production/Month
──────────────────────────────────────────────
Frontend Service    $0-5         $10-20
Backend Service     $0-5         $15-30
PostgreSQL          $5           $15-50
Redis (optional)    $0-5         $5-15
Custom Domain       $0           $10-15
────────────────────────────────────────────
TOTAL               ~$5-10       ~$55-130

* Railway gives $5/month free credit
* Costs scale with usage
* Upgrade needed at ~100 DAU
```

---

**Architecture Type**: Microservices-light
**Deployment Model**: Platform-as-a-Service (PaaS)
**Update Strategy**: Blue-green (auto by Railway)
**Backup Strategy**: Daily + point-in-time restore
