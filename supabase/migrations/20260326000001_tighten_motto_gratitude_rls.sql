-- Tighten RLS on member_motto_notes and gratitude_posts
-- to enforce ownership at the database layer, not just the application layer.

-- ── member_motto_notes ────────────────────────────────────────────────────────
-- Replace the overly-broad insert/update policies.
-- A family member may only insert/update their OWN note row.

drop policy if exists "family members can insert motto notes" on member_motto_notes;
drop policy if exists "family members can update motto notes" on member_motto_notes;

create policy "members can insert own motto note" on member_motto_notes for insert
  with check (
    family_member_id in (
      select id from family_members where user_id = auth.uid() and family_id = member_motto_notes.family_id
    )
  );

create policy "members can update own motto note" on member_motto_notes for update
  using (
    family_member_id in (
      select id from family_members where user_id = auth.uid() and family_id = member_motto_notes.family_id
    )
  );

-- ── gratitude_posts ───────────────────────────────────────────────────────────
-- Replace the overly-broad insert/delete policies.
-- Insert: a member may only post as themselves.
-- Delete: owner/adult may delete any post; others may only delete their own.

drop policy if exists "family members can insert gratitude posts" on gratitude_posts;
drop policy if exists "family members can delete gratitude posts" on gratitude_posts;

create policy "members can insert own gratitude post" on gratitude_posts for insert
  with check (
    member_id in (
      select id from family_members where user_id = auth.uid() and family_id = gratitude_posts.family_id
    )
  );

create policy "members can delete own post or privileged can delete any" on gratitude_posts for delete
  using (
    -- The deleting user is the post owner
    member_id in (
      select id from family_members where user_id = auth.uid() and family_id = gratitude_posts.family_id
    )
    or
    -- OR the deleting user is an owner/adult in the same family
    exists (
      select 1 from family_members
      where user_id = auth.uid()
        and family_id = gratitude_posts.family_id
        and role in ('owner', 'adult')
    )
  );
