-- Family Stories: longer-form narrative stories and family history

create table public.family_stories (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  author_family_member_id uuid references public.family_members(id) on delete set null,
  title text not null,
  content text not null,
  cover_url text,
  category text default 'memorable_moments', -- family_history, advice_wisdom, memorable_moments, traditions, recipes_food, other
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.family_stories enable row level security;

create policy "Users can manage family_stories in own families"
  on public.family_stories for all
  using (family_id in (select public.user_family_ids()));

create index idx_family_stories_family_id on public.family_stories(family_id);
create index idx_family_stories_created_at on public.family_stories(created_at desc);
create index idx_family_stories_published on public.family_stories(published) where published = true;
