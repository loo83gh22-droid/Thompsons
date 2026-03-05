# FamilyNest Error Handling & Observability Review

Conduct a **thorough, structured error handling audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — User-Facing Errors
*Do errors expose internals or leave users confused?*

Check each of the following:

### Stack Traces & Internal Details
- Do any Server Actions `catch` an error and return it directly (e.g., `return { error: err.message }` where `err` is a raw Supabase/Postgres error)? These can leak column names, table names, or constraint names to the client.
- Do any API route handlers return raw `error.message` from Supabase/Postgres in a JSON response? Check `app/api/` for `catch (err) { return NextResponse.json({ error: err.message }) }` patterns.
- Do any toast notifications (Sonner) display the raw error string from the server rather than a user-friendly message?

### Missing Error Boundaries
- Do the 28 dashboard feature module pages (`app/dashboard/*/page.tsx`) have React Error Boundaries, or does a thrown error in one module crash the entire dashboard layout?
- Are there `error.tsx` files co-located with dashboard modules to handle per-route errors gracefully?

### Empty & Fallback States
- Do loading/empty states exist for all data-fetching dashboard pages? Or do pages render blank/broken when a query returns 0 results?
- If a Server Action returns `{ error: "..." }`, does the calling component actually surface that error to the user — or silently do nothing?

---

## 2 — Silent Failures
*Do errors get swallowed without being logged or retried?*

Check each of the following:

### Email (Resend)
- Do the invite email send (`/api/send-invite`), welcome email (`/api/emails/send-welcome`), and daily notification email (`/api/notifications`) have `try/catch` blocks that handle Resend 4xx/5xx responses?
- If Resend returns an error, is it **logged** (not just caught-and-ignored) and does the API route return a meaningful error status code to the caller?
- Are there any `resend.emails.send(...)` calls with no `await` or no `.catch()`? (Fire-and-forget emails that silently fail.)

### Stripe
- Does the Stripe webhook handler (`/api/stripe/webhook`) have a catch block for `stripe.webhooks.constructEvent()` failures that returns a 400 — not a 500 or silent 200?
- If the DB update after a Stripe event fails, is the error logged so it can be manually reconciled?

### Storage
- If a Supabase Storage upload fails mid-way, does the Server Action clean up any partial state (e.g., avoid inserting a DB record pointing to a non-existent file)?
- If `decrement_storage_used` RPC fails after a file delete, is the failure logged anywhere?

### Vercel Cron
- Does the `/api/notifications` cron handler return a non-200 status code on failure, so Vercel logs it as a failed cron run rather than a silent success?
- Are any errors inside the cron handler caught-and-swallowed inside an inner `try/catch` that prevents the outer handler from knowing something went wrong?

### Unhandled Promise Rejections
- Are there any `async` functions in API routes or Server Actions that are called without `await` (creating unhandled promise rejections)?
- Check `app/api/` and `app/dashboard/*/actions.ts` for `someAsyncFn()` calls without `await`.

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files — focus on `app/api/`, `app/dashboard/*/actions.ts`, and error boundary / `error.tsx` files.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by User-Facing (U#) and Silent Failures (F#).
4. For each finding include:
   - **File and line** where the issue exists
   - **What data is exposed or what goes undetected** (the consequence)
   - **Recommended fix**
5. After listing all findings, **propose a fix plan** ordered by severity (Critical → High → Medium → Low).
6. Note anything that was checked and found to be **already correct** (to confirm coverage).

Before starting, read `docs/ERROR_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/ERROR_FINDINGS.md`: add new findings with their U#/F# codes, and mark anything you confirmed as resolved with ✅ FIXED.
