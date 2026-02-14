-- Remove death box feature
-- Drop the death_box_items table and related storage bucket

-- Drop the table (CASCADE will handle any foreign key dependencies)
drop table if exists public.death_box_items cascade;

-- Delete the storage bucket for death box files
-- Note: This requires manual cleanup in Supabase dashboard or via API
-- The bucket name is: 'death-box-files'
-- Supabase SQL doesn't have direct DROP BUCKET command, so this is a reminder
-- You may need to delete this bucket manually from the Supabase dashboard under Storage
