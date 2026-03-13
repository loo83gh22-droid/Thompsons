-- Performance: composite index for one_line_entries page queries
-- Covers: SELECT ... WHERE user_id = ? AND entry_date >= ? ORDER BY entry_date DESC
CREATE INDEX IF NOT EXISTS idx_one_line_entries_user_date
  ON public.one_line_entries (user_id, entry_date DESC);
