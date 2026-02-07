-- Recipe Collection with Stories: food as memory
-- Not just "Grandma's lasagna" but the story behind it, who taught her, what occasions.
-- Link recipes to photos from dinners where they were served.

create table public.recipes (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  title text not null,
  story text,
  taught_by uuid references public.family_members(id) on delete set null,
  occasions text,
  ingredients text,
  instructions text,
  added_by uuid references public.family_members(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.recipes enable row level security;

create policy "Users can manage recipes in own families"
  on public.recipes for all
  using (family_id in (select public.user_family_ids()));

create index idx_recipes_family_id on public.recipes(family_id);

-- Link recipes to journal photos (dinner photos, etc.)
create table public.recipe_photo_links (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  journal_photo_id uuid references public.journal_photos(id) on delete cascade not null,
  unique(recipe_id, journal_photo_id)
);

alter table public.recipe_photo_links enable row level security;

create policy "Users can manage recipe_photo_links in own families"
  on public.recipe_photo_links for all
  using (
    recipe_id in (
      select id from public.recipes where family_id in (select public.user_family_ids())
    )
  );

create index idx_recipe_photo_links_recipe_id on public.recipe_photo_links(recipe_id);
