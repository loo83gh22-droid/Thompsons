-- Collaborative Storytelling: multiple perspectives on the same event
-- Dad's version of the camping trip vs. the kids' version. Different angles on the same memory.

create table public.story_events (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  title text not null,
  event_date date,
  created_by uuid references public.family_members(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.story_events enable row level security;

create policy "Users can manage story_events in own families"
  on public.story_events for all
  using (family_id in (select public.user_family_ids()));

create index idx_story_events_family_id on public.story_events(family_id);

create table public.story_perspectives (
  id uuid primary key default uuid_generate_v4(),
  story_event_id uuid references public.story_events(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  unique(story_event_id, family_member_id)
);

alter table public.story_perspectives enable row level security;

create policy "Users can manage story_perspectives in own families"
  on public.story_perspectives for all
  using (
    story_event_id in (
      select id from public.story_events where family_id in (select public.user_family_ids())
    )
  );

create index idx_story_perspectives_story_event_id on public.story_perspectives(story_event_id);
