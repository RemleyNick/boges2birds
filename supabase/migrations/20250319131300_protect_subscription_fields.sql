-- Protect subscription fields from client-side tampering.
-- Only service_role (e.g. a RevenueCat webhook Edge Function) may write these columns.
-- Regular authenticated users' attempts to modify them are silently ignored.

-- 1. BEFORE UPDATE trigger — resets subscription columns to old values for non-service_role callers
CREATE OR REPLACE FUNCTION protect_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    NEW.subscription_status := OLD.subscription_status;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
    NEW.revenuecat_customer_id := OLD.revenuecat_customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_subscription_fields_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION protect_subscription_fields();

-- 2. Split the broad FOR ALL policy into explicit per-operation policies for clarity
DROP POLICY IF EXISTS users_own ON users;

CREATE POLICY users_select ON users FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (id = auth.uid()::text);
CREATE POLICY users_update ON users FOR UPDATE USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
CREATE POLICY users_delete ON users FOR DELETE USING (id = auth.uid()::text);
