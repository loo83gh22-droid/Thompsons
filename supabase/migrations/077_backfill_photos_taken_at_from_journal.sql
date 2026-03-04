-- Backfill taken_at on home_mosaic_photos that came from journal entries.
-- Journal photo URLs follow the pattern: /api/storage/journal-photos/{entry_id}/{filename}
UPDATE home_mosaic_photos p
SET taken_at = je.trip_date
FROM journal_entries je
WHERE p.taken_at IS NULL
  AND je.trip_date IS NOT NULL
  AND p.url LIKE '/api/storage/journal-photos/' || je.id::text || '/%';
