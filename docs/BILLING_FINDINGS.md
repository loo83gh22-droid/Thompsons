# FamilyNest Billing & Plan Enforcement Findings

Last audited: 2026-03-20

---

## Feature Gating (G#)

### ✅ FIXED — G1: Map editing has no server-side enforcement
**File:** `app/dashboard/map/AddLocationForm.tsx` (line 209)
**Risk:** A free-plan user calling the direct Supabase insert bypasses the client-side `canEditMap` check entirely.
**Fix (2026-03-05):** Added `addTravelLocation` Server Action in `app/dashboard/map/actions.ts` with a `canEditMap` plan gate. `AddLocationForm.tsx` now calls the Server Action instead of Supabase directly.

### ✅ FIXED — G2: Journal photos — storage limit exception swallowed
**File:** `app/dashboard/journal/actions.ts` (line 237)
**Risk:** `enforceStorageLimit` was called but its exception was swallowed with `catch { }`, then the photo upload loop ran anyway.
**Fix (2026-03-05):** Changed to track whether storage check passed via `withinStorageLimit` flag; loop is `for (let i = 0; withinStorageLimit && i < photos.length; i++)`.

### ✅ FIXED — G3: Video uploads — no `enforceStorageLimit` before upload
**Files:** `app/dashboard/journal/actions.ts` — `registerJournalVideo` and `addJournalVideos`
**Risk:** Client could upload large videos even if over storage limit.
**Fix (2026-03-05):** Added `enforceStorageLimit` before `addStorageUsage` in both functions.

### ✅ FIXED — G4: Voice memos — no storage tracking
**File:** `app/dashboard/voice-memos/actions.ts`
**Risk:** Audio files never incremented or decremented `storage_used_bytes`.
**Fix (2026-03-05):** Added `enforceStorageLimit` + `addStorageUsage` to `insertVoiceMemo`; `subtractStorageUsage` to `removeVoiceMemo`. Added `file_size_bytes` column to `voice_memos` via migration 079.

### ✅ FIXED — G5: Favourites photos — no storage tracking
**File:** `app/dashboard/favourites/actions.ts` — `uploadFavouritePhoto`
**Risk:** Photos uploaded to `favourite-photos` bucket were never tracked against the storage limit.
**Fix (2026-03-05):** `uploadFavouritePhoto` now takes `familyId`, calls `enforceStorageLimit` before upload and `addStorageUsage` after.

### ✅ FIXED — G6: Achievements — no storage tracking on upload; orphaned file on delete
**File:** `app/dashboard/achievements/actions.ts`
**Risk:** Uploads untracked; deleting an achievement left the file in storage with no counter decrement.
**Fix (2026-03-05):** `addAchievement` now calls `enforceStorageLimit` + `addStorageUsage`. `removeAchievement` removes the storage object and calls `subtractStorageUsage`.

### ⚠️ DEFERRED — G7: Member profile photos — client-side upload bypasses gates
**Note:** Complex refactor (client-side direct Supabase upload → Server Action). Low severity — no data exposure, only storage accounting gap. Scheduled for a dedicated sprint.

### ✅ FIXED — G8: Sports photos — no family scoping and no storage tracking
**File:** `app/dashboard/sports/actions.ts`
**Risk:** No `family_id` in insert; `removeSportsPhoto` had no family scope, allowing cross-family deletion.
**Fix (2026-03-05):** `addSportsPhoto` requires `activeFamilyId`, adds it to insert, enforces storage limit and tracks usage. `removeSportsPhoto` scopes to `family_id` and calls `subtractStorageUsage`.

### ✅ FIXED — G9: Public sharing — null `activeFamilyId` bypasses plan check
**Files:** `app/dashboard/stories/share-actions.ts`, `app/dashboard/artwork/actions.ts`
**Risk:** `if (activeFamilyId) { check plan }` silently skips the gate when `activeFamilyId` is null.
**Fix (2026-03-05):** Changed to early `throw/return` when `!activeFamilyId` before the plan check in all four affected functions.

### ✅ FIXED — G10: `syncBirthPlacesToMap` — no server-side `canEditMap` gate
**File:** `app/dashboard/map/actions.ts` — `syncBirthPlacesToMap`
**Fix (2026-03-05):** Added `canEditMap` plan check at the top of the function.

