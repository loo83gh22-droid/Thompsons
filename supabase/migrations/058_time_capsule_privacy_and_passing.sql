-- Time Capsule Privacy & Passing Logic
-- 1. Add unlock_on_passing flag (unlocks when sender is marked as passed)
-- 2. Replace blanket RLS with granular sender/recipient policies
-- 3. Leverage existing is_remembered + passed_date on family_members

-- Add the flag
ALTER TABLE public.time_capsules
  ADD COLUMN IF NOT EXISTS unlock_on_passing boolean NOT NULL DEFAULT false;

-- Drop old blanket policy
DROP POLICY IF EXISTS "Users can manage time_capsules in own families" ON public.time_capsules;

-- SELECT: sender, legacy recipient, junction-table recipients, or owner/adult (metadata only)
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

-- INSERT: any family member can create capsules
CREATE POLICY "time_capsules_insert"
  ON public.time_capsules FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

-- UPDATE: only sender
CREATE POLICY "time_capsules_update"
  ON public.time_capsules FOR UPDATE
  USING (
    family_id IN (SELECT public.user_family_ids())
    AND from_family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- DELETE: only sender
CREATE POLICY "time_capsules_delete"
  ON public.time_capsules FOR DELETE
  USING (
    family_id IN (SELECT public.user_family_ids())
    AND from_family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );
