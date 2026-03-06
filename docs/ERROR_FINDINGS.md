# FamilyNest Error Handling & Observability Findings

_Last audited: 2026-03-06_

Legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low · ✅ FIXED

---

## User-Facing Errors (U#)

### U1 🔴 Raw Supabase/Resend error messages exposed to client
**Files:**
- `app/api/send-welcome/route.ts` lines 68, 83–85 — `emailError.message` + raw caught error returned in JSON
- `app/api/nest-keepers/route.ts` lines 46–47, 141–142, 265–266, 319–320 — four CRUD handlers all return `error.message`
- `app/api/family-name/route.ts` line 60 — `error.message` from Supabase update

**Consequence:** Postgres constraint names, column names, and table names can leak to the browser/client code.
**Fix:** Replace all `return NextResponse.json({ error: err.message })` with a generic message. Log the real error server-side only.

---

### U2 🟠 Stripe checkout exposes env-var names to client
**File:** `app/api/stripe/checkout/route.ts` line 49
**Code:** `error: \`Stripe price not configured … Set STRIPE_PRICE_${plan.toUpperCase()} env var.\``
**Consequence:** Tells anyone who sends a bad plan name exactly which env vars are expected.
**Fix:** Return a generic "Plan not available" message; log the detailed message server-side.

---

