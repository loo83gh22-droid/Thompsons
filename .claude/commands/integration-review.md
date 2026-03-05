# FamilyNest Integration Reliability Review

Conduct a **thorough, structured integration reliability audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — External Service Resilience
*Does the app degrade gracefully when integrations fail?*

Check each of the following:

### Resend (Email)
- Do all three email paths (invite at `/api/send-invite`, welcome at `/api/emails/send-welcome`, daily notifications at `/api/notifications`) have explicit error handling for Resend 4xx and 5xx responses?
- If Resend is down, does the invite flow fail gracefully with a user-facing error — or does the API return 500 with no message?
- Are there retry mechanisms or dead-letter queues for failed transactional emails, or does a single failure mean the email is permanently lost?

### Upstash Redis (Rate Limiting)
- Does the `checkHttpRateLimit` utility in `src/lib/httpRateLimit.ts` have a fallback when Upstash Redis is unreachable? (i.e., does it fail open — allowing the request — or fail closed — blocking all requests?)
- Is the Upstash Redis connection using the HTTP REST API (not a persistent TCP connection)? HTTP is the correct approach for Vercel serverless functions.
- Are Upstash environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) validated at startup, or does the app start silently and only fail at runtime?

### Google Maps
- If Google Maps fails to load (network error, quota exceeded, API key issue), does the map component render a fallback state rather than a blank or broken UI?
- Is the Google Maps API key restricted to specific HTTP referrers (`familynest.io`, `thompsons.vercel.app`) in the Google Cloud Console? (This is a configuration check — look in code for any `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` usage to confirm it's client-exposed and therefore needs referrer restriction.)

### JSZip (Export)
- Does the `/api/export` endpoint handle the case where a family has thousands of photos (> 100 MB total) without exhausting Vercel's 50 MB function response limit or running out of memory?
- Is there a file count or size limit enforced before building the ZIP?
- Does the export correctly handle Supabase Storage signed URL failures for individual files — i.e., does it skip the failed file and continue rather than crashing the whole export?

---

## 2 — Integration Security
*Are integrations configured securely?*

Check each of the following:

### Vercel Cron
- Does `/api/notifications` validate the `CRON_SECRET` (via `x-vercel-cron-secret` header or equivalent) before running? An unprotected cron endpoint can be triggered by anyone.
- Is `CRON_SECRET` set in Vercel environment variables, and is it a non-guessable random string (not `"secret"` or similar)?

### Stripe
- Is the Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) used to validate every incoming webhook — not just used in dev? Confirm it's not conditionally skipped in production.
- Does the checkout session creation in `/api/stripe/checkout` scope the `client_reference_id` or `metadata` to the authenticated user's ID, preventing one user from claiming another's checkout session?

### Resend API Key Scope
- Is the Resend API key referenced **only** in server-side files (API routes, Server Actions)? Check that `RESEND_API_KEY` is never in a `NEXT_PUBLIC_` variable and never imported in any `app/` Client Component.
- Is the Resend API key scoped to send-only — i.e., does it have the minimum permissions required?

### Google Maps API Key Exposure
- Is the Google Maps API key used via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-exposed)? If yes, is it restricted to HTTP referrers in Google Cloud Console to prevent quota theft?
- Are there any other `NEXT_PUBLIC_` environment variables that contain secrets rather than public configuration?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files — focus on `app/api/`, `src/lib/httpRateLimit.ts`, `app/dashboard/map/`, and any files referencing `RESEND_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by Resilience (R#) and Security (S#).
4. For each finding include:
   - **Integration name** and file+line
   - **Failure mode** (what goes wrong and under what condition)
   - **Recommended fix**
5. After listing all findings, **propose a fix plan** ordered by severity (Critical → High → Medium → Low).
6. Note anything that was checked and found to be **already correct** (to confirm coverage).

Before starting, read `docs/INTEGRATION_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/INTEGRATION_FINDINGS.md`: add new findings with their R#/S# codes, and mark anything you confirmed as resolved with ✅ FIXED.
