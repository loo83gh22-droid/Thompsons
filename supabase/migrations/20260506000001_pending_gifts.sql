-- Phase A of the gift purchase flow. See docs/GIFT_FLOW_DESIGN.md.
-- Creates the pending_gifts table that holds gift purchases between
-- buyer payment and recipient redemption.
--
-- This migration is additive-safe: it creates a new table with no
-- foreign keys that could affect existing rows. No risk to existing
-- user content.

create table public.pending_gifts (
  id uuid primary key default gen_random_uuid(),

  -- The unguessable secret in the redemption URL. Generated server-side
  -- as crypto.randomBytes(32).toString('hex') (64 hex chars).
  redemption_token text not null unique,

  -- Buyer info (no account required at purchase time)
  buyer_email text not null,
  buyer_name text not null,

  -- Recipient info (account may or may not exist yet at purchase time)
  recipient_email text not null,
  recipient_name text not null,

  -- Optional message from the buyer to the recipient (max 500 chars)
  gift_message text,

  -- Plan being gifted. v1 supports Legacy only (one-time payment).
  -- 'legacy' = standard $349 Legacy
  -- 'legacy_founding' = $249 Mother's Day founding rate
  plan text not null default 'legacy',

  -- Stripe linkage. stripe_session_id is the idempotency key — the
  -- webhook is safe to fire twice because the unique constraint
  -- prevents duplicate gifts from a single payment.
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_paid_usd numeric(10,2) not null,

  -- Lifecycle:
  --   pending  → buyer paid, recipient hasn't redeemed
  --   redeemed → recipient claimed the gift (account + family + plan applied)
  --   expired  → not used in v1, reserved for future 90-day expiry
  --   refunded → manual support refund via Stripe + admin SQL
  status text not null default 'pending',

  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by_user_id uuid references auth.users(id) on delete set null,
  redeemed_into_family_id uuid references public.families(id) on delete set null,

  -- v1 ships with a 365-day expiry as a safety net but no expiration
  -- handling code yet (gifts effectively never expire in v1).
  expires_at timestamptz not null default (now() + interval '365 days'),

  constraint pending_gifts_status_check
    check (status in ('pending', 'redeemed', 'expired', 'refunded')),
  constraint pending_gifts_message_length_check
    check (gift_message is null or char_length(gift_message) <= 500),
  constraint pending_gifts_plan_check
    check (plan in ('legacy', 'legacy_founding'))
);

-- Lookup paths:
--   1. By redemption token (recipient redemption page)
--   2. By recipient email (auto-attach to existing accounts on signup)
--   3. By stripe_session_id (webhook idempotency)
create index pending_gifts_token_idx
  on public.pending_gifts (redemption_token)
  where status = 'pending';

create index pending_gifts_recipient_idx
  on public.pending_gifts (lower(recipient_email))
  where status = 'pending';

-- stripe_session_id already has a unique constraint above, no extra index needed.

-- RLS: service role only. All access goes through API routes that
-- verify the redemption token. No public read/write.
alter table public.pending_gifts enable row level security;

-- (No policies created — empty policy list with RLS enabled means
-- only service role can read/write. App code uses the server-side
-- supabase client with the service role key for these operations.)
