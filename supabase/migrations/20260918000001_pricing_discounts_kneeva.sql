-- Discount fields for service_pricing + Kneeva service + backfill NULL membership sessions

-- 1. Fix NULL sessions_remaining on older membership rows
UPDATE memberships
SET sessions_remaining = sessions_total - sessions_used
WHERE sessions_remaining IS NULL;

-- 2. Add discount columns to service_pricing
ALTER TABLE service_pricing
  ADD COLUMN IF NOT EXISTS original_price INTEGER,
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discounted_price INTEGER,
  ADD COLUMN IF NOT EXISTS discount_label TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

UPDATE service_pricing SET original_price = price WHERE original_price IS NULL;

-- 3. Add Kneeva service
INSERT INTO service_pricing (service_type, name, duration, price, is_active)
VALUES ('kneeva', 'Kneeva — Knee & Shoulder Recovery', '20 min', 799, true)
ON CONFLICT (service_type) DO UPDATE
SET name = EXCLUDED.name, price = EXCLUDED.price, is_active = true;
