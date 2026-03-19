-- Account deletion requests with 30-day grace period
-- Soft-delete: mark for deletion, then a cron job permanently removes after grace period

create table if not exists account_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  requested_at  timestamptz not null default now(),
  -- Grace period ends 30 days after request
  delete_after  timestamptz not null default (now() + interval '30 days'),
  -- null = pending, 'cancelled' = user changed mind, 'completed' = data wiped
  status        text not null default 'pending' check (status in ('pending', 'cancelled', 'completed')),
  cancelled_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- Index for the cron job to find expired grace periods
create index if not exists idx_deletion_requests_pending
  on account_deletion_requests (delete_after)
  where status = 'pending';

-- Unique constraint: only one pending request per user
create unique index if not exists idx_deletion_requests_user_pending
  on account_deletion_requests (user_id)
  where status = 'pending';

-- RLS
alter table account_deletion_requests enable row level security;

-- Users can see their own deletion requests
create policy "Users can view own deletion requests"
  on account_deletion_requests for select
  using (auth.uid() = user_id);

-- Users can insert their own deletion requests
create policy "Users can create own deletion request"
  on account_deletion_requests for insert
  with check (auth.uid() = user_id);

-- Users can update (cancel) their own pending requests
create policy "Users can cancel own deletion request"
  on account_deletion_requests for update
  using (auth.uid() = user_id and status = 'pending');
