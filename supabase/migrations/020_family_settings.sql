-- Store family name for personalized branding (e.g. "Thompsons Nest")
create table if not exists public.family_settings (
  id uuid primary key default uuid_generate_v4(),
  family_name text not null default 'Our Family',
  updated_at timestamptz default now()
);

-- Ensure one row exists (for existing deployments: run "update family_settings set family_name = 'Thompsons';" if needed)
insert into public.family_settings (family_name)
select 'Our Family' where not exists (select 1 from public.family_settings);

alter table public.family_settings enable row level security;

drop policy if exists "Authenticated users can read family_settings" on public.family_settings;
create policy "Authenticated users can read family_settings"
  on public.family_settings for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update family_settings" on public.family_settings;
create policy "Authenticated users can update family_settings"
  on public.family_settings for update
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert family_settings" on public.family_settings;
create policy "Authenticated users can insert family_settings"
  on public.family_settings for insert
  with check (auth.role() = 'authenticated');
