# Spanish Training – Database Schema & Architecture

## Overview

Personal Spanish training within Thompsons. Each family member tracks their own progress. Features: Dashboard (streaks, vocabulary), Flashcards (Leitner SRS), Grammar Quiz, Audio (Speech Synthesis), AI Tutor (OpenAI).

---

## Database Schema

### Existing Tables (from 001_initial_schema.sql)

- **spanish_lessons** – Static lesson content (vocabulary, phrases)
- **spanish_progress** – Per-family-member completion of lessons (lesson_id, score)

### New Tables

#### 1. `spanish_vocabulary`
Flashcard items (verbs, nouns) for SRS.

| Column        | Type         | Description                          |
|---------------|--------------|--------------------------------------|
| id            | uuid         | Primary key                          |
| spanish       | text         | Spanish word/phrase                  |
| english       | text         | English translation                  |
| type          | text         | 'verb', 'noun', 'phrase'             |
| tense         | text         | For verbs: 'present', 'preterite', etc. |
| created_at    | timestamptz  |                                      |

#### 2. `spanish_flashcard_progress` (Leitner SRS)
Per-user progress for each vocabulary item.

| Column        | Type         | Description                          |
|---------------|--------------|--------------------------------------|
| id            | uuid         | Primary key                          |
| family_member_id | uuid      | FK → family_members                   |
| vocabulary_id | uuid         | FK → spanish_vocabulary              |
| box_level     | int          | Leitner box (0–5, 0=new)             |
| next_review_at| timestamptz | When to show again                   |
| last_reviewed_at | timestamptz |                                  |
| created_at    | timestamptz  |                                      |

**Unique:** (family_member_id, vocabulary_id)

#### 3. `spanish_study_streaks`
Daily study activity for streak calculation.

| Column        | Type         | Description                          |
|---------------|--------------|--------------------------------------|
| id            | uuid         | Primary key                          |
| family_member_id | uuid      | FK → family_members                   |
| study_date    | date         | Date studied (one row per day)       |
| vocabulary_mastered | int      | New words mastered that day          |
| flashcards_reviewed | int      | Cards reviewed                       |
| quiz_score    | int          | Best quiz score (0–100) or null      |
| created_at    | timestamptz  |                                      |

**Unique:** (family_member_id, study_date)

#### 4. `spanish_grammar_questions`
Multiple-choice grammar questions (verb conjugations).

| Column        | Type         | Description                          |
|---------------|--------------|--------------------------------------|
| id            | uuid         | Primary key                          |
| infinitive    | text         | e.g. "hablar", "comer", "vivir"      |
| tense         | text         | 'present', 'preterite', etc.          |
| person        | text         | 'yo', 'tú', 'él/ella', etc.          |
| correct_answer | text       | Correct conjugated form              |
| wrong_answers | jsonb        | Array of 3 wrong options             |
| created_at    | timestamptz  |                                      |

#### 5. `spanish_grammar_attempts`
Per-user quiz attempts.

| Column        | Type         | Description                          |
|---------------|--------------|--------------------------------------|
| id            | uuid         | Primary key                          |
| family_member_id | uuid      | FK → family_members                   |
| question_id   | uuid         | FK → spanish_grammar_questions        |
| correct       | boolean      | Whether they got it right             |
| answered_at   | timestamptz  |                                      |

#### 6. `spanish_ai_chat` (optional – for AI Tutor history)
Store chat history if we want persistence.

| Column        | Type         | Description                          |
|---------------|--------------|--------------------------------------|
| id            | uuid         | Primary key                          |
| family_member_id | uuid      | FK → family_members                   |
| role          | text         | 'user' or 'assistant'                |
| content       | text         | Message content                      |
| created_at    | timestamptz  |                                      |

---

## Leitner System (SRS)

- **Box 0:** New cards, shown first
- **Box 1:** 1 day interval
- **Box 2:** 3 days
- **Box 3:** 7 days
- **Box 4:** 14 days
- **Box 5:** 30 days (mastered)

Correct → move to next box. Wrong → back to box 0.

---

## Routes

| Route                          | Purpose                    |
|--------------------------------|----------------------------|
| /dashboard/spanish             | Dashboard (streaks, vocab)  |
| /dashboard/spanish/flashcards  | Leitner flashcard practice |
| /dashboard/spanish/quiz        | Grammar quiz               |
| /dashboard/spanish/tutor       | AI chat tutor              |

---

## Dependencies

- **lucide-react** – Icons
- **openai** – AI Tutor (optional, add when API key available)

---

## Environment Variables

- `OPENAI_API_KEY` – For AI Tutor (optional)
