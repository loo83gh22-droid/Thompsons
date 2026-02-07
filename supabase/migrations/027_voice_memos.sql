-- Voice Memos & Audio Stories: preserve voices for future generations

create table public.voice_memos (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete set null,
  title text not null,
  description text,
  audio_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.voice_memos enable row level security;

create policy "Users can manage voice_memos in own families"
  on public.voice_memos for all
  using (family_id in (select public.user_family_ids()));

create index idx_voice_memos_family_id on public.voice_memos(family_id);

-- Storage for audio files
insert into storage.buckets (id, name, public)
values ('voice-memos', 'voice-memos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload voice memos"
  on storage.objects for insert
  with check (bucket_id = 'voice-memos' and auth.role() = 'authenticated');

create policy "Anyone can view voice memos storage"
  on storage.objects for select
  using (bucket_id = 'voice-memos');
