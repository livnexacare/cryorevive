-- Monthly package / membership tracker
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_mobile TEXT NOT NULL,
  package_type TEXT NOT NULL, -- starter | athlete | elite | custom
  package_name TEXT NOT NULL,
  sessions_total INTEGER NOT NULL,   -- total sessions in package
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER,
  price_paid INTEGER NOT NULL,       -- total package price in INR
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',      -- active | expired | paused | cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_client ON memberships(client_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Session usage log
CREATE TABLE IF NOT EXISTS membership_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  used_on DATE NOT NULL DEFAULT CURRENT_DATE,
  staff_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_sessions_membership ON membership_sessions(membership_id);

ALTER TABLE membership_sessions ENABLE ROW LEVEL SECURITY;
