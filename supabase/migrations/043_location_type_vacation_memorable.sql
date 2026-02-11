-- Map categories: vacation vs memorable events (sports, weddings, etc.)
alter table public.travel_locations
  add column if not exists location_type text
  check (location_type is null or location_type in ('vacation', 'memorable_event'));

comment on column public.travel_locations.location_type is 'Optional: vacation (holiday/trip) or memorable_event (wedding, sports, etc.). Null = generic visit.';
