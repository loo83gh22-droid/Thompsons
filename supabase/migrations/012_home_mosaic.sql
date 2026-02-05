-- Thompsons - Home page mosaic photos
-- Run in Supabase SQL Editor

create table if not exists public.home_mosaic_photos (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.home_mosaic_photos enable row level security;

-- Public can view (for landing page)
create policy "Anyone can view home mosaic photos"
  on public.home_mosaic_photos for select
  using (true);

-- Authenticated users can add/remove
create policy "Authenticated users can manage home mosaic photos"
  on public.home_mosaic_photos for all
  using (auth.role() = 'authenticated');

-- Storage for mosaic photos
insert into storage.buckets (id, name, public)
values ('home-mosaic', 'home-mosaic', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload home mosaic photos"
  on storage.objects for insert
  with check (bucket_id = 'home-mosaic' and auth.role() = 'authenticated');

create policy "Anyone can view home mosaic photos storage"
  on storage.objects for select
  using (bucket_id = 'home-mosaic');
