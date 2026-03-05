# FamilyNest Performance Review

Conduct a **thorough, structured performance audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — Database Performance
*Are queries efficient, indexed, and avoiding unnecessary work?*

Check each of the following:

### N+1 Queries
- Do any Server Components or Server Actions loop over a list and issue a Supabase query inside the loop (classic N+1)? (e.g., fetching members then querying each member's photo separately.)
- Do any dashboard pages (`app/dashboard/*/page.tsx`) call multiple sequential Supabase queries that could be combined into one query with a join or `select('*, relation(*)')`?

### Over-fetching
- Are there any `supabase.from(...).select('*')` calls where only 2-3 columns are actually used by the component? Enumerate the columns to reduce payload.
- Do any list pages fetch all rows without pagination (`range()` or `limit()`)? Check journal, photos, voice memos, achievements, stories — large families could have hundreds of records.

### Missing Indexes
- Are the most frequently filtered columns indexed? Focus on: `family_id`, `member_id`, `author_id`, `created_at`, `unlock_date` (time capsules), `is_private`, `role` on the members table.
- Do any RLS policies use `auth.uid()` comparisons against unindexed columns, forcing full table scans on every authenticated query?
- Check `supabase/migrations/` for `CREATE INDEX` statements — are indexes present for join columns on large tables?

### RLS Policy Performance
- Do any RLS policies call functions (like `auth.uid()` or custom RPCs) in a way that's re-evaluated per-row rather than once per query? This is a common Supabase performance trap.
- Are any policies using `IN (SELECT ...)` subqueries that could be replaced with joins or `EXISTS`?

---

## 2 — Frontend Performance
*Does the app load quickly and avoid unnecessary re-renders?*

Check each of the following:

### Bundle Size
- Are there any large libraries imported globally that should be lazy-loaded? (e.g., `jszip`, `@googlemaps/js-api-loader`, charting libraries.)
- Do any dashboard pages import a heavy component at the top level that should use `next/dynamic` with `{ ssr: false }`?
- Are icon libraries (if used) imported as full packages rather than individual icons?

### Images
- Are all user-uploaded images in the dashboard served via `next/image` with explicit `width` and `height`? Or are raw `<img>` tags used?
- Are any images loaded at full resolution when a thumbnail would suffice?
- Does the photos module use Supabase image transforms (`?width=300&quality=75`) for thumbnails?

### Unnecessary Re-renders
- Do any Client Components declare state or effects that cause the entire component to re-render on every keystroke? (e.g., search inputs without debounce.)
- Are expensive computed values in render functions wrapped in `useMemo`?
- Do list components use stable `key` props — not array index — to avoid full list re-renders on update?

### Vercel Function Performance
- Does the `/api/export` endpoint load the entire family ZIP into memory, or does it stream? (Memory issue for large families.)
- Do any API routes import heavy Node.js modules that increase cold-start time?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files — focus on `app/dashboard/*/page.tsx`, `app/dashboard/*/actions.ts`, `app/api/`, and `supabase/migrations/` for index statements.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by Database (D#) and Frontend (F#).
4. For each finding include:
   - **File and line** where the issue exists
   - **Performance impact** (estimated, e.g., "adds 1 query per list item" or "loads 2 MB on initial render")
   - **Recommended fix** with the specific change needed
5. After listing all findings, **propose a fix plan** ordered by impact (highest improvement first).
6. Note anything that was checked and found to be **already optimised** (to confirm coverage).

Before starting, read `docs/PERFORMANCE_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/PERFORMANCE_FINDINGS.md`: add new findings with their D#/F# codes, and mark anything you confirmed as resolved with ✅ FIXED.
