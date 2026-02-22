-- Per-user personal labels for family members
-- e.g. You call John Thompson "Dad", Jodi calls him "John", kids call him "Grandpa"

create table if not exists public.member_aliases (
  id uuid primary key default uuid_generate_v4(),
  viewer_member_id uuid references public.family_members(id) on delete cascade not null,
  target_member_id uuid references public.family_members(id) on delete cascade not null,
  label text not null,
  created_at timestamptz default now(),
  unique(viewer_member_id, target_member_id)
);

alter table public.member_aliases enable row level security;

create policy "Authenticated users can manage member_aliases"
  on public.member_aliases for all
  using (auth.role() = 'authenticated');
