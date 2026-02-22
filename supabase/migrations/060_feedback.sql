-- Feedback table
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.family_members(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in (
    'feature_request', 'bug_report', 'question', 'compliment', 'other'
  )),
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 5000),
  screenshot_url text,
  status text not null default 'new' check (status in (
    'new', 'read', 'in_progress', 'resolved', 'wont_fix'
  )),
  admin_response text,
  responded_at timestamptz,
  page_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_feedback_family_id on public.feedback(family_id);
create index if not exists idx_feedback_status on public.feedback(family_id, status);
create index if not exists idx_feedback_member on public.feedback(member_id);

-- RLS
alter table public.feedback enable row level security;

create policy "Members can insert feedback"
  on public.feedback for insert
  with check (
    family_id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );

create policy "Members can view own feedback"
  on public.feedback for select
  using (user_id = auth.uid());

create policy "Owners can view all family feedback"
  on public.feedback for select
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "Owners can update feedback"
  on public.feedback for update
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "Members can delete own feedback"
  on public.feedback for delete
  using (user_id = auth.uid());

create policy "Owners can delete family feedback"
  on public.feedback for delete
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'owner'
    )
  );
