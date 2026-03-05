# FamilyNest Billing & Plan Enforcement Review

Conduct a **thorough, structured billing and plan enforcement audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — Plan Feature Gating
*Can users access paid features without a paid plan?*

Check each of the following:

### Client-Side Gates (UI only — must always have a server-side twin)
- Are all plan-gated UI elements (map editing, video upload, public sharing, Nest Keepers) also blocked in the corresponding Server Actions — not just hidden in the component?
- Does hiding a button in the UI actually prevent the Server Action from running if called directly?

### Server-Side Gates (in Server Actions and API routes)
- Does the journal creation Server Action enforce the **10-entry limit** for `free` plan families before inserting?
- Does the video upload path check `canUploadVideos(planType)` server-side before writing to Supabase Storage?
- Does the map editing Server Action (add/edit/delete location) check `canEditMap(planType)` before mutating?
- Does `/api/nest-keepers` check **both** `owner` role AND `legacy` plan before allowing reads or writes?
- Does the public-sharing action check `canSharePublicly(planType)` before setting content to public?
- Are all plan checks sourced from `src/lib/plans.ts` constants — not hardcoded inline strings?

### Free-Tier Storage
- Does `enforceStorageLimit()` correctly throw before upload when `storage_used_bytes >= storage_limit_bytes`?
- Is the storage limit for `free` families correctly set to 500 MB and `annual`/`legacy` to 50 GB at family creation time?

---

## 2 — Billing Infrastructure
*Is the billing system correctly tracking and syncing plan state?*

### Stripe Sync
- Does the `/api/stripe/webhook` handler update `plan_type` on the `families` table when receiving `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` events?
- When a subscription lapses (`customer.subscription.deleted`), does the family correctly downgrade to `free` — not stay on `annual`?
- Is there a Stripe customer ID linkage check? (i.e., does the webhook verify that `stripe_customer_id` on the family matches the Stripe event's `customer` field before updating?)

### Portal & Checkout
- Does the Stripe portal session scope to the authenticated user's `stripe_customer_id` only — not accept a customer ID from the request body?
- Does the checkout session handler create or retrieve (not duplicate) a Stripe customer for existing users?

### Storage Accounting
- Are the `increment_storage_used` and `decrement_storage_used` RPCs called atomically — i.e., not via two separate queries that could race?
- Are there any upload or delete code paths in `app/dashboard/` that bypass the storage RPC (e.g., direct Supabase Storage calls without the tracker)?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files, focusing on `app/dashboard/*/actions.ts`, `app/api/stripe/`, and `src/lib/plans.ts`.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by Feature Gating (G#) and Billing Infrastructure (B#).
4. For each finding include:
   - **File and line** where the issue exists
   - **What a user could do** (which plan bypasses what feature)
   - **Recommended fix**
5. After listing all findings, **propose a fix plan** ordered by severity (Critical → High → Medium → Low).
6. Note anything that was checked and found to be **already correct** (to confirm coverage).

Before starting, read `docs/BILLING_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/BILLING_FINDINGS.md`: add new findings with their G#/B# codes, and mark anything you confirmed as resolved with ✅ FIXED.
