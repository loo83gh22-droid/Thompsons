# Phase 3: Onboarding & Email Automation - Handoff Document

**Status:** Ready for implementation
**Prerequisites:** Phase 1 complete (skills installed), Phase 2 complete (landing page optimized)
**Estimated Duration:** Days 6-8 (3 days)
**Primary Goal:** Implement email drip campaigns and optimize onboarding flow to drive activation

---

## Context

Our Family Nest currently has:
- ✅ Welcome modal that can be dismissed
- ✅ Onboarding checklist with 5 steps (optional, can be hidden)
- ✅ Resend API integrated with 3 email types (birthday, time capsule, weekly digest)
- ❌ **NO welcome email sent on signup** (critical gap)
- ❌ No activation nurture sequence
- ❌ No re-engagement campaigns

**Current activation rate:** Unknown (no tracking yet)
**Target activation rate:** 50% signup → first action (photo upload or journal entry)

---

## Objectives

1. **Implement 6-email drip campaign** to drive activation and retention
2. **Enhance onboarding flow** to reduce time-to-first-value from days to minutes
3. **Add email tracking** to measure campaign effectiveness
4. **Fix empty state CTAs** to guide users to first actions

---

## Implementation Tasks

### Task 3.1: Welcome Email (Immediate Send)

**Goal:** Send welcome email immediately after signup to confirm account and guide first steps.

**Files to Create/Modify:**
1. `app/api/emails/send-welcome/route.ts` - New API route for welcome email
2. `app/login/page.tsx` - Modify signup server action to trigger welcome email
3. `supabase/migrations/057_create_email_campaigns_table.sql` - New migration for tracking

**Implementation Steps:**

1. **Create email campaigns tracking table:**
```sql
-- File: supabase/migrations/057_create_email_campaigns_table.sql
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
```

2. **Apply migration:**
```bash
# Use Supabase MCP tool
mcp__f2bd0ecb-6aa3-4107-b078-5b1a8e20d045__apply_migration(
  project_id: "tstbngohenxrbqroejth",
  name: "057_create_email_campaigns_table",
  query: [SQL from above]
)
```

3. **Create welcome email API route:**
```typescript
// File: app/api/emails/send-welcome/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/src/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, familyId } = await request.json();

    const supabase = await createClient();

    // Get family member ID
    const { data: member } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('family_id', familyId)
      .single();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .checklist { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .checklist-item { margin: 10px 0; padding-left: 25px; position: relative; }
            .checklist-item:before { content: "✓"; position: absolute; left: 0; color: #0ea5e9; font-weight: bold; }
            .cta { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏡 Welcome to Our Family Nest, ${name}!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We're thrilled to have you here! Your Family Nest is ready, and we can't wait to see the memories you'll preserve.</p>

              <div class="checklist">
                <h3>Get Started in 3 Easy Steps:</h3>
                <div class="checklist-item">Add your first family member (or they add themselves!)</div>
                <div class="checklist-item">Upload your favorite family photo</div>
                <div class="checklist-item">Write one sentence about that moment</div>
              </div>

              <p>That's it! In less than 5 minutes, you'll have started your family's digital heirloom.</p>

              <center>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ourfamilynest.com'}/dashboard/photos" class="cta">
                  📷 Upload Your First Photo
                </a>
              </center>

              <p style="margin-top: 30px;">Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ourfamilynest.com'}/getting-started">Quick Start Guide</a>.</p>

              <p>Welcome to the family,<br>The Our Family Nest Team</p>
            </div>
            <div class="footer">
              <p>Our Family Nest • Preserving memories, one family at a time</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Our Family Nest <notifications@resend.dev>',
      to: email,
      subject: 'Welcome to Our Family Nest! 🏡',
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending welcome email:', emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    // Track email sent
    if (member) {
      await supabase.from('email_campaigns').insert({
        family_member_id: member.id,
        campaign_type: 'welcome',
      });
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });
  } catch (error: any) {
    console.error('Error in send-welcome:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

4. **Trigger welcome email from signup:**
```typescript
// File: app/login/page.tsx
// Find the signup server action and add this after successful user creation:

