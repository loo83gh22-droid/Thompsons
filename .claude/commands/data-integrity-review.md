# FamilyNest Data Integrity Review

Conduct a **thorough, structured data integrity audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — Write-Path Integrity
*Do mutations leave the database in a consistent state?*

Check each of the following:

### Cascade Deletes
- When a **family** is deleted, do all child records (members, journal entries, photos, voice memos, recipes, time capsules, stories, events, achievements, artwork, map locations, etc.) get deleted via `ON DELETE CASCADE` in the migrations — or are there tables missing the cascade?
- When a **member** is deleted, is their authored content (journal entries, photos they uploaded, voice memos) either deleted or re-attributed? Or does it orphan with a dangling `author_id`?
- When a **time capsule** is deleted, are its attached photos/files removed from Supabase Storage — not just the DB row?

### Storage Accounting
- Does every upload path call `increment_storage_used` RPC **after** a confirmed successful upload — not before?
- Does every delete path call `decrement_storage_used` RPC **after** a confirmed successful deletion — not before?
- Are there any upload or delete flows that update the DB row but skip the storage RPC (leaving `storage_used_bytes` out of sync)?
- If an upload to Supabase Storage succeeds but the DB insert fails, is the orphaned file cleaned up?

### State Machines
- Can a time capsule's `unlock_date` be changed after it has been sealed? Is the state transition validated server-side?
- Can a Nest Keepers record be created for a family that already has one — resulting in duplicates?

### Duplicate Submissions
- Do Server Actions that create content (journal entries, photos, voice memos, recipes) guard against double-submission? (e.g., unique constraint, idempotency key, or disabled-button pattern enforced server-side?)

---

## 2 — Read-Path Integrity
*Does the app show accurate, consistent data?*

### Stale Context
- When a user switches active family in `FamilyContext`, are all in-flight queries cancelled or invalidated so data from the old family doesn't bleed into the new view?
- Does the cookie-persisted `activeFamilyId` get validated on page load — i.e., does the app verify the user is still a member of that family before trusting the cookie?

### Signed URLs
- Are Supabase signed URLs cached in the DB or component state for longer than their expiry (`expiresIn`) seconds? If so, does the app re-fetch them on expiry?
- Does the `/api/storage/[...path]` proxy re-sign URLs on each request, or serve stale signed URLs?

### Search & Export
- Does the `/api/search` endpoint exclude sealed time capsules (`unlock_date > now()`) from results for non-creators?
- Does the `/api/export` ZIP include **all** content types for the family, with no content type silently omitted?
- Does the export correctly exclude sealed time capsule contents until the unlock date?

### Relationship Consistency
- If member A has a relationship to member B, does deleting member B also remove the relationship record — or does a dangling relationship remain?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files — focus on `app/dashboard/*/actions.ts`, `supabase/migrations/`, `app/api/export`, `app/api/search`, and `src/lib/`.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by Write-Path (W#) and Read-Path (R#).
4. For each finding include:
   - **File and line** where the issue exists
   - **What data becomes inconsistent** and under what conditions
   - **Recommended fix**
5. After listing all findings, **propose a fix plan** ordered by severity (Critical → High → Medium → Low).
6. Note anything that was checked and found to be **already correct** (to confirm coverage).

Before starting, read `docs/DATA_INTEGRITY_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/DATA_INTEGRITY_FINDINGS.md`: add new findings with their W#/R# codes, and mark anything you confirmed as resolved with ✅ FIXED.
