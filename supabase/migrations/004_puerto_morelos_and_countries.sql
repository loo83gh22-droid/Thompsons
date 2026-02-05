-- Thompsons - Puerto Morelos family trip + country tracking
-- Run in Supabase SQL Editor

-- Add country_code for country shading (ISO 3166-1 alpha-2)
alter table public.travel_locations add column if not exists country_code text;

-- Update birth locations with country codes
update public.travel_locations set country_code = 'CA' where location_name like '%Canada%';

-- Puerto Morelos, Mexico - Family trip January 2019
-- Family member id from migration 003
insert into public.travel_locations (family_member_id, lat, lng, location_name, year_visited, trip_date, notes, country_code) values
  ('a0000000-0000-0000-0000-000000000000', 20.84866, -86.87624, 'Puerto Morelos, Mexico', 2019, '2019-01-15', 'Family vacation', 'MX');
