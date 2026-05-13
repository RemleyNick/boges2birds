-- Diagnostic: report the Postgres role/user that PostgREST is using for the
-- request. Helps isolate whether the JWT's role claim is actually being
-- applied via SET ROLE.

CREATE OR REPLACE FUNCTION public.debug_whoami()
RETURNS TABLE (
  current_user_name text,
  current_role_name text,
  session_user_name text,
  jwt_role text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    current_user::text,
    current_role::text,
    session_user::text,
    coalesce(current_setting('request.jwt.claim.role', true), 'NO_JWT')::text;
$$;

GRANT EXECUTE ON FUNCTION public.debug_whoami() TO anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
