# FamilyNest Security Findings

Last audited: 2026-03-26
Last resolved: 2026-03-26 (S14)
Re-audit: 2026-03-12 -- all S1-S11 and C1-C5 re-verified, zero new findings
Re-audit: 2026-03-20 -- new code audited (pricing overhaul, account deletion, onboarding, dashboard redesign), zero new findings
Re-audit: 2026-03-26 -- new code audited (family motto, gratitude board, gift exchange, family media); 3 new findings (S12-S14) found and fixed same session

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

### S12 — `postGratitude` Accepted Client-Supplied `memberId` · ✅ FIXED 2026-03-26
**File:** `app/dashboard/gratitude-board/actions.ts:7`
**Attack:** Any family member could call `postGratitude(content, victimMemberId)` from the browser console and post gratitude messages attributed to another family member (e.g., a teen impersonating a parent). The RLS INSERT policy only checked `family_id`, not `member_id` ownership.
**Fix applied:** Removed `memberId` param from the Server Action entirely. Member ID is now looked up server-side via `auth.uid()` → `family_members.id`. Also added a tighter RLS INSERT policy (`20260326000001_tighten_motto_gratitude_rls.sql`) requiring `member_id` to match the caller's own `family_members.id`.

### S13 — `savePersonalNote` Accepted Client-Supplied `memberId` · ✅ FIXED 2026-03-26
**File:** `app/dashboard/family-motto/actions.ts:72`
**Attack:** Any family member could call `savePersonalNote(victimMemberId, text)` to overwrite another family member's personal motto note. The RLS UPDATE policy only checked `family_id`.
**Fix applied:** Removed `memberId` param from the Server Action. Member ID derived server-side. Tighter RLS UPDATE policy added requiring `family_member_id` to match the caller's own member record.

### S14 — `deleteGratitude` Missing Ownership Check · ✅ FIXED 2026-03-26
**File:** `app/dashboard/gratitude-board/actions.ts:32`
**Attack:** Any family member (including `teen`/`child`) could delete any other family member's gratitude post by calling the Server Action directly, bypassing the UI which only shows delete on the user's own posts.
**Fix applied:** Server Action now looks up caller's `role` server-side. Owner/adult roles may delete any post; teen/child roles are restricted to their own posts via `.eq("member_id", member.id)`. Same logic enforced at the DB layer via updated RLS DELETE policy.

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

## Confirmed Correct (2026-03-12 re-audit)

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
| SSRF in `/api/export` | Allowlist (`ALLOWED_STORAGE_HOSTS`) + HTTPS-only + 15s timeout | ✅ Correct |
| SQL injection | All queries use Supabase parameterized client (`.eq()`, `.ilike()`) | ✅ Correct |
| Path traversal (storage) | UUID filenames + bucket allowlist + RLS scoping | ✅ Correct |
| Signed URL duration | Storage proxy: 60s; export downloads: 300s | ✅ Correct |
| CSP headers | Comprehensive policy in `next.config.ts` incl. `object-src 'none'` | ✅ Correct |
| X-Frame-Options | `DENY` -- prevents clickjacking | ✅ Correct |
| HSTS | `max-age=63072000` (2 years) | ✅ Correct |
| SafeMarkdown | `rehype-sanitize` with default schema on all user markdown | ✅ Correct |
| Server actions auth | All 26 member actions + 13 journal actions check auth + role | ✅ Correct |
| Zod validation | `createJournalEntrySchema` validates input before DB insert | ✅ Correct |
| Storage quota | `enforceStorageLimit()` called before uploads, rollback on failure | ✅ Correct |
| Share pages | Token + `is_public` double-check; content rendered as plain text | ✅ Correct |
| Kid access links | Token lookup + expiry check; expired links return 404 | ✅ Correct |
| No `eval()`/`new Function()` | Zero occurrences in codebase | ✅ Correct |

---

## Confirmed Correct (2026-03-20 re-audit — new code)

| Surface | Finding | Status |
|---|---|---|
| Account deletion | `requestAccountDeletion` uses RLS (`auth.uid() = user_id`); user can only delete own account | ✅ Correct |
| Account deletion grace period | 30-day grace, cancellable; `account_deletion_requests` table with RLS | ✅ Correct |
| Theme action | `setUserTheme` authenticates via `getUser()` before writing | ✅ Correct |
| Email notifications toggle | `toggleEmailNotifications` requires authenticated session | ✅ Correct |
| Stripe checkout ownership | Checkout session scoped to `user.id` → `family_members.family_id` — cannot purchase for other families | ✅ Correct |
| Founding rate / pricing | All price lookups are via env-var `STRIPE_PRICES` map (server-side only); no client-side price injection | ✅ Correct |
| Storage add-on gate | `isStorageAddon()` check verifies family is on paid plan before allowing add-on checkout | ✅ Correct |
| Stripe webhook new events | All new event types (monthly billing, founding rate) handled with same signature verification | ✅ Correct |
| Nest keepers | Owner-only + legacy-plan-only + max-3 guard on all CRUD operations | ✅ Correct |
| Invite token (re-verify) | `crypto.randomUUID()` opaque tokens; email not leaked in URL | ✅ Correct |
| Open redirect (re-verify) | Both guards still have `!next.startsWith("//")` check | ✅ Correct |
| dangerouslySetInnerHTML (re-verify) | Still only hardcoded JSON-LD on public pages; no new usages in dashboard | ✅ Correct |
| Secret env vars (re-verify) | No secrets in client components or shared lib files; all in server-only routes/actions | ✅ Correct |
| Rate limiting (re-verify) | All 11 public endpoints have rate limiting; cron endpoints use header auth | ✅ Correct |

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
| S12 | Medium | ✅ FIXED 2026-03-26 |
| S13 | Medium | ✅ FIXED 2026-03-26 |
| S14 | Medium | ✅ FIXED 2026-03-26 |
| S7 | Informational | No action needed |
| C1 | Safe | No action needed |
| C3 | Safe | No action needed |
| C4 | Safe | No action needed |
| C5 | Safe | No action needed |
