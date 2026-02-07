# Supabase GitHub Integration — Step-by-Step

Connect your Supabase project to GitHub so migrations run automatically when you push.

> **Note:** Supabase's native GitHub integration requires a **Pro plan** ($25/mo). On the free tier, use [GitHub Actions](https://github.com/features/actions) instead — see `MIGRATIONS_AUTOMATION.md` for the free alternative.

---

## Step 1: Open Integrations

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. Select your project
3. Click **Project Settings** (gear icon in the left sidebar)
4. Click **Integrations**

---

## Step 2: Authorize GitHub

1. Find **GitHub Integration**
2. Click **Authorize GitHub**
3. On the GitHub page, click **Authorize Supabase**
4. You’ll be redirected back to Supabase

---

## Step 3: Connect Your Repository

1. Click **Connect repository**
2. Choose your repo (e.g. `loo83gh22-droid/Thompsons`)
3. **Supabase directory path:**
   - If your repo root is `Thompsons` and the app is in `family-site/`, use: **`family-site/supabase`**
   - If your repo root is `family-site` (or the whole project), use: **`supabase`**
4. Select branch: **`main`** (or your production branch)

---

## Step 4: Enable Production Deployment

1. Turn on **Deploy to production**
2. That will run migrations when you push or merge to your production branch
3. Click **Enable integration**

---

## Step 5: Verify

1. Push a commit that includes your migrations
2. Supabase will apply any new migrations
3. In Supabase, go to **Database** → **Migrations** to see status

---

## Optional: Required Status Check

To avoid merging PRs when migrations fail:

1. In GitHub: **Settings** → **Branches** → **Branch protection rules** (for `main`)
2. Add **Supabase Preview** (or equivalent) as a required status check before merging

---

## Path Reference

| Repo structure | Supabase path |
|----------------|---------------|
| `Thompsons/` → `family-site/` → `supabase/` | `family-site/supabase` |
| `family-site/` (root) → `supabase/` | `supabase` |
| `Thompsons/` (root) → `supabase/` | `supabase` |
