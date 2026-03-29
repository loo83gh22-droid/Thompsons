-- Family Letters
-- Private letters written from one member to another. Household-only. Never shared.

create table if not exists family_letters (
  id                uuid primary key default gen_random_uuid(),
  family_id         uuid not null references families(id) on delete cascade,
  from_member_id    uuid references family_members(id) on delete set null,
  to_member_id      uuid references family_members(id) on delete set null,
  title             text,
  body              text not null,
  written_on        date not null default current_date,
  deliver_at_age    integer,       -- optional: seal until recipient turns this age
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table family_letters enable row level security;

create policy "family_letters_select" on family_letters
  for select using (family_id in (select public.user_family_ids()));

create policy "family_letters_insert" on family_letters
  for insert with check (family_id in (select public.user_family_ids()));

create policy "family_letters_update" on family_letters
  for update using (family_id in (select public.user_family_ids()));

create policy "family_letters_delete" on family_letters
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_letters_family on family_letters(family_id);
create index idx_family_letters_to on family_letters(to_member_id);