// After creating family member, send welcome email
if (process.env.RESEND_API_KEY) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails/send-welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        name: formData.yourName,
        familyId: newFamily.id,
      }),
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail signup if email fails
  }
}
```

**Verification:**
1. Sign up with new test account
2. Check email inbox within 30 seconds
3. Verify all links work (dashboard, photos, getting started)
4. Test email rendering in Gmail, Outlook, Apple Mail
5. Check `email_campaigns` table for record

---

### Task 3.2: Activation Drip Campaign (Days 1, 3, 5, 14, 30)

**Goal:** Extend existing cron job to send activation nudges based on user behavior.

**Files to Modify:**
1. `app/api/notifications/route.ts` - Extend with new email campaigns
2. `vercel.json` - Verify cron schedule (already set to daily 14:00 UTC)

**Implementation Steps:**

1. **Extend notifications route with activation campaigns:**

Add these functions to `app/api/notifications/route.ts`:

```typescript
// Day 1: Activation Nudge for users with 0 photos
async function sendDay1ActivationEmails(supabase: SupabaseClient) {
  const results = [];

  // Find families created 24 hours ago with 0 photos
  const { data: inactiveFamilies } = await supabase
    .from('families')
    .select(`
      id,
      name,
      family_members!inner(id, name, contact_email, user_id)
    `)
    .gte('created_at', new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
    .lte('created_at', new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString());

  if (!inactiveFamilies) return results;

  for (const family of inactiveFamilies) {
    // Check if family has any photos
    const { count: photoCount } = await supabase
      .from('journal_photos')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', family.id);

    if (photoCount === 0) {
      // Send activation email to family owner
      const owner = family.family_members.find((m: any) => m.user_id);
      if (owner?.contact_email) {
        const emailHtml = `
          <h2>Your family's story starts with one photo 📷</h2>
          <p>Hi ${owner.name},</p>
          <p>Yesterday you created your Family Nest. We noticed you haven't uploaded your first photo yet!</p>
          <p>Here's why your first photo matters:</p>
          <ul>
            <li>It kicks off your family timeline</li>
            <li>It becomes searchable and shareable</li>
            <li>It inspires others in your family to contribute</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/photos" style="background:#0ea5e9;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Upload Your First Photo Now</a></p>
        `;

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Our Family Nest <notifications@resend.dev>',
          to: owner.contact_email,
          subject: "Your family's story starts with one photo 📷",
          html: emailHtml,
        });

        await supabase.from('email_campaigns').insert({
          family_member_id: owner.id,
          campaign_type: 'day1_nudge',
        });

        results.push({ family: family.name, type: 'day1_nudge' });
      }
    }
  }

  return results;
}

// Day 3: Feature Discovery for users with <3 features used
async function sendDay3FeatureDiscoveryEmails(supabase: SupabaseClient) {
  // Similar pattern - query families created 3 days ago
  // Count features used (journal, photos, voice, stories, events)
  // Send email highlighting underutilized features
  // Track in email_campaigns table
}

// Day 5: Invite Encouragement for single-member families
async function sendDay5InviteEmails(supabase: SupabaseClient) {
  // Query families created 5 days ago with only 1 member
  // Send email about inviting family members
}

// Day 14: Upgrade Consideration for Free tier approaching limits
async function sendDay14UpgradeEmails(supabase: SupabaseClient) {
  // Query Free tier families with 8+ journals OR 400+ MB storage
  // Send upgrade email with pricing breakdown
}

// Day 30: Re-engagement for dormant users
async function sendDay30ReengagementEmails(supabase: SupabaseClient) {
  // Query families with no activity (photos, journals, logins) in 30 days
  // Send gentle reminder with CTA to return
}
```

2. **Update main GET handler to call all email functions:**

```typescript
// In app/api/notifications/route.ts GET handler, add:
const day1Results = await sendDay1ActivationEmails(supabase);
const day3Results = await sendDay3FeatureDiscoveryEmails(supabase);
const day5Results = await sendDay5InviteEmails(supabase);
const day14Results = await sendDay14UpgradeEmails(supabase);
const day30Results = await sendDay30ReengagementEmails(supabase);

// Add to response summary
```

**Verification:**
1. Manually trigger cron: `GET /api/notifications?key=CRON_SECRET`
2. Check Resend dashboard for email deliveries
3. Verify `email_campaigns` table populates
4. Test with backdated test accounts (modify `created_at` in database)
5. Monitor open rates in Resend dashboard (target: 35-45%)

---

### Task 3.3: Onboarding Flow Enhancements

**Goal:** Make onboarding more engaging and harder to skip.

**Files to Modify:**
1. `app/components/WelcomeModal.tsx` - Enhance with progress indicators
2. `app/components/OnboardingChecklist.tsx` - Add gamification
3. `app/components/ActivityFeed.tsx` - Fix empty state CTA

**Implementation Steps:**

1. **Enhance WelcomeModal with progress:**
```tsx
// In WelcomeModal.tsx, add step indicator
const [currentStep, setCurrentStep] = useState(0);

