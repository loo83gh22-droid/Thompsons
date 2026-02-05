-- Thompsons - Seed family members and birth locations
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- Insert family members (user_id null until they sign up)
insert into public.family_members (id, name, color) values
  ('a0000001-0001-0001-0001-000000000001', 'Huck (Huckleberry John Thompson)', '#22c55e'),
  ('a0000002-0002-0002-0002-000000000002', 'Maui (Maui Cub Thompson)', '#ef4444'),
  ('a0000003-0003-0003-0003-000000000003', 'Dad (Robert Scott Thompson)', '#171717'),
  ('a0000004-0004-0004-0004-000000000004', 'Mom (Jodi-Rae Ashley Thompson)', '#d4a853')
on conflict (id) do nothing;

-- Birth locations (coordinates for Canadian cities)
-- Fort McMurray, AB - Huck
insert into public.travel_locations (family_member_id, lat, lng, location_name, year_visited, notes) values
  ('a0000001-0001-0001-0001-000000000001', 56.7267, -111.3810, 'Fort McMurray, AB, Canada', null, 'Birth place - Huck');

-- Antigonish, NS - Maui
insert into public.travel_locations (family_member_id, lat, lng, location_name, year_visited, notes) values
  ('a0000002-0002-0002-0002-000000000002', 45.6168, -61.9986, 'Antigonish, NS, Canada', null, 'Birth place - Maui');

-- Kitchener, ON - Dad
insert into public.travel_locations (family_member_id, lat, lng, location_name, year_visited, notes) values
  ('a0000003-0003-0003-0003-000000000003', 43.4516, -80.4925, 'Kitchener, ON, Canada', null, 'Birth place - Dad');

-- Penticton, BC - Mom
insert into public.travel_locations (family_member_id, lat, lng, location_name, year_visited, notes) values
  ('a0000004-0004-0004-0004-000000000004', 49.4806, -119.5858, 'Penticton, BC, Canada', null, 'Birth place - Mom');
