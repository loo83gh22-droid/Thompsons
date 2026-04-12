# FamilyNest UX Flow Findings

First audit: 2026-04-05

The core pattern across all findings: **email delivery failures and network errors are swallowed silently, and users are left with blank pages or generic errors and no path forward.**

---

## Critical (user completely stuck)

### UX1 — `?error=auth` never displayed on the login page ✅ FIXED (2026-04-11)
**File:** `app/login/page.tsx` — `useSearchParams()` reads `mode`, `next`, `email`, `family`, `name`, `token` but never reads `error`
**Trigger:** Any failed auth callback (expired confirmation link, used recovery code, invalid token) redirects to `/login?error=auth`
**User experience:** Lands on a blank login form with zero explanation. Doesn't know if their link expired, their account doesn't exist, or the service is down.
**Fix:** Read `searchParams.get("error")` on the login page and show a contextual banner:
- `error=auth` → "Your link has expired or already been used. Request a new one below."
- `error=auth` on invite flow → "Invite link expired. Ask the family owner to resend."

---

### UX2 — Password reset fixed (PR #111) ✅ FIXED (2026-04-05)
**Was:** Auth callback exchanged recovery code and sent users to `/dashboard` without prompting for a new password. Single-use codes meant repeat clicks landed on `/login?error=auth` silently.
**Fix:** `forgot-password` now passes `?next=/set-password` in `redirectTo`. New `/set-password` page handles the password update and expired-session case.

---

### UX3 — Invite email send failure is swallowed — owner sees success, member gets nothing ✅ FIXED (2026-04-11)
**File:** `app/dashboard/members/actions.ts` — `sendInviteEmail()` is wrapped in `try/catch` that logs to server console only
**User experience:** Owner adds a family member, sees "Member added!" success toast, but the invite email silently failed. The invited member never receives anything. Owner has no idea and never follows up.
**Fix:** Surface the email failure as a warning toast: "Member added, but the invite email failed to send. Copy their invite link manually: [link]" — include the invite link in the UI so the owner can share it another way.

---

### UX4 — Expired invite token gives no actionable path ✅ FIXED (2026-04-11)
**File:** `app/api/invite/route.ts` line 34 — returns generic 404 `"Token not found or already used"` for all failure cases
**User experience:** An invited member with an expired or already-used link sees a generic error with no distinction between:
- Token typo (try again)
- Already accepted (just sign in)
- Expired (ask for resend)
**Fix:** Add `reason` to the 404 response and show it on the invite page:
- `already_used` → "You've already accepted this invite. Sign in to access your family."
- `not_found` → "This invite link isn't valid. Ask your family owner to send a new one."

---

### UX5 — Invite token fetch failure silently blanks the invite form ✅ FIXED (2026-04-11)
**File:** `app/login/page.tsx` line 51–60 — token fetch uses `.catch(() => {})` swallowing all errors
**User experience:** If `/api/invite` is down or the network fails, the invited user sees a blank email field with no pre-filled name or family name. They don't know if their link is broken, if they should proceed manually, or if they should try again.
**Fix:** Replace `.catch(() => {})` with `.catch(() => setTokenError("Couldn't load your invite details. Check your link or try again."))` and show the error inline.

---

## High (degraded experience for common flows)

### UX6 — Welcome email deduplication silently skips new users ⚠️ OPEN
**File:** `app/api/emails/send-welcome/route.ts` line 47 — returns `{ success: true, skipped: true }` when already sent, but `app/auth/callback/route.ts` line 95 fires and forgets via `.catch()`
**User experience:** Some new users never receive the welcome email (if the deduplication fires unexpectedly, or if Resend is down at the moment of signup). They join the app with no onboarding guidance, no encouragement, no reply-to-Rob invitation.
**Fix:** Log skipped/failed welcome sends to the `email_campaigns` table with a `failed` status and retry on the next cron run within a 24-hour window.

---

### UX7 — 20+ dashboard pages return `null` (blank screen) when `activeFamilyId` is missing ✅ FIXED (2026-04-11)
**Files:** baby-book, stories, timeline, awards, artwork, recipes, journal, voice-memos, traditions, pets, events, homes, garden, letters, volunteer, teams, relationships, contacts, gratitude-board, favourites, trophy-case, book-club, bucket-list, family-motto, challenges, films, game-night — all do `if (!activeFamilyId) return null`
**User experience:** In any edge case where the family context fails to resolve (race condition, stale cookie, RLS failure), the user sees a completely blank page with no message, no reload prompt, no explanation.
**Fix:** Replace `return null` with a minimal error UI:
```tsx
if (!activeFamilyId) return (
  <div className="flex h-64 items-center justify-center text-[var(--muted)]">
    <p>Couldn't load your family. <button onClick={() => window.location.reload()}>Try again</button></p>
  </div>
);
```
Or add a shared `<FamilyRequired />` component that handles this consistently across all modules.

---

### UX8 — Resend confirmation email rate limit returns a generic error ⚠️ OPEN
**File:** `app/api/auth/resend-confirmation/route.ts` — rate limited by `strictLimiter` (5/min), returns 429 with `{ error: "Too many requests" }`
**User experience:** A user who clicks "Resend confirmation" multiple times (anxiously waiting for an email) gets a generic error with no countdown, no suggestion to wait, no alternative action.
**Fix:** The login page should check for 429 responses and display: "Check your inbox — the email is on its way. Wait a minute before trying again."

---

