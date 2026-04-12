-- D13: Add missing family_id indexes on tables created after migration 033
-- book_club_books, family_challenges, and gift_exchanges were created without
-- the family_id indexes that all other family-scoped tables received in 033.

CREATE INDEX IF NOT EXISTS idx_book_club_books_family_id
  ON public.book_club_books (family_id);

CREATE INDEX IF NOT EXISTS idx_family_challenges_family_id
  ON public.family_challenges (family_id);

CREATE INDEX IF NOT EXISTS idx_gift_exchanges_family_id
  ON public.gift_exchanges (family_id);
