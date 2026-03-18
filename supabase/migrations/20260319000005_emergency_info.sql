-- Emergency Info: medical contacts, allergies, insurance, and important numbers.

create table if not exists emergency_contacts (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  member_id   uuid references family_members(id) on delete set null,
  contact_name text not null,
  relationship text,
  phone       text,
  email       text,
  is_primary  boolean not null default false,
  notes       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists medical_info (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  member_id   uuid not null references family_members(id) on delete cascade,
  blood_type  text,
  allergies   text,
  medications text,
  conditions  text,
  doctor_name text,
  doctor_phone text,
  insurance_provider text,
  insurance_policy_number text,
  notes       text,
  updated_at  timestamptz not null default now(),
  unique (family_id, member_id)
);

-- RLS
alter table emergency_contacts enable row level security;
alter table medical_info enable row level security;

create policy "Members can view own family emergency contacts"
  on emergency_contacts for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Adults can manage emergency contacts"
  on emergency_contacts for all
  using (family_id in (select family_id from family_members where user_id = auth.uid() and role in ('owner', 'adult')));

create policy "Members can view own family medical info"
  on medical_info for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Adults can manage medical info"
  on medical_info for all
  using (family_id in (select family_id from family_members where user_id = auth.uid() and role in ('owner', 'adult')));
