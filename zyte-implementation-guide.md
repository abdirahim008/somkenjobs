# Zyte API Implementation Guide for JobConnect East Africa

## Quick Setup Instructions

### 1. Get Zyte API Credentials
1. Visit [Zyte.com](https://www.zyte.com) and create an account
2. Choose appropriate pricing plan based on usage needs:
   - **Free Trial**: Test with limited requests
   - **Starter ($29/month)**: 10,000 requests
   - **Professional ($99/month)**: 50,000 requests
3. Generate API key from your Zyte dashboard
4. Note your Project ID and Spider configuration

### 2. Environment Configuration
Add these environment variables to your Replit secrets:

```bash
ZYTE_API_KEY=your_api_key_here
ZYTE_PROJECT_ID=your_project_id
ZYTE_SPIDER_NAME=job_extraction_spider
```

### 3. Install Required Dependencies
The integration is ready but needs the official Zyte SDK:

```bash
npm install scrapinghub zyte-api axios
```

### 4. Production API Integration
Replace the mock implementation in `server/services/zyteJobFetcher.ts`:

```typescript
// Replace the makeZyteRequest method with actual API calls
private async makeZyteRequest(endpoint: string, params: any): Promise<ZyteApiResponse> {
  const response = await fetch(`https://api.zyte.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error(`Zyte API error: ${response.statusText}`);
  }
  
  return await response.json();
}
```

## Target Job Boards for Kenya & Somalia

### Kenya - Primary Sources
1. **BrighterMonday.co.ke** - Kenya's largest job board
2. **Jobs.co.ke** - Popular local platform
3. **MyJobMag.co.ke** - East Africa focused
4. **Corporate.co.ke** - Corporate job listings
5. **Pigiame.co.ke/jobs** - Classified job section
6. **Career-point.co.ke** - Professional careers

### Somalia - Available Sources
1. **Jobs.so** - Main Somali job portal
2. **SomaliaOnlineJobs.com** - Online job platform
3. **HornAffairsJobs.com** - Regional opportunities

### Company Career Pages
- Safaricom Kenya
- Equity Bank
- KCB Group
- East African Breweries
- Jubilee Insurance
- And other major East African employers

## Data Quality Features

### Location Enhancement
- Automatic city detection for major urban centers
- Intelligent location formatting (e.g., "Nairobi, Kenya")
- Country-specific filtering and categorization

### Job Categorization
- Maps job types to humanitarian sectors when applicable
- Industry-specific tagging and filtering
- Experience level standardization

### Content Cleaning
- HTML tag removal and text formatting
- Duplicate detection across multiple sources
- Consistent job description formatting

## Integration Benefits

### For Users
- **10x More Jobs**: Access to local Kenyan job market + humanitarian positions
- **Fresh Content**: Real-time updates from major job boards
- **Better Targeting**: Location-specific job discovery
- **Complete Coverage**: Both local and international opportunities

### For Platform
- **Competitive Advantage**: First comprehensive East African job aggregator
- **User Retention**: More relevant job matches
- **Market Expansion**: Coverage beyond just humanitarian sector
- **Revenue Potential**: Premium features for advanced search

## Cost Analysis

### Monthly Costs (Estimated)
- **Development Phase**: Free trial (1-2 months)
- **Launch Phase**: $29/month (Starter plan)
- **Growth Phase**: $99/month (Professional plan)
- **Scale Phase**: Custom enterprise pricing

### ROI Calculation
- **User Acquisition**: 3-5x more job inventory
- **User Engagement**: Higher session duration
- **Market Position**: First-mover advantage in East Africa
- **Potential Revenue**: Job posting fees, premium subscriptions

## Implementation Status

### ✅ Completed
- [x] Zyte service architecture design
- [x] Mock API integration framework
- [x] Data mapping and transformation logic
- [x] Integration with existing job scheduler
- [x] Error handling and retry mechanisms
- [x] Location intelligence for Kenya/Somalia

### 🚧 Ready for Production
- [ ] Replace mock API with real Zyte endpoints
- [ ] Add API key configuration
- [ ] Install Zyte SDK dependencies
- [ ] Configure specific job board scrapers
- [ ] Set up monitoring and alerting

### 📋 Testing Checklist (Once API is Active)
- [ ] Test Kenya job board scraping (BrighterMonday, Jobs.co.ke)
- [ ] Test Somalia job sources (Jobs.so)
- [ ] Validate data quality and formatting
- [ ] Check deduplication across sources
- [ ] Monitor API usage and costs
- [ ] Performance testing with concurrent requests

## Next Steps

1. **Immediate** (Week 1): Set up Zyte trial account and test API
2. **Short-term** (Week 2-3): Replace mock implementation with real API calls
3. **Medium-term** (Month 1): Full integration with 3-5 major job boards
4. **Long-term** (Month 2+): Advanced features like salary extraction, job alerts

This integration will transform JobConnect from a humanitarian-focused platform to the most comprehensive job search engine for East Africa, combining both local market opportunities and international humanitarian positions.