-- Gift Exchange: Secret Santa draws, wishlists, and budget tracking.

create table if not exists gift_exchanges (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  description text,
  budget_limit numeric(10,2),
  exchange_date date,
  status      text not null default 'open' check (status in ('open', 'drawn', 'completed')),
  created_by  uuid references family_members(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists gift_exchange_participants (
  id            uuid primary key default gen_random_uuid(),
  exchange_id   uuid not null references gift_exchanges(id) on delete cascade,
  member_id     uuid not null references family_members(id) on delete cascade,
  assigned_to   uuid references family_members(id) on delete set null,
  unique (exchange_id, member_id)
);

create table if not exists gift_exchange_wishlist_items (
  id              uuid primary key default gen_random_uuid(),
  exchange_id     uuid not null references gift_exchanges(id) on delete cascade,
  member_id       uuid not null references family_members(id) on delete cascade,
  item_name       text not null,
  item_url        text,
  notes           text,
  created_at      timestamptz not null default now()
);

-- RLS
alter table gift_exchanges enable row level security;
alter table gift_exchange_participants enable row level security;
alter table gift_exchange_wishlist_items enable row level security;

create policy "Members can view own family gift exchanges"
  on gift_exchanges for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Adults can manage gift exchanges"
  on gift_exchanges for all
  using (family_id in (select family_id from family_members where user_id = auth.uid() and role in ('owner', 'adult')));

create policy "Members can view participants"
  on gift_exchange_participants for select
  using (exchange_id in (select id from gift_exchanges where family_id in (select family_id from family_members where user_id = auth.uid())));

create policy "Adults can manage participants"
  on gift_exchange_participants for all
  using (exchange_id in (select id from gift_exchanges where family_id in (select family_id from family_members where user_id = auth.uid() and role in ('owner', 'adult'))));

create policy "Members can view wishlists"
  on gift_exchange_wishlist_items for select
  using (exchange_id in (select id from gift_exchanges where family_id in (select family_id from family_members where user_id = auth.uid())));

create policy "Members can manage own wishlist items"
  on gift_exchange_wishlist_items for all
  using (member_id in (select id from family_members where user_id = auth.uid()));
