-- Diagnostic: nuke and recreate RLS state on feedback table from scratch.
-- The previous fix migration appeared to apply but anon inserts still failed.
-- Drop ALL existing policies on the table, recreate the canonical policy, and
-- ensure GRANTs are in place.

DROP POLICY IF EXISTS feedback_insert_any ON feedback;
DROP POLICY IF EXISTS feedback_insert_anon ON feedback;
DROP POLICY IF EXISTS feedback_insert_anyone ON feedback;

-- Make sure RLS is enabled (in case it was somehow disabled)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Single permissive INSERT policy: no role restriction, no WITH CHECK condition.
CREATE POLICY feedback_insert_public ON feedback
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Belt-and-suspenders: explicit grants for both roles.
GRANT INSERT ON TABLE feedback TO anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
