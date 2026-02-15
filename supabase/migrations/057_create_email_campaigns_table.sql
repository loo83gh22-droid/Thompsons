-- Create email campaigns tracking table for drip campaign monitoring
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN (
    'welcome',
    'day1_nudge',
    'day3_discovery',
    'day5_invite',
    'day14_upgrade',
    'day30_reengagement'
  )),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_member ON email_campaigns(family_member_id);
CREATE INDEX idx_email_campaigns_type ON email_campaigns(campaign_type);
CREATE INDEX idx_email_campaigns_sent ON email_campaigns(sent_at);

-- Enable RLS
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see their own email campaigns
CREATE POLICY "Users can view their own email campaigns"
  ON email_campaigns FOR SELECT
  USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
