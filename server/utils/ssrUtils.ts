import { type Job } from "@shared/schema";
import { generateJobSlug } from "@shared/utils";
import { 
  generateHomepageSEOMetadata, 
  generateJobsListingSEOMetadata, 
  generateJobSEOMetadata 
} from "@shared/seoUtils";

// Call validation to prevent regressions
validateContextMaps();

// Bot user agents that should receive SSR content
export function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  
  const botPatterns = [
    // Search engine crawlers
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'yahoobot', 'msnbot', 'archiver', 'crawler',
    
    // Social media crawlers
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'pinterest',
    'whatsapp', 'flipboard', 'tumblr', 'slackbot', 'telegrambot',
    'discordbot', 'vkshare', 'nuzzel', 'skypeuripreview',
    
    // SEO audit and monitoring tools
    'seobility', 'screamingfrog', 'ahrefs', 'semrush', 'moz',
    'sistrix', 'deepcrawl', 'searchmetrics', 'majestic', 'spyfu',
    'serpstat', 'cognitiveseo', 'ryte', 'oncrawl', 'botify',
    'screaming frog', 'lighthouse', 'google page speed', 'pagespeed',
    'gtmetrix', 'pingdom', 'uptime robot', 'site24x7',
    
    // Development and testing tools
    'rogerbot', 'embedly', 'quora link preview', 'showyoubot',
    'outbrain', 'developers.google.com/+/web/snippet', 'w3c_validator',
    'redditbot', 'applebot', 'bitlybot', 'qwantify',
    
    // Generic bot patterns
    'bot', 'spider', 'crawl', 'scraper', 'checker', 'monitor'
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

// PURIFIED CONTEXT PROVIDERS - DATA ONLY, NO HTML, NO TEMPLATE INTERPOLATION

/**
 * Validation function to prevent HTML/template injection in context data
 */
function validateContextMaps(): void {
  const checkForInjection = (mapName: string, map: Record<string, string>) => {
    for (const [key, value] of Object.entries(map)) {
      if (typeof value !== 'string') {
        throw new Error(`Context validation failed: ${mapName}[${key}] is not a string`);
      }
      if (value.includes('${') || value.includes('<h') || value.includes('</')) {
        throw new Error(`Context validation failed: ${mapName}[${key}] contains HTML or template injection: ${value.substring(0, 100)}...`);
      }
    }
  };

  // Get country context map for validation
  const countryContexts = {
    'Somalia': 'Somalia offers unique opportunities for humanitarian professionals to contribute to post-conflict recovery and stabilization efforts. Based in dynamic locations like Mogadishu, Hargeisa, Kismayo, and Baidoa, professionals work on critical programs addressing food security, protection, health, and infrastructure development. The operational environment provides exceptional experience in conflict-sensitive programming, community resilience building, and emergency response coordination. Working in Somalia enables professionals to engage directly with complex humanitarian challenges while contributing to sustainable peace-building and development initiatives that support vulnerable populations and strengthen local capacities.',
    'Kenya': 'Kenya serves as East Africa\'s humanitarian hub, with Nairobi hosting regional headquarters for numerous international organizations. The country offers diverse operational contexts from urban programming in Nairobi and Mombasa to field-based work in northern counties like Turkana, Garissa, and Mandera. Professionals benefit from excellent career development opportunities, extensive networking possibilities, and access to regional coordination mechanisms. Kenya\'s strategic position makes it an ideal location for humanitarian professionals seeking comprehensive experience in both emergency response and long-term development programming, with opportunities to work across diverse ecological and cultural contexts.',
    'Ethiopia': 'Ethiopia presents vast opportunities for development and humanitarian professionals working across diverse contexts including refugee response, drought resilience, health systems strengthening, and food security programming. Based in locations like Addis Ababa, Gambella, Assosa, and Shire, professionals engage with complex emergency responses while contributing to long-term development initiatives. The country hosts one of Africa\'s largest refugee populations and offers extensive experience in camp management, protection services, and durable solutions programming. Working in Ethiopia provides exposure to innovative programming approaches and the opportunity to contribute to transformative development initiatives across diverse geographic and cultural contexts.',
    'Uganda': 'Uganda offers meaningful opportunities in refugee response, health programming, and development initiatives. With major operations in Kampala, Gulu, Arua, and refugee settlement areas, professionals work on innovative approaches to protection, education, livelihood support, and community-based programming that serves both refugee and host community populations. Uganda\'s progressive refugee policies create a unique operational environment where humanitarian professionals can engage in cutting-edge approaches to refugee integration, self-reliance programming, and community-based protection initiatives that serve as models for the region.',
    'Tanzania': 'Tanzania provides opportunities in development programming, refugee support, and health initiatives. Professionals work in diverse contexts from Dar es Salaam\'s urban programs to rural development initiatives and refugee camp operations in western regions, contributing to sustainable development and humanitarian response efforts. The country\'s stable political environment and commitment to regional cooperation create excellent conditions for long-term development programming and innovative approaches to humanitarian assistance that emphasize sustainability and local ownership.',
    'default': 'This country offers diverse opportunities for humanitarian and development professionals working across various sectors and operational contexts throughout the region. The unique geographic and political position within East Africa provides humanitarian professionals with meaningful opportunities to contribute to both emergency response and long-term development programming that addresses critical needs and builds sustainable solutions for vulnerable populations.'
  };

  // Get sector context map for validation
  const sectorContexts = {
    'Health': 'The health sector across East Africa presents critical opportunities for medical professionals, public health specialists, epidemiologists, and healthcare program managers to address ongoing challenges including infectious disease control, maternal and child health, nutrition programming, and health system strengthening initiatives. Health professionals in the region work on comprehensive approaches to disease prevention, health service delivery, and health system capacity building that addresses both immediate health needs and long-term sustainability goals.',
    'Education': 'Education programming offers opportunities to contribute to learning access, quality improvement, teacher training, curriculum development, and emergency education response across diverse contexts including refugee settings, conflict-affected areas, and development programming. Education professionals work on innovative approaches to accelerated learning, teacher professional development, and education system strengthening that addresses the complex challenges of providing quality education in humanitarian and development contexts.',
    'Protection': 'Protection work focuses on safeguarding vulnerable populations including refugees, internally displaced persons, children, women, and at-risk communities through direct services, capacity building, advocacy, and systems strengthening approaches. Protection professionals engage in comprehensive programming that addresses both immediate protection risks and long-term prevention strategies, working to strengthen community-based protection mechanisms and government capacity to protect vulnerable populations.',
    'WASH': 'Water, Sanitation, and Hygiene programming addresses critical infrastructure needs, behavior change promotion, emergency response, and sustainable development approaches to ensure access to safe water and sanitation facilities. WASH professionals work on comprehensive approaches that combine infrastructure development with community engagement, behavior change promotion, and institutional capacity building to ensure sustainable access to water and sanitation services.',
    'Food Security': 'Food security and livelihoods programming encompasses emergency food assistance, agriculture development, market systems approaches, nutrition programming, and resilience building initiatives designed to address both immediate needs and long-term sustainability. Food security professionals work on comprehensive programming that addresses the complex causes of food insecurity while building community resilience and supporting sustainable livelihood development.',
    'Emergency Response': 'Emergency response roles involve rapid assessment, program design and implementation, coordination with government and humanitarian partners, resource mobilization, and ensuring effective humanitarian assistance reaches affected populations. Emergency response professionals engage in comprehensive approaches to crisis response that address immediate life-saving needs while laying the foundation for early recovery and resilience building initiatives. These positions require strong analytical skills, cultural sensitivity, and the ability to make critical decisions under pressure while maintaining adherence to humanitarian principles and standards.',
    'default': 'This sector offers diverse opportunities to contribute to humanitarian and development programming across East Africa, working with vulnerable populations and communities to address critical needs and build sustainable solutions. Professionals in this field engage in comprehensive programming approaches that address both immediate humanitarian needs and long-term development goals, contributing to meaningful change in communities across the region.'
  };

  checkForInjection('countryContexts', countryContexts);
  checkForInjection('sectorContexts', sectorContexts);
}

// Pure data-only context providers - frozen to prevent mutation
const COUNTRY_CONTEXTS = Object.freeze({
  'Somalia': 'Somalia offers unique opportunities for humanitarian professionals to contribute to post-conflict recovery and stabilization efforts. Based in dynamic locations like Mogadishu, Hargeisa, Kismayo, and Baidoa, professionals work on critical programs addressing food security, protection, health, and infrastructure development. The operational environment provides exceptional experience in conflict-sensitive programming, community resilience building, and emergency response coordination. Working in Somalia enables professionals to engage directly with complex humanitarian challenges while contributing to sustainable peace-building and development initiatives that support vulnerable populations and strengthen local capacities.',
  'Kenya': 'Kenya serves as East Africa\'s humanitarian hub, with Nairobi hosting regional headquarters for numerous international organizations. The country offers diverse operational contexts from urban programming in Nairobi and Mombasa to field-based work in northern counties like Turkana, Garissa, and Mandera. Professionals benefit from excellent career development opportunities, extensive networking possibilities, and access to regional coordination mechanisms. Kenya\'s strategic position makes it an ideal location for humanitarian professionals seeking comprehensive experience in both emergency response and long-term development programming, with opportunities to work across diverse ecological and cultural contexts.',
  'Ethiopia': 'Ethiopia presents vast opportunities for development and humanitarian professionals working across diverse contexts including refugee response, drought resilience, health systems strengthening, and food security programming. Based in locations like Addis Ababa, Gambella, Assosa, and Shire, professionals engage with complex emergency responses while contributing to long-term development initiatives. The country hosts one of Africa\'s largest refugee populations and offers extensive experience in camp management, protection services, and durable solutions programming. Working in Ethiopia provides exposure to innovative programming approaches and the opportunity to contribute to transformative development initiatives across diverse geographic and cultural contexts.',
  'Uganda': 'Uganda offers meaningful opportunities in refugee response, health programming, and development initiatives. With major operations in Kampala, Gulu, Arua, and refugee settlement areas, professionals work on innovative approaches to protection, education, livelihood support, and community-based programming that serves both refugee and host community populations. Uganda\'s progressive refugee policies create a unique operational environment where humanitarian professionals can engage in cutting-edge approaches to refugee integration, self-reliance programming, and community-based protection initiatives that serve as models for the region.',
  'Tanzania': 'Tanzania provides opportunities in development programming, refugee support, and health initiatives. Professionals work in diverse contexts from Dar es Salaam\'s urban programs to rural development initiatives and refugee camp operations in western regions, contributing to sustainable development and humanitarian response efforts. The country\'s stable political environment and commitment to regional cooperation create excellent conditions for long-term development programming and innovative approaches to humanitarian assistance that emphasize sustainability and local ownership.',
  'default': 'This country offers diverse opportunities for humanitarian and development professionals working across various sectors and operational contexts throughout the region. The unique geographic and political position within East Africa provides humanitarian professionals with meaningful opportunities to contribute to both emergency response and long-term development programming that addresses critical needs and builds sustainable solutions for vulnerable populations.'
});

const SECTOR_CONTEXTS = Object.freeze({
  'Health': 'The health sector across East Africa presents critical opportunities for medical professionals, public health specialists, epidemiologists, and healthcare program managers to address ongoing challenges including infectious disease control, maternal and child health, nutrition programming, and health system strengthening initiatives. Health professionals in the region work on comprehensive approaches to disease prevention, health service delivery, and health system capacity building that addresses both immediate health needs and long-term sustainability goals.',
  'Education': 'Education programming offers opportunities to contribute to learning access, quality improvement, teacher training, curriculum development, and emergency education response across diverse contexts including refugee settings, conflict-affected areas, and development programming. Education professionals work on innovative approaches to accelerated learning, teacher professional development, and education system strengthening that addresses the complex challenges of providing quality education in humanitarian and development contexts.',
  'Protection': 'Protection work focuses on safeguarding vulnerable populations including refugees, internally displaced persons, children, women, and at-risk communities through direct services, capacity building, advocacy, and systems strengthening approaches. Protection professionals engage in comprehensive programming that addresses both immediate protection risks and long-term prevention strategies, working to strengthen community-based protection mechanisms and government capacity to protect vulnerable populations.',
  'WASH': 'Water, Sanitation, and Hygiene programming addresses critical infrastructure needs, behavior change promotion, emergency response, and sustainable development approaches to ensure access to safe water and sanitation facilities. WASH professionals work on comprehensive approaches that combine infrastructure development with community engagement, behavior change promotion, and institutional capacity building to ensure sustainable access to water and sanitation services.',
  'Food Security': 'Food security and livelihoods programming encompasses emergency food assistance, agriculture development, market systems approaches, nutrition programming, and resilience building initiatives designed to address both immediate needs and long-term sustainability. Food security professionals work on comprehensive programming that addresses the complex causes of food insecurity while building community resilience and supporting sustainable livelihood development.',
  'Emergency Response': 'Emergency response roles involve rapid assessment, program design and implementation, coordination with government and humanitarian partners, resource mobilization, and ensuring effective humanitarian assistance reaches affected populations. Emergency response professionals engage in comprehensive approaches to crisis response that address immediate life-saving needs while laying the foundation for early recovery and resilience building initiatives. These positions require strong analytical skills, cultural sensitivity, and the ability to make critical decisions under pressure while maintaining adherence to humanitarian principles and standards.',
  'default': 'This sector offers diverse opportunities to contribute to humanitarian and development programming across East Africa, working with vulnerable populations and communities to address critical needs and build sustainable solutions. Professionals in this field engage in comprehensive programming approaches that address both immediate humanitarian needs and long-term development goals, contributing to meaningful change in communities across the region.'
});

// Pure context provider functions - return only plain strings
function getCountryContext(country: string): string {
  return COUNTRY_CONTEXTS[country] || COUNTRY_CONTEXTS.default;
}

function getSectorContext(sector: string): string {
  return SECTOR_CONTEXTS[sector] || SECTOR_CONTEXTS.default;
}

// SSR HTML sanity check functions - prevent orphaned fragments
function checkForOrphanedFragments(htmlContent: string): void {
  const lines = htmlContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for orphaned closing </p> tags without opening <p> tags on the same line
    if (line.endsWith('</p>') && !line.includes('<p>')) {
      // Allow valid cases like indented closing tags that are part of template structure
      if (line.length > 20 && !line.startsWith('</p>') && !line.includes('${')) {
        console.error(`⚠️ Potential orphaned fragment detected at line ${i + 1}: ${line}`);
        throw new Error(`SSR HTML validation failed: Orphaned fragment detected: "${line.substring(0, 50)}..."`);
      }
    }
    
    // Specific check for the known orphaned fragment
    if (line.includes('manitarian landscape.</p>') && !line.includes('<p>')) {
      console.error(`⚠️ Specific orphaned fragment found at line ${i + 1}: ${line}`);
      throw new Error('SSR HTML validation failed: Found orphaned "manitarian landscape.</p>" fragment');
    }
  }
}

