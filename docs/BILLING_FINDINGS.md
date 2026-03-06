# FamilyNest Billing & Plan Enforcement Findings

Last audited: 2026-03-05

---

## Feature Gating Findings (G#)

### G1 — Map Editing: No Server-Side Plan Gate · **Critical**
**File:** `app/dashboard/map/AddLocationForm.tsx:209`, `app/dashboard/map/actions.ts`
**Exploit:** Free-plan user calls `supabase.from("travel_locations").insert(...)` directly from browser DevTools — only a disabled button stops them. `canEditMap` is imported only by the client component, never by any Server Action.
**Fix:** Move `travel_locations` insert into a Server Action that calls `canEditMap(plan.planType)` before inserting. Gate `syncBirthPlacesToMap` too.

### G2 — Journal Photos: Storage Limit Exception Swallowed · **Medium**
**File:** `app/dashboard/journal/actions.ts:237`
**Exploit:** `enforceStorageLimit` throws but the outer `try/catch` catches and ignores it; the upload loop continues anyway. TOCTOU race also allows concurrent uploads to both pass the check.
**Fix:** Stop swallowing the exception — `break` or return early when limit is reached. Consider DB-level enforcement (see B4).

### G3 — Journal Videos: Missing `enforceStorageLimit` Before Upload · **Medium**
**File:** `app/dashboard/journal/actions.ts:801` (`registerJournalVideo`, `addJournalVideos`)
**Exploit:** Paid-plan user at 49.9 GB can register additional videos without any storage rejection.
**Fix:** Add `await enforceStorageLimit(supabase, activeFamilyId, fileSizeBytes)` at the top of `registerJournalVideo` and `addJournalVideos`.

### G4 — Voice Memos: No Storage Enforcement or Tracking · **High**
**File:** `app/dashboard/voice-memos/actions.ts`
**Exploit:** Any user uploads unlimited audio to `voice-memos` bucket. Counter never increments on upload or decrements on delete.
**Fix:** Add `enforceStorageLimit` + `addStorageUsage` to `insertVoiceMemo`. Add `subtractStorageUsage` to `removeVoiceMemo`.

### G5 — Favourites Photos: No Storage Tracking · **High**
**File:** `app/dashboard/favourites/actions.ts:22`
**Exploit:** Free-plan user uploads arbitrarily large photos as favourite covers with no quota impact.
**Fix:** Add `enforceStorageLimit` before upload and `addStorageUsage` after in `uploadFavouritePhoto`.

### G6 — Achievements Photos: No Storage Tracking · **High**
**File:** `app/dashboard/achievements/actions.ts:28`
**Exploit:** Achievement attachments written to storage with no quota accounting.
**Fix:** Add storage enforcement and tracking to `addAchievement`.

### G7 — Member Profile Photos: Client-Side Upload Bypasses All Gates · **Medium**
**File:** `app/dashboard/members/AddMemberForm.tsx:109`, `app/dashboard/members/MemberList.tsx:148,398`
**Exploit:** Three direct `supabase.storage.upload()` calls from client components — no server-side `enforceStorageLimit` or `addStorageUsage` possible.
**Fix:** Route member photo uploads through a Server Action with storage enforcement.

### G8 — Sports Photos: No Storage Tracking AND No Family Scoping · **High**
**File:** `app/dashboard/sports/actions.ts:6-42`
**Exploit:** Upload unlimited data to `sports-photos` bucket. `sports_photos` DB inserts have no `family_id`, so photos aren't scoped to a family. Delete endpoint has no family filter — any authenticated user could delete any sports photo by ID.
**Fix:** Add `family_id` to all sports photo DB operations and add storage enforcement/tracking.

### G9 — Public Sharing: Null `activeFamilyId` Bypasses Plan Check · **Medium**
**File:** `app/dashboard/stories/share-actions.ts:15-21`, `app/dashboard/artwork/actions.ts:202-208`
**Exploit:** If `activeFamilyId` is null (stale cookie / edge case), the `canSharePublicly` check inside `if (activeFamilyId) { ... }` is silently skipped.
**Fix:** Treat null `activeFamilyId` as a hard error — return early before any plan check or DB operation.

### G10 — `canEditMap` Confirmed Zero Server-Side Enforcement · **Critical**
**File:** `app/dashboard/map/AddLocationForm.tsx:6` (only import site)
**Note:** Supports G1 — `canEditMap` is never imported in any Server Action or API route.