### ✅ FIXED — G11: `nest-keepers` PUT — missing Legacy plan check
**File:** `app/api/nest-keepers/route.ts` — PUT handler
**Risk:** PUT handler lacked the `canManageNestKeepers` check that GET, POST, and DELETE all had.
**Fix (2026-03-05):** Added `getFamilyPlan` + `canManageNestKeepers` check to PUT handler.

### ✅ FIXED -- G12: Journal entry creation -- no `checkFeatureLimit` enforcement (CRITICAL)
**File:** `app/dashboard/journal/actions.ts` -- `createJournalEntry` (line 15)
**Risk:** Comment said "Journal entries are unlimited on all plans" but `PLAN_LIMITS.free.journalEntries = 5`. Free-plan families could create unlimited journal entries.
**Fix (2026-03-12):** Added `checkFeatureLimit(supabase, activeFamilyId, plan.planType, "journalEntries", "journal_entries")` before the insert. Removed incorrect comment.

### ✅ FIXED -- G13: `nest-keepers` DELETE -- missing plan check (Medium)
**File:** `app/api/nest-keepers/route.ts` -- DELETE handler (line 284)
**Risk:** DELETE checked `owner` role but not `canManageNestKeepers(plan)`. Downgraded families could still manage nest keepers.
**Fix (2026-03-12):** Added `getFamilyPlan` + `canManageNestKeepers` check before the delete query, matching GET/POST/PUT.

### ✅ FIXED -- G14: Home mosaic `removePhoto` -- no storage cleanup or family scoping (High)
**File:** `app/dashboard/photos/actions.ts` -- `removePhoto` (line 72)
**Risk:** (a) Deleted by `id` only with no `family_id` scope. (b) Did not remove the file from storage. (c) Did not call `subtractStorageUsage`.
**Fix (2026-03-12):** `removePhoto` now fetches row scoped to `family_id`, deletes scoped to `family_id`, removes storage object, and calls `subtractStorageUsage`.

### ✅ FIXED -- G15: Home mosaic `addPhoto` -- `file_size_bytes` column never populated (Medium)
**File:** `app/dashboard/photos/actions.ts` -- `addPhoto` (line 53)
**Risk:** Migration 080 added `file_size_bytes` to `home_mosaic_photos`, but the insert never set it.
**Fix (2026-03-12):** Added `file_size_bytes: file.size` to the insert payload.

### ✅ FIXED -- G16: Story cover upload -- client-side, no storage enforcement (High)
**File:** `app/dashboard/stories/StoryForm.tsx` -- `handleCoverChange` (line 66)
**Risk:** Cover images were uploaded directly from the client to Supabase storage without `enforceStorageLimit` or `addStorageUsage`.
**Fix (2026-03-12):** Created `uploadStoryCover` Server Action in `stories/actions.ts` with `enforceStorageLimit` + `addStorageUsage`. `StoryForm.tsx` now calls the Server Action instead of uploading client-side.

### ✅ FIXED -- G17: Favourites photo cleanup -- no storage decrement on update/remove (Medium)
**File:** `app/dashboard/favourites/actions.ts`
**Risk:** (a) `updateFavourite` replaced photos without removing old ones from storage. (b) `removeFavourite` soft-deleted but left photos in storage permanently.
**Fix (2026-03-12):** Added `removeFavouritePhoto` helper. `updateFavourite` now cleans up old photo on replacement/clear. `removeFavourite` removes photo from storage and clears `photo_url` at soft-delete time.

### ✅ FIXED — G18: Settings page local PlanType excluded "monthly" (Critical)
**File:** `app/dashboard/settings/page.tsx` (line 19)
**Risk:** Monthly subscribers cast to `PlanType` would fall through to `undefined` in `PLAN_DISPLAY`, crashing the page or showing blank plan info.
**Fix (2026-03-20):** Added `"monthly"` to the local `PlanType` union and added a `monthly` entry to `PLAN_DISPLAY` with badge `"$9.99/month"`.

