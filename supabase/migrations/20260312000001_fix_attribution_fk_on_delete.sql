-- ============================================================
-- Migration: Fix attribution FK ON DELETE behavior (W21)
-- The created_by / uploaded_by columns added in migration 050
-- use default ON DELETE NO ACTION, which blocks member deletion
-- if the member has created any content. Change to SET NULL so
-- attribution gracefully nulls out when a member is removed.
-- ============================================================

-- journal_entries.created_by
ALTER TABLE public.journal_entries
  DROP CONSTRAINT IF EXISTS journal_entries_created_by_fkey;
ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.family_members(id) ON DELETE SET NULL;

-- family_stories.created_by
ALTER TABLE public.family_stories
  DROP CONSTRAINT IF EXISTS family_stories_created_by_fkey;
ALTER TABLE public.family_stories
  ADD CONSTRAINT family_stories_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.family_members(id) ON DELETE SET NULL;

-- home_mosaic_photos.uploaded_by
ALTER TABLE public.home_mosaic_photos
  DROP CONSTRAINT IF EXISTS home_mosaic_photos_uploaded_by_fkey;
ALTER TABLE public.home_mosaic_photos
  ADD CONSTRAINT home_mosaic_photos_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES public.family_members(id) ON DELETE SET NULL;

-- journal_photos.uploaded_by
ALTER TABLE public.journal_photos
  DROP CONSTRAINT IF EXISTS journal_photos_uploaded_by_fkey;
ALTER TABLE public.journal_photos
  ADD CONSTRAINT journal_photos_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES public.family_members(id) ON DELETE SET NULL;
