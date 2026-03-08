# FamilyNest Communications Review
**Date:** 2026-03-07
**Reviewed by:** Claude Sonnet 4.6 (automated audit)

---

## Scale Snapshot

| Metric | Value |
|--------|-------|
| Total families | 10 |
| New families (last 30 days) | 10 (100% — product is brand new) |
| Active users | 12 |
| Total emails sent (all time) | **0** |
| Distinct campaign types fired | **0** |

**Scale tier:** < 25 families — Early stage. Emails should feel founder-written and highly personal. Prioritise learning over automation.

---

## Section A: What's Working

The email and in-app infrastructure is **well-architected** and comprehensive:

- **14 distinct email types** implemented across `send-welcome`, `notifications`, and `stripe/webhook` routes
- **Resend** integration with consistent dark-theme templates (`shared.ts` helpers: `emailWrapper`, `card`, `ctaButton`, `esc`)
- **Deduplication via `email_campaigns` table** — used correctly in birthday, capsule, drip, and welcome flows
- **5-stage drip sequence** (Day 1, 3, 5, 14, 30) with behavioural conditions (photo count, member count, journal count)
- **Role-based invite gating** — invites never sent to `child` role accounts
- **Opaque invite tokens** — no PII in URLs
- **6 in-app components** all functioning: WelcomeModal, OnboardingChecklist, BirthdayBanner, BirthdayPrompt, PWAInstallBanner, FeedbackPromptModal
- **InspirationTip** with 25 rotating tips seeded deterministically by day

---

## Section B: Issues Found

### 🔴 Critical

**B1 — Zero emails sent despite 10 families**
The `email_campaigns` table has 0 rows. All 10 families joined in the last 30 days. The Day 1 drip and welcome emails should have fired. Possible causes:
- Vercel Cron not yet enabled/scheduled in production
- `RESEND_API_KEY` not set in production environment
- `CRON_SECRET` mismatch between Vercel config and route handler
- `send-welcome` route not being called from auth callback/signup flow
- **Action:** Check Vercel Cron logs and Resend dashboard immediately. This is the highest-priority operational issue.

### 🟠 High

**B2 — Stripe upgrade is silent**
`app/api/stripe/webhook/route.ts` handles storage add-on cancellation but sends **no email** when a family upgrades to a paid plan. Users don't receive upgrade confirmation.

**B3 — No cancellation/downgrade communication**
When a subscription cancels or downgrades, only the storage grace period email fires. There is no retention-focused "here's what you're losing" email.

**B4 — Drip campaigns ignore `email_notifications` preference**
Birthday, capsule, and digest emails check the `email_notifications` flag. The Day 1–30 drip campaigns **do not check it**. Users who opt out of notifications still receive activation emails. This is a GDPR compliance risk.

### 🟡 Medium

**B5 — Weekly digest has no deduplication**
If the Vercel Cron fires twice on a Sunday (e.g., retry after failure), the digest sends twice. No guard in `email_campaigns`.

**B6 — Digest only covers 4 content types**
The weekly digest counts journals, photos, voices, and stories. It ignores: recipes, traditions, artwork, one-line-a-day entries, time capsules created, events added. Underreports family activity.

**B7 — Storage enforcement email is untracked**
The grace period expiry email is sent without recording in `email_campaigns`. Could be re-sent on cron retry.

**B8 — Scheduled message email is inline HTML**
`app/api/notifications/route.ts` builds the scheduled message email with inline HTML instead of using the shared `emailWrapper()` helper. Inconsistent styling, harder to maintain.

**B9 — Invite email deduplication is unclear**
The invite in `members/actions.ts` does not appear to record a campaign type to `email_campaigns`. If `resendInviteEmail()` is called multiple times, the member could receive multiple invites with no guard.

### 🟢 Minor

**B10 — Admin daily report has no error handling**
`app/api/emails/templates/admin-report.ts` doesn't validate the stats object before rendering. If a query fails upstream, malformed HTML could be sent.

