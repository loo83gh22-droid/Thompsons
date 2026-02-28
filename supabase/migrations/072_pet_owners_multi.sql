-- Replace single owner_member_id with a pet_owners junction table
-- allowing multiple owners per pet (e.g. grandparents' pet, kids' pet)
-- No existing data to migrate — feature was just created.

ALTER TABLE public.family_pets DROP COLUMN IF EXISTS owner_member_id;

CREATE TABLE IF NOT EXISTS public.pet_owners (
  pet_id    uuid NOT NULL REFERENCES public.family_pets(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  PRIMARY KEY (pet_id, member_id)
);

ALTER TABLE public.pet_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_owners_select" ON public.pet_owners FOR SELECT
  USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "pet_owners_insert" ON public.pet_owners FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "pet_owners_delete" ON public.pet_owners FOR DELETE
  USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));
