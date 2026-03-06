-- ============================================================
-- Migration 079: Billing hardening
-- 1. Add file_size_bytes to voice_memos (for storage tracking)
-- 2. Cap increment_storage_used RPC at storage_limit_bytes (B4)
-- ============================================================

-- Add file_size_bytes to voice_memos so we can decrement on delete (G4/B5)
ALTER TABLE public.voice_memos
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0;

-- Update increment_storage_used to never exceed the family's limit (B4)
CREATE OR REPLACE FUNCTION public.increment_storage_used(fid uuid, bytes_to_add bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.families
  SET storage_used_bytes = LEAST(storage_used_bytes + bytes_to_add, storage_limit_bytes)
  WHERE id = fid;
$$;
