-- Add photo_url column to favourites
alter table public.favourites add column if not exists photo_url text;

-- Storage bucket for favourite photos
insert into storage.buckets (id, name, public)
values ('favourite-photos', 'favourite-photos', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload favourite photos"
  on storage.objects for insert
  with check (bucket_id = 'favourite-photos' and auth.role() = 'authenticated');

create policy "Authenticated users can view favourite photos"
  on storage.objects for select
  using (bucket_id = 'favourite-photos' and auth.role() = 'authenticated');

create policy "Authenticated users can delete favourite photos"
  on storage.objects for delete
  using (bucket_id = 'favourite-photos' and auth.role() = 'authenticated');
