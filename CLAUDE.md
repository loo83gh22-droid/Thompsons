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

**Production:** https://familynest.io (also accessible at thompsons.vercel.app)
**Repository:** https://github.com/loo83gh22-droid/Thompsons
**Supabase Project ID:** `tstbngohenxrbqroejth`

Vercel auto-deploys from `main` branch. Both domains serve the same deployment.

### When completing tasks:

**Every task MUST end with code committed, pushed, and a PR created (or merged to main).** Do not leave changes uncommitted or only on a local branch. The site is not live until it reaches `main`.

1. **Always commit changes** when a task is done:
   ```bash
   git add .
   git commit -m "Description of changes

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   ```

2. **Apply any new Supabase migrations** before pushing:
   - Use the Supabase MCP `apply_migration` tool for any new/changed SQL migrations
   - Project ID: `tstbngohenxrbqroejth`
   - This ensures the database schema is up to date before the new code goes live

3. **Push and create a PR** (or push directly to `main` if on `main`):
   ```bash
   git push -u origin <branch-name>
   ```
   - If on a feature branch, always create a GitHub PR targeting `main`
   - Share the PR URL with the user so they can merge it

4. **Vercel auto-deploys** from the `main` branch (2-3 minutes)

### Database Migrations:

**Always apply migrations automatically via the Supabase MCP `apply_migration` tool** when pushing changes that include schema updates. This is the standard workflow — no manual SQL editor steps needed.

- Project ID: `tstbngohenxrbqroejth`
- Migrations are applied before `git push` so the DB is ready when Vercel deploys the new code.

**Fallback (if MCP is unavailable):**
```bash
npm run db:push
```

## Local Verification Workflow (Windows)

### Starting the dev server

Use `preview_start` with the name `"dev"`. The `.claude/launch.json` is configured
to use `node` directly with the full npm-cli.js path — this is required on Windows
because `npm` is a `.cmd` file that Node's `spawn()` cannot execute directly.

**Never** start the dev server via `mcp__Desktop_Commander__start_process` — its
PowerShell shell does not have Node/npm in PATH.

**Always** use the Bash tool for `npm run build`, `git` commands, and other CLI work.

### Verifying UI changes (screenshots)

`/dashboard/*` routes are auth-protected and redirect to `/login`, which crashes the
`preview_*` browser context. Follow this split workflow:

| Page type | Tool to use |
|---|---|
| Public pages (`/`, `/login`, `/pricing`) | `preview_screenshot` / `preview_snapshot` |
| Auth-protected pages (`/dashboard/*`) | Chrome MCP (`mcp__Claude_in_Chrome__computer`) |

**Chrome MCP workflow for dashboard pages:**
1. `mcp__Claude_in_Chrome__tabs_context_mcp` — get tab ID
2. `mcp__Claude_in_Chrome__navigate` — go to `http://localhost:3000/dashboard/...`
3. Ask user to log in if redirected, then `mcp__Claude_in_Chrome__computer` screenshot

### Freeing port 3000 (orphaned processes)

If `preview_start` fails with "port already in use":

```bash
# In Bash tool — get the PID
netstat -ano | grep ":3000 "
```

Then kill it with the Desktop Commander tool (NOT taskkill in Bash — Git Bash
converts `/PID` to a Unix path and breaks the command):

```
mcp__Desktop_Commander__kill_process(pid: <PID>)
```

After killing, call `preview_start` again.
