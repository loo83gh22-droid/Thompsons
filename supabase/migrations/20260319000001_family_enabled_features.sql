-- Feature add-on system: tracks which optional features each family has enabled.
-- The catalog of available features lives in application code (src/lib/feature-catalog.ts).
-- This table only stores the family's selections.

create table if not exists family_enabled_features (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  feature_slug text not null,
  enabled_at  timestamptz not null default now(),
  enabled_by  uuid references family_members(id) on delete set null,

  unique (family_id, feature_slug)
);

-- RLS: members can read their own family's enabled features
alter table family_enabled_features enable row level security;

create policy "Members can view own family features"
  on family_enabled_features for select
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

create policy "Owners and adults can manage features"
  on family_enabled_features for all
  using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and role in ('owner', 'adult')
    )
  );

-- Index for fast lookups
create index idx_family_enabled_features_family
  on family_enabled_features(family_id);

-- Seed: enable Bucket List and Reunion Planner for all existing families
-- so current users see no change in their nav.
insert into family_enabled_features (family_id, feature_slug)
select id, 'bucket-list' from families
on conflict do nothing;

insert into family_enabled_features (family_id, feature_slug)
select id, 'reunion-planner' from families
on conflict do nothing;
