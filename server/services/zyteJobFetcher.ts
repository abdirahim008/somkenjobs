import type { Job, InsertJob } from "@shared/schema";
import { storage } from "../storage";
import axios from "axios";

export class ZyteJobFetcher {
  private apiKey: string;
  private baseUrl = "https://api.zyte.com/v1/extract";
  
  constructor() {
    this.apiKey = process.env.ZYTE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("ZYTE_API_KEY not found. Zyte integration disabled.");
    } else {
      console.log("Zyte API key found - integration enabled");
    }
  }

  /**
   * Fetch jobs for a specific country using Zyte API
   */
  async fetchJobsForCountry(country: 'kenya' | 'somalia', limit = 5): Promise<InsertJob[]> {
    if (!this.apiKey) {
      console.log("Zyte API key not available, skipping Zyte job fetch");
      return [];
    }

    // Current job boards don't have readily accessible job listings via simple HTML scraping
    // The sites either use dynamic loading or don't have active job postings
    console.log(`Zyte API integration available for ${country}, but current job board sources need investigation`);
    console.log(`Tested URLs like somalijobs.com/jobs don't contain scrapeable job listings - they may require:
    - Specific search parameters or filters
    - JavaScript execution for dynamic content
    - Authentication or registration
    - Different URL patterns for job listings`);
    
    // Until we identify reliable job board URLs with actual listings, return empty array
    // This prevents storing navigation elements as fake job postings
    return [];
  }

  /**
   * Get available job board URLs for each country
   */
  getJobBoardUrls(country: 'kenya' | 'somalia'): string[] {
    if (country === 'kenya') {
      return [
        'https://www.brightermonday.co.ke/jobs',
        'https://www.jobs.co.ke/jobs',
        'https://www.myjobmag.co.ke/jobs'
      ];
    } else {
      return [
        'https://somalijobs.com/jobs',
        'https://www.brightermonday.co.ke/jobs?location=somalia',
        'https://jobs.so/',
        'https://www.somaliaonlinejobs.com/jobs'
      ];
    }
  }

  /**
   * Parse jobs from HTML content
   */
  private async parseJobsFromHTML(htmlContent: string, sourceUrl: string, country: 'kenya' | 'somalia'): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];
    
    try {
      // Base64 decode the HTML content
      const decodedHtml = Buffer.from(htmlContent, 'base64').toString('utf-8');
      
      // Extract job listings based on common patterns
      const jobListings = this.extractJobListings(decodedHtml, sourceUrl, country);
      
      return jobListings;
    } catch (error: any) {
      console.error('Error parsing HTML content:', error.message);
      return [];
    }
  }

  /**
   * Extract job listings from HTML using pattern matching
   */
  private extractJobListings(html: string, sourceUrl: string, country: 'kenya' | 'somalia'): InsertJob[] {
    const jobs: InsertJob[] = [];
    
    // Enhanced job title patterns for better extraction
    const jobTitlePatterns = [
      // Specific job title patterns with professional keywords
      /<h[1-6][^>]*>([^<]*(?:Engineer|Manager|Coordinator|Officer|Assistant|Director|Analyst|Specialist|Developer|Consultant|Accountant|Teacher|Nurse|Doctor|Driver|Secretary|Technician|Supervisor|Executive|Representative|Administrator)[^<]*)<\/h[1-6]>/gi,
      // Job title links 
      /<a[^>]*href="[^"]*job[^"]*"[^>]*>([A-Z][^<]{10,80})<\/a>/gi,
      // Job cards with titles
      /<div[^>]*class="[^"]*job[^"]*"[^>]*>[\s\S]*?<h[1-6][^>]*>([A-Z][^<]{10,})<\/h[1-6]>/gi,
      // Professional role patterns in text
      />([A-Z][a-z\s]*(Engineer|Manager|Coordinator|Officer|Assistant|Director|Analyst|Specialist|Developer|Consultant|Accountant|Supervisor|Executive|Representative|Administrator)[a-z\s]*)</gi,
      // Job listing patterns
      /<li[^>]*>([^<]*(?:Engineer|Manager|Coordinator|Officer|Assistant|Director|Analyst|Specialist|Developer|Consultant)[^<]*)<\/li>/gi
    ];
    
    jobTitlePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null && jobs.length < 10) {
        const title = match[1].trim();
        
        // Enhanced validation - skip navigation, buttons, and generic elements
        const titleLower = title.toLowerCase();
        const skipPatterns = [
          'menu', 'nav', 'find jobs', 'post a job', 'home', 'about', 'contact',
          'login', 'register', 'search', 'browse', 'explore', 'find now',
          'apply now', 'view all', 'see more', 'click here', 'read more',
          'download', 'app', 'mobile', 'follow us', 'social media', 'privacy',
          'terms', 'conditions', 'cookie', 'subscribe', 'newsletter'
        ];
        
        if (title.length < 10 || 
            skipPatterns.some(pattern => titleLower.includes(pattern)) ||
            titleLower === titleLower.toUpperCase() || // Skip all caps text
            !/[a-zA-Z]/.test(title)) { // Skip if no letters
          continue;
        }
        
        // Create job object matching the schema
        const job: InsertJob = {
          title: title,
          organization: this.extractOrganization(sourceUrl),
          location: this.getLocationForCountry(country),
          country: country === 'kenya' ? 'Kenya' : 'Somalia',
          description: 'Job details available on source website. Visit the source link for complete job description and requirements.',
          url: sourceUrl,
          datePosted: new Date(),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          sector: 'General',
          source: 'Zyte',
          externalId: `zyte_${sourceUrl}_${title.replace(/[^a-zA-Z0-9]/g, '_')}`,
          howToApply: `Visit ${sourceUrl} to apply for this position`,
          experience: 'Mid-Level',
          qualifications: 'Please refer to the original job posting for specific qualifications',
          responsibilities: 'Please refer to the original job posting for detailed responsibilities',
          bodyHtml: undefined,
          createdBy: undefined,
          status: 'published'
        };
        
        jobs.push(job);
      }
    });
    
    return jobs;
  }

  /**
   * Extract organization name from URL
   */
  private extractOrganization(url: string): string {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    const organizationMap: { [key: string]: string } = {
      'brightermonday.co.ke': 'BrighterMonday Kenya',
      'jobs.co.ke': 'Jobs.co.ke',
      'myjobmag.co.ke': 'MyJobMag Kenya',
      'somalijobs.com': 'SomaliJobs.com',
      'jobs.so': 'Jobs.so Somalia',
      'somaliaonlinejobs.com': 'Somalia Online Jobs'
    };
    
    return organizationMap[hostname] || hostname;
  }

  /**
   * Get location for country
   */
  private getLocationForCountry(country: 'kenya' | 'somalia'): string {
    return country === 'kenya' ? 'Nairobi, Kenya' : 'Mogadishu, Somalia';
  }

  /**
   * Store jobs in database with deduplication
   */
  private async storeJobsInDatabase(jobs: InsertJob[]): Promise<void> {
    try {
      for (const job of jobs) {
        // Simple deduplication by externalId
        // In production, you might want to query the database directly
        // For now, we'll just create the job and let the database handle uniqueness
        await storage.createJob(job);
      }
    } catch (error: any) {
      console.error('Error storing jobs in database:', error.message);
    }
  }

  /**
   * Create sample jobs for testing when scraping doesn't find real listings
   */
  private createSampleJobsForTesting(country: 'kenya' | 'somalia', sourceUrl: string): InsertJob[] {
    if (country !== 'somalia') return []; // Only create samples for Somalia to demonstrate Zyte integration
    
    const sampleJobs: InsertJob[] = [
      {
        title: "Project Coordinator - Humanitarian Response",
        organization: "SomaliJobs.com",
        location: "Mogadishu, Somalia", 
        country: "Somalia",
        description: "Seeking experienced Project Coordinator for humanitarian response initiatives in Somalia. Responsible for coordinating relief efforts and managing field operations.",
        url: sourceUrl,
        datePosted: new Date(),
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        sector: "Humanitarian",
        source: "Zyte",
        externalId: `zyte_sample_somalia_coordinator_${Date.now()}`,
        howToApply: `Visit ${sourceUrl} to apply for this position`,
        experience: "3-5 years",
        qualifications: "Bachelor's degree in relevant field, experience in humanitarian work",
        responsibilities: "Coordinate humanitarian response activities, manage field teams, ensure compliance with protocols",
        bodyHtml: undefined,
        createdBy: undefined,
        status: 'published'
      }
    ];
    
    return sampleJobs;
  }

  /**
   * Test API connectivity and quota
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await axios.post(this.baseUrl, {
        url: 'https://httpbin.org/get',
        httpResponseBody: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: this.apiKey,
          password: ''
        },
        timeout: 10000
      });

      return response.status === 200;
    } catch (error: any) {
      console.error('Zyte API connection test failed:', error.response?.data || error.message);
      return false;
    }
  }
}

// Export a singleton instance
export const zyteJobFetcher = new ZyteJobFetcher();