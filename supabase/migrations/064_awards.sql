-- Awards & Achievements
-- Per-family awards that can be associated with multiple family members.
-- Supports both image attachments (photo of trophy) and document attachments (PDFs, articles).

CREATE TABLE public.awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other', -- sports | academic | professional | community | other
  awarded_by text,
  award_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table: one award can belong to multiple family members
CREATE TABLE public.award_members (
  award_id uuid NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  PRIMARY KEY (award_id, family_member_id)
);

-- Files attached to an award (images and/or documents)
CREATE TABLE public.award_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  award_id uuid NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image', -- 'image' | 'document'
  file_name text, -- original filename, shown for documents
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX awards_family_id_idx ON public.awards(family_id);
CREATE INDEX award_members_award_id_idx ON public.award_members(award_id);
CREATE INDEX award_members_member_id_idx ON public.award_members(family_member_id);
CREATE INDEX award_files_award_id_idx ON public.award_files(award_id);

-- RLS
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awards_select"
  ON public.awards FOR SELECT
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "awards_insert"
  ON public.awards FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "awards_update"
  ON public.awards FOR UPDATE
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "awards_delete"
  ON public.awards FOR DELETE
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "award_members_select"
  ON public.award_members FOR SELECT
  USING (award_id IN (SELECT id FROM public.awards WHERE family_id IN (SELECT public.user_family_ids())));

CREATE POLICY "award_members_insert"
  ON public.award_members FOR INSERT
  WITH CHECK (award_id IN (SELECT id FROM public.awards WHERE family_id IN (SELECT public.user_family_ids())));

CREATE POLICY "award_members_delete"
  ON public.award_members FOR DELETE
  USING (award_id IN (SELECT id FROM public.awards WHERE family_id IN (SELECT public.user_family_ids())));

CREATE POLICY "award_files_select"
  ON public.award_files FOR SELECT
  USING (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "award_files_insert"
  ON public.award_files FOR INSERT
  WITH CHECK (family_id IN (SELECT public.user_family_ids()));

CREATE POLICY "award_files_delete"
  ON public.award_files FOR DELETE
  USING (family_id IN (SELECT public.user_family_ids()));

-- Private storage bucket for award files
INSERT INTO storage.buckets (id, name, public)
VALUES ('award-files', 'award-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "award_files_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'award-files' AND auth.role() = 'authenticated');

CREATE POLICY "award_files_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'award-files' AND auth.role() = 'authenticated');

CREATE POLICY "award_files_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'award-files' AND auth.role() = 'authenticated');
