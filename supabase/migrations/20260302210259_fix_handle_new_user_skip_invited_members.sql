-- Migration: fix_handle_new_user_skip_invited_members
-- Applied: 2026-03-02
--
-- ROOT CAUSE: The handle_new_user() trigger fires on EVERY auth.users INSERT,
-- including when an invited user signs up via admin.generateLink(). This
-- unconditionally created a new "Our Family" for every new auth user — even
-- invited members who already have a family_members row waiting for them.
-- Result: invited users ended up as owners of a spurious "Our Family" as well
-- as members of the family they were actually invited to.
--
-- FIX: Before creating a new family, check whether the incoming user's email
-- already has a pending family_members row (contact_email match, user_id IS NULL).
-- If so, link the user_id on those rows and return early — no new family created.
-- If not (genuine new signup), create the family as before.
--
-- This replaces the unapplied local file 075_handle_new_user_invite_aware.sql.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_family_id      uuid;
  user_full_name     text;
  user_family_name   text;
  user_relationship  text;
  pending_invite_count int;
BEGIN
  -- Extract metadata passed at signup time
  user_full_name    := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(NEW.email, '@', 1));
  user_family_name  := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'family_name'), ''), 'Our Family');
  user_relationship := NEW.raw_user_meta_data->>'relationship';

  -- Check for a pending invite: a family_members row with this email and no user_id yet.
  -- Case-insensitive to handle capitalisation differences (e.g. Gmail normalises to lowercase).
  SELECT COUNT(*) INTO pending_invite_count
  FROM public.family_members
  WHERE LOWER(contact_email) = LOWER(NEW.email)
    AND user_id IS NULL;

  -- Invited user: link them to the existing family member row(s) and skip creating a new family.
  -- The auth callback (/auth/callback) and dashboard layout also perform this linking as a
  -- belt-and-suspenders measure, so doing it here too is safe and idempotent.
  IF pending_invite_count > 0 THEN
    UPDATE public.family_members
    SET user_id = NEW.id
    WHERE LOWER(contact_email) = LOWER(NEW.email)
      AND user_id IS NULL;
    RETURN NEW;
  END IF;

  -- No pending invite: genuine new signup — create their family as before.
  INSERT INTO public.families (name)
  VALUES (user_family_name)
  RETURNING id INTO new_family_id;

  INSERT INTO public.family_settings (family_id, family_name)
  VALUES (new_family_id, user_family_name);

  INSERT INTO public.family_members (
    user_id,
    name,
    family_id,
    contact_email,
    relationship,
    role
  )
  VALUES (
    NEW.id,
    user_full_name,
    new_family_id,
    NEW.email,
    user_relationship,
    'owner'
  );

  RETURN NEW;
END;
$function$;
