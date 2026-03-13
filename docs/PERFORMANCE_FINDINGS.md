# FamilyNest Performance Findings

Last audit: 2026-03-13 | All findings fixed 2026-03-13

---

## Database Findings

### D1 — Unbounded journal query + secondary batch (HIGH) ✅ FIXED

**Files:**
- `app/dashboard/journal/page.tsx:22-35` — main entries query, no `.limit()`
- `app/dashboard/journal/page.tsx:44-56` — secondary batch for ALL photos + videos + perspectives across ALL entries, no limit

**Impact:** A family with 200 journal entries (plausible in a few years) loads every entry with its author, then batch-fetches every photo and video across all 200 entries in a single round-trip. That secondary fetch could return thousands of rows. Page will slow noticeably and consume significant server memory.

**Fix:**
1. Add `.limit(50)` (or use `QUERY_LIMITS`) to the entries query and implement cursor/page-based navigation or a "load more" pattern.
2. The batch photo/video fetch is bounded by the entries returned -- fixing (1) automatically bounds (2).

---

### D2 — Unbounded voice-memos query (MEDIUM) ✅ FIXED

**File:** `app/dashboard/voice-memos/page.tsx:20-37`

**Impact:** Fetches every voice memo for the family with full transcript text in the `transcript` column. A family with 100 long memos could be transferring megabytes of text on page load.

**Fix:** Add `.limit(50)` and implement pagination. Defer `transcript` loading to the detail view -- remove it from the list query's `.select()`.

---

### D3 — Unbounded photos query (MEDIUM) ✅ FIXED

**File:** `app/dashboard/photos/page.tsx:20-25`

**Impact:** Loads every row in `home_mosaic_photos` for the family. After a year of regular use a family could have 500+ photos; all their URLs and metadata are fetched to render the management grid.

**Fix:** Add `.limit(200)` with cursor-based pagination.

---

### D4 — Unbounded stories + voice-memo secondary queries (LOW-MEDIUM) ✅ FIXED

**Files:**
- `app/dashboard/stories/page.tsx:17-29` — no `.limit()`
- `app/dashboard/voice-memos/page.tsx` — members sub-query is bounded (small table), but memos are not

**Impact:** Lower risk than D1/D2 because stories tend to be fewer, but still unbounded. Add `.limit(100)` as a safety cap.

---

### D5 — Missing composite indexes on high-traffic filter+sort columns (HIGH) ✅ FIXED

Applied in migration `082_performance_composite_indexes.sql`. Covers journal_entries, home_mosaic_photos, voice_memos, family_stories, and time_capsules.

---

### D6 — Double-nested RLS subquery on `award_members` (MEDIUM) ✅ FIXED

Applied in migration `083_performance_award_members_rls_exists.sql`. Replaced `IN (SELECT ...)` with `EXISTS` join.

---

### D7 — Import action uses individual inserts in a loop (MEDIUM) ✅ FIXED

**File:** `app/dashboard/import/actions.ts:65-170`

**Impact:** When importing journal entries, stories, recipes, or events, each row is inserted individually inside a `for` loop. Importing 100 journal entries makes 100 separate database round-trips instead of 1 batch insert. Import times scale linearly with row count -- a 200-row CSV could take 30+ seconds.

