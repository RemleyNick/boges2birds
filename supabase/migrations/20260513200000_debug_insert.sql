-- Diagnostic: try the insert from inside an RPC running as the caller's role.
-- If this fails too, the error message + state will be more informative than
-- the bare PostgREST 42501.

CREATE OR REPLACE FUNCTION public.debug_try_insert()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result jsonb;
  err_state text;
  err_msg text;
  err_detail text;
  err_hint text;
BEGIN
  BEGIN
    INSERT INTO feedback (type, message, is_guest)
    VALUES ('bug', 'debug_try_insert from RPC', false)
    RETURNING jsonb_build_object('id', id, 'created_at', created_at) INTO result;
    RETURN jsonb_build_object('ok', true, 'row', result, 'as_role', current_user);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS
      err_state = RETURNED_SQLSTATE,
      err_msg = MESSAGE_TEXT,
      err_detail = PG_EXCEPTION_DETAIL,
      err_hint = PG_EXCEPTION_HINT;
    RETURN jsonb_build_object(
      'ok', false,
      'as_role', current_user,
      'sqlstate', err_state,
      'message', err_msg,
      'detail', err_detail,
      'hint', err_hint
    );
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_try_insert() TO anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
