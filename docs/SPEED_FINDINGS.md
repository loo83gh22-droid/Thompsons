# FamilyNest Speed Findings

Last audit: 2026-03-09

---

## Page Load Speed (P#)

### P1 — ✅ FIXED Dashboard layout waterfall: 6+ sequential queries (HIGH)

**File:** `app/dashboard/layout.tsx:34–208`

**Fix applied:** Wrapped role, plan-type, member count, and journal count queries in `Promise.all()`. ~40% faster layout load.

---

### P2 — ✅ FIXED Events page sequential + nested waterfall (MEDIUM)

**File:** `app/dashboard/events/page.tsx`

**Fix applied:** Members and events queries now run in parallel via `Promise.all()`.

---

### P3 — ✅ FIXED Recipes page: 3 sequential independent queries (MEDIUM)

**File:** `app/dashboard/recipes/page.tsx`

**Fix applied:** All three queries (recipes, members, journal photos) now run in parallel via `Promise.all()`.

---

### P4 — ✅ FIXED Bucket list page: 5 sequential queries (MEDIUM)

**File:** `app/dashboard/bucket-list/page.tsx`

**Fix applied:** Current member, all members, and items queries now run in parallel via `Promise.all()`.

---

### P5 — No Suspense boundaries on data-heavy dashboard pages (HIGH)

**Files:** All `app/dashboard/*/page.tsx`

**User impact:** Every dashboard page blocks on ALL queries completing before rendering anything. The main dashboard page runs 12 parallel queries (good!) but still shows nothing until all 12 return. A slow single query (e.g., the activity join) blocks the entire page.

**Estimated improvement:** Users see content 1–2s sooner with progressive rendering.

**Recommended fix:** Wrap below-the-fold sections (activity feed, "on this day", streak) in `<Suspense>` with skeleton fallbacks. Let the stat cards render first.

---

### P6 — Public pages rendered dynamically on every request (LOW)

**Files:**
- `app/page.tsx` (homepage)
- `app/pricing/page.tsx`
- `app/blog/page.tsx`

**User impact:** Homepage, pricing, and blog index are fully static content but regenerated on every request. First-time visitors experience server-side render latency instead of instant CDN cache hit.

**Estimated improvement:** Eliminates ~200–500ms TTFB for public pages.

**Recommended fix:** Add `export const revalidate = 3600;` (1 hour) to homepage and pricing. Blog already has `generateStaticParams()` on individual posts (good) but the index page is dynamic.

---

### P7 — ✅ FIXED Journal new page uses `window.location.href` hard redirect (MEDIUM)

**File:** `app/dashboard/journal/new/page.tsx`

**Fix applied:** Replaced `window.location.href` with `router.push()` for smooth client-side navigation.

---

## Upload & Media Speed (U#)

### U1 — ✅ FIXED No upload progress indicators (HIGH)

**Files:** All upload forms (ArtworkForm, AwardForm, TrophyForm, AddPetForm, EditPetForm, journal new page)

**Fix applied:** Added `uploadProgress` state showing "Compressing…" and "Uploading… X/Y" messages on the submit button across all 6 upload forms.

---

### U2 — ✅ FIXED No client-side image compression before upload (HIGH)

**Files:** All upload forms + new shared utility `src/lib/compressImage.ts`

**Fix applied:** Added `browser-image-compression` library. Created shared `compressImages()` utility that compresses images >500KB to max 1MB/1920px. Applied to all 6 upload forms.

---

### U3 — ✅ FIXED All gallery images use `unoptimized` flag (HIGH)

**Files:** ArtworkForm, EditPetForm, AwardForm, TrophyForm

**Fix applied:** Removed `unoptimized` prop from `<Image>` components so Next.js image optimization is enabled (serves WebP, resized).

---

### U4 — No per-file error handling on upload failure (MEDIUM)

**Files:**
- `app/dashboard/artwork/[memberId]/ArtworkForm.tsx:130` — `console.error` only
- `app/dashboard/journal/new/page.tsx:127` — silent continue

**User impact:** If 1 of 5 photos fails to upload, the user doesn't know which one failed. The error is only logged to console. The entry may be saved with missing photos.

**Estimated improvement:** Users can retry individual failed uploads instead of re-doing the entire form.

**Recommended fix:** Track per-file upload status. Show failed files with a retry button. Only proceed with server action when all files succeed or user explicitly skips failures.

---

### U5 — No photo file size validation before upload (LOW)

**Files:** `app/components/PhotoUpload.tsx` — video size validated (lines 232–241), photo size NOT validated

**User impact:** A user could select a 50 MB RAW photo file. The upload would proceed, likely time out, and fail with a generic error.

**Estimated improvement:** Instant feedback prevents wasted upload time.

**Recommended fix:** Add photo file size validation matching the server limits. Show "Photo too large — max 10 MB" immediately on selection.

---

## Perceived Performance (X#)

### X1 — Skeleton components defined but rarely used (MEDIUM)

