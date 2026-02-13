-- Allow family members to update their own family (e.g. rename)
create policy "Users can update own families"
  on public.families for update
  using (id in (select public.user_family_ids()));
