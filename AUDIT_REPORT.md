# CryoRevive — Full Codebase Audit Report

**Generated:** 2026-05-21  
**Repo:** github.com/livnexacare/cryorevive (main branch)  
**Local path:** `E:\SaasCode\CryoRevive\cryo-revive-main`

---

## 4.1 — Pages Inventory

| Route | File | Purpose | State | Working | Missing / Hardcoded |
|---|---|---|---|---|---|
| `/` | `src/pages/index.tsx` | Homepage — hero, benefits, services, testimonials preview | ✅ COMPLETE | All sections render; SEO set | — |
| `/booking` | `src/pages/booking.tsx` | Individual session booking | 🔲 STUB | Layout and phone CTA render | **Calendly embed is a placeholder** — no real booking form, no API call |
| `/contact` | `src/pages/contact.tsx` | Event booking form + Razorpay payment | 🟡 PARTIAL | Razorpay checkout opens; pricing calc works | Saves only to `localStorage("bookings")` — **never calls backend**; uses `NEXT_PUBLIC_RAZORPAY_KEY_ID` which is missing from `.env.example` |
| `/pricing` | `src/pages/pricing.tsx` | Static pricing display | ✅ COMPLETE | All tiers render; CTAs link to `/booking` | Prices are hardcoded (not DB-backed) |
| `/services` | `src/pages/services.tsx` | Service detail pages | ✅ COMPLETE | 4 services with images, descriptions | Service images are local files; not from R2 |
| `/testimonials` | `src/pages/testimonials.tsx` | Testimonials grid | ✅ COMPLETE | 6 hardcoded testimonials render | All data is hardcoded — no DB/API call |
| `/blog` | `src/pages/blog/index.tsx` | Blog listing | 🔲 STUB | 6 hardcoded articles render | **No API call** to backend; data is static |
| `/blog/[slug]` | `src/pages/blog/[slug].tsx` | Blog post detail | 🔲 STUB | Single article template renders | **No dynamic slug lookup**; same article for all slugs |
| `/login` | `src/pages/login.tsx` | User login | ❌ BROKEN | Form renders | Auth is localStorage-only; **passwords stored in plaintext** in browser storage; no backend auth |
| `/signup` | `src/pages/signup.tsx` | User registration | ❌ BROKEN | Form renders; duplicate email check works | Stores password in plaintext in localStorage; no backend persistence |
| `/account` | `src/pages/account.tsx` | User account / booking history | ❌ BROKEN | Profile section renders | Reads bookings from `localStorage("bookings")`; admin reads from `localStorage("event_bookings")` — **key mismatch** |
| `/admin` | `src/pages/admin/index.tsx` | Admin login | ✅ COMPLETE | POSTs to `/api/admin-login` server route | Requires `ADMIN_PASSWORD` env var set on Vercel |
| `/admin/dashboard` | `src/pages/admin/dashboard.tsx` | Booking management + pricing config | ❌ BROKEN | UI renders; pricing edit works | Reads from `localStorage("event_bookings")` — **key mismatch** with what contact.tsx writes; pricing persists only in local browser, not in DB |

---

## 4.2 — Components Inventory

| Component | File | Used On | State | Notes |
|---|---|---|---|---|
| `Navigation` | `src/components/Navigation.tsx` | All pages | ✅ COMPLETE | Auth state via localStorage; mobile menu works |
| `Hero` | `src/components/Hero.tsx` | `/` | ✅ COMPLETE | Two images with `<Image fill>`; stats row |
| `Footer` | `src/components/Footer.tsx` | Most pages | ✅ COMPLETE | Links, contact info, admin link |
| `Benefits` | `src/components/Benefits.tsx` | `/` | ✅ COMPLETE | 3-column static grid |
| `ServicesOverview` | `src/components/ServicesOverview.tsx` | `/` | ✅ COMPLETE | 4-service card grid |
| `TestimonialsPreview` | `src/components/TestimonialsPreview.tsx` | `/` | ✅ COMPLETE | 3 hardcoded testimonials |
| `SEO` | `src/components/SEO.tsx` | All pages | 🟡 PARTIAL | Default title/description is `"Hello World"` / `"Welcome to my app"` — fallback copy not updated |
| `ThemeSwitch` | `src/components/ThemeSwitch.tsx` | Not used | 🔲 STUB | File exists but not imported anywhere |

