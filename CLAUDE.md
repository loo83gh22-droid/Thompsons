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
- `supabase/migrations/` — 120+ SQL migration files. **CI does NOT auto-push** — see Database Migrations section below for the actual workflow.
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

## Email & Outreach

**Founder email:** hello@familynest.io is configured as a Gmail send-as alias in waterloo1983hawk22@gmail.com.
- To draft outreach emails, use Gmail's URL pre-fill format and open in Chrome MCP:
  `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=EMAIL&su=SUBJECT&body=BODY`
- Always verify the **From** field is set to hello@familynest.io before sending.
- Transactional emails (confirmations, invites) send via Resend from hello@send.familynest.io.

## Deployment Workflow

**Production:** https://familynest.io (also accessible at thompsons.vercel.app)
**Repository:** https://github.com/loo83gh22-droid/Thompsons
**Supabase Project ID:** `tstbngohenxrbqroejth`

Vercel auto-deploys from `main` branch. Both domains serve the same deployment.

### When completing tasks:

**⚠️ The site has real users. NEVER push directly to `main`. All work goes through feature branches and must be approved locally before shipping.**

#### Standard workflow (feature branch → local review → approve → merge):

1. **Create a feature branch** at the start of every task:
   ```bash
   git checkout -b feature/<short-name>
   ```

2. **Build and verify locally** using `preview_start` / Chrome MCP screenshots.

3. **Commit changes** when the feature is ready for review:
   ```bash
   git add .
   git commit -m "Description of changes

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   ```

4. **Push the branch and open a PR** targeting `main`:
   ```bash
   git push -u origin feature/<short-name>
   gh pr create --title "..." --body "..."
   ```
   - Share the PR URL with the user
   - Share the **Vercel preview URL** (auto-generated for every branch) so the user can review on a real deployed environment

5. **🔔 ALWAYS remind the user at the end of every task:**
   > "Ready for your review! Preview URL: [url] — let me know when you're happy and I'll merge it to main."

6. **Only merge to main after explicit user approval** ("looks good", "ship it", "merge it", etc.)
   ```bash
   gh pr merge --merge
   ```
   Then remind the user: "Merged! Vercel will deploy to production in ~2 minutes."

### Database Migrations:

**⚠️ CI does NOT auto-apply migrations.** The workflow at `.github/workflows/supabase-migrations.yml` is intentionally disabled — see comments at the top of that file. Past attempts to run `supabase db push` from CI failed because MCP-applied migrations create version mismatches with local files.

**The current canonical workflow:**

For every PR that adds files in `supabase/migrations/`:

1. **Before merging the PR**, apply the migration via Supabase MCP `apply_migration` tool
   - Project ID: `tstbngohenxrbqroejth`
   - Pass the SQL contents (not the file path)
2. **Verify** with the MCP `list_migrations` tool — confirm the new migration appears in the list
3. **Then merge the PR**

**For destructive migrations** (DROP, DELETE on populated tables, ALTER that loses data): apply at PR approval time AFTER the user has confirmed the design. Never auto-apply destructive operations.

**For additive-safe migrations** (CREATE TABLE, ADD COLUMN nullable, INSERT … ON CONFLICT DO NOTHING, idempotent UPDATE): safe to apply at branch-creation time so local dev hits the new schema.

**In every PR description, list the migration files included** and flag whether each is additive-safe or destructive.

**Pre-merge sanity check:**
```bash
./scripts/check-pending-migrations.sh
```
Lists local files in `supabase/migrations/` and reminds you to verify each is applied via MCP before merge.

**Note:** Recent migrations applied via MCP show up in the DB with timestamps assigned by Supabase, not the filename version. This is fine — the MCP tracks them by name. Don't try to "fix" the drift by running `supabase migration repair` without a clear plan; it can double-apply and break prod.

**Fallback (if MCP is unavailable):** `npm run db:push` — but this hits the version-mismatch issue and may fail; prefer MCP.

## Local Verification Workflow (Windows)

### Starting the dev server

Use `preview_start` with the name `"dev"`. The `.claude/launch.json` is configured
to use `node` directly with the full npm-cli.js path — this is required on Windows
because `npm` is a `.cmd` file that Node's `spawn()` cannot execute directly.

**Note:** The launch.json passes `-- --webpack` to `next dev` because the Application
Control policy on this machine blocks the native SWC binary (`@next/swc-win32-x64-msvc`),
and Turbopack requires native bindings. Webpack uses the WASM fallback and works fine.
If `preview_start` seems to succeed but port 3000 never binds, fall back to:
```bash
npx next dev --webpack
```
(run in Bash with `run_in_background: true`, then use Chrome MCP for screenshots)

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
