-- Trip date range: optional end date for journal entries (e.g. multi-day trips)
alter table public.journal_entries
  add column if not exists trip_date_end date;
