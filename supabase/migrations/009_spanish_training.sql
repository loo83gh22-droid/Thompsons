-- Thompsons - Spanish Training: SRS, Grammar Quiz, Streaks
-- Run in Supabase SQL Editor

-- Vocabulary for flashcards (verbs, nouns)
create table if not exists public.spanish_vocabulary (
  id uuid primary key default uuid_generate_v4(),
  spanish text not null,
  english text not null,
  type text default 'phrase', -- verb, noun, phrase
  tense text, -- for verbs: present, preterite, etc.
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Leitner SRS progress per family member
create table if not exists public.spanish_flashcard_progress (
  id uuid primary key default uuid_generate_v4(),
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  vocabulary_id uuid references public.spanish_vocabulary(id) on delete cascade not null,
  box_level int default 0, -- 0=new, 1-5 Leitner boxes
  next_review_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique(family_member_id, vocabulary_id)
);

-- Daily study streaks
create table if not exists public.spanish_study_streaks (
  id uuid primary key default uuid_generate_v4(),
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  study_date date not null,
  vocabulary_mastered int default 0,
  flashcards_reviewed int default 0,
  quiz_score int,
  created_at timestamptz default now(),
  unique(family_member_id, study_date)
);

-- Grammar quiz questions
create table if not exists public.spanish_grammar_questions (
  id uuid primary key default uuid_generate_v4(),
  infinitive text not null,
  tense text not null default 'present',
  person text not null,
  correct_answer text not null,
  wrong_answers jsonb not null default '[]', -- array of 3 strings
  created_at timestamptz default now()
);

-- Grammar quiz attempts
create table if not exists public.spanish_grammar_attempts (
  id uuid primary key default uuid_generate_v4(),
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  question_id uuid references public.spanish_grammar_questions(id) on delete cascade not null,
  correct boolean not null,
  answered_at timestamptz default now()
);

-- RLS
alter table public.spanish_vocabulary enable row level security;
alter table public.spanish_flashcard_progress enable row level security;
alter table public.spanish_study_streaks enable row level security;
alter table public.spanish_grammar_questions enable row level security;
alter table public.spanish_grammar_attempts enable row level security;

create policy "Authenticated read spanish_vocabulary"
  on public.spanish_vocabulary for select using (auth.role() = 'authenticated');

create policy "Authenticated manage spanish_flashcard_progress"
  on public.spanish_flashcard_progress for all using (auth.role() = 'authenticated');

create policy "Authenticated manage spanish_study_streaks"
  on public.spanish_study_streaks for all using (auth.role() = 'authenticated');

create policy "Authenticated read spanish_grammar_questions"
  on public.spanish_grammar_questions for select using (auth.role() = 'authenticated');

create policy "Authenticated manage spanish_grammar_attempts"
  on public.spanish_grammar_attempts for all using (auth.role() = 'authenticated');

-- Seed vocabulary (common verbs and nouns)
insert into public.spanish_vocabulary (spanish, english, type, sort_order) values
  ('hola', 'hello', 'phrase', 1),
  ('adiós', 'goodbye', 'phrase', 2),
  ('gracias', 'thank you', 'phrase', 3),
  ('por favor', 'please', 'phrase', 4),
  ('sí', 'yes', 'phrase', 5),
  ('no', 'no', 'phrase', 6),
  ('agua', 'water', 'noun', 7),
  ('comida', 'food', 'noun', 8),
  ('casa', 'house', 'noun', 9),
  ('libro', 'book', 'noun', 10),
  ('hablar', 'to speak', 'verb', 11),
  ('comer', 'to eat', 'verb', 12),
  ('vivir', 'to live', 'verb', 13),
  ('trabajar', 'to work', 'verb', 14),
  ('estudiar', 'to study', 'verb', 15),
  ('beber', 'to drink', 'verb', 16),
  ('leer', 'to read', 'verb', 17),
  ('escribir', 'to write', 'verb', 18),
  ('ir', 'to go', 'verb', 19),
  ('ser', 'to be (permanent)', 'verb', 20),
  ('estar', 'to be (temporary)', 'verb', 21);

-- Seed grammar questions (Present -ar/-er/-ir)
insert into public.spanish_grammar_questions (infinitive, tense, person, correct_answer, wrong_answers) values
  ('hablar', 'present', 'yo', 'hablo', '["hablas", "habla", "hablamos"]'),
  ('hablar', 'present', 'tú', 'hablas', '["hablo", "habla", "hablan"]'),
  ('hablar', 'present', 'él/ella', 'habla', '["hablo", "hablas", "hablamos"]'),
  ('comer', 'present', 'yo', 'como', '["comes", "come", "comemos"]'),
  ('comer', 'present', 'tú', 'comes', '["como", "come", "comen"]'),
  ('comer', 'present', 'él/ella', 'come', '["como", "comes", "comemos"]'),
  ('vivir', 'present', 'yo', 'vivo', '["vives", "vive", "vivimos"]'),
  ('vivir', 'present', 'tú', 'vives', '["vivo", "vive", "viven"]'),
  ('vivir', 'present', 'él/ella', 'vive', '["vivo", "vives", "vivimos"]'),
  ('trabajar', 'present', 'yo', 'trabajo', '["trabajas", "trabaja", "trabajamos"]'),
  ('estudiar', 'present', 'él/ella', 'estudia', '["estudio", "estudias", "estudiamos"]'),
  ('beber', 'present', 'nosotros', 'bebemos', '["bebo", "bebes", "beben"]'),
  ('leer', 'present', 'yo', 'leo', '["lees", "lee", "leemos"]'),
  ('escribir', 'present', 'tú', 'escribes', '["escribo", "escribe", "escriben"]');
