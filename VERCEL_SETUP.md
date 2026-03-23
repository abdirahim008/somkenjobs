# Deploying Somken Jobs to Vercel

This guide takes you from zero to live on Vercel without breaking the existing Replit site.

---

## Before You Start

You will need:
- A [Vercel account](https://vercel.com) (free Hobby plan is enough)
- Your GitHub repository: `https://github.com/abdirahim008/somkenjobs`
- Your current Replit `DATABASE_URL` (already a Neon connection string — see note below)

> **Important**: Your Replit database is already on Neon (`neon.tech`). You can use the same `DATABASE_URL` in Vercel. No database migration needed!

---

## Step 1: Get Your Environment Variable Values from Replit

In Replit, go to **Secrets** (the lock icon in the sidebar) and note down:
- `DATABASE_URL` — your Neon PostgreSQL connection string
- `JWT_SECRET` — your JWT signing secret

---

## Step 2: Push the `vercel` Branch to GitHub

In the Replit shell, run:

```bash
git add -A
git commit -m "Add Vercel deployment configuration"
git push origin vercel
```

---

## Step 3: Connect GitHub to Vercel

1. Log in at [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository: `abdirahim008/somkenjobs`
4. Under **Framework Preset**, select **Other**
5. Under **Branch**, select **vercel** (not main)
6. Vercel will auto-detect `vercel.json` — do NOT change the Build Command or Output Directory manually

---

## Step 4: Set Environment Variables in Vercel

In the Vercel project settings → **Environment Variables**, add:

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `DATABASE_URL` | `postgresql://...@...neon.tech/neondb?sslmode=require` | Replit Secrets |
| `JWT_SECRET` | your secret string | Replit Secrets |
| `NODE_ENV` | `production` | Type this manually |
| `CRON_SECRET` | any random string (e.g. `abc123xyz`) | Make one up |

> `CRON_SECRET` is used to secure the job-fetching endpoint. Vercel Cron and GitHub Actions will use it automatically.

---

## Step 5: Deploy

Click **Deploy**. Vercel will:
1. Run `vite build` — builds the React frontend
2. Run `esbuild` — bundles the Express backend
3. Copy static files so Express can serve them
4. Deploy to a URL like `somkenjobs.vercel.app`

The first deploy takes about 2–3 minutes.

---

## Step 6: Set Up GitHub Actions (Optional but Recommended)

Vercel Cron fetches jobs twice daily automatically (at 8 AM and 2 PM UTC). If you also want GitHub Actions as a backup:

1. In your GitHub repository → **Settings → Secrets and variables → Actions**
2. Add two secrets:
   - `VERCEL_APP_URL` = `https://somkenjobs.vercel.app` (or your custom domain)
   - `CRON_SECRET` = same value you set in Vercel

The workflow file is already at `.github/workflows/fetch-jobs.yml`.

---

## Step 7: Test Your Vercel Deployment

Visit your Vercel URL and test:
- [ ] Homepage loads with job listings
- [ ] Search and filters work
- [ ] Click a job to check the details page
- [ ] Visit `/sitemap.xml` — should return XML
- [ ] Visit `/robots.txt` — should return text
- [ ] Dashboard login works (same credentials as Replit)
- [ ] Test bot SSR: add `?ssr=1` to any URL (e.g. `https://your-app.vercel.app/?ssr=1`)

---

## Step 8: Point Your Domain to Vercel (When Ready)

When you are satisfied with the Vercel deployment:

1. In Vercel → **Project Settings → Domains**, add `somkenjobs.com`
2. Vercel will show you DNS records to add
3. At your domain registrar (wherever you bought `somkenjobs.com`):
   - If using **CNAME**: Add `CNAME somkenjobs.com → cname.vercel-dns.com`
   - If using **A records**: Add the IP addresses Vercel provides
4. DNS propagation takes 5 minutes to 48 hours
5. Once DNS is pointing to Vercel, your live site is on Vercel 

> Your Replit app continues to work until DNS is switched. There is no downtime if you switch quickly.

---

## Required Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing login tokens |
| `NODE_ENV` | Yes | Set to `production` |
| `CRON_SECRET` | Recommended | Secures the job-fetch trigger endpoint |

---

## Troubleshooting

**Build fails at esbuild step**
- Check that `server/vercel-entry.ts` exists in your repo
- Make sure you're deploying from the `vercel` branch

**500 errors on all pages**
- Check Vercel function logs (Vercel → Project → Functions tab)
- Most likely cause: `DATABASE_URL` is not set or is incorrect

**Jobs not fetching automatically**
- Check Vercel → Project → Cron Jobs tab to see if crons are firing
- Manually trigger: `curl https://your-app.vercel.app/api/trigger-fetch -H "Authorization: Bearer YOUR_CRON_SECRET"`

**SSR not working for bots**
- Test with: `curl -A "Googlebot" https://your-app.vercel.app/`
- Should return full HTML with meta tags, not a blank React shell
