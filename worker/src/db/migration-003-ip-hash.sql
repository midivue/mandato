ALTER TABLE predictions ADD COLUMN ip_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_predictions_ip_hash ON predictions(ip_hash);
