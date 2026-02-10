-- Voice memos: recorded for, duration, recorded date

alter table public.voice_memos
  add column if not exists recorded_for_id uuid references public.family_members(id) on delete set null,
  add column if not exists duration_seconds int,
  add column if not exists recorded_date date default current_date,
  add column if not exists updated_at timestamptz default now();

comment on column public.voice_memos.family_member_id is 'Who recorded this (recorded by)';
comment on column public.voice_memos.recorded_for_id is 'Who this recording is for (optional)';

update public.voice_memos
set recorded_date = (created_at at time zone 'UTC')::date
where recorded_date is null;

create index if not exists idx_voice_memos_recorded_date on public.voice_memos(recorded_date);
create index if not exists idx_voice_memos_created_at on public.voice_memos(created_at desc);

-- Allow authenticated users to delete voice memo files (server action uses user auth)
create policy "Authenticated users can delete voice memos storage"
  on storage.objects for delete
  using (bucket_id = 'voice-memos' and auth.role() = 'authenticated');
