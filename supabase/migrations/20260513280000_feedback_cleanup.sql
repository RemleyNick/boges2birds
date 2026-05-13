-- Cleanup: drop all debug RPCs and orphaned RLS policies left over from
-- investigating why anon-role direct INSERTs were rejected by the platform.
--
-- Final architecture for the feedback feature:
--   - Clients call the public.submit_feedback(...) RPC (SECURITY DEFINER).
--   - That RPC inserts into feedback, bypassing RLS as the function owner.
--   - The feedback_notify trigger fires AFTER INSERT and pg_net.http_post's
--     to the notify-feedback Edge Function, which forwards to Resend.
--   - RLS is enabled on feedback with NO policies, so direct table access
--     from anon/authenticated is fully denied. Only the RPC writes; only
--     service_role (dashboard) reads.

DROP FUNCTION IF EXISTS public.debug_feedback_policies();
DROP FUNCTION IF EXISTS public.debug_feedback_grants();
DROP FUNCTION IF EXISTS public.debug_whoami();
DROP FUNCTION IF EXISTS public.debug_try_insert();
DROP FUNCTION IF EXISTS public.debug_all_feedback_tables();
DROP FUNCTION IF EXISTS public.debug_pg_policy_raw();
DROP FUNCTION IF EXISTS public.debug_feedback_triggers();
DROP FUNCTION IF EXISTS public.debug_pgnet_recent();

-- Drop the inert direct-insert policies — all writes now go through the RPC.
DROP POLICY IF EXISTS feedback_insert_any ON feedback;
DROP POLICY IF EXISTS feedback_insert_anon ON feedback;
DROP POLICY IF EXISTS feedback_insert_anyone ON feedback;
DROP POLICY IF EXISTS feedback_insert_public ON feedback;
DROP POLICY IF EXISTS feedback_insert_anon_explicit ON feedback;
DROP POLICY IF EXISTS feedback_insert_authed_explicit ON feedback;

-- Revoke the table-level grants too — defense in depth, RPC owner doesn't
-- need them and direct access is explicitly disallowed.
REVOKE INSERT, SELECT, UPDATE, DELETE ON TABLE feedback FROM anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
