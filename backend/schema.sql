-- CryoRevive DB schema — run once in Supabase SQL editor

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  user_id       text unique not null,
  email         text unique not null,
  name          text not null default '',
  role          text not null default 'customer',
  password_hash text,
  picture       text,
  auth_provider text not null default 'password',
  created_at    timestamptz not null default now()
);

create table if not exists user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references users(user_id) on delete cascade,
  session_token text unique not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_user_sessions_token on user_sessions(session_token);

create table if not exists password_reset_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token      text unique not null,
  expires_at timestamptz not null,
  used       boolean not null default false
);

create table if not exists bookings (
  id               uuid primary key default gen_random_uuid(),
  booking_id       text unique not null,
  service          text not null,           -- ice_bath | steam_sauna | contrast_therapy | mobile_unit
  date             text not null,           -- YYYY-MM-DD
  time_slot        text not null,           -- HH:MM
  duration_minutes integer not null default 30,
  guests           integer not null default 1,
  name             text not null,
  email            text not null,
  phone            text not null default '',
  notes            text not null default '',
  status           text not null default 'pending',  -- pending | confirmed | cancelled | completed
  created_at       timestamptz not null default now()
);
create index if not exists idx_bookings_email  on bookings(email);
create index if not exists idx_bookings_date   on bookings(date);
create index if not exists idx_bookings_status on bookings(status);

create table if not exists contact_queries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text not null default '',
  subject    text not null default '',
  message    text not null,
  email_sent boolean not null default false,
  email_id   text,
  created_at timestamptz not null default now()
);
