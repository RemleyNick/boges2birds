CREATE TABLE `drills` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`skill_area` text NOT NULL,
	`session_type` text NOT NULL,
	`difficulty` integer,
	`duration_minutes` integer NOT NULL,
	`program_slugs` text DEFAULT '[]' NOT NULL,
	`instructions` text NOT NULL,
	`is_system` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`target_avg_score` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `programs_slug_unique` ON `programs` (`slug`);--> statement-breakpoint
CREATE TABLE `round_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`played_at` integer NOT NULL,
	`course_name` text,
	`holes_played` integer DEFAULT 18 NOT NULL,
	`total_score` integer NOT NULL,
	`fairways_hit` integer DEFAULT 0 NOT NULL,
	`fairways_total` integer DEFAULT 14 NOT NULL,
	`gir_hit` integer DEFAULT 0 NOT NULL,
	`gir_total` integer DEFAULT 18 NOT NULL,
	`total_putts` integer DEFAULT 0 NOT NULL,
	`penalties` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_drills` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`drill_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`drill_id`) REFERENCES `drills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`training_block_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`session_number` integer NOT NULL,
	`session_type` text NOT NULL,
	`primary_skill` text NOT NULL,
	`scheduled_date` integer,
	`duration_minutes` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`training_block_id`) REFERENCES `training_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skill_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`avg_score` real,
	`handicap_index` real,
	`tee_shot_rating` integer,
	`iron_rating` integer,
	`short_game_rating` integer,
	`putting_rating` integer,
	`course_mgmt_rating` integer,
	`weekly_time_available` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`operation` text NOT NULL,
	`synced` integer DEFAULT false NOT NULL,
	`synced_at` integer,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `training_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`block_number` integer NOT NULL,
	`week_start_date` integer NOT NULL,
	`week_end_date` integer NOT NULL,
	`skill_priorities` text NOT NULL,
	`llm_summary` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`program_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`enrolled_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`subscription_status` text DEFAULT 'free' NOT NULL,
	`subscription_expires_at` integer,
	`revenuecat_customer_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

--> statement-breakpoint
-- Seed programs (static rows — never changes across app versions)
INSERT OR IGNORE INTO programs (id, slug, display_name, target_avg_score, created_at, updated_at)
VALUES
  ('prog-break100', 'break100', 'Break 100', 99, unixepoch() * 1000, unixepoch() * 1000),
  ('prog-break90',  'break90',  'Break 90',  89, unixepoch() * 1000, unixepoch() * 1000),
  ('prog-break80',  'break80',  'Break 80',  79, unixepoch() * 1000, unixepoch() * 1000);