# FamilyNest — Disaster Recovery Guide

> **Scenario:** Your laptop is gone tomorrow with no warning. Your phone, password manager, and email logins still work. You need to rebuild from a brand-new machine.
>
> **TL;DR:** If you can sign into **GitHub + Vercel + Supabase + your password manager**, you can have the site running on a new laptop in ~30 minutes. The site itself never went down — Vercel kept serving production traffic the whole time.
>
> **Last reviewed:** 2026-05-31. Re-read every quarter or whenever a new service is added.

---

## §1 — Accounts & Credentials Inventory

These are every external service the project depends on. Login emails marked `<CONFIRM>` need you (Rob) to fill in the actual answer — I don't have visibility into your account ownership across all of them.

### Tier-1 (catastrophic if lost)

| Service | Dashboard URL | Login email | What it holds | Notes |
|---|---|---|---|---|
| **GitHub** | https://github.com | `<CONFIRM — likely waterloo1983hawk22@gmail.com>` | All source code + history | Repo: `loo83gh22-droid/Thompsons`. Lose access here and you'd need to recreate the project from your Vercel deployment artifacts. |
| **Vercel** | https://vercel.com/dashboard | `<CONFIRM>` | Hosting, env vars, deployment history | Project: `family-site` (or `thompsons`). All env-var values live here. |
| **Supabase** | https://supabase.com/dashboard/project/tstbngohenxrbqroejth | `<CONFIRM>` | Customer database, auth users, file storage | Project ID `tstbngohenxrbqroejth`. **This is the only copy of customer data.** |
| **Stripe** | https://dashboard.stripe.com | `<CONFIRM>` | All payments, customers, subscriptions, webhooks | Account in **live mode**. Lose access here and you can't see/refund payments. |

### Tier-2 (moderate impact)

| Service | Dashboard URL | Login email | What it holds | Notes |
|---|---|---|---|---|
| **Resend** | https://resend.com/overview | `<CONFIRM>` | Transactional email sending, custom domain (`send.familynest.io`) verification | Lose access and all email stops (signup confirmation, gift recipients, invites, lifecycle, digest). |
| **Domain registrar (familynest.io)** | `<CONFIRM — Vercel Domains, Cloudflare, GoDaddy, Namecheap, …>` | `<CONFIRM>` | DNS records, domain renewal | If the domain expires unattended, `familynest.io` stops resolving. Verify the auto-renew setting is on. |
| **Gmail (`waterloo1983hawk22@gmail.com`)** | https://mail.google.com | (password manager) | Hosts the `hello@familynest.io` **send-as alias** used for founder outreach | Per CLAUDE.md — without access here, can't send from the founder address. |
| **FamilyNest production login (`keepitgreen@live.ca`)** | https://familynest.io/login | (password manager) | Rob's "Thompson" family for dogfooding | Lose access → you'd recreate via Supabase admin (you control the auth DB anyway). |

### Tier-3 (low impact, easily recoverable)

| Service | Dashboard URL | Login email | What it holds | Notes |
|---|---|---|---|---|
| **OpenAI** | https://platform.openai.com | `<CONFIRM>` | API key for Whisper (voice transcription) + GPT-4o-mini (recipe parse, journal prompts) | Regenerate at /api-keys, swap in Vercel. AI features broken until done. |
| **Upstash** | https://console.upstash.com | `<CONFIRM>` | Redis used for rate limiting | Rate-limit data is ephemeral; regenerate token, swap in Vercel. |
| **Google Cloud (Maps API)** | https://console.cloud.google.com | `<CONFIRM>` | Google Maps API key for `/dashboard/map` | Regenerate key, swap in Vercel. Maps broken until done. |
| **GitHub CLI (`gh`)** | — | (uses GitHub token) | Local CLI authentication | Re-run `gh auth login` on the new machine. |
| **Anthropic / Claude Code** | https://console.anthropic.com | `<CONFIRM>` | Developer tool subscription | Reinstall, log back in. |

