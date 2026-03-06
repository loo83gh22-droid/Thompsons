-- D6: Replace double-nested IN subquery RLS on award_members with EXISTS
-- EXISTS lets the planner use indexes more effectively than IN (SELECT ... WHERE ... IN (SELECT ...))

DROP POLICY IF EXISTS "award_members_select" ON public.award_members;
DROP POLICY IF EXISTS "award_members_insert" ON public.award_members;
DROP POLICY IF EXISTS "award_members_delete" ON public.award_members;

CREATE POLICY "award_members_select"
  ON public.award_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.awards a
      WHERE a.id = award_members.award_id
        AND a.family_id IN (SELECT public.user_family_ids())
    )
  );

CREATE POLICY "award_members_insert"
  ON public.award_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.awards a
      WHERE a.id = award_members.award_id
        AND a.family_id IN (SELECT public.user_family_ids())
    )
  );

CREATE POLICY "award_members_delete"
  ON public.award_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.awards a
      WHERE a.id = award_members.award_id
        AND a.family_id IN (SELECT public.user_family_ids())
    )
  );
