# Family Nest — Master TODO

> **Living document.** Update this every session. Check items off as they're completed.
> Last updated: 2026-02-21

---

## BLOCKING: DECIDE BEFORE LAUNCH

### Pricing (decide first — affects constants, emails, and copy)

- [ ] **Finalize Annual price** — Currently `$49/yr` in code and emails. Discussed `$79/yr` (50 GB storage). Competitor range: $45–$99/yr
- [ ] **Finalize Legacy price** — Currently `$349` in code. Discussed `$499` (200 GB storage) to keep breakeven ~6.3 years vs annual
- [ ] **Update `src/lib/constants.ts`** — Change `annual.storageLimitBytes` (currently 2 GB → 50 GB) and `legacy.storageLimitBytes` (currently 5 GB → 200 GB)
- [ ] **Update pricing page** — New prices, storage numbers
- [ ] **Update Day 14 upgrade email** — `app/api/emails/templates/drip.ts` references "$49/year" — must match final price
- [ ] **Update HeroSection / EmotionalSection** — Check for any hardcoded price references

### Stripe Setup (can't charge without this)

- [ ] Create Stripe account (or configure existing one)
- [ ] Create product **"The Full Nest"** with recurring price ($XX/year) → copy Price ID
- [ ] Create product **"The Legacy"** with one-time price ($XXX) → copy Price ID
- [ ] Add webhook endpoint in Stripe Dashboard: `https://yourdomain.com/api/stripe/webhook`
- [ ] Subscribe to events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Copy webhook signing secret

### Vercel Environment Variables (set all of these)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_PRICE_LEGACY=price_...
SUPABASE_SERVICE_ROLE_KEY=...      (may already be set)
CRON_SECRET=<random string>        (may already be set)
RESEND_API_KEY=...                 (may already be set)
RESEND_FROM_EMAIL=Family Nest <hello@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://ourfamilynest.com
NEXT_PUBLIC_FEEDBACK_EMAIL=support@ourfamilynest.com
OPENAI_API_KEY=...
UPSTASH_REDIS_REST_URL=...         (new — for API rate limiting)
UPSTASH_REDIS_REST_TOKEN=...       (new — for API rate limiting)
```

---

## BLOCKING: DOMAIN & DNS

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

## CODE TASKS

### High Priority
- [ ] **Vercel Cron configuration** — Verify `vercel.json` has the cron schedule for `/api/notifications` at 14:00 UTC

### Medium Priority
- [ ] **Stripe customer portal styling** — Configure branding in Stripe Dashboard to match app theme
- [ ] **PWA manifest** — `manifest.ts` for mobile "Add to Home Screen" install
- [ ] **Error monitoring** — Sentry integration (currently only Vercel Analytics + Speed Insights)

### Low Priority / Post-Launch
- [ ] Dynamic OG images per page (`opengraph-image.tsx`)
- [ ] Referral program (invite a family, get X)
- [ ] Invoice/receipt emails after payment
- [ ] Account deletion self-serve (currently manual via email)

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
- [ ] Visit pricing → click Legacy → Stripe checkout loads → complete test payment → Annual sub cancelled automatically
- [ ] Settings → Manage Billing → Stripe portal loads
- [ ] Settings → toggle email notifications off → verify no emails sent
- [ ] Downgrade/cancel → plan reverts to free
- [ ] Visit /nonexistent-page → 404 page shows
- [ ] Check /robots.txt and /sitemap.xml load correctly
- [ ] Test on iPhone Safari, Android Chrome, Desktop Chrome/Firefox
- [ ] Check page speed: Lighthouse score > 90 on homepage

---

## LAUNCH DAY

- [ ] Switch Stripe from test mode to live mode
- [ ] Update all STRIPE_* env vars to live keys
- [ ] Update UPSTASH_* env vars (Upstash free tier — create account at upstash.com)
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
- [ ] Consider Product Hunt launch
- [ ] Blog / content marketing
- [ ] Social proof: collect real testimonials to replace placeholders

---

## COMPLETED

### Phase 1: Core App ✅
- All 23 dashboard features built
- Supabase schema, RLS, storage
- Auth flow (signup, login, forgot password)
- Role-based access & plan gating
- Vercel deployment pipeline

### Phase 2: Landing Page CRO ✅
- Testimonials, FAQ, HeroSection, EmotionalSection
- Price breakdowns on pricing cards
- Landing page conversion funnel order
- Google Fonts via next/font
- JSON-LD FAQ schema on pricing page
- Canonical URLs on pricing, terms, privacy pages
- metadataBase set in root layout

### Phase 3: Email Automation ✅
- Welcome email on signup
- Drip campaigns: Day 1, 3, 5, 14, 30
- Birthday reminders (3 days before)
- Time capsule unlock notifications
- Weekly digest (Sundays)
- Email notification opt-out toggle in Settings

### Phase 4: AI Features ✅
- Voice memo transcription (Whisper)
- Recipe URL parsing (GPT-4o-mini)
- Journal writing prompts (GPT-4o-mini)
- Rate limiting (10 AI calls/family/day)

### Phase 5: Testing & QA ✅
- 170+ test case checklist created
- 137 automated unit tests (roles, plans, email templates, security logic)
- Build passes clean (46/46 pages)

### Phase 6: Launch Preparation ✅ (code done, config pending)
- Stripe checkout, webhook, billing portal
- Stripe Annual → Legacy upgrade path (auto-cancels old subscription)
- UpgradeButton + ManageBilling components
- Payment success + cancelled UI feedback
- Rate limiting on `/api/stripe/checkout`, `/api/search`, `/api/export` (Upstash Redis)
- CRON_SECRET security fix (now required — not optional)
- Email templates extracted to `app/api/emails/templates/`
- 404 page, robots.ts, sitemap.ts
- Security headers (HSTS, X-Frame-Options, etc.)
- Email unsubscribe links (CAN-SPAM)
- Vercel Analytics + Speed Insights
- Privacy Policy, Terms of Service
- DB migration: stripe columns on families table
- DB migration: email_notifications flag on family_members
