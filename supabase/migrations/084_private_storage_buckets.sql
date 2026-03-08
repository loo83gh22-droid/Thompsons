-- 084: Harden storage bucket visibility (privacy audit E1 + E2)
--
-- Context:
--   Migration 062 dropped all "Anyone can view ..." RLS SELECT policies but
--   left the underlying bucket public flag as true for every bucket except
--   death-box-files.  Migration 078 then set journal-photos to private.
--
--   When a Supabase bucket has public = true the Supabase CDN serves any file
--   at /storage/v1/object/public/<bucket>/<path> without authentication,
--   completely bypassing RLS.  Dropping the RLS policy alone does NOT close
--   this gap.
--
-- What this migration does:
--   1. Sets all remaining public buckets to private (public = false).
--   2. Migrates legacy voice-memo audio_url values that were stored as CDN
--      URLs (/storage/v1/object/public/voice-memos/…) to the authenticated
--      proxy path (/api/storage/voice-memos/…) so the app can continue to
--      serve them through the existing authenticated proxy route.
--
-- Buckets affected:
--   E1 (Critical) voice-memos      — private audio recordings
--   E2 (High)     home-mosaic      — family photos
--   E2 (High)     sports-photos    — family sports photos
--   E2 (High)     achievements     — achievement badge images
--   E2 (High)     member-photos    — profile photos (includes minors)
--   E2 (High)     story-covers     — story cover images
--   E2 (High)     journal-videos   — private family videos
--
-- Safe to apply on production: all existing authenticated-read RLS policies
-- remain in place, so the app's authenticated proxy (/api/storage/…) and
-- any signed URLs continue to work without change.

-- ── 1. Set all remaining public buckets to private ────────────────────────────

UPDATE storage.buckets
SET public = false
WHERE id IN (
  'voice-memos',
  'home-mosaic',
  'sports-photos',
  'achievements',
  'member-photos',
  'story-covers',
  'journal-videos'
);

-- ── 2. Migrate legacy voice-memo CDN URLs to authenticated proxy path ─────────
--
-- Old format: https://<project>.supabase.co/storage/v1/object/public/voice-memos/<path>
-- New format: /api/storage/voice-memos/<path>
--
-- The regexp extracts everything after "/voice-memos/" from the CDN URL and
-- reconstructs the proxy path.  Rows that already use the proxy path
-- (audio_url LIKE '/api/storage/%') are untouched by the WHERE clause.

UPDATE public.voice_memos
SET audio_url = '/api/storage/voice-memos/' ||
                regexp_replace(
                  audio_url,
                  '^.*/storage/v1/object/public/voice-memos/',
                  ''
                )
WHERE audio_url LIKE '%/storage/v1/object/public/voice-memos/%';
