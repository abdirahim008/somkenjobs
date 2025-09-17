import { type Job } from "@shared/schema";
import { generateJobSlug } from "@shared/utils";
import { 
  generateHomepageSEOMetadata, 
  generateJobsListingSEOMetadata, 
  generateJobSEOMetadata 
} from "@shared/seoUtils";

// Bot user agents that should receive SSR content
export function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'facebookexternalhit', 'twitterbot', 'rogerbot',
    'linkedinbot', 'embedly', 'quora link preview', 'showyoubot',
    'outbrain', 'pinterest/0.', 'developers.google.com/+/web/snippet',
    'slackbot', 'vkshare', 'w3c_validator', 'redditbot', 'applebot',
    'whatsapp', 'flipboard', 'tumblr', 'bitlybot', 'skypeuripreview',
    'nuzzel', 'discordbot', 'google page speed', 'qwantify',
    'telegrambot', 'lighthouse'
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUserAgent.includes(pattern));
}

// Generate structured data for a job
export function generateJobStructuredData(job: Job): string {
  const cleanDescription = job.description 
    ? job.description.replace(/<[^>]*>/g, '').substring(0, 5000)
    : `Join ${job.organization || 'our humanitarian organization'} in their mission to provide humanitarian aid in ${job.location || 'the field'}, ${job.country || 'East Africa'}. This position offers the opportunity to make a meaningful impact in humanitarian work.`;

  const jobStructuredData = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title.substring(0, 100),
    "description": cleanDescription,
    "datePosted": new Date(job.datePosted).toISOString().split('T')[0],
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.organization || "Humanitarian Organization"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || "Field Location",
        "addressCountry": job.country === "Kenya" ? "KE" : job.country === "Somalia" ? "SO" : job.country
      }
    },
    "url": `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`
  };

  // Add optional fields
  if (job.deadline) {
    const deadlineDate = new Date(job.deadline);
    if (deadlineDate > new Date()) {
      jobStructuredData.validThrough = deadlineDate.toISOString().split('T')[0];
    }
  }

  // Employment type mapping
  const title = job.title.toLowerCase();
  if (title.includes('consultant') || title.includes('contract')) {
    jobStructuredData.employmentType = "CONTRACTOR";
  } else if (title.includes('part-time')) {
    jobStructuredData.employmentType = "PART_TIME";
  } else if (title.includes('intern')) {
    jobStructuredData.employmentType = "INTERN";
  } else {
    jobStructuredData.employmentType = "FULL_TIME";
  }

  if (job.sector) {
    jobStructuredData.industry = job.sector;
    jobStructuredData.occupationalCategory = job.sector;
  }

  return JSON.stringify(jobStructuredData, null, 2);
}

