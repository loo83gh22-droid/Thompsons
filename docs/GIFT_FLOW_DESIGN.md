# Gift Purchase Flow — Design Doc

**Status:** Draft for review
**Author:** Claude (with @keepitgreen)
**Date:** 2026-05-06
**Scope:** Add a real "buy as a gift" flow distinct from "sign up and share login"

---

## 1 — Problem

The current gift experience asks the buyer to create an account *as themselves*, configure the Nest, and then physically hand over their own login credentials. The Daniel R. testimonial accurately describes this workflow but it's a workaround, not a gift mechanism. Specifically:

- Buyer's identity is the account owner — recipient logs in *as the buyer*, not as themselves.
- No proactive ownership transfer from buyer → recipient.
- Recipient ends up sharing the buyer's credentials forever, or going through a Nest Keepers succession that only triggers after 12 months of inactivity.
- The `plan=legacy_founding` query param on the gift CTA was silently ignored until PR 125 added a small banner. There's no proper gift purchase route.
- No way to send the gift to someone who isn't already at a computer with the buyer.

## 2 — Goals

A gift purchase flow where:

1. **Buyer** can purchase Legacy for someone without creating an account themselves.
2. **Recipient** receives an email with a redemption link, sets their own password, and owns the Nest from day one.
3. **Buyer** gets a confirmation email and (optionally) a printable card if they prefer physical handoff.
4. The system is robust to: recipient already having an account, recipient never redeeming, payment failures, Stripe webhook retries.

Non-goals for v1:
- Bulk gifting (one gift per checkout).
- Gift status dashboard for the buyer (post-purchase visibility comes via email confirmations).
- Automated refunds for unredeemed gifts (manual via Stripe dashboard).
- "Gift back" if recipient declines (out of scope).

---

## 3 — User flow

### 3a — Buyer

1. Visitor lands on `/gift` (existing page), reads the pitch, clicks **Give the Gift of Family Nest**.
2. Lands on **`/gift/buy`** — a single-page form (no auth required):
   - Recipient name (required)
   - Recipient email (required)
   - Buyer name (required)
   - Buyer email (required)
   - Optional gift message (textarea, 500 chars)
   - "When should we email them?" — radio: *Right after payment* | *On a specific date* (date picker; v2 if not v1)
   - **Continue to payment** button
3. Click → POST to `/api/gift/checkout` → Stripe Checkout session opens.
4. Stripe collects payment ($249 Legacy founding rate). Buyer pays.
5. Success: redirect to **`/gift/sent`** confirmation page:
   - "Your gift is on its way to [recipient]."
   - "We've also sent you a copy of the redemption link in case you want to deliver it personally."
   - Optional: a printable card view (`/gift/sent?print=1`) showing the link + a styled gift card.
6. Buyer also receives email confirmation with a copy of the redemption link.

### 3b — Recipient

1. Email arrives: subject *"[Buyer name] gave you a Family Nest"*, branded HTML, optional gift message rendered prominently.
2. Click **Open your Nest** → lands on **`/gift/claim/[token]`**:
   - "✨ [Buyer name] gave you a Family Nest. Set a password to start adding memories."
   - Form: password + confirm password (email is pre-filled from the gift record, read-only).
   - Submit → account created, family created, Legacy plan applied, signed in, redirected to `/dashboard?welcome=gift`.
3. Special case — recipient already has an account at that email:
   - Show "You already have a Family Nest. Sign in to apply this Legacy upgrade to your existing nest."
   - Sign-in flow → on success, the `pending_gifts` row is "claimed" and Legacy is applied to their existing family.
4. The dashboard's first-load celebration includes a small "Gift from [buyer]" badge in the welcome message.

### 3c — Edge cases

| Case | Handling |
|---|---|
| Buyer enters their own email as recipient | Allowed (people self-gift via this flow). Single email lands in their inbox. |
| Recipient already has an account | Sign-in path applies upgrade to existing family (see 3b.3). |
| Payment fails | No `pending_gifts` row created (only created via webhook on `checkout.session.completed`). No email sent. Stripe shows payment failure. |
| Webhook fires twice (Stripe retry) | Idempotent: `stripe_session_id` unique constraint on `pending_gifts`. Second insert is no-op. |
| Recipient never clicks the link | Row stays `pending` forever (v1). v2: 90-day expiry + reminder emails at 7/30/60 days. |
| Recipient enters wrong password 5 times | Standard Supabase rate-limit (existing behavior). |
| Token leaked | Token is single-use and tied to a specific email. Anyone with the link can redeem only into the recipient's email account, since the redemption form requires creating an account at that email (Supabase email confirmation flow). |
| Refund requested by buyer | Manual: support refunds via Stripe dashboard, then runs an admin SQL update to mark the `pending_gifts` row `refunded`. Out of scope for v1. |

---

## 4 — Technical design

### 4a — Database schema

**New table: `pending_gifts`**

