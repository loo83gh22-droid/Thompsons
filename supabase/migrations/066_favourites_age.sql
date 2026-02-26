alter table public.favourites add column if not exists age integer check (age >= 0 and age <= 120);
