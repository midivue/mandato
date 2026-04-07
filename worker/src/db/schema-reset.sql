-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ⚠  DESTRUCTIVE — DEV ONLY  ⚠                                  ║
-- ║  This file DROP TABLEs before recreating them.                  ║
-- ║  Running against a production D1 database WILL DESTROY ALL DATA.║
-- ║  For safe production use, see schema-init.sql (CREATE IF NOT    ║
-- ║  EXISTS).                                                       ║
-- ╚══════════════════════════════════════════════════════════════════╝

DROP TABLE IF EXISTS predictions;

CREATE TABLE predictions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  token           TEXT    UNIQUE NOT NULL,
  share_token     TEXT    UNIQUE NOT NULL,
  display_name    TEXT    NOT NULL,
  visibility      TEXT    NOT NULL DEFAULT 'public',
  status          TEXT    NOT NULL DEFAULT 'draft',

  list_winner_id  TEXT,
  pct_mkkp        REAL,
  pct_tisza       REAL,
  pct_mi_hazank   REAL,
  pct_dk          REAL,
  pct_fidesz_kdnp REAL,
  pct_nationalities REAL,

  pm_winner_id    TEXT,
  participation_rate REAL,

  ip_hash         TEXT,

  location_country    TEXT DEFAULT 'hu',
  location_settlement TEXT,
  location_zip        TEXT,
  location_public     INTEGER DEFAULT 0,

  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  finalized_at    TEXT,

  score           REAL
);

CREATE INDEX idx_predictions_visibility ON predictions(visibility);
CREATE INDEX idx_predictions_score ON predictions(score DESC);
CREATE INDEX idx_predictions_ip_hash ON predictions(ip_hash);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_leaderboard ON predictions(visibility, score DESC) WHERE score IS NOT NULL;
CREATE INDEX idx_predictions_public_finalized ON predictions(visibility, status, finalized_at DESC);

DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;

CREATE TABLE groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_token TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'public',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE group_members (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id               INTEGER NOT NULL REFERENCES groups(id),
  prediction_share_token TEXT NOT NULL,
  added_at               TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(group_id, prediction_share_token)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_share_token ON group_members(prediction_share_token);
