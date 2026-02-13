-- Nest Keepers: designated successors for family ownership transfer (Legacy plan)
create table if not exists public.nest_keepers (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  designated_by uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  relationship text,
  priority integer not null check (priority >= 1 and priority <= 3),
  status text not null default 'active' check (status in ('active', 'notified', 'claimed')),
  created_at timestamptz default now(),
  notified_at timestamptz,

  -- Each family can have at most one keeper per priority slot
  unique (family_id, priority)
);

comment on table public.nest_keepers is 'Designated successors who can claim family ownership after prolonged inactivity.';
comment on column public.nest_keepers.priority is 'Order of succession (1 = first contacted, 2 = second, 3 = third).';
comment on column public.nest_keepers.status is 'active = waiting, notified = email sent after inactivity, claimed = has taken ownership.';
comment on column public.nest_keepers.notified_at is 'When the inactivity notification was sent (null until triggered).';

-- Index for fast lookups by family
create index idx_nest_keepers_family_id on public.nest_keepers(family_id);

-- RLS
alter table public.nest_keepers enable row level security;

create policy "Users can view nest_keepers in own families"
  on public.nest_keepers for select
  using (family_id in (select public.user_family_ids()));

create policy "Users can insert nest_keepers in own families"
  on public.nest_keepers for insert
  with check (family_id in (select public.user_family_ids()));

create policy "Users can update nest_keepers in own families"
  on public.nest_keepers for update
  using (family_id in (select public.user_family_ids()));

create policy "Users can delete nest_keepers in own families"
  on public.nest_keepers for delete
  using (family_id in (select public.user_family_ids()));
