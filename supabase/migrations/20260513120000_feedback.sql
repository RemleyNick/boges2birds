-- Feedback table: user-submitted bug reports and improvement requests.
-- Writes flow directly from the client (skipping the SQLite + sync_log pipeline)
-- so guests and authenticated users use the same path. A Database Webhook on
-- INSERT fires the notify-feedback Edge Function to email the developer.

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL CHECK (type IN ('bug', 'improvement')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  reply_email TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX feedback_created_at_idx ON feedback (created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Inserts allowed from both anonymous and authenticated roles.
-- No SELECT/UPDATE/DELETE policies: only the service role (Supabase dashboard)
-- can read or modify rows.
CREATE POLICY feedback_insert_any ON feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
