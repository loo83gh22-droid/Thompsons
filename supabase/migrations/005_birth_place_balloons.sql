-- Thompsons - Birth places use two-balloons symbol (same symbol, different colours)
-- Run in Supabase SQL Editor

-- All birth place family members (Huck, Maui, Dad, Mom) use balloons symbol
update public.family_members set symbol = 'balloons' where id in (
  'a0000001-0001-0001-0001-000000000001',
  'a0000002-0002-0002-0002-000000000002',
  'a0000003-0003-0003-0003-000000000003',
  'a0000004-0004-0004-0004-000000000004'
);
