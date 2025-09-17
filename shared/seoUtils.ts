import { type Job } from "./schema";

/**
 * SEO Optimization Utilities
 * 
 * This module provides utility functions for generating SEO-compliant titles and descriptions
 * that adhere to search engine best practices:
 * - Titles: 50-60 characters (ideal for SERP display)
 * - Descriptions: 140-160 characters (ideal for SERP snippets)
 * - Smart truncation at word boundaries to avoid mid-word cuts
 * - Strategic keyword placement for better SEO performance
 */

interface SEOOptions {
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  includeJobCount?: boolean;
  includeBrand?: boolean;
}

interface JobStats {
  totalJobs: number;
  organizations: number;
  newToday: number;
}

/**
 * Truncate text at word boundaries with smart handling
 * Avoids cutting words in the middle and ensures proper length limits
 */
function smartTruncate(text: string, maxLength: number, suffix = ""): string {
  if (!text) return "";
  
  // Remove extra whitespace and normalize
  const cleanText = text.trim().replace(/\s+/g, ' ');
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  const cutoff = maxLength - suffix.length;
  
  // Find word boundaries before and after the cutoff point
  const prevSpace = cleanText.lastIndexOf(' ', cutoff);
  const nextSpace = cleanText.indexOf(' ', cutoff);
  
  let bestCutPoint = cutoff;
  
  // Choose the best word boundary within reasonable distance (≤10 chars)
  if (prevSpace !== -1 && (cutoff - prevSpace) <= 10) {
    // Previous space is close enough, use it
    bestCutPoint = prevSpace;
  } else if (nextSpace !== -1 && (nextSpace - cutoff) <= 10) {
    // Next space is close enough and fits within limit
    if (nextSpace < maxLength - suffix.length) {
      bestCutPoint = nextSpace;
    } else {
      // Next space is too far, check if we have any space at all
      bestCutPoint = prevSpace !== -1 ? prevSpace : cutoff;
    }
  } else if (prevSpace !== -1) {
    // Use previous space even if far, better than cutting mid-word
    bestCutPoint = prevSpace;
  }
  // If no spaces found at all, bestCutPoint remains cutoff (hard limit)
  
  const truncated = cleanText.substring(0, bestCutPoint).trim();
  
  // If we ended up with a very short result, try without being so strict
  if (truncated.length < maxLength * 0.5 && prevSpace === -1 && nextSpace !== -1) {
    // No previous space, but there's a next space - check if it's reasonable
    const nextSpaceTruncated = cleanText.substring(0, Math.min(nextSpace, maxLength - suffix.length)).trim();
    if (nextSpaceTruncated.length > truncated.length) {
      const finalTruncated = nextSpaceTruncated;
      // Avoid ending with punctuation if we're adding suffix
      if (suffix && finalTruncated.match(/[.,;:!?-]$/)) {
        return finalTruncated.replace(/[.,;:!?-]+$/, '') + suffix;
      }
      return finalTruncated + suffix;
    }
  }
  
  // Avoid ending with punctuation if we're adding suffix
  if (suffix && truncated.match(/[.,;:!?-]$/)) {
    return truncated.replace(/[.,;:!?-]+$/, '') + suffix;
  }
  
  return truncated + suffix;
}

/**
 * Generate optimized page title with smart truncation and keyword placement
 */
export function generateOptimizedTitle(
  primaryTitle: string,
  context: {
    location?: string;
    country?: string;
    organization?: string;
    sector?: string;
    jobCount?: number;
    pageType?: 'homepage' | 'jobs' | 'job-detail' | 'search';
  } = {},
  options: SEOOptions = {}
): string {
  const {
    maxTitleLength = 60,
    includeBrand = true
  } = options;
  
  const brand = "Somken Jobs";
  const { location, country, organization, sector, jobCount, pageType } = context;
  
  let title = "";
  
  // Build title based on page type with strategic keyword placement
  switch (pageType) {
    case 'homepage':
      if (jobCount) {
        title = `East Africa Jobs - ${jobCount}+ Humanitarian Opportunities | ${brand}`;
      } else {
        title = `East Africa Jobs - Humanitarian Careers | ${brand}`;
      }
      break;
      
    case 'jobs':
      if (location && country) {
        title = `Jobs in ${location}, ${country}`;
        if (jobCount) title += ` - ${jobCount}+ Positions`;
        title += ` | ${brand}`;
      } else if (country) {
        title = `Jobs in ${country}`;
        if (jobCount) title += ` - ${jobCount}+ Positions`;
        title += ` | ${brand}`;
      } else {
        title = jobCount ? `${jobCount}+ Jobs` : "Jobs";
        title += ` | ${brand}`;
      }
      break;
      
    case 'job-detail':
      if (organization) {
        title = `${primaryTitle} - ${organization} | ${brand}`;
      } else {
        title = `${primaryTitle} | ${brand}`;
      }
      break;
      
    case 'search':
      title = `${primaryTitle} | ${brand}`;
      break;
      
    default:
      title = includeBrand ? `${primaryTitle} | ${brand}` : primaryTitle;
  }
  
  // Smart truncation to stay within SEO limits
  return smartTruncate(title, maxTitleLength);
}

