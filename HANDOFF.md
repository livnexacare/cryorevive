# CryoRevive — Project Handoff Document

**Last Updated:** 2026-05-30
**Repo:** https://github.com/livnexacare/cryorevive
**Local Path:** `E:\SaasCode\CryoRevive\cryo-revive-main`

---

## Live URLs

| Service | URL | Status |
|---|---|---|
| Frontend (Vercel) | https://www.cryorevive.in | LIVE |
| Backend (Render) | https://cryorevive.onrender.com | LIVE |
| Backend Swagger | https://cryorevive.onrender.com/docs | LIVE |
| Supabase Dashboard | https://supabase.com/dashboard/project/uucwftoqbjtljqaagjel | LIVE |
| GitHub Repo | https://github.com/livnexacare/cryorevive | main branch |
| Linear Project | https://linear.app/livnexacare/project/cryorevive | Active |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (Pages Router), Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python 3.11), asyncpg, Uvicorn |
| Database | Supabase (PostgreSQL) |
| File Storage | Cloudflare R2 (boto3 S3-compatible) |
| Email | Resend |
| Payments | Razorpay (KYC pending) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render (free tier, Singapore region) |

---

## Backend Deployment Config

**Platform:** Render — `srv-d87j2tf7f7vs73dmg0ag`
**Dashboard:** https://dashboard.render.com/web/srv-d87j2tf7f7vs73dmg0ag

| Setting | Value |
|---|---|
| Runtime | Python 3 (NOT Docker) |
| Root Directory | `backend/` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `python -m uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |
| Region | Singapore |
| Plan | Free |

> **Note:** `$PORT` is required — Render injects the port dynamically at runtime. Hardcoding port 8000 caused all deploys to fail (fixed 2026-05-21).

### Required Backend Environment Variables (set in Render dashboard)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `SENDER_EMAIL` | From address for outgoing emails |
| `ADMIN_EMAIL` | Admin notification recipient |
| `ADMIN_API_KEY` | Secret key for admin-only API routes |
| `FRONTEND_URL` | `https://www.cryorevive.in` |
| `ALLOWED_ORIGINS` | `https://cryorevive.in,https://www.cryorevive.in,https://cryo-revive-main.vercel.app` |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET` | `cryorevive-media` |
| `R2_PUBLIC_URL` | Public URL for R2 bucket |
| `RAZORPAY_KEY_ID` | Razorpay key ID (pending KYC) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret (pending KYC) |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification secret |

---

## Frontend Deployment Config

**Platform:** Vercel — `prj_BeUr0pKPmUUP1Qg0ow3UrBADTUtv`
**Team:** `livnexacares-projects`

### Required Frontend Environment Variables (set in Vercel dashboard)

| Variable | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://cryorevive.onrender.com` | Production, Preview |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_...` | Production (pending KYC) |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | Production (pending KYC) |
| `RAZORPAY_KEY_SECRET` | secret | Production (pending KYC) |
| `ADMIN_USERNAME` | admin username | Production |
| `ADMIN_PASSWORD` | secret | Production |

---

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Homepage | ✅ DONE | cryo-branding-hero in hero, cryo-main-image in banner |
| Services page | ✅ DONE | New service images added |
| Booking — In-Centre | ✅ DONE | WhatsApp flow |
| Booking — Mobile Event | ✅ DONE | Separate tab |
| Contact form | ✅ DONE | WhatsApp + backend |
| Blog listing | ✅ DONE | Supabase |
| Blog detail | ✅ DONE | Supabase |
| Testimonials | 🟡 PARTIAL | Hardcoded |
| Admin login | ✅ DONE | Fixed 2026-05-30 |
| Admin — Bookings | ✅ DONE | Full CRUD + status |
| Admin — Announcements | ✅ DONE | Create, send push, deactivate |
| Admin — Pricing | ✅ DONE | Service prices + event calculator |
| Price changes live | 🔴 BROKEN | Admin saves to Supabase but frontend reads hardcoded services.ts |
| Email — Booking confirmation | ✅ DONE | booking@cryorevive.in (after domain verify) |
| Email — Support auto-reply | ✅ DONE | support@cryorevive.in |
| Email — Admin notification | ✅ DONE | admin@livnexacare.com |
| Image upload | ✅ DONE | Cloudflare R2 |
| PWA install | ✅ DONE | Android + iOS prompt |
| Auto-update notification | ✅ DONE | SW update toast |
| Push notifications | 🟡 PARTIAL | VAPID keys pending |
| Announcement popup | ✅ DONE | Center modal |
| Floating WhatsApp button | ✅ DONE | All pages |
| Mobile responsive | ✅ DONE | App-like feel |
| Keep-alive cron | ✅ DONE | cron-job.org every 10 min → /health |
| Supabase Auth | ✅ DONE | Email signup/login |
| Google OAuth | ⏳ PENDING | Supabase config needed |
| Payment integration | ⏳ PENDING | Razorpay KYC in progress |
| Custom domain | ✅ DONE | cryorevive.in live on Vercel |
| SEO meta tags | ⏳ PENDING | LIV-45 |

---

## Active Branches

| Branch | Purpose | Status |
|---|---|---|
| main | Production | Live |
| backup/payments-razorpay | Old main with Razorpay + Login + Pricing | Saved for later |
| feature/pwa-notifications | PWA + push notifications | Pending merge |
| feature/mobile-polish | Mobile UI improvements | Pending merge |
| feature/ui-responsive | UI responsive fixes | Pending merge |

---

## Frontend API Integration

All frontend API calls go through `src/lib/api.ts` — a centralized fetch wrapper.

**Base URL:** `process.env.NEXT_PUBLIC_API_URL` (must be set in Vercel env vars)
**Correct value:** `https://cryorevive.onrender.com`

