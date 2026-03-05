# FamilyNest Privacy Review

Conduct a **thorough, structured privacy audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — Exterior Privacy
*Can unauthenticated users or third parties access data they shouldn't?*

Check each of the following attack surfaces:

### Storage & CDN
- Are any Supabase storage buckets set to `public: true`? (Exposes direct CDN URLs that bypass all RLS.)
- Do bucket RLS policies correctly restrict access to authenticated family members only?
- Check `supabase/migrations/` for any `UPDATE storage.buckets SET public = true` statements.

### API Routes (`app/api/`)
- Do all routes call `supabase.auth.getUser()` before touching data?
- Do sensitive endpoints (invite, export, notifications) have rate limiting via `checkHttpRateLimit`?
  - Invite → should use `strictLimiter` (5/min)
  - Others → at least `defaultLimiter` (30/min)
- Are any signed URLs long-lived (>300s)? Check `createSignedUrl` calls.
- Do any email sends use `to: string[]` array format in Resend calls? (Exposes recipient list to email provider — each recipient should be sent individually.)

### Auth & Middleware
- Does `middleware.ts` / `proxy.ts` correctly protect all `/dashboard/*` routes?
- Are there any API routes that skip authentication entirely?

### Data Leakage
- Do search results ever include sealed time capsules (`unlock_date > today`)?
- Does the export endpoint scope data to `activeFamilyId` only?

---

## 2 — Internal Privacy
*Can lower-privilege family members access or modify things they shouldn't?*

### Role Enforcement
- Do all Server Actions (`actions.ts` files) call `requireRole()` or `getUser()` before mutating data?
- Can `teen` or `child` roles perform actions reserved for `owner` / `adult`?
  - Check: journal `author_override`, achievements, family relationships, member management
- Is the default role in `FamilyContext.tsx` and `layout.tsx` set to `"teen"` (least-privilege), not `"adult"`?

### Sensitive Features
- Is the Nest Keepers succession plan (`/api/nest-keepers`) restricted to `owner` role only (GET + POST + PUT + DELETE)?
- Can non-owners view other members' private content (journals, voice memos) that aren't theirs?

### Time Capsules
- Are sealed capsules (unlock_date in the future) hidden from search AND from the capsules list for non-creators?

### Family Tree / Relationships
- Are `addRelationship`, `removeRelationship`, and `setMemberRelationships` all properly auth-gated?

---

## Audit Instructions

1. Use the **Explore agent** (thorough mode) to scan all relevant files.
2. For each surface area above, look at the actual code — don't assume it's correct.
3. Produce a **numbered findings list** grouped by Exterior (E#) and Internal (I#).
4. For each finding include:
   - **File and line** where the issue exists
   - **What the risk is** (who can do what they shouldn't)
   - **Recommended fix**
5. After listing all findings, **propose a fix plan** ordered by severity.
6. Note anything that was checked and found to be **already correct** (to confirm coverage).

Cross-reference against the known-fixed issues list in `CLAUDE.md` so you don't re-report already-patched items — only flag **new or regressed** issues.
