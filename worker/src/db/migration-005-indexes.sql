-- Migration 005: Add composite indexes for common query patterns.
-- Safe to run multiple times (IF NOT EXISTS).

CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_leaderboard ON predictions(visibility, score DESC) WHERE score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_public_finalized ON predictions(visibility, status, finalized_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_share_token ON group_members(prediction_share_token);
