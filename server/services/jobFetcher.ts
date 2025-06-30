import { storage } from "../storage";
import { type InsertJob } from "@shared/schema";
import * as cron from "node-cron";

const RELIEFWEB_API_URL = "https://api.reliefweb.int/v1/jobs";
const UNJOBS_RSS_URL = "https://jobs.un.org/rss";
const UNJOBS_API_URL = "https://jobs.un.org/api/v1/jobs";

interface ReliefWebJob {
  id: string;
  fields: {
    title: string;
    body?: string;
    "body-html"?: string;
    date: {
      created: string;
      closing?: string;
    };
    source?: {
      name: string;
    };
    country?: Array<{
      name: string;
    }>;
    url?: string;
    url_alias?: string;
    career_categories?: Array<{
      name: string;
    }>;
    theme?: Array<{
      name: string;
    }>;
    how_to_apply?: string;
    "how_to_apply-html"?: string;
    experience?: Array<{
      name: string;
    }>;
    type?: Array<{
      name: string;
    }>;
  };
}

interface ReliefWebResponse {
  data: ReliefWebJob[];
  totalCount: number;
}

export class JobFetcher {
  private isRunning = false;

  async fetchReliefWebJobs(): Promise<void> {
    try {
      console.log("Fetching jobs from ReliefWeb...");
      
      // Fetch jobs for Kenya and Somalia
      const countries = ["Kenya", "Somalia"];
      
      for (const country of countries) {
        // Use proper ReliefWeb API v1 format
        const requestBody = {
          appname: "jobconnect-eastafrica",
          query: {
            value: country,
            fields: ["country"]
          },
          fields: {
            include: [
              "title",
              "body",
              "body-html",
              "date.created",
              "date.closing",
              "source.name",
              "country.name", 
              "url_alias",
              "theme.name",
              "career_categories.name",
              "how_to_apply",
              "how_to_apply-html",
              "experience",
              "type.name"
            ]
          },
          limit: 50,
          sort: ["date.created:desc"]
        };

        const response = await fetch(RELIEFWEB_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'JobConnect-EastAfrica/1.0',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`ReliefWeb API error: ${response.status} ${response.statusText}`);
        }

        const data: ReliefWebResponse = await response.json();
        
        for (const rwJob of data.data) {
          const existingJob = await storage.getJobByExternalId(`reliefweb-${rwJob.id}`);
          if (existingJob) continue; // Skip if already exists

          // Extract location - use first country or default to country name
          const location = rwJob.fields.country?.[0]?.name || country;
          
          // Extract sector from career categories
          const sector = rwJob.fields.career_categories?.[0]?.name || "General";
          
          // Clean up description (remove HTML tags)
          const description = rwJob.fields.body?.replace(/<[^>]*>/g, "").substring(0, 500) || "";

          // Extract organization name from title or use source name as fallback
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
            
            // If no pattern matches, try to extract from description or use source
            return rwJob.fields.source?.name || "Humanitarian Organization";
          };

          const organizationName = extractOrganizationFromTitle(rwJob.fields.title);

          // Extract comprehensive job information
          const howToApply = rwJob.fields.how_to_apply || rwJob.fields["how_to_apply-html"] || null;
          const experience = rwJob.fields.experience?.map(exp => exp.name).join(", ") || null;
          const bodyHtml = rwJob.fields["body-html"] || null;

          const job: InsertJob = {
            title: rwJob.fields.title,
            organization: organizationName,
            location: location,
            country: country,
            description: description,
            url: rwJob.fields.url_alias ? `https://reliefweb.int${rwJob.fields.url_alias}` : `https://reliefweb.int/job/${rwJob.id}`,
            datePosted: new Date(rwJob.fields.date.created),
            deadline: rwJob.fields.date.closing ? new Date(rwJob.fields.date.closing) : null,
            sector: rwJob.fields.theme?.[0]?.name || sector,
            source: "reliefweb",
            externalId: `reliefweb-${rwJob.id}`,
            howToApply: howToApply,
            experience: experience,
            qualifications: null, // Will be extracted from description
            responsibilities: null, // Will be extracted from description
            bodyHtml: bodyHtml
          };

          await storage.createJob(job);
        }
        
        console.log(`Fetched ${data.data.length} jobs from ReliefWeb for ${country}`);
      }
    } catch (error) {
      console.error("Error fetching ReliefWeb jobs:", error);
    }
  }

  async fetchUNJobs(): Promise<void> {
    try {
      console.log("Fetching jobs from UN Jobs RSS...");
      
      const response = await fetch(UNJOBS_RSS_URL);
      if (!response.ok) {
        throw new Error(`UN Jobs RSS error: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      
      // Simple XML parsing for RSS (in production, you'd use a proper XML parser)
      const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const item of itemMatches) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        
        if (!titleMatch || !linkMatch) continue;
        
        const title = titleMatch[1];
        const url = linkMatch[1];
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").substring(0, 500) : "";
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();
        
        // Filter for Kenya and Somalia jobs
        const titleLower = title.toLowerCase();
        const descLower = description.toLowerCase();
        
        if (!titleLower.includes("kenya") && !titleLower.includes("somalia") && 
            !descLower.includes("kenya") && !descLower.includes("somalia")) {
          continue;
        }
        
        // Determine country
        let country = "Kenya"; // default
        if (titleLower.includes("somalia") || descLower.includes("somalia")) {
          country = "Somalia";
        }
        
        const externalId = `unjobs-${Buffer.from(url).toString('base64').substring(0, 20)}`;
        const existingJob = await storage.getJobByExternalId(externalId);
        if (existingJob) continue;

        const job: InsertJob = {
          title: title,
          organization: "United Nations",
          location: country,
          country: country,
          description: description,
          url: url,
          datePosted: pubDate,
          deadline: null,
          sector: "General",
          source: "unjobs",
          externalId: externalId
        };

        await storage.createJob(job);
      }
      
      console.log("Finished fetching UN Jobs");
    } catch (error) {
      console.error("Error fetching UN Jobs:", error);
    }
  }

  async fetchAllJobs(): Promise<void> {
    if (this.isRunning) {
      console.log("Job fetch already in progress, skipping...");
      return;
    }

    this.isRunning = true;
    console.log("Fetching comprehensive jobs from ReliefWeb...");
    try {
      await this.fetchReliefWebJobs();
      console.log("Job fetch completed successfully");
    } catch (error) {
      console.error("Error in job fetch:", error);
    } finally {
      this.isRunning = false;
    }
  }

  startScheduler(): void {
    // Run every day at 6 AM
    cron.schedule("0 6 * * *", () => {
      console.log("Starting scheduled job fetch...");
      this.fetchAllJobs();
    });

    // Also run immediately on startup
    setTimeout(() => {
      this.fetchAllJobs();
    }, 5000); // Wait 5 seconds after startup
  }
}

export const jobFetcher = new JobFetcher();
