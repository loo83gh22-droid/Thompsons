-- Change all content-owning CASCADE FKs to SET NULL so deleting a member
-- preserves their content (journal entries, artwork, gratitude posts, etc.)
-- Content can be manually deleted by adult users / owner if needed.

-- journal_entries.author_id
ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_author_id_fkey;
ALTER TABLE journal_entries ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- artwork_pieces.family_member_id
ALTER TABLE artwork_pieces DROP CONSTRAINT artwork_pieces_family_member_id_fkey;
ALTER TABLE artwork_pieces ALTER COLUMN family_member_id DROP NOT NULL;
ALTER TABLE artwork_pieces ADD CONSTRAINT artwork_pieces_family_member_id_fkey
  FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- gratitude_posts.member_id
ALTER TABLE gratitude_posts DROP CONSTRAINT gratitude_posts_member_id_fkey;
ALTER TABLE gratitude_posts ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE gratitude_posts ADD CONSTRAINT gratitude_posts_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- travel_locations.family_member_id
ALTER TABLE travel_locations DROP CONSTRAINT travel_locations_family_member_id_fkey;
ALTER TABLE travel_locations ALTER COLUMN family_member_id DROP NOT NULL;
ALTER TABLE travel_locations ADD CONSTRAINT travel_locations_family_member_id_fkey
  FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- workouts.family_member_id
ALTER TABLE workouts DROP CONSTRAINT workouts_family_member_id_fkey;
ALTER TABLE workouts ALTER COLUMN family_member_id DROP NOT NULL;
ALTER TABLE workouts ADD CONSTRAINT workouts_family_member_id_fkey
  FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- baby_book_months.member_id
ALTER TABLE baby_book_months DROP CONSTRAINT baby_book_months_member_id_fkey;
ALTER TABLE baby_book_months ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE baby_book_months ADD CONSTRAINT baby_book_months_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- baby_book_profiles.family_member_id
ALTER TABLE baby_book_profiles DROP CONSTRAINT baby_book_profiles_family_member_id_fkey;
ALTER TABLE baby_book_profiles ALTER COLUMN family_member_id DROP NOT NULL;
ALTER TABLE baby_book_profiles ADD CONSTRAINT baby_book_profiles_family_member_id_fkey
  FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- book_club_books.member_id
ALTER TABLE book_club_books DROP CONSTRAINT book_club_books_member_id_fkey;
ALTER TABLE book_club_books ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE book_club_books ADD CONSTRAINT book_club_books_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- medical_info.member_id
ALTER TABLE medical_info DROP CONSTRAINT medical_info_member_id_fkey;
ALTER TABLE medical_info ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE medical_info ADD CONSTRAINT medical_info_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- family_resumes.family_member_id
ALTER TABLE family_resumes DROP CONSTRAINT family_resumes_family_member_id_fkey;
ALTER TABLE family_resumes ALTER COLUMN family_member_id DROP NOT NULL;
ALTER TABLE family_resumes ADD CONSTRAINT family_resumes_family_member_id_fkey
  FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- gift_exchange_wishlist_items.member_id
ALTER TABLE gift_exchange_wishlist_items DROP CONSTRAINT gift_exchange_wishlist_items_member_id_fkey;
ALTER TABLE gift_exchange_wishlist_items ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE gift_exchange_wishlist_items ADD CONSTRAINT gift_exchange_wishlist_items_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- time_capsules.to_family_member_id
ALTER TABLE time_capsules DROP CONSTRAINT time_capsules_to_family_member_id_fkey;
ALTER TABLE time_capsules ALTER COLUMN to_family_member_id DROP NOT NULL;
ALTER TABLE time_capsules ADD CONSTRAINT time_capsules_to_family_member_id_fkey
  FOREIGN KEY (to_family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- journal_perspectives.family_member_id
ALTER TABLE journal_perspectives DROP CONSTRAINT journal_perspectives_family_member_id_fkey;
ALTER TABLE journal_perspectives ALTER COLUMN family_member_id DROP NOT NULL;
ALTER TABLE journal_perspectives ADD CONSTRAINT journal_perspectives_family_member_id_fkey
  FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

-- story_perspectives.family_member_id
ALTER TABLE story_perspectives DROP CONSTRAINT story_perspectives_family_member_id_fkey;
ALTER TABLE story_perspectives ALTER COLUMN family_member_id DROP NOT NULL;
ALTER TABLE story_perspectives ADD CONSTRAINT story_perspectives_family_member_id_fkey
  FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
