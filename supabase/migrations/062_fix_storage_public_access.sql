-- HIGH-1: Fix public storage access
-- 8 SELECT policies were scoped to {public} role, allowing unauthenticated
-- users to read family photos, videos, voice memos, and other private content.
-- The correct {authenticated}-scoped policies (authenticated_read_*) already
-- exist and are kept. Only the overly-permissive duplicates are dropped.

DROP POLICY IF EXISTS "Anyone can view achievements storage" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view home mosaic photos storage" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view journal videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view member photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view sports photos storage" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view story covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view voice memos storage" ON storage.objects;

-- Clean up orphaned death-box-files bucket (feature removed in migration 055).
-- Drop its policies and make it private.
-- The bucket itself must be deleted manually via the Supabase dashboard
-- (Storage → death-box-files → Delete bucket) since it is now empty.
DROP POLICY IF EXISTS "Authenticated users can manage death box files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload death box files" ON storage.objects;

UPDATE storage.buckets SET public = false WHERE id = 'death-box-files';
