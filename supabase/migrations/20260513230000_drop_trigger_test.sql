-- Diagnostic: temporarily drop the webhook trigger to confirm it's what's
-- blocking anon INSERTs. We'll re-create it correctly in the next migration.

DROP TRIGGER IF EXISTS feedback_notify ON feedback;

NOTIFY pgrst, 'reload schema';