### U3 🟡 24 / 31 dashboard modules have no `error.tsx` boundary
**Missing boundaries in:** achievements, artwork, awards, family-tree, favourites, feedback, import, journal, members, messages, music, onboarding, one-line, our-family, personalize, pets, photos, recipes, relationships, settings, sports, stories, time-capsules, timeline, traditions, trophy-case, voice-memos, workout
**Has boundary:** `app/dashboard/error.tsx` (generic), `map/error.tsx`, `events/error.tsx`
**Consequence:** An unhandled render error in any of these modules crashes the entire dashboard layout for the user.
**Fix:** Add a minimal `error.tsx` to each module, or at minimum confirm the root `app/dashboard/error.tsx` catches them (it should if it's a segment boundary).

---

### U4 🔵 18 dashboard modules have no `loading.tsx` skeleton
**Missing:** achievements, artwork, awards, family-tree, favourites, feedback, import, members, messages, music, onboarding, one-line, personalize, relationships, settings, sports, trophy-case, workout
**Consequence:** Blank page flash while data loads.
**Fix:** Add minimal loading skeletons.

---

### U5 🟠 Member invite email failures are silently swallowed — user thinks invite was sent
**File:** `app/dashboard/members/actions.ts` lines 273–278 and 422–430
**Code:** `catch { /* Non-blocking */ }` — no return value change, no log
**Consequence:** Invite email silently fails; admin believes invite was dispatched.
**Fix:** Log the failure and return a warning in the action result so the caller can surface it.

---

## Silent Failures (F#)

### F1 🔴 Stripe webhook: unhandled event types return HTTP 200 — Stripe marks as delivered
**File:** `app/api/stripe/webhook/route.ts` lines 362–374
**Consequence:** Any new Stripe event type not in the handler's switch/if chain silently succeeds. Stripe will not retry; the event is lost.
**Fix:** Add a default branch that returns `{ status: 400 }` (or 202 with a log) for unknown event types.

---

### F2 🟠 Cron endpoints return HTTP 200 even when internal errors occur
**Files:**
- `app/api/notifications/route.ts` line 763 — always `NextResponse.json(results)` with no status check on `results.errors`
- `app/api/daily-report/route.ts` line 259 — always `{ success: true }` regardless of query failures

**Consequence:** Vercel Cron marks the run as successful; monitoring/alerting never fires.
**Fix:** If `results.errors.length > 0`, return HTTP 500 (or 207 Multi-Status) so Vercel logs the failure.

---

### F3 🟠 Contact confirmation email swallowed with no log
**File:** `app/api/contact/route.ts` lines 61–71
**Code:** `catch { /* Confirmation failure is non-fatal */ }` — empty catch, no `console.error`
**Consequence:** If Resend is down, users never receive the confirmation email and support has no visibility.
**Fix:** Add `console.error('[contact] confirmation email failed:', err)` inside the catch.

---

### F4 🟠 Export ZIP failure swallowed with no log
**File:** `app/api/export/route.ts` lines 124–129
**Code:** `catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }` — no logging
**Consequence:** ZIP generation failures are invisible to operators.
**Fix:** Add `console.error('[export] zip generation failed:', err)` before returning.

---

### F5 🟡 Junction-table inserts (journal / stories / voice-memos) have no error handling
**Files:**
- `app/dashboard/journal/actions.ts` lines 115–120, 216–223 — `journal_entry_members`, `travel_location_members` inserts
- `app/dashboard/journal/actions.ts` lines 381–389 — delete-then-insert; if insert fails, associations are permanently lost
- `app/dashboard/stories/actions.ts` lines 64–68 — `family_story_members` insert
- `app/dashboard/voice-memos/actions.ts` lines 64–70 — `voice_memo_members` insert

**Consequence:** Entry is saved but member associations are silently missing; no error surfaces to the user or logs.
**Fix:** Add `if (insertError) console.error(...)` and consider returning an error to the UI.

---

### F6 🟡 Geocoding failures are completely silent (no logs)
**Files:**
- `app/dashboard/journal/actions.ts` lines 225–227, 509–511
- `app/dashboard/members/actions.ts` lines 264–266

**Code:** `catch { /* Geocoding failed */ }` — empty
**Consequence:** If Google Maps API key is misconfigured or rate-limited, every entry silently saves without a map pin. Invisible in logs.
**Fix:** Add `console.warn('[geocoding] failed:', err)` at minimum.

---

### F7 🟡 Storage rollback on journal photo/video insert failure — removal errors not logged
**File:** `app/dashboard/journal/actions.ts` lines 266–270, 316–320
**Consequence:** If the storage `.remove()` call in the rollback path fails, the file is orphaned in storage and storage bytes are not decremented. No log.
**Fix:** Check the `error` return from `.remove()` and log it.

---

### F8 🔵 Admin notification email is fire-and-forget (`.catch()` only, not awaited for logging)
**File:** `app/api/auth/signup/route.ts` lines 100–105
**Status:** Has `.catch(err => console.error(...))` — better than nothing, but the signup response already returned before the email attempt finishes.
**Fix:** Low priority; acceptable as fire-and-forget with catch. Consider moving to a background job if needed.

---

## Already Correct ✅

- **Storage upload rollback (photos):** `app/dashboard/photos/actions.ts` — rolls back storage AND decrements usage on DB insert failure. ✅
- **Voice memo storage deletion logging:** `app/dashboard/voice-memos/actions.ts` lines 138–142 — logs error and continues. ✅
- **Journal video storage deletion logging:** `app/dashboard/journal/actions.ts` lines 931–934 — logs error. ✅
- **Stripe webhook `constructEvent` failure:** Returns 400 on signature mismatch. ✅
- **Stripe webhook DB update failure after event:** Logged via `console.error` before returning 500. ✅
- **Notifications cron error array:** Individual email failures are pushed to `results.errors` array (not fully silenced). ✅ Partial — but HTTP status issue remains (F2).

---

## Fix Plan (Priority Order)

| # | Severity | Finding | Effort |
|---|----------|---------|--------|
| 1 | 🔴 Critical | U1 — Sanitize all raw error.message in API responses | Small |
| 2 | 🔴 Critical | F1 — Stripe webhook: return 400 for unhandled event types | Tiny |
| 3 | 🟠 High | F2 — Cron endpoints return 500 when errors array is non-empty | Tiny |
| 4 | 🟠 High | U2 — Sanitize Stripe checkout env-var leak | Tiny |
| 5 | 🟠 High | U5 — Log + surface invite email failures to caller | Small |
| 6 | 🟠 High | F3 — Log contact confirmation email failures | Tiny |
| 7 | 🟠 High | F4 — Log export ZIP failures | Tiny |
| 8 | 🟡 Medium | F5 — Add error handling to junction-table inserts | Small |
| 9 | 🟡 Medium | F6 — Add console.warn to geocoding catch blocks | Tiny |
| 10 | 🟡 Medium | F7 — Log storage removal errors in rollback paths | Tiny |
| 11 | 🟡 Medium | U3 — Add error.tsx to dashboard modules | Medium |
| 12 | 🔵 Low | U4 — Add loading.tsx skeletons | Medium |
| 13 | 🔵 Low | F8 — Admin notification email (acceptable as-is) | Skip |
