-- Our Teams feature
-- teams: season sports teams, clubs, and activities with photo gallery and map pin

create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  sport_or_activity text not null,
  season text check (season in ('Spring', 'Summer', 'Fall', 'Winter', 'Year-round')),
  year int,
  city text,
  description text,
  cover_photo_id uuid,
  created_by uuid references public.family_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.team_members (
  team_id uuid references public.teams(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  role text not null default 'Player' check (role in ('Player', 'Coach', 'Manager', 'Supporter')),
  primary key (team_id, family_member_id)
);

create table if not exists public.team_photos (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade not null,
  family_id uuid references public.families(id) on delete cascade not null,
  url text not null,
  caption text,
  sort_order int default 0,
  file_size_bytes bigint default 0,
  uploaded_by uuid references public.family_members(id) on delete set null,
  created_at timestamptz default now()
);

-- Link travel_locations to teams so the map knows which team created the pin
alter table public.travel_locations
  add column if not exists team_id uuid references public.teams(id) on delete set null;

-- RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_photos enable row level security;

create policy "Family members can view teams"
  on public.teams for select
  using (family_id in (select public.user_family_ids()));

create policy "Family members can create teams"
  on public.teams for insert
  with check (family_id in (select public.user_family_ids()));

create policy "Family members can update teams"
  on public.teams for update
  using (family_id in (select public.user_family_ids()));

create policy "Family members can delete teams"
  on public.teams for delete
  using (family_id in (select public.user_family_ids()));

create policy "Family members can view team_members"
  on public.team_members for select
  using (
    team_id in (
      select id from public.teams where family_id in (select public.user_family_ids())
    )
  );

create policy "Family members can manage team_members"
  on public.team_members for all
  using (
    team_id in (
      select id from public.teams where family_id in (select public.user_family_ids())
    )
  );

create policy "Family members can view team_photos"
  on public.team_photos for select
  using (family_id in (select public.user_family_ids()));

create policy "Family members can manage team_photos"
  on public.team_photos for all
  using (family_id in (select public.user_family_ids()));

-- Indexes
create index if not exists idx_teams_family_id on public.teams(family_id);
create index if not exists idx_teams_family_created on public.teams(family_id, created_at desc);
create index if not exists idx_team_photos_team_id on public.team_photos(team_id);
create index if not exists idx_travel_locations_team_id on public.travel_locations(team_id);
