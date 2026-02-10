-- Storage bucket for family story cover images
insert into storage.buckets (id, name, public)
values ('story-covers', 'story-covers', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload story covers"
  on storage.objects for insert
  with check (bucket_id = 'story-covers' and auth.role() = 'authenticated');

create policy "Anyone can view story covers"
  on storage.objects for select
  using (bucket_id = 'story-covers');

create policy "Authenticated users can update own story cover uploads"
  on storage.objects for update
  using (bucket_id = 'story-covers' and auth.role() = 'authenticated');

create policy "Authenticated users can delete story cover uploads"
  on storage.objects for delete
  using (bucket_id = 'story-covers' and auth.role() = 'authenticated');
