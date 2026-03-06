-- ============================================================
-- Migration 080: Data integrity fixes (audit 2026-03-06)
-- W1-W5: Add file_size_bytes to photo/file tables for storage decrement on delete
-- W13:   Add family_id to existing time_capsule_members + fix policies
-- W12:   Prevent unlock_date mutation after time capsule creation
-- ============================================================

-- 1. Add file_size_bytes to photo tables that were missing it ----------------

ALTER TABLE public.journal_photos
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0;

ALTER TABLE public.home_mosaic_photos
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0;

ALTER TABLE public.artwork_photos
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0;

ALTER TABLE public.pet_photos
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0;

ALTER TABLE public.award_files
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0;

-- 2. Fix time_capsule_members: add family_id column and fix RLS --------------
-- The table was created without family_id, so policies that scope by family
-- couldn't be applied. Add the column, backfill it from the parent capsule,
-- then replace the blanket policy with proper family-scoped ones.

ALTER TABLE public.time_capsule_members
  ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES public.families(id) ON DELETE CASCADE;

-- Backfill family_id from the parent time_capsule
UPDATE public.time_capsule_members tcm
SET family_id = tc.family_id
FROM public.time_capsules tc
WHERE tc.id = tcm.time_capsule_id
  AND tcm.family_id IS NULL;

-- Make family_id NOT NULL now that it's populated
ALTER TABLE public.time_capsule_members
  ALTER COLUMN family_id SET NOT NULL;

-- Replace blanket policy with family-scoped granular policies
DROP POLICY IF EXISTS "Users can manage time_capsule_members in own families" ON public.time_capsule_members;
DROP POLICY IF EXISTS "time_capsule_members_select" ON public.time_capsule_members;
DROP POLICY IF EXISTS "time_capsule_members_insert" ON public.time_capsule_members;
DROP POLICY IF EXISTS "time_capsule_members_delete" ON public.time_capsule_members;

CREATE POLICY "time_capsule_members_select"
  ON public.time_capsule_members FOR SELECT
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "time_capsule_members_insert"
  ON public.time_capsule_members FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "time_capsule_members_delete"
  ON public.time_capsule_members FOR DELETE
  USING (family_id IN (SELECT public.user_family_ids()));

-- 3. Re-apply time_capsules SELECT policy now that time_capsule_members has family_id
-- (The subquery referencing this table is now fully functional)
DROP POLICY IF EXISTS "time_capsules_select" ON public.time_capsules;

CREATE POLICY "time_capsules_select"
  ON public.time_capsules FOR SELECT
  USING (
    family_id IN (SELECT public.user_family_ids())
    AND (
      from_family_member_id IN (
        SELECT id FROM public.family_members WHERE user_id = auth.uid()
      )
      OR to_family_member_id IN (
        SELECT id FROM public.family_members WHERE user_id = auth.uid()
      )
      OR id IN (
        SELECT tcm.time_capsule_id FROM public.time_capsule_members tcm
        JOIN public.family_members fm ON fm.id = tcm.family_member_id
        WHERE fm.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = time_capsules.family_id
          AND fm.role IN ('owner', 'adult')
      )
    )
  );

-- 4. Prevent unlock_date changes after a time capsule is created (W12) -------

CREATE OR REPLACE FUNCTION public.prevent_unlock_date_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.unlock_date IS DISTINCT FROM NEW.unlock_date THEN
    RAISE EXCEPTION 'unlock_date cannot be changed after a time capsule is created';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_unlock_date_change ON public.time_capsules;

CREATE TRIGGER trg_prevent_unlock_date_change
  BEFORE UPDATE ON public.time_capsules
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unlock_date_change();
