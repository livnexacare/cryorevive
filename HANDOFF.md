# CryoRevive — Project Handoff Document

## Overview
- **Product:** CryoRevive — Premium cold therapy & sauna wellness brand
- **Type:** Full-stack web application + PWA
- **Owner:** LivnexaCare (github.com/livnexacare)
- **Domain:** https://www.cryorevive.in
- **Last Updated:** 2026-06-03

---

## 1. Live URLs

| Service | URL | Status |
|---|---|---|
| Frontend | https://www.cryorevive.in | ✅ LIVE |
| Backend API | https://cryorevive.onrender.com | ✅ LIVE |
| Swagger Docs | https://cryorevive.onrender.com/docs | ✅ LIVE |
| Admin Panel | https://www.cryorevive.in/admin | ✅ Working |
| Supabase | https://supabase.com/dashboard/project/uucwftoqbjtljqaagjel | ✅ LIVE |
| GitHub | https://github.com/livnexacare/cryorevive | main branch |
| Linear | https://linear.app/livnexacare | CryoRevive project |

---

## 2. Tech Stack

### Frontend
| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (Pages Router) | |
| Language | TypeScript strict | |
| Styling | Tailwind CSS | |
| UI Components | shadcn/ui | |
| Hosting | Vercel | livnexacare's projects team |
| PWA | next-pwa | Install prompt, auto-update, service worker |
| Push Notifications | Web Push API + VAPID | pywebpush backend |
| Date handling | date-fns | Booking validations |
| Auth | Supabase Auth | Email signup/login |

### Backend
| Layer | Technology | Notes |
|---|---|---|
| Framework | FastAPI | Python 3.11 |
| Server | Uvicorn | |
| Hosting | Render | Free tier, Python runtime |
| DB Driver | asyncpg | Supabase pooler port 6543 |

### Infrastructure
| Service | Purpose | Account | Status |
|---|---|---|---|
| Supabase | PostgreSQL | CryoRevive separate account | ✅ Active |
| Cloudflare R2 | Image/file storage | livnexacare | ✅ Active |
| Resend | Email (cryorevive.in verified) | livnexacare | ✅ Verified |
| cron-job.org | Keep-alive ping | — | ✅ Active |
| GitHub Actions | Backup keep-alive | livnexacare | ✅ Active |
| Razorpay | Payments | livnexacare | ⏳ KYC pending |

---

## 3. Repository Structure

```
cryorevive/
├── src/
│   ├── pages/
│   │   ├── index.tsx              # Homepage — hero + branding images
│   │   ├── services.tsx           # Services with real images
│   │   ├── booking.tsx            # WhatsApp booking — In-Centre + Event tabs
│   │   │                          # Date validations: no past, 2hr buffer, 48hr event
│   │   ├── contact.tsx            # Contact form → WhatsApp
│   │   ├── blog/                  # Blog listing + detail (Supabase)
│   │   ├── testimonials.tsx       # Hardcoded (not wired to DB yet)
│   │   ├── admin/
│   │   │   ├── index.tsx          # Admin login
│   │   │   └── dashboard.tsx      # 3 tabs: Bookings | Announcements | Pricing
│   │   │                          # Auto-refresh every 30s
│   │   └── api/
│   │       └── admin-login.ts     # Server-side auth
│   ├── components/
│   │   ├── Navigation.tsx         # Responsive + bell icon
│   │   ├── Footer.tsx             # Updated number: 8595850920
│   │   ├── Hero.tsx               # cryo-branding-hero.png
│   │   ├── WhatsAppButton.tsx     # Floating button — 8595850920
│   │   ├── InstallPrompt.tsx      # PWA install banner (7-day dismiss)
│   │   ├── UpdateNotification.tsx # SW update toast
│   │   ├── NotificationButton.tsx # Bell icon + push subscribe
│   │   └── AnnouncementPopup.tsx  # Center modal (2s delay, dismissable)
│   └── lib/
│       ├── supabase.ts            # Supabase client
│       ├── api.ts                 # Centralized fetch wrapper
│       ├── services.ts            # Service data (fallback — pricing fetched live)
│       └── pricing.ts             # Pricing fetch utility
├── backend/
│   ├── main.py                    # FastAPI + CORS regex for *.cryorevive.in
│   ├── database.py                # asyncpg pooler port 6543
│   ├── routers/
│   │   ├── bookings.py            # CRUD + date validation + admin routes
│   │   ├── contact.py             # Contact form
│   │   ├── blog.py                # Blog CRUD
│   │   ├── pricing.py             # Service pricing + event pricing + calculator
│   │   ├── notifications.py       # Push subscriptions + announcements
│   │   └── uploads.py             # Cloudflare R2
│   ├── models/                    # Pydantic models
│   └── utils/
│       ├── email.py               # Resend — booking@ and support@cryorevive.in
│       ├── r2_upload.py           # Cloudflare R2
│       └── slots.py               # Available slots logic
├── supabase/migrations/           # SQL migration files
├── worker/index.js                # SW push handler
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── favicon.ico                # CryoRevive favicon
│   ├── icons/                     # PWA icons all sizes
│   ├── cryo-branding-hero.png     # Hero section image
│   ├── cryo-main-image.png        # Below-hero banner
│   └── [service images]           # Ice Bath, Sauna, Contrast, Mobile Unit
├── .github/workflows/
│   └── keep-alive.yml             # GitHub Actions cron every 14 min
├── scripts/
│   └── generate-icons.mjs         # PWA icon generator
└── HANDOFF.md                     # This file
```

