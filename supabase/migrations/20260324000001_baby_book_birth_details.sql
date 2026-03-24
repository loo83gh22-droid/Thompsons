create table if not exists baby_book_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  family_member_id uuid not null references family_members(id) on delete cascade,
  birth_time text,
  birth_weight text,
  birth_length text,
  birth_place text,
  birth_story text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(family_member_id)
);

alter table baby_book_profiles enable row level security;

create policy "Family members can view baby book profiles"
  on baby_book_profiles for select
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

create policy "Family members can insert baby book profiles"
  on baby_book_profiles for insert
  with check (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

create policy "Family members can update baby book profiles"
  on baby_book_profiles for update
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );
