# FamilyNest Communications Review

Last audited: 2026-03-20

---

## Scale Snapshot

| Metric | Value |
|---|---|
| Total families | 8 |
| New families (last 30 days) | 7 |
| Active users (with accounts) | 11 |
| Emails sent (all time) | 0 |
| Distinct campaign types fired | 0 |

**Stage: Early (< 25 families).** The email system is fully built but not yet live — Resend API
key and `RESEND_FROM_EMAIL` env vars need to be set in Vercel before any email fires. All
automation is ready the moment those are configured.

Tone guidance for this stage: **founder-written, personal, warm**. Don't sound like a SaaS drip
sequence. Sound like Rob texting you.

---

## Section A: What's Working

The comms infrastructure is mature for this stage. Everything below exists and is correctly implemented:

**Emails (Resend):**
- E1 — Welcome email on family creation (deduped via `email_campaigns`)
- E2 — Member invite with opaque UUID token (no PII in URL)
- E3 — Birthday reminder 3–4 days before, deduped per year per member
- E4 — Time capsule unlock notification on unlock date
- E5 — Scheduled family message delivery on `show_on_date`
- E6 — Weekly digest every Sunday (with activity gate)
- E7–E11 — Full 5-step drip sequence (Day 1, 3, 5, 14, 30) with behavioural conditions
- E12–E13 — Storage add-on grace period reminders (15/7/1 days) + enforcement
- Storage capacity warnings at 80% and 90% (deduped monthly per tier)
- Plan upgrade confirmation email on first payment (via Stripe webhook)

**In-app:**
- WelcomeModal — 3-step onboarding (theme, invite, first memory); localStorage-persisted
- OnboardingChecklist — sidebar checklist; confetti on completion; cookie-persisted
- BirthdayBanner — upcoming birthdays (next 30 days) on dashboard home
- BirthdayPrompt — modal for recent birthdays, prompts journal entry
- PWAInstallBanner — 30-day dismiss cooldown; iOS manual + Android native
- FeedbackPromptModal — triggers at 7 sessions, max 3 dismissals, 30-day cooldown
- MapFirstVisitBanner — first visit to /dashboard/map, localStorage-persisted
- InspirationTip — 18 daily rotating content prompts on dashboard home

**Infrastructure:**
- All sends are individual (no bulk `to[]` arrays)
- Email opt-out links in every template footer → `/dashboard/settings`
- Deduplication via `email_campaigns` table on `(family_member_id, campaign_type)`
- Cron endpoint protected with `CRON_SECRET`; returns 500 on inner errors

---

## Section B: Issues Found

### B1 — Day 14 drip email has stale pricing copy (High)
**File:** `app/api/emails/templates/drip.ts` — `day14UpgradeEmailHtml()` (~line 52–67)
**Issue:** Copy references "$79/year" and "50 GB storage". Current pricing is $49/year founding
rate, $9.99/month, and annual is now 20 GB (Legacy is 50 GB).
**Fix:** Update to founding rate $49/year, monthly $9.99/month, Legacy for 50 GB + lifetime.

### B2 — Weekly digest only counts 3 content types (Medium)
**File:** `app/api/emails/templates/digest.ts` (~line 3–13) + `app/api/notifications/route.ts`
**Issue:** Digest counts journals, voice memos, stories only. Ignores recipes, traditions,
artwork, one-line entries, time capsules, events, achievements. A family active on recipes who
gets a "0 new things this week" digest will unsubscribe.
**Fix:** Add counts for all active content types; render each non-zero count as a line item.

### B3 — `email_campaigns` CHECK constraint is stale (Low)
**File:** `supabase/migrations/057_create_email_campaigns_table.sql`
**Issue:** Constraint lists 6 drip types but runtime creates dynamic types like
`birthday_${year}_${memberId}`, `capsule_unlock_${capsuleId}`, `storage_warning_80_${yearMonth}`.
No runtime errors (dynamic types stored as free-text), but the constraint is misleading.
**Fix:** Drop the CHECK constraint or replace with a permissive prefix check. Low urgency.

### B4 — No cancellation/downgrade email (High)
**File:** `app/api/stripe/webhook/route.ts` — `deactivatePlan()` (~line 68–88)
**Issue:** When subscription lapses or cancels, `plan_type` reverts to `'free'` silently.
No email to the owner explaining what they've lost, what files may be affected, or how to return.
**Fix:** Call `sendDowngradeEmail()` inside `deactivatePlan()`. Warm, not punitive — "Everything
you wrote is still there. Here's how to come back."

### B5 — No "new member joined" notification (Medium)
**Issue:** When a pending member accepts their invite, the family owner gets no notification.
**Fix:** In `app/api/auth/signup/route.ts`, when `isInvited = true`, send a one-line email to
the family owner: "[Name] just joined your Nest."

---

## Section C: Gap Analysis

| Gap | Priority | Effort | Who it helps |
|---|---|---|---|
| B1 — Fix stale pricing in Day 14 drip | High | Tiny (< 1hr) | Owners considering upgrade |
| B4 — Downgrade/cancellation email | High | Small (2–3hr) | Churned paid owners |
| B2 — Expand weekly digest content types | Medium | Small (2–3hr) | All members on email notifications |
| B5 — New member joined notification | Medium | Small (2–3hr) | Family owners |
| Anniversary email (1 year) | Medium | Small (2–3hr) | Owners — high emotional resonance |
| First child/teen memory email | Medium | Small (2–3hr) | Parents — moment of pride |
| "Your Nest is quiet" — 14-day inactivity | Medium | Small (2–3hr) | Dormant owners |
| NPS / satisfaction survey at 60 days | Low | Medium (1 day) | Product learning |
| Feature announcement system | Low | Medium (1–2 days) | All users post-launch |
| B3 — Fix email_campaigns CHECK constraint | Low | Tiny (< 1hr) | Code hygiene only |

