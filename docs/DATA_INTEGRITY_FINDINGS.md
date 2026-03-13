# FamilyNest Data Integrity Findings

Audit conducted: 2026-03-06
Re-audit conducted: 2026-03-12

---

## Write-Path Findings (W#)

### W1 — Journal photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/journal/actions.ts` ~line 639-659
**Issue:** `deleteJournalPhoto()` deletes the DB row but never calls `supabase.storage.from("journal-photos").remove(...)` and never calls `subtractStorageUsage`. Every deleted journal photo leaves an orphaned file in storage and permanently inflates `storage_used_bytes`.
**Fix:** Before deleting the DB row, resolve the storage path from the photo URL, call `storage.remove()`, then `subtractStorageUsage(familyId, fileSizeBytes)`, then delete the row.

---

### W2 — Home-mosaic photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-12)
**File:** `app/dashboard/photos/actions.ts` lines 72-88
**Issue:** `removePhoto()` still deletes the DB record only. The file in the `home-mosaic` bucket is never removed and `storage_used_bytes` is never decremented. The fix from 2026-03-06 is not present in the current code.
**What becomes inconsistent:** Orphaned files accumulate in `home-mosaic` storage bucket; `storage_used_bytes` permanently inflated for the family.
**Fix:** Fetch the photo record (url, file_size_bytes) before deleting, call `storage.from("home-mosaic").remove([path])`, then `subtractStorageUsage()`, then delete the DB row.

---

### W3 — Artwork photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/artwork/actions.ts` ~line 516-538
**Issue:** `deleteArtworkPhoto()` deletes the DB record only. File in `artwork-photos` bucket is never removed; counter not decremented.
**Fix:** Same pattern as W1.

---

### W4 — Pet photo delete: missing storage removal + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/pets/actions.ts` ~line 234-255
**Issue:** `removePetPhoto()` deletes the DB record only. File in `pet-photos` bucket is never removed; counter not decremented.
**Fix:** Same pattern as W1.

---

### W5 — Award delete: file not removed from storage + no decrement ✅ FIXED (2026-03-06)
**File:** `app/dashboard/awards/actions.ts` ~line 186-227
**Issue:** `deleteAward()` fetches `award_files` and calls `storage.remove()` but (a) ignores any error silently, (b) deletes the award DB row regardless, and (c) never calls `subtractStorageUsage`. Result: orphaned files accumulate and the counter never decrements.
**Fix:** Check removal result, only proceed if successful (or handle error explicitly), then decrement counter.

---

### W6 — Journal photo upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/journal/actions.ts` ~line 240-276
**Issue:** Upload loop: (1) storage upload succeeds, (2) `addStorageUsage()` succeeds, (3) DB insert fails -> `continue`. No rollback. Storage file and counter increment are stranded with no DB record.
**Fix:** On DB insert failure, call `storage.remove([path])` and `subtractStorageUsage()` to roll back.

---

### W7 — Awards upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/awards/actions.ts` ~line 58-86
**Issue:** Same pattern as W6.
**Fix:** Same rollback pattern as W6.

---

### W8 — Artwork upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/artwork/actions.ts` ~line 59-76
**Issue:** Same pattern as W6.
**Fix:** Same rollback pattern as W6.

---

### W9 — Pet photo upload: fail-open leaves orphaned files ✅ FIXED (2026-03-06)
**File:** `app/dashboard/pets/actions.ts` ~line 81-98 and ~line 185-202
**Issue:** Same pattern as W6, in both `addPet()` and `updatePet()`.
**Fix:** Same rollback pattern as W6.

---

### W10 — Journal video delete: counter decremented even if storage removal fails ✅ FIXED (2026-03-06)
**File:** `app/dashboard/journal/actions.ts` ~line 865-903
**Issue:** `deleteJournalVideo()` calls `storage.remove()` inside a conditional but ignores the result. `subtractStorageUsage()` runs regardless.
**Fix:** Check the return value of `storage.remove()` and only decrement if removal confirmed.

---

### W11 — Voice memo delete: storage error not surfaced ✅ FIXED (2026-03-06)
**File:** `app/dashboard/voice-memos/actions.ts` ~line 119-151
**Issue:** `removeVoiceMemo()` calls `storage.remove()` but does not check for errors.
**Fix:** Check `remove()` result; if error, either abort or log + surface the error before deleting the row.

---

### W12 — Time capsule `unlock_date` is mutable after creation ✅ FIXED (2026-03-06)
**File:** `supabase/migrations/080_data_integrity_fixes.sql` lines 91-110
**Issue:** No restriction on changing `unlock_date` after creation.
**Fix:** Database trigger `trg_prevent_unlock_date_change` now prevents mutation.

---

### W13 — Missing `time_capsule_members` table ✅ FIXED (2026-03-06)
**File:** `supabase/migrations/080_data_integrity_fixes.sql` lines 25-60
**Issue:** Table referenced in code and RLS policies but never created.
**Fix:** Migration 080 adds `family_id` column and RLS policies to the table.