// Generate SSR HTML for homepage
export function generateHomepageHTML(jobStats: { totalJobs: number; organizations: number; newToday: number }, recentJobs: Job[]): string {
  // Generate optimized SEO metadata
  const seoMetadata = generateHomepageSEOMetadata(jobStats);
  
  const jobListings = recentJobs.slice(0, 8).map(job => `
    <div class="job-listing" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
        <a href="/jobs/${generateJobSlug(job.title, job.id)}" style="color: #0077B5; text-decoration: none;">
          ${job.title}
        </a>
      </h3>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
        ${job.organization} • ${job.location}, ${job.country}${job.sector ? ` • ${job.sector}` : ''}
      </p>
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
        ${job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
      </p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoMetadata.title}</title>
  <meta name="description" content="${seoMetadata.description}">
  <meta name="keywords" content="${seoMetadata.keywords}">
  <link rel="canonical" href="https://somkenjobs.com/">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://somkenjobs.com/">
  <meta property="og:title" content="${seoMetadata.title}">
  <meta property="og:description" content="${seoMetadata.description}">
  <meta property="og:site_name" content="Somken Jobs">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SomkenJobs">
  <meta name="twitter:title" content="${seoMetadata.title}">
  <meta name="twitter:description" content="${seoMetadata.description}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Somken Jobs",
    "url": "https://somkenjobs.com/",
    "description": "Leading job board for humanitarian careers across East Africa. Find NGO jobs, UN positions, and development opportunities in Kenya, Somalia, Ethiopia, Uganda, and Tanzania.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://somkenjobs.com/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Somken Jobs",
      "description": "Connecting humanitarian professionals with career opportunities across Kenya, Somalia, Ethiopia, Uganda, and Tanzania"
    },
    "areaServed": [
      {"@type": "Country", "name": "Kenya"},
      {"@type": "Country", "name": "Somalia"},
      {"@type": "Country", "name": "Ethiopia"},
      {"@type": "Country", "name": "Uganda"},
      {"@type": "Country", "name": "Tanzania"}
    ],
    "keywords": ["jobs in Somalia", "jobs in Kenya", "humanitarian jobs", "NGO careers", "UN jobs", "development careers"]
  }
  </script>

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .hero { background: #0077B5; color: white; padding: 40px 20px; text-align: center; }
    .stats { display: flex; justify-content: center; gap: 40px; margin-top: 20px; }
    .stat { text-align: center; }
    .stat-number { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 14px; opacity: 0.9; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <h1>East Africa Jobs - ${jobStats.totalJobs}+ Humanitarian Career Opportunities</h1>
      <p>Find jobs across Kenya, Somalia, Ethiopia, Uganda, and Tanzania with leading NGOs, UN agencies, and humanitarian organizations. Browse ${jobStats.totalJobs} current opportunities updated daily from ReliefWeb.</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-number">${jobStats.totalJobs}</div>
          <div class="stat-label">Active Jobs</div>
        </div>
        <div class="stat">
          <div class="stat-number">${jobStats.organizations}</div>
          <div class="stat-label">Organizations</div>
        </div>
        <div class="stat">
          <div class="stat-number">${jobStats.newToday}</div>
          <div class="stat-label">New Today</div>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <section>
      <h2>Latest Job Opportunities</h2>
      <p>Discover the newest humanitarian and development career opportunities across East Africa. Our platform aggregates positions from top international organizations, NGOs, and UN agencies, providing you with comprehensive access to meaningful career opportunities that make a difference.</p>
      
      ${jobListings}
      
      <p><a href="/jobs" style="color: #0077B5; text-decoration: none; font-weight: 600;">View All Jobs →</a></p>
    </section>

    <section style="margin-top: 40px;">
      <h2>Leading Job Board for Somalia & Kenya</h2>
      <p>Somken Jobs is the premier platform for finding humanitarian and development opportunities in Somalia and Kenya. We aggregate positions from top NGOs, UN agencies, and international organizations, providing comprehensive access to career opportunities across East Africa. Our platform serves as a bridge connecting talented professionals with organizations that are making a meaningful impact in the region.</p>
      
      <h3>Why Choose Somken Jobs?</h3>
      <p>With over ${jobStats.totalJobs} active job listings from ${jobStats.organizations} leading humanitarian organizations, we offer the most comprehensive collection of opportunities in East Africa. Our listings are updated twice daily from trusted sources like ReliefWeb, ensuring you never miss new opportunities in the humanitarian sector. Whether you're seeking positions with UNHCR, WHO, Save the Children, World Food Programme, or other leading international organizations, you'll find them here.</p>

      <h3>Jobs Across East Africa</h3>
      <p>Our platform features opportunities in major cities including Nairobi, Mogadishu, Hargeisa, Kismayo, Mombasa, Kisumu, Eldoret, Addis Ababa, Kampala, and Dar es Salaam. From health and education to protection and emergency response, we cover all major humanitarian sectors. Find positions in Health, Education, Protection, WASH (Water, Sanitation & Hygiene), Food Security, Emergency Response, Logistics, and Coordination roles.</p>

      <h3>For Humanitarian Professionals</h3>
      <p>Whether you're an experienced humanitarian worker looking for your next challenge or a professional seeking to enter the humanitarian sector, Somken Jobs provides the resources you need. Our platform not only lists current opportunities but also provides career guidance and resources to help you succeed in the humanitarian field. Join thousands of professionals who trust Somken Jobs for their career advancement in East Africa's humanitarian sector.</p>
    </section>
  </main>
  
  <script>
    // Redirect to SPA after initial load for interactive features
    setTimeout(() => {
      if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
        window.location.reload();
      }
    }, 100);
  </script>
</body>
</html>`;
}

// Generate SSR HTML for jobs page
export function generateJobsPageHTML(jobs: Job[], totalCount: number, filters: { country?: string; location?: string; sector?: string; organization?: string } = {}): string {
  // Generate optimized SEO metadata for jobs listing
  const seoMetadata = generateJobsListingSEOMetadata(totalCount, filters);
  
  const jobListings = jobs.slice(0, 20).map(job => `
    <div class="job-listing" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
        <a href="/jobs/${generateJobSlug(job.title, job.id)}" style="color: #0077B5; text-decoration: none;">
          ${job.title}
        </a>
      </h3>
      <div style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
        <strong>${job.organization}</strong> • ${job.location}, ${job.country}${job.sector ? ` • ${job.sector}` : ''}
        ${job.deadline ? ` • Deadline: ${new Date(job.deadline).toLocaleDateString()}` : ''}
      </div>
      <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
        ${job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
      </p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoMetadata.title}</title>
  <meta name="description" content="${seoMetadata.description}">
  <meta name="keywords" content="${seoMetadata.keywords}">
  <link rel="canonical" href="https://somkenjobs.com/jobs">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://somkenjobs.com/jobs">
  <meta property="og:title" content="${seoMetadata.title}">
  <meta property="og:description" content="${seoMetadata.description}">
  <meta property="og:site_name" content="Somken Jobs">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SomkenJobs">
  <meta name="twitter:title" content="${seoMetadata.title}">
  <meta name="twitter:description" content="${seoMetadata.description}">

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .hero { background: #0077B5; color: white; padding: 30px 20px; text-align: center; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <h1>Jobs in Somalia & Kenya - Browse All Opportunities</h1>
      <p>Browse ${totalCount} current job opportunities in Somalia, Kenya and across East Africa with leading humanitarian organizations.</p>
    </div>
  </header>

  <main class="container">
    <section>
      <h2>Latest Job Opportunities</h2>
      <p>Discover ${totalCount} current humanitarian and development career opportunities across Somalia, Kenya, and East Africa. Our comprehensive job listings feature positions from leading international organizations, NGOs, and UN agencies. Each listing is carefully curated to ensure you have access to legitimate, high-quality career opportunities in the humanitarian sector.</p>
      
      ${jobListings}
      
      ${totalCount > 20 ? `<p><em>Showing first 20 of ${totalCount} jobs. Visit our full site to see all opportunities and use advanced filters.</em></p>` : ''}
    </section>

    <section style="margin-top: 40px;">
      <h2>Find Your Next Humanitarian Career</h2>
      <p>Whether you're seeking positions in Somalia's vibrant humanitarian landscape or Kenya's thriving development sector, our platform connects you with meaningful career opportunities. From field-based roles in emergency response to coordination positions in major hubs like Nairobi and Mogadishu, we feature the full spectrum of humanitarian careers.</p>

      <h3>Popular Job Categories</h3>
      <p><strong>Health Sector Jobs:</strong> Medical professionals, public health specialists, and healthcare coordinators will find numerous opportunities with organizations like WHO, MSF, and other leading health-focused NGOs operating across the region.</p>
      
      <p><strong>Protection and Human Rights:</strong> Protection officers, child protection specialists, and human rights advocates can discover positions with UNHCR, Save the Children, and other protection-focused organizations working to safeguard vulnerable populations.</p>
      
      <p><strong>Emergency Response and Coordination:</strong> Emergency coordinators, logistics specialists, and rapid response team members will find opportunities with WFP, OCHA, and other agencies at the forefront of humanitarian response efforts.</p>

      <h3>Why Work in East Africa's Humanitarian Sector?</h3>
      <p>East Africa represents one of the world's most dynamic humanitarian landscapes, offering professionals the opportunity to make meaningful impact while advancing their careers. The region's complex humanitarian challenges provide unique learning opportunities, while its cultural diversity and strategic importance make it an ideal location for career development in the international development sector. With over ${totalCount} active positions from ${Math.floor(totalCount / 5)} organizations, the opportunities for growth and impact are substantial.</p>
    </section>
  </main>
  
  <script>
    // Redirect to SPA after initial load for interactive features
    setTimeout(() => {
      if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
        window.location.reload();
      }
    }, 100);
  </script>
</body>
</html>`;
}

// Generate SSR HTML for job details page
export function generateJobDetailsHTML(job: Job): string {
  const cleanDescription = job.description.replace(/<[^>]*>/g, '');
  const structuredData = generateJobStructuredData(job);
  const jobUrl = `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`;
  
  // Generate optimized SEO metadata for the job
  const seoMetadata = generateJobSEOMetadata(job);
  
  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoMetadata.title}</title>
  <meta name="description" content="${seoMetadata.description}">
  <meta name="keywords" content="${seoMetadata.keywords}">
  <link rel="canonical" href="${jobUrl}">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${jobUrl}">
  <meta property="og:title" content="${seoMetadata.title}">
  <meta property="og:description" content="${seoMetadata.description}">
  <meta property="og:site_name" content="Somken Jobs">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SomkenJobs">
  <meta name="twitter:title" content="${seoMetadata.title}">
  <meta name="twitter:description" content="${seoMetadata.description}">

  <!-- Job Structured Data -->
  <script type="application/ld+json">
  ${structuredData}
  </script>

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .job-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
    .job-meta { color: #6b7280; font-size: 14px; margin: 10px 0; }
    .apply-button { background: #0077B5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .section { margin: 30px 0; }
  </style>
</head>
<body>
  <main class="container">
    <div class="job-header">
      <h1>${job.title}</h1>
      <div class="job-meta">
        <strong>${job.organization}</strong> • ${job.location}, ${job.country}
        ${job.sector ? ` • ${job.sector}` : ''}
        ${job.deadline ? ` • Deadline: ${new Date(job.deadline).toLocaleDateString()}` : ''}
      </div>
      ${job.url ? `<a href="${job.url}" target="_blank" class="apply-button">Apply Now</a>` : ''}
    </div>

    <section class="section">
      <h2>Job Description</h2>
      <div style="white-space: pre-line; line-height: 1.7;">
        ${cleanDescription}
      </div>
    </section>

    ${job.qualifications ? `
    <section class="section">
      <h2>Qualifications</h2>
      <div style="white-space: pre-line; line-height: 1.7;">
        ${job.qualifications.replace(/<[^>]*>/g, '')}
      </div>
    </section>
    ` : ''}

    ${job.responsibilities ? `
    <section class="section">
      <h2>Responsibilities</h2>
      <div style="white-space: pre-line; line-height: 1.7;">
        ${job.responsibilities.replace(/<[^>]*>/g, '')}
      </div>
    </section>
    ` : ''}

    ${job.howToApply ? `
    <section class="section">
      <h2>How to Apply</h2>
      <div style="white-space: pre-line; line-height: 1.7;">
        ${job.howToApply.replace(/<[^>]*>/g, '')}
      </div>
    </section>
    ` : ''}

    <section class="section">
      <h2>About This Opportunity</h2>
      <p>This ${job.title} position with ${job.organization} represents an excellent opportunity for humanitarian professionals seeking to make a meaningful impact in ${job.location}, ${job.country}. The role offers the chance to work with one of the leading organizations in the ${job.sector || 'humanitarian'} sector, contributing to important initiatives that benefit local communities and vulnerable populations.</p>
      
      <h3>Working in ${job.country}</h3>
      <p>${job.country} offers unique opportunities for humanitarian professionals to engage with complex challenges while working alongside dedicated local and international teams. The humanitarian landscape in ${job.country} is dynamic and presents professionals with the chance to develop crucial skills in ${job.sector || 'international development'} while making tangible differences in people's lives.</p>
      
      <h3>About ${job.organization}</h3>
      <p>${job.organization} is recognized as a leading organization in the humanitarian and development sector, with a strong presence in East Africa. Their work in ${job.country} focuses on sustainable development, emergency response, and capacity building initiatives that create lasting positive change in communities across the region.</p>
      
      ${job.url ? `
      <h3>Application Process</h3>
      <p>To apply for this ${job.title} position, please visit the official application page where you can submit your application materials directly to ${job.organization}. The organization follows a thorough selection process to ensure the best candidates are identified for this important role.</p>
      <p><a href="${job.url}" target="_blank" style="color: #0077B5;">Apply for this position →</a></p>
      ` : ''}
    </section>
  </main>
  
  <script>
    // Redirect to SPA after initial load for interactive features
    setTimeout(() => {
      if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
        window.location.reload();
      }
    }, 100);
  </script>
</body>
</html>`;
}

// Helper function to extract job ID from slug
export function extractJobIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}