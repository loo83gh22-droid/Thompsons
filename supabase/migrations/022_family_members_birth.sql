-- Add birth date and birth place to family members
alter table public.family_members add column if not exists birth_date date;
alter table public.family_members add column if not exists birth_place text;
