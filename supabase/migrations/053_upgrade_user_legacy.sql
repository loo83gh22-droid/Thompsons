-- ============================================================
-- Migration 053: Upgrade waterloo1983hawk22@gmail.com to Legacy
-- Sets plan_type, storage_limit, and plan_started_at
-- ============================================================

UPDATE public.families
SET
  plan_type = 'legacy',
  storage_limit_bytes = 53687091200,   -- 50 GB
  plan_started_at = now(),
  plan_expires_at = NULL               -- lifetime, no expiry
WHERE id IN (
  SELECT fm.family_id
  FROM public.family_members fm
  JOIN auth.users u ON u.id = fm.user_id
  WHERE u.email = 'waterloo1983hawk22@gmail.com'
);