| Frontend Page | Backend Route | Status |
|---|---|---|
| /booking | GET /api/slots, POST /api/bookings | ✅ Connected |
| /contact | POST /api/contact | ✅ Connected |
| /blog | GET /api/blog | ✅ Connected |
| /blog/[slug] | GET /api/blog/{slug} | ✅ Connected |
| /admin | POST /api/admin-login (Next.js route) | ✅ Connected |
| /admin/dashboard | GET /api/bookings (not built yet) | ❌ Not connected |
| /account | GET /api/bookings?email=xxx (not built yet) | ❌ Not connected |

### Blog Fallback Behaviour
Blog index and detail pages fall back to 6 hardcoded articles when the backend returns empty (i.e., no posts in the DB yet). Once blog posts are added via the admin API, the live DB content takes over automatically.

---

## Backend API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |
| POST | `/api/bookings` | None | Create booking |
| GET | `/api/slots` | None | Available slots for date + service |
| POST | `/api/contact` | None | Contact form submission |
| GET | `/api/blog` | None | List published blog posts |
| GET | `/api/blog/{slug}` | None | Get single blog post |
| POST | `/api/blog` | X-Admin-Key | Create blog post |
| PUT | `/api/blog/{slug}` | X-Admin-Key | Update blog post |
| DELETE | `/api/blog/{slug}` | X-Admin-Key | Delete blog post |
| POST | `/api/payments/initiate` | None | Create Razorpay order |
| POST | `/api/payments/webhook` | HMAC | Razorpay webhook handler |
| POST | `/api/upload` | X-Admin-Key | Upload file to R2 |

---

## Database Schema (Supabase)

Three tables — see `backend/schema.sql` for full DDL and `backend/supabase/migrations/` for migration files.

- **bookings** — id (uuid), name, email, phone, service_type, date, time_slot, notes, status, payment_status, razorpay_order_id, razorpay_payment_id, created_at
- **contacts** — id (uuid), name, email, message, created_at
- **blog_posts** — id (uuid), title, slug, content, excerpt, cover_image_url, published, created_at, updated_at

---

## Known Bugs

### 🔴 Active Bugs

- **LIV-40** — `NEXT_PUBLIC_RAZORPAY_KEY_ID` missing from Vercel env vars — Razorpay modal opens with `key: undefined`
- **LIV-44** — User login/signup uses plaintext localStorage (security risk — needs Supabase Auth)

### ⏳ Pending

- **LIV-40** — Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to Vercel when Razorpay KYC approved

### ✅ Fixed

- **LIV-39** — `booking_id` KeyError in `email.py` → fixed (replaced with `id`, 6 occurrences)
- **LIV-41** — Frontend not calling backend → fixed (wired all pages via `src/lib/api.ts`)
- **LIV-42** — Booking page was Calendly stub → fixed (real form built with slots API)
- **LIV-43** — Blog pages hardcoded → fixed (wired to GET /api/blog and GET /api/blog/{slug})

---

## Bugs & Incidents Log

| Date | Issue | Root Cause | Fix | Status |
|---|---|---|---|---|
| 2026-05-21 | All booking emails crashing silently | `booking_id` KeyError — DB column is `id` | Replaced 6 occurrences in `email.py` | ✅ Fixed |
| 2026-05-21 | Render backend not starting | `$PORT` hardcoded in Dockerfile instead of using Render's dynamic port | Changed CMD to use `$PORT` env var | ✅ Fixed |
| 2026-05-21 | Frontend not connected to backend | `NEXT_PUBLIC_API_URL` wrong URL + never referenced in code | Created `src/lib/api.ts`, wired all pages | ✅ Fixed |
| 2026-05-21 | Razorpay modal opens with `key: undefined` | `NEXT_PUBLIC_RAZORPAY_KEY_ID` missing from Vercel env vars | Pending — add when KYC approved | ⏳ Pending |
| 2026-05-26 | Admin login 401 | ALLOWED_ORIGINS missing cryorevive.in | Added to Render ALLOWED_ORIGINS + CORS regex | ✅ Fixed |
| 2026-05-26 | CORS blocking cryorevive.in | www.cryorevive.in not in ALLOWED_ORIGINS | Added both cryorevive.in and www.cryorevive.in | ✅ Fixed |
| 2026-05-26 | Emails not sending | FROM address using unverified domain | Switched to onboarding@resend.dev fallback | ✅ Fixed |
| 2026-05-26 | Render 503 cold start | Backend hibernating | Added cron-job.org every 10 min keep-alive | ✅ Fixed |
| 2026-05-30 | Hero image broken | cryo-main-image.png not committed to git | Committed image + fixed src path | ✅ Fixed |
| 2026-05-30 | Admin login 401 | Credentials mismatch Vercel vs what user types | Fixed | ✅ Fixed |
| 2026-05-30 | Price changes not live | Frontend reads hardcoded services.ts not Supabase | Fix in progress | 🔴 Active |