```sql
create table public.pending_gifts (
  id uuid primary key default gen_random_uuid(),
  redemption_token text not null unique,        -- crypto.randomBytes(32).toString('hex')

  buyer_email text not null,
  buyer_name text not null,

  recipient_email text not null,
  recipient_name text not null,

  gift_message text,                            -- nullable; max 500 chars enforced in API

  plan text not null default 'legacy',          -- 'legacy' | 'legacy_founding'
  stripe_session_id text not null unique,       -- idempotency key for webhook
  stripe_payment_intent_id text,
  amount_paid_usd numeric(10,2) not null,

  status text not null default 'pending',       -- 'pending' | 'redeemed' | 'expired' | 'refunded'

  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by_user_id uuid references auth.users(id) on delete set null,
  redeemed_into_family_id uuid references public.families(id) on delete set null,

  expires_at timestamptz not null default (now() + interval '365 days'),

  check (status in ('pending', 'redeemed', 'expired', 'refunded')),
  check (gift_message is null or char_length(gift_message) <= 500)
);

create index pending_gifts_token_idx on public.pending_gifts (redemption_token) where status = 'pending';
create index pending_gifts_recipient_idx on public.pending_gifts (lower(recipient_email)) where status = 'pending';
create index pending_gifts_session_idx on public.pending_gifts (stripe_session_id);
```

**RLS:** Service role only. No public read/write — all access goes through API routes that verify the redemption token.

### 4b — Routes

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/gift/buy` | GET (page) | Buyer form | None |
| `/api/gift/checkout` | POST | Create Stripe Checkout session with gift metadata | None (rate-limited) |
| `/api/stripe/webhook` | POST (existing) | On `checkout.session.completed` with `gift=true` metadata: insert `pending_gifts` row, send recipient email, send buyer confirmation | Stripe signature |
| `/gift/sent` | GET (page) | Buyer confirmation + optional printable card view | None |
| `/gift/claim/[token]` | GET (page) | Recipient redemption form | None |
| `/api/gift/claim` | POST | Recipient: create account OR upgrade existing family | None (token in body) |

### 4c — Stripe metadata convention

When the checkout session is created via `/api/gift/checkout`, the metadata includes:

```ts
{
  gift: "true",
  plan: "legacy" | "legacy_founding",
  buyer_email: string,
  buyer_name: string,
  recipient_email: string,
  recipient_name: string,
  gift_message: string,        // empty string if omitted
}
```

This metadata is set on both the session and the `payment_intent_data` so it's available regardless of which event the webhook handles.

### 4d — Webhook flow extension

In `app/api/stripe/webhook/route.ts`, the existing `checkout.session.completed` handler gets a branch:

```ts
if (session.metadata?.gift === "true") {
  // Insert pending_gifts row (idempotent on stripe_session_id)
  // Generate redemption_token
  // Send recipient email (Resend)
  // Send buyer confirmation email (Resend)
  return; // do NOT proceed to activatePlan — that happens at redemption
}