---

## 4. Active Branches

| Branch | Purpose | Merge Status |
|---|---|---|
| main | Production — live | — |
| backup/payments-razorpay | Saved Razorpay + Login + Pricing flow | Restore when KYC done |
| feature/pwa-notifications | PWA push notifications | ⏳ Pending merge |
| feature/mobile-polish | Mobile UI improvements | ⏳ Pending merge |
| feature/ui-responsive | UI responsive fixes | ⏳ Pending merge |

---

## 5. Database (Supabase)

- **URL:** https://uucwftoqbjtljqaagjel.supabase.co
- **Region:** ap-south-1 Mumbai
- **Account:** Separate CryoRevive Supabase account (incognito login)
- **CRITICAL:** Always use pooler URL port 6543 NOT 5432

### Tables

| Table | Purpose | RLS |
|---|---|---|
| bookings | Session bookings | anon INSERT, admin GET/PATCH |
| contacts | Contact submissions | anon INSERT |
| blog_posts | Blog content | anon SELECT published only |
| testimonials | Reviews | anon SELECT approved only |
| announcements | Site announcements | anon SELECT active only |
| push_subscriptions | Web push subscribers | anon INSERT |
| service_pricing | Admin-editable prices | anon SELECT active only |
| event_pricing | Event pricing tiers | anon SELECT active only |

---

## 6. Backend API Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | /health | None | Health check + keep-alive target |
| POST | /api/bookings | None | Create booking (validates no past dates, max 90 days) |
| GET | /api/bookings | X-Admin-Key | List all bookings |
| GET | /api/bookings/user | None | Get bookings by email |
| GET | /api/bookings/{id} | X-Admin-Key | Get single booking |
| PATCH | /api/bookings/{id}/status | X-Admin-Key | Update status |
| GET | /api/slots | None | Available time slots |
| POST | /api/contact | None | Contact form |
| GET | /api/blog | None | Published posts |
| GET | /api/blog/{slug} | None | Single post |
| POST | /api/blog | X-Admin-Key | Create post |
| PUT | /api/blog/{slug} | X-Admin-Key | Update post |
| DELETE | /api/blog/{slug} | X-Admin-Key | Delete post |
| POST | /api/upload | None | Upload to R2 |
| POST | /api/test-email | X-Admin-Key | Test both email senders |
| GET | /api/pricing/services | None | Live service prices |
| PATCH | /api/pricing/services/{type} | X-Admin-Key | Update service price |
| GET | /api/pricing/events | None | Event pricing tiers |
| POST | /api/pricing/events | X-Admin-Key | Create event tier |
| PATCH | /api/pricing/events/{id} | X-Admin-Key | Update event tier |
| DELETE | /api/pricing/events/{id} | X-Admin-Key | Delete event tier |
| GET | /api/pricing/calculate | None | Calculate event price |
| POST | /api/notifications/subscribe | None | Save push subscription |
| POST | /api/notifications/send | X-Admin-Key | Send push to all subscribers |
| GET | /api/notifications/announcements | None | Active announcements |
| POST | /api/notifications/announcements | X-Admin-Key | Create announcement |
| PATCH | /api/notifications/announcements/{id} | X-Admin-Key | Update announcement |
| DELETE | /api/notifications/announcements/{id} | X-Admin-Key | Delete announcement |

