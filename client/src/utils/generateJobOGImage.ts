import { type Job } from "@shared/schema";

// Image generation removed - social media previews are now text-only
// This function is no longer used to prevent random strings in social media previews

export function generateJobOGTitle(job: Job): string {
  return `${job.title} - ${job.organization}`;
}

export function generateJobOGDescription(job: Job): string {
  // Generate dynamic social media text similar to server-side generation
  const deadline = job.deadline ? (() => {
    const deadlineDate = new Date(job.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return ` • Deadline: ${diffDays} days left`;
    } else {
      return ` • Deadline: ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  })() : '';
  
  // Generate catchy social media text based on job characteristics
  let phrase = "🚀 New Exciting Job Alert!"; // default
  
  if (job.title.toLowerCase().includes('manager')) {
    phrase = "🚀 New Management Position Alert!";
  } else if (job.title.toLowerCase().includes('director')) {
    phrase = "💼 Director Role Now Available:";
  } else if (job.title.toLowerCase().includes('coordinator')) {
    phrase = "🌟 Coordinator Position Open:";
  } else if (job.title.toLowerCase().includes('officer')) {
    phrase = "⚡ Officer Role Just Posted:";
  } else if (job.title.toLowerCase().includes('specialist')) {
    phrase = "🎯 Specialist Position Alert:";
  } else if (job.title.toLowerCase().includes('consultant')) {
    phrase = "💫 Consultancy Opportunity:";
  } else if (job.title.toLowerCase().includes('intern')) {
    phrase = "🌱 Internship Opportunity:";
  }
  
  return `${phrase} ${job.title} position in ${job.location}, ${job.country} with ${job.organization}${deadline} | Apply now on Somken Jobs`;
}