/**
 * Generate optimized meta description with smart truncation and compelling content
 */
export function generateOptimizedDescription(
  primaryContent: string,
  context: {
    location?: string;
    country?: string;
    organization?: string;
    sector?: string;
    jobCount?: number;
    deadline?: string | Date;
    pageType?: 'homepage' | 'jobs' | 'job-detail' | 'search';
    jobStats?: JobStats;
  } = {},
  options: SEOOptions = {}
): string {
  const {
    maxDescriptionLength = 160
  } = options;
  
  const { location, country, organization, sector, jobCount, deadline, pageType, jobStats } = context;
  
  let description = "";
  
  // Build description based on page type with compelling, action-oriented language
  switch (pageType) {
    case 'homepage':
      if (jobStats) {
        description = `Find ${jobStats.totalJobs}+ humanitarian jobs in East Africa. Leading NGO and UN positions in Kenya, Somalia, Ethiopia. Updated daily from ReliefWeb with ${jobStats.organizations}+ employers.`;
      } else {
        description = `Discover humanitarian jobs across East Africa. Find NGO careers, UN positions, and development opportunities in Kenya, Somalia, Ethiopia, Uganda & Tanzania.`;
      }
      break;
      
    case 'jobs':
      if (location && country) {
        description = `Browse ${jobCount || 'current'} job opportunities in ${location}, ${country}. Find humanitarian careers with leading NGOs and UN agencies. Apply today.`;
      } else if (country) {
        description = `Find ${jobCount || 'humanitarian'} jobs in ${country}. Current openings with NGOs, UN agencies, and development organizations. Updated daily.`;
      } else {
        description = `Browse ${jobCount || 'thousands of'} humanitarian jobs across East Africa. NGO careers, UN positions, aid work opportunities. Apply now.`;
      }
      break;
      
    case 'job-detail':
      if (organization && location && country) {
        let desc = `${primaryContent.replace(/<[^>]*>/g, '').substring(0, 80)}... Join ${organization} in ${location}, ${country}.`;
        if (sector) desc += ` ${sector} sector position.`;
        if (deadline) {
          const deadlineDate = new Date(deadline);
          if (!isNaN(deadlineDate.getTime())) {
            const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0) desc += ` ${daysLeft} days to apply.`;
          }
        }
        desc += " Apply now on Somken Jobs.";
        description = desc;
      } else {
        description = smartTruncate(primaryContent.replace(/<[^>]*>/g, ''), maxDescriptionLength - 20) + " Apply now.";
      }
      break;
      
    default:
      description = primaryContent.replace(/<[^>]*>/g, '');
  }
  
  // Smart truncation to stay within SEO limits
  return smartTruncate(description, maxDescriptionLength);
}

/**
 * Generate job-specific SEO metadata with optimized title and description
 */
export function generateJobSEOMetadata(job: Job): {
  title: string;
  description: string;
  keywords: string;
} {
  const title = generateOptimizedTitle(
    job.title,
    {
      organization: job.organization,
      location: job.location,
      country: job.country,
      sector: job.sector || undefined,
      pageType: 'job-detail'
    }
  );
  
  const description = generateOptimizedDescription(
    job.description || "Join this humanitarian organization in their mission to make a difference.",
    {
      organization: job.organization,
      location: job.location,
      country: job.country,
      sector: job.sector || undefined,
      deadline: job.deadline || undefined,
      pageType: 'job-detail'
    }
  );
  
  // Generate relevant keywords for the job
  const keywords = [
    job.title,
    job.organization,
    `jobs in ${job.country}`,
    `${job.location} jobs`,
    "humanitarian jobs",
    job.sector ? `${job.sector} careers` : "NGO careers"
  ].filter(Boolean).join(", ");
  
  return { title, description, keywords };
}