---

## 4.3 — Frontend API Routes (`src/pages/api/`)

| Route | Method | What it does | External service | State |
|---|---|---|---|---|
| `/api/create-order` | POST | Creates a Razorpay order from `{ amount, currency, receipt }` | Razorpay | ✅ COMPLETE — guards against missing env vars |
| `/api/verify-payment` | POST | Verifies Razorpay HMAC signature from `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | None (crypto only) | ✅ COMPLETE |
| `/api/admin-login` | POST | Checks `{ username, password }` against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars | None | ✅ COMPLETE |
| `/api/hello` | GET | Default Next.js scaffold stub | None | 🔲 STUB — never used |

**Missing env var:** `contact.tsx:92` references `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID` for the Razorpay checkout `key` field. This variable is **not in `.env.example`**. Without it, the Razorpay modal will open with `key: undefined` and payment will silently fail.

---

## 4.4 — Backend API Routes (`backend/routers/`)

| Method + Path | What it does | Table | External | State |
|---|---|---|---|---|
| `POST /api/bookings` | Create session booking with conflict check | `bookings` | Resend (email) | 🟡 PARTIAL — **email will crash** (see §4.9 Bug #1) |
| `GET /api/slots` | Return available time slots for date+service_type | `bookings` | None | ✅ COMPLETE |
| `POST /api/contact` | Save contact message + notify admin | `contacts` | Resend (email) | ✅ COMPLETE |
| `GET /api/blog` | List published blog posts | `blog_posts` | None | ✅ COMPLETE |
| `GET /api/blog/{slug}` | Get single published post by slug | `blog_posts` | None | ✅ COMPLETE |
| `POST /api/blog` | Create new blog post (admin) | `blog_posts` | None | ✅ COMPLETE |
| `PUT /api/blog/{slug}` | Update blog post (admin) | `blog_posts` | None | ✅ COMPLETE |
| `DELETE /api/blog/{slug}` | Delete blog post (admin) | `blog_posts` | None | ✅ COMPLETE |
| `POST /api/payments/initiate` | Create Razorpay order for a booking | `bookings` | Razorpay | ✅ COMPLETE |
| `POST /api/payments/webhook` | Confirm payment, update booking status | `bookings` | Resend (email) | 🟡 PARTIAL — **confirmed email will crash** (see §4.9 Bug #1) |
| `POST /api/upload` | Upload file to Cloudflare R2 (admin) | None | Cloudflare R2 | ✅ COMPLETE |
| `GET /health` | Health check | None | None | ✅ COMPLETE |

---

## 4.5 — Database Tables

### `bookings`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text NOT NULL | |
| `email` | text NOT NULL | |
| `phone` | text NOT NULL | |
| `service_type` | text NOT NULL | ice_bath / steam_sauna / contrast_therapy / mobile_unit |
| `date` | date NOT NULL | |
| `time_slot` | text NOT NULL | HH:MM format (09:00–18:00) |
| `notes` | text | |
| `status` | text | default `'pending'` |
| `payment_status` | text | default `'unpaid'` |
| `razorpay_order_id` | text | |
| `razorpay_payment_id` | text | |
| `created_at` | timestamptz | `now()` |

**Indexes:** email, date, status, (date, service_type), razorpay_order_id  
**RLS:** `anon can insert bookings` (INSERT only; no SELECT policy for anon)  
**Used by frontend:** NOT USED (contact.tsx uses localStorage instead of calling /api/bookings)  
**Used by backend:** `POST /api/bookings`, `GET /api/slots`, `POST /api/payments/initiate`, `POST /api/payments/webhook`

### `contacts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text NOT NULL | |
| `email` | text NOT NULL | |
| `message` | text NOT NULL | |
| `created_at` | timestamptz | `now()` |

