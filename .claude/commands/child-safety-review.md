# FamilyNest Child Safety & Minor Protection Review

Conduct a **thorough, structured child safety audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — Content Access Controls
*Can teen or child members see content they shouldn't?*

Check each of the following:

### Content Visibility Across All Modules
For all 28 dashboard feature modules (`app/dashboard/`), check whether content marked as private or authored by adults is correctly hidden from `child` and `teen` roles:
- **Journal**: Can a child member read another member's private journal entries? Do server queries filter by author or privacy flag?
- **Voice Memos**: Are voice memos by other family members accessible to child/teen roles via the list or detail views?
- **Photos**: Can child members access private photos not shared with them? Check the photo list query RLS and any signed URL generation.
- **Messages**: Can child members send or read messages in all threads, or are there adult-only threads? Is there a mechanism to restrict message recipients by role?
- **Time Capsules**: Are sealed capsules hidden from child/teen members who are not the creator? (Separate concern from privacy-review's general seal check — focus here on role-specific filtering.)
- **Nest Keepers**: Is the Nest Keepers succession plan page and its data completely hidden from non-owner, non-adult roles in both UI and Server Action?

### Family Tree & Relationships
- Does the family-tree and relationships module expose sensitive relationship metadata (e.g., deceased status, relationship history) to child members?
- Can a child/teen member add or modify relationship records?

---

## 2 — Data Minimization & Account Safety
*Do child accounts collect or expose more data than necessary?*

Check each of the following:

### Profile Data for Minors
- Does the member creation / onboarding flow for child role members collect only necessary fields — i.e., no email address required for under-13 members?
- Is birth date stored for child members, and if so, is it hidden from other non-owner family members in the member list/profile views?
- Can a child member change their own role (e.g., from `child` to `teen` or `adult`) via settings or profile update Server Actions?

### Account Creation & Consent
- Can a child member be added to a family without the family owner/adult explicitly creating the account? (i.e., no self-registration path for children.)
- Does `detectRoleFromBirthDate()` correctly assign `child` for users under 13, and is this called consistently at member creation and role-sync time?
- If a child member's birth date is updated to make them 18+, does their role auto-upgrade — and is this update gated to owner/adult only?

### Email
- Is Resend email ever sent to an email address associated with a `child`-role member? (Children should not receive direct email from the app.)
- Does the invite email flow prevent sending invitations to child member accounts?
- Do notification emails (`/api/notifications`) filter out child member recipients?

### External Data Exposure
- Does any public-sharing feature (if a family has annual/legacy plan) expose content that includes child member profiles, photos, or details to unauthenticated visitors?
- Do any Server Actions return child member birth dates or full names to the client in contexts where they're not needed?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files — focus on `app/dashboard/*/actions.ts`, `app/dashboard/members/`, `src/lib/roles.ts`, `app/api/send-invite`, `app/api/notifications`, and `app/api/emails/`.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by Content Access (A#) and Data & Accounts (D#).
4. For each finding include:
   - **File and line** where the issue exists
   - **What a child/teen member can access or what data is over-collected**
   - **Recommended fix**
5. After listing all findings, **propose a fix plan** ordered by severity (Critical → High → Medium → Low).
6. Note anything that was checked and found to be **already correct** (to confirm coverage).

Before starting, read `docs/CHILD_SAFETY_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/CHILD_SAFETY_FINDINGS.md`: add new findings with their A#/D# codes, and mark anything you confirmed as resolved with ✅ FIXED.
