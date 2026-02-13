-- ============================================================
-- Migration 049: Member Roles
-- Adds role-based access to family_members
-- Roles: owner, adult, teen, child
-- ============================================================

-- 1. Add role column with default 'member' temporarily for backfill
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'adult'
CHECK (role IN ('owner', 'adult', 'teen', 'child'));

-- 2. Set the first member (by created_at) in each family as 'owner'
UPDATE public.family_members fm
SET role = 'owner'
WHERE fm.id IN (
  SELECT DISTINCT ON (family_id) id
  FROM public.family_members
  ORDER BY family_id, created_at ASC
);

-- 3. Auto-assign 'child' for members with birth_date making them under 13
UPDATE public.family_members
SET role = 'child'
WHERE role != 'owner'
  AND birth_date IS NOT NULL
  AND birth_date > (CURRENT_DATE - INTERVAL '13 years');

-- 4. Auto-assign 'teen' for members aged 13-17
UPDATE public.family_members
SET role = 'teen'
WHERE role != 'owner'
  AND birth_date IS NOT NULL
  AND birth_date <= (CURRENT_DATE - INTERVAL '13 years')
  AND birth_date > (CURRENT_DATE - INTERVAL '18 years');

-- 5. Add kid_access_token for child link feature
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS kid_access_token text UNIQUE,
ADD COLUMN IF NOT EXISTS kid_token_expires_at timestamptz;

-- 6. Index for quick role lookups
CREATE INDEX IF NOT EXISTS idx_family_members_role ON public.family_members (family_id, role);

-- 7. Index for kid access token lookups
CREATE INDEX IF NOT EXISTS idx_family_members_kid_token ON public.family_members (kid_access_token)
WHERE kid_access_token IS NOT NULL;
