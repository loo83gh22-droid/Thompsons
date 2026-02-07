-- Resumes: one per family member, easy to update
create table if not exists public.family_resumes (
  id uuid primary key default uuid_generate_v4(),
  family_member_id uuid references public.family_members(id) on delete cascade not null unique,
  content text,
  updated_at timestamptz default now()
);

alter table public.family_resumes enable row level security;

create policy "Authenticated users can manage family_resumes"
  on public.family_resumes for all
  using (auth.role() = 'authenticated');
