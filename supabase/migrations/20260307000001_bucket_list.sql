-- Bucket List feature
-- Items can be family-wide ("scope = family") or personal ("scope = personal").
-- Personal items can be private (is_private = true) — only the owner sees them.

CREATE TABLE IF NOT EXISTS bucket_list_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title             text NOT NULL,
  description       text,
  scope             text NOT NULL DEFAULT 'family' CHECK (scope IN ('family', 'personal')),
  is_private        boolean NOT NULL DEFAULT false,
  added_by          uuid REFERENCES family_members(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'dream'
                      CHECK (status IN ('dream', 'planned', 'in_progress', 'completed')),
  category          text CHECK (category IN ('travel', 'adventure', 'learning', 'food', 'creative', 'sports', 'together', 'milestone')),
  target_date       date,
  completed_at      timestamptz,
  completed_note    text,
  sort_order        int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Cheers: family members can "cheer" any visible bucket list item
CREATE TABLE IF NOT EXISTS bucket_list_cheers (
  item_id    uuid NOT NULL REFERENCES bucket_list_items(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS bucket_list_items_family_id_idx  ON bucket_list_items(family_id);
CREATE INDEX IF NOT EXISTS bucket_list_items_added_by_idx   ON bucket_list_items(added_by);
CREATE INDEX IF NOT EXISTS bucket_list_items_status_idx     ON bucket_list_items(status);
CREATE INDEX IF NOT EXISTS bucket_list_cheers_item_id_idx   ON bucket_list_cheers(item_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_bucket_list_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bucket_list_items_updated_at ON bucket_list_items;
CREATE TRIGGER bucket_list_items_updated_at
  BEFORE UPDATE ON bucket_list_items
  FOR EACH ROW EXECUTE FUNCTION update_bucket_list_updated_at();

-- Row Level Security
ALTER TABLE bucket_list_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list_cheers ENABLE ROW LEVEL SECURITY;

-- bucket_list_items: members can see family items + their own personal items +
-- non-private personal items from other members in the same family.
CREATE POLICY "bucket_list_items_select" ON bucket_list_items
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
    AND (
      scope = 'family'
      OR is_private = false
      OR added_by IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

-- Anyone in the family can insert items
CREATE POLICY "bucket_list_items_insert" ON bucket_list_items
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Update: owner of personal item, OR any family member for family items (adults+)
CREATE POLICY "bucket_list_items_update" ON bucket_list_items
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
    AND (
      -- personal items: only the creator can update
      (scope = 'personal' AND added_by IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      ))
      OR
      -- family items: any adult/owner in the family can update
      (scope = 'family' AND EXISTS (
        SELECT 1 FROM family_members
        WHERE user_id = auth.uid()
          AND family_id = bucket_list_items.family_id
          AND role IN ('owner', 'adult')
      ))
    )
  );

-- Delete: same rules as update
CREATE POLICY "bucket_list_items_delete" ON bucket_list_items
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
    AND (
      (scope = 'personal' AND added_by IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      ))
      OR
      (scope = 'family' AND EXISTS (
        SELECT 1 FROM family_members
        WHERE user_id = auth.uid()
          AND family_id = bucket_list_items.family_id
          AND role IN ('owner', 'adult')
      ))
    )
  );

-- Cheers: readable by any family member
CREATE POLICY "bucket_list_cheers_select" ON bucket_list_cheers
  FOR SELECT USING (
    item_id IN (
      SELECT id FROM bucket_list_items
      WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

-- Cheer insert: any family member for visible items
CREATE POLICY "bucket_list_cheers_insert" ON bucket_list_cheers
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Remove own cheer
CREATE POLICY "bucket_list_cheers_delete" ON bucket_list_cheers
  FOR DELETE USING (
    member_id IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );
