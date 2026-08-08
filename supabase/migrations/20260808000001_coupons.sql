CREATE TABLE IF NOT EXISTS coupons (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text UNIQUE NOT NULL,
  discount_type     text NOT NULL DEFAULT 'percentage',
  discount_value    numeric NOT NULL,
  min_order_value   numeric NOT NULL DEFAULT 0,
  usage_limit       integer,
  usage_count       integer NOT NULL DEFAULT 0,
  expires_at        timestamptz,
  description       text,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
