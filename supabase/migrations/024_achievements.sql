-- Achievements: who, what, when, where, description, attachment

create table public.achievements (
  id uuid primary key default uuid_generate_v4(),
  family_member_id uuid references public.family_members(id) on delete set null,
  what text not null,
  achievement_date date,
  location text,
  description text,
  attachment_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.achievements enable row level security;

create policy "Authenticated users can manage achievements"
  on public.achievements for all
  using (auth.role() = 'authenticated');

-- Storage for achievement attachments (images and documents)
insert into storage.buckets (id, name, public)
values ('achievements', 'achievements', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload achievements"
  on storage.objects for insert
  with check (bucket_id = 'achievements' and auth.role() = 'authenticated');

create policy "Anyone can view achievements storage"
  on storage.objects for select
  using (bucket_id = 'achievements');

-- Migrate existing sports_photos into achievements
insert into public.achievements (what, achievement_date, description, attachment_url, sort_order, created_at)
select
  coalesce(title, 'Photo'),
  case when year is not null then make_date(year, 1, 1) else null end,
  caption,
  url,
  sort_order,
  created_at
from public.sports_photos;

-- Drop old table
drop table public.sports_photos;