/**
 * Generate homepage SEO metadata with optimized content
 */
export function generateHomepageSEOMetadata(jobStats?: JobStats): {
  title: string;
  description: string;
  keywords: string;
} {
  const title = generateOptimizedTitle(
    "East Africa Humanitarian Jobs",
    {
      jobCount: jobStats?.totalJobs,
      pageType: 'homepage'
    }
  );
  
  const description = generateOptimizedDescription(
    "Leading platform for humanitarian careers",
    {
      jobStats,
      pageType: 'homepage'
    }
  );
  
  const keywords = "East Africa jobs, humanitarian careers, NGO jobs, UN positions, Kenya jobs, Somalia jobs, Ethiopia jobs, development careers, ReliefWeb jobs";
  
  return { title, description, keywords };
}

/**
 * Generate jobs listing page SEO metadata
 */
export function generateJobsListingSEOMetadata(
  totalCount: number,
  filters: {
    country?: string;
    location?: string;
    sector?: string;
    organization?: string;
  } = {}
): {
  title: string;
  description: string;
  keywords: string;
} {
  let titleContext = "";
  if (filters.location && filters.country) {
    titleContext = `${filters.location}, ${filters.country}`;
  } else if (filters.country) {
    titleContext = filters.country;
  } else if (filters.sector) {
    titleContext = `${filters.sector} Sector`;
  }
  
  const titlePrefix = titleContext ? `${titleContext} Jobs` : "Humanitarian Jobs";
  
  const title = generateOptimizedTitle(
    titlePrefix,
    {
      location: filters.location,
      country: filters.country,
      sector: filters.sector,
      jobCount: totalCount,
      pageType: 'jobs'
    }
  );
  
  const description = generateOptimizedDescription(
    "Browse current job opportunities",
    {
      location: filters.location,
      country: filters.country,
      sector: filters.sector,
      jobCount: totalCount,
      pageType: 'jobs'
    }
  );
  
  // Build keywords based on filters
  const keywordParts = ["humanitarian jobs", "NGO careers"];
  if (filters.country) keywordParts.push(`jobs in ${filters.country}`);
  if (filters.location) keywordParts.push(`${filters.location} jobs`);
  if (filters.sector) keywordParts.push(`${filters.sector} careers`);
  keywordParts.push("East Africa jobs", "development careers");
  
  const keywords = keywordParts.join(", ");
  
  return { title, description, keywords };
}

/**
 * Generate search results SEO metadata
 */
export function generateSearchSEOMetadata(
  query: string,
  resultCount: number
): {
  title: string;
  description: string;
  keywords: string;
} {
  const title = generateOptimizedTitle(
    `${query} Jobs`,
    {
      jobCount: resultCount,
      pageType: 'search'
    }
  );
  
  const description = generateOptimizedDescription(
    `Search results for ${query}`,
    {
      jobCount: resultCount,
      pageType: 'search'
    }
  );
  
  const keywords = `${query}, ${query} jobs, humanitarian careers, NGO positions, East Africa jobs`;
  
  return { title, description, keywords };
}

/**
 * Validate SEO metadata lengths and provide warnings
 */
export function validateSEOMetadata(metadata: {
  title: string;
  description: string;
}): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;
  
  // Check title length
  if (metadata.title.length < 30) {
    warnings.push(`Title too short (${metadata.title.length} chars). Aim for 50-60 characters.`);
    isValid = false;
  } else if (metadata.title.length > 70) {
    warnings.push(`Title too long (${metadata.title.length} chars). May be truncated in search results.`);
    isValid = false;
  }
  
  // Check description length
  if (metadata.description.length < 120) {
    warnings.push(`Description too short (${metadata.description.length} chars). Aim for 140-160 characters.`);
    isValid = false;
  } else if (metadata.description.length > 170) {
    warnings.push(`Description too long (${metadata.description.length} chars). May be truncated in search results.`);
    isValid = false;
  }
  
  return { isValid, warnings };
}