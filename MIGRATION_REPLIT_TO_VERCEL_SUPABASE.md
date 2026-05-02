# Replit To Vercel/Supabase Migration Runbook

This runbook protects the live jobs, users, registrations, invoices, and imported job data while moving hosting away from Replit.

## Current State

- The app reads Postgres from `DATABASE_URL`.
- The local `DATABASE_URL` host resolves to Neon/Postgres, but the live Replit app may still be using a different Replit database URL.
- The code already supports normal Postgres providers, including Supabase, through `pg` and Drizzle.
- There is a local SQL backup file named `somkenjobs_backup.sql`. Keep it out of git, but keep it on disk or in secure cloud storage.

## Safest Migration Order

1. Freeze destructive changes.
   - Do not run `npm run db:push`, reset commands, seed commands, or manual SQL deletes against the live database.
   - Keep the Replit app running until the new deployment is fully verified.

2. Identify the true live source database.
   - In Replit, open Secrets and copy the `DATABASE_URL` currently used by the live app.
   - Treat this Replit value as the source of truth until comparison proves otherwise.
   - Do not paste database URLs into chat, commits, screenshots, or logs.

3. Compare live Replit against Neon or Supabase.
   - The comparison script is read-only.
   - `SOURCE_DATABASE_URL` should be the current live Replit database.
   - `TARGET_DATABASE_URL` should be Neon or Supabase.

   ```powershell
   $env:SOURCE_DATABASE_URL = "paste-current-replit-live-url-here"
   $env:TARGET_DATABASE_URL = "paste-neon-or-supabase-url-here"
   npm run db:compare
   Remove-Item Env:\SOURCE_DATABASE_URL
   Remove-Item Env:\TARGET_DATABASE_URL
   ```

   If source row counts or latest timestamps are newer than target, target is stale. Do not deploy production against the stale target.

4. Create two backups before changing hosting.
   - Keep the current local `somkenjobs_backup.sql`.
   - Create a fresh dated backup from the live `DATABASE_URL`.

   ```powershell
   $env:PGPASSWORD = "paste-password-here"
   pg_dump --format=custom --no-owner --no-acl --file ".\backups\somkenjobs-live-YYYY-MM-DD.dump" "postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
   Remove-Item Env:\PGPASSWORD
   ```

5. Choose the first production database.
   - If Replit live is the only up-to-date database, export Replit live and restore it into Neon or Supabase.
   - If Neon matches Replit live, it is safe to use Neon directly for Vercel.
   - If Supabase is the long-term target, restore Replit live into Supabase and verify in preview before production.

6. Deploy to Vercel first using the verified up-to-date database.
   - Add these Vercel environment variables:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `NODE_ENV=production`
     - `CRON_SECRET`
     - `ADMIN_INITIAL_PASSWORD` only if intentionally creating a first admin in an empty database
   - This should preserve all existing accounts and jobs because the app points at the same database.

7. Verify the Vercel deployment before moving DNS.
   - Homepage loads jobs.
   - Login works for an existing approved account.
   - Registration still creates a pending user.
   - Dashboard/admin approval works.
   - `/sitemap.xml` and `/robots.txt` work.
   - A single job page renders and includes job schema.
   - The scheduled fetch/import path works.

8. Migrate to Supabase only after Vercel is stable, unless Supabase was already selected and verified in preview.
   - Create a Supabase project.
   - Use the direct Postgres connection string for restore/import work.
   - Use the pooled connection string for the deployed app if Supabase recommends it for serverless usage.
   - Restore into Supabase from the backup.
   - Point a preview deployment at Supabase first, not production.

9. Cut over production.
   - Update Vercel `DATABASE_URL` to Supabase.
   - Redeploy.
   - Verify the same workflow checklist again.
   - Only then update DNS from Replit to Vercel.

10. Keep rollback simple.
   - Keep Replit live until Vercel + database are verified.
   - Keep the old Neon/Replit `DATABASE_URL` available as a rollback target.
   - If anything goes wrong after DNS cutover, point DNS back or roll Vercel env back to the previous database URL and redeploy.

## Supabase Restore Notes

Use `pg_restore` for custom-format dumps:

```powershell
pg_restore --clean --if-exists --no-owner --no-acl --dbname "postgresql://SUPABASE_USER:SUPABASE_PASSWORD@SUPABASE_HOST:5432/postgres?sslmode=require" ".\backups\somkenjobs-live-YYYY-MM-DD.dump"
```

Do this only on the new empty Supabase project. Do not run `--clean` against the current live database.

## Important Limits

- Supabase Free includes 500 MB database size per project, so confirm the backup size before choosing the free plan.
- Neon is a good option if the current database is already there and up to date; staying on Neon avoids an unnecessary migration.
- Vercel stores production secrets as environment variables; changes apply only to new deployments.
- Vercel serverless functions have execution limits, so GitHub Actions may remain the more reliable place to run scheduled job imports.

## Data Safety Checklist

- [ ] Fresh live backup exists and can be read.
- [ ] Backup is stored outside the repo.
- [ ] Vercel preview works with the existing database.
- [ ] Supabase restore was tested before production cutover.
- [ ] Existing login tested after migration.
- [ ] Job importer tested after migration.
- [ ] DNS changed only after production verification.
- [ ] Old database kept for rollback until the new setup runs cleanly for several days.
