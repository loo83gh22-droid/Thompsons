-- Trip Planner: itineraries, packing lists, and travel logistics.

create table if not exists trips (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  name          text not null,
  description   text,
  destination   text,
  start_date    date,
  end_date      date,
  status        text not null default 'planning' check (status in ('planning', 'booked', 'in_progress', 'completed')),
  created_by    uuid references family_members(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists trip_itinerary_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  day_date    date,
  title       text not null,
  description text,
  location    text,
  start_time  time,
  end_time    time,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists trip_packing_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  item_name   text not null,
  assigned_to uuid references family_members(id) on delete set null,
  is_packed   boolean not null default false,
  category    text,
  created_at  timestamptz not null default now()
);

-- RLS
alter table trips enable row level security;
alter table trip_itinerary_items enable row level security;
alter table trip_packing_items enable row level security;

create policy "Members can view own family trips"
  on trips for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Adults can manage trips"
  on trips for all
  using (family_id in (select family_id from family_members where user_id = auth.uid() and role in ('owner', 'adult')));

create policy "Members can view itinerary"
  on trip_itinerary_items for select
  using (trip_id in (select id from trips where family_id in (select family_id from family_members where user_id = auth.uid())));

create policy "Adults can manage itinerary"
  on trip_itinerary_items for all
  using (trip_id in (select id from trips where family_id in (select family_id from family_members where user_id = auth.uid() and role in ('owner', 'adult'))));

create policy "Members can view packing list"
  on trip_packing_items for select
  using (trip_id in (select id from trips where family_id in (select family_id from family_members where user_id = auth.uid())));

create policy "Members can manage packing items"
  on trip_packing_items for all
  using (trip_id in (select id from trips where family_id in (select family_id from family_members where user_id = auth.uid())));