### G11 — Nest Keepers PUT Handler Missing Plan Check · **Medium**
**File:** `app/api/nest-keepers/route.ts:147`
**Exploit:** Owner on a downgraded (non-legacy) plan can still edit existing keeper records via PUT — the owner role check passes but the `canManageNestKeepers` plan check is absent.
**Fix:** Add `getFamilyPlan` + `canManageNestKeepers` check to PUT handler, matching GET/POST/DELETE pattern.

---

## Billing Infrastructure Findings (B#)

### B1 — No `customer.subscription.updated` Webhook Handler · **High**
**File:** `app/api/stripe/webhook/route.ts`
**Problem:** Subscriptions that become `past_due` or `unpaid` (failed payment, retrying) keep the paid plan in the DB until Stripe eventually fires `customer.subscription.deleted` — which could be weeks later. If Stripe fires `subscription.updated` with status `canceled` before `deleted`, the plan is never downgraded.
**Fix:** Add handler for `customer.subscription.updated` that calls `deactivatePlan` when `subscription.status` is `canceled`, `past_due`, or `unpaid`.

### B2 — Checkout Creates Duplicate Stripe Customers · **Medium**
**File:** `app/api/stripe/checkout/route.ts:107`
**Problem:** Session created with `customer_email` every time — no lookup of existing `stripe_customer_id`. Multiple abandoned checkouts or re-subscriptions create duplicate Stripe customer records.
**Fix:** Look up `stripe_customer_id` from the DB first; use `customer: existingId` if present, `customer_email` only if null.

### B3 — `activatePlan` Doesn't Verify Customer ID Matches Family · **Medium**
**File:** `app/api/stripe/webhook/route.ts:18`
**Problem:** `familyId` comes from event metadata; the webhook writes `stripeCustomerId` to whichever family that metadata points to without cross-checking the DB-stored `stripe_customer_id`. Low probability but exploitable in a key compromise scenario.
**Fix:** In `activatePlan`, query the family first and verify `family.stripe_customer_id` is either null or equals `stripeCustomerId` before updating.

### B4 — `increment_storage_used` RPC Has No DB-Level Cap · **Low**
**File:** `supabase/migrations/054_storage_tracking_rpc.sql`
**Problem:** The SQL function has no upper bound. The app-layer `enforceStorageLimit` is the only guard, but it's missing from several upload paths (G4–G8). Counter can drift arbitrarily high.
**Fix:** Add a Postgres check constraint on `families.storage_used_bytes <= storage_limit_bytes` OR enforce the cap inside the SQL function for defense in depth.

### B5 — Delete Operations Never Decrement Storage Counter · **High**
**Files:** Multiple — `voice-memos/actions.ts:124`, `awards/actions.ts:204,251`, `trophy-case/actions.ts:206,209,257,260`, `journal/actions.ts` (deleteJournalPhoto/Video orphan files), `photos/actions.ts` (removePhoto orphans files)
**Problem:** `subtractStorageUsage` is never called from any dashboard action. Storage counter only ever grows. Families that delete content are incorrectly blocked from new uploads.
**Fix:** Add `subtractStorageUsage` after every successful `.remove()`. Fix journal/photos deletes to also call `.remove()` on the storage path before decrementing.

### B6 — New Family `storage_limit_bytes` Default Not Verified · **Low**
**File:** `src/lib/constants.ts`
**Note:** The 500 MB free-plan constant exists but the migration setting the column default was not confirmed. If the column has no DB default, new families get `storage_limit_bytes = 0`, blocking all uploads immediately.
**Fix:** Verify `supabase/migrations/` sets `storage_limit_bytes DEFAULT 524288000` on the `families` table.

---

## Status Summary

| ID | Severity | Status |
|---|---|---|
| G1 | Critical | 🔴 Open |
| G10 | Critical | 🔴 Open (same root as G1) |
| G4 | High | 🔴 Open |
| G5 | High | 🔴 Open |
| G6 | High | 🔴 Open |
| G8 | High | 🔴 Open |
| B1 | High | 🔴 Open |
| B5 | High | 🔴 Open |
| G2 | Medium | 🔴 Open |
| G3 | Medium | 🔴 Open |
| G7 | Medium | 🔴 Open |
| G9 | Medium | 🔴 Open |
| G11 | Medium | 🔴 Open |
| B2 | Medium | 🔴 Open |
| B3 | Medium | 🔴 Open |
| B4 | Low | 🔴 Open |
| B6 | Low | 🔴 Open |
