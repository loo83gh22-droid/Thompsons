-- Add theme column to families table
-- Valid themes: warm (default), ocean, forest, sunset, lavender, midnight, vintage

alter table families
  add column if not exists theme text not null default 'warm'
  check (theme in ('warm', 'ocean', 'forest', 'sunset', 'lavender', 'midnight', 'vintage'));
