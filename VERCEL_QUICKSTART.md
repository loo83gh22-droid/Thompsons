# Deploy to Vercel (5 minutes)

Your project is ready. Follow these steps to get a live URL like `thompsons.vercel.app`.

---

## Step 1: Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `thompsons` (or `family-site`)
3. Leave it **empty** (no README, no .gitignore)
4. Click **Create repository**

---

## Step 2: Push your code

In your terminal, from the `family-site` folder:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/thompsons.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with **GitHub**
2. Click **Add New** → **Project**
3. Select your `thompsons` repo
4. Before deploying, click **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | (from your `.env.local`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from your `.env.local`) |

5. Click **Deploy**

---

## Step 4: Add Supabase redirect URL

1. In [Supabase](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add: `https://YOUR-PROJECT.vercel.app/auth/callback`
3. Save

---

## Done!

Your site is live at `https://YOUR-PROJECT.vercel.app`

Sign up with your email, confirm the link, and you're in.
