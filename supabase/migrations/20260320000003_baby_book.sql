-- Baby Book feature: year-by-year photo books per child

-- One row per child per year
CREATE TABLE public.baby_book_years (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id  uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  year              int NOT NULL,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_member_id, year)
);

CREATE INDEX baby_book_years_family_id_idx ON public.baby_book_years (family_id);
CREATE INDEX baby_book_years_member_id_idx ON public.baby_book_years (family_member_id);

ALTER TABLE public.baby_book_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view baby book years in own families"
  ON public.baby_book_years FOR SELECT
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "Users can insert baby book years in own families"
  ON public.baby_book_years FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "Users can update baby book years in own families"
  ON public.baby_book_years FOR UPDATE
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "Users can delete baby book years in own families"
  ON public.baby_book_years FOR DELETE
  USING (family_id IN (SELECT public.user_family_ids()));

-- Up to 5 photos per year
CREATE TABLE public.baby_book_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  year_id         uuid NOT NULL REFERENCES public.baby_book_years(id) ON DELETE CASCADE,
  url             text NOT NULL,
  sort_order      int NOT NULL DEFAULT 0,
  file_size_bytes bigint DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX baby_book_photos_year_id_idx ON public.baby_book_photos (year_id);

ALTER TABLE public.baby_book_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view baby book photos in own families"
  ON public.baby_book_photos FOR SELECT
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "Users can insert baby book photos in own families"
  ON public.baby_book_photos FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "Users can delete baby book photos in own families"
  ON public.baby_book_photos FOR DELETE
  USING (family_id IN (SELECT public.user_family_ids()));

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('baby-book-photos', 'baby-book-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "baby_book_photos_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'baby-book-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "baby_book_photos_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'baby-book-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "baby_book_photos_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'baby-book-photos'
    AND auth.role() = 'authenticated'
  );

-- Enable for all existing families
INSERT INTO public.family_enabled_features (family_id, feature_slug)
SELECT id, 'baby-book' FROM public.families
ON CONFLICT DO NOTHING;