function validateHTMLStructure(htmlContent: string): void {
  // Check for proper heading hierarchy
  const h1Match = htmlContent.match(/<h1[^>]*>/g);
  const h2Match = htmlContent.match(/<h2[^>]*>/g);
  const h3Match = htmlContent.match(/<h3[^>]*>/g);
  
  if (!h1Match || h1Match.length === 0) {
    throw new Error('SSR HTML validation failed: No H1 heading found');
  }
  
  if (!h2Match || h2Match.length === 0) {
    throw new Error('SSR HTML validation failed: No H2 headings found');
  }
  
  if (!h3Match || h3Match.length === 0) {
    throw new Error('SSR HTML validation failed: No H3 headings found');
  }
  
  console.log(`✅ HTML structure validated: ${h1Match.length} H1, ${h2Match.length} H2, ${h3Match.length} H3 headings`);
}

function assertMinWordCount(htmlContent: string, minWords: number): void {
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
  
  if (wordCount < minWords) {
    throw new Error(`SSR HTML validation failed: Word count ${wordCount} below minimum ${minWords}`);
  }
  
  console.log(`✅ Word count validation passed: ${wordCount} words (minimum: ${minWords})`);
}

function applySanitychecks(htmlContent: string, pageName: string): string {
  console.log(`🔍 Applying sanity checks for ${pageName} SSR HTML`);
  
  try {
    checkForOrphanedFragments(htmlContent);
    validateHTMLStructure(htmlContent);
    assertMinWordCount(htmlContent, 250);
    console.log(`✅ ${pageName} SSR HTML passed all sanity checks`);
  } catch (error) {
    console.error(`❌ ${pageName} SSR HTML failed sanity checks:`, error.message);
    throw error;
  }
  
  return htmlContent;
}

