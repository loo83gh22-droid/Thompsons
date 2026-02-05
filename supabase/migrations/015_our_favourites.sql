-- Thompsons - Our Favourites (books, board games, movies, shows, etc.)

create table public.favourites (
  id uuid primary key default uuid_generate_v4(),
  category text not null check (category in ('books', 'boardgames', 'movies', 'shows', 'music', 'podcasts', 'games')),
  title text not null,
  description text,
  added_by uuid references public.family_members(id) on delete set null,
  notes text, -- e.g. "Great for family game night", "Dad's pick"
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.favourites enable row level security;

create policy "Authenticated users can manage favourites"
  on public.favourites for all
  using (auth.role() = 'authenticated');

create index idx_favourites_category on public.favourites (category);
