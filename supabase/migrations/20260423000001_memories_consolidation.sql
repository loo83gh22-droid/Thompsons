-- Memories consolidation:
--   1. "One Line A Day" feature is removed entirely from the app. Remove any
--      enablement rows for it so it stops appearing in anyone's nav. (The
--      `one_line_entries` table is left in place to avoid deleting user data;
--      it simply becomes dead storage with no UI surfacing it.)
--   2. "Letters" is being demoted from always-visible core nav to an opt-in
--      Feature Catalog add-on. To preserve existing behaviour for families
--      who may have written letters, backfill `letters` enablement for every
--      family. New families created after this migration do NOT get letters
--      enabled by default — they opt in via the catalog.
--
-- Both operations are idempotent (ON CONFLICT DO NOTHING / DELETE WHERE).

-- 1. Remove stale enablements for the removed "one-line" feature.
delete from family_enabled_features
where feature_slug = 'one-line';

-- 2. Backfill "letters" for all existing families so their nav doesn't lose it.
insert into family_enabled_features (family_id, feature_slug)
select id, 'letters' from families
on conflict (family_id, feature_slug) do nothing;