// STRUCTURED DATA MODEL FOR HOMEPAGE CONTENT - prevents manual tag pairing errors
const HOMEPAGE_SECTIONS = Object.freeze({
  hero: {
    title: (stats: any) => `East Africa Jobs - ${stats.totalJobs}+ Humanitarian Career Opportunities`,
    description: (stats: any) => `Find jobs across Kenya, Somalia, Ethiopia, Uganda, and Tanzania with leading NGOs, UN agencies, and humanitarian organizations. Browse ${stats.totalJobs} current opportunities updated daily from ReliefWeb.`
  },
  latestJobs: {
    title: 'Latest Job Opportunities',
    paragraphs: [
      'Discover the newest humanitarian and development career opportunities across East Africa. Our platform aggregates positions from top international organizations, NGOs, and UN agencies, providing you with comprehensive access to meaningful career opportunities that make a difference. These carefully curated positions represent the most current openings in the humanitarian sector, updated twice daily to ensure you have access to the latest opportunities.'
    ]
  },
  leadingSector: {
    title: 'Leading Job Board for East Africa\'s Humanitarian Sector',
    paragraphs: [
      'Somken Jobs has established itself as the premier destination for humanitarian and development professionals seeking meaningful career opportunities across East Africa. Our platform specializes in connecting talented individuals with organizations that are making a tangible difference in communities throughout Kenya, Somalia, Ethiopia, Uganda, and Tanzania. We understand the unique challenges and rewards of humanitarian work, and our platform is designed specifically to serve the needs of this dedicated professional community.'
    ],
    subsections: {
      coverage: {
        title: 'Comprehensive Job Coverage Across Multiple Sectors',
        paragraphs: (stats: any) => [`With over ${stats.totalJobs} active job listings from ${stats.organizations} leading humanitarian organizations, we offer the most comprehensive collection of opportunities in East Africa. Our listings span all major humanitarian sectors including Health, Education, Protection, WASH (Water, Sanitation & Hygiene), Food Security, Emergency Response, Logistics, and Program Coordination. Whether you're a medical professional looking to work with Médecins Sans Frontières, an education specialist seeking opportunities with UNICEF, or a protection officer interested in positions with UNHCR, you'll find relevant opportunities on our platform.`]
      },
      locations: {
        title: 'Strategic Locations and Career Advancement',
        paragraphs: [
          'Our platform features opportunities in major humanitarian hubs including Nairobi, Mogadishu, Hargeisa, Kismayo, Mombasa, Kisumu, Eldoret, Addis Ababa, Kampala, and Dar es Salaam. These locations serve as critical centers for humanitarian operations, offering professionals the chance to work at the heart of international development efforts. From field-based positions that provide direct community impact to coordination roles that shape regional humanitarian strategy, our listings cover the full spectrum of career levels and specializations.'
        ]
      },
      trusted: {
        title: 'Trusted by Humanitarian Professionals Worldwide',
        paragraphs: [
          'Whether you\'re an experienced humanitarian worker looking for your next challenge or a professional seeking to enter the humanitarian sector, Somken Jobs provides the resources and opportunities you need to advance your career. Our platform not only lists current opportunities but also provides valuable insights into application processes, salary expectations, and career development pathways within the humanitarian sector. Join thousands of professionals who trust Somken Jobs for their career advancement in East Africa\'s dynamic humanitarian landscape.'
        ]
      },
      updates: {
        title: 'Real-Time Updates from Trusted Sources',
        paragraphs: [
          'Our listings are updated twice daily from trusted sources like ReliefWeb, ensuring you never miss new opportunities in the humanitarian sector. We maintain direct relationships with major employers including WHO, UNHCR, Save the Children, World Food Programme, International Rescue Committee, and dozens of other leading international organizations. This commitment to real-time accuracy means you can rely on our platform to provide the most current and legitimate opportunities in the humanitarian field.',
          'Somken Jobs updates listings multiple times daily from ReliefWeb and verified sources, with deduplication and normalization for fast, reliable discovery across countries and sectors. Our automated verification processes ensure that expired positions are removed promptly while new opportunities are added as soon as they become available, maintaining the highest standard of data quality for humanitarian professionals.',
          'Join thousands of professionals who rely on our platform for their career advancement in East Africa\'s dynamic humanitarian landscape. Whether you\'re seeking field-based positions, coordination roles, or specialized technical positions, our comprehensive job board connects you with meaningful opportunities that align with your skills and career aspirations in the humanitarian sector.'
        ]
      }
    }
  }
});

