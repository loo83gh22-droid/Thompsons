-- Migrate any existing podcasts rows to toys
update public.favourites set category = 'toys' where category = 'podcasts';

-- Drop existing category check constraint
do $$
declare
  r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.favourites'::regclass and contype = 'c' and conname like '%category%'
  loop
    execute format('alter table public.favourites drop constraint %I', r.conname);
  end loop;
end $$;

-- Add updated constraint with toys instead of podcasts
alter table public.favourites add constraint favourites_category_check
  check (category in ('books', 'movies', 'shows', 'music', 'toys', 'games', 'recipes'));
