-- Add photo_url column to family_traditions for optional tradition photos
alter table public.family_traditions add column if not exists photo_url text;

-- Storage bucket for tradition photos
insert into storage.buckets (id, name, public)
values ('tradition-photos', 'tradition-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload tradition photos"
  on storage.objects for insert
  with check (
    bucket_id = 'tradition-photos' and auth.role() = 'authenticated'
  );

create policy "Anyone can view tradition photos"
  on storage.objects for select
  using (bucket_id = 'tradition-photos');