const steps = [
  { title: "Add Your First Family Member", action: "/dashboard/our-family" },
  { title: "Upload Your Favorite Photo", action: "/dashboard/photos" },
  { title: "Write One Sentence", action: "/dashboard/journal/new" },
];

// Add visual progress bar: {currentStep + 1} / 3
// Add "Next" and "Previous" buttons for multi-step flow
```

2. **Add celebration to OnboardingChecklist:**
```tsx
// When all 5 steps complete, show confetti animation
import Confetti from 'react-confetti';

{allComplete && <Confetti numberOfPieces={200} recycle={false} />}
```

3. **Fix ActivityFeed empty state:**
```tsx
// File: app/components/ActivityFeed.tsx
// Add CTA button to empty state
<div className="text-center">
  <p className="text-muted-foreground">Your family story starts here...</p>
  <Link href="/dashboard/photos" className="btn-primary mt-4">
    Upload Your First Photo
  </Link>
</div>
```

**Verification:**
1. Sign up fresh account → Welcome modal appears with step 1/3
2. Complete steps → Progress updates
3. All steps complete → Confetti animation plays
4. Visit activity feed with 0 activity → CTA button present

---

## Success Metrics (End of Phase 3)

**Email Performance:**
- ✅ 35-45% open rate on welcome email
- ✅ 15-20% click-through rate on CTAs
- ✅ <2% bounce rate
- ✅ All 6 email types sending successfully

**Activation:**
- ✅ 50% signup → first action (photo upload) within 24 hours
- ✅ 30% Day 7 retention (users return within 7 days)
- ✅ Email nudges increase activation by 15-20%

**Onboarding:**
- ✅ 40% of users complete all 5 onboarding steps
- ✅ Time-to-first-value: <5 minutes average

---

## Environment Variables Needed

Add to Vercel and `.env.local`:
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Our Family Nest <notifications@resend.dev>
CRON_SECRET=[secure random string]
NEXT_PUBLIC_SITE_URL=https://ourfamilynest.com
```

---

## Testing Checklist

- [ ] Welcome email sends immediately after signup
- [ ] All email links work and redirect correctly
- [ ] Day 1 activation email triggers for 24-hour inactive accounts
- [ ] Day 3 feature discovery email triggers for low-engagement accounts
- [ ] Day 5 invite email triggers for single-member families
- [ ] Day 14 upgrade email triggers for Free tier near limits
- [ ] Day 30 re-engagement email triggers for dormant users
- [ ] Email campaigns table tracks all sends
- [ ] Resend dashboard shows >95% delivery rate
- [ ] WelcomeModal shows progress 1/3, 2/3, 3/3
- [ ] OnboardingChecklist shows confetti on completion
- [ ] ActivityFeed empty state has CTA button
- [ ] All emails render correctly in Gmail, Outlook, Apple Mail

---

## Rollback Plan

If email deliverability issues arise:
1. Pause cron job in `vercel.json` (comment out schedule)
2. Verify Resend domain authentication
3. Check bounce rate <2% in Resend dashboard
4. Test with single test email before re-enabling batch sends

If onboarding changes cause issues:
1. Revert `WelcomeModal.tsx` and `OnboardingChecklist.tsx` changes
2. Keep welcome email (most critical feature)
3. Monitor analytics for drop-off points

---

## Next Steps After Phase 3

Once Phase 3 is complete:
1. **Monitor email metrics** in Resend dashboard for 3-5 days
2. **A/B test email subject lines** if open rates <35%
3. **Move to Phase 4:** AI Quick-Win Features (voice transcription, recipe parsing, journal prompts)

---

## Questions for Implementation

- Do you have actual beta user testimonials for email social proof?
- What should the support email be? (currently using placeholder)
- Do you want email open tracking via Resend webhooks?
- Should we add unsubscribe links to all emails?

---

**Handoff prepared by:** Claude (Phase 1-2 complete)
**Date:** 2026-02-14
**Plan reference:** `C:\Users\keepi\.claude\plans\witty-greeting-lerdorf.md`
