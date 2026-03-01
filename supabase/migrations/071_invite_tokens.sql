-- ============================================================
-- Migration 071: Invite Tokens
--
-- MED-6: Invite URLs currently embed the invitee's email, name,
-- and family name as plain-text query parameters.  These appear
-- in server logs, browser history, and HTTP Referer headers.
--
-- This migration adds an opaque invite_token column so that the
-- invite URL becomes /login?mode=invited&token=<uuid> with no
-- PII exposed.  The token is resolved by /api/invite/route.ts
-- which returns {email, name, familyName} only for pending
-- (user_id IS NULL) members.
-- ============================================================

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;

-- Fast lookup when resolving the token on the login page.
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_members_invite_token
  ON public.family_members (invite_token)
  WHERE invite_token IS NOT NULL;

COMMENT ON COLUMN public.family_members.invite_token IS
  'Opaque token included in invite emails. Resolved by /api/invite to surface email/name without exposing PII in URLs. Cleared once the member links their account (user_id set).';
