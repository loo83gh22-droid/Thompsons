-- Allow year-only or partial dates (store as text instead of date)
-- and add has_passed boolean so "In Memory" doesn't require a date

ALTER TABLE public.family_pets
  ALTER COLUMN birthday     TYPE text USING birthday::text,
  ALTER COLUMN adopted_date TYPE text USING adopted_date::text,
  ALTER COLUMN passed_date  TYPE text USING passed_date::text;

ALTER TABLE public.family_pets
  ADD COLUMN IF NOT EXISTS has_passed boolean NOT NULL DEFAULT false;

-- Migrate any existing pets that had a passed_date set
UPDATE public.family_pets SET has_passed = true WHERE passed_date IS NOT NULL AND passed_date != '';
