-- ============================================================
-- Migration 051: Shareable Content
-- Adds share tokens to stories and recipes for public links
-- ============================================================

-- Stories: add share token
ALTER TABLE public.family_stories
ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_family_stories_share_token
ON public.family_stories (share_token) WHERE share_token IS NOT NULL;

-- Recipes: add share token
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_recipes_share_token
ON public.recipes (share_token) WHERE share_token IS NOT NULL;

-- Allow public read access via share token (no auth required)
CREATE POLICY "Anyone can read publicly shared stories"
  ON public.family_stories FOR SELECT
  USING (is_public = true AND share_token IS NOT NULL);

CREATE POLICY "Anyone can read publicly shared recipes"
  ON public.recipes FOR SELECT
  USING (is_public = true AND share_token IS NOT NULL);
