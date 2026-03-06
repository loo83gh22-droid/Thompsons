# FamilyNest Performance Findings

Last audit: 2026-03-06 | All findings from initial audit fixed 2026-03-06

---

## Database Findings

### D1 — Unbounded journal query + secondary batch (HIGH) ✅ FIXED

**Files:**
- `app/dashboard/journal/page.tsx:22–35` — main entries query, no `.limit()`
- `app/dashboard/journal/page.tsx:44–56` — secondary batch for ALL photos + videos + perspectives across ALL entries, no limit

**Impact:** A family with 200 journal entries (plausible in a few years) loads every entry with its author, then batch-fetches every photo and video across all 200 entries in a single round-trip. That secondary fetch could return thousands of rows. Page will slow noticeably and consume significant server memory.

**Fix:**
1. Add `.limit(50)` (or use `QUERY_LIMITS`) to the entries query and implement cursor/page-based navigation or a "load more" pattern.
2. The batch photo/video fetch is bounded by the entries returned — fixing (1) automatically bounds (2).

**Suggested index** (also covers D5):
```sql
CREATE INDEX idx_journal_entries_family_dates
  ON public.journal_entries (family_id, trip_date DESC NULLS LAST, created_at DESC);
```

---

### D2 — Unbounded voice-memos query (MEDIUM) ✅ FIXED

**File:** `app/dashboard/voice-memos/page.tsx:20–37`

**Impact:** Fetches every voice memo for the family with full transcript text in the `transcript` column. A family with 100 long memos could be transferring megabytes of text on page load.

**Fix:** Add `.limit(50)` and implement pagination. Defer `transcript` loading to the detail view — remove it from the list query's `.select()`.

---

### D3 — Unbounded photos query (MEDIUM) ✅ FIXED

**File:** `app/dashboard/photos/page.tsx:20–25`

**Impact:** Loads every row in `home_mosaic_photos` for the family. After a year of regular use a family could have 500+ photos; all their URLs and metadata are fetched to render the management grid.

**Fix:** Add `.limit(200)` with cursor-based pagination. The mosaic background already caps at 80 via `PHOTO_LIMITS.mosaicDisplayLimit` — the manage page needs its own cap.

**Suggested index** (also covers D5):
```sql
CREATE INDEX idx_home_mosaic_photos_family_dates
  ON public.home_mosaic_photos (family_id, taken_at DESC NULLS LAST, created_at DESC);
```

---

### D4 — Unbounded stories + voice-memo secondary queries (LOW–MEDIUM) ✅ FIXED

**Files:**
- `app/dashboard/stories/page.tsx:17–29` — no `.limit()`
- `app/dashboard/voice-memos/page.tsx` — members sub-query is bounded (small table), but memos are not

**Impact:** Lower risk than D1/D2 because stories tend to be fewer, but still unbounded. Add `.limit(100)` as a safety cap.

---

### D5 — Missing composite indexes on high-traffic filter+sort columns (HIGH) ✅ FIXED

**What exists:** Only share-token, `family_member_id`, and `family_id` simple indexes on a handful of newer tables. Core feature tables that power every page load have **no composite indexes**.

**Missing indexes:**

| Table | Missing index | Used by |
|---|---|---|
| `journal_entries` | `(family_id, trip_date DESC, created_at DESC)` | Journal page, timeline |
| `home_mosaic_photos` | `(family_id, taken_at DESC, created_at DESC)` | Photos page, mosaic |
| `voice_memos` | `(family_id, created_at DESC)` | Voice memos page |
| `family_stories` | `(family_id, created_at DESC)` | Stories page |
| `time_capsules` | `(unlock_date)` | Search API (`app/api/search/route.ts:97`) |

**Impact:** Every page load does a sequential scan of all rows in these tables filtered by `family_id`, then sorts. As rows grow the scan time grows linearly. The `unlock_date` index miss means the search API does a full table scan to find unlocked capsules.

**Fix — add a single migration:**
```sql
CREATE INDEX IF NOT EXISTS idx_journal_entries_family_dates
  ON public.journal_entries (family_id, trip_date DESC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_home_mosaic_photos_family_dates
  ON public.home_mosaic_photos (family_id, taken_at DESC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_memos_family_created
  ON public.voice_memos (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_family_stories_family_created
  ON public.family_stories (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_date
  ON public.time_capsules (unlock_date)
  WHERE unlock_date IS NOT NULL;
```

---

### D6 — Double-nested RLS subquery on `award_members` (MEDIUM) ✅ FIXED

**File:** `supabase/migrations/064_awards.sql:65–73`

```sql
USING (award_id IN (
  SELECT id FROM public.awards
  WHERE family_id IN (SELECT public.user_family_ids())
));
```

**Impact:** RLS must first call `user_family_ids()` (returning a set of UUIDs), then scan `awards` for matching family_ids, then scan `award_members` for matching award_ids — three logical passes per query. `user_family_ids()` is `STABLE` so it's cached within the statement, but the nested `IN (SELECT ...)` on `awards` can still force an inefficient plan.

