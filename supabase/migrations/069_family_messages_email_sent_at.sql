-- Track when scheduled family messages had their notification emails sent.
-- Messages with show_on_date in the future skip immediate email sending;
-- the nightly cron job delivers them on show_on_date and stamps this column.
alter table public.family_messages
  add column if not exists email_sent_at timestamptz;
