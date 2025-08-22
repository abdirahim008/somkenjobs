import { type Job } from "@shared/schema";

// Image generation removed - social media previews are now text-only
// This function is no longer used to prevent random strings in social media previews

export function generateJobOGTitle(job: Job): string {
  return `${job.title} - ${job.organization}`;
}

export function generateJobOGDescription(job: Job): string {
  // Calculate deadline in a more user-friendly way
  const deadline = job.deadline ? (() => {
    const deadlineDate = new Date(job.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} days left`;
    } else {
      return `Deadline: ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  })() : '';
  
  // Create social media optimized description - single line format works better for previews
  const parts = [];
  
  if (job.title) parts.push(job.title);
  if (job.organization) parts.push(`${job.organization}`);
  if (job.location && job.country) parts.push(`${job.location}, ${job.country}`);
  if (deadline) parts.push(`Deadline: ${deadline}`);
  parts.push(`Apply now on Somken Jobs`);
  
  return parts.filter(Boolean).join(' • ');
}