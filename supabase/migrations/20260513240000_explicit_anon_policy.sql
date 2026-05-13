-- Try explicit anon-named policy instead of TO public.
-- The polroles=[0] (public) policy doesn't seem to be honored for anon
-- inserts despite anon being a member of public — replace with named roles.

DROP POLICY IF EXISTS feedback_insert_public ON feedback;

CREATE POLICY feedback_insert_anon_explicit ON feedback
  AS PERMISSIVE
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY feedback_insert_authed_explicit ON feedback
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
