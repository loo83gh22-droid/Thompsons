-- Remove duplicate birthday events, keeping only the most recently created
-- one per (family_id, created_by). The created_by column holds the birthday
-- person's member ID for all auto-synced birthday events.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY family_id, created_by
           ORDER BY created_at DESC
         ) AS rn
  FROM public.family_events
  WHERE category = 'birthday'
    AND created_by IS NOT NULL
)
DELETE FROM public.family_events
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Prevent future duplicates at the database level
CREATE UNIQUE INDEX IF NOT EXISTS family_events_birthday_member_unique
  ON public.family_events (family_id, created_by)
  WHERE category = 'birthday' AND created_by IS NOT NULL;
