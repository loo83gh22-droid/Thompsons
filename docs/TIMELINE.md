# FamilyNest — Build Timeline

> **Living document.** Append a one-liner per merged PR at end of each session.
> The PDF version (`FamilyNest_Build_Timeline.pdf`) is a snapshot regenerated from this
> at milestones via `python scripts/build_timeline_pdf.py`.
>
> **Last updated:** 2026-05-15

---

## The arc, in one sentence

From an empty Next.js scaffold on Feb 5 to a fully shipping production app with 132+ merged PRs across five thematic phases — culminating in a buyer-pays gift purchase flow and the first real activation-funnel measurement.

## Stats

| | |
|---|---|
| First commit | 2026-02-05 |
| Most recent merge | 2026-05-15 |
| Merged PRs | 132 (as of PR 136) |
| Total commits | ~700 |
| Production URL | https://familynest.io |
| Repo | https://github.com/loo83gh22-droid/Thompsons |

---

## Phase 1 — Foundations (Feb 5 – Mar 1)

Scaffold, auth, dashboard skeleton, first family-tree concept.

Key PRs: #2, #3, #4, #6, #7, #8

**Inflection point:** the decision to scope around per-family privacy from day one (RLS scoped by `family_id`). Everything downstream depends on this — gift redemption, multi-family ownership transfer, plan enforcement.

---

## Phase 2 — Core features (Mar 8 – Mar 13)

Journal, photos, voice memos, recipes, stories, time capsules, map, events. The "what can this app actually do" sprint.

Key PRs: #10, #11, #14, #16, #18, #23, #24, #25, #27, #28, #29, #31, #33, #34, #41, #42, #44, #49, #50, #51, #52

**Inflection point:** the modular feature pattern — each module co-locates page + components + server actions under `app/dashboard/<feature>/`. This made the Feature Catalog (Phase 3) cheap to build.

---

## Phase 3 — Feature Catalog (Mar 14 – Mar 28)

Per-family feature opt-in via `family_enabled_features`. Lets each family hide what they don't use. Plus billing scaffolding, Stripe integration, plan tiers.

Key PRs: #58, #59, #60, #61, #62, #64, #65, #69, #78, #79, #82, #86, #87, #88, #89, #90, #91, #92, #93, #94

**Inflection point:** the realization that "every family wants different things" — same product, totally different surface areas. Catalog turns one app into N apps.

---

## Phase 4 — Tight family pivot (Mar 29 – Apr 12)

Audience refocus from extended/multi-gen/grandparents → tight-knit nuclear families. Copy, defaults, persona ordering all shift. UX hardening: password reset, critical UX flow fixes.

Key PRs: #95, #96, #98, #99, #100, #101, #102, #103, #104, #105, #106, #107, #108, #110, #111, #112

**Inflection point:** Rob's explicit call: *"im not worried about grandparents - we are going for the more tight-knit, nuclear famili now."* This decision is now memory-locked in `memory/project_target_audience.md`.

---

## Phase 5 — Quality review & gift flow (Apr 23 – May 15)

Site-wide quality review → simplification PRs → gift purchase flow → activation funnel work.

### Simplification (PRs 113-125)
- **#113** — Phone-first hero, "See more features" expander
- **#114** — Killed Weekly Streak, intrusive Quick Actions popover
- **#116** — Removed One Line A Day, demoted Letters to opt-in
- **#117** — Hotfix: `journal_perspectives.author_id` → `family_member_id`
- **#118** — Fix journal entry page crash (server→client arrow function)
- **#119** — Nav reorg (Family / Memories / Activities dropdowns)
- **#120** — Four widgets collapsed into rotating SerendipityCard
- **#121** — New-family default features trimmed 10 → 3
- **#122** — Onboarding inverted to write-first
- **#123** — WelcomeModal deferred, theme link added
- **#124** — ActivityFeed empty state copy aligned
- **#125** — Gift page Step 3 copy tightened

### Infra & audits (PRs 126-127)
- **#126** — CLAUDE.md honest about CI migration workflow + pre-merge guard script
- **#127** — Billing & plan enforcement re-audit, zero new findings

### Gift purchase flow (PRs 128-131)
- **#128** — Phase A: `pending_gifts` table + design doc
- **#129** — Phase B: buyer `/gift/buy` form + checkout
- **#130** — Phase C: webhook gift branch with early-return
- **#131** — Phase D: recipient `/gift/claim/[token]` + redemption API

### Polish (PRs 132-134)
- **#132** — Fix QuickCapture member field name mismatch
- **#133** — Gift welcome banner for new recipients
- **#134** — Eager-load first activity feed image (LCP fix)

### Docs & timeline (PRs 135-136)
- **#135** — Session handoff doc + first PDF timeline
- **#136** — Whole-build PDF timeline (Feb 5 – May 15)

### Activation funnel sprint (PRs 137-139) — open as of writing
- **#137** — Activation funnel UI: StarterProgress + FirstWinPrompt + day-1 dashboard lockdown + `activation_funnel` SQL view
- **#138** — Fix silent windowing bug in lifecycle email cron + refresh Day 1 / Day 14 copy
- **#139** — Add Day-0 welcome email to cron

**Inflection point this phase:** the activation funnel work (PRs 137-139) is the first time we've actually instrumented and intervened on the signup→activation flow. Baseline measured at 26% activation / 16% return-day-2-plus across 19 families ever. Whether the interventions move those numbers is the next thing to measure.

---

## Decisions that shaped the build (chronological)

| When | Decision | Where it lives |
|---|---|---|
| Feb 2026 | Per-family RLS scoped by `family_id` from day 1 | All migrations |
| Mar 2026 | Feature Catalog architecture — per-family opt-in | `family_enabled_features` |
| Apr 23 | Audience pivot: tight-knit nuclear families, not grandparents | `memory/project_target_audience.md` |
| May 6 | Refund policy: refundable before redemption, all-sales-final after | `docs/GIFT_FLOW_DESIGN.md` §7 |
| May 6 | CI migrations workflow stays disabled, MCP-apply is canonical | `CLAUDE.md` |
| May 6-13 | Gift flow phased rollout A→B→C→D, no half-shipped state | Closed PRs #128-131 |
| May 15 | First activation funnel instrumentation (PR #137) | `public.activation_funnel` view |

---

## How to update this file

At end of each session, append a one-liner under the appropriate phase. Format:

```markdown
- **#NNN** — short description of what shipped
```

At a natural milestone (end of phase, major feature ship), regenerate the PDF:

```bash
python scripts/build_timeline_pdf.py
```

The PDF is the polished, shareable snapshot. This markdown is the source of truth.
