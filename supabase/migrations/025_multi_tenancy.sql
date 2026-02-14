-- Multi-tenancy: each family has isolated data; users can belong to multiple families

-- 1. Create families table
create table if not exists public.families (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Our Family',
  created_at timestamptz default now()
);

alter table public.families enable row level security;

-- 2. Create default family from existing family_settings
insert into public.families (name)
select coalesce(nullif(trim(family_name), ''), 'Our Family')
from public.family_settings
limit 1;

-- If no family_settings row existed, insert default
insert into public.families (name)
select 'Our Family'
where not exists (select 1 from public.families);

-- 3. Add family_id to family_members (allows user in multiple families)
alter table public.family_members add column if not exists family_id uuid references public.families(id) on delete cascade;

-- Backfill: assign all existing members to the default family
update public.family_members
set family_id = (select id from public.families limit 1)
where family_id is null;

alter table public.family_members alter column family_id set not null;

-- Drop unique on user_id so same user can be in multiple families
alter table public.family_members drop constraint if exists family_members_user_id_key;

create index if not exists idx_family_members_family_id on public.family_members(family_id);
create index if not exists idx_family_members_user_id on public.family_members(user_id);

-- 4. Add family_id to family_settings (one row per family)
alter table public.family_settings add column if not exists family_id uuid references public.families(id) on delete cascade;

update public.family_settings
set family_id = (select id from public.families limit 1)
where family_id is null;

-- One family_settings per family; ensure existing row is linked
alter table public.family_settings alter column family_id set not null;
create unique index if not exists idx_family_settings_family_id on public.family_settings(family_id);

-- 5. Helper: returns family IDs the current user belongs to
create or replace function public.user_family_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select fm.family_id
  from public.family_members fm
  where fm.user_id = auth.uid();
$$;

-- 6. RLS for families: user can read families they belong to; authenticated can create (for signup)
create policy "Users can read own families"
  on public.families for select
  using (id in (select public.user_family_ids()));

create policy "Authenticated users can insert families"
  on public.families for insert
  with check (auth.role() = 'authenticated');

-- 7. family_members: user can manage members in their families
drop policy if exists "Authenticated users can manage family_members" on public.family_members;
create policy "Users can manage family_members in own families"
  on public.family_members for all
  using (family_id in (select public.user_family_ids()));

-- 8. Add family_id to all family-scoped tables
alter table public.travel_locations add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.travel_locations tl
set family_id = (select family_id from public.family_members where id = tl.family_member_id limit 1)
where family_id is null;
alter table public.travel_locations alter column family_id set not null;

alter table public.journal_entries add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.journal_entries je
set family_id = (select family_id from public.family_members where id = je.author_id limit 1)
where family_id is null;
alter table public.journal_entries alter column family_id set not null;

alter table public.journal_photos add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.journal_photos jp
set family_id = (select family_id from public.journal_entries where id = jp.entry_id limit 1)
where family_id is null;
alter table public.journal_photos alter column family_id set not null;

alter table public.achievements add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.achievements a
set family_id = coalesce(
  (select family_id from public.family_members where id = a.family_member_id limit 1),
  (select id from public.families limit 1)
)
where family_id is null;
alter table public.achievements alter column family_id set not null;

alter table public.family_resumes add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.family_resumes fr
set family_id = (select family_id from public.family_members where id = fr.family_member_id limit 1)
where family_id is null;
alter table public.family_resumes alter column family_id set not null;

alter table public.favourites add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.favourites f
set family_id = coalesce(
  (select family_id from public.family_members where id = f.added_by limit 1),
  (select id from public.families limit 1)
)
where family_id is null;
alter table public.favourites alter column family_id set not null;

alter table public.family_relationships add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.family_relationships fr
set family_id = (select family_id from public.family_members where id = fr.member_id limit 1)
where family_id is null;
alter table public.family_relationships alter column family_id set not null;

alter table public.home_mosaic_photos add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.home_mosaic_photos set family_id = (select id from public.families limit 1) where family_id is null;
alter table public.home_mosaic_photos alter column family_id set not null;

-- family_messages: get family from sender
alter table public.family_messages add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.family_messages fm
set family_id = coalesce(
  (select m.family_id from public.family_members m where m.id = fm.sender_id limit 1),
  (select id from public.families limit 1)
)
where family_id is null;
alter table public.family_messages alter column family_id set not null;

-- spanish_progress: get family from family_member
alter table public.spanish_progress add column if not exists family_id uuid references public.families(id) on delete cascade;
update public.spanish_progress sp
set family_id = (select family_id from public.family_members where id = sp.family_member_id limit 1)
where family_id is null;
alter table public.spanish_progress alter column family_id set not null;

-- 9. Replace RLS policies with family-scoped ones
drop policy if exists "Authenticated users can manage travel_locations" on public.travel_locations;
create policy "Users can manage travel_locations in own families"
  on public.travel_locations for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage journal_entries" on public.journal_entries;
create policy "Users can manage journal_entries in own families"
  on public.journal_entries for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage journal_photos" on public.journal_photos;
create policy "Users can manage journal_photos in own families"
  on public.journal_photos for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage achievements" on public.achievements;
create policy "Users can manage achievements in own families"
  on public.achievements for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage family_resumes" on public.family_resumes;
create policy "Users can manage family_resumes in own families"
  on public.family_resumes for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage favourites" on public.favourites;
create policy "Users can manage favourites in own families"
  on public.favourites for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage family_relationships" on public.family_relationships;
create policy "Users can manage family_relationships in own families"
  on public.family_relationships for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Anyone can view home mosaic photos" on public.home_mosaic_photos;
drop policy if exists "Authenticated users can manage home mosaic photos" on public.home_mosaic_photos;
create policy "Anyone can view home mosaic photos"
  on public.home_mosaic_photos for select
  using (true);
create policy "Users can manage home mosaic photos in own families"
  on public.home_mosaic_photos for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage family_messages" on public.family_messages;
create policy "Users can manage family_messages in own families"
  on public.family_messages for all
  using (family_id in (select public.user_family_ids()));

drop policy if exists "Authenticated users can manage family_message_recipients" on public.family_message_recipients;
create policy "Users can manage family_message_recipients"
  on public.family_message_recipients for all
  using (
    message_id in (
      select id from public.family_messages where family_id in (select public.user_family_ids())
    )
  );

drop policy if exists "Authenticated users can manage family_message_reads" on public.family_message_reads;
create policy "Users can manage family_message_reads"
  on public.family_message_reads for all
  using (
    message_id in (
      select id from public.family_messages where family_id in (select public.user_family_ids())
    )
  );

drop policy if exists "Authenticated users can read family_settings" on public.family_settings;
drop policy if exists "Authenticated users can update family_settings" on public.family_settings;
drop policy if exists "Authenticated users can insert family_settings" on public.family_settings;
create policy "Users can read family_settings in own families"
  on public.family_settings for select
  using (family_id in (select public.user_family_ids()));
create policy "Users can update family_settings in own families"
  on public.family_settings for update
  using (family_id in (select public.user_family_ids()));
create policy "Users can insert family_settings in own families"
  on public.family_settings for insert
  with check (family_id in (select public.user_family_ids()));
