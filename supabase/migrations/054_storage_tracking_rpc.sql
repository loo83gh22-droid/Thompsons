-- ============================================================
-- Migration 054: Storage tracking RPC functions
-- Atomic increment/decrement of storage_used_bytes
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_storage_used(fid uuid, bytes_to_add bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.families
  SET storage_used_bytes = storage_used_bytes + bytes_to_add
  WHERE id = fid;
$$;

CREATE OR REPLACE FUNCTION public.decrement_storage_used(fid uuid, bytes_to_subtract bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.families
  SET storage_used_bytes = GREATEST(0, storage_used_bytes - bytes_to_subtract)
  WHERE id = fid;
$$;
