-- User-level preferences (not family-scoped)
-- Theme follows the user across all families

create table if not exists user_preferences (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  theme    text not null default 'warm'
           check (theme in ('warm', 'ocean', 'forest', 'sunset', 'lavender', 'midnight', 'vintage')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table user_preferences enable row level security;

create policy "Users can view own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);

-- Drop the family-level theme column (no longer needed)
alter table families drop column if exists theme;
