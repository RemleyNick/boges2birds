-- Recreate the feedback notification webhook as a Postgres trigger that calls
-- the notify-feedback Edge Function via pg_net.http_post.
--
-- The function was redeployed with --no-verify-jwt, so no Authorization header
-- is required. The function URL (project ref + function name) is implicit
-- access control. The function rejects any payload that isn't an INSERT on
-- the feedback table, so worst-case external probes are no-ops.

-- pg_net should already be enabled on Supabase projects, but ensure it.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.feedback_notify_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'feedback',
    'schema', 'public',
    'record', to_jsonb(NEW),
    'old_record', NULL
  );

  PERFORM net.http_post(
    url := 'https://lzpjijjobcabaahshxdb.supabase.co/functions/v1/notify-feedback',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := v_payload,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_notify ON feedback;

CREATE TRIGGER feedback_notify
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.feedback_notify_fn();
