# FamilyNest Data Integrity Findings

Audit conducted: 2026-03-06

---

## Write-Path Findings (W#)

### W1 — Journal photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/journal/actions.ts` ~line 639–659
**Issue:** `deleteJournalPhoto()` deletes the DB row but never calls `supabase.storage.from("journal-photos").remove(...)` and never calls `subtractStorageUsage`. Every deleted journal photo leaves an orphaned file in storage and permanently inflates `storage_used_bytes`.
**Fix:** Before deleting the DB row, resolve the storage path from the photo URL, call `storage.remove()`, then `subtractStorageUsage(familyId, fileSizeBytes)`, then delete the row.

---

### W2 — Home-mosaic photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/photos/actions.ts` ~line 68–87
**Issue:** `removePhoto()` deletes the DB record only. The file in the `home-mosaic` bucket is never removed and `storage_used_bytes` is never decremented.
**Fix:** Same pattern as W1 — remove from storage, decrement counter, then delete DB row.

---

### W3 — Artwork photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/artwork/actions.ts` ~line 516–538
**Issue:** `deleteArtworkPhoto()` deletes the DB record only. File in `artwork-photos` bucket is never removed; counter not decremented.
**Fix:** Same pattern as W1.

---

### W4 — Pet photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/pets/actions.ts` ~line 234–255
**Issue:** `removePetPhoto()` deletes the DB record only. File in `pet-photos` bucket is never removed; counter not decremented.
**Fix:** Same pattern as W1.

---

### W5 — Award delete: file not removed from storage + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/awards/actions.ts` ~line 186–227
**Issue:** `deleteAward()` fetches `award_files` and calls `storage.remove()` but (a) ignores any error silently, (b) deletes the award DB row regardless, and (c) never calls `subtractStorageUsage`. Result: orphaned files accumulate and the counter never decrements.
**Fix:** Check removal result, only proceed if successful (or handle error explicitly), then decrement counter.

---

### W6 — Journal photo upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/journal/actions.ts` ~line 240–276
**Issue:** Upload loop: (1) storage upload succeeds, (2) `addStorageUsage()` succeeds, (3) DB insert fails → `continue`. No rollback. Storage file and counter increment are stranded with no DB record.
**Fix:** On DB insert failure, call `storage.remove([path])` and `subtractStorageUsage()` to roll back.

---

### W7 — Awards upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/awards/actions.ts` ~line 58–86
**Issue:** Same pattern as W6 — storage + counter succeed, DB insert fails silently in `catch { /* skip */ }`.
**Fix:** Same rollback pattern as W6.

---

### W8 — Artwork upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/artwork/actions.ts` ~line 59–76
**Issue:** Same pattern as W6.
**Fix:** Same rollback pattern as W6.

---

### W9 — Pet photo upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/pets/actions.ts` ~line 81–98 and ~line 185–202
**Issue:** Same pattern as W6, in both `addPet()` and `updatePet()`.
**Fix:** Same rollback pattern as W6.

---

### W10 — Journal video delete: counter decremented even if storage removal fails ✅ FIXED (2026-03-06)
**File:** `app/dashboard/journal/actions.ts` ~line 865–903
**Issue:** `deleteJournalVideo()` calls `storage.remove()` inside a conditional but ignores the result. `subtractStorageUsage()` runs regardless. If the storage remove fails silently, the file is stranded but the counter goes negative (mitigated by `GREATEST(0, ...)` RPC, but still incorrect).
**Fix:** Check the return value of `storage.remove()` and only decrement if removal confirmed.

---

### W11 — Voice memo delete: storage error not surfaced ✅ FIXED (2026-03-06)
**File:** `app/dashboard/voice-memos/actions.ts` ~line 119–151
**Issue:** `removeVoiceMemo()` calls `storage.remove()` but does not check for errors. If removal fails, the DB row is deleted (losing the reference) but the file remains in storage — orphaned with no pointer.
**Fix:** Check `remove()` result; if error, either abort or log + surface the error before deleting the row.

---

### W12 — Time capsule `unlock_date` is mutable after creation ✅ FIXED (2026-03-06)
**File:** `supabase/migrations/026_time_capsules.sql`, `supabase/migrations/058_time_capsule_privacy_and_passing.sql`
**Issue:** The RLS UPDATE policy restricts who can update a capsule (sender only), but it places no restriction on *which fields* can be changed. A sender can update `unlock_date` at any time, breaking the sealing guarantee.
**Fix:** Add a CHECK trigger or column-level RLS condition that prevents changing `unlock_date` once the capsule is created (or after it has been "sent"). Alternatively, add an `is_locked` boolean set on first send and prevent updates to `unlock_date` when `is_locked = true`.

---

