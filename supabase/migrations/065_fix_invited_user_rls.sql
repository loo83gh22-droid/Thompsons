-- Fix invited-user RLS: a newly-authenticated user could not read or update
-- their own family_members row because the existing policy only allows access
-- to rows inside families the user already belongs to (via user_family_ids()).
-- An invited member's row has user_id = NULL, so user_family_ids() returns
-- nothing and the claim lookup in dashboard/layout.tsx silently fell through
-- to creating a brand-new family instead of joining the existing one.
--
-- These two policies close that gap by matching on contact_email = auth.email():

-- 1. Allow an authenticated user to SELECT their own invited (unclaimed) row
create policy "Invited user can read own unclaimed row"
  on public.family_members
  for select
  using (
    contact_email = auth.email()
    and user_id is null
  );

-- 2. Allow an authenticated user to UPDATE their own invited row to claim it
--    (sets user_id = auth.uid(); after that the normal family-scoped policy applies)
create policy "Invited user can claim own unclaimed row"
  on public.family_members
  for update
  using (
    contact_email = auth.email()
    and user_id is null
  )
  with check (
    user_id = auth.uid()
    and contact_email = auth.email()
  );
