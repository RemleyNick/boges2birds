-- Diagnostic RPC: returns the actual policies on the feedback table so we can
-- see what RLS rules are actually in place. Will be dropped after debugging.

CREATE OR REPLACE FUNCTION public.debug_feedback_policies()
RETURNS TABLE (
  policyname text,
  cmd text,
  permissive text,
  roles text[],
  qual text,
  with_check text,
  rls_enabled boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.policyname::text,
    p.cmd::text,
    p.permissive::text,
    p.roles,
    p.qual,
    p.with_check,
    c.relrowsecurity AS rls_enabled
  FROM pg_policies p
  JOIN pg_class c ON c.relname = p.tablename
  WHERE p.tablename = 'feedback'
  UNION ALL
  SELECT
    NULL, NULL, NULL, NULL, NULL, NULL,
    relrowsecurity
  FROM pg_class
  WHERE relname = 'feedback'
    AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback');
$$;

GRANT EXECUTE ON FUNCTION public.debug_feedback_policies() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
