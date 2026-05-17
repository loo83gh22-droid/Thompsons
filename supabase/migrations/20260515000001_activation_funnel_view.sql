-- Activation funnel view ─────────────────────────────────────────────
-- Per-family snapshot of where each Nest sits in the activation funnel:
--   signup → confirm → create family → first entry → invite someone
--   → return on day 2+
--
-- Backs ad-hoc KPI queries via Supabase MCP. We can build a UI on top
-- later; for now, the goal is to give us a single SELECT that
-- answers "of last week's signups, how many activated?"
--
-- Pure CREATE VIEW — additive-safe, no data loss, idempotent via
-- CREATE OR REPLACE.
--
-- Security: SECURITY INVOKER is the default. The view queries
-- auth.users (service-role only) and public tables. Regular users
-- selecting this view will get whatever their RLS scopes allow,
-- which means an empty result for non-admin queries. Admin queries
-- through Supabase MCP use service-role and can see everything.

CREATE OR REPLACE VIEW public.activation_funnel
WITH (security_invoker = true)
AS
SELECT
  f.id AS family_id,
  f.name AS family_name,
  f.created_at AS family_created_at,
  f.plan_type,
  u.email AS owner_email,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  u.last_sign_in_at,

  -- Counts of the content types that "matter" for activation.
  (SELECT count(*) FROM public.family_members WHERE family_id = f.id) AS member_count,
  (SELECT count(*) FROM public.journal_entries WHERE family_id = f.id) AS journal_count,
  (SELECT count(*) FROM public.voice_memos WHERE family_id = f.id) AS voice_memo_count,
  (SELECT count(*) FROM public.home_mosaic_photos WHERE family_id = f.id) AS photo_count,
  (SELECT count(*) FROM public.family_stories WHERE family_id = f.id) AS story_count,
  (SELECT count(*) FROM public.time_capsules WHERE family_id = f.id) AS time_capsule_count,

  -- First-event timestamps — useful for "time to first value" KPIs.
  (SELECT min(created_at) FROM public.journal_entries WHERE family_id = f.id) AS first_journal_at,
  (SELECT min(created_at) FROM public.home_mosaic_photos WHERE family_id = f.id) AS first_photo_at,
  (SELECT min(created_at) FROM public.voice_memos WHERE family_id = f.id) AS first_voice_memo_at,

  -- Boolean stage gates.
  (
    EXISTS (SELECT 1 FROM public.journal_entries WHERE family_id = f.id) OR
    EXISTS (SELECT 1 FROM public.voice_memos WHERE family_id = f.id) OR
    EXISTS (SELECT 1 FROM public.home_mosaic_photos WHERE family_id = f.id) OR
    EXISTS (SELECT 1 FROM public.family_stories WHERE family_id = f.id)
  ) AS activated,

  (
    (SELECT count(*) FROM public.family_members WHERE family_id = f.id) > 1
  ) AS invited_someone,

  (
    u.last_sign_in_at IS NOT NULL
    AND u.last_sign_in_at > u.created_at + interval '24 hours'
  ) AS returned_day_2_plus,

  (
    u.last_sign_in_at IS NOT NULL
    AND u.last_sign_in_at > u.created_at + interval '7 days'
  ) AS returned_day_7_plus

FROM public.families f
LEFT JOIN public.family_members fm
  ON fm.family_id = f.id AND fm.role = 'owner'
LEFT JOIN auth.users u
  ON u.id = fm.user_id;

COMMENT ON VIEW public.activation_funnel IS
  'Activation funnel per family. Queried via MCP for KPI snapshots: signups → activations → invites → returns. See scripts/funnel-snapshot.sql for usage.';