---

### W14 — Duplicate submission guards missing ✅ FIXED (2026-03-06)
**Files:** `app/dashboard/journal/actions.ts`, `app/dashboard/voice-memos/actions.ts`
**Issue:** No idempotency keys for journal entries and voice memos.
**Fix:** Migration 081 adds `idempotency_key` column with partial unique index. Client generates key on mount.

---

### W15 — Home-mosaic photo upload: no rollback on DB insert failure ✅ FIXED (2026-03-12)
**File:** `app/dashboard/photos/actions.ts` lines 8-69
**Issue:** `addPhoto()` uploads to `home-mosaic` storage (line 23-26), calls `addStorageUsage()` (line 30), then inserts the DB row (line 53-63). If the DB insert fails (line 65), the uploaded file and storage counter increment are orphaned -- no rollback.
**What becomes inconsistent:** Orphaned file in storage, `storage_used_bytes` inflated by the file size with no corresponding DB record.
**Fix:** Wrap the DB insert in a try-catch. On failure, call `storage.from("home-mosaic").remove([path])` and `subtractStorageUsage()`.

---

### W16 — Trophy case delete: storage counter never decremented ✅ FIXED (2026-03-12)
**File:** `app/dashboard/trophy-case/actions.ts` lines 163-214 and 216-257
**Issue:** `deleteTrophy()` correctly removes files from storage (lines 187-192) but never calls `subtractStorageUsage()`. Similarly, `deleteTrophyFile()` removes the file from storage (lines 237-243) but never decrements the counter.
**What becomes inconsistent:** `storage_used_bytes` permanently inflated after every trophy/file deletion, even though the files are correctly removed.
**Fix:** After successful `storage.remove()`, fetch `file_size_bytes` from the `award_files` rows and call `subtractStorageUsage()` for the total size.

---

### W17 — Story delete: cover image not removed from storage ✅ FIXED (2026-03-12)
**File:** `app/dashboard/stories/actions.ts` lines 117-123
**Issue:** `deleteStory()` deletes the DB row but never removes the cover image from the `story-covers` storage bucket. There is also no storage accounting (no `addStorageUsage` on upload, no `subtractStorageUsage` on delete) for story covers at all.
**What becomes inconsistent:** Orphaned cover images accumulate in the `story-covers` bucket. (Lower severity since story covers currently bypass storage accounting entirely, so the counter is not inflated -- but orphaned files still waste real storage.)
**Fix:** Before deleting, fetch the story's `cover_url`. If present, extract the path and call `storage.from("story-covers").remove([path])`. Consider also adding storage accounting to story cover uploads in `createStory()`/`updateStory()`.

---

### W18 — Member delete: profile photo not cleaned up ✅ FIXED (2026-03-12)
**File:** `app/dashboard/members/actions.ts` lines 496-525
**Issue:** `deleteFamilyMember()` deletes the DB row but never removes the member's `avatar_url` from the `member-photos` storage bucket, and never decrements `storage_used_bytes`.
**What becomes inconsistent:** Orphaned profile photos accumulate in `member-photos` bucket. Storage counter remains inflated.
**Fix:** Before deleting, fetch the member's `avatar_url`. If it points to `member-photos`, extract the path and call `storage.remove()`, then `subtractStorageUsage()`.

---

### W19 — Favourites: no storage cleanup on remove or photo replace ✅ FIXED (2026-03-12)
**File:** `app/dashboard/favourites/actions.ts` lines 117-132 (remove), 80-115 (update)
**Issue:** `removeFavourite()` soft-deletes (sets `removed_at`) but never removes the associated photo from `favourite-photos` storage or decrements the counter. `updateFavourite()` when replacing/clearing a photo (lines 91-94, 103-104) uploads a new photo but never removes the old one from storage.
**What becomes inconsistent:** Old favourite photos accumulate as orphaned files. Storage counter never decremented on remove; doubly inflated on photo replacement.
**Fix:** On remove: if the favourite has a `photo_url`, remove from storage and decrement. On update with `clearPhoto` or new photo: fetch old `photo_url`, remove old file from storage, decrement for old size.

---

### W20 — Favourites upload: no rollback on DB insert failure ✅ FIXED (2026-03-12)
**File:** `app/dashboard/favourites/actions.ts` lines 44-78
**Issue:** `addFavourite()` calls `uploadFavouritePhoto()` (which uploads + increments counter) then inserts to DB (line 64). If DB insert fails (line 76), the file and counter increment are orphaned.
**What becomes inconsistent:** Same pattern as W6/W15 -- orphaned file + inflated counter.
**Fix:** Wrap DB insert in try-catch. On failure, remove file from `favourite-photos` storage and call `subtractStorageUsage()`.

---

