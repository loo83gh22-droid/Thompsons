-- Activation funnel snapshot — paste into Supabase MCP execute_sql
-- to get a quick read on the current state. Run weekly until we
-- have a proper dashboard.
--
-- Depends on view public.activation_funnel
-- (see supabase/migrations/20260515000001_activation_funnel_view.sql)

-- ── 1) Aggregate funnel for ALL families ──────────────────────────────
SELECT
  count(*) AS total_families,
  count(*) FILTER (WHERE email_confirmed) AS confirmed,
  count(*) FILTER (WHERE activated) AS activated,
  count(*) FILTER (WHERE invited_someone) AS invited_someone,
  count(*) FILTER (WHERE returned_day_2_plus) AS returned_day_2_plus,
  count(*) FILTER (WHERE returned_day_7_plus) AS returned_day_7_plus,
  round(
    100.0 * count(*) FILTER (WHERE activated) / nullif(count(*), 0),
    1
  ) AS activation_rate_pct,
  round(
    100.0 * count(*) FILTER (WHERE invited_someone) / nullif(count(*), 0),
    1
  ) AS invite_rate_pct,
  round(
    100.0 * count(*) FILTER (WHERE returned_day_2_plus) / nullif(count(*), 0),
    1
  ) AS d2_return_rate_pct
FROM public.activation_funnel;

-- ── 2) Same funnel but cohorted by signup week ───────────────────────
SELECT
  date_trunc('week', family_created_at)::date AS signup_week,
  count(*) AS signups,
  count(*) FILTER (WHERE activated) AS activated,
  count(*) FILTER (WHERE invited_someone) AS invited_someone,
  count(*) FILTER (WHERE returned_day_2_plus) AS returned_d2
FROM public.activation_funnel
WHERE family_created_at > now() - interval '90 days'
GROUP BY signup_week
ORDER BY signup_week DESC;

-- ── 3) Last 14 days of signups, per-family detail ────────────────────
SELECT
  family_created_at::date AS signed_up,
  owner_email,
  family_name,
  plan_type,
  email_confirmed,
  activated,
  invited_someone,
  returned_day_2_plus,
  journal_count,
  photo_count,
  voice_memo_count,
  member_count
FROM public.activation_funnel
WHERE family_created_at > now() - interval '14 days'
ORDER BY family_created_at DESC;
