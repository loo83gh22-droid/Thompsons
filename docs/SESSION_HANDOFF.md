# Session Handoff — 2026-05-15

**Purpose:** A single doc the next session (or future-you) can read cold and pick up without re-reading the chat. Updated at the end of each major work session.

> **Who's working here:** Rob Thompson (see `memory/project_owner_identity.md`). Founder outreach signs as **Rob**, never invent a name. Login email is `keepitgreen@live.ca`, not the Gmail send-as alias listed in CLAUDE.md.

---

## TL;DR — Where things stand

This session covered two distinct phases of work:

1. **Yesterday's run:** site quality review → simplification PRs → buyer-pays gift purchase flow → audience pivot to tight-knit nuclear families → build-timeline PDF.
2. **Today's run:** the first real activation-funnel work. Looked at the 2 new signups this week, confirmed both bounced without coming back, traced root causes, shipped three PRs to fix the activation pipeline end-to-end.

**The headline:**
- Landing page + dashboard meaningfully simpler than at the start of yesterday
- Buyer-to-recipient gift purchase flow **shipped and live** (replacing the old "wrap a login on a card" workaround)
- Billing/plan enforcement re-audited clean
- Migration workflow honest with reality (CI doesn't auto-apply — documented + guard script added)
- **Activation funnel now instrumented + interventions in flight** — `activation_funnel` SQL view shipped, dashboard activation states added, broken drip-email cron fixed, Day-0 welcome added

**The two things waiting on the human:**
1. **Merge today's PRs in order:** #137 → #138 → #139. After #138 lands, manually trigger the cron via curl to backfill the 2 missed signups' drip emails.
2. **Real-money production test of the gift flow** (still outstanding from yesterday). Walkthrough below in §Outstanding.

---

## Strategic decisions locked in this session

These should NOT be re-litigated unless the user explicitly reopens them.

1. **Audience: tight-knit nuclear families.** Parents + kids. NOT extended/multi-gen, NOT grandparent gifters. (See `memory/project_target_audience.md`.) Marketing copy, defaults, persona ordering should all reflect this.

2. **Gift-givers persona stays** despite the nuclear-family pivot. The user explicitly kept it: "gift giver's is still a huge market." So the `/gift` page, gift purchase flow, and the gift-givers persona card all remain.

3. **Pricing tiers stay as-is.** Free / Full Nest $6.99/mo / Legacy $249–$349. User declined to drop the middle tier when offered the option.

4. **Refund policy:** *"Gifts are refundable any time before the recipient redeems them. After redemption, all sales are final."* Manual support via Stripe dashboard for v1; no self-serve refund UI. Policy line surfaces on the `/gift/buy` form.

5. **Migration workflow:** CI is *intentionally disabled* — apply via Supabase MCP `apply_migration` before merging any PR with new SQL files. Don't try to "fix" the disabled workflow without a clear plan; reconciliation is a 4–6 hour project with real risk.

---

## What shipped this session

### 1. Landing + dashboard simplification (PRs 113, 114, 119, 120, 122, 123, 124)

- **PR 113** — Phone-first hero mockup, "See more features" expander (3 visible, expand to 6), unified primary CTA to *"Start Your Family Nest"*, removed duplicate "Family Media. Not Social Media." pill.
- **PR 114** — Killed the dashboard Weekly Streak widget (contradicted the "not social media" brand), removed the intrusive purple Quick Actions popover, relabeled the floating music tab to "Playlist," added cream placeholder background to photo tiles for smoother loading.
- **PR 119** — Nav reorg: grouped section headers inside Family / Memories / Activities dropdowns; recategorized items (Time Capsules → Memories, Family Book Club → Activities, Trip Planner → Activities); deleted Extras dropdown; Feature Catalog + Emergency Info moved to avatar menu. Plus a Full Nest pricing copy rewrite.
- **PR 120** — Collapsed four secondary home widgets (Memory of the Day, Daily Inspiration, Gratitude, On This Day) into a single rotating Serendipity card.
- **PR 122** — Onboarding nudge order inverted (write-first, then photo, then add members) and SerendipityCard tips rewritten in permission-granting tone instead of homework.
- **PR 123** — Deferred the WelcomeModal auto-open; added 🎨 Pick a theme link in avatar menu.
- **PR 124** — ActivityFeed empty state copy/emoji aligned with PR 122 onboarding flow.

### 2. Memories consolidation & defaults (PRs 116, 121, 125)

- **PR 116** — Removed One Line A Day entirely; demoted Letters from core nav to opt-in catalog feature. Two migrations applied via MCP (one applied with wrong slug — corrected by `rename_letters_slug` follow-up).
- **PR 121** — New-family default seed trimmed from 10 features to 3 (voice-memos, family-letters, traditions). Existing families unaffected.
- **PR 125** — Gift page Step 3 copy tightened (credentials guidance), removed misleading "Pass it down. Transfer ownership" bullet, added gift-aware banner to `/login?mode=signup&plan=legacy_founding`.

### 3. Bug fixes (PRs 117, 118)

- **PR 117** — `journal_perspectives.author_id` → `family_member_id`. Pre-existing 400 query (introduced months ago).
- **PR 118** — Journal entry page crashed on every load: server component was passing inline arrow function to `<ShareButton>`; fixed with `.bind(null, id)` server-action binding.

### 4. Infrastructure & audits (PRs 126, 127)

- **PR 126** — CLAUDE.md updated to reflect that CI does NOT auto-apply migrations; added `scripts/check-pending-migrations.sh` pre-merge guard. No code changes to the workflow itself.
- **PR 127** — Billing & plan enforcement re-audit (against changes since 2026-04-05). Zero new findings, zero regressions. `docs/BILLING_AUDIT_2026-05-05.md` is the snapshot.

### 5. Gift purchase flow — the big one (PRs 128, 129, 130, 131)

End-to-end shipped. Replaces the old "buy Legacy yourself and hand over your own login" workaround with a real buyer-pays-then-recipient-redeems flow.

- **PR 128 (Phase A)** — `pending_gifts` table migration + design doc (`docs/GIFT_FLOW_DESIGN.md`). All 6 architectural open questions resolved by the user. Refund policy locked in §7 of the doc.
- **PR 129 (Phase B)** — Buyer side. `/gift/buy` form, `/api/gift/checkout` route (no auth required — buyer pays as guest), `/gift/sent` confirmation page. Both `/gift` CTAs now route to `/gift/buy`.
- **PR 130 (Phase C)** — Webhook extension. Gift branch at top of `checkout.session.completed` with early-return — does NOT fall through to existing self-purchase plan-activation logic. Idempotent insert (unique `stripe_session_id` constraint). Recipient + buyer emails sent on payment.
- **PR 131 (Phase D)** — Recipient redemption. `/gift/claim/[token]` page handles new-user (password form), existing-user (sign-in redirect), already-redeemed, and invalid-token states. `/api/gift/claim` creates auth user with `email_confirm=true`, creates family with Legacy plan, marks gift redeemed, sends buyer "they opened your gift" email.

Out-of-band: a `GiftWelcomeBanner` component was added to `app/dashboard/GiftWelcomeBanner.tsx` and wired into `dashboard/page.tsx` to fire when the recipient lands at `/dashboard?welcome=gift`. (Part of what was originally Phase E polish.)

### 6. Build timeline + handoff infrastructure (PRs 135, 136)

- **PR 135** — First version of `docs/SESSION_HANDOFF.md` (this file) + a session-only PDF timeline.
- **PR 136** — Replaced the session-only PDF with `docs/FamilyNest_Build_Timeline.pdf` covering the entire build (Feb 5 – May 15, 132 PRs, 5 thematic phases). Markdown sibling `docs/TIMELINE.md` is now the source of truth, PDF is a snapshot.

### 7. Activation funnel sprint — TODAY (PRs 137, 138, 139 — all OPEN as of writing)

Triggered by Rob's question: *"have they been active at all?"* about the 2 new signups this week. SQL check confirmed both bounced after <60s and never returned. Root-cause hunt + three fixes shipped in parallel branches:

- **PR 137 — Activation funnel UI**
  - `app/dashboard/StarterProgress.tsx` — 3-step progress bar above OnboardingChecklist
  - `app/dashboard/FirstWinPrompt.tsx` — one-shot celebratory invite modal after first entry (2-field, calls new `quickInvite` action). 1-year dismissal cookie.
  - `app/dashboard/page.tsx` — day-1 lockdown (hides SerendipityCard / DashboardStats / UpcomingEvents when memberCount<=1 AND no entries)
  - `app/dashboard/members/actions.ts` — new `quickInvite(name, email)` slim wrapper around `addFamilyMember`
  - `supabase/migrations/20260515000001_activation_funnel_view.sql` — `public.activation_funnel` view (additive-safe, **applied via MCP**)
  - `scripts/funnel-snapshot.sql` — 3 ready-to-paste KPI queries

- **PR 138 — Lifecycle email cron windowing fix**
  - Found and fixed a fatal bug: every drip (Day 1/3/5/14/30) used a 2-hour eligibility window. The cron runs once daily at 14:00 UTC, so families created outside the 13:00-15:00 UTC slice were never picked up. Zero drip emails had ever fired for any user this week.
  - Widened all 5 windows to multi-day ranges (Day 1: 1-4d, Day 3: 3-7d, Day 5: 5-10d, Day 14: 14-21d, Day 30: 30-45d). `email_campaigns` dedup still prevents double-sends.
  - **Day 1 copy rewritten** to write-first (`"Your first line takes 30 seconds"` with fill-in-the-blank prompt) — matches PR 122 onboarding pivot.
  - **Day 14 copy refreshed** — dropped stale "founding rate goes to $349 after Mother's Day" (deadline passed).
  - Day 1 activation check broadened from `0 photos` → `0 journal + 0 photos + 0 voice memos`.
  - Day 14 now skips paid plans.
  - `.single()` → `.maybeSingle()` on dedup checks to clear noisy logs.

- **PR 139 — Day-0 welcome email**
  - New `day0WelcomeEmailHtml` template in `app/api/emails/templates/drip.ts`
  - New `day0_welcome` campaign type wired into `/api/notifications`
  - Fires within first ~24h of signup, before Day 1 nudge. Lands hello@send.familynest.io in inbox + sets expectations for the lifecycle sequence.

**Funnel baseline at moment of PR 137 ship** (across 19 families ever):
| | |
|---|---|
| confirmed | 68% |
| **activated** | **26%** ← number to move |
| invited someone | 26% |
| returned day 2+ | 16% |
| returned day 7+ | 11% |

### 8. Docs housekeeping — TODAY

- `docs/TIMELINE.md` created (markdown source of truth, PDF is the snapshot)
- `docs/TODO.md` refreshed from 2-month-stale to honest current state
- This `SESSION_HANDOFF.md` updated to include today's work
- `memory/project_owner_identity.md` created to lock in Rob's identity so future sessions don't invent a founder name

---

## What's outstanding (top of mind for next session)

### 🚨 Real-money production gift-flow test
**Status:** Walkthrough laid out in chat. User has not confirmed completion.

The flow is live in production but has never been tested with real Stripe + real Resend emails. The plan from the walkthrough:

1. Visit https://familynest.io/gift, click "Give the Gift of Family Nest"
2. Buy a gift to a DIFFERENT email you have access to (NOT your primary FamilyNest login email). $249 real charge.
3. Verify three emails arrive: Stripe receipt + Family Nest buyer confirmation + recipient email
4. Click recipient email link, set a password, complete redemption
5. Verify buyer's "they opened your gift" email arrives
6. Refund yourself via the Stripe dashboard

When user picks this up: confirm whether the test happened, what worked, what didn't. Clean up the test recipient's auth user + family + `pending_gifts` row via SQL once verified.

### Phase E polish — partially done
- ✅ `GiftWelcomeBanner` on dashboard for `?welcome=gift` — already in repo as of this handoff
- ⏳ Printable gift card view (`/gift/sent?print=1` with print CSS) — not built
- ⏳ Buyer "view your sent gifts" page — never started, low priority

### Marketing/launch readiness
The gift flow is technically ready but not actively marketed yet. Mother's Day 2026 founding-rate window expires May 10, 2026 — that has now passed, so gifts now default to $349. No campaign was pushed for it during the founding window.

---

## Parked / backlog (in priority order)

1. **Onboarding flow audit** — partial wins already shipped (PRs 122, 123). The 60-second new-user experience is much better but there's still room to tighten.
2. **Performance pass** — `/speed-review` skill exists, never run. Cold compile is ~22s locally; production response time unknown.
3. **`/blog` and `/contact` page audits** — never looked at either page. They might be stale or off-brand.
4. **A/B test or KPI tracking** — no analytics on the impact of this session's UX changes. Future-you should consider setting up: signup → email-confirm → first-entry funnel rate; gift purchase funnel rate.
5. **G7 (long-standing)** — client-side upload pre-gating missing in 5 modules (homes, garden, volunteer, teams, voice-memo cover photos). Tracked in `BILLING_FINDINGS.md`. Low severity; scheduled for a dedicated sprint.
6. **Re-enable CI migration workflow** — 4–6 hour reconciliation project. Not worth it unless the manual MCP applies start hurting.

---

## Key context for next session

### Files to know about
- **`docs/GIFT_FLOW_DESIGN.md`** — the architecture doc for the gift purchase flow. Phases B-D are shipped per spec; §6 has decisions locked.
- **`docs/BILLING_FINDINGS.md`** — canonical billing audit log. Maintained over multiple sessions. G1–G22, B1–B7 mostly ✅ FIXED.
- **`docs/BILLING_AUDIT_2026-05-05.md`** — the 2026-05-05 re-audit snapshot (no new findings).
- **`scripts/check-pending-migrations.sh`** — pre-merge guard for SQL migrations. Run this before merging any PR that adds a `.sql` file.
- **`memory/project_target_audience.md`** + **`memory/MEMORY.md`** — the audience-pivot note. Don't re-pitch grandparent framing in marketing copy.

### Gotchas / patterns to remember
- **CI does NOT auto-apply migrations.** Apply via Supabase MCP `apply_migration` BEFORE merging a PR that adds SQL. Verify via `list_migrations`. This bit us once in PR 116 (Letters didn't appear in nav for any family until the migration was MCP'd manually).
- **Slug consistency matters.** The Letters catalog entry uses slug `family-letters`, not `letters`. When inserting `family_enabled_features` rows in seeds/migrations, match the slug from `src/lib/feature-catalog.ts` exactly.
- **Stripe webhook gift branch must remain early-return.** Self-purchase logic and gift logic are mutually exclusive — gifts don't activate the buyer's plan because no buyer family exists for a gift purchase.
- **Server components can't pass inline arrow functions to client components.** Pattern is `onProp={serverAction.bind(null, arg)}`. PR 118 was a crash from violating this rule.
- **`Date.now()` in server-component render triggers `react-hooks/purity` lint error.** Wrap in a helper function and/or mark page `dynamic = "force-dynamic"`.

### Tools & MCP available
- **Supabase MCP** — `apply_migration`, `list_migrations`, `execute_sql`, `get_advisors`, `get_logs`. Project ID `tstbngohenxrbqroejth`.
- **Stripe dashboard** — for manual refunds, customer lookups, webhook event inspection
- **Resend dashboard** — for email delivery troubleshooting
- **Vercel dashboard** — for deployment logs, preview URLs (note: Vercel SSO loop is a known issue when testing previews; localhost dev server is the workaround)

---

## When you start the next session

Open with: *"Two questions to set today's direction: (1) Did PRs #137, #138, #139 (the activation funnel sprint) merge — and if so, did the cron get manually re-triggered to backfill the missed drip emails? (2) Did the real-money gift-flow test happen? If both are settled, pick something from `docs/TODO.md` Backlog."*

Then run `scripts/funnel-snapshot.sql` via Supabase MCP to see if activation/return numbers have moved from baseline (26% / 16%).
