-- Book Club
create table book_club_books (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references family_members(id) on delete cascade,
  title text not null,
  author text,
  status text not null default 'want_to_read'
    check (status in ('reading', 'finished', 'want_to_read')),
  rating smallint check (rating between 1 and 5),
  notes text,
  is_family_pick boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table book_club_books enable row level security;

create policy "Family members can view books"
  on book_club_books for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can insert books"
  on book_club_books for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can update books"
  on book_club_books for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can delete books"
  on book_club_books for delete
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- Family Challenges
create table family_challenges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  created_by_member_id uuid references family_members(id) on delete set null,
  title text not null,
  description text,
  emoji text not null default '🎯',
  challenge_type text not null default 'single'
    check (challenge_type in ('single', 'daily')),
  duration_days int,
  end_date date,
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table family_challenges enable row level security;

create policy "Family members can view challenges"
  on family_challenges for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can insert challenges"
  on family_challenges for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can update challenges"
  on family_challenges for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can delete challenges"
  on family_challenges for delete
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- Single completions (one per member per challenge)
create table challenge_completions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references family_challenges(id) on delete cascade,
  family_member_id uuid not null references family_members(id) on delete cascade,
  note text,
  completed_at timestamptz not null default now(),
  unique(challenge_id, family_member_id)
);

alter table challenge_completions enable row level security;

create policy "Family members can view completions"
  on challenge_completions for select
  using (challenge_id in (select id from family_challenges where family_id in
    (select family_id from family_members where user_id = auth.uid())));

create policy "Family members can insert completions"
  on challenge_completions for insert
  with check (challenge_id in (select id from family_challenges where family_id in
    (select family_id from family_members where user_id = auth.uid())));

create policy "Family members can delete completions"
  on challenge_completions for delete
  using (challenge_id in (select id from family_challenges where family_id in
    (select family_id from family_members where user_id = auth.uid())));

-- Daily check-ins (one per member per challenge per day)
create table challenge_checkins (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references family_challenges(id) on delete cascade,
  family_member_id uuid not null references family_members(id) on delete cascade,
  checkin_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique(challenge_id, family_member_id, checkin_date)
);

alter table challenge_checkins enable row level security;

create policy "Family members can view checkins"
  on challenge_checkins for select
  using (challenge_id in (select id from family_challenges where family_id in
    (select family_id from family_members where user_id = auth.uid())));

create policy "Family members can insert checkins"
  on challenge_checkins for insert
  with check (challenge_id in (select id from family_challenges where family_id in
    (select family_id from family_members where user_id = auth.uid())));

create policy "Family members can delete checkins"
  on challenge_checkins for delete
  using (challenge_id in (select id from family_challenges where family_id in
    (select family_id from family_members where user_id = auth.uid())));
