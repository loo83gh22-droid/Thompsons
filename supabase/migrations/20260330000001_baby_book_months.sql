-- Baby Book monthly entries
-- One entry per child per calendar month, with one favourite photo + story.
-- entry_month is stored as the first day of the month (e.g. 2024-03-01).

create table baby_book_months (
  id                uuid        primary key default gen_random_uuid(),
  family_id         uuid        not null references families(id) on delete cascade,
  member_id         uuid        not null references family_members(id) on delete cascade,
  entry_month       date        not null,
  photo_url         text,
  photo_path        text,
  photo_size_bytes  bigint      not null default 0,
  story             text,
  created_by        uuid        references family_members(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (member_id, entry_month)
);

alter table baby_book_months enable row level security;

create policy "family members can manage baby book months"
  on baby_book_months
  for all
  using  (family_id = any(user_family_ids()))
  with check (family_id = any(user_family_ids()));

create index baby_book_months_member_idx
  on baby_book_months (member_id, entry_month);
