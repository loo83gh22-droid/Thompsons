-- Performance: composite indexes for high-traffic filter+sort columns
-- D5 from PERFORMANCE_FINDINGS.md (2026-03-06)

CREATE INDEX IF NOT EXISTS idx_journal_entries_family_dates
  ON public.journal_entries (family_id, trip_date DESC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_home_mosaic_photos_family_dates
  ON public.home_mosaic_photos (family_id, taken_at DESC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_memos_family_created
  ON public.voice_memos (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_family_stories_family_created
  ON public.family_stories (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_date
  ON public.time_capsules (unlock_date)
  WHERE unlock_date IS NOT NULL;
