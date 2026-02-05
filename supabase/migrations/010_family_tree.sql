-- Thompsons - Family Tree relationships
-- Run in Supabase SQL Editor

create table if not exists public.family_relationships (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references public.family_members(id) on delete cascade not null,
  related_id uuid references public.family_members(id) on delete cascade not null,
  relationship_type text not null, -- 'parent', 'child', 'spouse'
  created_at timestamptz default now(),
  unique(member_id, related_id, relationship_type)
);

alter table public.family_relationships enable row level security;

create policy "Authenticated users can manage family_relationships"
  on public.family_relationships for all
  using (auth.role() = 'authenticated');

-- Seed: Dad & Mom are parents of Huck and Maui; Dad & Mom are spouses
-- IDs from migration 002: Dad a0000003, Mom a0000004, Huck a0000001, Maui a0000002
insert into public.family_relationships (member_id, related_id, relationship_type) values
  ('a0000001-0001-0001-0001-000000000001', 'a0000003-0003-0003-0003-000000000003', 'child'),  -- Huck child of Dad
  ('a0000001-0001-0001-0001-000000000001', 'a0000004-0004-0004-0004-000000000004', 'child'),  -- Huck child of Mom
  ('a0000002-0002-0002-0002-000000000002', 'a0000003-0003-0003-0003-000000000003', 'child'),  -- Maui child of Dad
  ('a0000002-0002-0002-0002-000000000002', 'a0000004-0004-0004-0004-000000000004', 'child'),  -- Maui child of Mom
  ('a0000003-0003-0003-0003-000000000003', 'a0000004-0004-0004-0004-000000000004', 'spouse'), -- Dad spouse of Mom
  ('a0000004-0004-0004-0004-000000000004', 'a0000003-0003-0003-0003-000000000003', 'spouse')  -- Mom spouse of Dad
on conflict (member_id, related_id, relationship_type) do nothing;
