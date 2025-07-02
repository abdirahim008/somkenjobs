# Zyte Job Extraction API Integration Analysis

## Overview

Zyte (formerly Scrapinghub) is a web scraping platform that offers automated data extraction services through their APIs. Their job posting extraction service can help us gather high-quality job listings from major job boards and company websites in Kenya and Somalia.

## Zyte's Job Extraction Capabilities

### What Zyte Offers:
1. **Automated Job Scraping**: Extract job postings from major job boards
2. **Structured Data**: Clean, normalized job data with consistent fields
3. **Real-time Updates**: Fresh job listings as they are posted
4. **Geographic Targeting**: Filter jobs by country/region (Kenya, Somalia)
5. **Anti-bot Detection**: Handles CAPTCHAs and rate limiting automatically

### Key Features:
- **Job Title & Description**: Full job details with clean formatting
- **Company Information**: Organization name, size, industry
- **Location Data**: City, country, remote options
- **Salary Information**: When available from source sites
- **Application Details**: How to apply, deadlines, requirements
- **Job Categories**: Industry sectors and job types

## Potential Data Sources for Kenya & Somalia

### Major Job Boards Zyte Can Scrape:
1. **BrighterMonday** (Kenya's largest job board)
2. **Jobs.co.ke** (Popular Kenyan platform)
3. **MyJobMag** (East Africa focused)
4. **UN Careers** (International opportunities)
5. **NGO Job Board** (Humanitarian sector)
6. **Company Career Pages** (Direct from employers)

### Regional Focus:
- **Kenya**: Nairobi, Mombasa, Kisumu, Nakuru
- **Somalia**: Mogadishu, Hargeisa, Bosaso (limited but growing)

## Integration Architecture

### 1. Zyte API Service Layer
```typescript
// server/services/zyteJobFetcher.ts
class ZyteJobFetcher {
  async fetchJobsForCountry(country: 'kenya' | 'somalia'): Promise<Job[]>
  async extractJobFromUrl(jobUrl: string): Promise<Job>
  async searchJobs(query: string, location: string): Promise<Job[]>
}
```

### 2. Data Processing Pipeline
1. **Fetch**: Get job data from Zyte API
2. **Normalize**: Convert to our job schema format
3. **Deduplicate**: Remove duplicates across sources
4. **Enhance**: Add location intelligence (city detection)
5. **Store**: Save to PostgreSQL database

### 3. Scheduler Integration
- Extend existing cron job system
- Fetch from both ReliefWeb API and Zyte API
- Prioritize Zyte data for local job boards
- Keep ReliefWeb for humanitarian sector

## Cost Considerations

### Zyte Pricing Structure:
- **Pay-per-request** model
- **Volume discounts** for high usage
- **Free trial** available for testing
- **Enterprise plans** for large-scale operations

### Estimated Costs (Approximate):
- **Starter**: $29/month for 10K requests
- **Professional**: $99/month for 50K requests
- **Enterprise**: Custom pricing for 100K+ requests

## Technical Requirements

### Environment Variables Needed:
```bash
ZYTE_API_KEY=your_zyte_api_key
ZYTE_PROJECT_ID=your_project_id
ZYTE_SPIDER_NAME=job_extraction_spider
```

### Dependencies to Add:
```json
{
  "scrapinghub": "^2.1.0",
  "zyte-api": "^1.0.0"
}
```

## Recommendation

**Proceed with Zyte Integration** for the following reasons:

1. **Market Gap**: Limited high-quality job aggregation for Kenya/Somalia
2. **User Value**: Significantly more job opportunities for users
3. **Competitive Edge**: First comprehensive humanitarian + local job platform
4. **Scalability**: Professional infrastructure for growth

### Next Steps:
1. **Trial Account**: Set up Zyte free trial
2. **Proof of Concept**: Test with 2-3 major Kenyan job boards
3. **Data Quality Assessment**: Validate job data accuracy
4. **Cost-Benefit Analysis**: Evaluate ROI based on trial results
5. **Full Implementation**: Integrate into production if successful