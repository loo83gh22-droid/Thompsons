-- Places lived: distinguish from travel/visit on the map (different symbol)
alter table public.travel_locations
  add column if not exists is_place_lived boolean not null default false;

comment on column public.travel_locations.is_place_lived is 'True when this pin represents a place the person lived (home icon), not a visit/trip (pin).';
