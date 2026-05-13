-- Force PostgREST to reload its schema cache so the updated feedback RLS
-- policies (from migration 20260513140000_feedback_rls_fix.sql) take effect.
-- Without this, PostgREST may keep using the previously-cached policy set
-- and continue rejecting anon inserts.
NOTIFY pgrst, 'reload schema';
