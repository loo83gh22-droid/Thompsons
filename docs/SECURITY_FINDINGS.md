# FamilyNest Security Findings

Last audited: 2026-03-07
Last resolved: 2026-03-07 (S11)

---

## Server-Side Findings

### S1 — Open Redirect in Auth Callback · ✅ FIXED 2026-03-05
**File:** `app/auth/callback/route.ts:71`
**Attack:** `next=//evil.com` bypassed `/`-prefix check; browsers follow protocol-relative URLs cross-origin.
**Fix applied:** `const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";`

### S2 — `send-welcome` Route Had No Rate Limiting · ✅ FIXED 2026-03-05
**File:** `app/api/emails/send-welcome/route.ts`
**Attack:** Authenticated user could spam endpoint in a loop, burning Resend quota.
**Fix applied:** Added `checkHttpRateLimit(request, strictLimiter)` as first statement.

### S3 — `family-name` PUT Had No Rate Limiting · ✅ FIXED 2026-03-05
**File:** `app/api/family-name/route.ts`
**Attack:** Authenticated owner could spam renames causing excessive `revalidatePath` work.
**Fix applied:** Added `checkHttpRateLimit(request, defaultLimiter)`.

### S4 — `stripe/portal` Had No Rate Limiting · ✅ FIXED 2026-03-05
**File:** `app/api/stripe/portal/route.ts`
**Attack:** Authenticated user could create many portal sessions, hitting Stripe API limits.
**Fix applied:** Added `checkHttpRateLimit(request, strictLimiter)`.

### S5 — `nest-keepers` Routes Had No Rate Limiting · ✅ FIXED 2026-03-05
**File:** `app/api/nest-keepers/route.ts`
**Attack:** Low risk (owner-gated), inconsistent with codebase standard.
**Fix applied:** Added `checkHttpRateLimit(request, defaultLimiter)` to all 4 handlers (GET, POST, PUT, DELETE).

### S6 — Storage Proxy Had No Bucket Allowlist · ✅ FIXED 2026-03-05
**File:** `app/api/storage/[...path]/route.ts`
**Attack:** Authenticated user could probe internal bucket names. RLS mitigated but no fast-fail.
**Fix applied:** Added `ALLOWED_BUCKETS` set with all 10 legitimate media buckets; unknown buckets return 404.

### S7 — Admin Guard Single-Layer If Proxy Misconfigured · ℹ️ INFORMATIONAL (stronger than assessed)
**File:** `app/admin/page.tsx:45-48`, `proxy.ts:56-61`
**Note:** Originally assessed as "proxy 404 + Server Component redirect." On re-audit, `proxy.ts`
actively enforces a hard 404 for all `/admin` and `/admin/*` paths unless the authenticated user's
email matches `ADMIN_NOTIFICATION_EMAIL` — this is a positive auth check at the Edge, not just a
redirect. Combined with the Server Component check, the admin route has two independent guards.
No code change needed. Ensure the `proxy.ts` matcher never excludes `/admin`.

### S8 — Notification Email Subject Used Raw `msg.title` · ✅ FIXED 2026-03-05
**File:** `app/api/notifications/route.ts:264`
**Attack:** MIME encoding injection via crafted title in email subject header.
**Fix applied:** Changed subject to use `safeTitle` (already HTML-escaped) instead of raw `msg.title`.

### S9 — `addFamilyMember` Server Action Missing Role Check · ✅ FIXED 2026-03-07
**File:** `app/dashboard/members/actions.ts`
**Attack:** Any authenticated family member — including `teen` and `child` roles — could call this
Server Action directly (bypassing UI RoleGate) to add new family members and trigger invite emails
to non-child accounts. The action checked authentication and family membership but not the caller's
role. By contrast, `updateFamilyMember` in the same file correctly enforced `owner`/`adult`,
confirming the pattern existed and was simply omitted here.
**Fix applied:** Added inline `owner`/`adult` role guard immediately after `activeFamilyId` check,
mirroring the pattern already present in `updateFamilyMember`.

### S10 — `resendInviteEmail` Server Action Missing Role Check · ✅ FIXED 2026-03-07
**File:** `app/dashboard/members/actions.ts`
**Attack:** Any authenticated family member could call `resendInviteEmail(memberId)` to re-send
invite emails to pending members, burning Resend API quota. The action only verified authentication
and family membership, not that the caller had invite permission.
**Fix applied:** Added the same inline `owner`/`adult` role guard immediately after the
`activeFamilyId` check.

