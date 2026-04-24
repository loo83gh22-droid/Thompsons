-- Fix: previous memories_consolidation migration inserted
-- family_enabled_features rows with feature_slug = 'letters', but the
-- catalog slug is 'family-letters'. This rename makes the rows line up
-- with the catalog so Letters reappears in the nav for every family
-- that was supposed to keep it.
update family_enabled_features
set feature_slug = 'family-letters'
where feature_slug = 'letters';
