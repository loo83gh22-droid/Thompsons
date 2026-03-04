-- One Line A Day: private personal journal (one entry per user per day)
CREATE TABLE one_line_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 140),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX one_line_entries_user_date ON one_line_entries(user_id, entry_date DESC);

ALTER TABLE one_line_entries ENABLE ROW LEVEL SECURITY;

-- Strictly private: only the owning user can read/write their entries
CREATE POLICY "Users view own one-line entries"
  ON one_line_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own one-line entries"
  ON one_line_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own one-line entries"
  ON one_line_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own one-line entries"
  ON one_line_entries FOR DELETE
  USING (user_id = auth.uid());
