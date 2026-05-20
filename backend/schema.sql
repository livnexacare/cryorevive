-- CryoRevive database schema
-- Run once in Supabase SQL editor (Dashboard > SQL Editor > New query)

-- ── Bookings ──────────────────────────────────────────────────────────────────
create table if not exists bookings (
  id               uuid primary key default gen_random_uuid(),
  booking_id       text unique not null,
  name             text not null,
  email            text not null,
  phone            text not null default '',
  service_type     text not null,   -- ice_bath | steam_sauna | contrast_therapy | mobile_unit
  date             text not null,   -- YYYY-MM-DD
  time_slot        text not null,   -- HH:MM
  notes            text not null default '',
  status           text not null default 'pending',  -- pending | confirmed | cancelled | completed
  created_at       timestamptz not null default now()
);
create index if not exists idx_bookings_email       on bookings(email);
create index if not exists idx_bookings_date        on bookings(date);
create index if not exists idx_bookings_status      on bookings(status);
create index if not exists idx_bookings_date_svc    on bookings(date, service_type);

-- ── Payments ──────────────────────────────────────────────────────────────────
create table if not exists payments (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            text not null references bookings(booking_id) on delete cascade,
  razorpay_order_id     text unique not null,
  razorpay_payment_id   text,
  amount                integer not null,   -- paise
  currency              text not null default 'INR',
  status                text not null default 'created',  -- created | captured | failed
  created_at            timestamptz not null default now()
);
create index if not exists idx_payments_booking_id       on payments(booking_id);
create index if not exists idx_payments_razorpay_order   on payments(razorpay_order_id);

-- ── Contacts ──────────────────────────────────────────────────────────────────
create table if not exists contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ── Blog posts ────────────────────────────────────────────────────────────────
create table if not exists blog_posts (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text unique not null,
  content    text not null,
  excerpt    text not null default '',
  image_url  text not null default '',
  published  boolean not null default true,
  tags       jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_blog_posts_slug      on blog_posts(slug);
create index if not exists idx_blog_posts_published on blog_posts(published);
