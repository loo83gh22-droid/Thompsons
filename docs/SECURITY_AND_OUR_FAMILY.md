# Security & Our Family Configuration

## 1. Security – Current State & Recommendations

### What’s already in place

- **Auth:** Dashboard routes require login (middleware redirects unauthenticated users to `/login`).
- **RLS (Row Level Security):** Family-scoped tables use `user_family_ids()` so users only see data for families they belong to. Policies are of the form: “Users can manage X in own families”.
- **Invite → member link:** When an invited person signs up with the same email, the dashboard layout finds the `family_members` row with that `contact_email` and sets `user_id`, so they’re linked without a public token.
- **Secrets:** `RESEND_API_KEY` and similar are server-only (not `NEXT_PUBLIC_*`). `.env*` is gitignored.

### Recommended improvements

| Priority | Item | Action |
|----------|------|--------|
| **High** | **Invite API unauthenticated** | `/api/send-invite` can be called by anyone who knows the URL. **Fix:** Call Resend from the server action (e.g. in `members/actions.ts`) instead of `fetch('/api/send-invite')`, and remove the public API route. Or keep the route but require a one-time token or server-side secret header. |
| **Medium** | **Storage "Anyone can view"** | Some buckets (e.g. journal-photos, story-covers) allow read by anyone with the URL. **Fix:** If content is private, change policy to `auth.role() = 'authenticated'` and optionally restrict by family (e.g. object metadata or a mapping table). |
| **Low** | **Rate limiting** | No rate limit on login or invite. **Fix:** Add rate limiting (e.g. Upstash, or Vercel middleware) on `/login` and any public invite/claim endpoints. |
| **Low** | **CORS / API hardening** | If you add more public API routes, restrict origin and method. Middleware already protects `/dashboard`. |

### Env and deployment

- **Production:** Never commit `.env.local` or real keys.
- **Supabase:** Prefer RLS and service role only on the server; avoid exposing service role key to the client.
- **Google Maps / Resend:** Restrict API keys by domain / IP where the platform allows.

---

## 2. Our Family – Assigning Members & Configuring Relationships

### Current behavior

- **Adding members:** “+ Add member” creates a `family_members` row (name, nickname, relationship label, email, birth date, etc.). No link to other members for the **tree** (parent/child/spouse).
- **Relationships (tree):** Data comes from `family_relationships` (member_id, related_id, relationship_type: `parent` | `child` | `spouse`). There is **no UI** to add or edit these rows; the tree only **reads** them. Seed data exists in migration 010; anything else was added manually or by old tooling.

### What’s missing

1. **Assign new members to the tree**  
   When adding a member, optionally:
   - Set “Relationship to existing member” (e.g. “Spouse of …”, “Child of …”, “Parent of …”).
   - On save, insert the right `family_relationships` row(s) (and reverse row for spouse/parent–child so the tree stays consistent).

2. **Edit relationships from Our Family**  
   From the member details panel (or list):
   - “Edit relationships” (or “Set parent / spouse / children”).
   - UI: e.g. “Spouse: [dropdown of members]”, “Parents: [multi-select]”, “Children: [multi-select]”.
   - Save: upsert/delete `family_relationships` so the tree reflects the chosen structure.

3. **Validation**  
   - Prevent duplicate or contradictory relationships (e.g. same pair, same type, twice).
   - Optional: prevent cycles (e.g. A parent of B, B parent of A) if you want strict hierarchy.

### Suggested implementation outline

**A. Server actions (e.g. `app/dashboard/our-family/actions.ts` or under `members/`)**

- `addRelationship(memberId, relatedId, relationshipType)`  
  - Check both members belong to the same family and user has access.  
  - Insert one (or two for spouse) row(s) into `family_relationships` with `family_id` set.  
  - For “child”: insert `(child_id, parent_id, 'child')`.  
  - For “spouse”: insert both `(A, B, 'spouse')` and `(B, A, 'spouse')`.

- `removeRelationship(memberId, relatedId, relationshipType)`  
  - Delete the matching row(s) (and for spouse, the reverse row).

- `setMemberRelationships(memberId, { spouseId?, parentIds?, childIds? })`  
  - Load current relationships for `memberId`, then add/remove so that after the call only the given spouse/parents/children remain. Use a transaction if you do multiple deletes/inserts.

**B. Add-member flow**

- In the “Add member” form (or a follow-up step), add:
  - “Link in tree (optional):”  
    - Relationship type: Spouse of / Child of / Parent of  
    - Member: dropdown of current family members  
  - On submit: create `family_members` row, then if “Link in tree” is set, call `addRelationship` (and for spouse, add the reverse).

**C. Edit relationships in Our Family**

- In the member details panel (or a dedicated “Edit relationships” modal):
  - Show current spouse, parents, children (from `family_relationships`).
  - Dropdowns/multi-selects to choose spouse, parents, children.
  - Save: call `setMemberRelationships` (or multiple `addRelationship` / `removeRelationship`).

**D. Database**

- `family_relationships` already has `family_id` (025). Ensure every insert sets `family_id` (e.g. from the member’s `family_id`) so RLS stays correct.
- No new tables needed; only new UI and server actions.

### UX notes

- **Tree view:** After add/edit, refresh or revalidate so the tree updates.
- **List view:** Optional: show “Spouse: X”, “Parents: …” on the card or in the details panel.
- **Empty state:** If there are no relationships, show a short “Add relationships to build your tree” with a link to edit relationships.

---

## 3. Quick reference – RLS and family_relationships

- **family_members:** “Users can manage family_members in own families” (025).
- **family_relationships:** “Users can manage family_relationships in own families” (025) with `family_id` on the table.
- All inserts/updates to `family_relationships` must set `family_id` (e.g. from the member’s family) so the policy allows the operation.

Implementing the invite fix (move send to server action) and the relationship UI/actions above will address the main security gap and make Our Family fully configurable for assigning and editing members and their relationships.
