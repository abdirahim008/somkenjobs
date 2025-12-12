import { storage } from "../storage";
import { type InsertJob } from "@shared/schema";
import * as cron from "node-cron";


const RELIEFWEB_API_URL = "https://api.reliefweb.int/v1/jobs";
const UNTALENT_API_URL = "https://untalent.org/api/v1/jobs";
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
    source?: Array<{
      name: string;
      shortname?: string;
      longname?: string;
      homepage?: string;
      type?: {
        id: number;
        name: string;
      };
    }>;
    country?: Array<{
      name: string;
      iso3?: string;
      shortname?: string;
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

interface UNTalentJob {
  slug: string;
  title: string;
  company: string;
  location: string;
  is_homebased: boolean;
  shortDescription?: string;
  description?: string;
  expiresAt?: string;
  areaSlugs?: string[];
  locationSlugs?: string[];
  jobLevel?: string;
  contractType?: string;
  url?: string;
}

interface UNTalentResponse {
  data: UNTalentJob[];
  pagination?: {
    currentPage: number;
    totalPages: number;
  };
}

export class JobFetcher {
  private isRunning = false;

  async fetchReliefWebJobs(): Promise<void> {
    try {
      console.log("Fetching jobs from ReliefWeb...");
      
      // Fetch jobs for East African countries
      const countries = ["Kenya", "Somalia", "Ethiopia", "Uganda", "Tanzania"];
      
      for (const country of countries) {
        // Build URL parameters for GET request
        const params = new URLSearchParams();
        params.append('appname', 'jobconnect-eastafrica-w2ZduVJ8jH9');
        params.append('limit', '15');
        params.append('query[value]', country);
        params.append('query[fields][]', 'country.name');
        params.append('sort[]', 'date.created:desc');
        
        // Add each field separately
        const fields = [
          "id", "title", "body", "body-html", "date.created", "date.closing", 
          "date.changed", "source.name", "source.shortname", "source.longname", 
          "source.homepage", "source.type", "country.name", "country.iso3", 
          "country.shortname", "url", "url_alias", "theme.name", 
          "career_categories.name", "how_to_apply", "how_to_apply-html", 
          "experience.name", "type.name"
        ];
        
        fields.forEach(field => {
          params.append('fields[include][]', field);
        });

        const url = `${RELIEFWEB_API_URL}?${params}`;
        console.log(`Fetching ${country} jobs from ReliefWeb...`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'JobConnect-EastAfrica/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`ReliefWeb API error for ${country}: ${response.status} ${response.statusText}`);
          continue; // Skip this country and try the next one
        }

        const data: ReliefWebResponse = await response.json();
        
        console.log(`ReliefWeb returned ${data.data.length} jobs for ${country}`);
        
        // Log the dates of returned jobs for debugging
        if (data.data.length > 0) {
          console.log(`Date range for ${country}: ${data.data[data.data.length - 1].fields.date.created} to ${data.data[0].fields.date.created}`);
        }
        
        let newJobsCount = 0;
        let skippedJobsCount = 0;
        
        for (const rwJob of data.data) {
          const existingJob = await storage.getJobByExternalId(`reliefweb-${rwJob.id}`);
          if (existingJob) {
            skippedJobsCount++;
            console.log(`Skipping existing job: ${rwJob.id} - ${rwJob.fields.title} (${rwJob.fields.date.created})`);
            continue; // Skip if already exists
          }

          // Extract location with enhanced city detection
          const countryName = rwJob.fields.country?.[0]?.name || country;
          let location = countryName;
          
          // Try to extract city from job title and description
          const titleAndDesc = `${rwJob.fields.title} ${rwJob.fields.body || ''}`.toLowerCase();
          
          // Common cities in Kenya and Somalia
          const kenyanCities = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'malindi', 'kitale', 'garissa', 'isiolo'];
          const somaliCities = ['mogadishu', 'hargeisa', 'bosaso', 'kismayo', 'galkayo', 'baidoa', 'berbera', 'burao'];
          
          const allCities = [...kenyanCities, ...somaliCities];
          
          // Check if any city is mentioned in the job content
          for (const city of allCities) {
            if (titleAndDesc.includes(city)) {
              // Capitalize city name properly
              const properCityName = city.charAt(0).toUpperCase() + city.slice(1);
              location = `${properCityName}, ${countryName}`;
              console.log(`Enhanced location detected: ${location} from job content`);
              break;
            }
          }
          
          // Extract sector from theme first, then career categories 
          const sector = rwJob.fields.theme?.[0]?.name || 
                        rwJob.fields.career_categories?.[0]?.name || 
                        "General";
          
          // Store both truncated description and full HTML content
          const rawDescription = rwJob.fields.body || "";
          const fullHtmlDescription = rwJob.fields["body-html"] || rawDescription;
          
          // Create truncated plain text version for preview
          const description = rawDescription
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 800) || ""; // Truncated for card display



          // Extract comprehensive job information
          const howToApply = rwJob.fields.how_to_apply || rwJob.fields["how_to_apply-html"] || null;
          const experience = rwJob.fields.experience?.map(exp => exp.name).join(", ") || null;
          const bodyHtml = rwJob.fields["body-html"] || null;

          // Use the best available organization name
          const organization = rwJob.fields.source?.[0]?.longname || 
                             rwJob.fields.source?.[0]?.name || 
                             "ReliefWeb Organization";

          const job: InsertJob = {
            title: rwJob.fields.title,
            organization: organization,
            location: location,
            country: country,
            description: description,
            url: rwJob.fields.url || 
                 (rwJob.fields.url_alias ? `https://reliefweb.int${rwJob.fields.url_alias}` : `https://reliefweb.int/job/${rwJob.id}`),
            datePosted: new Date(rwJob.fields.date.created),
            deadline: rwJob.fields.date.closing ? new Date(rwJob.fields.date.closing) : null,
            sector: rwJob.fields.theme?.[0]?.name || sector,
            source: "reliefweb",
            externalId: `reliefweb-${rwJob.id}`,
            howToApply: howToApply,
            experience: experience,
            qualifications: null, // Will be extracted from description
            responsibilities: null, // Will be extracted from description
            bodyHtml: fullHtmlDescription,
            type: "job" // ReliefWeb jobs are always job opportunities, not tenders
          };

          await storage.createJob(job);
          newJobsCount++;
          console.log(`Created new job: ${rwJob.id} - ${rwJob.fields.title} (${rwJob.fields.date.created})`);
        }
        
        console.log(`Fetched ${data.data.length} jobs from ReliefWeb for ${country} - ${newJobsCount} new, ${skippedJobsCount} existing`);
      }
    } catch (error) {
      console.error("Error fetching ReliefWeb jobs:", error);
    }
  }

  async fetchUNTalentJobs(): Promise<void> {
    try {
      console.log("Fetching jobs from UN Talent...");
      
      // East African country location slugs for UN Talent API
      const locationMap: { [key: string]: string } = {
        "Kenya": "kenya",
        "Somalia": "somalia",
        "Ethiopia": "ethiopia",
        "Uganda": "uganda",
        "Tanzania": "tanzania"
      };

      let totalNewJobs = 0;
      let totalSkippedJobs = 0;

      for (const [countryName, locationSlug] of Object.entries(locationMap)) {
        try {
          // Build URL with location filter - fetch multiple pages for comprehensive coverage
          const url = `${UNTALENT_API_URL}?locationSlugs=${locationSlug}`;
          console.log(`Fetching ${countryName} jobs from UN Talent...`);

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'JobConnect-EastAfrica/1.0'
            }
          });

          if (!response.ok) {
            console.error(`UN Talent API error for ${countryName}: ${response.status} ${response.statusText}`);
            continue;
          }

          const data: UNTalentResponse = await response.json();
          
          if (!data.data || data.data.length === 0) {
            console.log(`No jobs found for ${countryName} from UN Talent`);
            continue;
          }

          console.log(`UN Talent returned ${data.data.length} jobs for ${countryName}`);

          let newJobsCount = 0;
          let skippedJobsCount = 0;

          for (const unJob of data.data) {
            // Create unique external ID
            const externalId = `untalent-${unJob.slug}`;
            const existingJob = await storage.getJobByExternalId(externalId);
            
            if (existingJob) {
              skippedJobsCount++;
              console.log(`Skipping existing job: ${unJob.slug} - ${unJob.title}`);
              continue;
            }

            // Extract location - use provided location or fall back to country name
            let location = unJob.location || countryName;
            
            // Clean up location if it includes country name twice
            if (location.toLowerCase().includes(countryName.toLowerCase())) {
              location = location;
            } else {
              location = `${location}, ${countryName}`;
            }

            // Create description from shortDescription or description field
            const rawDescription = unJob.description || unJob.shortDescription || "";
            const description = rawDescription
              .replace(/<[^>]*>/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 800) || "No description available";

            // Map job level to experience
            const experienceMapping: { [key: string]: string } = {
              "Entry": "Entry level",
              "Mid": "Mid-level / 3-5 years",
              "Senior": "Senior level / 5-10 years", 
              "Leadership": "Leadership / 10+ years",
              "Executive": "Executive level"
            };
            const experience = unJob.jobLevel ? experienceMapping[unJob.jobLevel] || unJob.jobLevel : null;

            // Map area slugs to sector
            const sectorMapping: { [key: string]: string } = {
              "human-resources": "Human Resources",
              "finance": "Finance",
              "logistics": "Logistics",
              "health": "Health",
              "education": "Education",
              "protection": "Protection",
              "wash": "WASH",
              "food-security": "Food Security",
              "it-telecom": "Information Technology"
            };
            
            const sector = unJob.areaSlugs && unJob.areaSlugs.length > 0
              ? sectorMapping[unJob.areaSlugs[0]] || "General"
              : "General";

            // Job URL - construct from slug
            const jobUrl = unJob.url || `https://untalent.org/jobs/${unJob.slug}`;

            const job: InsertJob = {
              title: unJob.title,
              organization: unJob.company || "UN Organization",
              location: location,
              country: countryName,
              description: description,
              url: jobUrl,
              datePosted: new Date(), // UN Talent doesn't provide posted date in API
              deadline: unJob.expiresAt ? new Date(unJob.expiresAt) : null,
              sector: sector,
              source: "untalent",
              externalId: externalId,
              howToApply: `Apply directly through UN Talent: ${jobUrl}`,
              experience: experience,
              qualifications: null,
              responsibilities: null,
              bodyHtml: rawDescription || undefined,
              type: "job"
            };

            await storage.createJob(job);
            newJobsCount++;
            console.log(`Created new job: ${unJob.slug} - ${unJob.title}`);
          }

          totalNewJobs += newJobsCount;
          totalSkippedJobs += skippedJobsCount;
          console.log(`Fetched ${data.data.length} jobs from UN Talent for ${countryName} - ${newJobsCount} new, ${skippedJobsCount} existing`);

        } catch (countryError) {
          console.error(`Error fetching UN Talent jobs for ${countryName}:`, countryError);
          continue;
        }
      }

      console.log(`UN Talent fetch completed - Total: ${totalNewJobs} new jobs, ${totalSkippedJobs} existing`);

    } catch (error) {
      console.error("Error fetching UN Talent jobs:", error);
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
          externalId: externalId,
          type: "job" // UN Jobs are always job opportunities, not tenders
        };

        await storage.createJob(job);
      }
      
      console.log("Finished fetching UN Jobs");
    } catch (error) {
      console.error("Error fetching UN Jobs:", error);
    }
  }

  async fetchUNGMTenders(): Promise<void> {
    try {
      console.log("Fetching tenders from UNGM...");
      
      // East African country codes for UNGM filtering
      const countries = [
        { name: "Kenya", code: "KE" },
        { name: "Somalia", code: "SO" },
        { name: "Ethiopia", code: "ET" },
        { name: "Uganda", code: "UG" },
        { name: "Tanzania", code: "TZ" }
      ];

      let totalNewTenders = 0;
      let totalSkippedTenders = 0;

      for (const country of countries) {
        try {
          // UNGM public notices page with country filter
          const url = `https://www.ungm.org/Public/Notice`;
          console.log(`Fetching tenders for ${country.name} from UNGM...`);

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (!response.ok) {
            console.error(`UNGM error for ${country.name}: ${response.status} ${response.statusText}`);
            continue;
          }

          const html = await response.text();
          
          // Parse tender listings from HTML
          // Look for tender cards/items containing country name
          const tenderPattern = /<div[^>]*class="[^"]*notice[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
          const titlePattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i;
          const datePattern = /(\d{1,2}[-\/]\w{3}[-\/]\d{4}|\d{4}[-\/]\d{2}[-\/]\d{2})/g;
          const orgPattern = /(UNDP|UNICEF|WHO|WFP|FAO|UNHCR|IOM|UNOPS|UNESCO|UNFPA|UN Women|UNEP)/gi;

          // Simple approach: look for links to notice pages
          const noticeLinks = html.match(/\/Public\/Notice\/(\d+)/g) || [];
          const uniqueNoticeIds = [...new Set(noticeLinks.map(link => link.match(/(\d+)$/)?.[1]).filter(Boolean))];

          console.log(`Found ${uniqueNoticeIds.length} potential tenders on UNGM`);

          // For each notice, check if it's relevant to East African countries
          for (const noticeId of uniqueNoticeIds.slice(0, 20)) { // Limit to 20 per run
            try {
              const noticeUrl = `https://www.ungm.org/Public/Notice/${noticeId}`;
              const noticeResponse = await fetch(noticeUrl, {
                headers: {
                  'Accept': 'text/html',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });

              if (!noticeResponse.ok) continue;

              const noticeHtml = await noticeResponse.text();
              
              // Check if notice mentions any East African country
              const countryMentioned = countries.some(c => 
                noticeHtml.toLowerCase().includes(c.name.toLowerCase())
              );

              if (!countryMentioned) continue;

              // Extract tender details
              const titleMatch = noticeHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                                noticeHtml.match(/<title>([^<]+)<\/title>/i);
              const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : `UNGM Tender ${noticeId}`;

              // Extract organization
              const orgMatch = noticeHtml.match(orgPattern);
              const organization = orgMatch ? orgMatch[0] : "United Nations";

              // Extract deadline
              const deadlineMatch = noticeHtml.match(/deadline[:\s]*([^<\n]+)/i) ||
                                   noticeHtml.match(/closing[:\s]*([^<\n]+)/i);
              let deadline: Date | null = null;
              if (deadlineMatch) {
                const dateStr = deadlineMatch[1].match(datePattern);
                if (dateStr) {
                  deadline = new Date(dateStr[0]);
                  if (isNaN(deadline.getTime())) deadline = null;
                }
              }

              // Determine country
              let tenderCountry = "Kenya";
              for (const c of countries) {
                if (noticeHtml.toLowerCase().includes(c.name.toLowerCase())) {
                  tenderCountry = c.name;
                  break;
                }
              }

              // Extract description
              const descMatch = noticeHtml.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
              const description = descMatch 
                ? descMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 800)
                : `UN procurement opportunity for ${tenderCountry}`;

              const externalId = `ungm-${noticeId}`;
              const existingJob = await storage.getJobByExternalId(externalId);
              
              if (existingJob) {
                totalSkippedTenders++;
                continue;
              }

              const tender: InsertJob = {
                title: title.substring(0, 500),
                organization: organization,
                location: tenderCountry,
                country: tenderCountry,
                description: description,
                url: noticeUrl,
                datePosted: new Date(),
                deadline: deadline,
                sector: "Procurement",
                source: "ungm",
                externalId: externalId,
                howToApply: `Submit through UNGM: ${noticeUrl}`,
                experience: null,
                qualifications: null,
                responsibilities: null,
                bodyHtml: undefined,
                type: "tender"
              };

              await storage.createJob(tender);
              totalNewTenders++;
              console.log(`Created new tender: ${noticeId} - ${title.substring(0, 60)}...`);

            } catch (noticeError) {
              console.error(`Error fetching UNGM notice ${noticeId}:`, noticeError);
              continue;
            }
          }

        } catch (countryError) {
          console.error(`Error fetching UNGM tenders for ${country.name}:`, countryError);
          continue;
        }
      }

      console.log(`UNGM fetch completed - Total: ${totalNewTenders} new tenders, ${totalSkippedTenders} existing`);

    } catch (error) {
      console.error("Error fetching UNGM tenders:", error);
    }
  }

  async fetchAllJobs(): Promise<void> {
    if (this.isRunning) {
      console.log("Job fetch already in progress, skipping...");
      return;
    }

    this.isRunning = true;
    console.log("Fetching comprehensive jobs and tenders from all sources...");
    try {
      // Fetch from ReliefWeb (humanitarian jobs)
      await this.fetchReliefWebJobs();
      
      // Fetch from UN Talent (UN organization jobs)
      await this.fetchUNTalentJobs();
      
      // Fetch from UNGM (UN procurement tenders)
      await this.fetchUNGMTenders();
      
      console.log("Job and tender fetch completed successfully");
    } catch (error) {
      console.error("Error in job fetch:", error);
    } finally {
      this.isRunning = false;
    }
  }



  startScheduler(): void {
    // Run twice daily at 8 AM and 1 PM
    cron.schedule("0 8 * * *", () => {
      console.log("Starting morning scheduled job fetch (8 AM)...");
      this.fetchAllJobs();
    });
    
    cron.schedule("0 13 * * *", () => {
      console.log("Starting afternoon scheduled job fetch (1 PM)...");
      this.fetchAllJobs();
    });

    // Also run immediately on startup
    setTimeout(() => {
      this.fetchAllJobs();
    }, 5000); // Wait 5 seconds after startup
  }
}

export const jobFetcher = new JobFetcher();
