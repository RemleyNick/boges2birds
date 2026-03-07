ALTER TABLE drills ADD COLUMN shot_count INTEGER;
--> statement-breakpoint
ALTER TABLE session_drills ADD COLUMN duration_override INTEGER;
--> statement-breakpoint
ALTER TABLE session_drills ADD COLUMN shot_count_override INTEGER;
