-- Staff payroll table
CREATE TABLE IF NOT EXISTS staff_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_accounts(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  pay_type TEXT NOT NULL DEFAULT 'daily', -- daily | monthly
  daily_wage INTEGER,          -- in INR, if daily
  monthly_salary INTEGER,      -- in INR, if monthly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days_worked INTEGER DEFAULT 0,
  total_amount INTEGER DEFAULT 0,
  amount_paid INTEGER DEFAULT 0,
  amount_pending INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_staff_payroll_staff ON staff_payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_period ON staff_payroll(period_start);

-- Staff attendance table
CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'present', -- present | absent | half_day | leave
  check_in TIME,
  check_out TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, date)
);

ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(date);
