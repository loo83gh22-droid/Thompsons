# FamilyNest Security Findings

Last audited: 2026-03-05

---

## Server-Side Findings

### S1 — Open Redirect in Auth Callback · **High**
**File:** `app/auth/callback/route.ts:71`
**Attack:** Attacker crafts `https://familynest.io/auth/callback?code=<valid>&next=//evil.com` — `//evil.com` passes no `/`-prefix check and browsers follow it cross-origin.
**Fix:** `const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";`

### S2 — `send-welcome` Route Has No Rate Limiting · **Medium**
**File:** `app/api/emails/send-welcome/route.ts`
**Attack:** Authenticated user spams endpoint in a loop, burning Resend quota.
**Fix:** Add `checkHttpRateLimit(request, strictLimiter)` as first statement.

### S3 — `family-name` PUT Has No Rate Limiting · **Low**
**File:** `app/api/family-name/route.ts`
**Attack:** Authenticated owner spams renames causing excessive `revalidatePath` work.
**Fix:** Add `checkHttpRateLimit(request, defaultLimiter)`.

### S4 — `stripe/portal` Has No Rate Limiting · **Low**
**File:** `app/api/stripe/portal/route.ts`
**Attack:** Authenticated user creates many portal sessions, hitting Stripe API limits.
**Fix:** Add `checkHttpRateLimit(request, strictLimiter)`.

### S5 — `nest-keepers` Routes Have No Rate Limiting · **Low**
**File:** `app/api/nest-keepers/route.ts`
**Attack:** Low risk (owner-gated), but inconsistent with codebase standard.
**Fix:** Add `checkHttpRateLimit(request, defaultLimiter)` to all four handlers.

### S6 — Storage Proxy Has No Bucket Allowlist · **Low**
**File:** `app/api/storage/[...path]/route.ts:37-38`
**Attack:** Authenticated user guesses internal bucket names (e.g. `exports`) to probe objects. RLS mitigates but no fast-fail.
**Fix:** Define `ALLOWED_BUCKETS` set; return 400 if `bucket` not in set.

### S7 — Admin Guard Is Single-Layer If Proxy Misconfigured · **Low (Defense-in-Depth)**
**File:** `app/admin/page.tsx:45-48`
**Note:** Current layering is correct (proxy 404 + Server Component redirect). Ensure proxy matcher for `/admin` is never removed.

### S8 — Notification Email Subject Uses Raw `msg.title` · **Low**
**File:** `app/api/notifications/route.ts:264`
**Attack:** MIME encoding injection via crafted title in email subject header.
**Fix:** Use existing `safeTitle` variable in subject, or strip MIME encoding chars.

---

## Client-Side Findings

### C1 — `dangerouslySetInnerHTML` on Public Pages · ✅ SAFE (no action)
**Files:** `app/page.tsx:151,157,163`, `app/pricing/page.tsx:128`
All uses inject hardcoded server-side JSON-LD constants. No user input in pipeline.

### C2 — Login Page Open Redirect (Protocol-Relative) · **Low**
**File:** `app/login/page.tsx:61,109`
**Attack:** `next=//evil.com` passes `startsWith("/")` check. Lower severity than S1 because Next.js `router.push` doesn't follow cross-origin paths, but imprecise.
**Fix:** Change guard to `startsWith("/") && !startsWith("//")` at both lines.

### C3 — `localStorage` Usage · ✅ SAFE (no action)
All writes are UI state flags only (dismiss states, view preferences). No tokens or PII stored.

### C4 — `SUPABASE_SERVICE_ROLE_KEY` Client Exposure · ✅ SAFE (no action)
Only referenced in server-only files. No client component imports `admin.ts`.

### C5 — `STRIPE_SECRET_KEY` / `RESEND_API_KEY` Client Exposure · ✅ SAFE (no action)
All references are in Route Handlers or `"use server"` actions only.

---

## Fix Plan

| Priority | ID | File | Fix |
|---|---|---|---|
| 1 — High | S1 | `app/auth/callback/route.ts:71` | Validate `next` is not protocol-relative |
| 2 — Medium | S2 | `app/api/emails/send-welcome/route.ts` | Add `checkHttpRateLimit(request, strictLimiter)` |
| 3 — Low | C2 | `app/login/page.tsx:61,109` | Exclude `//` from redirect guard |
| 4 — Low | S3 | `app/api/family-name/route.ts` | Add `checkHttpRateLimit(request, defaultLimiter)` |
| 5 — Low | S4 | `app/api/stripe/portal/route.ts` | Add `checkHttpRateLimit(request, strictLimiter)` |
| 6 — Low | S5 | `app/api/nest-keepers/route.ts` | Add `checkHttpRateLimit` to all 4 handlers |
| 7 — Low | S6 | `app/api/storage/[...path]/route.ts` | Add bucket allowlist |
| 8 — Low | S8 | `app/api/notifications/route.ts:264` | Use `safeTitle` in subject line |
