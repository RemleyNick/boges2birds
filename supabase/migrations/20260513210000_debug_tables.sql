-- Diagnostic: list ALL tables named 'feedback' in any schema, plus dump pg_policy
-- raw to see if pg_policies view is hiding anything.

CREATE OR REPLACE FUNCTION public.debug_all_feedback_tables()
RETURNS TABLE (
  schema_name text,
  table_name text,
  rls_enabled boolean,
  force_rls boolean,
  policy_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    n.nspname::text AS schema_name,
    c.relname::text AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS force_rls,
    (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = 'feedback'
    AND c.relkind = 'r';
$$;

GRANT EXECUTE ON FUNCTION public.debug_all_feedback_tables() TO anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.debug_pg_policy_raw()
RETURNS TABLE (
  schema_name text,
  table_name text,
  policyname text,
  polcmd "char",
  polpermissive boolean,
  polroles oid[],
  polqual text,
  polwithcheck text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    n.nspname::text,
    c.relname::text,
    p.polname::text,
    p.polcmd,
    p.polpermissive,
    p.polroles,
    pg_get_expr(p.polqual, p.polrelid)::text,
    pg_get_expr(p.polwithcheck, p.polrelid)::text
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'feedback';
$$;

GRANT EXECUTE ON FUNCTION public.debug_pg_policy_raw() TO anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
