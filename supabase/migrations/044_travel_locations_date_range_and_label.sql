-- Optional end date for locations (e.g. "lived until") and optional label for custom types
alter table public.travel_locations
  add column if not exists trip_date_end date;

alter table public.travel_locations
  add column if not exists location_label text;

-- Allow location_type 'other' (use location_label for "School", "First job", etc.)
alter table public.travel_locations drop constraint if exists travel_locations_location_type_check;
alter table public.travel_locations
  add constraint travel_locations_location_type_check
  check (location_type is null or location_type in ('vacation', 'memorable_event', 'other'));

comment on column public.travel_locations.trip_date_end is 'Optional end date (e.g. when you stopped living somewhere).';
comment on column public.travel_locations.location_label is 'Optional short label (e.g. "School", "First job") when location_type is "other" or for display.';
