-- Family Contacts: external people who receive shares but don't have app accounts
create table if not exists family_contacts (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  relationship text,  -- "Grandma", "Uncle Dave", "Aunt Sarah", etc.
  notes        text,
  created_at   timestamptz not null default now()
);

alter table family_contacts enable row level security;

create policy "family_contacts_select" on family_contacts
  for select using (family_id in (select public.user_family_ids()));
create policy "family_contacts_insert" on family_contacts
  for insert with check (family_id in (select public.user_family_ids()));
create policy "family_contacts_update" on family_contacts
  for update using (family_id in (select public.user_family_ids()));
create policy "family_contacts_delete" on family_contacts
  for delete using (family_id in (select public.user_family_ids()));

create index idx_family_contacts_family on family_contacts(family_id);

-- Track digest emails sent (for history/audit)
create table if not exists digest_sends (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references families(id) on delete cascade,
  sent_by          uuid references family_members(id) on delete set null,
  subject          text not null,
  recipient_emails text[] not null default '{}',
  content_items    jsonb not null default '[]',
  sent_at          timestamptz not null default now()
);

alter table digest_sends enable row level security;

create policy "digest_sends_select" on digest_sends
  for select using (family_id in (select public.user_family_ids()));
create policy "digest_sends_insert" on digest_sends
  for insert with check (family_id in (select public.user_family_ids()));
create policy "digest_sends_delete" on digest_sends
  for delete using (family_id in (select public.user_family_ids()));

create index idx_digest_sends_family on digest_sends(family_id);
