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

    try {
      console.log(`Testing Zyte API connection for ${country}...`);
      
      // Test basic Zyte API connectivity first
      const testUrl = country === 'kenya' 
        ? 'https://www.brightermonday.co.ke/jobs' 
        : 'https://jobs.so/';
      
      const response = await axios.post(this.baseUrl, {
        url: testUrl,
        httpResponseBody: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: this.apiKey,
          password: ''
        },
        timeout: 15000
      });

      if (response.status === 200) {
        console.log(`Zyte API connection successful for ${country}! Data size: ${response.data?.httpResponseBody?.length || 0} bytes`);
        
        // Parse jobs from the scraped HTML
        const jobs = await this.parseJobsFromHTML(response.data.httpResponseBody, testUrl, country);
        
        if (jobs.length > 0) {
          console.log(`Successfully extracted ${jobs.length} jobs from ${country} job board`);
          
          // Store jobs in database
          await this.storeJobsInDatabase(jobs);
          
          return jobs.slice(0, limit);
        } else {
          console.log(`No jobs found in scraped content for ${country}`);
          return [];
        }
      } else {
        console.log(`Zyte API returned status ${response.status} for ${country}`);
        return [];
      }
      
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error(`Zyte API authentication failed - check API key`);
      } else if (error.response?.status === 403) {
        console.error(`Zyte API access forbidden - check plan limits`);
      } else {
        console.error(`Zyte API error for ${country}:`, error.response?.data || error.message);
      }
      return [];
    }
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
    
    // Look for job title patterns in the HTML
    const jobTitlePatterns = [
      /<h[1-6][^>]*>([^<]*(?:job|position|vacancy|opportunity|opening)[^<]*)<\/h[1-6]>/gi,
      /<a[^>]*href="[^"]*job[^"]*"[^>]*>([^<]+)<\/a>/gi,
      /<div[^>]*class="[^"]*job[^"]*"[^>]*>[\s\S]*?<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi
    ];
    
    jobTitlePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null && jobs.length < 10) {
        const title = match[1].trim();
        
        // Basic validation - skip if title is too short or looks like navigation
        if (title.length < 5 || title.toLowerCase().includes('menu') || title.toLowerCase().includes('nav')) {
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