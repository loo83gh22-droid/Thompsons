-- Shared table for map-based adventure features: MLB Stadium Tour, Fishing Map, National Parks.
-- Each feature uses the same structure: locations pinned on a map with photos and notes.

create table if not exists adventure_locations (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  feature_slug  text not null,  -- 'mlb-stadium-tour', 'fishing-map', 'national-parks'
  name          text not null,
  description   text,
  latitude      double precision,
  longitude     double precision,
  visited       boolean not null default false,
  visited_date  date,
  rating        int check (rating between 1 and 5),
  notes         text,
  added_by      uuid references family_members(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists adventure_location_photos (
  id            uuid primary key default gen_random_uuid(),
  location_id   uuid not null references adventure_locations(id) on delete cascade,
  storage_path  text not null,
  caption       text,
  uploaded_by   uuid references family_members(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- RLS
alter table adventure_locations enable row level security;
alter table adventure_location_photos enable row level security;

create policy "Members can view own family adventure locations"
  on adventure_locations for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Members can manage adventure locations"
  on adventure_locations for all
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Members can view adventure photos"
  on adventure_location_photos for select
  using (location_id in (select id from adventure_locations where family_id in (select family_id from family_members where user_id = auth.uid())));

create policy "Members can manage adventure photos"
  on adventure_location_photos for all
  using (location_id in (select id from adventure_locations where family_id in (select family_id from family_members where user_id = auth.uid())));

-- Indexes
create index idx_adventure_locations_family_feature
  on adventure_locations(family_id, feature_slug);
