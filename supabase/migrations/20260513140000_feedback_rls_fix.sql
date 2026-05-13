-- Fix RLS policy to actually permit anonymous and authenticated inserts.
-- The original `feedback_insert_any` policy used `TO anon, authenticated`
-- but was rejecting anon inserts in practice. Rewrite as a fully permissive
-- INSERT policy with no role restriction.

DROP POLICY IF EXISTS feedback_insert_any ON feedback;

CREATE POLICY feedback_insert_anon ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Belt-and-suspenders: ensure anon and authenticated have INSERT on the table.
GRANT INSERT ON TABLE feedback TO anon, authenticated;
