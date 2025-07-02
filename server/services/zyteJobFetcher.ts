import type { Job, InsertJob } from "@shared/schema";
import { storage } from "../storage";
import axios from "axios";

// Zyte job extraction service interface
interface ZyteJobResponse {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  datePosted: string;
  deadline?: string;
  applicationUrl: string;
  jobType?: string;
  experienceLevel?: string;
  industry?: string;
  sourceUrl: string;
}

interface ZyteApiResponse {
  status: string;
  jobs: ZyteJobResponse[];
  totalCount: number;
  nextPage?: string;
}

interface ZyteJobDetailResponse {
  status: string;
  job: ZyteJobResponse;
}

export class ZyteJobFetcher {
  private apiKey: string;
  private baseUrl = "https://api.zyte.com/v1";
  
  constructor() {
    this.apiKey = process.env.ZYTE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("ZYTE_API_KEY not found. Zyte integration disabled.");
    }
  }

  /**
   * Get the appropriate Zyte API endpoint for job extraction
   */
  private getJobExtractionEndpoint(country: string): string {
    // Zyte's actual job extraction endpoints vary by region and job board
    const endpoints = {
      kenya: '/extract/jobs/kenya',
      somalia: '/extract/jobs/somalia',
      search: '/extract/jobs/search'
    };
    
    return endpoints[country as keyof typeof endpoints] || endpoints.search;
  }

  /**
   * Fetch jobs for a specific country using Zyte API
   */
  async fetchJobsForCountry(country: 'kenya' | 'somalia', limit = 20): Promise<Job[]> {
    if (!this.apiKey) {
      console.log("Zyte API key not available, skipping Zyte job fetch");
      return [];
    }

    try {
      console.log(`Fetching jobs from Zyte for ${country}...`);
      
      // Configure search parameters based on country
      const searchParams = this.getCountrySearchParams(country);
      const endpoint = this.getJobExtractionEndpoint(country);
      
      const response = await this.makeZyteRequest(endpoint, {
        ...searchParams,
        limit,
        format: 'json'
      });

      if (!response.jobs || response.jobs.length === 0) {
        console.log(`No jobs found from Zyte for ${country}`);
        return [];
      }

      // Convert Zyte format to our Job schema
      const jobs = response.jobs.map(zyteJob => this.convertZyteJobToOurFormat(zyteJob, country));
      
      // Store jobs in database with deduplication
      const savedJobs = await this.saveJobsWithDeduplication(jobs);
      
      console.log(`Successfully fetched and saved ${savedJobs.length} jobs from Zyte for ${country}`);
      return savedJobs;
      
    } catch (error) {
      console.error(`Error fetching jobs from Zyte for ${country}:`, error);
      return [];
    }
  }

  /**
   * Extract specific job details from a URL
   */
  async extractJobFromUrl(jobUrl: string): Promise<Job | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await this.makeZyteJobDetailRequest('/extract-job-details', {
        url: jobUrl,
        format: 'json'
      });

      if (response.job) {
        const jobData = this.convertZyteJobToOurFormat(response.job, 'kenya'); // Default to Kenya
        const savedJobs = await this.saveJobsWithDeduplication([jobData]);
        return savedJobs[0] || null;
      }
      
      return null;
    } catch (error) {
      console.error(`Error extracting job from URL ${jobUrl}:`, error);
      return null;
    }
  }

  /**
   * Search for jobs with specific criteria
   */
  async searchJobs(query: string, location: string, limit = 20): Promise<Job[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await this.makeZyteRequest('/search-jobs', {
        query,
        location,
        limit,
        format: 'json'
      });

      if (response.jobs) {
        const country = this.determineCountryFromLocation(location);
        const jobsData = response.jobs.map(job => this.convertZyteJobToOurFormat(job, country));
        return await this.saveJobsWithDeduplication(jobsData);
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching jobs with query "${query}" in ${location}:`, error);
      return [];
    }
  }

  /**
   * Get job boards and sources available for scraping in each country
   */
  async getAvailableSources(country: 'kenya' | 'somalia'): Promise<string[]> {
    const kenyanSources = [
      'brightermonday.co.ke',
      'jobs.co.ke',
      'myjobmag.co.ke',
      'corporate.co.ke',
      'pigiame.co.ke/jobs',
      'career-point.co.ke'
    ];

    const somalianSources = [
      'jobs.so',
      'somaliaonlinejobs.com',
      'hornaffairsjobs.com'
    ];

    return country === 'kenya' ? kenyanSources : somalianSources;
  }

  private getCountrySearchParams(country: 'kenya' | 'somalia') {
    const baseParams = {
      country: country,
      language: 'en',
      jobTypes: ['full-time', 'part-time', 'contract', 'internship'],
      includeSalary: true,
      includeDescription: true
    };

    if (country === 'kenya') {
      return {
        ...baseParams,
        locations: ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'],
        sources: [
          'brightermonday.co.ke',
          'jobs.co.ke',
          'myjobmag.co.ke'
        ]
      };
    } else {
      return {
        ...baseParams,
        locations: ['mogadishu', 'hargeisa', 'bosaso'],
        sources: [
          'jobs.so',
          'somaliaonlinejobs.com'
        ]
      };
    }
  }

  private async makeZyteRequest(endpoint: string, params: any): Promise<ZyteApiResponse> {
    if (!this.apiKey) {
      console.log(`[Mock] Zyte API request to ${endpoint} - No API key, returning empty results`);
      return { status: 'success', jobs: [], totalCount: 0 };
    }

    try {
      // Real Zyte API integration
      const response = await axios.post(`${this.baseUrl}${endpoint}`, {
        ...params,
        apikey: this.apiKey
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000 // 30 seconds timeout
      });

      if (response.data && response.data.items) {
        // Transform Zyte API response to our expected format
        return {
          status: 'success',
          jobs: response.data.items.map((item: any) => ({
            id: item.id || `zyte_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: item.title || 'Job Title Not Available',
            company: item.company || item.organization || 'Company Not Available',
            location: item.location || item.address || 'Location Not Available',
            description: item.description || item.summary || 'Description not available',
            datePosted: item.datePosted || item.date || new Date().toISOString(),
            deadline: item.deadline || item.closingDate || null,
            applicationUrl: item.applicationUrl || item.url || item.link || '',
            salary: item.salary || item.compensation || null,
            jobType: item.jobType || item.type || null,
            experienceLevel: item.experienceLevel || item.experience || null,
            industry: item.industry || item.sector || null,
            sourceUrl: item.sourceUrl || item.originalUrl || item.url || ''
          })),
          totalCount: response.data.total || response.data.items.length
        };
      }

      return { status: 'success', jobs: [], totalCount: 0 };

    } catch (error) {
      console.error(`Error making Zyte API request to ${endpoint}:`, error);
      // Return empty results instead of throwing to avoid breaking the job fetch process
      return { status: 'error', jobs: [], totalCount: 0 };
    }
  }

  private async makeZyteJobDetailRequest(endpoint: string, params: any): Promise<ZyteJobDetailResponse> {
    if (!this.apiKey) {
      console.log(`[Mock] Zyte Job Detail API request to ${endpoint} - No API key`);
      // Return a mock job detail for testing
      return {
        status: 'success',
        job: {
          id: 'mock_id',
          title: 'Sample Job from Zyte (API Key Required)',
          company: 'Add ZYTE_API_KEY to Replit Secrets',
          location: 'Kenya',
          description: 'This is a sample job. Add your Zyte API key to see real job data.',
          datePosted: new Date().toISOString(),
          applicationUrl: 'https://example.com/apply',
          sourceUrl: 'https://example.com/job'
        }
      };
    }

    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, {
        ...params,
        apikey: this.apiKey
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000
      });

      if (response.data && response.data.item) {
        const item = response.data.item;
        return {
          status: 'success',
          job: {
            id: item.id || `zyte_detail_${Date.now()}`,
            title: item.title || 'Job Title Not Available',
            company: item.company || item.organization || 'Company Not Available',
            location: item.location || item.address || 'Location Not Available',
            description: item.description || item.summary || 'Description not available',
            datePosted: item.datePosted || item.date || new Date().toISOString(),
            deadline: item.deadline || item.closingDate || null,
            applicationUrl: item.applicationUrl || item.url || item.link || '',
            salary: item.salary || item.compensation || null,
            jobType: item.jobType || item.type || null,
            experienceLevel: item.experienceLevel || item.experience || null,
            industry: item.industry || item.sector || null,
            sourceUrl: item.sourceUrl || item.originalUrl || item.url || ''
          }
        };
      }

      throw new Error('No job data found in response');

    } catch (error) {
      console.error(`Error making Zyte job detail request to ${endpoint}:`, error);
      throw error;
    }
  }

  private convertZyteJobToOurFormat(zyteJob: ZyteJobResponse, country: string): InsertJob {
    // Enhance location with city detection
    const enhancedLocation = this.enhanceLocationData(zyteJob.location, country);
    
    // Map Zyte job type to our sector categories
    const sector = this.mapIndustryToSector(zyteJob.industry);
    
    // Clean and format description
    const cleanDescription = this.cleanJobDescription(zyteJob.description);
    
    return {
      title: zyteJob.title,
      organization: zyteJob.company || "Company Name Not Available",
      location: enhancedLocation,
      country: country === 'kenya' ? 'Kenya' : 'Somalia',
      description: cleanDescription,
      url: zyteJob.applicationUrl,
      datePosted: new Date(zyteJob.datePosted),
      deadline: zyteJob.deadline ? new Date(zyteJob.deadline) : null,
      source: "zyte",
      externalId: `zyte_${zyteJob.id}`,
      sector: sector,
      howToApply: `Apply online: ${zyteJob.applicationUrl}`,
      bodyHtml: zyteJob.description,
      createdBy: null // Scraped jobs don't have a creator
    };
  }

  private enhanceLocationData(location: string, country: string): string {
    // Major cities mapping for better location display
    const kenyaCities = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'malindi'];
    const somaliaCities = ['mogadishu', 'hargeisa', 'bosaso', 'kismayo', 'baidoa'];
    
    const cities = country === 'kenya' ? kenyaCities : somaliaCities;
    const countryName = country === 'kenya' ? 'Kenya' : 'Somalia';
    
    // Check if location already includes city
    const locationLower = location.toLowerCase();
    const foundCity = cities.find(city => locationLower.includes(city));
    
    if (foundCity) {
      const properCityName = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
      return `${properCityName}, ${countryName}`;
    }
    
    // Fallback to just country if no city detected
    return countryName;
  }

  private mapIndustryToSector(industry?: string): string | null {
    if (!industry) return null;
    
    const industryLower = industry.toLowerCase();
    
    // Map common industries to our sector categories
    const sectorMapping: Record<string, string> = {
      'healthcare': 'Health',
      'medical': 'Health',
      'health': 'Health',
      'education': 'Education',
      'teaching': 'Education',
      'academic': 'Education',
      'water': 'WASH',
      'sanitation': 'WASH',
      'hygiene': 'WASH',
      'protection': 'Protection',
      'security': 'Protection',
      'food': 'Food Security',
      'nutrition': 'Food Security',
      'agriculture': 'Food Security',
      'ngo': 'Humanitarian',
      'nonprofit': 'Humanitarian',
      'development': 'Humanitarian'
    };
    
    for (const [key, value] of Object.entries(sectorMapping)) {
      if (industryLower.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  private cleanJobDescription(description: string): string {
    // Remove HTML tags and clean formatting
    let cleaned = description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&#\d+;/g, '') // Remove numeric HTML entities
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    // Truncate for preview (keep first 800 characters)
    if (cleaned.length > 800) {
      cleaned = cleaned.substring(0, 800) + '...';
    }
    
    return cleaned;
  }

  private determineCountryFromLocation(location: string): 'kenya' | 'somalia' {
    const locationLower = location.toLowerCase();
    if (locationLower.includes('somalia') || locationLower.includes('mogadishu') || locationLower.includes('hargeisa')) {
      return 'somalia';
    }
    return 'kenya'; // Default to Kenya
  }

  private async saveJobsWithDeduplication(jobs: InsertJob[]): Promise<Job[]> {
    const savedJobs: Job[] = [];
    
    for (const jobData of jobs) {
      try {
        // Check if job already exists by externalId
        const existingJob = await storage.getJobByExternalId(jobData.externalId!);
        
        if (!existingJob) {
          const savedJob = await storage.createJob(jobData);
          savedJobs.push(savedJob);
        } else {
          console.log(`Job already exists: ${jobData.title} (${jobData.externalId})`);
        }
      } catch (error) {
        console.error(`Error saving job ${jobData.title}:`, error);
      }
    }
    
    return savedJobs;
  }
}

export const zyteJobFetcher = new ZyteJobFetcher();