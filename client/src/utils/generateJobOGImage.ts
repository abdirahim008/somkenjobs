import { type Job } from "@shared/schema";

// Image generation removed - social media previews are now text-only
// This function is no longer used to prevent random strings in social media previews

export function generateJobOGTitle(job: Job): string {
  return `${job.title} - ${job.organization}`;
}

export function generateJobOGDescription(job: Job): string {
  const deadline = job.deadline ? 
    ` • Deadline: ${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 
    '';
  
  return `${job.title} • ${job.organization} • ${job.location}, ${job.country}${deadline} • Apply now on Somken Jobs`;
}