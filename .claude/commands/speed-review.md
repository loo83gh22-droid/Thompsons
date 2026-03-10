# FamilyNest Speed Review

Conduct a **thorough, structured speed audit** of the FamilyNest codebase (familynest.io) focused on real-world page load times and upload responsiveness. Users must never feel like they're waiting — pages should feel instant, uploads should show immediate progress, and interactions should never block the UI.

---

## 1 — Page Load Speed
*Do pages load fast enough that users never see a blank screen or spinner for more than a moment?*

Check each of the following:

### Server Component Waterfalls
- Do any dashboard pages (`app/dashboard/*/page.tsx`) await multiple sequential Supabase queries that could run in parallel with `Promise.all()`?
- Are there nested `await` calls where a parent component fetches data, then passes IDs to child components that fetch more data — creating a request waterfall?
- Do any pages fetch data that isn't used above the fold? Could secondary data be deferred to a client-side fetch after initial render?

### Streaming & Suspense
- Are slow-loading sections of pages wrapped in `<Suspense>` with meaningful fallbacks so the shell renders immediately?
- Do any pages block entirely on a single slow query (e.g., aggregation, full-table count) instead of streaming the result in?
- Are loading states (`loading.tsx`) present for all dashboard sub-routes, or do some routes show a blank screen during navigation?

### Static vs Dynamic
- Are any pages that could be statically generated (e.g., `/pricing`, `/about`, public marketing pages) being rendered dynamically on every request?
- Do any Server Components use `cookies()` or `headers()` unnecessarily, forcing the entire route to be dynamic?
- Are `generateStaticParams` and ISR (`revalidate`) used where appropriate for semi-static content?

### Client-Side Navigation
- Does the app use `<Link>` from `next/link` for all internal navigation, or are there raw `<a>` tags or `window.location` assignments causing full page reloads?
- Are route prefetches working — does hovering over nav links trigger prefetch, or is prefetching disabled?
- Do any navigation actions (e.g., form submissions via Server Actions) redirect without `revalidatePath()`, causing stale data on the destination page?

---

## 2 — Upload & Media Speed
*Do file uploads feel instant and responsive, with clear progress feedback?*

Check each of the following:

### Upload Architecture
- Are file uploads happening client-side directly to Supabase Storage, or are they routing through a Server Action / API route (doubling the transfer)?
- Do uploads happen in parallel when multiple files are selected, or are they sequential?
- Is there a file size limit enforced client-side before upload begins, preventing users from waiting for a large upload only to have it fail?
- Are uploads resumable, or does a network interruption mean starting over?

### Upload UX
- Do all upload forms show a progress bar or percentage during upload, or does the user see only a spinner with no indication of progress?
- Is there immediate visual feedback when a file is selected (e.g., thumbnail preview) before the upload completes?
- Can users continue interacting with the page while uploads happen in the background, or does the UI block?
- Do upload errors show clear, actionable messages (e.g., "File too large — max 10 MB") or generic failures?

### Image Optimization
- Are uploaded images compressed or resized client-side before upload (e.g., using Canvas API or a library like `browser-image-compression`)?
- Are thumbnails generated on upload (or served via Supabase transforms) so list views don't load full-resolution images?
- Do photo gallery pages use lazy loading (`loading="lazy"` or Intersection Observer) so only visible images load initially?
- Are image formats optimized — does the app serve WebP/AVIF via `next/image`, or are raw PNGs/JPEGs served?

---

## 3 — Perceived Performance
*Does the app feel fast even when operations take time?*

Check each of the following:

### Optimistic Updates
- Do create/edit/delete actions update the UI immediately (optimistic update) and then reconcile with the server, or does the UI wait for the server round-trip before showing changes?
- Do form submissions show inline loading states on the submit button, or does the user wonder if their click registered?
- After saving a record, does the user see the result immediately or wait for a full page reload?

### Skeleton Screens & Loading States
- Do data-heavy pages (photos, journal, achievements) show skeleton placeholders while loading, or do they show a blank area that suddenly fills in?
- Are loading indicators placed close to the content they represent (inline), or is there only a global spinner?
- Do infinite scroll or paginated lists show a loading indicator at the bottom when fetching the next page?