---

## Pending Tasks

### Urgent
- [x] Fix admin login — 401 credentials mismatch ✅
- [ ] Fix price changes not reflecting on live site (wire frontend to Supabase pricing table)
- [ ] Set VAPID keys → enable push notifications
- [ ] Merge feature/pwa-notifications to main
- [ ] Merge feature/mobile-polish to main

### High Priority
- [ ] Verify cryorevive.in in Resend → enable booking@cryorevive.in sender
- [ ] Add Razorpay keys when KYC approved
- [ ] Enable Google OAuth in Supabase
- [ ] Fix SEO defaults (LIV-45)

### Medium Priority
- [ ] Employee login feature (view today's bookings, mark arrived/no-show)
- [ ] Wire testimonials to Supabase
- [ ] Blog image upload UI in admin panel
- [ ] Add sitemap.xml and robots.txt
- [ ] Secret admin access gesture on mobile PWA (tap copyright 5x)

### Low Priority
- [ ] Analytics (Google Analytics or Plausible)
- [ ] Cookie consent banner
- [ ] Customer login (low priority — WhatsApp handles communication)

---

## Project Structure

```
cryo-revive-main/
├── src/
│   ├── lib/
│   │   ├── api.ts          # Shared API_URL, apiFetch, parseTimeSlot
│   │   └── utils.ts        # cn() utility
│   ├── pages/
│   │   ├── api/            # Next.js API routes (Razorpay, admin-login)
│   │   ├── blog/           # index.tsx, [slug].tsx — wired to backend
│   │   ├── admin/          # index.tsx (login), dashboard.tsx
│   │   ├── booking.tsx     # Real booking form — slots + submit
│   │   ├── contact.tsx     # Event booking + Razorpay payment
│   │   └── ...
│   └── components/
├── backend/
│   ├── main.py             # FastAPI app, CORS, router registration
│   ├── database.py         # asyncpg pool + db_fetch/fetchrow/execute
│   ├── models/             # Pydantic models (booking, blog, contact, payment)
│   ├── routers/            # bookings, blog, contact, payments, uploads
│   ├── utils/              # email.py, r2_upload.py, slots.py
│   ├── schema.sql          # Full DB schema
│   ├── Dockerfile          # python:3.11-slim, uses $PORT
│   ├── render.yaml         # Render deployment config (Python runtime)
│   └── requirements.txt
├── .github/
│   └── workflows/
│       └── keep-alive.yml  # GitHub Actions backup keep-alive (every 14 min)
└── HANDOFF.md              # This file
```

---

## 16. Keep-Alive Cron

Service: cron-job.org (free)
URL pinged: https://cryorevive.onrender.com/health
Frequency: Every 10 minutes
Purpose: Prevent Render free tier cold starts (50s delay)
Status: ✅ Active

Also: GitHub Actions workflow at `.github/workflows/keep-alive.yml`
as backup (every 14 minutes via GitHub cron)

---

## 17. Email Configuration

Provider: Resend (https://resend.com)
Account: livnexacare account

| Email Address | Purpose | Status |
|---|---|---|
| booking@cryorevive.in | Booking confirmations to customers | ⏳ Pending domain verify in Resend |
| support@cryorevive.in | Support queries + auto-replies | ⏳ Pending domain verify in Resend |
| admin@livnexacare.com | Admin notifications (receives all alerts) | ✅ Working |
| onboarding@resend.dev | Fallback sender (no domain needed) | ✅ Working |

To activate cryorevive.in senders:
1. Go to https://resend.com/domains
2. Add cryorevive.in
3. Add DNS records at domain registrar
4. Verify → green ✅
5. Emails automatically send from branded addresses

---

## 18. Cron Jobs

| Service | URL | Schedule | Purpose | Status |
|---|---|---|---|---|
| cron-job.org | /health | Every 10 min | Keep Render awake | ✅ Active |
| GitHub Actions | /health | Every 14 min | Backup keep-alive | ✅ Active |

Dashboard: https://console.cron-job.org
GitHub: `.github/workflows/keep-alive.yml`

---

## 19. Admin Features

Access: https://www.cryorevive.in/admin
Mobile access: Type URL directly in browser, then add to home screen

| Feature | Status | Notes |
|---|---|---|
| Login | ✅ DONE | Fixed 2026-05-30 |
| Bookings list | ✅ DONE | Filter by status/date |
| Confirm/Cancel booking | ✅ DONE | Updates Supabase |
| Announcements CRUD | ✅ DONE | With push notification send |
| Service pricing edit | ✅ DONE | Saves to Supabase |
| Event pricing calculator | ✅ DONE | Base + per athlete + GST |
| Price changes on site | 🔴 BROKEN | Frontend still reads hardcoded values |
