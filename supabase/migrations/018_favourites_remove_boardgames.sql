-- Migrate boardgames to games, then remove boardgames from allowed categories
update public.favourites set category = 'games' where category = 'boardgames';

-- Drop the existing category check constraint (name may vary by PostgreSQL version)
do $$
declare
  r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.favourites'::regclass and contype = 'c'
  loop
    execute format('alter table public.favourites drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.favourites add constraint favourites_category_check
  check (category in ('books', 'movies', 'shows', 'music', 'podcasts', 'games', 'recipes'));
