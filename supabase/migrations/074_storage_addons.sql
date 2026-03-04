-- ============================================================
-- Migration 074: Storage add-ons
-- Tracks purchased additional storage packs per family.
-- Mirrors the pattern from 054_storage_tracking_rpc.sql.
-- ============================================================

CREATE TABLE public.storage_addons (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id              uuid        NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  stripe_subscription_id text        UNIQUE NOT NULL,
  bytes_added            bigint      NOT NULL,
  label                  text        NOT NULL,           -- e.g. "+25 GB"
  price_per_year_usd     integer     NOT NULL,           -- e.g. 9
  status                 text        NOT NULL DEFAULT 'active'
                                     CHECK (status IN ('active', 'cancelled')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  cancelled_at           timestamptz
);

CREATE INDEX storage_addons_family_id_idx        ON public.storage_addons (family_id);
CREATE INDEX storage_addons_subscription_id_idx  ON public.storage_addons (stripe_subscription_id);

ALTER TABLE public.storage_addons ENABLE ROW LEVEL SECURITY;

-- Family members can read their own family's add-ons
CREATE POLICY "storage_addons_family_read"
  ON public.storage_addons FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- ── RPC helpers (atomic, SECURITY DEFINER — same pattern as migration 054) ──

CREATE OR REPLACE FUNCTION public.increment_storage_limit(fid uuid, bytes_to_add bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.families
  SET storage_limit_bytes = storage_limit_bytes + bytes_to_add
  WHERE id = fid;
$$;

CREATE OR REPLACE FUNCTION public.decrement_storage_limit(fid uuid, bytes_to_subtract bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.families
  SET storage_limit_bytes = GREATEST(storage_limit_bytes - bytes_to_subtract, 0)
  WHERE id = fid;
$$;