### Action items for Rob (do this NOW, before disaster)

- [ ] Fill in every `<CONFIRM>` above and commit the updated file. This is the actual point of the guide — until those answers are written down, you'd be guessing on the bad day.
- [ ] Confirm 2FA recovery codes for **every Tier-1 service** are saved to a password manager you can access from your phone (1Password, Bitwarden, Apple Passwords, etc.).
- [ ] Confirm your password manager itself has phone-accessible recovery (master password committed to memory, or written somewhere physical and safe).

---

## §2 — Environment Variables (Full Reference)

Every env var referenced anywhere in the code, grouped by sensitivity. **All values live in Vercel.** That's the source of truth.

### 🔴 Secrets (back these up — Sensitive ones can't be re-read from Vercel)

| Variable | Source | Backup priority |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | **Highest** — bypasses all RLS, full DB access |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys | High — controls money |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint signing secret | High — gift flow depends on this |
| `RESEND_API_KEY` | Resend → API Keys | Moderate — all email |
| `OPENAI_API_KEY` | OpenAI → API Keys | Low — AI features only |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → Database → REST API | Low |
| `UPSTASH_REDIS_REST_URL` | Upstash → Database → REST API | Low |
| `CRON_SECRET` | Arbitrary random string you chose | Low — regenerate freely |
| `CLAUDE_INBOX_TOKEN` | Arbitrary string you chose | Low — regenerate, also update Resend inbound webhook config |

### 🟡 Identifiers (not secret, but lose them = features break)

| Variable | Source |
|---|---|
| `STRIPE_PRICE_MONTHLY` | Stripe → Products → "The Full Nest – Monthly" → price ID |
| `STRIPE_PRICE_ANNUAL` | Stripe → Products → "The Full Nest – Annual" → price ID |
| `STRIPE_PRICE_ANNUAL_FOUNDING` | Stripe → Products → annual founding rate |
| `STRIPE_PRICE_LEGACY` | Stripe → Products → "Legacy" → $349 price ID |
| `STRIPE_PRICE_LEGACY_FOUNDING` | Stripe → Products → Legacy founding rate $249 |
| `STRIPE_PRICE_STORAGE_25` | Stripe → Storage add-on +25 GB ($9/yr) |
| `STRIPE_PRICE_STORAGE_75` | Stripe → Storage add-on +75 GB ($24/yr) |
| `STRIPE_PRICE_STORAGE_150` | Stripe → Storage add-on +150 GB ($49/yr) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud → APIs & Services → Credentials |
| `RESEND_FROM_EMAIL` | Hardcoded fallback: `Family Nest <hello@send.familynest.io>` |

### 🟢 Config (public, never secret)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://familynest.io` |
| `NEXT_PUBLIC_SITE_URL` | `https://familynest.io` |
| `ADMIN_NOTIFICATION_EMAIL` | The address that gets "🏠 New Family Nest signup" alerts |
| `ADMIN_REPORT_EMAIL` | The address that gets the daily report cron |
| `FEEDBACK_ADMIN_EMAIL` | The address that gets the in-app contact form |

### Recommended backup approach

For each 🔴 secret, **save a copy to your password manager** under an entry called "FamilyNest – env vars" or similar. This is especially important for any variable you've marked **Sensitive** in Vercel — once Sensitive, Vercel can no longer reveal the value to you, so if you lose the password-manager copy you'd have to rotate the key at the source.

---

## §3 — What's In The Cloud (Safe)

Everything below is recoverable from your accounts alone. No local files required.

