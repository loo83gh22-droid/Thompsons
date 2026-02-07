-- Time Capsules: letters to future versions of family members, sealed until a date

create table public.time_capsules (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  from_family_member_id uuid references public.family_members(id) on delete set null,
  to_family_member_id uuid references public.family_members(id) on delete cascade not null,
  title text not null,
  content text not null,
  unlock_date date not null,
  created_at timestamptz default now()
);

alter table public.time_capsules enable row level security;

create policy "Users can manage time_capsules in own families"
  on public.time_capsules for all
  using (family_id in (select public.user_family_ids()));

create index idx_time_capsules_family_id on public.time_capsules(family_id);
create index idx_time_capsules_to_member on public.time_capsules(to_family_member_id);
create index idx_time_capsules_unlock_date on public.time_capsules(unlock_date);
