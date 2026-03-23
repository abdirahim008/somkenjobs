#!/usr/bin/env tsx
// Standalone script to fetch humanitarian jobs and archive expired ones.
// Run directly by GitHub Actions with DATABASE_URL set as a secret.
// This avoids HTTP timeouts and is more reliable than calling /api/trigger-fetch.
//
// Usage: npx tsx scripts/fetchJobs.ts

import { jobFetcher } from "../server/services/jobFetcher";
import { storage } from "../server/storage";

console.log("Starting job fetch —", new Date().toISOString());

try {
  await jobFetcher.fetchAllJobs();
  const archivedCount = await storage.archiveExpiredJobs();
  console.log(`Archived ${archivedCount} expired jobs`);
  console.log("Job fetch completed successfully —", new Date().toISOString());
  process.exit(0);
} catch (err) {
  console.error("Job fetch failed:", err);
  process.exit(1);
}