| Asset | Lives in | How to recover |
|---|---|---|
| All source code, history, branches, PRs, issues | GitHub | `git clone` |
| Production deployment & history | Vercel | Already running, redeploy is automatic |
| Environment variables | Vercel | `vercel env pull .env.local` on a new machine |
| Customer DB (users, families, journals, etc.) | Supabase | Already running, nothing to "recover" — just sign in |
| Customer-uploaded photos / voice memos / cover images | Supabase Storage | Already running, accessible via dashboard |
| Database migrations history | Supabase (`supabase_migrations` schema) + `supabase/migrations/*.sql` in repo | Both copies; either is recoverable |
| Stripe customers, subscriptions, payments, webhook config | Stripe | Already running |
| Resend send logs, domain DNS verification | Resend | Already running |
| Domain DNS records | Domain registrar | Configured once, lives there forever |

---

## §4 — What Only Lives Locally (At Risk)

These are things that *could* be on your laptop only. If you've never thought about them, they're at risk.

### Definitely at risk (unrecoverable if not backed up)

1. **Uncommitted changes** — any file you've edited but not `git commit`ed. Run `git status` periodically to check.
2. **Unpushed branches** — feature branches that exist locally but never `git push`ed. Run `git push --all origin` periodically. Or check with `git branch -vv` (any branch without an `[origin/...]` tracking note is local-only).
3. **`git stash` entries** — work-in-progress saved with `git stash` but never restored or committed. Run `git stash list` to see them.
4. **`.env.local`** — usually mirrors Vercel, but if you've added a local-only override (test keys, debug flags), those values aren't elsewhere. Mitigated by `vercel env pull` if Vercel has the canonical copy.
5. **Draft documents / notes outside the repo** — anything in your Downloads, Desktop, OneDrive that you've been working on but haven't committed. The OneDrive sync (`C:\Users\keepi\OneDrive\Coding - Copy\Thompsons\family-site`) is your safety net here — verify it's actually syncing.
6. **Brand / marketing assets** — Facebook ad video files, Rick voicemail audio, hero photo originals, logo source files. Should be in OneDrive too, but worth verifying.
7. **Password manager backup** — if your master password is only in your head, you have one copy.

### Recoverable but painful

8. **Browser bookmarks and saved logins** — re-establish via Chrome sync / Safari iCloud / etc.
9. **Local Supabase CLI link** — re-run `supabase link --project-ref tstbngohenxrbqroejth` and authenticate.
10. **Local Vercel CLI link** — re-run `vercel link` in the project dir, choose the existing `family-site` project.

### Action items for Rob (do this NOW)

- [ ] Run `git status` and `git stash list` — commit or push anything stashed/uncommitted before something else happens
- [ ] Run `git push --all origin` to make sure every local branch exists on GitHub too
- [ ] Verify OneDrive is actively syncing the project folder (not paused, not full)
- [ ] Verify marketing assets (videos, audio, photos) are in OneDrive / iCloud / a cloud service, not Desktop-only
- [ ] Pick a password manager strategy if you don't already use one. Apple Passwords, 1Password, or Bitwarden all work. Make sure you can access it from your phone.

---

## §5 — Step-By-Step Recovery (Fresh Machine)

Assume you just took a brand-new Mac or Windows machine out of the box. Stay logged into your phone for 2FA codes and email recovery.

### Step 1 — Install developer tools (~10 min)

| Tool | Why | Download |
|---|---|---|
| **Node.js (v22 LTS or newer)** | Runs Next.js + npm | https://nodejs.org/ — pick the LTS download |
| **Git** | Source control | Comes with macOS by default; Windows: https://git-scm.com/download/win |
| **GitHub CLI (`gh`)** | Easier PR + repo management | https://cli.github.com/ |
| **Vercel CLI** | Pull env vars + deploy | `npm install -g vercel` after Node installs |
| **Supabase CLI** | Database migrations | https://supabase.com/docs/guides/local-development/cli/getting-started |
| **Claude Code** | The AI dev assistant we use | https://claude.com/claude-code |
| **A code editor** | VS Code, Cursor, or your preference | https://code.visualstudio.com/ |

### Step 2 — Sign in to accounts (~5 min)

- Open Chrome / Safari, sign into GitHub, Vercel, Supabase, Stripe, Resend, OpenAI, Upstash, Google Cloud (using §1 credentials)
- In a terminal:
  ```bash
  gh auth login
  vercel login
  supabase login   # if you'll work on migrations
  ```

