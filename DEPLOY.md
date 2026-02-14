# Deploy Thompsons to Production

Steps to get your family site live on the web.

---

## 1. Push to GitHub

```bash
cd family-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/thompsons.git
git push -u origin main
```

---

## 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub).
2. Click **Add New** → **Project**.
3. Import your `thompsons` (or `family-site`) repository.
4. Leave framework preset as **Next.js**.
5. Add environment variables (see below).
6. Click **Deploy**.

---

## 3. Environment Variables (Vercel)

In your Vercel project: **Settings** → **Environment Variables**. Add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for map & geocoding (optional) |
| `RESEND_API_KEY` | For message emails & invite emails (optional). See [RESEND_SETUP.md](RESEND_SETUP.md) for setup. |
| `RESEND_FROM_EMAIL` | e.g. `Thompsons <noreply@yourdomain.com>` or `Thompsons <onboarding@resend.dev>` for testing |
| `NEXT_PUBLIC_APP_URL` | Full site URL for invite links (e.g. `https://thompsons.vercel.app`). Vercel sets this automatically; override for custom domains. |

---

## 4. Supabase Redirect URLs

1. In Supabase: **Authentication** → **URL Configuration**.
2. Add your production URL to **Redirect URLs**:
   - `https://thompsons.vercel.app/auth/callback`
   - Or your custom domain: `https://yourdomain.com/auth/callback`

---

## 5. Run Migrations (if not done)

If your Supabase project is new or missing tables:

1. Go to Supabase **SQL Editor**.
2. Run each migration file in order (`001` through `018`).
3. Or use Supabase CLI: `npx supabase db push` (with linked project).

---

## 6. First User (You)

1. Visit your live URL.
2. Click **Create account** and sign up with your email.
3. Confirm via the link Supabase sends.
4. Sign in and you’re in.

To link your account to a family member (for journal, favourites, etc.):

```sql
-- In Supabase SQL Editor: replace YOUR_USER_ID with your auth.users id
insert into public.family_members (user_id, name, color)
values ('YOUR_USER_ID', 'Your Name', '#3b82f6');
```

Find your user ID in **Authentication** → **Users**.

---

## 7. Custom Domain (Optional)

1. In Vercel: **Settings** → **Domains**.
2. Add your domain (e.g. `thompsons.yourfamily.com`).
3. Update DNS as Vercel instructs.
4. Add the new domain to Supabase redirect URLs.

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Env vars set in Vercel
- [ ] Supabase redirect URL includes production URL
- [ ] Migrations run on Supabase
- [ ] First account created and family member linked
