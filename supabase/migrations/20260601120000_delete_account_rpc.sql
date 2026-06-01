-- Allows an authenticated user to permanently delete their own account.
-- SECURITY DEFINER so the function can delete from auth.users on behalf of the caller.
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Delete public user row; FK ON DELETE CASCADE removes all child records
  DELETE FROM public.users WHERE id = auth.uid()::text;
  -- Remove the Supabase auth identity
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
