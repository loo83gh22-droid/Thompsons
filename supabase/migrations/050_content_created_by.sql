-- ============================================================
-- Migration 050: Content Attribution
-- Adds created_by (who actually posted) to content tables
-- Adds uploaded_by to photo tables
-- ============================================================

-- 1. journal_entries: add created_by (who logged in and posted, vs author_id which is who it's about)
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.family_members(id);

-- 2. family_stories: add created_by
ALTER TABLE public.family_stories
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.family_members(id);

-- 3. family_traditions: already has added_by, skip

-- 4. recipes: already has added_by, skip

-- 5. voice_memos: already has family_member_id as recorder, skip

-- 6. time_capsules: already has from_family_member_id, skip

-- 7. home_mosaic_photos: add uploaded_by
ALTER TABLE public.home_mosaic_photos
ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.family_members(id);

-- 8. journal_photos: add uploaded_by
ALTER TABLE public.journal_photos
ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.family_members(id);
