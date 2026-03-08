# FamilyNest Communication Review

Conduct a **thorough audit of all customer-facing communication** in the FamilyNest codebase, then generate a prioritised plan for what to build next — including milestone-based email ideas scaled to the current size of the project.

---

## 1 — Audit Existing Communications

### Email (via Resend)

Review each of the following known email touchpoints. For each one, confirm it still exists, note what triggers it, who receives it, and surface any gaps or improvements:

| # | Campaign | File | Trigger | Audience |
|---|----------|------|---------|----------|
| E1 | Welcome email | `app/api/emails/send-welcome/route.ts` | Family created (owner signs up) | Owner only |
| E2 | Member invite | `app/dashboard/members/actions.ts` | Owner/adult adds a new member | Invited member |
| E3 | Birthday reminder | `app/api/notifications/route.ts` | 3 days before a member's birthday | Owners + adults with `email_notifications=true` |
| E4 | Time capsule unlock | `app/api/notifications/route.ts` | On `unlock_date` | Capsule recipient |
| E5 | Scheduled message delivery | `app/api/notifications/route.ts` | On `show_on_date` of a family message | Specific recipients or all family |
| E6 | Weekly digest | `app/api/notifications/route.ts` | Every Sunday (if activity > 0) | All members with `email_notifications=true` |
| E7 | Day 1 — Activation nudge | `app/api/emails/templates/drip.ts` | 24h after signup, if 0 photos | Owner |
| E8 | Day 3 — Feature discovery | `app/api/emails/templates/drip.ts` | 72h after signup | Owner |
| E9 | Day 5 — Invite encouragement | `app/api/emails/templates/drip.ts` | 120h after signup, if only 1 member | Owner |
| E10 | Day 14 — Upgrade consideration | `app/api/emails/templates/drip.ts` | 14 days after signup, if ≥3 journal entries | Owner |
| E11 | Day 30 — Re-engagement | `app/api/emails/templates/drip.ts` | 30 days after signup | Owner |
| E12 | Storage grace reminder | `app/api/notifications/route.ts` | At 15, 7, 1 days before grace period ends | Owners + adults |
| E13 | Storage enforcement | `app/api/notifications/route.ts` | When grace period expires | Owners + adults |
| E14 | Admin daily report | `app/api/daily-report/route.ts` | Daily cron (internal) | Admin only — not customer-facing |

**Deduplication mechanism:** All campaigns are tracked in the `email_campaigns` table with `(family_member_id, campaign_type)` — check this table exists and is being used correctly.

Check the email templates in `app/api/emails/templates/` (birthday.ts, capsule.ts, digest.ts, drip.ts, shared.ts) — note anything missing or stale.

### In-App Communication

Review each of the following in-app touchpoints:

| # | Component | File | Trigger | Audience |
|---|-----------|------|---------|----------|
| A1 | Welcome tour modal | `app/dashboard/WelcomeModal.tsx` | First login (localStorage flag) | New owners |
| A2 | Onboarding checklist | `app/dashboard/OnboardingChecklist.tsx` | Shown until 5 steps complete (cookie flag) | New owners |
| A3 | Birthday banner | `app/dashboard/BirthdayBanner.tsx` | On a member's birthday | All members |
| A4 | Birthday prompt | `app/dashboard/BirthdayPrompt.tsx` | Approaching birthdays | Owners/adults |
| A5 | PWA install banner | `app/dashboard/PWAInstallBanner.tsx` | After some engagement | All users |
| A6 | Feedback prompt modal | `app/dashboard/FeedbackPromptModal.tsx` | After engagement threshold | All users |
| A7 | Map first-visit banner | `app/dashboard/map/MapFirstVisitBanner.tsx` | First visit to /dashboard/map | All users |
| A8 | Inspiration tip | `app/dashboard/InspirationTip.tsx` | Dashboard home | All users |

Note: There is currently **no feature announcement system** — no "What's New" banner, no changelog page, no way to notify existing users about newly shipped features.

---

## 2 — Identify Gaps

For each gap, note:
- What the missing communication is
- What event/trigger would fire it
- Who should receive it
- Why it matters

**Known gaps to check and confirm:**