### UX9 — No global error boundary on dashboard — query failures produce blank pages ✅ FIXED (2026-04-11)
**Files:** No `app/dashboard/error.tsx` found
**User experience:** If any of the 13+ parallel queries on the dashboard home page throws (database connection issue, unexpected RLS error), the entire page crashes to Next.js's default error UI with no retry option and no friendly message.
**Fix:** Add `app/dashboard/error.tsx` with a friendly message and a reload button. Next.js catches unhandled errors at the nearest error boundary automatically.

---

### UX10 — Account already exists during invite signup — user ends up authenticated but with no family ⚠️ OPEN
**File:** `app/api/auth/link-invite/route.ts` — if this fails with a 500, the user is logged in but not linked to the family
**User experience:** User has an existing account, clicks invite link, signs in, the family linking step fails silently, and they're left on a dashboard with no family content. No error shown.
**Fix:** Detect the "logged in but no family" state in the dashboard layout and redirect to a clear recovery page: "We couldn't link you to [Family Name]. Contact support or ask your family owner to resend the invite."

---

## Medium (confusing but user can recover)

### UX11 — Generic "Something went wrong" on auth errors ⚠️ OPEN
**Files:** `app/login/page.tsx` line 131, `app/forgot-password/page.tsx` lines 27, 34
**User experience:** Network timeout, Supabase service outage, invalid email format — all show "Something went wrong." Users can't tell whether to retry immediately, wait, or contact support.
**Fix:** Parse common error codes from Supabase responses and show specific messages. At minimum distinguish: "Check your connection and try again" (network) vs "Contact support if this keeps happening" (server).

---

### UX12 — Member limit error message references vague upgrade path ✅ FIXED (2026-04-11)
**File:** `app/dashboard/members/actions.ts` line 221–223
**User experience:** User tries to add a family member, hits the plan limit, and gets an error mentioning upgrading but with no direct link to the pricing/upgrade page.
**Fix:** Include a link to `/pricing` or `/dashboard/settings?tab=billing` in the error message.

---

### UX13 — Modules without EmptyState components (blank content area, no guidance) ⚠️ OPEN
Modules confirmed to have `EmptyState`: journal, photos, voice-memos, stories, recipes, traditions, achievements, map
Modules that may show nothing with no content and no prompt: timeline, baby-book, trophy-case, bucket-list, book-club, challenges, films, game-night, homes, garden, volunteer, teams, contacts, gift-exchange, gratitude-board, family-motto, letters
**Fix:** Add an `EmptyState` with a one-sentence description and a primary action button to every module. Prioritise the ones new users are most likely to visit first.

---

## Low / Informational

### ℹ️ UX14 — Password reset always shows "Check your email" even for unregistered addresses (Accepted)
**File:** `app/api/auth/reset-password/route.ts` — intentional security design (prevents account enumeration)
**Assessment:** Correct security practice. The tradeoff (typo users wait for an email that never comes) is acceptable. No fix applied.

### ℹ️ UX15 — WelcomeModal doesn't persist in private browsing (Low)
**File:** `app/dashboard/WelcomeModal.tsx` — uses localStorage which is blocked in some private/strict browser modes
**Assessment:** Low frequency. Users see the modal again on next load — mildly annoying but not a broken journey. No fix required.

---

## Confirmed Working Correctly

| Flow | Status |
|------|--------|
| Signup happy path (new email, confirms, logs in) | ✅ Works |
| Invite happy path (new user, valid token, links to family) | ✅ Works |
| Password reset after fix (PR #111) | ✅ Fixed |
| Settings "Change Password" after fix | ✅ Fixed |
| Auth callback — family member linking on join | ✅ Works |
| Auth callback — member-joined notification to owner (email, not UI) | ✅ Works (email only) |
| Rate limiting on reset + invite routes | ✅ In place |
| Cron secret validation on notifications | ✅ In place |

---

## Fix Plan (by user impact)

| # | Finding | Impact | Effort | Priority |
|---|---------|--------|--------|----------|
| UX1 | `?error=auth` never shown on login | Critical — every failed auth is a silent dead end | Low — add one `searchParams.get("error")` check | ✅ Done |
| UX3 | Invite email failure swallowed | Critical — invites silently fail, families can't grow | Medium — add warning toast + invite link fallback | ✅ Done |
| UX5 | Invite token fetch failure blanks form | Critical — invited users see broken invite form | Low — replace `.catch(() => {})` with error state | ✅ Done |
| UX4 | Generic invite token error message | High — user has no path forward | Low — add `reason` field to 404 response | ✅ Done |
| UX7 | 20+ blank pages on missing familyId | High — edge case but catastrophic when hit | Medium — shared `<FamilyRequired />` component | ✅ Done |
| UX9 | No dashboard error boundary | High — any DB error = blank crash | Low — add `app/dashboard/error.tsx` | ✅ Done |
| UX2 | Password reset (already fixed) | — | — | ✅ Done |
| UX12 | Member limit vague upgrade path | Low — happens rarely | Low — add link to pricing page in error | ✅ Done |
| UX10 | Existing user invite link-up failure | Medium — rare but leaves user in limbo | Medium — detect in layout and show recovery UI | 🟡 Next sprint |
| UX6 | Welcome email dedup silently skips | Medium — new users miss onboarding email | Medium — retry table + cron retry | 🟡 Next sprint |
| UX8 | Rate limit message on resend confirm | Medium — user confusion, not blocked | Low — better 429 handling on client | 🟡 Next sprint |
| UX11 | Generic "something went wrong" | Low-medium — frustrating but user can retry | Medium — parse error codes | 🟡 Next sprint |
| UX13 | Modules missing EmptyState | Low — confusing but not broken | Medium — add to each module | 🟢 Backlog |