### ✅ FIXED — G19: Settings page "Your Plan" section had no monthly conditional block (Critical)
**File:** `app/dashboard/settings/page.tsx` (lines 295, 340)
**Risk:** Monthly subscribers hit none of the three plan conditionals (`free`, `annual`, `legacy`), rendering a blank "Your Plan" section with no storage bar, renewal date, or billing controls.
**Fix (2026-03-20):** Changed `planType === "annual"` to `planType === "annual" || planType === "monthly"` — monthly and annual share identical UI (renewal date, storage bar, upgrade-to-legacy CTA, ManageBilling button).

### ✅ FIXED — B7: Admin dashboard and daily report excluded monthly from paid family count (Medium)
**Files:** `app/admin/page.tsx` (lines 143–148), `app/api/daily-report/route.ts` (lines 178–185), `app/api/emails/templates/admin-report.ts` (type + HTML)
**Risk:** Monthly subscribers were not counted in `paidFamilies`, skewing conversion metrics. Admin plan breakdown bar chart had no monthly row.
**Fix (2026-03-20):** Added `monthly` key to `planBreakdown` in both files. Updated `paidFamilies` to include `planBreakdown.monthly`. Added `monthlyFamilies` to the admin-report email template type and HTML (sky-blue bar row between Free and Annual).

### ℹ️ INFORMATIONAL — G20: `sendUpgradeEmail` type signature excludes "annual_founding" (Low)
**File:** `app/api/stripe/webhook/route.ts` (line ~222)
**Note:** Function signature is `plan: "monthly" | "annual" | "legacy"`. The checkout correctly maps `annual_founding` → `"annual"` in metadata before the webhook processes it, so the gap never causes a runtime error. No fix applied — the mapping is correct and intentional.

---

## Billing Infrastructure (B#)

### ✅ FIXED — B1: No `customer.subscription.updated` webhook handler
**File:** `app/api/stripe/webhook/route.ts`
**Risk:** Plan type not synced when Stripe fires `subscription.updated` (trial end, manual update, etc.).
**Fix (2026-03-05):** Added `customer.subscription.updated` case that calls `activatePlan` on `active` status and `deactivatePlan` on `canceled`/`unpaid`.

### ✅ FIXED — B2: Stripe customer deduplication in checkout
**File:** `app/api/stripe/checkout/route.ts`
**Risk:** Each checkout session created a new Stripe customer via `customer_email`, potentially duplicating records.
**Fix (2026-03-05):** Checkout now looks up `families.stripe_customer_id`; reuses it if present, otherwise creates a new Stripe customer and persists the ID before creating the session.

### ✅ FIXED — B3: Customer ID not cross-checked in `activatePlan`
**File:** `app/api/stripe/webhook/route.ts` — `activatePlan`
**Risk:** Metadata mismatch could activate the wrong family's plan.
**Fix (2026-03-05):** `activatePlan` now fetches the existing `stripe_customer_id` for the family and aborts if it doesn't match the event's customer.

### ✅ FIXED — B4: `increment_storage_used` RPC has no DB-level cap
**File:** `supabase/migrations/054_storage_tracking_rpc.sql` → superseded by `079_billing_hardening.sql`
**Risk:** Buggy upload loop could push `storage_used_bytes` past `storage_limit_bytes` at the DB level.
**Fix (2026-03-05):** Updated RPC to `LEAST(storage_used_bytes + bytes_to_add, storage_limit_bytes)` via migration 079.

### ✅ FIXED — B5: Storage counter never decremented on delete
**Files:** Multiple — journal videos, voice memos, achievements, sports photos
**Risk:** Deleting files didn't decrement `storage_used_bytes`, causing the counter to drift.
**Fix (2026-03-05):**
- `deleteJournalVideo`: fetches `file_size_bytes` from DB, removes from storage, calls `subtractStorageUsage`
- `removeVoiceMemo`: uses new `file_size_bytes` column (migration 079), removes from storage, calls `subtractStorageUsage`
- `removeAchievement`: fetches storage object size, removes file, calls `subtractStorageUsage`
- `removeSportsPhoto`: fetches storage object size, removes file, calls `subtractStorageUsage`

