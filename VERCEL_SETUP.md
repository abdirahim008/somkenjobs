# Deploying Somken Jobs to Vercel

This guide takes you from zero to live on Vercel without breaking the existing Replit site.

---

## Before You Start

You will need:
- A [Vercel account](https://vercel.com) (free Hobby plan is enough)
- Your GitHub repository: `https://github.com/abdirahim008/somkenjobs`
- Your current Replit `DATABASE_URL` (already a Neon connection string — no migration needed)

> **Good news**: Your Replit database is already hosted on Neon (`neon.tech`). You can use the same `DATABASE_URL` directly in Vercel. No database migration is needed.

---

## Step 1: Get Your Values from Replit

In Replit, open **Secrets** (the lock icon in the sidebar) and copy:
- `DATABASE_URL` — your Neon PostgreSQL connection string
- `JWT_SECRET` — your JWT signing secret

---

## Step 2: Push the `vercel` Branch to GitHub

In the Replit shell, run:

```bash
git push origin main
git push origin vercel
```

---

## Step 3: Connect GitHub to Vercel

1. Log in at [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository: `abdirahim008/somkenjobs`
4. Under **Framework Preset**, select **Other**
5. Under **Branch to deploy**, select **vercel**
6. Vercel auto-detects `vercel.json` — do NOT override Build Command or Output Directory

---

## Step 4: Set Environment Variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...@...neon.tech/neondb?sslmode=require` | From Replit Secrets |
| `JWT_SECRET` | your secret string | From Replit Secrets |
| `NODE_ENV` | `production` | Type this manually |
| `CRON_SECRET` | any strong random string | e.g. run `openssl rand -hex 32` |
| `GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON` | service account JSON or base64 JSON | Optional, enables Google Jobs fast recrawl via Indexing API |

> `CRON_SECRET` is required — it secures the job-fetch endpoint that Vercel Cron calls automatically.

> For Google Jobs indexing, create a Google Cloud service account with Indexing API enabled, add the service account email as an owner in the `somkenjobs.com` Search Console Domain property, then paste the JSON key here. Base64 is safer for multi-line private keys.

---

## Step 5: Deploy

Click **Deploy**. Vercel will:
1. Run `npm run build` — builds the React frontend and Express backend
2. Copy frontend files so Express can serve them
3. Deploy to a URL like `somkenjobs.vercel.app`

First deploy takes about 2–3 minutes.

---

## Step 6: Set Up GitHub Actions (Recommended — More Reliable)

GitHub Actions runs the job fetcher **directly** (connects to your Neon database, no HTTP timeout risk). This is recommended alongside or instead of Vercel Cron.

> **Important**: GitHub scheduled workflows only run from the **default branch** of your repository. If your default branch on GitHub is `main`, the workflow in `main` runs automatically. If you want the `vercel` branch to run it, either set `vercel` as your default branch or keep the workflow on `main` (which it already is after pushing both branches).

1. In your GitHub repository → **Settings → Secrets and variables → Actions → Repository secrets**
2. Add one secret:
   - `DATABASE_URL` = your full Neon connection string (same as used in Vercel)

The workflow file is already at `.github/workflows/fetch-jobs.yml`. Once the secret is added, it runs automatically at 8 AM and 2 PM UTC every day from your default branch.

To manually trigger it: GitHub → **Actions** tab → **Fetch Jobs** → **Run workflow**.

---

## Step 7: Test Your Vercel Deployment

Visit your Vercel URL and check:
- [ ] Homepage loads with job listings
- [ ] Search and filters work
- [ ] Click a job → details page opens
- [ ] `/sitemap.xml` returns valid XML
- [ ] `/sitemap-jobs.xml` contains only active public job detail URLs
- [ ] `/robots.txt` returns text
- [ ] Job detail pages include one `JobPosting` JSON-LD block and return `410` after expiry/unpublish
- [ ] Dashboard login works (same credentials as Replit)
- [ ] Test SSR for bots: `curl -A "Googlebot" https://your-app.vercel.app/` — should return full HTML with meta tags

---

## Step 8: Point Your Domain to Vercel (When Ready)

Once you are happy with the Vercel deployment:

1. In Vercel → **Project Settings → Domains**, click **Add**
2. Enter `somkenjobs.com`
3. Vercel shows DNS records — add them at your domain registrar:
   - Typically: add a **CNAME** record pointing `somkenjobs.com` → `cname.vercel-dns.com`
   - OR: add the **A records** Vercel provides
4. DNS propagates in minutes to hours
5. Your site is now live on Vercel

> Your Replit app keeps working until DNS switches. Zero downtime if you switch quickly.

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Signs user login tokens |
| `NODE_ENV` | Yes | Set to `production` |
| `CRON_SECRET` | Yes | Secures the job-fetch trigger; Vercel Cron sends this automatically |
| `GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON` | No | Enables Indexing API submissions for new, updated, expired, and deleted jobs |

---

## Troubleshooting

**Build fails**
- Check Vercel build logs for which step failed
- Confirm you are deploying from the `vercel` branch
- Make sure `server/vercel-entry.ts` exists in the repo

**All pages return 500**
- In Vercel → Project → **Functions** tab, check the function logs
- Most likely cause: `DATABASE_URL` is missing or incorrect in Vercel environment variables

**Jobs are not updating automatically**
- Check Vercel → Project → **Cron** tab to confirm cron jobs are listed
- Confirm `CRON_SECRET` is set in Vercel environment variables
- Check GitHub Actions → **Actions** tab to see if the workflow is running
- Manually test fetch: in Replit shell, run `npx tsx scripts/fetchJobs.ts` with your `DATABASE_URL` set

**SSR not working for Google**
- Test: `curl -A "Googlebot/2.1" https://your-app.vercel.app/`
- Should return full HTML with `<title>`, Open Graph tags, and JSON-LD structured data
