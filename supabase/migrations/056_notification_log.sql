-- Notification log table for tracking sent emails and preventing spam
CREATE TABLE notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  email_address text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notification_log_member_type
  ON notification_log(family_member_id, notification_type, sent_at DESC);

-- RLS: Users can view notification logs for their family members
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_log_select_own_family"
  ON notification_log FOR SELECT
  USING (
    family_member_id IN (
      SELECT id FROM family_members
      WHERE family_id = (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() LIMIT 1
      )
    )
  );

-- Service role can insert logs (no user RLS needed for inserts)
CREATE POLICY "notification_log_insert_service"
  ON notification_log FOR INSERT
  WITH CHECK (true);
