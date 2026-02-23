-- Add Stripe billing columns to families table.
-- These were created manually in production; this migration ensures
-- all environments have the columns.

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
