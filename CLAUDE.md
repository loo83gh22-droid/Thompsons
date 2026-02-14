# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `family-site/` directory:

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (v9 flat config, Next.js core-web-vitals + TypeScript)
npm run db:push      # Push Supabase migrations to remote database
```

No test framework is configured.

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (PostgreSQL + Auth + Storage) · Tailwind CSS v4 · Deployed on Vercel

**Layout:**
- `app/dashboard/` — Feature modules (journal, map, recipes, stories, events, photos, time-capsules, voice-memos, traditions, achievements, etc.). Each module co-locates its page, components, and Server Actions.
- `app/api/` — API routes: search, export (ZIP via JSZip), notifications (Vercel cron), invite emails (Resend).
- `app/components/` — Shared components: `RoleGate`, `PhotoUpload`, `DatePicker`, `ShareButton`.
- `src/lib/` — Utilities: Supabase clients, role helpers, plan logic, date formatting, EXIF extraction, location clustering.
- `supabase/migrations/` — 54 SQL migration files. CI auto-pushes on merge to `main`.
- `middleware.ts` — Refreshes Supabase auth session, protects `/dashboard/*` routes (redirects to `/login`).

## Key Patterns

**Supabase clients:** Use `src/lib/supabase/server.ts` in Server Components/Actions and `src/lib/supabase/client.ts` in Client Components. Never mix them.

**FamilyContext** (`app/dashboard/FamilyContext.tsx`): Provides `activeFamilyId`, `currentUserRole`, `currentMemberId`, `planType`, and `families` list. Access via `useFamily()` hook. Active family persisted in cookies.

**Roles** (`src/lib/roles.ts`): Four roles — `owner`, `adult`, `teen`, `child`. Permission helpers: `canManageMembers()`, `canDeleteContent()`, `canCreateContent()`, `canInviteMembers()`, etc. Auto-detected from birth date via `detectRoleFromBirthDate()`.

**RoleGate** (`app/components/RoleGate.tsx`): Conditionally renders children based on role. Also exports `OwnerOnly` and `AdultOnly` wrappers.

**Server Actions for mutations:** Defined in `actions.ts` files within each feature module (e.g., `app/dashboard/journal/actions.ts`). Use `requireRole()` from `src/lib/requireRole.ts` for server-side authorization.

**Row-Level Security:** All Supabase tables use RLS scoped by `family_id`. Queries must include family context.

**Storage tracking:** Families have `storage_used_bytes` / `storage_limit_bytes`. Use Supabase RPC for atomic increment/decrement on upload/delete.

## Conventions

- **Path alias:** `@/*` maps to the project root (tsconfig).
- **Shell commands on Windows:** Use `;` to chain commands, not `&&`.
- **React Strict Mode** is disabled in `next.config.ts` to prevent duplicate Google Maps mounting in dev.
- **Images:** Supabase storage remote patterns are configured in `next.config.ts` for `next/image`.

## Deployment Workflow

**This site is deployed on Vercel with auto-deployment from GitHub.**

Repository: https://github.com/loo83gh22-droid/Thompsons

### Initial Deployment Setup (Completed)

1. **Git Repository:**
   - ✅ Initial commit created with all features
   - ✅ Pushed to GitHub `main` branch
   - ✅ Auto-deployment configured

2. **Vercel Project:**
   - ✅ Connected to GitHub repository
   - ✅ Framework: Next.js (auto-detected)
   - ✅ All environment variables configured
   - ✅ Production URL: (set in Vercel dashboard)

3. **Supabase Configuration:**
   - ✅ Authentication redirect URLs updated with production domain
   - ✅ Database migrations applied
   - ✅ RLS policies active on all tables

### When completing tasks:

1. **Always commit changes** when a task is done:
   ```bash
   git add .
   git commit -m "Description of changes

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

2. **Apply any new Supabase migrations** before pushing:
   - Use the Supabase MCP `apply_migration` tool for any new/changed SQL migrations
   - Project ID: `tstbngohenxrbqroejth`
   - This ensures the database schema is up to date before the new code goes live

3. **Push to trigger deployment:**
   ```bash
   git push
   ```

4. **Vercel auto-deploys** from the `main` branch (2-3 minutes)

### Environment Variables (configured in Vercel):

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - `https://tstbngohenxrbqroejth.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key (from dashboard)
- `CRON_SECRET` - Secure random string (authenticates notification cron at 14:00 UTC)

**Recommended:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For family map and geocoding
- `NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID` - For background music player

**Optional:**
- `RESEND_API_KEY` - For sending invite and notification emails
- `RESEND_FROM_EMAIL` - Format: `Family Name <onboarding@resend.dev>`

### Database Migrations:

**Always apply migrations automatically via the Supabase MCP `apply_migration` tool** when pushing changes that include schema updates. This is the standard workflow — no manual SQL editor steps needed.

- Project ID: `tstbngohenxrbqroejth`
- Migrations are applied before `git push` so the DB is ready when Vercel deploys the new code.

**Fallback (if MCP is unavailable):**
```bash
npm run db:push
```

### Post-Deployment Checklist:

After deployment or major changes:
- ✅ Verify Vercel build logs show success (no errors)
- ✅ Test production URL loads correctly
- ✅ Login/signup flow works in production
- ✅ Supabase redirect URLs include: `https://[your-domain].vercel.app/auth/callback`
- ✅ Create test family member and verify data persistence
- ✅ Check cron job executes daily (Vercel Functions logs after 14:00 UTC)
- ✅ Verify environment variables are set correctly in Vercel dashboard

### Vercel Deployment Logs:

To check deployment status:
1. Go to Vercel dashboard → Your project
2. Click "Deployments" tab
3. View build logs for latest deployment
4. Check "Functions" tab for cron job execution logs

### Troubleshooting:

**Build fails:**
- Check Vercel build logs for specific error
- Verify all environment variables are set
- Test build locally: `npm run build`

**Database connection issues:**
- Verify Supabase URL and anon key are correct
- Check RLS policies allow authenticated access
- Confirm Supabase project is not paused

**Cron job not running:**
- Verify `CRON_SECRET` is set in Vercel
- Check `vercel.json` has correct cron schedule
- View Functions logs in Vercel dashboard
