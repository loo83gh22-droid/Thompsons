-- ============================================================
-- Migration 078: Make journal-photos bucket private
--
-- ISSUE (E1 from privacy audit):
--   The journal-photos bucket was created with public = true in
--   migration 001.  Migration 062 dropped the "Anyone can view
--   journal photos" RLS policy, but left the bucket public flag
--   set to true.  When a Supabase bucket is public, raw CDN URLs
--   of the form:
--     https://<project>.supabase.co/storage/v1/object/public/journal-photos/...
--   are accessible to anyone on the internet without authentication,
--   bypassing RLS entirely.
--
-- FIX:
--   1. Flip the bucket to private (public = false).
--   2. Add an authenticated SELECT policy so that the storage
--      proxy at /api/storage/[...path] can continue to generate
--      signed URLs on behalf of logged-in users.
--
-- The app always serves photos through /api/storage/journal-photos/...
-- which enforces Supabase session auth before calling createSignedUrl.
-- After this migration, direct Supabase CDN URLs will return 400/403,
-- and only the auth-gated proxy route will work.
-- ============================================================

-- 1. Make the bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'journal-photos';

-- 2. Add authenticated SELECT policy so signed URL generation works.
--    (The "Anyone can view journal photos" policy was already dropped
--    in migration 062 — this restores read access for authenticated
--    users only.)
DROP POLICY IF EXISTS "Authenticated users can read journal photos" ON storage.objects;

CREATE POLICY "Authenticated users can read journal photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'journal-photos'
    AND auth.role() = 'authenticated'
  );
