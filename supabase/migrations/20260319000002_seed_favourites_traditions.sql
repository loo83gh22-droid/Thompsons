-- Seed Favourites and Traditions as enabled add-ons for all existing families
-- so current users see no change in their nav experience.

insert into family_enabled_features (family_id, feature_slug)
select id, 'favourites' from families
on conflict do nothing;

insert into family_enabled_features (family_id, feature_slug)
select id, 'traditions' from families
on conflict do nothing;
