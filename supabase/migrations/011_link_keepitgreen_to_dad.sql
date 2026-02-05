-- Thompsons - Link keepitgreen user to Dad (Robert Scott Thompson)
-- Run in Supabase SQL Editor after keepitgreen has signed up

-- Dad's family_member id: a0000003-0003-0003-0003-000000000003
-- Links auth user whose email contains 'keepitgreen' to Dad
update public.family_members
set user_id = (
  select id from auth.users
  where email ilike '%keepitgreen%'
  limit 1
)
where id = 'a0000003-0003-0003-0003-000000000003'
  and exists (select 1 from auth.users where email ilike '%keepitgreen%' limit 1);
