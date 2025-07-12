import { type Job } from "@shared/schema";

export function generateJobOGImageUrl(job: Job): string {
  // Create a dynamic SVG with job-specific information
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background with gradient -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0077B5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#005885;stop-opacity:1" />
        </linearGradient>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="40" height="40">
          <circle cx="20" cy="20" r="1" fill="white" opacity="0.1"/>
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGradient)"/>
      <rect width="1200" height="630" fill="url(#dots)"/>
      
      <!-- Header section -->
      <rect x="0" y="0" width="1200" height="80" fill="#ffffff" fill-opacity="0.05"/>
      
      <!-- Logo and branding -->
      <g transform="translate(60, 20)">
        <rect x="0" y="0" width="40" height="40" rx="8" fill="#ffffff"/>
        <rect x="8" y="8" width="24" height="24" rx="4" fill="#0077B5"/>
        <text x="55" y="18" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Somken Jobs</text>
        <text x="55" y="35" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" opacity="0.8">East Africa</text>
      </g>
      
      <!-- Main content area -->
      <g transform="translate(60, 140)">
        <!-- Job icon -->
        <circle cx="30" cy="30" r="25" fill="#ffffff" fill-opacity="0.15"/>
        <rect x="20" y="20" width="20" height="14" rx="2" fill="#ffffff"/>
        <rect x="22" y="18" width="16" height="4" rx="1" fill="#ffffff"/>
        
        <!-- Job title (truncated if too long) -->
        <text x="80" y="25" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
          ${job.title.length > 35 ? job.title.substring(0, 35) + '...' : job.title}
        </text>
        
        <!-- Organization -->
        <text x="80" y="55" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" opacity="0.9">
          ${job.organization.length > 45 ? job.organization.substring(0, 45) + '...' : job.organization}
        </text>
        
        <!-- Location -->
        <g transform="translate(0, 100)">
          <circle cx="15" cy="15" r="12" fill="#ffffff" fill-opacity="0.2"/>
          <circle cx="15" cy="15" r="6" fill="#ffffff"/>
          <text x="40" y="12" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="500">
            ${job.location}, ${job.country}
          </text>
          <text x="40" y="28" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" opacity="0.8">
            ${job.sector || 'Humanitarian Position'}
          </text>
        </g>
        
        <!-- Deadline if available -->
        ${job.deadline ? `
        <g transform="translate(0, 160)">
          <rect x="0" y="0" width="24" height="24" rx="4" fill="#ffffff" fill-opacity="0.2"/>
          <text x="30" y="16" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" opacity="0.8">
            Deadline: ${new Date(job.deadline).toLocaleDateString()}
          </text>
        </g>
        ` : ''}
        
        <!-- Call to action -->
        <g transform="translate(0, 220)">
          <rect x="0" y="0" width="180" height="50" rx="25" fill="#ffffff" fill-opacity="0.9"/>
          <text x="90" y="32" fill="#0077B5" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Apply Now</text>
        </g>
        
        <!-- Bottom info -->
        <text x="0" y="300" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" opacity="0.7">
          Apply today • somkenjobs.com
        </text>
      </g>
      
      <!-- Bottom accent -->
      <rect x="0" y="550" width="1200" height="80" fill="#ffffff" fill-opacity="0.03"/>
      <rect x="60" y="580" width="300" height="3" fill="#ffffff" opacity="0.5"/>
    </svg>
  `;

  // Convert SVG to data URL
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml,${encodedSvg}`;
}

export function generateJobOGTitle(job: Job): string {
  return `${job.title} - ${job.organization}`;
}

export function generateJobOGDescription(job: Job): string {
  const deadline = job.deadline ? 
    ` • Deadline: ${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 
    '';
  
  return `${job.title} • ${job.organization} • ${job.location}, ${job.country}${deadline} • Apply now on Somken Jobs`;
}