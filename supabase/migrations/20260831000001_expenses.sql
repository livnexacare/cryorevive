-- Studio expenses tracker (shown in the admin Revenue tab)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  -- rent | electricity | utilities | salary | equipment | marketing
  -- | maintenance | supplies | other
  subcategory TEXT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,            -- expense value in INR
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN DEFAULT false,
  recurring_day INTEGER,             -- day of month for recurring expenses
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Bookings revenue column (no-op if the 20260829 migration already ran)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;