---

## Section D: Milestone Email Ideas (Scale-Calibrated for < 25 Families)

At this stage every email should feel like it came from Rob personally. Short, warm, no bullet
lists. One idea per email.

---

**Email 1: Plan downgrade / cancellation**
- Trigger: `deactivatePlan()` in Stripe webhook (subscription cancelled or lapsed)
- Audience: Family owner
- Subject: `Your Family Nest plan has ended`
- Tone: Warm, no pressure, factual
- Copy direction: "Everything you wrote is still there. Photos above 500 MB may be affected.
  If you want to come back, the door's open." Re-subscribe link.
- Why now: Critical gap — churned users get zero communication today.

---

**Email 2: New member joined**
- Trigger: Invited member creates account (`isInvited = true` in signup route)
- Audience: Family owner
- Subject: `[Name] just joined your Nest`
- Tone: One sentence. Genuinely warm.
- Copy direction: "Sarah just joined the Thompson Family Nest. Say hi."
- Why now: Tiny effort, high delight. Owners love knowing the family is growing.

---

**Email 3: 1-year anniversary**
- Trigger: `families.created_at` = exactly 1 year ago (daily cron check ± 1 day)
- Audience: Family owner
- Subject: `One year of your family's story`
- Tone: Personal, reflective, founder-written
- Copy direction: "A year ago today, you started something. [X] memories since then.
  That's a lot to pass down."
- Why now: Highest emotional resonance per line of code on this list. 2 hours to build.

---

**Email 4: First memory from a child or teen**
- Trigger: Family member with role `child` or `teen` creates their first journal entry or voice memo
- Audience: Family owner (parent)
- Subject: `[Child's name] just added their first memory`
- Tone: Warm pride moment. Short.
- Copy direction: "Lily just wrote her first journal entry in your Nest. That's going to mean
  something someday."
- Why now: This is the moment the product delivers its core promise. Celebrating it = retention.

---

**Email 5: "Your Nest has been quiet" — 14-day inactivity**
- Trigger: No new content (any type) in 14 days; owner has `email_notifications=true`
- Audience: Family owner
- Subject: `It's been two weeks`
- Tone: Gentle, no guilt
- Copy direction: "Nothing's been added to your Nest in a couple weeks. That's okay — life gets
  busy. Just wanted to make sure everything's still here when you're ready." CTA: "Add something →"
- Dedup: Once per 30-day window per family
- Why now: Catches people before they forget the app exists. Fills the gap between Day 30 drip
  and the weekly digest.

---

**Email 6: Family hits 100 memories**
- Trigger: Total (journal entries + photos + stories + voice memos) crosses 100
- Audience: Family owner
- Subject: `100 memories. That's your family.`
- Tone: Celebratory, specific
- Copy direction: "You just hit 100 memories in your Nest. That's not a number — that's 100
  things that would have been forgotten." No CTA. Just celebrate.
- Dedup: One-time per family (`milestone_100_memories` in `email_campaigns`)
- Why now: Milestone emails drive the "I can't quit this" feeling.

---

**Email 7: Seasonal prompt — late August**
- Trigger: Date window Aug 20–25, once per year per family
- Audience: All members with `email_notifications=true`
- Subject: `Summer's almost over — did you capture it?`
- Tone: Light, casual, one paragraph
- Copy direction: "Before school starts and everything blurs together — add one thing from
  this summer. Even a single voice memo counts."
- Why now: Seasonal timing creates natural urgency. Pure date check in cron — nearly free.

---

## Section E: Recommended Build Order

### 1. Fix Day 14 drip pricing copy — do this today (Tiny)
**File:** `app/api/emails/templates/drip.ts`
Update "$79/year" → "$49/year (founding rate)" and "$9.99/month". Update "50 GB" → "20 GB storage
(or 50 GB on Legacy)". Takes 10 minutes. This is wrong right now.

### 2. Add downgrade/cancellation email — before launch (Small)
**Files:** `app/api/stripe/webhook/route.ts`, new `app/api/emails/templates/downgrade.ts`
Call `sendDowngradeEmail()` inside `deactivatePlan()`. Single warm template.
Critical gap — churned paid users get zero communication.

### 3. Expand weekly digest content types — before launch (Small)
**Files:** `app/api/notifications/route.ts`, `app/api/emails/templates/digest.ts`
Add recipe, tradition, artwork, event, one-line-entry counts to the digest query and template.
Render each non-zero count as a line. A family active on recipes getting a "nothing this week"
digest is an active churn driver.

### 4. Add new member joined notification — post-launch week 1 (Small)
**File:** `app/api/auth/signup/route.ts`
When `isInvited = true`, send one-line email to family owner after account is created.
High warmth, near-zero engineering. Dedup: one per member join event (unique by definition).

### 5. Add 1-year anniversary email — post-launch week 2 (Small)
**Files:** `app/api/notifications/route.ts` (new cron branch), new `app/api/emails/templates/anniversary.ts`
Daily cron checks `families.created_at` = 1 year ago ± 1 day. Dedup via `email_campaigns`
(`milestone_1year_anniversary`). One warm email to owner with memory count.
Highest emotional resonance per line of code on this list.

---

## Previous Review Notes (2026-03-07)

Previous review confirmed all E1–E14 touchpoints were implemented. No structural issues
found at that time. This 2026-03-20 re-audit adds: scale snapshot, B1–B5 findings, gap
analysis with prioritisation, milestone email ideas, and the recommended build order above.
