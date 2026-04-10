-- Migration 007: Add telex_tip_id column to predictions
-- Run against existing databases that already have the schema.
ALTER TABLE predictions ADD COLUMN telex_tip_id TEXT;
