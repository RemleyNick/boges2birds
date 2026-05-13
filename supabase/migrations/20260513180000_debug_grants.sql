-- Diagnostic: check actual table-level GRANTs on feedback for anon role.
-- Hunting why anon INSERT keeps returning RLS violation despite a permissive
-- WITH CHECK (true) policy.

CREATE OR REPLACE FUNCTION public.debug_feedback_grants()
RETURNS TABLE (
  grantee text,
  privilege_type text,
  is_grantable text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    grantee::text,
    privilege_type::text,
    is_grantable::text
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'feedback'
  ORDER BY grantee, privilege_type;
$$;

GRANT EXECUTE ON FUNCTION public.debug_feedback_grants() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
