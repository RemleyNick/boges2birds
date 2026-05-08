-- Add equipment column to drills table.
-- Mirrors the SQLite migration 0002_drill_equipment.sql.
ALTER TABLE drills ADD COLUMN IF NOT EXISTS equipment JSONB NOT NULL DEFAULT '[]'::jsonb;
