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

### One-time setup: Add GitHub secrets

1. Go to your repo: **GitHub** → **Thompsons** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

| Secret | Where to get it |
|--------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard](https://supabase.com/dashboard) → **Account** (avatar) → **Access Tokens** → generate new |
| `SUPABASE_DB_PASSWORD` | Your Supabase project database password (set when creating the project) |
| `SUPABASE_PROJECT_REF` | Supabase dashboard → your project → **Settings** → **General** → **Reference ID** |

### What runs

- **Trigger:** Push to `main` when `supabase/migrations/**` changes, or manual run (Actions → Supabase Migrations → Run workflow)
- **Steps:** Checkout → install Supabase CLI → init → link project → `supabase db push`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot find project ref" | Run `supabase link` first (Step 4) |
| "Database password" | Use the password from Supabase project creation |
| "Permission denied" | Ensure you’re logged in: `supabase login` |
