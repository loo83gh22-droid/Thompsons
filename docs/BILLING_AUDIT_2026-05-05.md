# FamilyNest Billing & Plan-Enforcement Re-Audit

**Audit Date:** 2026-05-05  
**Period Covered:** 2026-04-05 to 2026-05-05  
**Last Audit:** 2026-04-05  
**Reference:** `docs/BILLING_FINDINGS.md` (baseline, all items marked ✅, ⚠️, or ℹ️)

---

## Executive Summary

Comprehensive re-audit of all billing-critical surfaces. **NO NEW FINDINGS.** All previously fixed issues remain fixed. New code changes since 2026-04-05 are either feature-consolidation (UI/organization only) or infrastructure improvements with correct billing/storage enforcement applied.

---

## Audit Methodology

1. **Git log review:** Identified all commits and file changes since 2026-04-05
2. **Changed files analysis:** Examined files touched by billing-related commits:
   - `app/dashboard/members/actions.ts` — Enhanced with storage cleanup on member deletion
   - `src/lib/feature-catalog.ts` — UI reorganization only (no billing logic)
3. **Spot-check verification:** Confirmed unchanged surfaces remain correctly implemented:
   - `src/lib/plans.ts` and `src/lib/constants.ts` (plan limits, feature helpers)
   - `app/api/stripe/checkout/route.ts` (customer deduplication, plan selection)
   - `app/api/nest-keepers/route.ts` (all handlers for Legacy plan gating)

---

## Surface-by-Surface Analysis

### 1. Plan Limits & Constants (`src/lib/plans.ts`, `src/lib/constants.ts`)

**Status:** ✅ No changes since 2026-04-05

- `PLAN_LIMITS` object correctly defines all four plan types (free, monthly, annual, legacy)
- Storage limits: Free=500MB, Monthly/Annual=5GB, Legacy=10GB
- Feature helpers (`featureLimit`, `memberLimit`, `videosPerEntryLimit`, `canManageNestKeepers`) all use `PLAN_LIMITS[plan]` dynamically
- Deprecated helpers (`canUploadVideos`, `canEditMap`, `canSharePublicly`) are intentional backward compat, never called in new code

**Finding:** No new findings on this surface.

---

### 2. Stripe Checkout & Webhooks

**Status:** ✅ No changes since 2026-04-05

- `app/api/stripe/checkout/route.ts` still correctly:
  - Deduplicates Stripe customers via `families.stripe_customer_id`
  - Validates plan against `VALID_PLANS` list
  - Gates storage add-ons behind paid plan check (line 93: `if (!family || family.plan_type === "free")`)
- Webhook handler (`app/api/stripe/webhook/route.ts`) handles five events correctly
  - `customer.subscription.updated`, `customer.subscription.deleted` properly sync plan state
  - `activatePlan` cross-checks `stripe_customer_id` to prevent mismatches

**Finding:** No new findings on this surface.

---

### 3. Nest Keepers API (`app/api/nest-keepers/route.ts`)

**Status:** ✅ No changes since 2026-04-05

- All four handlers (GET, POST, PUT, DELETE) correctly gate on `canManageNestKeepers(plan.planType)` — Legacy plan only
- Owner-role check present in all handlers
- No bypass vectors

**Finding:** No new findings on this surface.

---

### 4. Members Module (`app/dashboard/members/actions.ts`)

**Status:** ✅ Enhanced with storage cleanup; no new vulnerabilities

**Changes since 2026-04-05:**
- `addFamilyMember`: Added email failure fallback and invite URL generation (UX improvement)
- `addFamilyMember`: Member limit check was already present and remains correct (lines 212–225)
  - Calls `getFamilyPlan()` → `memberLimit(plan.planType)`
  - Throws if free-plan family at 6-member cap
  - Error message includes `/pricing` link
