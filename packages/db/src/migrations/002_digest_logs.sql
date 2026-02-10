-- Add digest_logs JSONB column to blocks table
-- Stores parsed block header digest items (preRuntime, seal, consensus, etc.)
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS digest_logs JSONB NOT NULL DEFAULT '[]';
