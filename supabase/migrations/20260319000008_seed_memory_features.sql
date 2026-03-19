-- Seed all existing families with the newly-cataloged memory features.
-- These were previously hardcoded in the nav, so all families should have
-- them enabled by default so nothing disappears.
--
-- Uses ON CONFLICT DO NOTHING so it's safe to run multiple times and
-- won't duplicate rows for families that already have some of these.

insert into family_enabled_features (family_id, feature_slug)
select f.id, slug.val
from families f
cross join (
  values
    ('stories'),
    ('recipes'),
    ('voice-memos'),
    ('one-line'),
    ('artwork'),
    ('trophy-case'),
    ('time-capsules')
) as slug(val)
on conflict (family_id, feature_slug) do nothing;