---

## Section C: Gap Analysis

| # | Gap | Priority | Effort | Who it helps |
|---|-----|----------|--------|--------------|
| G1 | **Upgrade success email** — No "welcome to the paid plan" confirmation | High | Small (< 1 day) | Owners |
| G2 | **Member joined notification** — Owner/family not notified when invited member accepts and joins | High | Small (< 1 day) | Owners + adults |
| G3 | **Storage warning at 80%/90%** — No warning before grace period; families only learn when limit is hit | High | Small (< 1 day) | Owners + adults |
| G4 | **Cancellation/downgrade retention email** — No "here's what you're losing" message | Medium | Small (< 1 day) | Owners |
| G5 | **Anniversary email** — No "you've been on FamilyNest for 1 month / 6 months / 1 year" | Medium | Small (< 1 day) | Owners |
| G6 | **Feature announcement system** — No "What's New" in-app banner or email template for feature releases | High | Medium (1–3 days) | All members |
| G7 | **First memory milestones** — No celebration when family hits 10, 50, 100 memories | Medium | Medium (1–3 days) | Owners |
| G8 | **First child-created entry** — No special moment when a child/teen creates their first content | Medium | Small (< 1 day) | Owners |
| G9 | **"Your Nest is quiet" (14-day inactivity)** — No nudge if no new content in 2 weeks | Medium | Small (< 1 day) | Owners |
| G10 | **Individual member re-engagement** — No personal nudge for members inactive 60+ days | Low | Medium (1–3 days) | All members |
| G11 | **NPS / satisfaction check at 60–90 days** — No feedback-soliciting email | Low | Small (< 1 day) | Owners |
| G12 | **Digest content coverage expansion** — Add recipes, traditions, artwork to digest counts | Medium | Small (< 1 day) | All members |

---

## Section D: Milestone Email Ideas (Scale-Calibrated for < 25 Families)

At this scale, every email should feel like it was written by the founder personally. Avoid corporate automation voice.

---

**Email 1: Upgrade Confirmation**
**Trigger:** Stripe `checkout.session.completed` or `customer.subscription.created`
**Audience:** Family owner
**Subject:** "You're all set — welcome to FamilyNest [Plan Name] 🎉"
**Tone:** Warm-automated
**Why now:** Basic trust signal. Silence after payment creates anxiety. This is table stakes.

---

**Email 2: Member Joined**
**Trigger:** `family_members.joined_at` populated (invite token accepted)
**Audience:** Family owner (and optionally other adults)
**Subject:** "[Name] just joined your Family Nest"
**Tone:** Personal
**Why now:** With only 12 users across 10 families, owners need to know when their invites convert. This drives engagement back to the app.

---

**Email 3: One-Month Anniversary**
**Trigger:** 30 days after `families.created_at` (runs via existing notifications cron)
**Audience:** Owner
**Subject:** "One month in — here's what your family created"
**Tone:** Personal / founder-written
**Why now:** High emotional resonance. The product is new enough that this would feel genuinely meaningful to early adopters. Include total memory count.

---

**Email 4: Your Nest Is Quiet**
**Trigger:** No new content in any table (journal, photos, stories, voices, recipes) for 14 days
**Audience:** Owner
**Subject:** "It's been quiet in your Nest lately"
**Tone:** Personal, gentle
**Why now:** Re-engagement at exactly the right time. 14 days is long enough to not be nagging, short enough to catch a lapsed user before they fully churn.

---

**Email 5: First Child-Created Memory**
**Trigger:** A member with role `child` or `teen` creates their first journal, voice memo, or photo
**Audience:** Family owner (and adults)
**Subject:** "[Child name] just created their first memory 💛"
**Tone:** Personal, celebratory
**Why now:** This is the product's core emotional promise. When a child contributes independently, it's a milestone worth celebrating. Drives deep emotional attachment to the product.

---

