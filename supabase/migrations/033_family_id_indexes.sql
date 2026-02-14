-- Add family_id indexes for scaling: faster RLS and family-scoped queries

create index if not exists idx_journal_entries_family_id on public.journal_entries(family_id);
create index if not exists idx_journal_photos_family_id on public.journal_photos(family_id);
create index if not exists idx_journal_photos_entry_id on public.journal_photos(entry_id);
create index if not exists idx_travel_locations_family_id on public.travel_locations(family_id);
create index if not exists idx_favourites_family_id on public.favourites(family_id);
create index if not exists idx_family_messages_family_id on public.family_messages(family_id);
create index if not exists idx_family_relationships_family_id on public.family_relationships(family_id);
create index if not exists idx_home_mosaic_photos_family_id on public.home_mosaic_photos(family_id);
create index if not exists idx_spanish_progress_family_id on public.spanish_progress(family_id);
create index if not exists idx_family_resumes_family_id on public.family_resumes(family_id);
create index if not exists idx_achievements_family_id on public.achievements(family_id);
