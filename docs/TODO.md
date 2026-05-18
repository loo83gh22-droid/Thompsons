# FamilyNest — Master TODO

> **Living document.** Update at the end of each session.
> Site is **live in production** at https://familynest.io with paying users.
> Last updated: 2026-05-18

---

## 🔥 Right now (this week)

### Trigger the cron to backfill missed lifecycle emails
- [ ] **Run this once** after Vercel finishes deploying PRs 137-140:
  ```
  curl -H "Authorization: Bearer $CRON_SECRET" https://familynest.io/api/notifications
  ```
  - `CRON_SECRET` is in Vercel env vars
  - Response should show non-zero counts for `day0Welcomes`, `day1Nudges`, and possibly `day3Discovery` (depending on signup timing of djlesieur)
  - If you skip this, the daily cron at 14:00 UTC will catch them up tomorrow on its own
- [ ] Verify the email lands in **kmankiran7@gmail.com** (Day 0 + Day 1 should both land within a day) — confirm it's not in spam, looks on-brand

### Manual founder reach-out (Rob — 2 emails, drafts in chat)
- [ ] Email **djlesieur@gmail.com** ("The Shark Beight Family", signed up May 11, never returned)
- [ ] Email **kmankiran7@gmail.com** ("Grewals", signed up May 14, wrote 1 entry, never returned)
- Both drafts use the canonical founder voice — sign as **Rob**
- Open in Gmail with From set to `hello@familynest.io`

### 🚨 Still outstanding from earlier
- [ ] **Real-money production gift-flow test** (top of `docs/SESSION_HANDOFF.md`)
  - Buy a $249 gift to a non-primary email
  - Verify 3 emails arrive (Stripe + buyer + recipient)
  - Redeem as recipient, verify buyer "they opened it" email
  - Refund via Stripe dashboard
  - Clean up the test gift's auth user + family + `pending_gifts` row via SQL

---

## 🟡 Next pickup (when "right now" is clear)

### Measure whether activation work moved the needle
- [ ] Re-run `scripts/funnel-snapshot.sql` weekly via Supabase MCP
- [ ] Baseline (as of PR 137 ship): 26% activation, 26% invite, 16% return d2+, 11% return d7+
- [ ] If no improvement after 2 weeks, revisit the FirstWinPrompt trigger logic and Day 0 copy

### Phase E polish (gift flow)
- [x] ~~`GiftWelcomeBanner` on dashboard for `?welcome=gift`~~ (shipped PR #133)
- [ ] Printable gift card view (`/gift/sent?print=1` with print CSS)
- [ ] Buyer "view your sent gifts" page (low priority)

### Marketing / launch readiness
- [ ] Mother's Day 2026 founding rate window already expired May 10 — gifts now default to $349
- [ ] No campaign was pushed for the founding window — consider a soft launch push for the gift flow now that it's actually live

---

## 📋 Backlog (in priority order)

1. **Onboarding flow audit follow-up** — PRs 122/123 covered the basics. Today's PR 137 added activation UI. Still room to tighten the first-60-seconds experience.
2. **Performance pass** — `/speed-review` skill exists, never run. Cold compile ~22s locally; production response time unknown.
3. **`/blog` and `/contact` page audits** — never looked at either. Might be stale or off-brand for the nuclear-family pivot.
4. **Stripe customer portal styling** — configure branding in Stripe Dashboard to match app theme
5. **PWA manifest** (`manifest.ts`) for mobile "Add to Home Screen"
6. **Error monitoring** — Sentry integration (currently only Vercel Analytics + Speed Insights)
7. **Dynamic OG images per page** (`opengraph-image.tsx`)
8. **Referral program** — invite a family, get X
9. **Re-enable CI migration workflow** — 4-6h reconciliation project. Not worth it unless manual MCP applies start hurting.

---

## 🔻 Long-standing low priority

- **G7** — client-side upload pre-gating missing in 5 modules (homes, garden, volunteer, teams, voice-memo cover photos). Tracked in `docs/BILLING_FINDINGS.md`. Low severity; scheduled for a dedicated sprint.

---

## ✅ Recently shipped (last 30 days)

See `docs/TIMELINE.md` Phase 5 for the full list. Highlights:

- **Buyer-pays gift purchase flow** end-to-end (PRs #128-131)
- **Simplification sprint** — dashboard, nav, onboarding (PRs #113-125)
- **Migration workflow honesty** — CI guard script + CLAUDE.md update (PR #126)
- **Billing re-audit** zero new findings (PR #127)
- **Build timeline + handoff docs** (PRs #135-136)
- **Activation funnel sprint** — instrumentation + UI + email pipeline fix (PRs #137-139, merged 2026-05-18)
- **Docs housekeeping** — living TIMELINE.md, fresh TODO.md, updated SESSION_HANDOFF.md (PR #140, merged 2026-05-18)

---

## 📁 Where things live

| What | Where |
|---|---|
| Build history | `docs/TIMELINE.md` + `docs/FamilyNest_Build_Timeline.pdf` |
| Session cold-start | `docs/SESSION_HANDOFF.md` |
| Gift flow architecture | `docs/GIFT_FLOW_DESIGN.md` |
| Billing audit log | `docs/BILLING_FINDINGS.md` + `docs/BILLING_AUDIT_2026-05-05.md` |
| KPI funnel snapshot SQL | `scripts/funnel-snapshot.sql` |
| Migration pre-merge guard | `scripts/check-pending-migrations.sh` |
| Memory files (cross-session) | `memory/MEMORY.md` + linked files |
