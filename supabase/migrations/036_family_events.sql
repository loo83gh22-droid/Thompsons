-- Family Events / Calendar: track important dates and milestones

create table public.family_events (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  created_by uuid references public.family_members(id) on delete set null,
  title text not null,
  description text,
  event_date date not null,
  recurring text default 'none', -- 'none', 'annual', 'monthly'
  category text default 'other', -- 'birthday', 'anniversary', 'holiday', 'reunion', 'other'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.family_event_invitees (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.family_events(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(event_id, family_member_id)
);

alter table public.family_events enable row level security;
alter table public.family_event_invitees enable row level security;

create policy "Users can manage family_events in own families"
  on public.family_events for all
  using (family_id in (select public.user_family_ids()));

create policy "Users can manage family_event_invitees for own family events"
  on public.family_event_invitees for all
  using (event_id in (select id from public.family_events where family_id in (select public.user_family_ids())));

create index idx_family_events_family_id on public.family_events(family_id);
create index idx_family_events_event_date on public.family_events(event_date);
create index idx_family_event_invitees_event_id on public.family_event_invitees(event_id);