**RLS:** `anon can insert contacts`  
**Used by frontend:** Never — contact form on `/contact` does NOT call `POST /api/contact`  
**Used by backend:** `POST /api/contact`

### `blog_posts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `title` | text NOT NULL | |
| `slug` | text UNIQUE NOT NULL | |
| `content` | text NOT NULL | |
| `excerpt` | text | |
| `cover_image_url` | text | |
| `published` | boolean | default `false` |
| `created_at` | timestamptz | `now()` |
| `updated_at` | timestamptz | `now()` |

**Indexes:** slug, published  
**RLS:** `public can read published blogs`  
**Used by frontend:** Never — blog pages use hardcoded static data  
**Used by backend:** Full CRUD via `GET/POST/PUT/DELETE /api/blog`

---

## 4.6 — External Services

| Service | Used For | Frontend | Backend | Keys Configured |
|---|---|---|---|---|
| Supabase | PostgreSQL database | No | Yes (asyncpg) | Not set yet — `DATABASE_URL` not configured on Render |
| Resend | Transactional email | No | Yes | Not set yet — `RESEND_API_KEY` not on Render |
| Cloudflare R2 | File/image storage | No | Yes | Not set yet — 5 R2 vars not on Render |
| Razorpay | Payments (event bookings) | Yes (`/contact`, `/api/create-order`, `/api/verify-payment`) | Yes (`/api/payments/initiate`, `webhook`) | Missing `NEXT_PUBLIC_RAZORPAY_KEY_ID` on Vercel |
| Razorpay JS SDK | Checkout modal | Yes (CDN `<script>` tag in `contact.tsx`) | No | — |

---

## 4.7 — Features Status Summary

| Feature | Frontend | Backend | DB | Status |
|---|---|---|---|---|
| Homepage | ✅ Static | — | — | ✅ DONE |
| Services page | ✅ Static | — | — | ✅ DONE |
| Pricing page | ✅ Static (hardcoded INR amounts) | — | — | ✅ DONE |
| Booking form (individual session) | 🔲 Stub (Calendly placeholder) | ✅ `POST /api/bookings` | ✅ bookings | ❌ BROKEN — form is stub |
| Available slots | ❌ Not wired | ✅ `GET /api/slots` | ✅ bookings | 🟡 PARTIAL — backend ready, frontend not wired |
| Event booking (contact form) | ✅ Form with Razorpay | ❌ Never called | ❌ Saves to localStorage only | ❌ BROKEN — data never persists to DB |
| Contact form (simple inquiry) | ❌ Not present | ✅ `POST /api/contact` | ✅ contacts | ❌ BROKEN — no contact form, backend unused |
| Blog listing | 🔲 Hardcoded static data | ✅ `GET /api/blog` | ✅ blog_posts | 🟡 PARTIAL — backend ready, frontend not wired |
| Blog detail | 🔲 Same article for all slugs | ✅ `GET /api/blog/{slug}` | ✅ blog_posts | 🟡 PARTIAL — backend ready, frontend not wired |
| Blog admin CRUD | ❌ Not present in UI | ✅ Full CRUD with X-Admin-Key | ✅ blog_posts | 🟡 PARTIAL — API ready, no admin UI for blog |
| Testimonials | ✅ Hardcoded 6 items | — | — | 🔲 STUB — no DB backing |
| User login | ✅ Form works | ❌ Not connected | ❌ localStorage only | ❌ BROKEN — plaintext password in localStorage |
| User signup | ✅ Form works | ❌ Not connected | ❌ localStorage only | ❌ BROKEN — plaintext password in localStorage |
| User account | ✅ Renders | ❌ Not connected | ❌ localStorage only | ❌ BROKEN — key mismatch with contact.tsx |
| Admin login | ✅ Server-side auth | ✅ `/api/admin-login` | — | ✅ DONE (needs env var) |
| Admin dashboard | ✅ UI complete | ❌ Not connected to backend | ❌ localStorage only | ❌ BROKEN — key mismatch; pricing not in DB |
| Payment initiate (event) | ✅ `/api/create-order` | ✅ `/api/payments/initiate` | ✅ bookings | ⏳ PENDING — needs Razorpay keys; `NEXT_PUBLIC_RAZORPAY_KEY_ID` missing |
| Payment webhook | — | ✅ HMAC-verified | ✅ bookings | ⏳ PENDING — needs Razorpay webhook secret + Render URL |
| Image upload | ❌ No frontend UI | ✅ `POST /api/upload` | — | 🟡 PARTIAL — R2 backend ready, no UI |
| Email confirmation (booking received) | — | 🟡 Code exists but crashes | — | ❌ BROKEN — KeyError `booking_id` vs `id` |
| Email confirmation (payment confirmed) | — | 🟡 Code exists but crashes | — | ❌ BROKEN — same KeyError |

