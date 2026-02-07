-- Journal perspectives: multiple family members add their version to the same entry
-- Dad's version of the camping trip vs. the kids' version. Different angles on the same memory.

create table public.journal_perspectives (
  id uuid primary key default uuid_generate_v4(),
  journal_entry_id uuid references public.journal_entries(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  unique(journal_entry_id, family_member_id)
);

alter table public.journal_perspectives enable row level security;

create policy "Users can manage journal_perspectives in own families"
  on public.journal_perspectives for all
  using (
    journal_entry_id in (
      select id from public.journal_entries where family_id in (select public.user_family_ids())
    )
  );

create index idx_journal_perspectives_entry_id on public.journal_perspectives(journal_entry_id);
