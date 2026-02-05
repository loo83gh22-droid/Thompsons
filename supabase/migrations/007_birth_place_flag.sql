-- Thompsons - Birth places use balloons; solo trips use pin
-- Run in Supabase SQL Editor

alter table public.travel_locations add column if not exists is_birth_place boolean default false;

-- Mark existing birth locations (notes contain "Birth place")
update public.travel_locations set is_birth_place = true where notes ilike '%Birth place%';
