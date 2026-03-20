-- Add photo_url column to travel_locations for optional location photos
alter table public.travel_locations add column if not exists photo_url text;

-- Private storage bucket for location photos (served via authenticated proxy)
insert into storage.buckets (id, name, public)
values ('location-photos', 'location-photos', false)
on conflict (id) do nothing;

create policy "location_photos_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'location-photos'
    and auth.role() = 'authenticated'
  );

create policy "location_photos_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'location-photos'
    and auth.role() = 'authenticated'
  );

create policy "location_photos_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'location-photos'
    and auth.role() = 'authenticated'
  );
