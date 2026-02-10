-- Map pin clustering: group nearby entries at same location under one pin

-- Create location_clusters table
create table if not exists public.location_clusters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  location_name text not null,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  date_range_start date,
  date_range_end date,
  entry_count integer default 1,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Add location_cluster_id to travel_locations (pins come from here)
alter table public.travel_locations
  add column if not exists location_cluster_id uuid references public.location_clusters(id) on delete set null;

-- Indexes for performance
create index if not exists idx_location_clusters_coords on public.location_clusters(latitude, longitude);
create index if not exists idx_location_clusters_family_id on public.location_clusters(family_id);
create index if not exists idx_travel_locations_location_cluster on public.travel_locations(location_cluster_id);

-- RLS
alter table public.location_clusters enable row level security;

create policy "Users can view location clusters in own families"
  on public.location_clusters for select
  using (family_id in (select public.user_family_ids()));

create policy "Users can create location clusters"
  on public.location_clusters for insert
  with check (family_id in (select public.user_family_ids()));

create policy "Users can update location clusters in own families"
  on public.location_clusters for update
  using (family_id in (select public.user_family_ids()));