---

## 7. Environment Variables

### Frontend (Vercel) — cryo-revive-main project
| Variable | Value | Status |
|---|---|---|
| NEXT_PUBLIC_API_URL | https://cryorevive.onrender.com | ✅ Set |
| NEXT_PUBLIC_SUPABASE_URL | https://uucwftoqbjtljqaagjel.supabase.co | ✅ Set |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | sb_publishable_xxx | ✅ Set |
| NEXT_PUBLIC_ADMIN_API_KEY | (same as Render ADMIN_API_KEY) | ✅ Set |
| NEXT_PUBLIC_ADMIN_WHATSAPP | 918595850920 | ✅ Set |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | BXxx... | ⏳ Pending |
| ADMIN_USERNAME | admin | ✅ Set |
| ADMIN_PASSWORD | (set on Vercel) | ✅ Set |
| RAZORPAY_KEY_ID | — | ⏳ KYC pending |
| RAZORPAY_KEY_SECRET | — | ⏳ KYC pending |

### Backend (Render) — cryorevive-api service
| Variable | Value | Status |
|---|---|---|
| SUPABASE_URL | https://uucwftoqbjtljqaagjel.supabase.co | ✅ Set |
| SUPABASE_PUBLISHABLE_KEY | sb_publishable_xxx | ✅ Set |
| SUPABASE_SECRET_KEY | eyJ...service_role | ✅ Set |
| DATABASE_URL | postgresql://...pooler...:6543/postgres | ✅ Set (port 6543) |
| ADMIN_API_KEY | (must match Vercel NEXT_PUBLIC_ADMIN_API_KEY) | ✅ Set |
| ADMIN_USERNAME | (must match Vercel) | ✅ Set |
| ADMIN_PASSWORD | (must match Vercel) | ✅ Set |
| ADMIN_EMAIL | admin@livnexacare.com | ✅ Set |
| RESEND_API_KEY | re_xxx | ✅ Set |
| BOOKING_EMAIL_FROM | CryoRevive Bookings \<booking@cryorevive.in\> | ✅ Set |
| SUPPORT_EMAIL_FROM | CryoRevive Support \<support@cryorevive.in\> | ✅ Set |
| SUPPORT_DEST_EMAIL | support@cryorevive.in | ✅ Set |
| R2_ACCOUNT_ID | xxx | ✅ Set |
| R2_ACCESS_KEY_ID | xxx | ✅ Set |
| R2_SECRET_ACCESS_KEY | xxx | ✅ Set |
| R2_BUCKET_NAME | cryorevive-media | ✅ Set |
| R2_PUBLIC_URL | https://pub-xxx.r2.dev | ✅ Set |
| ALLOWED_ORIGINS | https://cryorevive.in,https://www.cryorevive.in,https://cryo-revive-main.vercel.app,http://localhost:3000 | ✅ Set |
| WHATSAPP_NOTIFY_NUMBERS | 918595850920 | ✅ Set |
| VAPID_PUBLIC_KEY | — | ⏳ Pending |
| VAPID_PRIVATE_KEY | — | ⏳ Pending |
| RAZORPAY_KEY_ID | — | ⏳ KYC pending |
| RAZORPAY_KEY_SECRET | — | ⏳ KYC pending |
| RAZORPAY_WEBHOOK_SECRET | — | ⏳ KYC pending |

### Variables That MUST Match Between Vercel and Render
| Vercel | Render | Must Be Identical |
|---|---|---|
| NEXT_PUBLIC_ADMIN_API_KEY | ADMIN_API_KEY | ✅ Same value |
| ADMIN_USERNAME | ADMIN_USERNAME | ✅ Same value |
| ADMIN_PASSWORD | ADMIN_PASSWORD | ✅ Same value |

---

## 8. Booking Flow

### In-Centre Session
```
User visits /booking
→ Selects In-Centre Sessions tab
→ Picks service (Ice Bath / Steam Sauna / Contrast Therapy / Cryo Chamber)
→ Picks date (min: today, max: 30 days)
   Today: only shows slots 2+ hours from now
   Past dates: blocked
→ Picks available time slot
→ Fills Name + WhatsApp number
→ Backend saves to Supabase bookings table
   (rejects past dates or dates > 90 days — HTTP 400)
→ WhatsApp opens with pre-filled message to 8595850920
→ Admin confirms via WhatsApp
→ Confirmation email sent from booking@cryorevive.in
```

