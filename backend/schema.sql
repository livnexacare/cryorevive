-- CryoRevive — consolidated schema
-- Same content as supabase/migrations/*.sql combined.
-- Run in Supabase SQL editor if you prefer a single-file approach.

create table if not exists bookings (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text not null,
  phone                text not null,
  service_type         text not null,
  date                 date not null,
  time_slot            text not null,
  notes                text,
  status               text default 'pending',
  payment_status       text default 'unpaid',
  razorpay_order_id    text,
  razorpay_payment_id  text,
  created_at           timestamptz default now()
);
create index if not exists idx_bookings_email    on bookings(email);
create index if not exists idx_bookings_date     on bookings(date);
create index if not exists idx_bookings_status   on bookings(status);
create index if not exists idx_bookings_date_svc on bookings(date, service_type);
create index if not exists idx_bookings_rz_order on bookings(razorpay_order_id);

create table if not exists contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz default now()
);

create table if not exists blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  content         text not null,
  excerpt         text,
  cover_image_url text,
  published       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_blog_posts_slug      on blog_posts(slug);
create index if not exists idx_blog_posts_published on blog_posts(published);
