# Zyte Trial Account Setup Guide

## Step 1: Create Your Zyte Account

1. **Visit Zyte Website**: Go to [https://www.zyte.com](https://www.zyte.com)
2. **Sign Up**: Click "Get Started" or "Sign Up" button
3. **Choose Plan**: Select "Free Trial" or "Start Free Trial"
4. **Account Details**: Fill in your information:
   - Email: Use your primary email address
   - Company: JobConnect East Africa
   - Use Case: Job data extraction for East African markets

## Step 2: Access Your API Credentials

After account creation, you'll need to:

1. **Login to Dashboard**: Go to your Zyte dashboard
2. **Navigate to API Section**: Look for "API Keys" or "Credentials"
3. **Generate API Key**: Create a new API key for JobConnect
4. **Note Project Settings**: Record your Project ID and configuration

## Step 3: Configure API Settings

In your Zyte dashboard:

1. **Set Target Regions**: Configure for Kenya and Somalia
2. **Job Board Targets**: Add these priority sources:
   - brightermonday.co.ke (Kenya's largest job board)
   - jobs.co.ke (Popular Kenyan platform)
   - jobs.so (Somalia job portal)
   - myjobmag.co.ke (East Africa focused)

3. **Data Fields**: Ensure extraction includes:
   - Job title and description
   - Company/organization name
   - Location and country
   - Posting date and deadline
   - Application instructions
   - Salary information (when available)

## Step 4: Add Credentials to Replit

Once you have your API credentials:

1. **Go to Replit Secrets**: In your Replit project, click on "Secrets" in the left sidebar
2. **Add These Environment Variables**:
   ```
   ZYTE_API_KEY=your_actual_api_key_here
   ZYTE_PROJECT_ID=your_project_id
   ZYTE_SPIDER_NAME=job_extraction_spider
   ```

## Step 5: Test the Integration

After adding credentials, the system will automatically:
- Detect the API key and enable Zyte integration
- Start fetching jobs from Kenyan and Somali job boards
- Display both ReliefWeb humanitarian jobs AND local market jobs
- Show enhanced location data with city names

## Expected Results

With Zyte integration active, you should see:
- **10-20 additional jobs** from Kenyan job boards per fetch
- **5-10 additional jobs** from Somali sources per fetch
- **Better location data**: "Nairobi, Kenya" instead of just "Kenya"
- **Diverse job types**: Beyond just humanitarian sector
- **Fresh content**: Latest postings from major East African employers

## Trial Limitations

Free trial typically includes:
- **Limited requests**: Usually 1,000-5,000 requests per month
- **Basic support**: Email support only
- **Standard features**: Core extraction capabilities
- **No SLA**: Best-effort availability

## Monitoring Usage

Keep track of:
- **API requests made**: Monitor in Zyte dashboard
- **Data quality**: Check job completeness and accuracy
- **Success rate**: Percentage of successful extractions
- **Cost per job**: Calculate value for upgrade decisions

## Next Steps After Trial

Based on trial performance:
1. **Good Results**: Upgrade to Starter plan ($29/month)
2. **Excellent Results**: Consider Professional plan ($99/month) for higher volume
3. **Mixed Results**: Fine-tune extraction settings or try alternative sources

## Troubleshooting

Common issues and solutions:
- **No API Key Error**: Verify key is correctly added to Replit Secrets
- **Zero Results**: Check if target job boards are accessible from Zyte
- **Poor Quality**: Adjust extraction parameters in Zyte dashboard
- **Rate Limits**: Monitor usage and consider upgrade if hitting limits

Ready to proceed? Get your Zyte trial account set up and I'll help you configure the API integration!