### Debouncing & Throttling
- Are search inputs debounced (300-500ms) so they don't fire a query on every keystroke?
- Are scroll event handlers throttled to avoid janky scrolling?
- Do any real-time features (e.g., collaborative editing, live updates) poll at reasonable intervals, or do they hammer the server?

---

## 4 — Network & Caching
*Is the app making the fewest possible network requests and caching what it can?*

Check each of the following:

### API & Data Caching
- Are Supabase queries in Server Components using Next.js fetch caching / `unstable_cache`, or do they re-run on every request?
- Do any Client Components refetch data on every mount that could be cached (e.g., family member list, user profile)?
- Are static assets (fonts, icons, logos) served with long cache headers via Vercel's CDN?

### Redundant Requests
- Do any pages make the same Supabase query in multiple components (e.g., fetching family members in both the sidebar and the main content)?
- Does navigating between dashboard tabs re-fetch data that was already loaded and hasn't changed?
- Are there any polling patterns that could be replaced with Supabase Realtime subscriptions?

### Bundle & Asset Loading
- Is code splitting working — are dashboard modules loaded only when navigated to, or is the entire dashboard in one bundle?
- Are third-party scripts (analytics, maps, embeds) loaded with `async` or `defer`, or do they block the main thread?
- Are fonts loaded with `next/font` to avoid FOIT/FOUT, or are they loaded via external CSS causing layout shift?
- What is the approximate JS bundle size for the main dashboard shell? Is it under 200 KB gzipped?

---

## 5 — Infrastructure & Deployment Speed
*Is the hosting and build configuration optimized for speed?*

Check each of the following:

### Vercel Configuration
- Are Vercel Edge Functions used for any latency-sensitive routes, or is everything running in serverless Node.js?
- Is the Vercel deployment region close to the primary user base?
- Are any API routes timing out due to long-running operations that should be moved to background jobs?

### Supabase Configuration
- Is connection pooling enabled and configured properly for the expected concurrent user count?
- Are Supabase Storage CDN URLs used for serving images, or are images proxied through a custom API route?
- Are any Supabase RPC calls doing expensive computation that should be cached or pre-computed?

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint):** Target < 2.5s. Is the largest element on each key page (hero image, main content block) optimized for fast render?
- **FID/INP (Interaction to Next Paint):** Target < 200ms. Are there any long tasks (>50ms) blocking the main thread during page load?
- **CLS (Cumulative Layout Shift):** Target < 0.1. Do images, ads, or dynamically loaded content cause visible layout shifts?
- Verify that `next/image` components have explicit dimensions to prevent CLS.
- Check that web fonts don't cause text reflow on load.

---

## Audit Instructions

1. Use the **Explore agent** (very thorough mode) to scan all relevant files — focus on `app/dashboard/*/page.tsx`, `app/dashboard/*/actions.ts`, `app/dashboard/**/components/`, `app/api/`, `app/components/`, `next.config.ts`, and `middleware.ts`.
2. For each surface area above, read the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by:
   - **P#** — Page Load Speed
   - **U#** — Upload & Media Speed
   - **X#** — Perceived Performance (UX)
   - **N#** — Network & Caching
   - **I#** — Infrastructure & Deployment
4. For each finding include:
   - **File and line** where the issue exists
   - **User impact** (describe what the user experiences — e.g., "3-second blank screen on journal page load" or "no progress indicator during photo upload")
   - **Estimated improvement** (e.g., "reduces page load by ~1s" or "eliminates perceived wait on save")
   - **Recommended fix** with the specific code change needed
5. After listing all findings, **propose a fix plan** ordered by user impact (biggest perceived speed improvement first).
6. Note anything that was checked and found to be **already fast** (to confirm coverage).

Before starting, read `docs/SPEED_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/SPEED_FINDINGS.md`: add new findings with their codes, and mark anything you confirmed as resolved with ✅ FIXED.
