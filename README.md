# FamilyNest

A private family memory app. Journals, photos, voice memos, recipes, time capsules, and more — shared only within your family. Live in production at **[familynest.io](https://familynest.io)**.

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (Postgres + Auth + Storage) · Tailwind CSS v4 · Stripe · Resend · OpenAI · Vercel hosting

---

## 📚 Documentation

> **First-time visitor?** Start with `CLAUDE.md` for project conventions, then `docs/TIMELINE.md` for what's been built and why.

### Cold-start guides

| Doc | When to read it |
|---|---|
| **[`CLAUDE.md`](./CLAUDE.md)** | First — project conventions, deployment workflow, gotchas |
| **[`docs/DISASTER_RECOVERY.md`](./docs/DISASTER_RECOVERY.md)** | If you ever need to rebuild from a brand-new machine. Inventory of every account, env var, what's safe vs at risk, step-by-step recovery |
| **[`docs/SESSION_HANDOFF.md`](./docs/SESSION_HANDOFF.md)** | If you're picking up where the last session left off — current state, what's outstanding, locked-in decisions |
| **[`docs/TIMELINE.md`](./docs/TIMELINE.md)** | What's shipped over the life of the project, organized by phase |
| **[`docs/TODO.md`](./docs/TODO.md)** | What's outstanding right now + parked backlog |

### Reference

| Doc | What's in it |
|---|---|
| [`SETUP.md`](./SETUP.md) | First-time local setup from scratch |
| [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) | Supabase configuration walkthrough |
| [`VERCEL_QUICKSTART.md`](./VERCEL_QUICKSTART.md) | Vercel deployment setup |
| [`DEPLOY.md`](./DEPLOY.md) | Production deploy flow |
| [`RESEND_SETUP.md`](./RESEND_SETUP.md) | Resend email configuration |
| [`docs/GIFT_FLOW_DESIGN.md`](./docs/GIFT_FLOW_DESIGN.md) | Architecture of the buyer-pays gift flow |
| [`docs/BILLING_FINDINGS.md`](./docs/BILLING_FINDINGS.md) | Billing audit log + plan enforcement |

### Memory files (cross-session context)

Lives in [`memory/MEMORY.md`](./memory/MEMORY.md) — strategic decisions and tone guides that persist across Claude Code sessions. Currently includes target audience, project owner identity, etc.

---

## 🛠️ Quick start (existing dev environment)

```bash
cd family-site
npm install
npm run dev   # http://localhost:3000
```

Other useful commands:

```bash
npm run build              # production build
npm run lint               # ESLint
npm run db:push            # push Supabase migrations (NOT the canonical path — see CLAUDE.md)
npm run test               # Vitest
```

If env vars are missing locally:

```bash
vercel link              # one-time, choose the family-site project
vercel env pull .env.local
```

---

## 🚢 Deployment

`main` → Vercel auto-deploys to production (~2 min). Feature branches get preview URLs. Migrations are NOT auto-applied — apply via Supabase MCP `apply_migration` before merging any PR that adds SQL. See `CLAUDE.md` for the full workflow.

---

## 🆘 If something goes wrong

- **Locked out of your laptop / starting on a new machine?** → [`docs/DISASTER_RECOVERY.md`](./docs/DISASTER_RECOVERY.md)
- **Production incident?** → check Vercel status, then Supabase status (see DR §8 for support links)
- **Lost the value of a secret env var?** → DR §2 lists where each comes from
- **Picking up after a long gap?** → [`docs/SESSION_HANDOFF.md`](./docs/SESSION_HANDOFF.md) is the one-doc summary

---

## 🔗 Production

- **Site:** https://familynest.io (also https://thompsons.vercel.app)
- **Repo:** https://github.com/loo83gh22-droid/Thompsons
- **Supabase project ID:** `tstbngohenxrbqroejth`
