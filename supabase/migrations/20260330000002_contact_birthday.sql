-- Add birthday field to family_contacts so contact birthdays can feed into upcoming events
alter table family_contacts add column if not exists birthday date;