### W21 — Migration 050: attribution FKs missing ON DELETE behavior ✅ FIXED (2026-03-12)
**File:** `supabase/migrations/050_content_created_by.sql` lines 8-29
**Issue:** Four columns added with bare `REFERENCES public.family_members(id)` -- no `ON DELETE` clause:
- `journal_entries.created_by`
- `family_stories.created_by`
- `home_mosaic_photos.uploaded_by`
- `journal_photos.uploaded_by`

The default FK behavior is `ON DELETE NO ACTION` (= `RESTRICT`). If a family member is deleted, PostgreSQL will block the deletion if any of these columns reference that member.
**What becomes inconsistent:** `deleteFamilyMember()` will fail with a foreign key violation if the member has created any journal entries, stories, or uploaded any photos. The user sees a generic error.
**Fix:** Add a migration to alter these FKs to `ON DELETE SET NULL` -- these are attribution columns and should gracefully null out when a member is removed.

---

## Read-Path Findings (R#)

### R1 — `time_capsule_members` missing table also breaks read path ✅ FIXED (2026-03-06)
Same root cause as W13. The RLS SELECT policy on `time_capsules` checks `time_capsule_members` for secondary recipients.

---

## Confirmed Correct (no action needed)

| Area | Verification |
|------|-------------|
| Cascade deletes -- families | All FKs to `families(id)` use `ON DELETE CASCADE` across 15+ tables |
| Cascade deletes -- family members | `journal_entries`, `time_capsules`, `achievements` (SET NULL intentional), `family_events` (SET NULL intentional) |
| Cascade deletes -- member relationships | `family_relationships` uses CASCADE on both `member_id` and `related_id` |
| Storage limit enforcement | Pre-upload size checks in journal, voice-memos, artwork, awards, pet photos, favourites |
| RLS family isolation | All tables enforce `family_id in (user_family_ids())` |
| Family cookie validation | `getActiveFamilyId()` validates cookie against DB-fetched family list; stale IDs fall back to first valid family |
| Family context switching | `setActiveFamily()` calls `router.refresh()` -- all SSR queries re-execute with new family ID |
| Storage proxy signing | `/api/storage/[...path]` re-signs on every request (60s TTL); file streamed server-side, URL never exposed |
| Search -- sealed capsule exclusion | `.lte("unlock_date", todayStr)` correctly gates sealed capsules |
| Export -- all content types | All content types included; sealed capsules marked but contents still included for archival |
| Export -- family scoping | All export queries use explicit `.eq("family_id", fid)` in addition to RLS |
| Storage bucket whitelist | `/api/storage/` rejects requests to buckets not in `ALLOWED_BUCKETS` set |
| Time capsule RLS | Sender-only UPDATE; unlock_date immutable via trigger (migration 080) |
| Time capsule members table | Exists with family_id column and RLS (migration 080) |
| Member deletion authorization | Prevents removing owner; only owner can delete members |
| Nest Keepers duplicates | `UNIQUE (family_id, priority)` on `nest_keepers` table prevents duplicates |
| family_settings duplicates | `UNIQUE INDEX idx_family_settings_family_id ON family_settings(family_id)` prevents duplicates |
| Journal/voice memo idempotency | `idempotency_key` with partial unique index (migration 081) |
| Journal photo delete | Fetches URL + file_size, removes storage, decrements counter (verified 2026-03-12) |
| Journal photo upload rollback | Rolls back storage on DB insert failure (verified 2026-03-12) |
| Voice memo delete | Fetches files, removes storage, decrements counter gracefully (verified 2026-03-12) |
| Artwork delete + rollback | Proper storage cleanup and upload rollback (verified 2026-03-12) |
| Awards delete + rollback | Proper storage cleanup and upload rollback (verified 2026-03-12) |
| Pet photos delete + rollback | Proper storage cleanup and upload rollback (verified 2026-03-12) |
| Achievements storage | Proper rollback on upload and cleanup on delete (verified 2026-03-12) |
| Bucket list items | No file uploads; proper family_id scoping and cascading deletes |
| Export signed URLs | Re-generated fresh on each GET request (300s TTL), not cached |

---

## Fix Plan (Severity Order)

All findings from this audit have been resolved (2026-03-12):

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| W21 | Attribution FKs missing ON DELETE SET NULL | Critical | ✅ Migration `20260312000001` |
| W2 | Home-mosaic photo delete: no storage cleanup | High | ✅ Fixed in `photos/actions.ts` |
| W15 | Home-mosaic photo upload: no rollback | High | ✅ Fixed in `photos/actions.ts` |
| W16 | Trophy case delete: counter not decremented | High | ✅ Fixed in `trophy-case/actions.ts` |
| W19 | Favourites: no storage cleanup on remove/replace | High | ✅ Fixed in `favourites/actions.ts` |
| W20 | Favourites upload: no rollback | High | ✅ Fixed in `favourites/actions.ts` |
| W17 | Story delete: cover image not removed | Medium | ✅ Fixed in `stories/actions.ts` |
| W18 | Member delete: profile photo not cleaned up | Medium | ✅ Fixed in `members/actions.ts` |
