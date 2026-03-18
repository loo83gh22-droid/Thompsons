-- Reunion Planner: coordinate family gatherings with RSVPs
-- Phase A (MVP): reunions + rsvps tables only

CREATE TABLE IF NOT EXISTS reunions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  location_name text,
  location_lat  double precision,
  location_lng  double precision,
  start_date    date NOT NULL,
  end_date      date,
  status        text NOT NULL DEFAULT 'planning'
                  CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
  created_by    uuid REFERENCES family_members(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reunion_rsvps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reunion_id     uuid NOT NULL REFERENCES reunions(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('attending', 'maybe', 'declined', 'pending')),
  plus_ones      int NOT NULL DEFAULT 0,
  dietary_notes  text,
  notes          text,
  responded_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reunion_id, member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS reunions_family_id_idx    ON reunions(family_id);
CREATE INDEX IF NOT EXISTS reunions_start_date_idx   ON reunions(start_date);
CREATE INDEX IF NOT EXISTS reunions_created_by_idx   ON reunions(created_by);
CREATE INDEX IF NOT EXISTS reunion_rsvps_reunion_idx ON reunion_rsvps(reunion_id);
CREATE INDEX IF NOT EXISTS reunion_rsvps_member_idx  ON reunion_rsvps(member_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_reunions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reunions_updated_at ON reunions;
CREATE TRIGGER reunions_updated_at
  BEFORE UPDATE ON reunions
  FOR EACH ROW EXECUTE FUNCTION update_reunions_updated_at();

CREATE OR REPLACE FUNCTION update_reunion_rsvps_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reunion_rsvps_updated_at ON reunion_rsvps;
CREATE TRIGGER reunion_rsvps_updated_at
  BEFORE UPDATE ON reunion_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_reunion_rsvps_updated_at();

-- Row Level Security
ALTER TABLE reunions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunion_rsvps ENABLE ROW LEVEL SECURITY;

-- reunions: any family member can view
CREATE POLICY "reunions_select" ON reunions
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- reunions: any family member can create (server actions enforce adult+ role)
CREATE POLICY "reunions_insert" ON reunions
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- reunions: adults/owners can update
CREATE POLICY "reunions_update" ON reunions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE user_id = auth.uid()
        AND family_id = reunions.family_id
        AND role IN ('owner', 'adult')
    )
  );

-- reunions: adults/owners can delete
CREATE POLICY "reunions_delete" ON reunions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE user_id = auth.uid()
        AND family_id = reunions.family_id
        AND role IN ('owner', 'adult')
    )
  );

-- reunion_rsvps: any family member can view rsvps for their family's reunions
CREATE POLICY "reunion_rsvps_select" ON reunion_rsvps
  FOR SELECT USING (
    reunion_id IN (
      SELECT r.id FROM reunions r
      JOIN family_members fm ON fm.family_id = r.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- reunion_rsvps: members can insert their own rsvp
CREATE POLICY "reunion_rsvps_insert" ON reunion_rsvps
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- reunion_rsvps: members can update their own rsvp
CREATE POLICY "reunion_rsvps_update" ON reunion_rsvps
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- reunion_rsvps: members can delete their own rsvp
CREATE POLICY "reunion_rsvps_delete" ON reunion_rsvps
  FOR DELETE USING (
    member_id IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );
