-- Wrap the feedback insert in a SECURITY DEFINER RPC so callers don't need
-- direct INSERT privileges on the table. After much investigation, anon-role
-- direct INSERTs were rejected at this project despite a permissive
-- WITH CHECK (true) policy being in place — likely a project-level platform
-- setting. The RPC sidesteps that by running as the function owner.

CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_type text,
  p_message text,
  p_is_guest boolean,
  p_user_id text DEFAULT NULL,
  p_reply_email text DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Defensive validation (table CHECK constraints catch these too, but give
  -- clean errors to the caller).
  IF p_type NOT IN ('bug', 'improvement') THEN
    RAISE EXCEPTION 'Invalid type: %', p_type;
  END IF;
  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Message is required';
  END IF;
  IF length(p_message) > 4000 THEN
    RAISE EXCEPTION 'Message exceeds 4000 character limit';
  END IF;

  INSERT INTO feedback (type, message, is_guest, user_id, reply_email, context)
  VALUES (
    p_type,
    p_message,
    coalesce(p_is_guest, false),
    p_user_id,
    p_reply_email,
    coalesce(p_context, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_feedback(text, text, boolean, text, text, jsonb)
  TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