- **New member joined notification** — When a new member accepts an invite and joins the family, existing members get no notification. The family owner doesn't know unless they check manually.
- **First memory milestone** — No celebration email when a family hits meaningful milestones (first 10 photos, first journal entry, first voice memo recorded by a child).
- **Anniversary email** — No "you've been on Family Nest for 1 year" email. High emotional resonance, near-zero engineering effort.
- **Digest coverage gaps** — The weekly digest only counts journals, photos, voices, stories. It ignores: recipes, traditions, artwork, one-line-a-day entries, time capsules created, events added, bucket list items (future).
- **Approaching storage limit** — No warning when a family reaches 80% or 90% of their storage limit (only notified when a paid add-on is cancelled).
- **Inactive individual member nudge** — The day-30 email targets the owner, but individual family members who haven't logged in for 60+ days get no personal nudge.
- **Upgrade success email** — Confirm whether Stripe webhook (`app/api/stripe/webhook/route.ts`) sends a "welcome to the paid plan" email. If not, this is a gap.
- **Cancellation / downgrade email** — When a family downgrades or cancels their subscription, is there a "we're sorry to see you go / here's what you're losing" email?
- **NPS / satisfaction check** — No survey email at 60 or 90 days to ask how the family is finding the product.
- **Feature announcement system** — Nothing built to notify existing users about new features. This is the highest-priority in-app gap.

---

## 3 — Assess Project Scale

Query the Supabase database to get current scale context. Use the Supabase MCP tool with project ID `tstbngohenxrbqroejth`:

```sql
SELECT
  (SELECT COUNT(*) FROM families) AS total_families,
  (SELECT COUNT(*) FROM families WHERE created_at > NOW() - INTERVAL '30 days') AS new_families_30d,
  (SELECT COUNT(*) FROM family_members WHERE user_id IS NOT NULL) AS active_users,
  (SELECT COUNT(*) FROM email_campaigns) AS total_emails_sent,
  (SELECT COUNT(DISTINCT campaign_type) FROM email_campaigns) AS distinct_campaign_types;
```

Use the scale to calibrate your recommendations:
- **< 25 families** — Early. Emails should feel founder-written, highly personal. Prioritise learning over automation.
- **25–100 families** — Growing. Start building reliable lifecycle automation. Personal tone still works.
- **100–500 families** — Scaling. Segment by behaviour (active vs dormant, free vs paid). Add milestone comms.
- **500+ families** — Scaled. Full lifecycle automation, A/B testing, segmentation by plan and member role.

---

## 4 — Output: Prioritised Communication Plan

Produce a structured report with these sections:

### Section A: What's Working
List the current email and in-app touchpoints that are functioning correctly and well-designed. Keep this brief.

### Section B: Issues Found
List anything broken, stale, or misconfigured in the existing comms — wrong audience, missing deduplication, outdated copy hooks, digest not covering certain content types, etc.

### Section C: Gap Analysis
For each gap identified, rate it:
- **Priority** (High / Medium / Low)
- **Effort** (Small = < 1 day / Medium = 1-3 days / Large = 3+ days)
- **Who it helps** (owners / all members / specific roles)

### Section D: Milestone Email Ideas (Scale-Calibrated)
Generate **6–10 milestone email ideas** appropriate for the current project scale. For each:

```
Email name: [Name]
Trigger: [What fires it — event, time-based, threshold-based]
Audience: [Who receives it — owner / all adults / specific member]
Subject line: [Suggested subject]
Tone note: [Personal / Warm-automated / Segmented]
Why now: [Why this makes sense at the current scale]
```

Ideas to consider (generate more based on scale):
- **1-year anniversary** — sent to owner on the anniversary of family creation
- **First child-created memory** — when a member with role `child` or `teen` creates their first entry
- **Family hitting 50 / 100 / 500 memories** — total count across journals + photos + stories
- **"Your Nest is quiet" — 14-day family inactivity** — if no new content in 14 days, sent to owner
- **New feature announcement** — for use whenever a new feature ships (template-based, targeted to owners)
- **Seasonal prompts** — "Summer is almost over — did you capture it?" in late August, etc.

### Section E: Recommended Build Order
A numbered list of the top 5 things to build next, ordered by impact vs effort. For each:
- What it is
- Which file(s) to add/edit
- Whether it's a new email template, a new cron branch, or an in-app component

---

## Audit Instructions

1. Use the **Explore agent** to read all files listed in this review — do not assume they match what's documented here.
2. Use the **Supabase MCP** (`project_id: tstbngohenxrbqroejth`) for the scale query.
3. Produce the full report in the four sections above.
4. After the audit, write a summary file to `docs/COMMS_REVIEW.md` with the date, scale snapshot, gaps found, and recommended build order — so future reviews can skip already-resolved items.