### W13 — Missing `time_capsule_members` table ✅ FIXED (2026-03-06)
**Referenced in:** `app/dashboard/time-capsules/actions.ts` line 45, `app/dashboard/time-capsules/page.tsx` line 48, `app/dashboard/time-capsules/[id]/page.tsx` line 53, `app/admin/scrub/actions.ts` line 263, migration 058 RLS lines 26–28
**Issue:** The application code queries `time_capsule_members` in multiple places, and migration 058's RLS SELECT policy references this table — but no migration creates this table. All inserts/selects against it silently fail. Multi-recipient time capsules are broken: only the primary `to_family_member_id` is stored. Secondary recipients are locked out without any error.
**Fix:** Create a migration that adds:
```sql
create table public.time_capsule_members (
  id uuid primary key default gen_random_uuid(),
  time_capsule_id uuid references public.time_capsules(id) on delete cascade not null,
  family_member_id uuid references public.family_members(id) on delete cascade not null,
  family_id uuid references public.families(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(time_capsule_id, family_member_id)
);
-- Enable RLS and add appropriate policies
```

---

### W14 — Duplicate submission guards missing ✅ FIXED (2026-03-06)
**Files:** `app/dashboard/journal/actions.ts`, `app/dashboard/voice-memos/actions.ts`, `app/dashboard/journal/new/page.tsx`, `app/dashboard/voice-memos/AddVoiceMemoForm.tsx`
**Issue:** `createJournalEntry()` and `insertVoiceMemo()` had no idempotency key or unique constraint. A network timeout + user resubmission created duplicate entries.
**Fix:** Added `idempotency_key uuid` column (nullable, partial unique index) to both tables (migration 081). Client generates `crypto.randomUUID()` on mount, passes it in every submission, and rotates it only on success. Server handles `23505` conflict on `journal_entries` by returning the existing entry's id (so video registration can proceed); on `voice_memos` it treats the conflict as a silent success.

---

## Read-Path Findings (R#)

### R1 — `time_capsule_members` missing table also breaks read path ✅ FIXED (2026-03-06)
Same root cause as W13. The RLS SELECT policy on `time_capsules` checks `time_capsule_members` for secondary recipients — since the table doesn't exist, the query may fail silently or return incorrect membership results.

---

## Confirmed Correct (no action needed)

| Area | Verification |
|------|-------------|
| Cascade deletes — families | All FKs to `families(id)` use `ON DELETE CASCADE` across 15+ tables |
| Cascade deletes — family members | `journal_entries`, `time_capsules`, `achievements` (SET NULL intentional), `family_events` (SET NULL intentional) |
| Cascade deletes — member relationships | `family_relationships` uses CASCADE on both `member_id` and `related_id` |
| Storage limit enforcement | Pre-upload size checks in journal, voice-memos, artwork, awards, pet photos |
| RLS family isolation | All tables enforce `family_id in (user_family_ids())` |
| Family cookie validation | `getActiveFamilyId()` validates cookie against DB-fetched family list; stale IDs fall back to first valid family |
| Family context switching | `setActiveFamily()` calls `router.refresh()` — all SSR queries re-execute with new family ID |
| Storage proxy signing | `/api/storage/[...path]` re-signs on every request (60s TTL); file streamed server-side, URL never exposed |
| Search — sealed capsule exclusion | `.lte("unlock_date", todayStr)` correctly gates sealed capsules |
| Export — all content types | All content types included; sealed capsules marked but contents still included for archival |
| Export — family scoping | All export queries use explicit `.eq("family_id", fid)` in addition to RLS |
| Storage bucket whitelist | `/api/storage/` rejects requests to buckets not in `ALLOWED_BUCKETS` set |
| Time capsule RLS — sender-only UPDATE | Correctly restricts UPDATE to `from_family_member_id` |
| Member deletion authorization | Prevents removing owner; only owner can delete members |
| Nest Keepers duplicates | Not explicitly checked — verify `family_settings` unique constraint on `family_id` |

---

## Fix Plan (Severity Order)

### Critical (fix first)
1. **W13 / R1** — Create the `time_capsule_members` migration. Multi-recipient capsules are silently broken.
2. **W1–W5** — Add storage file deletion and counter decrement to all photo/file delete actions.
3. **W6–W9** — Add storage rollback (remove file + decrement counter) when DB insert fails after upload.

### High
4. **W10** — Check `storage.remove()` result in `deleteJournalVideo()` before decrementing counter.
5. **W11** — Surface or handle `storage.remove()` errors in `removeVoiceMemo()` before deleting DB row.
6. **W12** — Prevent `unlock_date` mutation after capsule creation via trigger or application-layer guard.

### Medium
7. **W14** — Add idempotency keys or unique constraints to prevent duplicate journal/voice-memo submissions.
