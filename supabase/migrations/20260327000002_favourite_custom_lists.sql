-- Favourites redesign: user-defined custom lists
-- Replaces fixed category system with family-created lists
-- Existing data is migrated into default lists

-- ── New tables ───────────────────────────────────────────────────────────────

create table if not exists public.favourite_lists (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  emoji text,
  created_by uuid references public.family_members(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.favourite_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references public.favourite_lists(id) on delete cascade not null,
  family_id uuid references public.families(id) on delete cascade not null,
  title text not null,
  notes text,
  url text,
  added_by uuid references public.family_members(id) on delete set null,
  removed_at timestamptz,
  created_at timestamptz default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.favourite_lists enable row level security;
alter table public.favourite_items enable row level security;

create policy "fav_lists_select" on public.favourite_lists for select
  using (family_id in (select public.user_family_ids()));
create policy "fav_lists_insert" on public.favourite_lists for insert
  with check (family_id in (select public.user_family_ids()));
create policy "fav_lists_update" on public.favourite_lists for update
  using (family_id in (select public.user_family_ids()));
create policy "fav_lists_delete" on public.favourite_lists for delete
  using (family_id in (select public.user_family_ids()));

create policy "fav_items_select" on public.favourite_items for select
  using (family_id in (select public.user_family_ids()));
create policy "fav_items_insert" on public.favourite_items for insert
  with check (family_id in (select public.user_family_ids()));
create policy "fav_items_update" on public.favourite_items for update
  using (family_id in (select public.user_family_ids()));
create policy "fav_items_delete" on public.favourite_items for delete
  using (family_id in (select public.user_family_ids()));

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_favourite_lists_family on public.favourite_lists(family_id, sort_order);
create index if not exists idx_favourite_items_list on public.favourite_items(list_id, created_at desc);
create index if not exists idx_favourite_items_family on public.favourite_items(family_id);

-- ── Migrate existing favourites data into default lists ───────────────────────

do $$
declare
  fam_id uuid;
  new_list_id uuid;
begin
  for fam_id in
    select distinct family_id from public.favourites where removed_at is null
  loop
    -- Books → "Books" list
    if exists (
      select 1 from public.favourites
      where family_id = fam_id and category = 'books' and removed_at is null
    ) then
      insert into public.favourite_lists (family_id, name, emoji, sort_order)
      values (fam_id, 'Books', '📚', 0)
      returning id into new_list_id;

      insert into public.favourite_items (list_id, family_id, title, notes, added_by, created_at)
      select new_list_id, fam_id,
             title,
             coalesce(nullif(trim(coalesce(description, '') || ' ' || coalesce(notes, '')), ''), null),
             added_by,
             created_at
      from public.favourites
      where family_id = fam_id and category = 'books' and removed_at is null;
    end if;

    -- Movies + Shows → "Films & Shows" list
    if exists (
      select 1 from public.favourites
      where family_id = fam_id and category in ('movies', 'shows') and removed_at is null
    ) then
      insert into public.favourite_lists (family_id, name, emoji, sort_order)
      values (fam_id, 'Films & Shows', '🎬', 1)
      returning id into new_list_id;

      insert into public.favourite_items (list_id, family_id, title, notes, added_by, created_at)
      select new_list_id, fam_id,
             title,
             coalesce(nullif(trim(coalesce(description, '') || ' ' || coalesce(notes, '')), ''), null),
             added_by,
             created_at
      from public.favourites
      where family_id = fam_id and category in ('movies', 'shows') and removed_at is null;
    end if;

    -- Music → "Music" list
    if exists (
      select 1 from public.favourites
      where family_id = fam_id and category = 'music' and removed_at is null
    ) then
      insert into public.favourite_lists (family_id, name, emoji, sort_order)
      values (fam_id, 'Music', '🎵', 2)
      returning id into new_list_id;

      insert into public.favourite_items (list_id, family_id, title, notes, added_by, created_at)
      select new_list_id, fam_id,
             title,
             coalesce(nullif(trim(coalesce(description, '') || ' ' || coalesce(notes, '')), ''), null),
             added_by,
             created_at
      from public.favourites
      where family_id = fam_id and category = 'music' and removed_at is null;
    end if;

    -- Games + Toys → "Games & Toys" list
    if exists (
      select 1 from public.favourites
      where family_id = fam_id and category in ('games', 'toys') and removed_at is null
    ) then
      insert into public.favourite_lists (family_id, name, emoji, sort_order)
      values (fam_id, 'Games & Toys', '🎲', 3)
      returning id into new_list_id;

      insert into public.favourite_items (list_id, family_id, title, notes, added_by, created_at)
      select new_list_id, fam_id,
             title,
             coalesce(nullif(trim(coalesce(description, '') || ' ' || coalesce(notes, '')), ''), null),
             added_by,
             created_at
      from public.favourites
      where family_id = fam_id and category in ('games', 'toys') and removed_at is null;
    end if;

  end loop;
end $$;
