# Our Family Nest — Master TODO

> **Living document.** Update this every session. Check items off as they're completed.
> Last updated: 2026-02-17

---

## PRICING DECISION (Blocking — decide before Stripe setup)

- [ ] **Finalize Annual price** — Currently $49/yr in code. Discussed raising to **$79/yr** (50 GB storage). Competitor range: $45–$99/yr
- [ ] **Finalize Legacy price** — Currently $349 in code. Discussed raising to **$499** (200 GB storage) to keep breakeven at ~6.3 years vs annual
- [ ] **Update constants.ts** — Change `annual.storageLimitBytes` (currently 2 GB → 50 GB) and `legacy.storageLimitBytes` (currently 5 GB → 200 GB)
- [ ] **Update pricing page** — New prices, new breakdowns, new storage numbers
- [ ] **Update Day 14 upgrade email** — References "$4.08/month" which needs to match final price
- [ ] **Update HeroSection / EmotionalSection** — Any price references in landing page copy

---

## STRIPE SETUP (Blocking — can't charge without this)

- [ ] Create Stripe account (or configure existing one)
- [ ] Create product "The Full Nest" with recurring price ($XX/year) → copy Price ID
- [ ] Create product "The Legacy" with one-time price ($XXX) → copy Price ID
- [ ] Add webhook endpoint in Stripe Dashboard: `https://yourdomain.com/api/stripe/webhook`
- [ ] Subscribe to events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Copy webhook signing secret

### Vercel Environment Variables (set all of these):

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_PRICE_LEGACY=price_...
```

---

## ENVIRONMENT VARIABLES (Blocking — needed for production)

- [ ] `STRIPE_SECRET_KEY` — From Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` — From Stripe webhook endpoint
- [ ] `STRIPE_PRICE_ANNUAL` — Price ID from Stripe
- [ ] `STRIPE_PRICE_LEGACY` — Price ID from Stripe
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — From Supabase Dashboard (may already be set)
- [ ] `CRON_SECRET` — Random string for cron auth (may already be set)
- [ ] `RESEND_API_KEY` — From Resend Dashboard (may already be set)
- [ ] `RESEND_FROM_EMAIL` — e.g. `Our Family Nest <hello@yourdomain.com>`
- [ ] `NEXT_PUBLIC_APP_URL` — e.g. `https://ourfamilynest.com`
- [ ] `NEXT_PUBLIC_FEEDBACK_EMAIL` — e.g. `support@ourfamilynest.com`
- [ ] `OPENAI_API_KEY` — For AI features (transcription, recipe parsing, prompts)

---

## DOMAIN & DNS

- [ ] Purchase domain (ourfamilynest.com or similar)
- [ ] Point DNS to Vercel
- [ ] Configure custom domain in Vercel project settings
- [ ] Verify SSL certificate is active
- [ ] Update `NEXT_PUBLIC_APP_URL` env var
- [ ] Update `metadataBase` in `app/layout.tsx` to real domain
- [ ] Update OpenGraph URLs in `app/layout.tsx`
- [ ] Update Resend verified sender domain

---

## HOMEPAGE & MOSAIC

- [ ] Add real family photos to mosaic folder on Desktop
- [ ] Wire photos into FamilyMosaic component
- [ ] Verify mosaic looks good on mobile, tablet, desktop
- [ ] Review all landing page copy with real photos in context

---

## CODE TASKS (Not yet started)

### High Priority
- [ ] **Stripe prorated upgrade** — Annual→Legacy upgrade currently not handled (FAQ says it is)
- [ ] **Email unsubscribe preference** — Unsubscribe link goes to /settings but there's no actual toggle to disable emails
- [ ] **Rate limiting on public API routes** — `/api/stripe/checkout`, `/api/search`, etc. have no rate limiting
- [ ] **Vercel Cron configuration** — Add `vercel.json` cron schedule for `/api/notifications` (or verify it exists)

### Medium Priority
- [ ] **Payment success UI** — Settings page receives `?payment=success` query param but doesn't show a success message
- [ ] **Payment cancelled UI** — Pricing page receives `?payment=cancelled` but doesn't show feedback
- [ ] **Stripe customer portal styling** — Configure branding in Stripe Dashboard to match app theme
- [ ] **PWA manifest** — `manifest.ts` for mobile "Add to Home Screen" install
- [ ] **Error monitoring** — Sentry integration (currently only Vercel Analytics + Speed Insights)

### Low Priority / Post-Launch
- [ ] Dynamic OG images per page (`opengraph-image.tsx`)
- [ ] Referral program (invite a family, get X)
- [ ] Annual plan prorated upgrades via Stripe
- [ ] Invoice/receipt emails after payment
- [ ] Account deletion self-serve (currently manual via email)

