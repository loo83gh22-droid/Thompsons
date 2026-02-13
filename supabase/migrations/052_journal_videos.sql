-- ============================================================
-- Migration 052: Journal Videos
-- Adds video upload support to journal entries
-- ============================================================

-- 1. Create journal_videos table
CREATE TABLE IF NOT EXISTS public.journal_videos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id uuid REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  duration_seconds int,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.journal_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage journal_videos in own families"
  ON public.journal_videos FOR ALL
  USING (family_id IN (SELECT public.user_family_ids()));

-- 3. Indexes
CREATE INDEX idx_journal_videos_entry_id ON public.journal_videos(entry_id);
CREATE INDEX idx_journal_videos_family_id ON public.journal_videos(family_id);

-- 4. Storage bucket for journal videos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('journal-videos', 'journal-videos', true, 314572800)  -- 300 MB
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies for journal-videos bucket
CREATE POLICY "Authenticated users can upload journal videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'journal-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view journal videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-videos');

CREATE POLICY "Authenticated users can delete journal videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'journal-videos' AND auth.role() = 'authenticated');
