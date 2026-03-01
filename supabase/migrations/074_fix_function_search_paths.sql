-- ============================================================
-- Migration 074: Fix Function Search Path Mutable warnings
-- Sets search_path = '' on SECURITY DEFINER functions to
-- prevent search-path injection attacks (splinter/linter fix).
-- All table/schema references inside these functions are already
-- fully qualified (public.*, auth.*) so this is safe.
-- ============================================================

ALTER FUNCTION public.user_family_ids() SET search_path = '';
ALTER FUNCTION public.increment_storage_used(uuid, bigint) SET search_path = '';
ALTER FUNCTION public.decrement_storage_used(uuid, bigint) SET search_path = '';
