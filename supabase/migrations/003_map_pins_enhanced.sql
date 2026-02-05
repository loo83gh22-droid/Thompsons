-- Thompsons - Enhanced map pins: symbols, family trips, trip dates
-- Run in Supabase SQL Editor

-- Add symbol to family_members (circle, square, triangle, diamond, star)
alter table public.family_members add column if not exists symbol text default 'circle';

-- Add Family member for family trips (blue)
insert into public.family_members (id, name, color, symbol) values
  ('a0000000-0000-0000-0000-000000000000', 'Family', '#3b82f6', 'star')
on conflict (id) do nothing;

-- Update existing family members with unique symbols
update public.family_members set symbol = 'circle' where id = 'a0000001-0001-0001-0001-000000000001';
update public.family_members set symbol = 'square' where id = 'a0000002-0002-0002-0002-000000000002';
update public.family_members set symbol = 'triangle' where id = 'a0000003-0003-0003-0003-000000000003';
update public.family_members set symbol = 'diamond' where id = 'a0000004-0004-0004-0004-000000000004';

-- Add trip_date for full date display (optional, year_visited still works)
alter table public.travel_locations add column if not exists trip_date date;