### Step 3 — Clone the repo (~30 sec)

```bash
git clone https://github.com/loo83gh22-droid/Thompsons.git
cd Thompsons/family-site
```

### Step 4 — Pull environment variables (~30 sec)

```bash
vercel link              # choose "family-site" or whatever the project is named
vercel env pull .env.local
```

This copies all Vercel env vars (Production + Preview values) into a local `.env.local` file. **Sensitive-marked vars won't come down** — Vercel can't reveal those. You'll need to paste those manually from your password-manager backup. If you didn't back them up, regenerate at the source and re-save in Vercel (see §2).

### Step 5 — Install dependencies (~3 min)

```bash
npm install
```

### Step 6 — Run dev server (~30 sec)

```bash
npm run dev
```

Open http://localhost:3000. You should see the FamilyNest landing page.

### Step 7 — Verify everything works (~5 min)

| Check | What it tests |
|---|---|
| Landing page renders cleanly | Next.js + assets |
| Sign in as `keepitgreen@live.ca` works | Supabase auth + DB connectivity |
| Dashboard loads | DB + storage + middleware |
| `/dashboard/map` loads with markers | Google Maps API key |
| `/pricing` shows correct prices | Stripe price IDs |
| Try a journal entry → save → see it appear | Write path to Supabase |
| Visit `/api/notifications` with the CRON_SECRET — should return 401 without it, JSON results with it | Cron auth + Resend integration |

If all those check out, you're fully recovered. Production traffic was never affected — only your local dev environment changed.

---

## §6 — Deployment Pipeline

How a code change gets from your laptop to live users.

```
┌─────────────────────┐    git push      ┌────────────────────┐
│  Local working tree │ ───────────────▶ │  GitHub feature    │
│  (your laptop)      │                  │  branch            │
└─────────────────────┘                  └─────────┬──────────┘
                                                   │ gh pr create
                                                   ▼
                                         ┌────────────────────┐
                                         │  Pull Request      │
                                         │  + Vercel preview  │ ←─ auto-deployed to a
                                         │  deployment        │    preview URL
                                         └─────────┬──────────┘
                                                   │ gh pr merge
                                                   ▼
                                         ┌────────────────────┐
                                         │  main branch       │
                                         └─────────┬──────────┘
                                                   │ auto
                                                   ▼
                                         ┌────────────────────┐
                                         │  Vercel production │ ──▶ familynest.io
                                         │  deployment (~2m)  │     thompsons.vercel.app
                                         └────────────────────┘
```

### What's automated

- **Vercel preview deployment for every feature branch** — push a branch, get a preview URL within ~2 minutes
- **Vercel production deployment on merge to `main`** — happens automatically, no manual step

### What's manual

- **Migrations** (anything in `supabase/migrations/*.sql`):
  - CI workflow at `.github/workflows/supabase-migrations.yml` is **intentionally disabled** (see CLAUDE.md for the long explanation)
  - For every PR that adds a new migration file: apply via **Supabase MCP `apply_migration` tool BEFORE merging the PR**
  - Verify with `list_migrations` after applying
  - Pre-merge sanity check: `./scripts/check-pending-migrations.sh`
- **Stripe webhook endpoint signing secret rotation** — if you ever roll the webhook signing secret in Stripe, update `STRIPE_WEBHOOK_SECRET` in Vercel and redeploy. Gift flow depends on this.
- **DNS changes** — done once in the domain registrar, then automatic forever.

### Safety rules baked into the workflow

- Never push directly to `main` — always feature branch + PR + review
- Always wait for explicit user approval before merging (Rob's call, not Claude Code's)
- Migrations are applied to prod DB BEFORE the PR merges to `main`, so the code that depends on the migration finds the schema ready when it deploys

---

## §7 — Backup Checklist (Do These Right Now)

Before walking away from this guide, do the following. They take ~15 minutes total.

