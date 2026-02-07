-- Link travel_locations to journal entries when created from a journal
alter table public.travel_locations
  add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete set null;
