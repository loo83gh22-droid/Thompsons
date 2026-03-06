# FamilyNest Child Safety & Minor Protection Findings

Audit conducted: 2026-03-06
Auditor: Claude Sonnet 4.6

---

## Content Access (A#)

### A1 — Child PII Exposed to All Logged-In Family Members (Medium)

**Files:**
- `app/dashboard/our-family/page.tsx` line 67
- `app/dashboard/members/[id]/page.tsx` line 21

**Issue:** The Our Family page fetches `birth_date`, `birth_place`, `contact_email`, and `kid_access_token` for every family member and passes them to the client. The `/members/[id]` profile page does the same. Neither page checks the viewer's role before returning this data.

A teen member who is logged in can see all other members' full PII including birth dates and emails of child members — and the `kid_access_token` itself is in the page payload, letting a tech-savvy teen extract a sibling's kid-link token.

**Recommended fix:**
- In `our-family/page.tsx`: strip `kid_access_token` from members passed to the client component; pass it only to `MemberDetailsPanel` after an owner/adult role check.
- In `members/[id]/page.tsx`: after fetching the member, check if the viewer is owner or adult before rendering `birth_date`, `birth_place`, and `contact_email`. Non-owner/adult viewers should see a simplified profile (name, avatar, relationship only).

---

### A2 — MemberDetailsPanel Renders Admin Controls Without Role Gate (Low / UI Only)

**File:** `app/dashboard/our-family/MemberDetailsPanel.tsx` lines 59–73 (no `currentUserRole` prop)

**Issue:** The panel renders role-change selects, kid-link generation/revoke buttons, and delete buttons for all logged-in users regardless of role. The Server Actions correctly reject unauthorized callers, so there is no actual data compromise — but non-owner/adult users see confusing admin UI.

**Recommended fix:** Pass `currentUserRole` as a prop from `OurFamilyClient`/`page.tsx` and gate admin sections with `{["owner", "adult"].includes(currentUserRole) && ...}`.

---

## Data & Accounts (D#)

### D1 — Invite Emails Sent to Child Member Email Addresses (High)

**File:** `app/dashboard/members/actions.ts` lines 268–277 and 419–427

**Issue:** `addFamilyMember` sends an invite email to any `contact_email` stored for a new member without checking whether the detected role is `child`. `updateFamilyMember` does the same when the email changes. Because `detectRoleFromBirthDate()` runs before these blocks but the result is not gated against email dispatch, a parent who saves a child member record with an email address will cause an invite email to be dispatched to that child's address.

Children under 13 should never receive direct email from the app (COPPA-adjacent concern).

**Recommended fix:**

```typescript
// addFamilyMember, line 268:
const trimmedEmail = email?.trim();
const detectedRole = detectRoleFromBirthDate(birthDate?.trim() || null);
if (trimmedEmail && detectedRole !== "child") {
  try {
    const familyName = await getActiveFamilyName(supabase);
    await sendInviteEmail(trimmedEmail, name.trim(), familyName, member?.id);
  } catch { /* non-blocking */ }
}
```

Apply the same `detectedRole !== "child"` guard at line 419–427.

---

### D2 — `resendInviteEmail` Lacks Child Role Check (High)

**File:** `app/dashboard/members/actions.ts` lines 139–165

**Issue:** `resendInviteEmail` fetches the member by ID but does not read the `role` field. It will resend an invite to any member with a `contact_email`, including child-role members.

**Recommended fix:** Add `role` to the select on line 151 and short-circuit with an error if `member.role === "child"`:

```typescript
.select("name, contact_email, user_id, role")
// ...
if (member.role === "child") return { success: false, error: "Cannot send invite emails to child accounts." };
```

---

### D3 — Birthday Notification Emails Not Filtered by Recipient Role (Low)

**File:** `app/api/notifications/route.ts` lines 104–128

**Issue:** The birthday reminder query (lines 107–111) sends to ALL family members with `email_notifications = true`, not just owner/adult members. If a child member has `email_notifications = true` and a `contact_email`, they will receive birthday reminder emails. Similarly, child members whose birthday is upcoming will generate emails to adult family members — this part is acceptable but worth documenting.

**Recommended fix:** Add `.in("role", ["owner", "adult"])` to the recipient query at line 107:

```typescript
.select("contact_email, name")
.eq("family_id", bm.family_id)
.eq("email_notifications", true)
.in("role", ["owner", "adult"])  // add this line
.not("contact_email", "is", null)
.neq("id", bm.id)
```

---

## ✅ Confirmed Correct (no action needed)

- **Kid token expiry** — `app/kid/[token]/page.tsx` lines 101–104 correctly checks `kid_token_expires_at` and renders an expired-link message when past.
- **`changeMemberRole`** — gated to owner only (`actions.ts` line 497); cannot change own role.
- **`generateKidLink` / `revokeKidLink`** — gated to owner/adult only (lines 535, 582).
- **Invite token privacy** — invite URLs use opaque UUIDs, no PII in the URL.
- **Storage/grace-period emails** — already filter to `role IN ('owner', 'adult')` (notifications/route.ts lines 595, 717).
- **Nest Keepers** — succession plan restricted to owner only (nest-keepers/route.ts lines 29–38).
- **`requireRole`** — called consistently in all Server Actions; family isolation enforced on every mutation.
- **`detectRoleFromBirthDate`** — correctly assigns `child` for age < 13 (`src/lib/roles.ts`).
- **`checkAgeTransitions`** — only flags upgrades, not downgrades; gated to owner/adult to apply.
- **Self-role escalation** — child members have no login; teen members cannot call `changeMemberRole` (owner-only).
- **Admin emails to externals** — admin notification email only includes owner name/email, not child PII.

---

## Fix Priority

| # | Severity | Finding |
|---|----------|---------|
| D1 | **High** | Invite emails dispatched to child-role member email addresses |
| D2 | **High** | `resendInviteEmail` skips role check before sending |
| A1 | **Medium** | Child PII (`birth_date`, `birth_place`, `contact_email`, `kid_access_token`) visible to teen members in Our Family / member profile |
| D3 | **Low** | Birthday emails not filtered to owner/adult recipients |
| A2 | **Low** | Admin UI controls visible to non-owner users in MemberDetailsPanel (no data risk; cosmetic) |
