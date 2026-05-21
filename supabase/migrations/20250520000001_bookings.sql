create table bookings (
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

create index idx_bookings_email       on bookings(email);
create index idx_bookings_date        on bookings(date);
create index idx_bookings_status      on bookings(status);
create index idx_bookings_date_svc    on bookings(date, service_type);
create index idx_bookings_rz_order    on bookings(razorpay_order_id);
