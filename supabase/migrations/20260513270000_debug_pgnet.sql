-- Diagnostic: check the pg_net response log for recent calls to notify-feedback.

CREATE OR REPLACE FUNCTION public.debug_pgnet_recent()
RETURNS TABLE (
  id bigint,
  status_code integer,
  content text,
  error_msg text,
  created timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, net
AS $$
  SELECT
    r.id,
    r.status_code,
    LEFT(r.content::text, 500) AS content,
    r.error_msg,
    r.created
  FROM net._http_response r
  WHERE r.created > now() - interval '5 minutes'
  ORDER BY r.created DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.debug_pgnet_recent() TO anon, authenticated, public;
NOTIFY pgrst, 'reload schema';