---

## 4.8 — Environment Variables Audit

### Frontend (`.env.example`)
| Variable | In .env.example | Used in Code | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | ❌ Never referenced in any page | Listed but never called — frontend doesn't hit the backend |
| `RAZORPAY_KEY_ID` | ✅ | ✅ `/api/create-order.ts` | Server-side only — correct |
| `RAZORPAY_KEY_SECRET` | ✅ | ✅ `/api/create-order.ts`, `/api/verify-payment.ts` | Server-side only — correct |
| `ADMIN_USERNAME` | ✅ | ✅ `/api/admin-login.ts` | Server-side only — correct |
| `ADMIN_PASSWORD` | ✅ | ✅ `/api/admin-login.ts` | Server-side only — correct |
| **`NEXT_PUBLIC_RAZORPAY_KEY_ID`** | ❌ **MISSING** | ✅ `contact.tsx:92` | **Client-side key for Razorpay modal — must be NEXT_PUBLIC_** |

### Backend (`backend/.env.example`)
| Variable | In .env.example | Used in Code | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | ✅ `database.py` | Required — backend crashes without it |
| `RESEND_API_KEY` | ✅ | ✅ `utils/email.py` | Optional — emails silently skip if empty |
| `SENDER_EMAIL` | ✅ | ✅ `utils/email.py` | Falls back to `onboarding@resend.dev` |
| `ADMIN_EMAIL` | ✅ | ✅ `utils/email.py` | Falls back to `info@cryorevive.com` |
| `RESEND_FORCE_RECIPIENT` | ✅ | ✅ `utils/email.py` | Dev override — leave blank in prod |
| `ADMIN_API_KEY` | ✅ | ✅ `routers/blog.py`, `routers/uploads.py` | Required for blog/upload admin access |
| `FRONTEND_URL` | ✅ | ❌ Never used in backend code | Listed but never referenced |
| `ALLOWED_ORIGINS` | ✅ | ✅ `main.py` | CORS whitelist |
| `R2_ACCOUNT_ID` | ✅ | ✅ `utils/r2_upload.py` | Required for uploads |
| `R2_ACCESS_KEY_ID` | ✅ | ✅ `utils/r2_upload.py` | Required for uploads |
| `R2_SECRET_KEY` | ✅ | ✅ `utils/r2_upload.py` | Required for uploads |
| `R2_BUCKET` | ✅ | ✅ `utils/r2_upload.py` | Falls back to `cryorevive-media` |
| `R2_PUBLIC_URL` | ✅ | ✅ `utils/r2_upload.py` | Required to return public URLs |
| `RAZORPAY_KEY_ID` | ✅ | ✅ `routers/payments.py` | Required for payment initiation |
| `RAZORPAY_KEY_SECRET` | ✅ | ✅ `routers/payments.py` | Required for payment initiation |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | ✅ `routers/payments.py` | Optional — webhook skips HMAC if empty |

---

## 4.9 — Known Issues & Gaps

### 🔴 Critical Bugs

