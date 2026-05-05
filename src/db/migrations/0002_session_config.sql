-- Add session config columns to skill_assessments
ALTER TABLE skill_assessments ADD COLUMN sessions_per_week INTEGER DEFAULT 3;
ALTER TABLE skill_assessments ADD COLUMN session_duration INTEGER DEFAULT 45;
ALTER TABLE skill_assessments ADD COLUMN session_structure TEXT DEFAULT 'auto';

-- Add skills JSON column to sessions
ALTER TABLE sessions ADD COLUMN skills TEXT;

-- Add session_config JSON column to training_blocks
ALTER TABLE training_blocks ADD COLUMN session_config TEXT;

-- Backfill existing sessions with single-skill arrays
UPDATE sessions SET skills = '["' || primary_skill || '"]' WHERE skills IS NULL;
