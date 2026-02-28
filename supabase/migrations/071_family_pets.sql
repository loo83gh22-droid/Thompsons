-- Family Pets feature
-- Stores pet profiles with photos, linked to family members

CREATE TABLE IF NOT EXISTS public.family_pets (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id      uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name           text NOT NULL,
  species        text NOT NULL DEFAULT 'dog',
  breed          text,
  birthday       date,
  adopted_date   date,
  passed_date    date,
  description    text,
  owner_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_photos (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id  uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  pet_id     uuid NOT NULL REFERENCES public.family_pets(id) ON DELETE CASCADE,
  url        text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE public.family_pets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_photos   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_pets_select"  ON public.family_pets FOR SELECT
  USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "family_pets_insert"  ON public.family_pets FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "family_pets_update"  ON public.family_pets FOR UPDATE
  USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "family_pets_delete"  ON public.family_pets FOR DELETE
  USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "pet_photos_select" ON public.pet_photos FOR SELECT
  USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "pet_photos_insert" ON public.pet_photos FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "pet_photos_delete" ON public.pet_photos FOR DELETE
  USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

-- Storage bucket for pet photos (private, proxied via /api/storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "pet_photos_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');

CREATE POLICY "pet_photos_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');

CREATE POLICY "pet_photos_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');
