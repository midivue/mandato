-- Migration 006: Add participation_rate to predictions
-- Safe to run on existing databases -- adds nullable column with no default.
ALTER TABLE predictions ADD COLUMN participation_rate REAL;
