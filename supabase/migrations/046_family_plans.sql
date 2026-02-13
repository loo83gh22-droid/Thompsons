-- Add plan and storage tracking columns to families table
alter table public.families
  add column if not exists plan_type text not null default 'free'
    check (plan_type in ('free', 'annual', 'legacy'));

alter table public.families
  add column if not exists plan_started_at timestamptz default now();

alter table public.families
  add column if not exists plan_expires_at timestamptz;

alter table public.families
  add column if not exists storage_used_bytes bigint not null default 0;

alter table public.families
  add column if not exists storage_limit_bytes bigint not null default 524288000;

comment on column public.families.plan_type is 'Subscription tier: free, annual ($49/yr), or legacy (lifetime).';
comment on column public.families.plan_started_at is 'When the current plan was activated.';
comment on column public.families.plan_expires_at is 'Expiry date for annual plans. Null for free and legacy.';
comment on column public.families.storage_used_bytes is 'Total storage consumed by photos, voice memos, etc.';
comment on column public.families.storage_limit_bytes is 'Storage cap in bytes. Free=500MB, Annual=10GB, Legacy=50GB.';
