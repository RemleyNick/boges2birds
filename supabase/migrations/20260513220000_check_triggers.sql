-- Diagnostic: list all triggers on feedback table.

CREATE OR REPLACE FUNCTION public.debug_feedback_triggers()
RETURNS TABLE (
  trigger_name text,
  event_manipulation text,
  action_timing text,
  action_statement text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    trigger_name::text,
    event_manipulation::text,
    action_timing::text,
    action_statement::text
  FROM information_schema.triggers
  WHERE event_object_table = 'feedback';
$$;

GRANT EXECUTE ON FUNCTION public.debug_feedback_triggers() TO anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