- [ ] Fill in every `<CONFIRM>` in §1 with your actual login emails
- [ ] Save 2FA recovery codes for GitHub, Vercel, Supabase, Stripe to your password manager
- [ ] In your password manager, create a "FamilyNest – env vars" entry and paste the values of every 🔴 secret from §2 (especially anything marked Sensitive in Vercel)
- [ ] Run `git status` — commit anything uncommitted
- [ ] Run `git stash list` — restore or commit anything stashed
- [ ] Run `git push --all origin` and `git push --tags origin` — push everything local
- [ ] Verify OneDrive is syncing the project folder right now (right-click → check status)
- [ ] Read §1 row by row and check that you can actually sign into each service from your phone, using whatever credentials you have. Don't wait for a disaster to discover you don't remember a password.
- [ ] Set a recurring calendar reminder to re-do this checklist every 90 days

---

## §8 — Service Support Contacts

If a Tier-1 service has a real outage or you're locked out:

| Service | Support URL | Status page |
|---|---|---|
| GitHub | https://support.github.com | https://www.githubstatus.com |
| Vercel | https://vercel.com/help | https://www.vercel-status.com |
| Supabase | https://supabase.com/support | https://status.supabase.com |
| Stripe | https://support.stripe.com | https://status.stripe.com |
| Resend | https://resend.com/help | https://resend-status.com |
| OpenAI | https://help.openai.com | https://status.openai.com |
| Upstash | https://upstash.com/docs/help/support | — |

---

## §9 — Recovery Scenarios (Specific Failures)

Quick playbook for specific things going wrong.

### Scenario: Your laptop is gone
→ Follow §5 on a new machine. Production is unaffected the whole time.

### Scenario: You can't sign into Vercel
→ Site keeps running (Vercel hosts it; you don't need to be logged in for traffic to flow). You can't deploy new code or change env vars until you recover access. Email Vercel support at https://vercel.com/help to recover.

### Scenario: You can't sign into Supabase
→ Production keeps running for already-connected users, but new auth signups will fail (Supabase auth is in-band). **Catastrophic** — get support involved immediately. The project ID is `tstbngohenxrbqroejth`.

### Scenario: You can't sign into GitHub
→ Production is fine. You can't ship new code until you regain access. If unrecoverable, you'd manually push the local copy to a new GitHub repo, then point Vercel at it. Painful but works.

### Scenario: Domain `familynest.io` expires
→ Site becomes unreachable by name. `thompsons.vercel.app` still works as a fallback (same deployment). Re-register at the registrar (see §1) and re-point DNS. Resend's `send.familynest.io` may need re-verification depending on registrar/DNS provider.

### Scenario: You committed a secret to the repo by accident
→ **Rotate the key immediately at the source service** (don't just delete the commit — Git history can be retrieved). Update Vercel with the new value. Optionally use `git filter-branch` or `git filter-repo` to scrub history, but rotation is what actually protects you.

### Scenario: A migration was applied to production but the PR was never merged
→ Production DB now has schema that's not reflected in `supabase/migrations/`. Two paths:
1. Write a new migration that documents the change retroactively, then `git push` it and skip applying it (already applied)
2. Roll back the change in prod via a new migration that reverses it, then merge the original PR through the normal flow

Either way: don't blindly re-run `supabase db push` — it can double-apply and corrupt state.

---

## §10 — Maintenance

Re-read this guide quarterly. Specifically check:

- New env vars added since last review? Add them to §2.
- New services integrated (e.g., Sentry, Mixpanel)? Add them to §1.
- Old services deprecated? Remove them.
- Login emails still correct?
- 2FA still set up everywhere?
- Backup of secrets still current?

Set a recurring calendar reminder for the first of each quarter. Two minutes of upkeep is much cheaper than a real disaster.

---

*This guide was last updated 2026-05-31. If you make material changes to the stack (add a service, change a deploy step, rotate a key), update the relevant section at the same time.*
