ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS type      text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS active    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS image_url  text,
  ADD COLUMN IF NOT EXISTS cta_label  text,
  ADD COLUMN IF NOT EXISTS cta_url    text,
  ADD COLUMN IF NOT EXISTS cta_type   text NOT NULL DEFAULT 'link';