**Fix:** Replace with an `EXISTS` join which the Postgres planner handles more efficiently:
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.awards a
    WHERE a.id = award_members.award_id
      AND a.family_id IN (SELECT public.user_family_ids())
  )
);
```

---

## Frontend Findings

### F1 — MosaicBackground serves full-resolution photos with `unoptimized` (MEDIUM) ✅ FIXED

**File:** `app/components/MosaicBackground.tsx:53–60`

```tsx
<Image src={url} alt="" fill unoptimized className="object-cover" />
```

**Impact:** Every dashboard page load fetches up to 80 full-resolution user photos (can be 3–10 MB each) to fill 180–280px tile slots. The `unoptimized` flag bypasses Next.js image optimization entirely. With 80 tiles this could sum to hundreds of MB of image data on first load.

**Fix:** Remove `unoptimized` and let Next.js serve WebP/AVIF at the correct size. Or — better — append Supabase image transform params to the URL before passing to `<Image>`:
```ts
// In MosaicBackground.tsx, when building urls:
const thumbUrl = url.includes('supabase.co')
  ? `${url}?width=400&quality=70`
  : url;
```
Also add `sizes="280px"` to the `<Image>` so the browser knows not to download a large srcset variant.

---

### F2 — No Supabase image transforms for thumbnails across the app (MEDIUM)

**Affected files:**
- `app/dashboard/journal/JournalPhotoGallery.tsx:160` — grid thumbnails at full res
- `app/dashboard/members/MemberList.tsx:204, 271` — avatar `<img>` at full res
- `app/dashboard/favourites/CurrentFavourites.tsx:169, 249` — thumbnails at full res
- `app/dashboard/artwork/[memberId]/[pieceId]/ArtworkDetail.tsx:476` — detail image at full res

**Impact:** Every `<img>` displaying a user-uploaded photo fetches the original upload (typically 2–8 MB). For a journal entry with 8 photos, the gallery alone can load 50+ MB.

**Fix:** Append Supabase transform params on any URL that comes from Supabase Storage:
```ts
function thumbUrl(url: string, width = 400, quality = 75) {
  if (!url.includes('supabase.co')) return url;
  return `${url}?width=${width}&quality=${quality}&resize=cover`;
}
```
Use `width=400` for grid thumbnails, `width=800` for detail views.

---

### F3 — Member avatars use `<img>` without lazy-load in high-frequency component (LOW) ✅ FIXED

**File:** `app/dashboard/members/MemberList.tsx:204`

```tsx
<img src={displayPhoto} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--border)]" />
```

**Impact:** The compact avatar row loads all member avatar images eagerly. With 15 family members this is 15 separate image requests on every page that includes MemberList.

**Fix:** Add `loading="lazy"` to all `<img>` tags not in the initial viewport. The line-271 instance already has `loading="lazy"` — apply the same to line 204.

---

### F4 — Export route builds full ZIP in Vercel function memory (MEDIUM RISK)

**File:** `app/api/export/route.ts:593–620`

**Impact:** JSZip accumulates all family media in RAM before uploading to Supabase Storage. A family at the 750 MB guard limit will attempt to hold ~750 MB in a Vercel function that has a 1 GB heap. Compression at `level: 6` can temporarily double RAM usage. The existing size check (line 164–176) mitigates the worst case but doesn't eliminate it.

**Note:** This is a known risk already flagged in a code comment on line 164. Current mitigation is adequate for typical family sizes. No immediate action required — monitor Vercel function memory metrics if families grow toward the limit.

---

## Already Optimised ✅

The following items were checked and found to be well-implemented:

- **`user_family_ids()` is `STABLE`** (`025_multi_tenancy.sql:55`) — Postgres calls it once per statement, not per row. The `IN (SELECT user_family_ids())` pattern in RLS policies is safe.
- **Global search is debounced 250ms** (`GlobalSearch.tsx`) — no per-keystroke API calls.
- **JSZip is lazy-loaded** (`import/parsers.ts:167`) — not in the initial bundle.
- **Dashboard home page is paginated** — uses `QUERY_LIMITS.dashboardPreview` (10 rows) for recent photos and other widgets.
- **MosaicBackground capped at 80 photos** — `PHOTO_LIMITS.mosaicDisplayLimit` prevents unbounded fetch.
- **Journal secondary fetches use batch `.in()`** — not N+1; one query for photos, one for videos, one for perspectives across all entries. Efficient pattern, just needs a limit upstream (D1).
- **Events invitees use batch `.in()`** — no N+1 on the events page.
- **Time-capsule sender lookup uses batch `.in()`** — no N+1.
- **Export route has 750 MB OOM guard** (`route.ts:164–176`).
- **`next/image` used in MosaicBackground** — correct component, just needs `unoptimized` removed (F1).
- **Specific column selection** — most queries select only needed columns, not `SELECT *`.
- **Recipes preview limited to 50** — `app/dashboard/recipes/page.tsx` has `.limit(50)`.

---

## Fix Plan (highest impact first)

| Priority | Finding | Effort | Expected gain |
|---|---|---|---|
| 1 | **D5** — Add 5 composite indexes | Low (one migration) | Largest: eliminates sequential scans on every page load as data grows |
| 2 | **F1** — Remove `unoptimized` from MosaicBackground; add transforms | Low | High: cuts mosaic image payload by 80–90% |
| 3 | **D1** — Add limit to journal page + pagination UI | Medium | High: prevents multi-second loads for large families |
| 4 | **F2** — Add Supabase transforms to photo thumbnails app-wide | Medium | Medium: cuts per-photo bandwidth 80% |
| 5 | **D2** — Add limit to voice-memos, defer transcript to detail view | Low | Medium: eliminates bulk text transfer |
| 6 | **D3** — Add limit to photos page | Low | Medium: caps manage-page payload |
| 7 | **D6** — Rewrite award_members RLS to use EXISTS | Low | Low–Medium: only matters at high award counts |
| 8 | **D4** — Add safety limits to stories | Low | Low: stories tend to be few |
| 9 | **F3** — Add `loading="lazy"` to line-204 avatar | Trivial | Low |
