-- Add taken_at date to home_mosaic_photos for chronological sorting
ALTER TABLE home_mosaic_photos ADD COLUMN IF NOT EXISTS taken_at DATE;
