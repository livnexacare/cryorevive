-- The admin "Price" field and the discount calculator's "Final Price" field
-- were saved independently, so `price` (what the public site reads) never
-- picked up the discounted value even though `discounted_price` was correct.
-- One-time backfill: make the already-configured discounts go live immediately.
UPDATE service_pricing
SET price = discounted_price
WHERE discounted_price IS NOT NULL
  AND discounted_price > 0
  AND discounted_price <> price;
