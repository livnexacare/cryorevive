-- Store the booking value (INR) so revenue analytics can sum real amounts
-- instead of inferring them from service pricing at report time.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;
