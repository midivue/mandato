ALTER TABLE predictions ADD COLUMN location_country TEXT DEFAULT 'hu';
ALTER TABLE predictions ADD COLUMN location_settlement TEXT;
ALTER TABLE predictions ADD COLUMN location_zip TEXT;
ALTER TABLE predictions ADD COLUMN location_public INTEGER DEFAULT 0;
