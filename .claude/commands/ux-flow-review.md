# FamilyNest UX Flow Review

Conduct a **thorough, structured user experience flow audit** of the FamilyNest codebase (familynest.io). The goal is NOT to verify code correctness — it's to find every place where a real user journey could be broken, produce a blank page, give a confusing error, or lead to a dead end with no path forward.

Think like a real user who just signed up, got invited, forgot their password, or is using the app on a slow connection. Would they know what happened? Would they know what to do next?

---

## 1 — Authentication Flows
*Does every auth path land users somewhere useful with a helpful message?*

### Signup
- Does the signup flow handle the case where an email is already registered? Does the user get a clear message or a generic error?
- After signup, is the email confirmation step clearly explained? What does the user see while waiting?
- If email confirmation fails (expired link, already used), does `/login?error=auth` display a visible, actionable message — or does the user land on a blank login form with no explanation?
- If the user clicks the confirmation link on a different device/browser than they signed up on, does it still work?

### Password Reset
- Does the reset link route users to a page where they can actually set a new password — not just log them in silently?
- Is the recovery token single-use issue handled gracefully? (Second click should show a clear "link expired, request a new one" message — not a blank login page)
- Does the Settings "Change Password" link work for logged-in users without requiring a new reset email?

### Invite Flow
- When an invited user clicks their invite link, is their email and family name pre-filled? Or does a token lookup failure leave them with a blank form and no explanation?
- What happens when an invite token is expired vs invalid vs already used? Does the error message tell the user what to do next?
- If a user with an existing account clicks an invite link, does the flow link their account to the family correctly? Or does it drop them in limbo (authenticated but with no family access)?
- Does the family owner get notified when an invited member accepts? If the notification email fails, is there any other indicator?

### Session & Error States
- Does `?error=auth` on the login URL display a visible, helpful message to the user — not just an empty form?
- When a user's session expires mid-session, where do they land? Do they lose in-progress work?
- Are there any redirects to `/login` without a `?error=` param that would leave the user confused?

---

## 2 — Empty & Blank States
*Do users ever see a completely blank page with no explanation?*

### The `return null` Problem
- How many dashboard pages use `if (!activeFamilyId) return null`? These produce a completely blank page with no message. List every one.
- What causes `activeFamilyId` to be null for a logged-in user? Are there race conditions or edge cases where this could happen unexpectedly?
- Does the dashboard layout have a fallback when no family can be determined — or does it silently pass `null` down to every page?

### Module Empty States
- Which dashboard modules have an `EmptyState` component (with a helpful "nothing here yet" message and a call to action)?
- Which modules show nothing at all when there's no content (no EmptyState, no prompt, no guidance)?
- For a brand new user with an empty family, what do they see on the first 5 modules they visit? Is it clear what to do?

---

## 3 — Email Delivery
*When an email is supposed to send, does the user know if it succeeded or failed?*

### Transactional Email Failures
- When the invite email fails to send (Resend error, invalid address), does the owner see an error — or do they see a success toast while the member never receives anything?
- When the welcome email fails (Resend down, RESEND_API_KEY missing), does the new user get any communication at all?
- When a birthday reminder or time capsule unlock email fails in the cron, is there any mechanism to retry, or is it permanently lost?

### Confirmation & Reset Emails
- After requesting a password reset, does the user have any way to know if the email was actually sent (vs. their address not existing in the system)?
- Is the "Resend confirmation email" rate limit exposed to the user in a helpful way (countdown, clear message) — or does it just return a generic error?

---

## 4 — Error Messages & Recovery Paths
*When something goes wrong, can the user understand what happened and what to do?*

### Generic Errors
- Are there "Something went wrong" messages that give users no context about whether to retry, contact support, or try a different approach?
- Are Supabase RLS errors (which return empty results, not errors) creating silent blank states instead of visible error messages?
- When an upload fails (file too large, wrong format, storage limit), does the user get a clear, specific message?

### Dead Ends
- Are there any error states that show an error message but no next action (no button, no link, no suggestion)?
- Is there a global error boundary (`error.tsx`) on the dashboard that catches unexpected failures? Or do query errors produce blank/broken pages?
- When the user hits a plan limit (journal entries, map locations, etc.), is the upgrade CTA clear and actionable?

---

## 5 — First-Run Experience
*Does a brand new user know what to do in the first 5 minutes?*

### Onboarding Completion
- Does the onboarding flow complete cleanly? Or does it redirect mid-flow in a way that feels like something broke?
- Is onboarding progress persisted if the user closes the browser mid-flow and returns later?
- After onboarding, is it clear where to go and what to do first?

### Adding the First Family Member
- Is the "invite a family member" flow clearly discoverable? Or would a new user miss it?
- Does the invite form give clear feedback on whether the invite was sent successfully?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files — focus on `app/auth/`, `app/login/`, `app/signup/`, `app/dashboard/*/page.tsx`, `app/api/`, and any component files for EmptyState and error handling.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by category (UX#).
4. For each finding include:
   - **File and line** where the issue exists
   - **User impact** — what the user actually experiences (blank page, confusing message, dead end)
   - **Recommended fix** — specific and actionable
5. After listing all findings, **propose a fix plan** ordered by user impact (most damaging to fewest users affected).
6. Note user journeys that were checked and found to work correctly.

Before starting, read `docs/UX_FLOW_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/UX_FLOW_FINDINGS.md`: add new findings with their UX# codes, and mark anything you confirmed as resolved with ✅ FIXED.