**Bug #1 — `KeyError: 'booking_id'` in email.py (WILL CRASH)**  
`backend/utils/email.py` lines 47, 89, 112, 114, 121, 138:  
All email templates reference `b['booking_id']` and `booking['booking_id']`.  
But the `bookings` table column is `id`, not `booking_id`.  
When `send_booking_received(booking)` is called in `bookings.py:47`, the dict has key `id`.  
**Result:** Every booking creation raises `KeyError` in the async email task. The error is swallowed silently (async task) so no booking emails are ever sent. Affects: booking received email, payment confirmed email.  
**Fix:** Change all `b['booking_id']` / `booking['booking_id']` references in email.py to `b['id']` / `booking['id']`.

**Bug #2 — `NEXT_PUBLIC_RAZORPAY_KEY_ID` missing from .env.example**  
`src/pages/contact.tsx:92`:
```js
key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
```
This must be a `NEXT_PUBLIC_` prefixed variable to be accessible client-side in Next.js. The `.env.example` only lists `RAZORPAY_KEY_ID` (server-side). Without this, the Razorpay modal opens with `key: undefined` and payment fails silently.  
**Fix:** Add `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...` to `.env.example` and set it on Vercel.

**Bug #3 — localStorage key mismatch across pages**  
- `contact.tsx:118` saves bookings to `localStorage("bookings")`  
- `account.tsx:43` reads from `localStorage("bookings")` ✅ matches  
- `admin/dashboard.tsx:61` reads from `localStorage("event_bookings")` ❌ mismatch  
- `admin/dashboard.tsx:104` saves to `localStorage("event_bookings")`  
**Result:** Admin dashboard always shows 0 bookings from the contact form.  
**Fix:** Unify to one localStorage key, or connect everything to the database.

**Bug #4 — Two disconnected booking systems**  
The backend at `POST /api/bookings` handles individual session bookings (ice bath, sauna, with date and time slot). The frontend at `/contact` handles event/mobile-unit bookings entirely in localStorage. The two systems use different data shapes and never talk to each other.  
No booking from the contact form is ever stored in the Supabase `bookings` table.  
**Fix:** Either wire contact.tsx to call the FastAPI backend, or create a separate event-bookings table and API endpoint.

### 🟡 Security Issues

**Issue #1 — Passwords stored in plaintext in localStorage**  
`signup.tsx:44-50` stores `{ password: formData.password }` in `localStorage("users")`.  
Anyone with DevTools access can read all user credentials.  
**Fix:** Move auth to backend with hashed passwords (bcrypt is already in requirements.txt), or use Supabase Auth.

**Issue #2 — Admin dashboard status updates not persisted to backend**  
`admin/dashboard.tsx:99-105` updates booking status only in localStorage. No `PATCH /api/bookings/:id` endpoint exists. Changes are lost on page refresh and only visible in that browser.  
**Fix:** Add `PATCH /api/bookings/{id}/status` backend endpoint.

### 🔵 Hardcoded Values

| Location | Hardcoded value | Should be |
|---|---|---|
| `booking.tsx:130` | `href="tel:+919876543210"` | Env var or CMS |
| `booking.tsx:131` | WhatsApp URL with `919876543210` | Env var or CMS |
| `contact.tsx:487` | WhatsApp URL with `919891430920` | Config |
| `contact.tsx:534` | `href="tel:+919891430920"` | Config |
| `contact.tsx:551-558` | Email addresses `info@` and `support@cryorevive.in` | Config |
| `utils/email.py:11` | `ADMIN_EMAIL` fallback `info@cryorevive.com` | env var only |
| `SEO.tsx:17,47` | Default title `"Hello World"`, description `"Welcome to my app"` | Brand copy |
| `pricing.tsx` | All prices hardcoded (₹800, ₹700, ₹1400, ₹5999…) | DB or CMS |
| `testimonials.tsx` | 6 hardcoded testimonials | DB |
| `blog/index.tsx` | 6 hardcoded articles | Backend API |
| `blog/[slug].tsx` | Single hardcoded article displayed for all slugs | Backend API |

### 🔵 Missing Features / Pages