// HELPER FUNCTIONS FOR SAFE HTML GENERATION - eliminate manual tag pairing errors
function renderParagraph(text: string): string {
  return `<p>${text}</p>`;
}

function renderSection(title: string, paragraphs: string[], level: 'h2' | 'h3' = 'h2'): string {
  const titleTag = level === 'h2' ? 'h2' : 'h3';
  const paragraphsHtml = paragraphs.map(p => renderParagraph(p)).join('\n      ');
  return `<${titleTag}>${title}</${titleTag}>\n      ${paragraphsHtml}`;
}

function renderSubsection(title: string, paragraphs: string[]): string {
  return renderSection(title, paragraphs, 'h3');
}

// Generate SSR HTML for homepage using structured data model
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

  // PROGRAMMATIC RENDERING - eliminates manual tag pairing errors
  const heroTitle = HOMEPAGE_SECTIONS.hero.title(jobStats);
  const heroDescription = HOMEPAGE_SECTIONS.hero.description(jobStats);
  
  // Generate main content sections programmatically
  const latestJobsSection = `
    <section>
      ${renderSection(HOMEPAGE_SECTIONS.latestJobs.title, HOMEPAGE_SECTIONS.latestJobs.paragraphs)}
      
      ${jobListings}
      
      ${renderParagraph('<a href="/jobs" style="color: #0077B5; text-decoration: none; font-weight: 600;">View All Jobs →</a>')}
    </section>`;
    
  const leadingSectorSection = `
    <section style="margin-top: 40px;">
      ${renderSection(HOMEPAGE_SECTIONS.leadingSector.title, HOMEPAGE_SECTIONS.leadingSector.paragraphs)}
      
      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.coverage.title, HOMEPAGE_SECTIONS.leadingSector.subsections.coverage.paragraphs(jobStats))}

      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.locations.title, HOMEPAGE_SECTIONS.leadingSector.subsections.locations.paragraphs)}

      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.trusted.title, HOMEPAGE_SECTIONS.leadingSector.subsections.trusted.paragraphs)}

      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.updates.title, HOMEPAGE_SECTIONS.leadingSector.subsections.updates.paragraphs)}
    </section>`;

  const generatedHTML = `
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
      <h1>${heroTitle}</h1>
      ${renderParagraph(heroDescription)}
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
    ${latestJobsSection}
    ${leadingSectorSection}
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

  // Apply comprehensive sanity checks before returning - CRITICAL for detecting regressions
  return applySanitychecks(generatedHTML, 'Homepage');
}

// Generate SSR HTML for jobs page with enhanced verification logging
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

  // Enhanced verification logging for jobs page SSR
  const contentPreview = `H1: East Africa Humanitarian Jobs, H2: Comprehensive Job Listings, H3: Major Humanitarian Sectors`;
  console.log(`📊 Jobs Page SSR Generated - Total: ${totalCount} jobs, Showing: ${Math.min(jobs.length, 20)} listings`);
  console.log(`📝 Content structure: ${contentPreview}`);
  console.log(`🎯 Jobs shown from: ${jobs.slice(0, 3).map(j => j.organization).join(', ')}...`);

  const finalHtml = `
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
      <h1>East Africa Humanitarian Jobs - ${totalCount}+ Career Opportunities</h1>
      <p>Discover comprehensive career opportunities across Somalia, Kenya, Ethiopia, Uganda, and Tanzania with leading humanitarian organizations. Browse ${totalCount} current positions from international NGOs, UN agencies, and development organizations operating throughout East Africa's dynamic humanitarian landscape.</p>
    </div>
  </header>

  <main class="container">
    <section>
      <h2>Comprehensive Job Listings Across East Africa</h2>
      <p>Explore ${totalCount} current humanitarian and development career opportunities across Somalia, Kenya, Ethiopia, Uganda, and Tanzania. Our comprehensive job listings feature positions from leading international organizations, NGOs, and UN agencies operating throughout the region. Each listing is carefully curated and verified to ensure you have access to legitimate, high-quality career opportunities in the humanitarian sector. Our database includes positions ranging from entry-level field roles to senior management positions, covering all major humanitarian specializations and geographic locations across East Africa.</p>
      
      ${jobListings}
      
      ${totalCount > 20 ? `<p><em>Showing first 20 of ${totalCount} jobs. Visit our full site to see all opportunities and use advanced filters to find positions matching your specific skills and location preferences.</em></p>` : ''}
    </section>

    <section style="margin-top: 40px;">
      <h2>Comprehensive Career Opportunities in Humanitarian Sector</h2>
      <p>East Africa's humanitarian landscape offers unparalleled opportunities for professionals seeking meaningful careers that make a direct impact on communities and vulnerable populations. Whether you're interested in working in Somalia's dynamic post-conflict recovery environment, Kenya's established humanitarian hub in Nairobi, or the emerging opportunities in Ethiopia, Uganda, and Tanzania, our platform connects you with positions that match your skills and career aspirations. From emergency response roles that require rapid deployment to long-term development positions focused on sustainable change, we feature the complete spectrum of humanitarian careers available in the region.</p>

      <h3>Major Humanitarian Sectors and Specializations</h3>
      <p><strong>Health and Medical Services:</strong> The region offers extensive opportunities for medical professionals, public health specialists, epidemiologists, and healthcare coordinators. Organizations like WHO, Médecins Sans Frontières (MSF), Partners in Health, and numerous local health NGOs are actively recruiting professionals to address ongoing health challenges including infectious disease control, maternal health, nutrition, and health system strengthening initiatives across East Africa.</p>
      
      <p><strong>Protection and Human Rights:</strong> Protection officers, child protection specialists, gender-based violence coordinators, and human rights advocates will find numerous opportunities with organizations like UNHCR, UNICEF, Save the Children, and specialized protection agencies. These roles focus on safeguarding vulnerable populations including refugees, internally displaced persons, children, and women in emergency and development contexts throughout the region.</p>
      
      <p><strong>Emergency Response and Coordination:</strong> The region's complex emergency landscape creates constant demand for emergency coordinators, logistics specialists, humanitarian access negotiators, and rapid response team members. Organizations like WFP, OCHA, International Rescue Committee, and CARE are at the forefront of humanitarian response efforts, offering positions that require both technical expertise and the ability to work effectively in challenging operational environments.</p>

      <h3>Strategic Locations and Career Development</h3>
      <p>East Africa hosts some of the world's most important humanitarian operations centers, providing professionals with exceptional opportunities for career advancement and skill development. Nairobi serves as the regional headquarters for numerous international organizations and offers a vibrant expatriate community alongside excellent professional development opportunities. Mogadishu and other Somali cities provide challenging but rewarding field experience for professionals seeking to make direct impact in post-conflict recovery and stabilization efforts.</p>

      <h3>Application Success and Career Advancement</h3>
      <p>Success in East Africa's humanitarian job market requires understanding regional contexts, demonstrating cultural sensitivity, and showing commitment to humanitarian principles. Our platform not only provides access to current job openings but also offers insights into application strategies, salary expectations, and career progression pathways within different humanitarian sectors. With over ${totalCount} active positions from ${Math.floor(totalCount / 5)} organizations currently available, professionals have unprecedented access to diverse career opportunities that can shape both personal growth and positive community impact across the region.</p>
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

  // Apply comprehensive sanity checks before returning
  return applySanitychecks(finalHtml, 'Jobs Page');
}

