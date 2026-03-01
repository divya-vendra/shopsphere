# ShopSphere — Deployment Guide

Complete step-by-step instructions for deploying ShopSphere to production.

| Service | Role | Free tier |
|---|---|---|
| **MongoDB Atlas** | Database | 512 MB shared (M0) |
| **Render** | Backend API | 750 hrs/month |
| **Vercel** | Frontend | Unlimited hobby |
| **Stripe** | Payments | Free in test mode |
| **Cloudinary** | Image storage | 25 credits/month |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [MongoDB Atlas Setup](#2-mongodb-atlas-setup)
3. [Cloudinary Setup](#3-cloudinary-setup)
4. [Stripe Setup](#4-stripe-setup)
5. [Backend → Render](#5-backend--render)
6. [Frontend → Vercel](#6-frontend--vercel)
7. [Environment Variable Reference](#7-environment-variable-reference)
8. [CI/CD with GitHub Actions](#8-cicd-with-github-actions)
9. [Custom Domain (Optional)](#9-custom-domain-optional)
10. [Post-Deploy Checklist](#10-post-deploy-checklist)
11. [Docker Local Development](#11-docker-local-development)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

- **Node.js 20+** installed locally
- **Git** and a GitHub account
- **Docker Desktop** (optional, for local dev stack)
- Accounts created at: MongoDB Atlas, Render, Vercel, Stripe, Cloudinary

### Fork / Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/shopsphere.git
cd shopsphere
```

---

## 2. MongoDB Atlas Setup

### 2.1 Create a free cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **Create a new project** (e.g. `shopsphere-prod`)
2. Click **Build a Database** → choose **M0 Free** (512 MB, shared)
3. Select a cloud provider and region closest to your Render region (e.g. AWS us-east-1)
4. Cluster name: `ShopSphere`

### 2.2 Create a database user

1. Left sidebar → **Database Access** → **Add New Database User**
2. Authentication: **Password**
3. Username: `shopsphere_api`
4. Password: click **Autogenerate Secure Password** — **copy and save it**
5. Built-in role: **Atlas admin** (or restrict to `shopsphere` DB only)
6. Click **Add User**

### 2.3 Whitelist IP addresses

1. Left sidebar → **Network Access** → **Add IP Address**
2. For Render (dynamic IPs): Click **Allow Access from Anywhere** → `0.0.0.0/0`
   > This is required for Render's dynamic IP pool. Secure via your app's auth layer.
3. For local development: **Add Current IP Address** (your home IP)

### 2.4 Get the connection string

1. Clusters page → **Connect** → **Drivers**
2. Driver: **Node.js**, Version: 5.5 or later
3. Copy the connection string — it looks like:
   ```
   mongodb+srv://shopsphere_api:<password>@shopsphere.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with the password you saved in step 2.2
5. Add the database name before `?`:
   ```
   mongodb+srv://shopsphere_api:YOUR_PASS@shopsphere.xxxxx.mongodb.net/shopsphere?retryWrites=true&w=majority&appName=ShopSphere
   ```

### 2.5 Create indexes

After your first deploy (or locally with the Atlas URI):

```bash
cd backend
MONGODB_URI="your_atlas_uri" node src/scripts/verifyIndexes.js
```

---

## 3. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com) (free plan)
2. Dashboard → copy your **Cloud name**, **API Key**, **API Secret**
3. Go to **Settings → Upload** → ensure unsigned uploads are **disabled** (the backend signs all uploads)
4. (Optional) Create two upload presets named `shopsphere_products` and `shopsphere_avatars` for organized folder storage

---

## 4. Stripe Setup

### 4.1 Test mode first

All development uses Stripe test mode keys. **Never commit live keys.**

1. [dashboard.stripe.com](https://dashboard.stripe.com) → ensure you're in **Test mode** (toggle top-right)
2. **Developers → API keys**:
   - Copy **Publishable key** (starts with `pk_test_`) — used in frontend env
   - Copy **Secret key** (starts with `sk_test_`) — used in backend env

### 4.2 Set up the Webhook (production)

1. **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://YOUR_RENDER_URL/api/v1/payments/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Click **Add endpoint** → copy the **Signing secret** (starts with `whsec_`)

### 4.3 Test cards

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | 3D Secure required |

Use any future expiry, any 3-digit CVC, any ZIP.

### 4.4 Go live

When ready for real payments:
1. Complete Stripe's **business verification** (Settings → Business)
2. Toggle to **Live mode** → get live keys (`sk_live_...`, `pk_live_...`)
3. Create a **new** webhook endpoint pointing to the same URL but using live mode
4. Update your Render environment variables with live keys

---

## 5. Backend → Render

### 5.1 Connect your repository

1. [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub account → select the `shopsphere` repository
3. Settings:
   - **Name**: `shopsphere-api`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter for always-on)

### 5.2 Set environment variables

In the Render service → **Environment** tab, add all variables:

```
NODE_ENV                = production
PORT                    = 5000
MONGODB_URI             = mongodb+srv://...    (from step 2.4)
JWT_ACCESS_SECRET       = <generate 64-char random string>
JWT_ACCESS_EXPIRES_IN   = 15m
JWT_REFRESH_SECRET      = <generate 64-char random string — different from above>
JWT_REFRESH_EXPIRES_IN  = 7d
CLIENT_URL              = https://shopsphere.vercel.app  (your Vercel URL)
STRIPE_SECRET_KEY       = sk_test_...
STRIPE_WEBHOOK_SECRET   = whsec_...
CLOUDINARY_CLOUD_NAME   = your_cloud_name
CLOUDINARY_API_KEY      = your_api_key
CLOUDINARY_API_SECRET   = your_api_secret
SMTP_HOST               = smtp.gmail.com       (or your email provider)
SMTP_PORT               = 587
SMTP_USER               = your@email.com
SMTP_PASS               = your_app_password
EMAIL_FROM              = ShopSphere <noreply@shopsphere.com>
```

**Generate secure JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run this twice — one for access, one for refresh.

### 5.3 Deploy

1. Click **Create Web Service** — Render will build and deploy automatically
2. Wait for the build to complete (3-5 min on first deploy)
3. Copy your service URL: `https://shopsphere-api.onrender.com`
4. Test: `curl https://shopsphere-api.onrender.com/api/v1/products`

### 5.4 Seed initial data (optional)

```bash
# From your local machine with the production MONGODB_URI
cd backend
MONGODB_URI="your_atlas_uri" node src/scripts/seed.js --import
```

> The seed creates 3 users and 8 demo products. Remove or customize before going live.

### 5.5 Auto-deploy

Render auto-deploys on every push to `main`. You can also use the deploy hook in GitHub Actions (see Section 8).

---

## 6. Frontend → Vercel

### 6.1 Import project

1. [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Select the `shopsphere` repository
3. **Framework Preset**: Vite (Vercel auto-detects this)
4. **Root Directory**: `frontend`
5. **Build Command**: `npm run build` (auto-filled)
6. **Output Directory**: `dist` (auto-filled)

### 6.2 Set environment variables

In Vercel project → **Settings → Environment Variables**:

```
VITE_API_URL = https://shopsphere-api.onrender.com/api/v1
```

> **Important**: Set this for all three environments: Production, Preview, Development.

### 6.3 Deploy

Click **Deploy**. Vercel builds and deploys in ~1 minute.

Your app is now live at `https://shopsphere-XXXXX.vercel.app`.

### 6.4 Configure CORS on the backend

Update `CLIENT_URL` in Render to match your Vercel URL:
```
CLIENT_URL = https://shopsphere-XXXXX.vercel.app
```

If you have a custom domain (see Section 9), use that instead.

### 6.5 SPA routing

The `frontend/vercel.json` already includes the SPA rewrite rule:
```json
{ "source": "/((?!api/.*).*)", "destination": "/index.html" }
```
All routes (e.g. `/products/my-slug`, `/admin`) resolve correctly.

---

## 7. Environment Variable Reference

### Backend (all required in production)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | API listen port | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | 64-char hex |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | 64-char hex (different) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Frontend origin for CORS | `https://shopsphere.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `my_cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123...` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | SMTP username | `user@gmail.com` |
| `SMTP_PASS` | SMTP password / app password | `abcd efgh ijkl mnop` |
| `EMAIL_FROM` | Sender display name + address | `ShopSphere <noreply@shopsphere.com>` |

### Frontend

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full backend API base URL | `https://shopsphere-api.onrender.com/api/v1` |

> **Never prefix backend secrets with `VITE_`** — Vite bakes `VITE_*` variables into the JS bundle, making them visible to all users.

---

## 8. CI/CD with GitHub Actions

The `.github/workflows/` directory contains two pipeline files.

### 8.1 Required GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Where to find it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render service → Settings → Deploy Hook → copy URL |
| `RENDER_API_KEY` | render.com → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | Render service URL: `https://dashboard.render.com/web/srv-XXXXXXXXXX` |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Run `vercel link` locally → check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same `.vercel/project.json` file |

### 8.2 Required GitHub Variables

Go to **Settings → Secrets and variables → Actions → Variables tab**:

| Variable name | Value |
|---|---|
| `VITE_API_URL` | `https://shopsphere-api.onrender.com/api/v1` |

### 8.3 Link Vercel project locally (one-time setup)

```bash
cd frontend
npm install -g vercel
vercel login
vercel link
# Answer the prompts — links to your existing Vercel project
cat .vercel/project.json   # copy orgId and projectId
```

### 8.4 Pipeline behaviour

| Trigger | Backend pipeline | Frontend pipeline |
|---|---|---|
| PR to `main` / `develop` | lint → test | lint → build → Vercel preview |
| Push to `develop` | lint → test | lint → build |
| Push to `main` | lint → test → Render deploy | lint → build → Vercel production deploy |

---

## 9. Custom Domain (Optional)

### Frontend domain on Vercel

1. Vercel project → **Settings → Domains** → Add `shopsphere.com`
2. Add the CNAME record to your DNS provider:
   ```
   CNAME  www    cname.vercel-dns.com
   A      @      76.76.21.21
   ```
3. Vercel auto-provisions an SSL certificate via Let's Encrypt

### Backend domain on Render

1. Render service → **Settings → Custom Domains** → Add `api.shopsphere.com`
2. Add a CNAME record:
   ```
   CNAME  api    shopsphere-api.onrender.com
   ```
3. Render auto-provisions SSL

### Update CORS after adding domains

Update the `CLIENT_URL` environment variable on Render:
```
CLIENT_URL = https://shopsphere.com
```

---

## 10. Post-Deploy Checklist

Run through these steps after every production deployment:

### API health
- [ ] `GET /api/v1/products` returns product list
- [ ] `POST /api/v1/auth/register` creates a new user
- [ ] `POST /api/v1/auth/login` returns tokens
- [ ] Cloudinary upload works (create a product with an image via admin panel)

### Payments
- [ ] Checkout flow completes with test card `4242 4242 4242 4242`
- [ ] Order status changes to `paid` after payment
- [ ] Stripe dashboard shows the test payment
- [ ] Stripe webhook test (Dashboard → Webhooks → Send test event)

### Security
- [ ] `curl -I https://api.shopsphere.com` — verify `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` headers are present (helmet)
- [ ] Access token is NOT present in `localStorage` (stored in Redux memory only)
- [ ] Refresh token cookie is `HttpOnly; Secure; SameSite=Strict`
- [ ] Admin routes return `403` when accessed by a non-admin user

### Performance
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 90
- [ ] Check Network tab — `/assets/` files have `Cache-Control: max-age=31536000, immutable`
- [ ] API response headers include `Content-Encoding: gzip` for JSON responses

### Monitoring (recommended next steps)
- [ ] Add Sentry for frontend error tracking: `npm install @sentry/react`
- [ ] Enable Render alerts (service health notifications)
- [ ] Set up MongoDB Atlas alerts for slow queries and disk usage

---

## 11. Docker Local Development

Run the entire stack locally with a single command. No Atlas or external services needed.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start the stack

```bash
# From project root
docker compose up --build
```

Services that start:

| Service | URL | Description |
|---|---|---|
| Frontend | http://localhost:5173 | Vite dev server with HMR |
| Backend API | http://localhost:5000 | Express API with nodemon |
| MongoDB | localhost:27017 | MongoDB 7.0 (use Compass to browse) |
| Mongo Express | http://localhost:8081 | Browser-based MongoDB UI |

### Stop the stack

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop containers AND delete all data
```

### Rebuild after dependency changes

```bash
docker compose up --build
```

### Environment overrides for Docker

The `docker-compose.yml` uses sensible development defaults. To override, create `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

The `env_file: ./backend/.env` directive in `docker-compose.yml` will pick this up automatically.

### Seed demo data (Docker)

```bash
docker compose exec api npm run seed
```

### Stripe webhooks in local Docker

Run the Stripe CLI in a separate terminal to forward webhooks to the local API:

```bash
stripe listen --forward-to http://localhost:5000/api/v1/payments/webhook
```

The CLI will print a webhook signing secret — add it to `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 12. Troubleshooting

### "Could not connect to MongoDB"

- Confirm your Atlas cluster is running (not paused — M0 free clusters pause after 60 days of inactivity)
- Verify `MONGODB_URI` is correctly set and the password has no unescaped special characters
  - Special characters in passwords must be URL-encoded (e.g. `@` → `%40`, `#` → `%23`)
- Check Atlas Network Access — `0.0.0.0/0` must be whitelisted for Render

### "Invalid Stripe webhook signature"

- Ensure the raw request body reaches the webhook handler — `express.raw({ type: 'application/json' })` is applied **before** `express.json()` in `app.js`
- Confirm `STRIPE_WEBHOOK_SECRET` matches the signing secret of the **correct webhook endpoint** (test vs. live mode have separate endpoints)
- If testing locally, use the Stripe CLI `stripe listen` command and use the CLI-provided secret, not the dashboard one

### "CORS error" in browser

- The `CLIENT_URL` environment variable on Render must match the **exact origin** the browser sends (including `https://`, no trailing slash)
- If using a custom domain, update `CLIENT_URL` to the custom domain, not the `.vercel.app` URL
- Check that preflight `OPTIONS` requests return `200` — look at the Network tab for the OPTIONS request

### Render free tier goes to sleep

The Render free tier spins down after 15 minutes of inactivity, causing a ~30-second cold start on the next request.

Options:
- Upgrade to **Starter** ($7/month) for always-on service
- Use a free uptime monitor (e.g. UptimeRobot) to ping `/api/v1/products` every 14 minutes

### "Vite cannot reach API — net::ERR_CONNECTION_REFUSED"

- Running locally outside Docker: ensure the backend is running on port 5000
- Running in Docker: `VITE_API_URL` in `docker-compose.yml` is set to `http://localhost:5000/api/v1` — the browser accesses this directly, so the backend port must be exposed (it is, via `ports: "5000:5000"`)

### JWT "invalid signature" errors after rotating secrets

Rotating `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` in Render invalidates **all existing tokens**. All users will be logged out on their next request (which is the correct secure behavior). Inform users before rotating secrets in production.

### Images not uploading to Cloudinary

- Verify all three Cloudinary env vars are set correctly
- Check that `multer-storage-cloudinary` version is compatible with `cloudinary` v2 (`multer-storage-cloudinary@4.x` supports cloudinary v2)
- Cloudinary free plan has a 25-credit monthly quota — check your usage in the Cloudinary dashboard

---

## Architecture Diagram

```
                    ┌─────────────────────────────────┐
                    │          End Users               │
                    └───────────────┬─────────────────┘
                                    │ HTTPS
                    ┌───────────────▼─────────────────┐
                    │         Vercel CDN               │
                    │   React/Vite SPA (static files)  │
                    └───────────────┬─────────────────┘
                                    │ HTTPS /api/v1/*
                    ┌───────────────▼─────────────────┐
                    │       Render (Node.js)           │
                    │     Express REST API             │
                    │  ┌──────────────────────────┐   │
                    │  │ Auth / Products / Orders  │   │
                    │  │ Cart / Reviews / Wishlist │   │
                    │  └──────────┬───────────────┘   │
                    └─────────────┼───────────────────┘
                                  │
              ┌───────────────────┼──────────────────────┐
              │                   │                      │
┌─────────────▼──────┐  ┌─────────▼──────┐  ┌──────────▼──────┐
│   MongoDB Atlas     │  │    Stripe      │  │   Cloudinary    │
│  (Database + TTL   │  │  (Payments +   │  │  (Image CDN +   │
│   Indexes)         │  │   Webhooks)    │  │   Storage)      │
└────────────────────┘  └────────────────┘  └─────────────────┘
```

---

*Last updated: Phase 6 complete. For questions or issues, open a GitHub Issue.*
