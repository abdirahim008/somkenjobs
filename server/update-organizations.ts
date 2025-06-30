#!/usr/bin/env tsx

import { db } from './db';
import { jobs } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updateOrganizationNames() {
  console.log('Updating organization names for existing jobs...');
  
  // Extract organization name from title
  const extractOrganizationFromTitle = (title: string): string => {
    // Common patterns for organization names in job titles
    const patterns = [
      /^([A-Z]+)\s+/, // All caps organization at start (e.g., "REACH GIS Officer")
      /^([A-Za-z&\s]+)\s*[-–]\s*/, // Organization name followed by dash (e.g., "ACTED - Field Coordinator")
      /^([A-Za-z&\s]{2,15})\s+[A-Z]/, // Short organization name followed by job title (e.g., "UNHCR Protection Officer")
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1].trim().length > 1) {
        const orgName = match[1].trim();
        // Validate it's likely an organization name (not just a word like "Senior")
        if (!['Senior', 'Junior', 'Lead', 'Chief', 'Head', 'Deputy', 'Assistant', 'Project', 'Field', 'Program'].includes(orgName)) {
          return orgName;
        }
      }
    }
    
    // If no pattern matches, keep original or use a more meaningful default
    return "Humanitarian Organization";
  };

  try {
    // Get all jobs with "ReliefWeb Organization" 
    const jobsToUpdate = await db
      .select()
      .from(jobs)
      .where(eq(jobs.organization, 'ReliefWeb Organization'));

    console.log(`Found ${jobsToUpdate.length} jobs to update`);

    for (const job of jobsToUpdate) {
      const newOrgName = extractOrganizationFromTitle(job.title);
      console.log(`"${job.title}" → "${newOrgName}"`);
      
      await db
        .update(jobs)
        .set({ organization: newOrgName })
        .where(eq(jobs.id, job.id));
    }

    console.log('Organization names updated successfully!');
  } catch (error) {
    console.error('Error updating organization names:', error);
  }
}

// Run the update
updateOrganizationNames().then(() => {
  console.log('Update completed');
  process.exit(0);
}).catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});