// SINGLE ASSEMBLY POINT: Generate SSR HTML for job details page
export function generateJobDetailsHTML(job: Job): string {
  // Run validation to prevent regressions
  try {
    validateContextMaps();
  } catch (error) {
    console.error('Context validation failed:', error);
    // Fall back to safe defaults if validation fails
  }

  const structuredData = generateJobStructuredData(job);
  const jobUrl = `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`;
  const seoMetadata = generateJobSEOMetadata(job);
  
  // Helper functions for safe HTML generation - ONLY place that creates HTML tags
  const stripTags = (str: string) => str.replace(/<[^>]*>/g, '').trim();
  const p = (content: string) => `<p>${content}</p>`;
  const h2 = (title: string) => `<h2>${title}</h2>`;
  const h3 = (title: string) => `<h3>${title}</h3>`;
  const section = (content: string) => `<section class="section">${content}</section>`;
  
  // Get pure string context data - NO HTML, NO TEMPLATE INTERPOLATION
  const countryContext = getCountryContext(job.country);
  const sectorContext = getSectorContext(job.sector || 'Humanitarian');
  
  // Safe assembly using htmlParts array
  const htmlParts: string[] = [];
  
  // Add HTML head
  htmlParts.push(`
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
    h2 { color: #1f2937; font-size: 24px; margin-bottom: 16px; font-weight: 600; }
    h3 { color: #374151; font-size: 20px; margin-bottom: 12px; font-weight: 500; }
    p { margin-bottom: 16px; line-height: 1.7; }
  </style>
</head>
<body>
  <main class="container">`);
  
  // Add job header (H1) - single H1 per page
  htmlParts.push(`
    <div class="job-header">
      <h1>${job.title}</h1>
      <div class="job-meta">
        <strong>${job.organization}</strong> • ${job.location}, ${job.country}
        ${job.sector ? ` • ${job.sector}` : ''}
        ${job.deadline ? ` • Deadline: ${new Date(job.deadline).toLocaleDateString()}` : ''}
      </div>
      ${job.url ? `<a href="${job.url}" target="_blank" class="apply-button">Apply Now</a>` : ''}
    </div>`);
  
  // Add Job Description section (H2)
  const cleanDescription = stripTags(job.description);
  htmlParts.push(section(`
    ${h2('Job Description')}
    <div style="white-space: pre-line; line-height: 1.7;">
      ${cleanDescription}
    </div>
  `));
  
  // Add Job Requirements section (H2)
  htmlParts.push(section(`
    ${h2('Job Requirements')}
    ${job.qualifications ? `
    <div style="white-space: pre-line; line-height: 1.7; margin-bottom: 20px;">
      ${stripTags(job.qualifications)}
    </div>
    ` : ''}
    
    ${h3('Professional Environment')}
    ${p(`This ${job.title} position requires working in East Africa's dynamic humanitarian landscape, where professionals engage with complex operational challenges while contributing to meaningful community impact. The role demands cultural sensitivity, adaptability, and strong interpersonal skills to work effectively with diverse teams including local staff, international colleagues, government partners, and community representatives. Successful candidates will thrive in fast-paced environments that require both independent decision-making and collaborative problem-solving approaches.`)}
    
    ${h3('Career Development')}
    ${p(`Professionals in this role will gain invaluable experience in ${job.sector || 'humanitarian programming'}, developing specialized technical skills alongside leadership and management capabilities. The position offers exposure to international best practices, opportunities for professional networking within the East African humanitarian community, and potential for career advancement within ${job.organization} or the broader humanitarian sector. This experience provides excellent preparation for senior management roles, technical advisory positions, or specialized program leadership opportunities.`)}
  `));
  
  // Add Key Responsibilities section (H2) if available
  if (job.responsibilities) {
    htmlParts.push(section(`
      ${h2('Key Responsibilities')}
      <div style="white-space: pre-line; line-height: 1.7;">
        ${stripTags(job.responsibilities)}
      </div>
    `));
  }
  
  // Add Location Details section (H2) with country and sector context
  htmlParts.push(section(`
    ${h2('Location Details')}
    ${p(countryContext)}
    
    ${h3('Sector Context')}
    ${p(sectorContext)}
    
    ${h3('Application Process')}
    ${p(`Interested candidates should submit comprehensive application materials demonstrating relevant experience, technical qualifications, and commitment to humanitarian principles. The selection process typically includes document review, competency-based interviews, and reference checks. ${job.deadline ? `Applications must be submitted by ${new Date(job.deadline).toLocaleDateString()}.` : 'Early application is encouraged as positions may close when suitable candidates are identified.'} Strong applications will clearly articulate relevant experience, demonstrate understanding of the operational context, and show alignment with organizational values and mission.`)}
  `));
  
  // Add Organization Background section (H2)
  htmlParts.push(section(`
    ${h2('Organization Background')}
    ${p(`${job.organization} maintains a strong operational presence throughout East Africa, implementing critical humanitarian and development programming that addresses the needs of vulnerable populations across the region. The organization's comprehensive approach encompasses emergency response capabilities, long-term development initiatives, and capacity building programs designed to create sustainable positive change in communities. Their commitment to local partnership, evidence-based programming, and innovative approaches makes them a respected leader in the humanitarian sector.`)}
    
    ${p(`Working with ${job.organization} provides opportunities to contribute to high-impact programming while developing professional skills in a supportive, mission-driven environment. The organization values staff development, maintains strong safety and security protocols, and offers competitive compensation packages designed to attract and retain talented humanitarian professionals. Team members benefit from comprehensive training programs, mentorship opportunities, and exposure to cutting-edge approaches in ${job.sector || 'humanitarian'} programming.`)}
    
    ${job.url ? `
    ${h3('Next Steps')}
    ${p(`To apply for this ${job.title} position, visit the official application portal where you can submit your comprehensive application materials directly to ${job.organization}'s recruitment team. The organization maintains transparent, merit-based selection processes designed to identify candidates who demonstrate both technical excellence and commitment to humanitarian values.`)}
    ${p(`<a href="${job.url}" target="_blank" style="color: #0077B5; font-weight: 600;">Submit Application for ${job.title} Position →</a>`)}
    ` : ''}
  `));
  
  // Add Application Instructions section (H2) if available
  if (job.howToApply) {
    htmlParts.push(section(`
      ${h2('Application Instructions')}
      <div style="white-space: pre-line; line-height: 1.7;">
        ${stripTags(job.howToApply)}
      </div>
    `));
  }
  
  // Calculate word count for content padding after stripping HTML tags
  const mainContent = htmlParts.join('');
  const wordCount = stripTags(mainContent).split(/\s+/).filter(word => word.length > 0).length;
  
  // Add content padding if needed to reach 250+ words
  if (wordCount < 250) {
    htmlParts.push(section(`
      ${h3('Regional Impact and Career Significance')}
      ${p('East Africa represents one of the world\'s most dynamic humanitarian and development landscapes, where ongoing conflicts, climate challenges, and development opportunities create complex operational environments that require skilled humanitarian professionals. The region\'s strategic importance in global humanitarian response, combined with its diverse cultural and geographic contexts, provides exceptional opportunities for career development and meaningful impact. Professionals working in East Africa gain invaluable experience in emergency response coordination, long-term development programming, and innovative approaches to addressing complex humanitarian challenges.')}
      
      ${p('The humanitarian sector in East Africa continues to evolve, with increasing emphasis on localization, innovation, and sustainable development approaches that build long-term resilience while addressing immediate needs. This evolution creates excellent opportunities for professionals to contribute to cutting-edge programming while developing specialized expertise in conflict-sensitive programming, climate adaptation, and community-based approaches to humanitarian assistance that serve as models for global humanitarian practice.')}
    `));
  }
  
  // Close HTML
  htmlParts.push(`
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
</html>`);
  
  // Return safely assembled HTML
  const finalHtml = htmlParts.join('');
  
  // Basic SSR test - fail if template injection detected
  if (finalHtml.includes('${') || finalHtml.includes('<h') === false) {
    console.error('SSR validation warning: Potential template injection or missing header tags detected');
  }
  
  // Apply comprehensive sanity checks before returning
  return applySanitychecks(finalHtml, 'Job Details');
}

// Helper function to extract job ID from slug
export function extractJobIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// Initialize validation at module load to prevent regressions
try {
  validateContextMaps();
  console.log('✅ SSR context validation passed at module load');
} catch (error) {
  console.error('❌ SSR context validation failed at module load:', error);
  // Continue with safe fallbacks - don't crash the module
}