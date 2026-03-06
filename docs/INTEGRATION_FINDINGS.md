# Integration Reliability Findings

Last audited: 2026-03-06

---

## Resilience Findings (R#)

### R1 — Rate limiter fails open when Upstash env vars are missing at startup
**File:** `src/lib/httpRateLimit.ts:18`
**Severity:** Medium
**Status:** ✅ FIXED (2026-03-06)

`makeLimiter()` returns `null` if `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are absent at module
initialization. `checkHttpRateLimit` returns `null` for a `null` limiter (line 41), meaning all requests pass
through with no rate limiting. This is intentional for local dev (documented in the file header), but if either
env var is accidentally unset in a Vercel environment, rate limiting silently disappears with no alert.

**Failure mode:** Invite token brute-force, unlimited checkout sessions, unrestricted export requests — all
without any 429 response.

**Recommended fix:** Add a startup warning when env vars are absent in non-development environments:
```ts
if (!url || !token) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[httpRateLimit] UPSTASH env vars missing — rate limiting is DISABLED');
  }
  return null;
}
```

---

### R2 — Rate limiter throws 500 if Upstash Redis is unreachable at runtime
**File:** `src/lib/httpRateLimit.ts:48`
**Severity:** Medium
**Status:** ✅ FIXED (2026-03-06)

`limiter.limit(ip)` uses the Upstash HTTP REST client. If Upstash becomes unreachable after module
initialization (e.g. network blip, Redis maintenance), `limit()` will throw an unhandled exception that
propagates up through `checkHttpRateLimit` to the route handler, causing a 500 response for all
rate-limited endpoints (`/api/invite`, `/api/stripe/checkout`, `/api/emails/send-welcome`, `/api/export`).

**Failure mode:** Any Upstash outage silently takes down all invite/checkout/export flows.

**Recommended fix:** Wrap the `limiter.limit()` call in a try/catch and fail open (log + allow through):
```ts
try {
  const { success, limit, remaining, reset } = await limiter.limit(ip);
  // ... existing logic
} catch (err) {
  console.error('[httpRateLimit] Redis unreachable, failing open:', err);
  return null; // allow request through
}
```

---

### R3 — Export ZIP has no file count or total-size guard
**File:** `app/api/export/route.ts:197–265`
**Severity:** Low
**Status:** ✅ FIXED (2026-03-06) — 750 MB guard added; returns 413 with contact-support message

The POST export builds the entire ZIP in memory (JSZip) with no cap on photo or video count. Individual files
are fetched from Supabase Storage with a 15 s timeout per file (good), and the ZIP is then uploaded to the
`exports` bucket rather than streamed in the HTTP response (good — avoids the Vercel 50 MB response limit).
However, a Legacy family near their full storage quota (e.g. hundreds of photos + videos) could exhaust
Vercel's 1 GB function memory limit during ZIP construction.

**Failure mode:** OOM crash for very large families; Vercel cold-kills the function and the export job is
left stuck in `processing` state with no error set.

**Recommended fix:**
1. Add a pre-check: if `family.storage_used_bytes > 500 MB`, warn and/or offload to a background job/Edge
   Function with higher memory.
2. On exception in the ZIP-build block, mark the export job as `failed` (currently the outer catch does
   update the job to `failed` — verify this always runs even on OOM).

---

### R4 — No retry mechanism for failed transactional emails
**File:** `app/api/notifications/route.ts` (all email sends)
**Severity:** Low
**Status:** ✅ FIXED (2026-03-06) — Birthday window extended to 3-4 days with email_campaigns dedup;
capsule unlock window extended to cover yesterday with dedup. Drip campaigns already self-retried via dedup.

Individual Resend failures are caught and appended to `results.errors[]`, then logged. No retry or
dead-letter queue exists. A Resend 5xx during a cron run permanently loses that email (birthday reminder,
drip campaign step, etc.) until the next scheduled run, which may be 24 hours later or may skip the window
entirely (e.g. the birthday-3-days check won't re-trigger the following day).

**Recommended fix:** For high-value transactional emails (birthday reminders, time-capsule unlocks), log
failures to a `failed_email_queue` table and retry on next cron run if the window hasn't passed.

---

## Security Findings (S#)

### S1 — Google Maps API key is client-exposed; referrer restriction status unknown
**File:** `app/components/LocationInput.tsx:64`, `app/dashboard/map/AddLocationForm.tsx`
**Severity:** Medium
**Status:** ✅ FIXED — GCP Console confirmed (2026-03-06). HTTP referrer restrictions active:
`*.familynest.io/*`, `familynest.io/*`, `localhost:3000/*`, `thompsons.vercel.app/*`.

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is embedded in client-side JS and used to call the Google Geocoding API
directly from the browser. This is the standard pattern for client-side Maps usage, but the key **must** be
restricted to specific HTTP referrers in Google Cloud Console to prevent quota theft and unexpected billing.

**Failure mode:** Unrestricted key allows any third party to use your geocoding quota. With no referrer
restriction, a leaked key (e.g. from devtools) can be abused indefinitely.

**Recommended fix:** In Google Cloud Console → APIs & Services → Credentials → your Maps API key:
- Set "Application restrictions" to "HTTP referrers"
- Add: `https://familynest.io/*`, `https://thompsons.vercel.app/*`, `http://localhost:3000/*`
- Restrict API to: Geocoding API, Maps JavaScript API (only what's used)

---

## ✅ Confirmed Correct (checked and passing)

- **Cron secret validation** (`notifications/route.ts:50–59`): `Authorization: Bearer <CRON_SECRET>`
  validated on every request. Returns 503 if CRON_SECRET is unset (not 200). No query-param fallback.

- **Stripe webhook signature** (`stripe/webhook/route.ts:217–227`): `!webhookSecret` guard returns 400 if
  env var is missing. `stripe.webhooks.constructEvent()` verifies signature unconditionally on every request.
  No conditional skip.

- **Stripe checkout scoped to authenticated user** (`stripe/checkout/route.ts:31–60`): `user_id` and
  `family_id` come from the Supabase auth session, not the request body. Webhook cross-checks the stored
  `stripe_customer_id` before activating any plan (`activatePlan` lines 27–43).

- **RESEND_API_KEY server-side only**: Not in any `NEXT_PUBLIC_` variable. Used only in API routes and
  Server Actions.

- **Export SSRF prevention** (`export/route.ts:37–58`): `fetchFile()` validates all URLs against an
  allowlist of Supabase storage hostnames (HTTPS only) before fetching.

- **Send-welcome authentication + deduplication** (`emails/send-welcome/route.ts:22–50`): Requires
  authenticated user, verifies family membership, deduplicates via `email_campaigns` table.

- **Upstash uses HTTP REST API**: `@upstash/redis` uses the HTTP REST client — correct for Vercel
  serverless (no persistent TCP connections).

- **Individual email sends for privacy** (`notifications/route.ts:626–635`, `739–750`): Storage addon
  reminder and enforcement emails sent one-at-a-time, not as a single `to[]` array. Prevents exposing
  family member emails to each other via Resend.

- **Map uses Leaflet (not Google Maps)**: `app/dashboard/map/page.tsx` uses `dynamic(() => import('./MapComponent'))` with a loading fallback. Google Maps key is used only for geocoding, not map rendering.