**Files:**
- `app/components/ui/skeletons.tsx` — defines SkeletonCard, SkeletonTimeline, SkeletonPhotoGrid, etc.
- `app/dashboard/*/page.tsx` — none import or use these skeletons

**User impact:** Data-heavy pages (journal, stories, photos, achievements) show blank areas that suddenly fill in. No visual indication that content is loading within a page section.

**Estimated improvement:** Improves perceived load time significantly. Users see structure immediately.

**Recommended fix:** Use existing skeleton components as Suspense fallbacks:
```tsx
<Suspense fallback={<SkeletonCardList count={3} />}>
  <JournalEntries />
</Suspense>
```

---

### X2 — No optimistic updates on list operations (LOW)

**Files:** All `actions.ts` files — mutations use `revalidatePath()` (good) but no optimistic UI pattern.

**User impact:** After deleting an item, users wait 0.5–1s for the server round-trip before the item disappears from the list. Minor friction but noticeable.

**Estimated improvement:** Items appear/disappear instantly.

**Recommended fix:** Use React 19's `useOptimistic` hook for delete/toggle operations on lists.

---

### X3 — No "load more" indicators on paginated lists (LOW)

**Files:** Journal, stories, voice memos pages — all have `.limit()` but no pagination UI.

**User impact:** Users see only the first 50 items with no indication that more exist. No "Load More" button or infinite scroll.

**Estimated improvement:** Users discover older content. Prevents confusion about "missing" entries.

**Recommended fix:** Add cursor-based pagination with a "Load More" button at the bottom of lists.

---

## Network & Caching (N#)

### N1 — No server-side query caching (MEDIUM)

**Files:** All `page.tsx` and `actions.ts` — no `unstable_cache()` or fetch cache usage anywhere.

**User impact:** Every page navigation re-queries Supabase for the same data, even if it hasn't changed. Dashboard layout runs 6+ queries on every route change within the dashboard.

**Estimated improvement:** Cuts redundant Supabase round-trips by 50–70% for repeat navigations.

**Recommended fix:** Wrap frequently-read, rarely-changed queries (member list, family plan, role) in `unstable_cache()` with appropriate tags:
```ts
const getMembers = unstable_cache(
  async (familyId) => supabase.from("family_members")...,
  ['family-members'],
  { revalidate: 60, tags: [`family-${familyId}`] }
);
```

---

### N2 — BirthdayPrompt makes server calls on every dashboard navigation (MEDIUM)

**File:** `app/dashboard/BirthdayPrompt.tsx:14–49`

**User impact:** Every time the user switches between dashboard tabs, `checkRecentBirthdays()` and `checkRecentHolidays()` run as server actions. These queries hit the database on every navigation.

**Estimated improvement:** Eliminates 2 unnecessary server calls per dashboard navigation.

**Recommended fix:** Cache birthday/holiday data in the layout and pass as props, or use `unstable_cache()` with a 1-hour revalidation.

---

### N3 — 5 Google fonts loaded (LOW)

**File:** `app/layout.tsx:17–49`

**User impact:** 5 separate font files downloaded: Inter, DM Sans, DM Serif Display, Cormorant Garamond, Bangers. Each is a separate HTTP request and adds to total page weight.

**Estimated improvement:** Reducing to 2–3 fonts saves ~100–200 KB and 2–3 HTTP requests.

**Recommended fix:** Audit which fonts are actually used. Consider consolidating to Inter (body) + DM Serif Display (headings) + Bangers (accent). Remove unused fonts.

---

### N4 — Heavy dependencies not code-split (MEDIUM)

**Dependencies from `package.json`:**
- `@react-google-maps/api` (~150 KB) — used only on map page
- `jszip` (~200 KB) — already lazy-loaded ✅
- `openai` (~100 KB) — used only in AI features
- `stripe` / `@stripe/stripe-js` (~120 KB combined) — used only on checkout

**User impact:** If these are bundled into the main dashboard chunk, users download ~370 KB of unused JavaScript on every page.

**Estimated improvement:** 200–400 KB reduction in initial JS bundle for non-map/non-checkout pages.

**Recommended fix:** Verify these are tree-shaken or dynamically imported. Use `next/dynamic` for map components (already done ✅). Verify Stripe and OpenAI are only imported in their respective routes.

---

## Infrastructure & Deployment (I#)

### I1 — ✅ FIXED Marketing images without explicit dimensions (CLS) (HIGH)

**File:** `app/components/home/FeaturesBento.tsx`

**Fix applied:** Added explicit `width`/`height` attributes to `<img>` tags to prevent CLS.

---

### I2 — Export API builds full ZIP in memory (MEDIUM RISK)

**File:** `app/api/export/route.ts:593–620`

**User impact:** Families approaching the 750 MB guard limit may hit Vercel's 1 GB function memory limit, causing the export to fail with a 500 error.

**Estimated improvement:** Prevents export failures for large families.

