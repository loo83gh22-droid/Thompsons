-- Family Traditions Library: cultural DNA that gets lost between generations
-- Taco Tuesday chants, holiday rituals, inside jokes, weird family quirks.

create table public.family_traditions (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  title text not null,
  description text not null,
  when_it_happens text,
  added_by uuid references public.family_members(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.family_traditions enable row level security;

create policy "Users can manage family_traditions in own families"
  on public.family_traditions for all
  using (family_id in (select public.user_family_ids()));

create index idx_family_traditions_family_id on public.family_traditions(family_id);