- `deleteFamilyMember`: Enhanced to clean up member's avatar_url from storage before deletion
  - Correctly extracts file size from storage metadata
  - Calls `subtractStorageUsage(supabase, activeFamilyId, fileSize)` on cleanup
  - No regression; storage tracking was already present, just improved

**Finding:** No new vulnerabilities. Member limit enforcement and storage cleanup are both correctly implemented.

---

### 5. Feature Catalog (`src/lib/feature-catalog.ts`)

**Status:** ✅ Changes are UI-only; no billing impact

**Changes since 2026-04-05:**
- Removed "One Line A Day" from catalog (feature fully deprecated in commit 8ecf422)
- Moved Time Capsules, Family Book Club, Trip Planner to different `navGroup` values
- Moved Feature Catalog itself from "organise" dropdown to avatar menu
- All changes are navigation/grouping only; no feature limits, no storage, no plan gating modified

**Finding:** No new findings on this surface.

---

### 6. Storage RPCs (Supabase migrations)

**Status:** ✅ No recent changes

Last verified in 2026-04-05 audit. Migration 079 (`079_billing_hardening.sql`) established:
- `increment_storage_used`: Capped with `LEAST(storage_used_bytes + bytes_to_add, storage_limit_bytes)`
- `decrement_storage_used`: Floored with `GREATEST(0, storage_used_bytes - bytes_to_add)`

No new migrations touching storage RPCs since 2026-04-05.

**Finding:** No new findings on this surface.

---

### 7. Feature-Gated Dashboard Modules

**Status:** ✅ No new modules added; existing modules retain enforcement

Since 2026-04-05:
- No new `actions.ts` files added to dashboard modules
- One Line A Day module deleted (but no billing logic involved)
- All feature-gated modules (journal, stories, recipes, voice-memos, traditions, etc.) continue to call `checkFeatureLimit` before insert

**Finding:** No new findings on this surface.

---

## Confirmed Clean Areas (Spot-Check Re-verification)

| Area | Check | Status |
|------|-------|--------|
| Journal entry creation | `checkFeatureLimit("journalEntries")` present | ✅ |
| Map locations | `canEditMap` gate + `checkFeatureLimit("mapLocations")` in both `addTravelLocation` and `syncBirthPlacesToMap` | ✅ |
| Voice memos | `enforceStorageLimit` + `addStorageUsage` on insert; `subtractStorageUsage` on delete | ✅ |
| Story cover photos | `uploadStoryCover` Server Action with `enforceStorageLimit` + `addStorageUsage` | ✅ |
| Tradition photos | `uploadTraditionPhoto` Server Action; cleanup on delete with `subtractStorageUsage` | ✅ |
| Achievement photos | `enforceStorageLimit` + `addStorageUsage` on upload; storage cleanup on delete | ✅ |
| Sports photos | Family-scoped; `enforceStorageLimit` + storage tracking present | ✅ |
| Settings page plan display | Free, Monthly, Annual, Legacy all have correct UI blocks | ✅ |
| Admin dashboard metrics | Monthly plan counted in paid family metrics | ✅ |

---

## New Issues Found

**None.** All audited surfaces remain correctly implemented.

---

## Deferred Issues (Still Pending)

From `docs/BILLING_FINDINGS.md`:

- **G7: Client-side uploads pre-gate missing** — Five modules still upload directly from client before Server Action calls `enforceStorageLimit`. Status: ⚠️ DEFERRED (scheduled for dedicated sprint). No regression introduced by 2026-04-05 → 2026-05-05 changes.

---

## Conclusion

**Result:** ✅ **CLEAN — No new issues, no regressions**

The codebase remains billing-compliant. Recent changes (members storage cleanup, feature catalog reorganization, invite email UX improvements) do not introduce new plan-bypass vectors or storage-tracking gaps. All previously fixed items remain fixed.

**Next Steps:**
1. Schedule G7 refactor for a dedicated sprint (client-side upload consolidation)
2. Resume regular rolling audits on the next quarterly boundary (2026-07-05)
