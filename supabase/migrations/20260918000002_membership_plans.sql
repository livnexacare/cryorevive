-- Editable monthly membership plan pricing (replaces hardcoded pricing.tsx values)
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT UNIQUE NOT NULL, -- starter | athlete | elite
  name TEXT NOT NULL,
  sessions_per_month INTEGER NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

INSERT INTO membership_plans (plan_type, name, sessions_per_month, price, original_price, is_featured)
VALUES
  ('starter', 'Starter', 8, 5999, 14999, false),
  ('athlete', 'Athlete', 16, 9999, 24999, true),
  ('elite', 'Elite', 30, 15999, 39999, false)
ON CONFLICT (plan_type) DO NOTHING;