### ✅ FIXED — G21: Tradition photo uploads bypass storage enforcement (Critical)
**File:** `app/dashboard/traditions/AddTraditionForm.tsx` (lines 64–74)
**Risk:** Photos uploaded directly from client to `tradition-photos` bucket via `supabase.storage.from(...).upload()` — no `enforceStorageLimit` call, no `addStorageUsage` call. Free-plan families could exceed their 500 MB storage limit silently.
**Fix (2026-03-20):**
- Added `uploadTraditionPhoto(formData: FormData)` Server Action in `actions.ts` that calls `enforceStorageLimit` before upload and `addStorageUsage` after. Returns a proxy URL (`/api/storage/tradition-photos/...`).
- Updated `AddTraditionForm` to call this Server Action instead of uploading client-side directly.

### ✅ FIXED — G22: Tradition deletion leaves orphaned photo files; storage never decremented (Critical)
**File:** `app/dashboard/traditions/actions.ts` — `removeTradition` (line 73)
**Risk:** Deleting a tradition deleted the DB row but left the photo file in storage permanently, and never decremented `storage_used_bytes`. Storage counter drifts up indefinitely.
**Fix (2026-03-20):** Updated `removeTradition` to:
1. Fetch the tradition row (including `photo_url`) before deleting
2. Extract the storage path from the proxy URL
3. Remove the file from `tradition-photos` bucket
4. Call `subtractStorageUsage` with the file size

### ✅ CONFIRMED CORRECT — B6: `storage_limit_bytes` default in migration
**File:** `supabase/migrations/046_family_plans.sql`
**Verification:** Default is `524288000` = exactly 500 MB. Correct for free plan. No action needed.

---

## Confirmed Correct (2026-03-20 re-audit — pricing overhaul)

| Surface | Finding | Status |
|---|---|---|
| `constants.ts` PLAN_LIMITS | All four types (`free`, `monthly`, `annual`, `legacy`) defined with correct storage limits | ✅ Correct |
| `plans.ts` helpers | All helpers use `PLAN_LIMITS[plan]` dynamically — work for all plan types including monthly | ✅ Correct |
| Stripe checkout | `STRIPE_PRICES` map includes `monthly` and `annual_founding`; correct price ID lookup | ✅ Correct |
| Stripe webhook activation | `plan === "annual" || plan === "monthly"` check for subscription types; 30-day expiry for monthly | ✅ Correct |
| Stripe webhook deactivation | `deactivatePlan` resets to free for all plan types | ✅ Correct |
| `annual_founding` → `"annual"` mapping | Checkout metadata maps founding rate to annual before webhook; correct intentional design | ✅ Correct |
| `checkFeatureLimit` | All limits are `null` on free (unlimited) — gates skip correctly | ✅ Correct |
| Storage add-on gate | `isStorageAddon()` check correctly requires paid plan (free blocked) | ✅ Correct |
| DB migration | `plan_type` CHECK updated to include `'monthly'`; annual storage reset to 20 GB | ✅ Correct |
| `PlanLimitBadge` | Returns `null` when limit is `null` (unlimited) — no badge shown | ✅ Correct |

## Confirmed Correct (2026-03-12 re-audit)

The following areas were re-checked and remain correctly implemented:

- **Stripe webhook**: handles `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Customer ID cross-check in `activatePlan` is present.
- **Stripe checkout**: reuses existing `stripe_customer_id`, creates new customer only if missing. Scoped to authenticated user's family. No customer ID passthrough from request body.
- **Stripe portal**: fetches `stripe_customer_id` from DB only, does not accept it from request. Rate limited.
- **Subscription downgrade**: `deactivatePlan` correctly sets `plan_type: "free"` on cancellation.
- **Storage RPCs**: `increment_storage_used` capped with `LEAST()`, `decrement_storage_used` floored with `GREATEST(0, ...)`. Both atomic single-statement.
- **Feature limits**: All of stories, recipes, time capsules, voice memos, traditions, events, map locations, and member count use `checkFeatureLimit()` / `memberLimit()` from `src/lib/plans.ts`. No hardcoded strings.
- **Plan constants**: Free = 500 MB storage, Annual/Legacy = 50 GB. Values in `src/lib/constants.ts` match migration defaults.
- **Storage tracking on upload**: journal photos, journal videos, voice memos, artwork, awards, pets, sports photos all call `enforceStorageLimit` + `addStorageUsage`.
- **Storage tracking on delete**: journal photos, journal videos, voice memos, achievements, sports photos all call `subtractStorageUsage`.
