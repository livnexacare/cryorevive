-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint    text UNIQUE NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Announcements sent to subscribers
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text NOT NULL,
  url         text NOT NULL DEFAULT '/',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: push_subscriptions — backend service role only
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_push_subscriptions"
  ON push_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS: announcements — public can read, service role can write
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_announcements"
  ON announcements
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "service_role_announcements"
  ON announcements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
