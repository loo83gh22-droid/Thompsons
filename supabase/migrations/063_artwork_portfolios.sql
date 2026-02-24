-- Artwork Portfolios
-- Per-child artwork galleries: artwork_pieces + artwork_photos

CREATE TABLE public.artwork_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  medium text, -- drawing, painting, craft, sculpture, digital, other
  date_created date,
  age_when_created int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.artwork_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  piece_id uuid NOT NULL REFERENCES public.artwork_pieces(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX artwork_pieces_family_id_idx ON public.artwork_pieces(family_id);
CREATE INDEX artwork_pieces_member_id_idx ON public.artwork_pieces(family_member_id);
CREATE INDEX artwork_photos_piece_id_idx ON public.artwork_photos(piece_id);

-- RLS
ALTER TABLE public.artwork_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artwork_pieces_select"
  ON public.artwork_pieces FOR SELECT
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "artwork_pieces_insert"
  ON public.artwork_pieces FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "artwork_pieces_update"
  ON public.artwork_pieces FOR UPDATE
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "artwork_pieces_delete"
  ON public.artwork_pieces FOR DELETE
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "artwork_photos_select"
  ON public.artwork_photos FOR SELECT
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "artwork_photos_insert"
  ON public.artwork_photos FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "artwork_photos_delete"
  ON public.artwork_photos FOR DELETE
  USING (family_id IN (SELECT public.user_family_ids()));

-- Storage bucket for artwork photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-photos', 'artwork-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "artwork_photos_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'artwork-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "artwork_photos_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artwork-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "artwork_photos_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artwork-photos'
    AND auth.role() = 'authenticated'
  );