// Existing flow for self-purchase continues unchanged
```

**Important:** the `activatePlan` call in the existing webhook is *only* for self-purchases. Gift purchases defer plan activation until redemption.

### 4e — Redemption flow

`POST /api/gift/claim`:

1. Verify the token is valid + status is `pending`.
2. Look up `recipient_email` from the `pending_gifts` row.
3. Branch:
   - **New user path:** call Supabase `auth.signUp` with the recipient_email + password. On success, create a new `families` row with `plan_type = 'legacy'`, `storage_limit_bytes = 10GB`, `plan_started_at = now()`, `plan_expires_at = null`. Add the recipient as the owner.
   - **Existing user path:** redirect to `/login?next=/gift/claim/[token]&existing_user=true`. After they sign in, the page reposts the claim, and the API attaches Legacy to their existing primary family.
4. Update `pending_gifts`: `status = 'redeemed'`, `redeemed_at`, `redeemed_by_user_id`, `redeemed_into_family_id`.
5. Send buyer email: *"[Recipient] just opened your gift."*
6. Return 302 redirect to `/dashboard?welcome=gift`.

### 4f — Email templates (Resend)

Three new templates in `app/api/emails/templates/`:

1. **`gift-recipient.ts`** — sent to recipient on purchase. Subject: *"[Buyer] gave you a Family Nest"*. Body: short pitch, gift message (if provided), big "Open your Nest" button → `/gift/claim/[token]`.
2. **`gift-buyer-confirmation.ts`** — sent to buyer on purchase. Subject: *"Your gift to [recipient] is on its way"*. Body: confirmation, copy of the redemption link in case they want to deliver personally, link to printable card view.
3. **`gift-buyer-redeemed.ts`** — sent to buyer when recipient redeems. Subject: *"[Recipient] just opened your gift"*. Body: celebration, link to send a follow-up message.

All three use the existing `emailWrapper` + `card` + `ctaButton` helpers in `app/api/emails/templates/shared.ts`.

---

## 5 — Phased delivery plan

Each phase is a separate PR. Each is independently shippable and reversible.

### Phase A — Schema + plan doc (this PR)

- Add `pending_gifts` table migration (additive-safe; no destructive operations)
- Add TS types for the new table in `src/lib/types.ts` or similar
- Commit this design doc

**Risk:** zero. Pure additions.
**Effort:** 1 hour.

### Phase B — Buyer flow

- Build `/gift/buy` page (form)
- Build `/api/gift/checkout` route (extends existing Stripe checkout pattern)
- Set gift metadata on the checkout session
- Build `/gift/sent` confirmation page

At end of Phase B: buyer can fill the form, complete payment, and sees a confirmation page. **No emails sent yet, no `pending_gifts` row created** (because Phase C handles the webhook side). For testing: buyer can use Stripe test cards; the success page is the only feedback.

**Risk:** low. Doesn't touch existing checkout flow. Existing self-purchase path unchanged.
**Effort:** 2-3 hours.

### Phase C — Webhook + recipient email

- Extend `/api/stripe/webhook` to handle `checkout.session.completed` with `gift=true`
- Create `pending_gifts` row idempotently
- Generate redemption token
- Send recipient email
- Send buyer confirmation email

At end of Phase C: end-to-end purchase works for the buyer. Recipient gets an email with a link, but the link goes nowhere yet (Phase D).

**Risk:** medium. Touches the production webhook. Mitigate with a dedicated test path: gift purchases go through but the new branch can be feature-flagged to no-op on production until Phase D ships.
**Effort:** 2-3 hours.

### Phase D — Recipient redemption

- Build `/gift/claim/[token]` page (form for new account creation)
- Build `/api/gift/claim` route (handles account creation, family creation, plan activation)
- Handle existing-user path (redirect to login with claim resume)
- Send buyer "redeemed" email

At end of Phase D: full end-to-end gift flow works. Buyer pays → recipient redeems → recipient owns a Legacy Nest.

**Risk:** medium. Creates new users + families. Test extensively in staging.
**Effort:** 4-5 hours.

### Phase E — Polish (optional, after end-to-end works)

- Printable card view (`/gift/sent?print=1`) with print-specific CSS
- Better dashboard onboarding for gifted accounts (`/dashboard?welcome=gift` shows a small "from [buyer]" celebration)
- Gift CTA on the home page (currently it's only on `/gift`)
- Refund admin tool (mark `pending_gifts` row as refunded)

**Risk:** low. UX/polish only.
**Effort:** 2-3 hours.

---

## 6 — Decisions (locked 2026-05-06)

All six open questions resolved by @keepitgreen — recommendations stand.

| # | Decision | Implementation impact |
|---|---|---|
| 1 | **Legacy only.** No Annual or Monthly gifts in v1. | `pending_gifts.plan` constraint stays `'legacy' \| 'legacy_founding'`. Buyer form has no plan picker. |
| 2 | **Founding rate honored.** Gifts during the founding window get the $249 price; reverts to $349 after. | Use same `STRIPE_PRICES.legacy_founding` / `STRIPE_PRICES.legacy` selection logic the existing checkout uses. |
| 3 | **No token expiry in v1.** Gifts stay `pending` indefinitely. Reminder emails + 90-day expiry deferred. | `expires_at` column exists in schema as a future-proofing safety net but isn't checked in v1 code. |
| 4 | **Existing-user redemption upgrades the family where they have `role = 'owner'`.** Multi-family owners get a picker. | Recipient's primary owner family is auto-detected at claim time. |
| 5 | **Buyer email not verified.** Stripe receipt is the canonical confirmation. | `/gift/buy` form accepts buyer email as-is, no double-opt-in step. |
| 6 | **Refunds: manual via Stripe dashboard for v1**, plus a clear refund policy on the buyer form. | See §7 below. |

## 7 — Refund policy (v1)

Surfaced clearly on the `/gift/buy` form, just above the payment button:

> *"Gifts are refundable any time before the recipient redeems them. After redemption, all sales are final."*

**Operationally:**
- Pre-redemption refund request → support flips `pending_gifts.status` to `'refunded'` + processes refund via Stripe dashboard. No self-serve UI in v1.
- Post-redemption refund request → declined politely with reference to the policy. Edge cases handled by hand.
- Chargebacks (bank-initiated disputes) → standard Stripe dispute flow; we don't fight policy-only chargebacks since the chargeback fee ($15) plus original processing fee almost always exceeds the refund.

**What this changes in code:** one line of copy on the buyer form. The data model already supports `'refunded'` status. No automation needed for v1.

---

## 7 — Effort estimate

| Phase | Effort | Cumulative |
|---|---|---|
| A — Schema + doc | 1 hr | 1 hr |
| B — Buyer form + checkout | 2-3 hr | 3-4 hr |
| C — Webhook + recipient email | 2-3 hr | 5-7 hr |
| D — Recipient redemption | 4-5 hr | 9-12 hr |
| E — Polish | 2-3 hr | 11-15 hr |
| **Total** | | **~12-15 hours** |

This is meaningfully smaller than the "1-2 weeks" rough estimate — that was a conservative outside view. The actual surface area is contained.

---

## 8 — What this PR does

This PR ships **only Phase A**:

- Adds `supabase/migrations/[timestamp]_pending_gifts.sql` — additive-safe migration creating the `pending_gifts` table
- Commits this design doc
- No user-facing changes
- No Stripe code touched yet
- No emails sent

After review and approval, I ship Phase B as a separate PR. Each phase is gated on the prior phase being merged + verified.
