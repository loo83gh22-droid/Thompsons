-- Per-member visit log for adventure locations.
-- Allows multiple visits per member per location (e.g., visited a stadium twice).
-- Each visit can have its own date, notes, and photos.

create table if not exists adventure_location_visits (
  id            uuid primary key default gen_random_uuid(),
  location_id   uuid not null references adventure_locations(id) on delete cascade,
  member_id     uuid not null references family_members(id) on delete cascade,
  visited_date  date,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Photos can be attached to a specific visit
alter table adventure_location_photos
  add column if not exists visit_id uuid references adventure_location_visits(id) on delete set null,
  add column if not exists file_size_bytes bigint;

-- RLS
alter table adventure_location_visits enable row level security;

create policy "Members can view visits for own family locations"
  on adventure_location_visits for select
  using (location_id in (
    select id from adventure_locations
    where family_id in (select family_id from family_members where user_id = auth.uid())
  ));

create policy "Members can manage visits for own family locations"
  on adventure_location_visits for all
  using (location_id in (
    select id from adventure_locations
    where family_id in (select family_id from family_members where user_id = auth.uid())
  ));

-- Indexes
create index if not exists idx_adventure_visits_location
  on adventure_location_visits(location_id);
create index if not exists idx_adventure_visits_member
  on adventure_location_visits(member_id);
create index if not exists idx_adventure_photos_visit
  on adventure_location_photos(visit_id);
