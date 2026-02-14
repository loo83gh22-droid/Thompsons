-- Thompsons - Initial Schema
-- Run this in your Supabase SQL Editor after creating a project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Family members (extends auth.users with family-specific data)
create table public.family_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  color text default '#3b82f6', -- for map pins
  avatar_url text,
  created_at timestamptz default now()
);

-- Travel locations (where each family member has been)
create table public.travel_locations (
  id uuid primary key default uuid_generate_v4(),
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  lat double precision not null,
  lng double precision not null,
  location_name text not null,
  year_visited int,
  notes text,
  created_at timestamptz default now()
);

-- Vacation journal entries
create table public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.family_members(id) on delete cascade not null,
  title text not null,
  content text,
  location text,
  trip_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Journal photos
create table public.journal_photos (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid references public.journal_entries(id) on delete cascade not null,
  url text not null,
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Spanish lessons (content you create)
create table public.spanish_lessons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  content jsonb default '{}', -- vocabulary, phrases, etc.
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Spanish progress per user
create table public.spanish_progress (
  id uuid primary key default uuid_generate_v4(),
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  lesson_id uuid references public.spanish_lessons(id) on delete cascade not null,
  completed_at timestamptz default now(),
  score int,
  unique(family_member_id, lesson_id)
);

-- Row Level Security (RLS)
alter table public.family_members enable row level security;
alter table public.travel_locations enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_photos enable row level security;
alter table public.spanish_lessons enable row level security;
alter table public.spanish_progress enable row level security;

-- Policies: Only authenticated users can read/write
create policy "Authenticated users can manage family_members"
  on public.family_members for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage travel_locations"
  on public.travel_locations for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage journal_entries"
  on public.journal_entries for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage journal_photos"
  on public.journal_photos for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read spanish_lessons"
  on public.spanish_lessons for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage spanish_progress"
  on public.spanish_progress for all
  using (auth.role() = 'authenticated');

-- Storage bucket for journal photos
insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', true);

create policy "Authenticated users can upload journal photos"
  on storage.objects for insert
  with check (
    bucket_id = 'journal-photos' and auth.role() = 'authenticated'
  );

create policy "Anyone can view journal photos"
  on storage.objects for select
  using (bucket_id = 'journal-photos');
