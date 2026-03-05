# FamilyNest Security Review

Conduct a **thorough, structured security audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — Server-Side Security
*Can an attacker manipulate or extract data via the backend?*

Check each of the following:

### Injection & Input Handling
- Are there any raw SQL queries built with string concatenation? (Look for template literals or `+ ` in Supabase RPC/rpc calls.)
- Do any API routes accept user-supplied URLs and fetch them server-side? (SSRF risk — look for `fetch(req.body.url)` patterns.)
- Is user input sanitised before being used in dynamic queries or file paths?

### Authentication & Authorization
- Do all 14 API routes in `app/api/` call `supabase.auth.getUser()` or validate a session before touching data?
- Does `/api/notifications` (Vercel cron) validate the `x-vercel-cron-secret` header?
- Does `/api/invite` (GET) resist token enumeration? (UUIDs only, no sequential IDs, no timing oracles.)
- Is the Supabase **service-role key** referenced anywhere in `app/` or `src/` client-side code? (It should only appear in server-side files and `.env.local`.)

### Stripe & Webhooks
- Does `/api/stripe/webhook` call `stripe.webhooks.constructEvent()` with the raw body and `STRIPE_WEBHOOK_SECRET`? (Not just JSON-parsed body.)
- Does the webhook handler return a 400 for invalid signatures rather than silently ignoring them?
- Are idempotency keys used when creating Stripe Checkout sessions?

### Rate Limiting
- Do `/api/auth/signup`, `/api/send-invite`, `/api/contact`, and `/api/export` all have rate limiting via `checkHttpRateLimit`?
- Are any public-facing POST endpoints missing both authentication AND rate limiting simultaneously?

---

## 2 — Client-Side Security
*Can an attacker exploit the browser-side of the app?*

### XSS
- Are there any uses of `dangerouslySetInnerHTML` in dashboard components? If so, is the content sanitised with DOMPurify or equivalent?
- Do any server-rendered strings from user input get injected into `<script>` tags or `href="javascript:..."` attributes?

### Auth Redirects
- Does the post-login redirect (`next` / `redirect` query param) validate that the destination is a relative path only? (Open redirect risk.)
- Does middleware/proxy restrict redirect targets to the same origin?

### Secrets in Client Bundles
- Do any `app/` or `src/lib/` files import `process.env.SUPABASE_SERVICE_ROLE_KEY` or `process.env.STRIPE_SECRET_KEY` in a way that would be included in the client bundle?
- Run a conceptual bundle trace: do any Server Actions accidentally `import` a file that re-exports secret env vars?

### Sensitive Data Storage
- Is any sensitive data (auth tokens, family IDs beyond what Supabase sets) stored in `localStorage` rather than HTTP-only cookies?
- Are any API responses that include PII (email, birth date) cached in ways accessible to other browser tabs or extensions?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by Server-Side (S#) and Client-Side (C#).
4. For each finding include:
   - **File and line** where the issue exists
   - **What the attack is** (who does what, what they gain)
   - **Recommended fix**
5. After listing all findings, **propose a fix plan** ordered by severity (Critical → High → Medium → Low).
6. Note anything that was checked and found to be **already correct** (to confirm coverage).

Before starting, read `docs/SECURITY_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/SECURITY_FINDINGS.md`: add new findings with their S#/C# codes, and mark anything you confirmed as resolved with ✅ FIXED.
