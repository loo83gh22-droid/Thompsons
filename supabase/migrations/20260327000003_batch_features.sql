-- ============================================================
-- Batch Features Round 2
-- Family Quotes, Predictions, Awards Night, Our Homes,
-- Family Films, Game Night Log, Volunteer Log, Family Garden
-- ============================================================

-- ── 1. Family Quotes ─────────────────────────────────────────────────────────

create table if not exists family_quotes (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  quote        text not null,
  said_by      uuid references family_members(id) on delete set null,
  context      text,
  date_said    date,
  added_by     uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table family_quotes enable row level security;

create policy "family_quotes_select" on family_quotes
  for select using (family_id in (select public.user_family_ids()));

create policy "family_quotes_insert" on family_quotes
  for insert with check (family_id in (select public.user_family_ids()));

create policy "family_quotes_update" on family_quotes
  for update using (family_id in (select public.user_family_ids()));

create policy "family_quotes_delete" on family_quotes
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_quotes_family on family_quotes(family_id);

-- ── 2. Family Predictions ─────────────────────────────────────────────────────

create table if not exists family_predictions (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  topic        text not null,
  target_date  date,
  outcome      text,
  resolved_at  timestamptz,
  created_by   uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists family_prediction_entries (
  id            uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references family_predictions(id) on delete cascade,
  family_id     uuid not null references families(id) on delete cascade,
  member_id     uuid references family_members(id) on delete set null,
  prediction    text not null,
  is_correct    boolean,
  created_at    timestamptz not null default now()
);

alter table family_predictions enable row level security;
alter table family_prediction_entries enable row level security;

create policy "family_predictions_select" on family_predictions
  for select using (family_id in (select public.user_family_ids()));
create policy "family_predictions_insert" on family_predictions
  for insert with check (family_id in (select public.user_family_ids()));
create policy "family_predictions_update" on family_predictions
  for update using (family_id in (select public.user_family_ids()));
create policy "family_predictions_delete" on family_predictions
  for delete using (family_id in (select public.user_family_ids()));

create policy "prediction_entries_select" on family_prediction_entries
  for select using (family_id in (select public.user_family_ids()));
create policy "prediction_entries_insert" on family_prediction_entries
  for insert with check (family_id in (select public.user_family_ids()));
create policy "prediction_entries_update" on family_prediction_entries
  for update using (family_id in (select public.user_family_ids()));
create policy "prediction_entries_delete" on family_prediction_entries
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_predictions_family on family_predictions(family_id);
create index idx_prediction_entries_prediction on family_prediction_entries(prediction_id);

-- ── 3. Family Awards Night ────────────────────────────────────────────────────

create table if not exists family_awards (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  award_name   text not null,
  recipient_id uuid references family_members(id) on delete set null,
  year         int not null default extract(year from now())::int,
  description  text,
  is_roast     boolean not null default false,
  given_by     uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table family_awards enable row level security;

create policy "family_awards_select" on family_awards
  for select using (family_id in (select public.user_family_ids()));
create policy "family_awards_insert" on family_awards
  for insert with check (family_id in (select public.user_family_ids()));
create policy "family_awards_update" on family_awards
  for update using (family_id in (select public.user_family_ids()));
create policy "family_awards_delete" on family_awards
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_awards_family on family_awards(family_id);
create index idx_family_awards_recipient on family_awards(recipient_id);

-- ── 4. Our Homes ──────────────────────────────────────────────────────────────

create table if not exists family_homes (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  address      text,
  city         text,
  from_year    int,
  to_year      int,                    -- null = current home
  notes        text,
  cover_photo_path text,
  cover_photo_bucket text,
  created_by   uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists family_home_members (
  home_id   uuid not null references family_homes(id) on delete cascade,
  member_id uuid not null references family_members(id) on delete cascade,
  primary key (home_id, member_id)
);

create table if not exists family_home_photos (
  id           uuid primary key default gen_random_uuid(),
  home_id      uuid not null references family_homes(id) on delete cascade,
  family_id    uuid not null references families(id) on delete cascade,
  storage_path text not null,
  bucket       text not null default 'home-photos',
  size_bytes   bigint not null default 0,
  uploaded_by  uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- add home_id to travel_locations for map pin
alter table travel_locations add column if not exists home_id uuid references family_homes(id) on delete set null;

alter table family_homes enable row level security;
alter table family_home_members enable row level security;
alter table family_home_photos enable row level security;

create policy "family_homes_select" on family_homes
  for select using (family_id in (select public.user_family_ids()));
create policy "family_homes_insert" on family_homes
  for insert with check (family_id in (select public.user_family_ids()));
create policy "family_homes_update" on family_homes
  for update using (family_id in (select public.user_family_ids()));
create policy "family_homes_delete" on family_homes
  for delete using (family_id in (select public.user_family_ids()));

create policy "home_members_select" on family_home_members
  for select using (exists (select 1 from family_homes h where h.id = home_id and h.family_id in (select public.user_family_ids())));
create policy "home_members_insert" on family_home_members
  for insert with check (exists (select 1 from family_homes h where h.id = home_id and h.family_id in (select public.user_family_ids())));
create policy "home_members_delete" on family_home_members
  for delete using (exists (select 1 from family_homes h where h.id = home_id and h.family_id in (select public.user_family_ids())));

create policy "home_photos_select" on family_home_photos
  for select using (family_id in (select public.user_family_ids()));
create policy "home_photos_insert" on family_home_photos
  for insert with check (family_id in (select public.user_family_ids()));
create policy "home_photos_delete" on family_home_photos
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_homes_family on family_homes(family_id);
create index idx_home_photos_home on family_home_photos(home_id);

-- ── 5. Family Films ───────────────────────────────────────────────────────────

create table if not exists family_films (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  title        text not null,
  type         text not null default 'movie' check (type in ('movie', 'series')),
  status       text not null default 'want_to_watch' check (status in ('want_to_watch', 'watching', 'watched')),
  is_family_pick boolean not null default false,
  rating       int check (rating >= 1 and rating <= 5),
  notes        text,
  added_by     uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table family_films enable row level security;

create policy "family_films_select" on family_films
  for select using (family_id in (select public.user_family_ids()));
create policy "family_films_insert" on family_films
  for insert with check (family_id in (select public.user_family_ids()));
create policy "family_films_update" on family_films
  for update using (family_id in (select public.user_family_ids()));
create policy "family_films_delete" on family_films
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_films_family on family_films(family_id);

-- ── 6. Game Night Log ─────────────────────────────────────────────────────────

create table if not exists family_games (
  id        uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name      text not null,
  created_at timestamptz not null default now(),
  unique (family_id, name)
);

create table if not exists game_night_sessions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  game_id    uuid references family_games(id) on delete set null,
  played_on  date not null default current_date,
  winner_id  uuid references family_members(id) on delete set null,
  notes      text,
  created_by uuid references family_members(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table family_games enable row level security;
alter table game_night_sessions enable row level security;

create policy "family_games_select" on family_games
  for select using (family_id in (select public.user_family_ids()));
create policy "family_games_insert" on family_games
  for insert with check (family_id in (select public.user_family_ids()));
create policy "family_games_delete" on family_games
  for delete using (family_id in (select public.user_family_ids()));

create policy "game_sessions_select" on game_night_sessions
  for select using (family_id in (select public.user_family_ids()));
create policy "game_sessions_insert" on game_night_sessions
  for insert with check (family_id in (select public.user_family_ids()));
create policy "game_sessions_update" on game_night_sessions
  for update using (family_id in (select public.user_family_ids()));
create policy "game_sessions_delete" on game_night_sessions
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_games_family on family_games(family_id);
create index idx_game_sessions_family on game_night_sessions(family_id);

-- ── 7. Volunteer Log ──────────────────────────────────────────────────────────

create table if not exists volunteer_entries (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families(id) on delete cascade,
  organization    text not null,
  date            date not null,
  hours           numeric(5,1),
  description     text,
  cause_tags      text[],
  city            text,
  cover_photo_path text,
  cover_photo_bucket text,
  added_by        uuid references family_members(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists volunteer_entry_members (
  entry_id  uuid not null references volunteer_entries(id) on delete cascade,
  member_id uuid not null references family_members(id) on delete cascade,
  primary key (entry_id, member_id)
);

create table if not exists volunteer_photos (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null references volunteer_entries(id) on delete cascade,
  family_id    uuid not null references families(id) on delete cascade,
  storage_path text not null,
  bucket       text not null default 'volunteer-photos',
  size_bytes   bigint not null default 0,
  uploaded_by  uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table volunteer_entries add column if not exists map_location_id uuid references travel_locations(id) on delete set null;

alter table volunteer_entries enable row level security;
alter table volunteer_entry_members enable row level security;
alter table volunteer_photos enable row level security;

create policy "volunteer_entries_select" on volunteer_entries
  for select using (family_id in (select public.user_family_ids()));
create policy "volunteer_entries_insert" on volunteer_entries
  for insert with check (family_id in (select public.user_family_ids()));
create policy "volunteer_entries_update" on volunteer_entries
  for update using (family_id in (select public.user_family_ids()));
create policy "volunteer_entries_delete" on volunteer_entries
  for delete using (family_id in (select public.user_family_ids()));

create policy "volunteer_members_select" on volunteer_entry_members
  for select using (exists (select 1 from volunteer_entries e where e.id = entry_id and e.family_id in (select public.user_family_ids())));
create policy "volunteer_members_insert" on volunteer_entry_members
  for insert with check (exists (select 1 from volunteer_entries e where e.id = entry_id and e.family_id in (select public.user_family_ids())));
create policy "volunteer_members_delete" on volunteer_entry_members
  for delete using (exists (select 1 from volunteer_entries e where e.id = entry_id and e.family_id in (select public.user_family_ids())));

create policy "volunteer_photos_select" on volunteer_photos
  for select using (family_id in (select public.user_family_ids()));
create policy "volunteer_photos_insert" on volunteer_photos
  for insert with check (family_id in (select public.user_family_ids()));
create policy "volunteer_photos_delete" on volunteer_photos
  for delete using (family_id in (select public.user_family_ids()));

create index idx_volunteer_entries_family on volunteer_entries(family_id);
create index idx_volunteer_photos_entry on volunteer_photos(entry_id);

-- ── 8. Family Garden ─────────────────────────────────────────────────────────

create table if not exists garden_entries (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  season       text not null check (season in ('spring', 'summer', 'fall', 'winter', 'year-round')),
  year         int not null default extract(year from now())::int,
  title        text,
  notes        text,
  cover_photo_path text,
  cover_photo_bucket text,
  created_by   uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists garden_plants (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references garden_entries(id) on delete cascade,
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null,
  type       text check (type in ('vegetable', 'fruit', 'herb', 'flower', 'tree', 'shrub', 'other')),
  yield_notes text,
  created_at timestamptz not null default now()
);

create table if not exists garden_photos (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null references garden_entries(id) on delete cascade,
  family_id    uuid not null references families(id) on delete cascade,
  storage_path text not null,
  bucket       text not null default 'garden-photos',
  size_bytes   bigint not null default 0,
  uploaded_by  uuid references family_members(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table garden_entries enable row level security;
alter table garden_plants enable row level security;
alter table garden_photos enable row level security;

create policy "garden_entries_select" on garden_entries
  for select using (family_id in (select public.user_family_ids()));
create policy "garden_entries_insert" on garden_entries
  for insert with check (family_id in (select public.user_family_ids()));
create policy "garden_entries_update" on garden_entries
  for update using (family_id in (select public.user_family_ids()));
create policy "garden_entries_delete" on garden_entries
  for delete using (family_id in (select public.user_family_ids()));

create policy "garden_plants_select" on garden_plants
  for select using (family_id in (select public.user_family_ids()));
create policy "garden_plants_insert" on garden_plants
  for insert with check (family_id in (select public.user_family_ids()));
create policy "garden_plants_update" on garden_plants
  for update using (family_id in (select public.user_family_ids()));
create policy "garden_plants_delete" on garden_plants
  for delete using (family_id in (select public.user_family_ids()));

create policy "garden_photos_select" on garden_photos
  for select using (family_id in (select public.user_family_ids()));
create policy "garden_photos_insert" on garden_photos
  for insert with check (family_id in (select public.user_family_ids()));
create policy "garden_photos_delete" on garden_photos
  for delete using (family_id in (select public.user_family_ids()));

create index idx_garden_entries_family on garden_entries(family_id);
create index idx_garden_plants_entry on garden_plants(entry_id);
create index idx_garden_photos_entry on garden_photos(entry_id);

-- Storage buckets for photo features
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('home-photos',      'home-photos',      false, 10485760, array['image/jpeg','image/png','image/webp','image/heic']),
  ('volunteer-photos', 'volunteer-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic']),
  ('garden-photos',    'garden-photos',    false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;
