-- ============================================================
-- Migration 070: Privacy Hardening
--
-- Fixes three RLS issues identified in the privacy audit:
--
-- HIGH-5: Nest Keepers — tighten write access to owners only.
--         The original migration allowed any family member to
--         INSERT/UPDATE/DELETE nest_keepers at the DB layer.
--
-- MED-1:  Public story/recipe shares — require the actual share
--         token to be provided rather than just is_public=true.
--         Previously any anon caller who knew the row's UUID
--         could read the full row, bypassing the token mechanism.
--
-- HIGH-1: home_mosaic_photos — scope the public SELECT policy
--         to only rows with no family_id (legacy landing-page
--         photos). Family-scoped mosaic photos now require
--         membership, matching the intent of migration 025.
-- ============================================================

-- ── HIGH-5: Nest Keepers owner-only writes ─────────────────────────────────

-- Drop the overly-permissive policies that allowed any family member to write.
DROP POLICY IF EXISTS "Users can insert nest_keepers in own families" ON public.nest_keepers;
DROP POLICY IF EXISTS "Users can update nest_keepers in own families" ON public.nest_keepers;
DROP POLICY IF EXISTS "Users can delete nest_keepers in own families" ON public.nest_keepers;

-- Replace with owner-only write policies.
CREATE POLICY "Only owners can insert nest_keepers"
  ON public.nest_keepers FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id
      FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'owner'
    )
  );

CREATE POLICY "Only owners can update nest_keepers"
  ON public.nest_keepers FOR UPDATE
  USING (
    family_id IN (
      SELECT fm.family_id
      FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'owner'
    )
  );

CREATE POLICY "Only owners can delete nest_keepers"
  ON public.nest_keepers FOR DELETE
  USING (
    family_id IN (
      SELECT fm.family_id
      FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'owner'
    )
  );


-- ── MED-1: Public shares — require token match ─────────────────────────────
-- The original policies used (is_public = true AND share_token IS NOT NULL),
-- which meant anyone with just the row's UUID and the anon key could read the
-- full row without knowing the token.  The token check must be in the USING
-- clause, but Postgres RLS cannot reference request parameters directly, so
-- we enforce this via a helper function that the app calls with current_setting.
--
-- Simpler approach: drop the anonymous-access policies entirely and enforce
-- public access only through the dedicated /share/[token] API route which
-- validates the token in application code before calling the service-role
-- client.  Authenticated family members still access their own stories via
-- the standard family-scoped policies.

DROP POLICY IF EXISTS "Anyone can read publicly shared stories" ON public.family_stories;
DROP POLICY IF EXISTS "Anyone can read publicly shared recipes" ON public.recipes;

-- Public share reads are now handled exclusively by the service-role client
-- in /app/share/[token]/page.tsx, which validates the token before fetching.
-- No anon-level RLS policy is needed.


-- ── HIGH-1: home_mosaic_photos — scope public access to legacy rows ─────────
-- Migration 025 added family_id to this table but left the SELECT policy as
-- using (true), exposing all families' mosaic rows to anonymous callers.
-- Scope public SELECT to rows where family_id IS NULL (original landing-page
-- photos that predate multi-tenancy).  Family-scoped rows are still readable
-- by family members via the existing "Users can manage home mosaic photos in
-- own families" policy.

DROP POLICY IF EXISTS "Anyone can view home mosaic photos" ON public.home_mosaic_photos;

CREATE POLICY "Public can view legacy mosaic photos"
  ON public.home_mosaic_photos FOR SELECT
  USING (family_id IS NULL);
