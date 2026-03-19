-- Boges2Birds — Supabase Postgres schema
-- Mirrors the SQLite schema (src/db/schema.ts). Push-only sync from SQLite.
-- All IDs are TEXT (UUIDs generated client-side). Timestamps are TIMESTAMPTZ.

-- ─── users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  revenuecat_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── skill_assessments ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avg_score REAL,
  handicap_index REAL,
  tee_shot_rating INTEGER,
  iron_rating INTEGER,
  short_game_rating INTEGER,
  putting_rating INTEGER,
  course_mgmt_rating INTEGER,
  weekly_time_available TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── programs ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  target_avg_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the 3 static program rows
INSERT INTO programs (id, slug, display_name, target_avg_score)
VALUES
  ('prog-break100', 'break100', 'Break 100', 100),
  ('prog-break90',  'break90',  'Break 90',  90),
  ('prog-break80',  'break80',  'Break 80',  80)
ON CONFLICT (id) DO NOTHING;

-- ─── user_programs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_programs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(id),
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── training_blocks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  block_number INTEGER NOT NULL,
  week_start_date TIMESTAMPTZ NOT NULL,
  week_end_date TIMESTAMPTZ NOT NULL,
  skill_priorities JSONB NOT NULL,
  llm_summary TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── sessions ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  training_block_id TEXT NOT NULL REFERENCES training_blocks(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  primary_skill TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── drills ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  skill_area TEXT NOT NULL,
  session_type TEXT NOT NULL,
  difficulty INTEGER,
  duration_minutes INTEGER NOT NULL,
  program_slugs JSONB NOT NULL DEFAULT '[]',
  instructions TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── session_drills ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_drills (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  drill_id TEXT NOT NULL REFERENCES drills(id),
  order_index INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── round_logs ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS round_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL,
  course_name TEXT,
  holes_played INTEGER NOT NULL DEFAULT 18,
  total_score INTEGER NOT NULL,
  fairways_hit INTEGER NOT NULL DEFAULT 0,
  fairways_total INTEGER NOT NULL DEFAULT 14,
  gir_hit INTEGER NOT NULL DEFAULT 0,
  gir_total INTEGER NOT NULL DEFAULT 18,
  total_putts INTEGER NOT NULL DEFAULT 0,
  penalties INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all user-owned tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;

-- users: own row only (PK = auth.uid())
CREATE POLICY users_own ON users
  FOR ALL USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- skill_assessments: own rows via user_id
CREATE POLICY skill_assessments_own ON skill_assessments
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- user_programs: own rows via user_id
CREATE POLICY user_programs_own ON user_programs
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- training_blocks: own rows via user_id
CREATE POLICY training_blocks_own ON training_blocks
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- sessions: own rows via training_block → user_id
CREATE POLICY sessions_own ON sessions
  FOR ALL USING (
    training_block_id IN (
      SELECT id FROM training_blocks WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    training_block_id IN (
      SELECT id FROM training_blocks WHERE user_id = auth.uid()::text
    )
  );

-- session_drills: own rows via session → training_block → user_id
CREATE POLICY session_drills_own ON session_drills
  FOR ALL USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN training_blocks tb ON s.training_block_id = tb.id
      WHERE tb.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN training_blocks tb ON s.training_block_id = tb.id
      WHERE tb.user_id = auth.uid()::text
    )
  );

-- round_logs: own rows via user_id
CREATE POLICY round_logs_own ON round_logs
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- programs: read-only for all authenticated users
CREATE POLICY programs_read ON programs
  FOR SELECT USING (auth.role() = 'authenticated');

-- drills: read-only for all authenticated users
CREATE POLICY drills_read ON drills
  FOR SELECT USING (auth.role() = 'authenticated');
