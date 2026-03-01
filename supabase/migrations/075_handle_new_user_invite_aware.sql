-- ============================================================
-- Migration 075: Invite-aware handle_new_user trigger
--
-- Problem: When admin.generateLink creates an auth user for an
-- invited user, a Postgres trigger fires and creates "Our Family"
-- for them — before they confirm their email or visit the
-- dashboard. This means invited users always land in "Our Family"
-- instead of the family they were invited to.
--
-- Fix: Replace handle_new_user() to check whether the new user
-- already has a pending family_members row (contact_email match,
-- user_id IS NULL). If so, skip family creation entirely — the
-- dashboard layout will link them to the invited family.
--
-- Also drops and recreates the on_auth_user_created trigger so
-- it calls this updated function. If the existing trigger had a
-- different name, this migration still fixes the function body so
-- both triggers use the correct logic.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  pending_count   integer;
  v_family_name   text;
  new_family_id   uuid;
BEGIN
  -- If the new user already has a pending invite (a family_members row
  -- with their email but no user_id yet), skip family creation.
  -- The dashboard layout will link them to the invited family instead.
  SELECT COUNT(*) INTO pending_count
  FROM public.family_members
  WHERE contact_email = NEW.email
    AND user_id IS NULL;

  IF pending_count > 0 THEN
    RETURN NEW;
  END IF;

  -- No pending invite: create a default family for this brand-new user.
  v_family_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'family_name'), ''),
    'Our Family'
  );

  INSERT INTO public.families (name)
  VALUES (v_family_name)
  RETURNING id INTO new_family_id;

  INSERT INTO public.family_settings (family_id, family_name)
  VALUES (new_family_id, v_family_name);

  INSERT INTO public.family_members (
    family_id,
    user_id,
    name,
    contact_email,
    role
  ) VALUES (
    new_family_id,
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      SPLIT_PART(NEW.email, '@', 1),
      'Family Member'
    ),
    NEW.email,
    'owner'
  );

  RETURN NEW;
END;
$$;

-- Recreate the standard Supabase trigger that calls this function.
-- DROP IF EXISTS is safe — if the trigger has a different name it
-- won't be removed (both will then call the updated function).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
