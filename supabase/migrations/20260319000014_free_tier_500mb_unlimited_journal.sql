-- Free tier update: unlimited journal entries, 500 MB storage
-- Journal entries are enforced in app code (constants.ts), no DB change needed.
-- Storage limit: revert free-tier families from 1 GB back to 500 MB.

-- Update column default for new families
ALTER TABLE public.families
  ALTER COLUMN storage_limit_bytes SET DEFAULT 524288000;

-- Update existing free-tier families that are still at the 1 GB default
-- (leaves any family that has a storage add-on or was manually upgraded untouched)
UPDATE public.families
SET storage_limit_bytes = 524288000
WHERE plan_type = 'free'
  AND storage_limit_bytes = 1073741824;
