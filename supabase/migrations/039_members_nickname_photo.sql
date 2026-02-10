-- Members: nickname; profile photos use existing avatar_url + member-photos bucket

alter table public.family_members
  add column if not exists nickname text;

comment on column public.family_members.nickname is 'Display name used in app e.g. Mom, Grandma Sue';

-- Storage bucket for member profile photos (avatar_url stores the public URL)
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload member photos"
  on storage.objects for insert
  with check (bucket_id = 'member-photos' and auth.role() = 'authenticated');

create policy "Anyone can view member photos"
  on storage.objects for select
  using (bucket_id = 'member-photos');

create policy "Authenticated users can update member photos"
  on storage.objects for update
  using (bucket_id = 'member-photos' and auth.role() = 'authenticated');

create policy "Authenticated users can delete member photos"
  on storage.objects for delete
  using (bucket_id = 'member-photos' and auth.role() = 'authenticated');