### Mobile Event Booking
```
User visits /booking → Mobile Event Booking tab
→ Fills event details
→ Date validation: minimum 48 hours from now
→ WhatsApp opens with event details to 8595850920
→ Admin contacts organizer to confirm + quote
```

---

## 9. Email Configuration

- **Provider:** Resend (resend.com)
- **Domain:** cryorevive.in ✅ Verified
- **Region:** Tokyo (ap-northeast-1)

| Sender | Used For | Status |
|---|---|---|
| booking@cryorevive.in | Booking confirmations + admin alerts | ✅ Active |
| support@cryorevive.in | Support queries + auto-replies | ✅ Active |
| onboarding@resend.dev | Fallback if domain issues | ✅ Fallback |

Admin receives all notifications at: admin@livnexacare.com

---

## 10. Keep-Alive System

Render free tier hibernates after 15 min inactivity → 50s cold start.

| Service | URL | Frequency | Status |
|---|---|---|---|
| cron-job.org | /health | Every 10 min | ✅ Active |
| GitHub Actions | /health | Every 14 min | ✅ Active |

Dashboard: https://console.cron-job.org

---

## 11. PWA Configuration

- **Install prompt:** Shows after 3s on first visit, 7-day dismiss
- **Auto-update:** Shows toast when new version deployed
- **Announcement popup:** Shows 2s after load, center modal
- **Push notifications:** Bell icon in nav — VAPID keys pending
- **Favicon:** CryoRevive logo in browser tab
- **Manifest:** /public/manifest.json
- **Icons:** /public/icons/ (all PWA sizes)

---

## 12. Admin Panel

Access: https://www.cryorevive.in/admin  
Mobile: Type URL directly → login → add to home screen

| Tab | Features | Status |
|---|---|---|
| Bookings | List all, filter by status/date, confirm/cancel, auto-refresh 30s | ✅ Working |
| Announcements | Create, send push notification, deactivate | ✅ Working |
| Pricing | Edit service prices, event tiers, calculator | ✅ Working |

---

## 13. Feature Status

| Feature | Status | Notes |
|---|---|---|
| Homepage | ✅ DONE | cryo-branding-hero in hero, cryo-main-image in banner |
| Services page | ✅ DONE | Real images for all services |
| In-Centre Booking | ✅ DONE | WhatsApp + date validations |
| Event Booking | ✅ DONE | 48hr minimum validation |
| Contact form | ✅ DONE | WhatsApp flow |
| Blog listing | ✅ DONE | Supabase |
| Blog detail | ✅ DONE | Supabase |
| Testimonials | 🟡 PARTIAL | Hardcoded — not wired to DB |
| Admin login | ✅ DONE | Fixed 2026-05-30 |
| Admin bookings | ✅ DONE | Auto-refresh 30s |
| Admin announcements | ✅ DONE | With push send |
| Admin pricing | ✅ DONE | Saves to Supabase |
| Price changes live | ✅ DONE | /pricing, /booking, homepage all fetch from Supabase |
| Email booking confirm | ✅ DONE | booking@cryorevive.in |
| Email support reply | ✅ DONE | support@cryorevive.in |
| Image upload | ✅ DONE | Cloudflare R2 |
| PWA install | ✅ DONE | iOS + Android |
| Auto-update toast | ✅ DONE | SW update detection |
| Push notifications | 🟡 PARTIAL | VAPID keys needed |
| Announcement popup | ✅ DONE | Center modal |
| WhatsApp float button | ✅ DONE | 8595850920 |
| Mobile responsive | ✅ DONE | App-like layout |
| Keep-alive cron | ✅ DONE | cron-job.org + GitHub Actions |
| Supabase Auth | ✅ DONE | Email login |
| Google OAuth | ⏳ PENDING | Supabase config needed |
| Payment integration | ⏳ PENDING | Razorpay KYC in progress |
| Custom domain | ✅ DONE | cryorevive.in |
| Favicon | ✅ DONE | CryoRevive logo |
| Date validations | ✅ DONE | No past, 2hr buffer today, 48hr event minimum |
| SEO meta tags | ⏳ PENDING | Default titles not updated |

