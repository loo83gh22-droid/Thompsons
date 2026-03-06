-- Migration 081: Idempotency keys for journal entries and voice memos (W14)
-- Prevents duplicate rows on network retry by adding a nullable uuid column
-- with a partial unique index (only enforces uniqueness when key is non-null).

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS journal_entries_idempotency_key_idx
  ON public.journal_entries(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.voice_memos
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS voice_memos_idempotency_key_idx
  ON public.voice_memos(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
