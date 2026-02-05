-- Thompsons - Sports section (team photos, action shots)

create table public.sports_photos (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  title text,
  caption text,
  sport text, -- e.g. Baseball, Soccer, Hockey
  year int,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.sports_photos enable row level security;

create policy "Authenticated users can manage sports_photos"
  on public.sports_photos for all
  using (auth.role() = 'authenticated');

-- Storage for sports photos
insert into storage.buckets (id, name, public)
values ('sports-photos', 'sports-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload sports photos"
  on storage.objects for insert
  with check (bucket_id = 'sports-photos' and auth.role() = 'authenticated');

create policy "Anyone can view sports photos storage"
  on storage.objects for select
  using (bucket_id = 'sports-photos');
