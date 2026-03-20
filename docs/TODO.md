# Family Nest — Master TODO

> **Living document.** Update this every session. Check items off as they're completed.
> Last updated: 2026-03-20

---

## BLOCKING: DECIDE BEFORE LAUNCH

### Stripe Setup (can't charge without this)

- [ ] Create Stripe account (or configure existing one)
- [ ] Create product **"The Full Nest — Monthly"** with recurring price ($9.99/mo) → copy Price ID → set as `STRIPE_PRICE_MONTHLY`
- [ ] Create product **"The Full Nest — Annual (Founding)"** with recurring price ($49/yr) → copy Price ID → set as `STRIPE_PRICE_ANNUAL_FOUNDING`
- [ ] Create product **"The Full Nest — Annual"** with recurring price ($79/yr) → copy Price ID → set as `STRIPE_PRICE_ANNUAL`
- [ ] Create product **"The Legacy"** with one-time price ($349) → copy Price ID → set as `STRIPE_PRICE_LEGACY`
- [ ] Create storage add-on products: $9/yr (+25 GB), $24/yr (+75 GB), $49/yr (+150 GB) → set `STRIPE_PRICE_STORAGE_25/75/150`
- [ ] Add webhook endpoint in Stripe Dashboard: `https://familynest.io/api/stripe/webhook`
- [ ] Subscribe to events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
- [ ] Copy webhook signing secret → set as `STRIPE_WEBHOOK_SECRET`

### Vercel Environment Variables (set all of these)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_PRICE_ANNUAL_FOUNDING=price_...
STRIPE_PRICE_LEGACY=price_...
STRIPE_PRICE_STORAGE_25=price_...
STRIPE_PRICE_STORAGE_75=price_...
STRIPE_PRICE_STORAGE_150=price_...
SUPABASE_SERVICE_ROLE_KEY=...      (may already be set)
CRON_SECRET=<random string>        (may already be set)
RESEND_API_KEY=...                 (may already be set)
RESEND_FROM_EMAIL=Family Nest <hello@familynest.io>
NEXT_PUBLIC_APP_URL=https://familynest.io
NEXT_PUBLIC_FEEDBACK_EMAIL=support@familynest.io
OPENAI_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## BLOCKING: DOMAIN & DNS

- [x] ~~Purchase domain~~ — familynest.io is live
- [x] ~~Point DNS to Vercel~~ — configured
- [x] ~~Configure custom domain in Vercel project settings~~ — done
- [x] ~~Verify SSL certificate is active~~ — active
- [ ] Update `NEXT_PUBLIC_APP_URL` env var to `https://familynest.io`
- [ ] Update `metadataBase` in `app/layout.tsx` if still pointing to placeholder domain
- [ ] Update Resend verified sender domain to `@familynest.io`

---

## HOMEPAGE & MOSAIC

- [ ] Add real family photos to mosaic folder on Desktop
- [ ] Wire photos into FamilyMosaic component
- [ ] Verify mosaic looks good on mobile, tablet, desktop
- [ ] Review all landing page copy with real photos in context

---

## CODE TASKS

### High Priority
- [ ] **Vercel Cron configuration** — Verify `vercel.json` has the cron schedule for `/api/notifications` at 14:00 UTC and `/api/daily-report`

### Medium Priority
- [ ] **Stripe customer portal styling** — Configure branding in Stripe Dashboard to match app theme
- [ ] **PWA manifest** — `manifest.ts` for mobile "Add to Home Screen" install
- [ ] **Error monitoring** — Sentry integration (currently only Vercel Analytics + Speed Insights)
- [ ] **Day 14 upgrade email** — `app/api/emails/templates/drip.ts` — verify price references match current pricing ($79/yr annual, $9.99/mo monthly, $49/yr founding)

### Low Priority / Post-Launch
- [ ] Dynamic OG images per page (`opengraph-image.tsx`)
- [ ] Referral program (invite a family, get X)
- [ ] Invoice/receipt emails after payment
- [ ] G7 (Deferred) — Member profile photos: client-side upload bypasses storage gates; complex refactor needed

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
- [ ] Visit pricing → click Monthly → Stripe checkout loads → complete test payment → Settings shows "Monthly" plan with $9.99/month badge
- [ ] Visit pricing → click Annual (Founding) → Stripe checkout loads → complete test payment → Settings shows "Full Nest" with $49/year badge
- [ ] Visit pricing → click Legacy → Stripe checkout loads → complete test payment → Annual sub cancelled automatically
- [ ] Settings → Manage Billing → Stripe portal loads
- [ ] Settings → toggle email notifications off → verify no emails sent
- [ ] Downgrade/cancel → plan reverts to free
- [ ] Account deletion → request deletion → cancel it → verify grace period flow
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
- [ ] Facebook ad Campaign 2 ("The Smirk") — launch once Rob films his video

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

### Phase 6: Launch Preparation ✅ (code done, Stripe config pending)
- Stripe checkout, webhook, billing portal
- Monthly plan ($9.99/mo) + Founding rate ($49/yr) + Annual ($79/yr) + Legacy ($349 one-time)
- Free plan: unlimited features — storage (500 MB) and members (6) are the only caps
- Annual plan: 20 GB storage; Legacy: 50 GB storage
- Storage add-ons: +25 GB ($9/yr), +75 GB ($24/yr), +150 GB ($49/yr)
- Stripe Annual → Legacy upgrade path (auto-cancels old subscription)
- UpgradeButton + ManageBilling components
- Payment success + cancelled UI feedback
- Rate limiting on all key endpoints (Upstash Redis)
- CRON_SECRET security on cron endpoints
- Email templates extracted to `app/api/emails/templates/`
- 404 page, robots.ts, sitemap.ts
- Security headers (HSTS, X-Frame-Options, CSP, etc.)
- Email unsubscribe links (CAN-SPAM)
- Vercel Analytics + Speed Insights
- Privacy Policy, Terms of Service
- DB migrations: Stripe columns, email_notifications flag, pricing overhaul

### Phase 6b: Dashboard & UX Polish ✅
- Dashboard themes (ThemePicker)
- Stats redesign + plan badges (PlanLimitBadge with null=unlimited support)
- Account deletion self-serve (30-day grace period, cancellable)
- Mobile nav improvements
- Empty states across all feature modules
- Onboarding flow improvements
- Landing page refresh

### Security & Billing Hardening ✅ (2026-03-05 through 2026-03-20)
- All S1–S11 security findings resolved (see docs/SECURITY_FINDINGS.md)
- All G1–G19, B1–B7 billing findings resolved (see docs/BILLING_FINDINGS.md)
- Re-audited 2026-03-12 and 2026-03-20 — zero new findings after fixes

### Facebook Ad Campaign ✅ (active, running)
- Campaign 1 "The Heart" live — Rick voicemail story, $5 CAD/day
- Campaign 2 "The Smirk" copy written — waiting on Rob's video to launch
