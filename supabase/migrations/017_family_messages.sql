-- Thompsons - Family messages (pop-up on login, optional email)

-- Add contact_email to family_members for email notifications
alter table public.family_members add column if not exists contact_email text;

create table public.family_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.family_members(id) on delete set null,
  title text not null,
  content text not null,
  show_on_date date, -- null = show on next login; set for date-specific (e.g. Valentine's)
  created_at timestamptz default now()
);

-- Recipients: empty = all family; otherwise specific members
create table public.family_message_recipients (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references public.family_messages(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  unique(message_id, family_member_id)
);

create table public.family_message_reads (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references public.family_messages(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  read_at timestamptz default now(),
  unique(message_id, family_member_id)
);

alter table public.family_messages enable row level security;
alter table public.family_message_recipients enable row level security;
alter table public.family_message_reads enable row level security;

create policy "Authenticated users can manage family_messages"
  on public.family_messages for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage family_message_recipients"
  on public.family_message_recipients for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage family_message_reads"
  on public.family_message_reads for all
  using (auth.role() = 'authenticated');
