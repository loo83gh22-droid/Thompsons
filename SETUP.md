# Thompsons — Setup Guide

Follow these steps to get your family website running.

---

## 1. Install & Run (No Backend Yet)

```bash
cd family-site
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll see the landing page. The **Login** and **Create account** buttons won't work until Supabase is configured.

---

## 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New Project**.
3. Name it (e.g. `thompson-family`), set a database password, choose a region.
4. Wait for the project to be created.

---

## 3. Get Your API Keys

1. In the Supabase dashboard, go to **Settings** → **API**.
2. Copy:
   - **Project URL**
   - **anon public** key (under Project API keys)

---

## 4. Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_DEATH_BOX_PASSWORD=choose-a-strong-password
   ```

---

## 5. Set Up the Database

1. In Supabase, go to **SQL Editor**.
2. Open `supabase/migrations/001_initial_schema.sql` from this project.
3. Copy its contents and paste into the SQL Editor.
4. Click **Run**.

This creates the tables for family members, travel locations, journal entries, Spanish lessons, and the Death Box.

---

## 6. Configure Auth Redirect URLs

1. In Supabase, go to **Authentication** → **URL Configuration**.
2. Add these to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (when you deploy)

---

## 7. (Optional) Create Storage Bucket for Photos

The migration tries to create a `journal-photos` bucket. If it fails:

1. Go to **Storage** in Supabase.
2. Click **New bucket**.
3. Name it `journal-photos`.
4. Set it to **Public** if you want photos viewable by logged-in users.

---

## 8. Restart the Dev Server

```bash
npm run dev
```

Now **Login** and **Create account** should work. Sign up with your email, confirm via the link Supabase sends, then sign in.

---

## 9. Create Your First Family Member

After signing in, you'll need to create a `family_members` row linked to your user. You can do this via the Supabase SQL Editor:

```sql
-- Replace YOUR_USER_ID with your auth.users id (find it in Authentication → Users)
insert into public.family_members (user_id, name, color)
values ('YOUR_USER_ID', 'Your Name', '#3b82f6');
```

---

## 10. (Optional) Email Notifications for Family Messages

To send email when someone receives a family message:

1. Sign up at [resend.com](https://resend.com) (free tier available).
2. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=Thompsons <noreply@yourdomain.com>
   ```
3. Your email is auto-synced to your family member when you log in. Recipients need `contact_email` set (synced on login or editable in Family Tree).

---

## Next Steps

- **Travel Map**: Add rows to `travel_locations` to see pins on the map.
- **Journal**: The new entry form will save to `journal_entries` once wired up.
- **Spanish**: Add lessons to `spanish_lessons` and track progress in `spanish_progress`.
- **Death Box**: Add items to `death_box_items` (only visible when unlocked with the password).

---

## Deploying (Vercel)

1. Push your code to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Add your env vars in Vercel project settings.
4. Add your production URL to Supabase redirect URLs.
5. Deploy.

---

*Questions? Check the Supabase docs or the PROJECT_PLAN.md for the full roadmap.*
