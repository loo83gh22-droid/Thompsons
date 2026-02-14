-- Clean up death box feature from database
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tstbngohenxrbqroejth/sql/new

-- Drop the death_box_items table (CASCADE removes any foreign key dependencies)
DROP TABLE IF EXISTS public.death_box_items CASCADE;

-- Verify the table is gone
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'death_box_items';

-- Should return 0 rows if successful
