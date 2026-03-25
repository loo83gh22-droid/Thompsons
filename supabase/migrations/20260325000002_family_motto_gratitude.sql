-- Family motto (one per family)
create table family_motto (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null unique references families(id) on delete cascade,
  motto text not null,
  updated_by uuid references family_members(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table family_motto enable row level security;
create policy "family members can view motto" on family_motto for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can insert motto" on family_motto for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can update motto" on family_motto for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- Family values (many per family)
create table family_values (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  value text not null,
  added_by_member_id uuid references family_members(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table family_values enable row level security;
create policy "family members can view values" on family_values for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can insert values" on family_values for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can delete values" on family_values for delete
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- Member personal motto notes (shown on their profile page)
create table member_motto_notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  family_member_id uuid not null unique references family_members(id) on delete cascade,
  personal_note text not null,
  updated_at timestamptz not null default now()
);
alter table member_motto_notes enable row level security;
create policy "family members can view motto notes" on member_motto_notes for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can insert motto notes" on member_motto_notes for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can update motto notes" on member_motto_notes for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- Gratitude posts
create table gratitude_posts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references family_members(id) on delete cascade,
  content text not null check (char_length(content) <= 280),
  created_at timestamptz not null default now()
);
alter table gratitude_posts enable row level security;
create policy "family members can view gratitude posts" on gratitude_posts for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can insert gratitude posts" on gratitude_posts for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));
create policy "family members can delete gratitude posts" on gratitude_posts for delete
  using (family_id in (select family_id from family_members where user_id = auth.uid()));
