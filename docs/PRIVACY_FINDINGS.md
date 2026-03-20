# FamilyNest Privacy Findings

Last audited: 2026-03-20
Result: **Zero open findings** — all issues resolved (E1–E6).

---

## Summary

The codebase has been through systematic privacy hardening across three audits. All critical,
high, and medium findings have been resolved. No new findings on 2026-03-20 audit.

---

## ✅ FIXED — Previous Findings

### E1: Voice memo storage — public CDN access (Critical → FIXED)
**Resolved via:** migrations 062, 078, 084
`audio_url` values migrated from CDN paths to authenticated proxy paths. `voice-memos` bucket set to private.

### E2: Storage buckets — multiple buckets public (Critical → FIXED)
**Resolved via:** migrations 062, 078, 084
All 14 buckets confirmed private (`public = false`). All media served through `/api/storage/[...path]` proxy which requires authenticated session.

### E3: Home mosaic photos — anonymous SELECT policy (High → FIXED)
**Resolved via:** migration 070
Policy narrowed to `family_id IS NULL` (landing page legacy photos only). Family-scoped photos require auth.

### E4: Nest keepers — overly permissive RLS write policies (High → FIXED)
**Resolved via:** migration 070
All INSERT/UPDATE/DELETE on `nest_keepers` restricted to `role = 'owner'`.

### E6: tradition-photos bucket created as public after hardening pass (High → FIXED)
**Resolved via:** migration `20260320000002_private_tradition_photos.sql` (applied 2026-03-20)
`tradition-photos` was created on 2026-03-14 with `public = true` — after the `084_private_storage_buckets` hardening migration (2026-03-08). Photos were accessible via Supabase CDN public URLs without any authentication. Fixed by:
- Setting bucket to `public = false`
- Dropping `"Anyone can view tradition photos"` policy
- Adding authenticated-read, authenticated-upload, and authenticated-delete policies
- Adding `tradition-photos` to the `/api/storage` proxy allowlist
- Moving photo upload to a Server Action (`uploadTraditionPhoto`) — client no longer touches storage directly

### E5: Public shares — anonymous read without token (Medium → FIXED)
**Resolved via:** migration 070
Dropped all anonymous RLS policies on `family_stories` and `recipes`. Public share pages use
service-role client with explicit `share_token` + `is_public` validation.

---

## Confirmed Correct — 2026-03-20 Audit

### Exterior Privacy

| Surface | Finding | Status |
|---|---|---|
| Storage buckets (all 14) | All `public = false`, auth proxy required | ✅ Correct |
| `/api/storage/[...path]` proxy | Calls `getUser()` before serving; 13-bucket allowlist; 401 on unauth | ✅ Correct |
| Signed URL expiry | Proxy: 60s · Export: 300s · Artwork OG: 3600s · Upload link: 48hr (email flow) | ✅ Correct |
| Public share tokens | Opaque crypto token; validated with `share_token` + `is_public`; no anon RLS | ✅ Correct |
| `/api/invite` | Rate-limited (strictLimiter 5/min); token ≥ 10 chars; 404 on invalid | ✅ Correct |
| `/api/export` | Auth + family scoping + Legacy-plan gate + 750 MB cap + Supabase-only SSRF allowlist | ✅ Correct |
| `/api/search` | Auth + `activeFamilyId` scoping + sealed capsules filtered (`unlock_date ≤ now`) | ✅ Correct |
| `/api/notifications` | `CRON_SECRET` header required | ✅ Correct |
| `/api/stripe/webhook` | Signature verified via `constructEvent()` + raw body | ✅ Correct |
| Resend email sends | Sent individually (no bulk `to: []` arrays that would expose recipients to each other) | ✅ Correct |
| Invite token URL | Opaque UUID used (not PII-in-querystring) for all current invites | ✅ Correct |
| Rate limiting | strictLimiter (5/min) on auth + checkout; defaultLimiter (30/min) on all others | ✅ Correct |
| Middleware | `/dashboard/*` protected; redirects unauthenticated users to `/login` | ✅ Correct |

### Internal Privacy / Role Enforcement

| Surface | Finding | Status |
|---|---|---|
| `FamilyContext` default role | Defaults to `"teen"` (least-privilege) | ✅ Correct |
| `layout.tsx` default role | Defaults to `"teen"` | ✅ Correct |
| `/api/nest-keepers` all methods | GET + POST + PUT + DELETE all require `role = 'owner'` | ✅ Correct |
| Journal `author_override` | Restricted to `owner`/`adult` in Server Action | ✅ Correct |
| Member management actions | `requireRole()` called before all mutations | ✅ Correct |
| Account deletion | `requestAccountDeletion` uses `auth.uid() = user_id` RLS; user can only delete own account | ✅ Correct |
| Relationship actions | Auth-gated via `getUser()` before all mutations | ✅ Correct |
| Trophy/achievement actions | `requireRole()` enforced | ✅ Correct |
| Time capsule list | Sealed capsules (`unlock_date > now`) hidden from non-creators in list and search | ✅ Correct |
| One-line journal | Scoped to `user_id = auth.uid()` — fully private, not family-shared | ✅ Correct |
| Voice memo RLS | Family-scoped RLS; proxy auth required for audio files | ✅ Correct |

### RLS Table Coverage

| Table | Family-scoped | Anonymous access | Status |
|---|---|---|---|
| families | own only | none | ✅ |
| family_members | ✓ | none | ✅ |
| journal_entries | ✓ | none | ✅ |
| journal_photos | ✓ | none | ✅ |
| journal_videos | ✓ | none | ✅ |
| voice_memos | ✓ | none | ✅ |
| family_stories | ✓ | share token only (service-role) | ✅ |
| recipes | ✓ | share token only (service-role) | ✅ |
| time_capsules | ✓ | none | ✅ |
| one_line_entries | user-private | none | ✅ |
| nest_keepers | ✓ | none | ✅ |
| home_mosaic_photos | ✓ | family_id IS NULL only | ✅ |
| travel_locations | ✓ | none | ✅ |
| achievements | ✓ | none | ✅ |
| family_traditions | ✓ | none | ✅ |
| family_events | ✓ | none | ✅ |
| storage_addons | ✓ | none | ✅ |
| account_deletion_requests | user-private | none | ✅ |
| user_preferences | user-private | none | ✅ |

---

## Low-Priority Notes (Not Findings — Informational)

**Artwork upload signed URL (48hr):** Used to allow time for share-via-email workflow. Acceptable;
consider reducing to 24hr post-launch if email sends are consistently fast.

**Invite token query-param fallback:** Legacy backup path includes PII in URL. Already deprecated
in favour of opaque UUID token. Safe to remove the fallback once confirmed no legacy clients depend on it.

**Rate limit fail-open:** If Upstash is unavailable, rate limiting degrades gracefully (logs error,
continues). Acceptable for resilience; consider alerting in production if this occurs frequently.
