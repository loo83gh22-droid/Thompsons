-- Export jobs table: tracks data export requests
create table if not exists public.family_exports (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  file_path text,
  file_size_bytes bigint,
  error_message text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  completed_at timestamptz
);

comment on table public.family_exports is 'Tracks data export jobs. Legacy plan feature.';
comment on column public.family_exports.file_path is 'Path in the exports storage bucket.';
comment on column public.family_exports.expires_at is 'When the download link expires (24h after completion).';

create index idx_family_exports_family_id on public.family_exports(family_id);

alter table public.family_exports enable row level security;

create policy "Users can view exports in own families"
  on public.family_exports for select
  using (family_id in (select public.user_family_ids()));

create policy "Users can insert exports in own families"
  on public.family_exports for insert
  with check (family_id in (select public.user_family_ids()));

create policy "Users can update exports in own families"
  on public.family_exports for update
  using (family_id in (select public.user_family_ids()));

-- Storage bucket for export archives
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- Only authenticated users can access their exports
create policy "Authenticated users can upload exports"
  on storage.objects for insert
  with check (bucket_id = 'exports' and auth.role() = 'authenticated');

create policy "Authenticated users can read exports"
  on storage.objects for select
  using (bucket_id = 'exports' and auth.role() = 'authenticated');

create policy "Authenticated users can delete exports"
  on storage.objects for delete
  using (bucket_id = 'exports' and auth.role() = 'authenticated');
