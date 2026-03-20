-- Make tradition-photos bucket private.
-- The bucket was created as public=true in 20260314000001_traditions_photo.sql,
-- after the 084_private_storage_buckets hardening pass. Photos are now served
-- through the /api/storage proxy (authenticated), matching all other media buckets.
update storage.buckets
set public = false
where id = 'tradition-photos';

-- Drop the open "anyone can view" policy
drop policy if exists "Anyone can view tradition photos" on storage.objects;

-- Drop the unenforced client-side upload policy (replaced by server action)
drop policy if exists "Authenticated users can upload tradition photos" on storage.objects;

-- Authenticated read (used by /api/storage proxy)
create policy "Authenticated users can read tradition photos"
  on storage.objects for select
  using (bucket_id = 'tradition-photos' and auth.role() = 'authenticated');

-- Authenticated upload (server action uploadTraditionPhoto)
create policy "Authenticated users can upload tradition photos"
  on storage.objects for insert
  with check (bucket_id = 'tradition-photos' and auth.role() = 'authenticated');

-- Authenticated delete (server action removeTradition)
create policy "Authenticated users can delete tradition photos"
  on storage.objects for delete
  using (bucket_id = 'tradition-photos' and auth.role() = 'authenticated');
