# Supabase Setup — Step by Step

Follow these in order. Takes about 5 minutes.

---

## Step 1: Create a Supabase project

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **New Project**.
3. Fill in:
   - **Name:** `thompsons` (or whatever you like)
   - **Database password:** Choose a strong password and **save it somewhere**
   - **Region:** Pick the closest to you
4. Click **Create new project** and wait 1–2 minutes.

---

## Step 2: Get your API keys

1. In the left sidebar, go to **Settings** (gear icon) → **API**.
2. Under **Project URL**, click the copy icon.
3. Under **Project API keys**, find **anon public** and click copy.

---

## Step 3: Add keys to your project

1. Open **`family-site/.env.local`** in your editor.
2. Paste your Project URL after `NEXT_PUBLIC_SUPABASE_URL=`
3. Paste your anon key after `NEXT_PUBLIC_SUPABASE_ANON_KEY=`

Example:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. (Optional) Change `NEXT_PUBLIC_DEATH_BOX_PASSWORD` from `family` to something only your family knows.

---

## Step 4: Run the database migration

1. In Supabase, go to **SQL Editor** (in the left sidebar).
2. Click **New query**.
3. Open the file **`family-site/supabase/migrations/001_initial_schema.sql`** in your project.
4. Copy its entire contents and paste into the SQL Editor.
5. Click **Run** (or press Ctrl+Enter).
6. You should see "Success. No rows returned."

---

## Step 5: Set auth redirect URL

1. In Supabase, go to **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   ```
3. Click **Save**.

---

## Step 6: Test it

1. In your terminal:
   ```bash
   cd family-site
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000).
3. Click **Enter** → **Create account**.
4. Sign up with your email and a password.
5. Check your email for the confirmation link from Supabase.
6. Click the link, then sign in again on the site.

If you land on the dashboard, Supabase is set up correctly.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| "Invalid API key" | Double-check the URL and anon key in `.env.local`. No extra spaces or quotes. |
| "Email not confirmed" | Check your inbox (and spam) for the Supabase confirmation email. |
| Redirect loop | Make sure `http://localhost:3000/auth/callback` is in Supabase Auth → URL Configuration. |
| Migration fails | If the storage bucket part errors, you can skip it for now. The main tables should still be created. |
