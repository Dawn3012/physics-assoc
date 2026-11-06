-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Adds the events feature: a table for events and policies.

-- 1. Create the events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  time TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'upcoming',
  registration_url TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for search and filtering
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_published ON events(published);
CREATE INDEX idx_events_date ON events(date DESC);
CREATE INDEX idx_events_status ON events(status);

-- 3. Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 4. Public can read published events
CREATE POLICY "Public can read published events"
  ON events FOR SELECT
  USING (published = true);

-- 5. Authenticated users can read all events (including drafts)
CREATE POLICY "Authenticated users can read all events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- 6. Authenticated users can insert events
CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. Authenticated users can update events
CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Authenticated users can delete events
CREATE POLICY "Authenticated users can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (true);

-- 9. Auto-update timestamp
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