---

## COMPLETED PHASES

### Phase 1: Core App ✅
- [x] All 23 dashboard features built
- [x] Supabase schema, RLS, storage
- [x] Auth flow (signup, login, forgot password)
- [x] Role-based access & plan gating
- [x] Vercel deployment pipeline

### Phase 2: Landing Page CRO ✅
- [x] Testimonials component
- [x] Homepage FAQ component
- [x] HeroSection trust signal ("Join 500+ families")
- [x] EmotionalSection trust badges
- [x] Price breakdowns on pricing cards
- [x] Landing page conversion funnel order

### Phase 3: Email Automation ✅
- [x] Welcome email on signup
- [x] Day 1 activation nudge
- [x] Day 3 feature discovery
- [x] Day 5 invite encouragement
- [x] Day 14 upgrade prompt
- [x] Day 30 re-engagement
- [x] Birthday reminders (3 days before)
- [x] Time capsule unlock notifications
- [x] Weekly digest (Sundays)

### Phase 4: AI Features ✅
- [x] Voice memo transcription (Whisper)
- [x] Recipe URL parsing (GPT-4o-mini)
- [x] Journal writing prompts (GPT-4o-mini)
- [x] Rate limiting (10 AI calls/family/day)
- [x] Transcription UI (button, display, retry)
- [x] URL import UI (input, parse, auto-fill)
- [x] Writing prompts UI (generate, click-to-insert)

### Phase 5: Testing & QA ✅
- [x] 170+ test case checklist created
- [x] Fixed storage_url → audio_url mismatch
- [x] Fixed missing drip campaigns (Days 3, 5, 14, 30)
- [x] Added AI feature UI that was missing
- [x] Build passes clean (46/46 pages)

### Phase 6: Launch Preparation ✅ (code done, config pending)
- [x] Stripe checkout API route
- [x] Stripe webhook handler
- [x] Stripe billing portal
- [x] UpgradeButton + ManageBilling components
- [x] 404 page (not-found.tsx)
- [x] robots.ts + sitemap.ts
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] Email unsubscribe links (CAN-SPAM)
- [x] Vercel Analytics + Speed Insights
- [x] Privacy Policy (10 sections)
- [x] Terms of Service (13 sections)
- [x] DB migration: stripe columns on families table
- [x] Google Fonts loaded via next/font (Inter, DM Sans, DM Serif, Cormorant, Bangers)
- [x] JSON-LD FAQ schema on pricing page
- [x] Canonical URLs on pricing, terms, privacy
- [x] metadataBase set in root layout

---

## MANUAL TESTING BEFORE LAUNCH

> Do these yourself on phone + desktop once all blocking items above are done.

- [ ] Sign up as new user → lands on dashboard → welcome email received
- [ ] Upload photo → appears in gallery
- [ ] Create journal entry → appears in timeline
- [ ] Record voice memo → playback works → transcribe works
- [ ] Add recipe via URL → auto-fills form
- [ ] Get writing prompts → click to insert → save journal
- [ ] Create time capsule with future unlock date
- [ ] Invite a family member → they sign up → see shared content
- [ ] Visit pricing → click Annual → Stripe checkout loads → complete test payment
- [ ] Visit pricing → click Legacy → Stripe checkout loads → complete test payment
- [ ] Settings → Manage Billing → Stripe portal loads
- [ ] Downgrade/cancel → plan reverts to free
- [ ] Visit /nonexistent-page → 404 page shows
- [ ] Check /robots.txt and /sitemap.xml load correctly
- [ ] Test on iPhone Safari, Android Chrome, Desktop Chrome/Firefox
- [ ] Check page speed: Lighthouse score > 90 on homepage

---

## LAUNCH DAY

- [ ] Switch Stripe from test mode to live mode
- [ ] Update all STRIPE_* env vars to live keys
- [ ] Verify webhook endpoint works with live mode
- [ ] Test one real $1 payment and refund it
- [ ] Announce to family / beta testers
- [ ] Monitor Vercel Analytics for errors
- [ ] Check Supabase dashboard for any RLS issues

---

## POST-LAUNCH (Phase 7+)

- [ ] Monitor retention and conversion metrics
- [ ] Set up Stripe revenue dashboard
- [ ] A/B test pricing page copy
- [ ] Consider Sentry for error tracking
- [ ] Consider referral program
- [ ] Consider Product Hunt launch
- [ ] Blog / content marketing
- [ ] Social proof: collect real testimonials to replace placeholders