**Recommended fix:** Already has a 750 MB guard (line 164). Monitor Vercel function memory metrics. Long-term, consider streaming ZIP generation or offloading to a background job.

**Note:** Also flagged in PERFORMANCE_FINDINGS.md as F4. No regression — still a known risk.

---

### I3 — Search API uses `ilike` without full-text indexes (MEDIUM)

**File:** `app/api/search/route.ts:50–116`

**User impact:** 8 parallel `ilike` pattern searches across all content tables. As data grows, search response time increases linearly. Users may experience 2–5s search latency with large families.

**Estimated improvement:** Full-text search indexes reduce search latency to sub-100ms regardless of data size.

**Recommended fix:** Add PostgreSQL `tsvector` columns and GIN indexes for searchable text columns. Use `to_tsquery()` instead of `ilike`. This is a larger effort — consider for a future sprint.

---

### I4 — No font preloading for hero text (LOW)

**File:** `app/layout.tsx:6–49`

**User impact:** Hero headings using DM Serif Display may flash in the fallback font before the custom font loads (FOUT). `display: "swap"` is correct but a `<link rel="preload">` would eliminate the flash.

**Estimated improvement:** Eliminates font swap flash on first load.

**Recommended fix:** `next/font` handles this automatically in most cases. Verify in Vercel Speed Insights that font loading isn't flagged.

---

## Already Fast ✅

The following items were checked and found to be well-implemented:

- **Client-side parallel file uploads** — All upload forms use `Promise.all()` for simultaneous uploads. Recently refactored (branch `fix/parallel-uploads`).
- **Dashboard main page uses `Promise.all()`** — 12 queries run in parallel (lines 49–78).
- **Search debounced at 250ms** — `GlobalSearch.tsx` uses proper debounce pattern.
- **Location input debounced** — `LocationInput.tsx` and `AddLocationForm.tsx` use debounce.
- **`useTransition` for form submissions** — 18+ form components use `isPending` state for button loading indicators.
- **File previews shown instantly** — `PhotoUpload.tsx` uses `URL.createObjectURL()` for immediate thumbnail display before upload.
- **Map component lazy-loaded** — `dynamic(() => import("./MapComponent"), { ssr: false })`.
- **JSZip lazy-loaded** — Only imported on the import page.
- **Blog posts use `generateStaticParams()`** — Individual blog pages are statically generated.
- **Supabase preconnect configured** — `<link rel="preconnect">` in layout.tsx.
- **Vercel Analytics + Speed Insights** — Both configured and reporting real Web Vitals.
- **Font swap strategy** — All fonts use `display: "swap"` via `next/font`.
- **Storage proxy caches 1 hour** — `Cache-Control: private, max-age=3600` on image proxy.
- **Specific column selection** — Most queries select only needed columns, not `SELECT *`.
- **Query limits on dashboard** — Dashboard preview widgets capped at 10 rows.

---

## Fix Plan (ordered by user impact)

| Priority | Finding | Effort | Expected User Impact |
|---|---|---|---|
| 1 | **U2** — Add client-side image compression before upload | Medium | Uploads 5–10x faster on slow connections |
| 2 | **U1** — Add upload progress indicators | Medium | Eliminates "is it frozen?" anxiety during uploads |
| 3 | **U3** — Remove `unoptimized` from gallery images / add Supabase transforms | Low | Gallery pages load 80–90% less image data |
| 4 | **P5** — Add Suspense boundaries to dashboard pages | Medium | Users see content 1–2s sooner |
| 5 | **P1** — Parallelize dashboard layout queries | Medium | Every dashboard page loads 0.5–1s faster |
| 6 | **I1** — Fix CLS on homepage marketing images | Low | Eliminates layout shift for first-time visitors |
| 7 | **N1** — Add server-side query caching | Medium | 50–70% fewer redundant Supabase queries |
| 8 | **P7** — Replace hard redirect after journal save | Trivial | Smooth transition instead of white-flash reload |
| 9 | **X1** — Wire up existing skeleton components | Low | Better perceived loading experience |
| 10 | **P6** — Add ISR to public pages | Trivial | Instant CDN hits for homepage/pricing |
| 11 | **N2** — Cache birthday prompt data | Low | 2 fewer server calls per dashboard navigation |
| 12 | **P2/P3/P4** — Parallelize events/recipes/bucket-list queries | Low | ~0.5s per page |
| 13 | **U4** — Per-file upload error handling | Medium | Users can retry individual failed files |
| 14 | **I3** — Full-text search indexes | High | Sub-100ms search at scale |
| 15 | **N4** — Verify bundle code-splitting | Low | Smaller initial JS download |
| 16 | **X3** — Add pagination UI to lists | Medium | Users discover older content |
| 17 | **N3** — Consolidate fonts | Low | 2–3 fewer HTTP requests |
| 18 | **U5** — Photo file size validation | Trivial | Instant rejection of oversized files |