---

## 14. Pending Tasks

### 🔴 Urgent
- [ ] Set VAPID keys → enable push notifications
- [ ] Merge feature/pwa-notifications to main

### 🟠 High Priority
- [ ] Merge feature/mobile-polish to main
- [ ] Merge feature/ui-responsive to main
- [ ] Fix SEO meta tags on all pages
- [ ] Add Razorpay keys when KYC approved

### 🟡 Medium Priority
- [ ] Employee login (view schedule, mark arrived/no-show)
- [ ] Enable Google OAuth in Supabase
- [ ] Wire testimonials to Supabase
- [ ] Blog image upload in admin panel
- [ ] Sitemap.xml + robots.txt

### 🔵 Low Priority
- [ ] Analytics (Google Analytics or Plausible)
- [ ] Cookie consent banner
- [ ] Customer login (low priority)
- [ ] Secret admin gesture on PWA (tap copyright 5x)
- [ ] Telegram bot for team notifications

---

## 15. Bugs & Incidents Log

| Date | Issue | Root Cause | Fix | Status |
|---|---|---|---|---|
| 2026-05-21 | Booking emails crashing | booking_id KeyError in email.py | Replaced with id | ✅ Fixed |
| 2026-05-21 | Render not starting | PORT hardcoded in Dockerfile | Use $PORT | ✅ Fixed |
| 2026-05-21 | Frontend not calling backend | Wrong API URL, never referenced | Created api.ts | ✅ Fixed |
| 2026-05-21 | DB connection failing | Render IPv4 only, Supabase direct = IPv6 | Switched to pooler port 6543 | ✅ Fixed |
| 2026-05-21 | Date type error | Pydantic date typed as str | Changed to datetime.date | ✅ Fixed |
| 2026-05-22 | Admin login broken | Unknown password on Vercel | Reset ADMIN_PASSWORD | ✅ Fixed |
| 2026-05-24 | CORS blocking previews | Preview URL not in ALLOWED_ORIGINS | Added regex for *.vercel.app | ✅ Fixed |
| 2026-05-26 | Emails not sending | Unverified domain as FROM | Switched to onboarding@resend.dev | ✅ Fixed |
| 2026-05-26 | Render 503 cold start | Backend hibernating | cron-job.org keep-alive | ✅ Fixed |
| 2026-05-29 | Hero image broken | cryo-main-image.png not committed | Committed + fixed path | ✅ Fixed |
| 2026-05-30 | CORS on cryorevive.in | www.cryorevive.in not in ALLOWED_ORIGINS | Added both variants | ✅ Fixed |
| 2026-05-30 | Admin login 401 | Credentials mismatch Vercel vs Render | Synced env vars | ✅ Fixed |
| 2026-05-30 | Price changes not live | Frontend reads hardcoded services.ts | Added getServerSideProps on all pages | ✅ Fixed |
| 2026-06-01 | Bookings not saving to DB | WhatsApp opens before fetch completes | Await fetch before redirect | ✅ Fixed |
| 2026-06-03 | Past date bookings possible | No frontend/backend validation | Added date-fns validations + backend 400 | ✅ Fixed |

---

## 16. Local Development

### Frontend
```bash
cd E:\SaasCode\CryoRevive\cryo-revive-main
npm install
cp .env.example .env.local
# Fill .env.local with real values
npm run dev
# http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill .env with real values
uvicorn main:app --reload
# http://localhost:8000/docs
```

### When Payment KYC Approved
```bash
git checkout backup/payments-razorpay
git checkout -b feature/razorpay-integration
# Add keys, test in test mode, merge to main
```

---

## 17. Key Accounts

| Service | Account | Notes |
|---|---|---|
| GitHub | livnexacare org | Main repo |
| Vercel | livnexacare's projects (Hobby) | Frontend |
| Render | Connected to livnexacare GitHub | Backend |
| Supabase | Separate CryoRevive account | Incognito login |
| Cloudflare | livnexacare | R2 storage |
| Resend | livnexacare | cryorevive.in verified |
| cron-job.org | — | Keep-alive |
| Linear | LivnexaLabs team | CryoRevive project |
| Razorpay | livnexacare | KYC pending |

---

*Always update this document after major features or infrastructure changes.*
