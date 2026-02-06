-- Add relationship label to family_members (e.g. Mom, Dad, Child, Spouse)
alter table public.family_members add column if not exists relationship text;
