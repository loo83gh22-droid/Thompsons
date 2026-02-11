# Automated Supabase Migrations

One-time setup so you can run `npm run db:push` anytime instead of manually running SQL.

---

## Step 1: Get your Supabase project ref

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project
3. Settings (gear) → **General**
4. Scroll to **Reference ID** — copy it (e.g. `abcdefghijklmnop`)

---

## Step 2: Install Supabase CLI (if needed)

```bash
npm install -g supabase
```

Or use `npx supabase` (no install needed).

---

## Step 3: Log in to Supabase

```bash
cd family-site
npx supabase login
```

A browser window opens — sign in with your Supabase account.

---

## Step 4: Link your project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with the Reference ID from Step 1.

When prompted, enter your **database password** (the one you set when creating the project).

---

## Step 5: Push migrations

```bash
npm run db:push
```

That’s it. New migrations run automatically in order.

---

---

## GitHub Actions (free, auto-deploy on push)

A workflow runs migrations when you push to `main` (and migration files change).

### Option A: Supabase GitHub Integration (recommended – most reliable)

Supabase runs migrations on their infrastructure, avoiding pooler connection issues entirely.

1. Go to **Supabase Dashboard** → your project → **Project Settings** → **Integrations**
2. Under **GitHub Integration**, click **Authorize GitHub**
3. Choose your repository (e.g. Thompsons)
4. Set **Supabase directory path** to `supabase` (relative to repo root)
5. Enable **Deploy to production** for the `main` branch
6. Click **Enable integration**

Migrations will run automatically when you push to `main`. No GitHub secrets needed for this.

---

### Option B: GitHub Actions workflow (needs SUPABASE_DB_URL)

**Repo layout:** If your repo root is **Thompsons** (with `family-site/` inside), use the workflow at **repo root**: `.github/workflows/supabase-migrations.yml`. It triggers on `family-site/supabase/migrations/**` and runs from the `family-site` directory. If your repo root is **family-site** only, use `family-site/.github/workflows/supabase-migrations.yml` (triggers on `supabase/migrations/**`). GitHub only runs workflows from the repo root `.github/`, so when the app lives in a subfolder the root workflow is required.

If you prefer the workflow, add `SUPABASE_DB_URL` to avoid pooler EOF/timeout errors.

#### One-time setup: Add GitHub secrets

1. Go to your repo: **GitHub** → **Thompsons** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

| Secret | Where to get it |
|--------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard](https://supabase.com/dashboard) → **Account** (avatar) → **Access Tokens** → generate new |
| `SUPABASE_DB_PASSWORD` | Your Supabase project database password (set when creating the project) |
| `SUPABASE_PROJECT_REF` | Supabase dashboard → your project → **Settings** → **General** → **Reference ID** |
| `SUPABASE_DB_URL` | **Recommended.** Supabase dashboard → your project → **Connect** → **URI** tab → copy the **Transaction pooler** connection string (port 6543). Replace `[YOUR-PASSWORD]` with your actual DB password. Example: `postgresql://postgres.xxxx:PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres` |

**Important:** Use the **Transaction pooler** URI (port 6543), not Session mode (5432). It tends to be more stable in CI.

If `SUPABASE_DB_URL` is not set, the workflow falls back to `supabase link` + `db push`, which can fail with "unexpected EOF" due to known pooler issues.

#### What runs

- **Trigger:** Push to `main` when `supabase/migrations/**` changes, or manual run (Actions → Supabase Migrations → Run workflow)
- **Steps:** Checkout → install Supabase CLI → init → `supabase db push` (using `--db-url` when SUPABASE_DB_URL is set, else link + push)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "unexpected EOF" / "failed to receive message" | Add `SUPABASE_DB_URL` secret with Transaction pooler URI (port 6543), or use **Supabase GitHub Integration** (Option A) |
| "Cannot find project ref" | Run `supabase link` first (Step 4) |
| "Database password" | Use the password from Supabase project creation |
| "Permission denied" | Ensure you’re logged in: `supabase login` |
| "relation ... already exists" | Database was set up manually. Run `bash supabase/repair-migration-history.sh` (or `.\supabase\repair-migration-history.ps1` on Windows) once. Requires `supabase link` first. |
