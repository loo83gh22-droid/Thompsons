# Resend Email Setup

Step-by-step guide for configuring Resend to send family messages and invite emails.

---

## What's Already in Place

- **Package:** `resend` is installed in the project.
- **Features that use it:**
  - **Family messages** – emails when someone sends a message (recipients with `contact_email` set).
  - **Invite emails** – when you add a family member with an email address.

If `RESEND_API_KEY` is not set, these features still work; emails just won't be sent.

---

## Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com).
2. Sign up (free tier available).
3. Verify your email if prompted.

---

## Step 2: Get an API Key

1. In the Resend dashboard, go to **API Keys** (sidebar).
2. Click **Create API Key**.
3. Give it a name (e.g. `Thompsons family site`).
4. Copy the key (starts with `re_`). You won't see it again.

---

## Step 3: Local Development – `.env.local`

Add to your `.env.local` (create from `.env.example` if needed: `cp .env.example .env.local`):

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Thompsons <onboarding@resend.dev>
```

**Testing:** `onboarding@resend.dev` is Resend's test sender. No domain verification needed, but you can only send to the email on your Resend account.

---

## Step 4: Restart Dev Server

After editing `.env.local`:

```bash
# Stop the dev server (Ctrl+C), then:
npm run dev
```

---

## Step 5: Production – Verify Your Domain (Optional)

To send to any recipient (not just your own email):

1. In Resend: **Domains** → **Add Domain**.
2. Enter your domain (e.g. `yourfamily.com`).
3. Add the DNS records Resend provides.
4. Wait for verification.

Then set:

```env
RESEND_FROM_EMAIL=Thompsons <noreply@yourfamily.com>
```

---

## Step 6: Vercel Production Deployment

1. Vercel → your project → **Settings** → **Environment Variables**.
2. Add:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | Your API key (`re_...`) |
| `RESEND_FROM_EMAIL` | `Thompsons <noreply@yourdomain.com>` or `Thompsons <onboarding@resend.dev>` |
| `NEXT_PUBLIC_APP_URL` | `https://yoursite.vercel.app` (for invite links; Vercel may set this automatically) |

3. Redeploy if the project was already deployed.

---

## Quick Checklist

- [ ] Resend account created
- [ ] API key created and copied
- [ ] `.env.local` has `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- [ ] Dev server restarted
- [ ] (Production) Domain verified in Resend
- [ ] (Production) Env vars set in Vercel
