-- Pricing overhaul migration
-- 1. Add 'monthly' to the plan_type CHECK constraint
-- 2. Reduce annual plan storage from 50 GB to 20 GB

-- Drop the old CHECK constraint and add the new one including 'monthly'
alter table public.families
  drop constraint if exists families_plan_type_check;

alter table public.families
  add constraint families_plan_type_check
    check (plan_type in ('free', 'monthly', 'annual', 'legacy'));

-- Reduce storage limit for existing annual families from 50 GB to 20 GB
-- (Only affects families that haven't purchased storage add-ons above base limit)
update public.families
  set storage_limit_bytes = 21474836480  -- 20 GB
  where plan_type = 'annual'
    and storage_limit_bytes = 53687091200; -- only update the old 50 GB default
