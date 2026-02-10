-- Remove Spanish training feature: drop all related tables.
-- Use IF EXISTS so this is safe whether or not 009_spanish_training was applied.

drop table if exists public.spanish_grammar_attempts;
drop table if exists public.spanish_grammar_questions;
drop table if exists public.spanish_study_streaks;
drop table if exists public.spanish_flashcard_progress;
drop table if exists public.spanish_vocabulary;
drop table if exists public.spanish_progress;
drop table if exists public.spanish_lessons;
