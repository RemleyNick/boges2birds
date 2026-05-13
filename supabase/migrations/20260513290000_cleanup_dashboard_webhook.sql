-- Clean up any stale Database Webhook metadata left over from the dashboard
-- webhook entry the user created during initial setup. The underlying trigger
-- was dropped earlier and replaced with our own pg_net-based trigger, but the
-- dashboard's metadata row in supabase_functions.hooks (if present) lingers.
--
-- This migration:
--   1. Removes any rows in supabase_functions.hooks that target the feedback
--      table.
--   2. Drops any other (non-our) triggers on feedback that the dashboard might
--      have re-created when the webhook entry was viewed.
--
-- Uses DO blocks so it succeeds even if the supabase_functions schema or
-- hooks table doesn't exist on a given environment.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'supabase_functions' AND table_name = 'hooks'
  ) THEN
    EXECUTE $sql$
      DELETE FROM supabase_functions.hooks
      WHERE hook_table_id = 'public.feedback'::regclass::oid
    $sql$;
  END IF;
END $$;

-- Drop any AFTER INSERT triggers on feedback that aren't ours.
DO $$
DECLARE
  trig record;
BEGIN
  FOR trig IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'public.feedback'::regclass
      AND NOT tgisinternal
      AND tgname <> 'feedback_notify'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON feedback', trig.tgname);
  END LOOP;
END $$;