**Email 6: 10 Memories Milestone**
**Trigger:** Total count across journals + photos + stories + voices reaches 10 for the family
**Audience:** Owner
**Subject:** "Your family just reached 10 memories — here's the first one"
**Tone:** Personal
**Why now:** Milestone emails work. At 10 families, you can see exactly who hits this and when. Low automation load, high perceived delight.

---

**Email 7: Feature Announcement (Template)**
**Trigger:** Manual — when a new feature ships, send to all owners
**Audience:** All owners
**Subject:** "New in FamilyNest: [Feature Name]"
**Tone:** Founder-written
**Why now:** With < 25 families, you can send personal feature announcements that feel bespoke. Build the template now so each release has a ready comms mechanism.

---

**Email 8: Seasonal Prompt**
**Trigger:** Time-based (e.g., last week of August, last week of December)
**Audience:** Owners
**Subject:** "Summer's almost over — did you capture it?" / "The year is ending — did you save it?"
**Tone:** Personal, reflective
**Why now:** Seasonal prompts are highly effective for family-oriented products because they map to natural human memory-making moments. One or two per year.

---

**Email 9: NPS Check at 60 Days**
**Trigger:** 60 days after `families.created_at`
**Audience:** Owner
**Subject:** "Quick question from the FamilyNest team"
**Tone:** Founder-written (short, personal)
**Why now:** At < 25 families, every piece of feedback is gold. This email can be as simple as "On a scale of 0–10, how likely are you to recommend FamilyNest to a friend?" with a link to a short form.

---

## Section E: Recommended Build Order

### 1. Investigate why 0 emails have been sent (Operational — no code changes required)
**Action:** Check Vercel project → Cron Jobs tab (verify cron is enabled and `CRON_SECRET` matches). Check Resend dashboard for any send attempts or API errors. Verify `RESEND_API_KEY` is set in the Vercel production environment.
**Files:** Vercel dashboard, Resend dashboard, `.env` settings
**Type:** Operational/config fix
**Impact:** Unlocks all existing email infrastructure immediately

### 2. Upgrade success email (Gap G1)
**What:** Add a "welcome to [plan]" email in the Stripe webhook when `checkout.session.completed` fires
**Files to edit:** `app/api/stripe/webhook/route.ts`, `app/api/emails/templates/shared.ts` (new template function)
**Type:** New email template + webhook branch
**Impact:** Closes basic purchase trust signal; currently every upgrade is silent

### 3. Member joined notification (Gap G2)
**What:** When invite token is accepted and `joined_at` is set, send email to family owner
**Files to edit:** `app/auth/callback/route.ts` (likely where token acceptance lands), or `app/dashboard/members/actions.ts`
**Type:** New email trigger + small template
**Impact:** Owners know when their family is growing; high engagement driver

### 4. Storage warning at 80%/90% (Gap G3)
**What:** Add two new cron branches in `app/api/notifications/route.ts` that check `storage_used_bytes / storage_limit_bytes` and send a warning at 80% and 90%
**Files to edit:** `app/api/notifications/route.ts`
**Type:** New cron branch in existing notifications route
**Impact:** Prevents surprise enforcement; reduces support tickets

### 5. In-app "What's New" feature announcement system (Gap G6)
**What:** A simple banner or modal in the dashboard that shows the 1–3 most recent feature announcements, stored in a `feature_announcements` table or a static JSON file. Dismissible per user.
**Files to create:** `app/dashboard/WhatsNewBanner.tsx`, `app/dashboard/layout.tsx` (add banner)
**Files to edit (optional):** New DB table `feature_announcements`, or static `public/changelog.json`
**Type:** New in-app component
**Impact:** Every feature you ship gets communicated to existing users. Currently nothing built for this. Highest leverage in-app gap.

---

## Items Already Resolved / Out of Scope

- Password reset: handled by Supabase Auth (external, not a gap)
- Admin daily report (E14): internal only, working correctly

---

*Next review: Recommend re-running after 30 more days to see if email volume is tracking expected lifecycle cadence.*