**Fix:** Collect valid rows into an array during validation, then batch insert once per content type:
```ts
const validRows = [];
for (const row of rows) {
  if (!row.title?.trim()) { skipped++; continue; }
  validRows.push({ family_id: familyId, ... });
}
const { error } = await supabase.from("journal_entries").insert(validRows);
```
Note: error reporting becomes less granular (can't identify which row failed). Consider using `.upsert()` with `onConflict` or inserting in batches of 50 for a balance.

---

### D8 — One-line-a-day page fetches up to 5 years of entries unbounded (MEDIUM) ✅ FIXED

**File:** `app/dashboard/one-line/page.tsx:28-33`

**Impact:** Fetches ALL entries for the user within a 5-year window with no `.limit()`. A daily writer would accumulate ~1,825 entries. The entire set is loaded server-side, then filtered in JS for "on this day" and streak calculation. Payload grows ~0.5 KB/entry, so ~900 KB for a prolific user.

**Fix:** Split into targeted queries:
1. Today's entry: `.eq("entry_date", today).single()`
2. "On this day" entries: `.eq("entry_month", todayMonth).eq("entry_day", todayDay)` (requires adding month/day columns or using Postgres `EXTRACT`)
3. Recent 35 days for calendar: `.gte("entry_date", thirtyFiveDaysAgo).limit(35)`
4. Streak: compute via a lightweight RPC or fetch only `entry_date` column for the last 365 days

Alternative quick fix: keep the single query but add `.limit(1825)` as a safety cap, and only select `id, entry_date` (drop `content` for entries not shown on the page).

---

### D9 — Missing index on one_line_entries (user_id, entry_date) (LOW) ✅ FIXED

**File:** No index exists for the query pattern in `app/dashboard/one-line/page.tsx:28-33`

**Impact:** The one-line page queries `one_line_entries` filtered by `user_id` and sorted by `entry_date DESC`. Without a composite index, Postgres does a sequential scan + sort. Low impact today (few users, few entries) but will degrade as usage grows.

**Fix:** Add index in a migration:
```sql
CREATE INDEX IF NOT EXISTS idx_one_line_entries_user_date
  ON public.one_line_entries (user_id, entry_date DESC);
```

---

### D10 — Layout N+1 queries during signup cleanup (LOW) ✅ FIXED

**File:** `app/dashboard/layout.tsx:74-93`

**Impact:** When a user with pending invites first loads the dashboard, the layout loops over their memberships and issues 2 queries per membership (one for the family row, one for member count). This is N+1 but only fires once per user during signup with pending invites -- not on regular page loads. Very low real-world impact.

**Fix:** Batch both queries using `.in("id", familyIds)` before the loop. Low priority given the one-time nature.

---

### D11 — Member profile page two-step photo fetch (LOW) ✅ FIXED

**File:** `app/dashboard/members/[id]/page.tsx:47-68`

**Impact:** Fetches all journal entry IDs for a member, then uses `.in("entry_id", entryIds)` to get recent photos. Two sequential queries that could be combined. Low impact since the second query is `.limit(6)`.

**Fix:** Use Supabase relation syntax: `.select("..., journal_photos(...)").limit(6)` or accept the current approach given the final query is bounded.

---

## Frontend Findings

### F1 — MosaicBackground serves full-resolution photos with `unoptimized` (MEDIUM) ✅ FIXED

---

### F2 — No Supabase image transforms for thumbnails across the app (MEDIUM) ✅ FIXED

Shared `thumbUrl()` helper created in `src/lib/imageUrl.ts` and applied across all dashboard components. Member profile page (`members/[id]/page.tsx`) was the last remaining gap -- now uses `thumbUrl` for avatar and photo thumbnails.

---

### F3 — Member avatars use `<img>` without lazy-load in high-frequency component (LOW) ✅ FIXED

---

### F4 — Export route builds full ZIP in Vercel function memory (MEDIUM RISK)

**File:** `app/api/export/route.ts:593-620`

**Impact:** JSZip accumulates all family media in RAM before uploading to Supabase Storage. The existing 750 MB size check (line 164-176) mitigates the worst case. Current mitigation is adequate for typical family sizes. No immediate action required.

---

### F5 — JSZip statically imported in export API route (LOW) ✅ FIXED

**File:** `app/api/export/route.ts:5`

**Impact:** `import JSZip from "jszip"` is a static top-level import. JSZip (~30 KB gzipped) loads on every cold start of this serverless function, even though export is a rare, low-frequency operation.

**Fix:** Dynamic import at point of use:
```ts
const { default: JSZip } = await import("jszip");
const zip = new JSZip();
```
Minor cold-start improvement, low priority.

---

### F6 — Map pin SVG icons regenerated on every render (LOW-MEDIUM) ✅ FIXED

**File:** `app/dashboard/map/MapComponent.tsx:402-446`

**Impact:** `createPinSvgUrl()` (line 424) and `L.icon()` (line 425) are called inside the `.map()` render loop. Every filter toggle or map interaction regenerates all pin SVGs via `encodeURIComponent()`. For a family with 50+ locations, this creates 50+ data URIs on every render.

**Fix:** Memoize the pin icons with `useMemo`:
```ts
const pinData = useMemo(() =>
  clusterPins.map(({ locs, pos }) => {
    // ... existing icon generation logic
    return { locs, pos, icon };
  }),
  [clusterPins]
);
```
Also memoize the FitBounds positions array (line 400): `const positions = useMemo(() => clusterPins.map(c => c.pos), [clusterPins])`.

---

## Already Optimised ✅

The following items were checked and found to be well-implemented:

- **`user_family_ids()` is `STABLE`** (`025_multi_tenancy.sql:55`) -- Postgres calls it once per statement, not per row. The `IN (SELECT user_family_ids())` pattern in RLS policies is safe.
- **Global search is debounced 250ms** (`GlobalSearch.tsx`) -- no per-keystroke API calls.
- **JSZip is lazy-loaded in client** (`import/parsers.ts:167`) -- not in the initial client bundle.
- **Dashboard home page is paginated** -- uses `QUERY_LIMITS.dashboardPreview` (10 rows) for recent photos and other widgets.
- **MosaicBackground capped at 80 photos** -- `PHOTO_LIMITS.mosaicDisplayLimit` prevents unbounded fetch.
- **Journal secondary fetches use batch `.in()`** -- not N+1; one query for photos, one for videos, one for perspectives across all entries.
- **Events invitees use batch `.in()`** -- no N+1 on the events page.
- **Time-capsule sender lookup uses batch `.in()`** -- no N+1.
- **Export route has 750 MB OOM guard** (`route.ts:164-176`).
- **`next/image` used in MosaicBackground** -- correct component with optimization.
- **Specific column selection** -- most queries select only needed columns, not `SELECT *`.
- **Recipes preview limited to 50** -- `app/dashboard/recipes/page.tsx` has `.limit(50)`.
- **FamilyContext provider** -- receives props from Server Component, no client-side state management. Re-renders only on navigation. `useMemo` on the value object would be negligible.
- **Icon imports** -- lucide-react uses individual icon imports (tree-shakeable).
- **All RLS policies optimised** -- migration 083 converted nested `IN` subqueries to `EXISTS`.

---

## Fix Plan

All findings from the 2026-03-13 audit have been fixed. No open performance items remain.