### S11 — `middleware.ts` Absent from Project Root · ✅ ALREADY RESOLVED (via proxy.ts)
**File:** `proxy.ts`
**Note:** Next.js 16 replaces `middleware.ts` with `proxy.ts`. The project already had a fully
correct `proxy.ts` implementing: (1) Supabase session refresh via `supabase.auth.getUser()` with
proper `setAll` cookie wiring; (2) `/dashboard/*` → `/login` redirect for unauthenticated users,
preserving `?next=` path; (3) hard 404 for `/admin` unless the request user matches
`ADMIN_NOTIFICATION_EMAIL`. S11 was a false alarm caused by auditing for `middleware.ts` without
checking the Next.js 16 proxy equivalent. No code change needed.

---

## Client-Side Findings

### C1 — `dangerouslySetInnerHTML` on Public Pages · ✅ SAFE (no action)
**Files:** `app/page.tsx:151,157,163`, `app/pricing/page.tsx:128`
All uses inject hardcoded server-side JSON-LD constants. No user input in pipeline.

### C2 — Login Page Open Redirect (Protocol-Relative) · ✅ FIXED 2026-03-05
**File:** `app/login/page.tsx:61,109`
**Attack:** `next=//evil.com` passed `startsWith("/")` check.
**Fix applied:** Both redirect guards now also exclude `//` prefix.

### C3 — `localStorage` Usage · ✅ SAFE (no action)
All writes are UI state flags only (dismiss states, view preferences). No tokens or PII stored.

### C4 — `SUPABASE_SERVICE_ROLE_KEY` Client Exposure · ✅ SAFE (no action)
Only referenced in server-only files. No client component imports `admin.ts`.

### C5 — `STRIPE_SECRET_KEY` / `RESEND_API_KEY` Client Exposure · ✅ SAFE (no action)
All references are in Route Handlers or `"use server"` actions only.

---

## Confirmed Correct (2026-03-06 audit)

| Surface | Finding | Status |
|---|---|---|
| Stripe webhook body | `request.text()` + `constructEvent()` with raw body | ✅ Correct |
| Stripe webhook 400s | Returns 400 on signature failure | ✅ Correct |
| Cron auth | `Authorization: Bearer <CRON_SECRET>` check, not query param | ✅ Correct |
| Invite tokens | UUID v4 opaque tokens stored in DB; rate-limited (5/min) | ✅ Correct |
| Dashboard auth | `layout.tsx:26-30` — `getUser()` + redirect on every load | ✅ Correct |
| `updateFamilyMember` | Role check owner/adult at lines 318–326 | ✅ Correct |
| All API routes (20) | Every handler checks auth before touching data | ✅ Correct |
| Rate limiting coverage | All 8 key endpoints covered with `strictLimiter`/`defaultLimiter` | ✅ Correct |
| `dangerouslySetInnerHTML` | Hardcoded JSON-LD only; no user input path | ✅ Correct |
| Open redirect (callback) | `startsWith("/") && !startsWith("//")` guard | ✅ Correct |
| Open redirect (login) | Same guard at both redirect points | ✅ Correct |
| Service role key | Server-only files only; no client bundle exposure | ✅ Correct |
| `localStorage` | UI flags only; no PII, tokens, or auth data | ✅ Correct |
| Email HTML escaping | `esc()` applied to all user-supplied fields in templates | ✅ Correct |

---

## Status Summary

| ID | Severity | Status |
|---|---|---|
| S1 | High | ✅ FIXED 2026-03-05 |
| S2 | Medium | ✅ FIXED 2026-03-05 |
| S9 | Medium | ✅ FIXED 2026-03-07 |
| S10 | Medium | ✅ FIXED 2026-03-07 |
| C2 | Low | ✅ FIXED 2026-03-05 |
| S3 | Low | ✅ FIXED 2026-03-05 |
| S4 | Low | ✅ FIXED 2026-03-05 |
| S5 | Low | ✅ FIXED 2026-03-05 |
| S6 | Low | ✅ FIXED 2026-03-05 |
| S8 | Low | ✅ FIXED 2026-03-05 |
| S11 | Informational | ✅ Already resolved via proxy.ts (Next.js 16) |
| S7 | Informational | No action needed |
| C1 | Safe | No action needed |
| C3 | Safe | No action needed |
| C4 | Safe | No action needed |
| C5 | Safe | No action needed |