- No `POST /api/bookings` call from any frontend page — the session booking backend is completely unused
- No UI to call `GET /api/slots` for slot availability
- No blog admin UI (no page to create/edit/delete posts via the API)
- No file upload UI (no page to call `POST /api/upload`)
- No simple contact/inquiry form (the contact page is exclusively the event booking form)
- `ThemeSwitch.tsx` exists but is imported nowhere
- `FRONTEND_URL` env var is in `backend/.env.example` and `render.yaml` but never used in backend code

### 🔵 console.log / print statements in production

| File | Line | Statement |
|---|---|---|
| `backend/routers/bookings.py` | 43 | `print(f"ERROR create_booking: {e}")` |
| `backend/routers/bookings.py` | 63 | `print(f"ERROR get_slots: {e}")` |
| `backend/routers/blog.py` | 54 | `print(f"ERROR create_post: {e}")` |
| `backend/routers/blog.py` | 86 | `print(f"ERROR update_post: {e}")` |
| `backend/routers/payments.py` | 16 | `print = logger.info` (redirects `print()` to logger — intentional) |
| `src/pages/contact.tsx` | 145, 183 | `console.error(...)` |

Note: backend `print()` calls (except payments.py) use the root `print` which goes to stdout — fine for Render logs.

---

## 4.10 — What To Build Next (Priority Order)

1. **[URGENT] Fix `booking_id` KeyError in `email.py`**  
   All `b['booking_id']` → `b['id']` in `backend/utils/email.py`. One-line changes; currently breaks all booking emails silently.

2. **[URGENT] Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to Vercel env vars and `.env.example`**  
   Required for the Razorpay checkout modal to work. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...` to `.env.example` and set on Vercel.

3. **[HIGH] Fix localStorage key mismatch — unify to `"cryo_bookings"`**  
   Update `contact.tsx`, `account.tsx`, and `admin/dashboard.tsx` to use the same key, OR start persisting to the database instead.

4. **[HIGH] Wire `contact.tsx` to backend**  
   After form + payment success, POST the booking to `NEXT_PUBLIC_API_URL/api/bookings` (or a new event endpoint) so it persists to Supabase. Currently the entire booking flow is localStorage-only.

5. **[HIGH] Replace `booking.tsx` Calendly stub with a real booking form**  
   Build a form that calls `GET /api/slots` for availability, then `POST /api/bookings` to create a session. The backend is fully ready; the frontend is a stub.

6. **[MEDIUM] Wire blog pages to backend API**  
   Replace hardcoded articles in `blog/index.tsx` and `blog/[slug].tsx` with calls to `GET /api/blog` and `GET /api/blog/{slug}`. Use `getStaticProps` / `getServerSideProps` for SSR/SSG.

7. **[MEDIUM] Add `PATCH /api/bookings/{id}/status` backend endpoint**  
   Wire admin dashboard status changes to the database. Currently admin status updates only persist in the admin's browser.

8. **[MEDIUM] Replace localStorage auth with Supabase Auth**  
   Passwords are currently stored in plaintext in browser localStorage. Use Supabase's built-in auth (email/password) or at minimum move user creation to the backend using the existing bcrypt dependency.

9. **[MEDIUM] Fix SEO.tsx default copy**  
   Change default `title` from `"Hello World"` to `"CryoRevive — Elite Recovery"` and update default `description` to actual brand copy.

10. **[LOW] Wire testimonials to database, add blog admin UI**  
    Create a `testimonials` table and admin pages to manage content without code changes. Add a `/admin/blog` page that uses the existing blog CRUD API.

---

## Summary

The CryoRevive codebase has a well-architected FastAPI backend with 12 routes covering all intended functionality, and a polished Next.js frontend. However, **the frontend and backend are not connected** for the core user flows:

- The booking form (`/booking`) is a stub pointing to Calendly
- The event booking form (`/contact`) runs entirely in localStorage and never calls the backend
- User auth is localStorage-only with plaintext passwords
- Blog pages show hardcoded content
- There is one critical crash bug in email.py that silently kills all confirmation emails

The backend is production-ready and just needs `DATABASE_URL` configured. The frontend needs the localStorage → backend API wiring done for bookings, auth, and blog content to make the application functional end-to-end.
