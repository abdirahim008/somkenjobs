// Google Jobs Schema Validation Utility
// This helps verify that our JobPosting structured data is Google-compliant

export interface GoogleJobsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  schema?: any;
}

export function validateJobSchema(job: any): GoogleJobsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Required fields validation (Google Jobs 2025)
  if (!job.title || job.title.trim() === '') {
    errors.push('Missing required field: title');
  } else if (job.title.length > 100) {
    warnings.push('Title exceeds 100 characters (Google limit)');
  }

  if (!job.description || job.description.trim() === '') {
    errors.push('Missing required field: description');
  } else if (job.description.length < 100) {
    warnings.push('Description should be at least 100 characters for better visibility');
  }

  if (!job.datePosted) {
    errors.push('Missing required field: datePosted');
  } else {
    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(job.datePosted)) {
      errors.push('datePosted must be in YYYY-MM-DD format');
    }
  }

  if (!job.hiringOrganization?.name) {
    errors.push('Missing required field: hiringOrganization.name');
  }

  if (!job.jobLocation?.address?.addressLocality) {
    errors.push('Missing required field: jobLocation.address.addressLocality');
  }

  if (!job.jobLocation?.address?.addressCountry) {
    errors.push('Missing required field: jobLocation.address.addressCountry');
  }

  // Employment type validation
  const validEmploymentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'PER_DIEM', 'OTHER'];
  if (job.employmentType && !validEmploymentTypes.includes(job.employmentType)) {
    errors.push(`Invalid employmentType: ${job.employmentType}. Must be one of: ${validEmploymentTypes.join(', ')}`);
  }

  // Job location type validation
  const validLocationTypes = ['TELECOMMUTE', 'ON_SITE'];
  if (job.jobLocationType && !validLocationTypes.includes(job.jobLocationType)) {
    errors.push(`Invalid jobLocationType: ${job.jobLocationType}. Must be one of: ${validLocationTypes.join(', ')}`);
  }

  // Recommendations for better visibility
  if (!job.validThrough) {
    recommendations.push('Add validThrough date for better job expiration handling');
  }

  if (!job.industry) {
    recommendations.push('Add industry field for better categorization');
  }

  if (!job.qualifications) {
    recommendations.push('Add qualifications field for better job matching');
  }

  if (!job.experienceRequirements) {
    recommendations.push('Add experienceRequirements for enhanced search visibility');
  }

  if (!job.applicationContact) {
    recommendations.push('Add applicationContact for better user experience');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    recommendations,
    schema: isValid ? job : undefined
  };
}

// Utility to generate test URLs for Google Rich Results Testing
export function generateGoogleTestUrls(jobId: string, slug: string) {
  const jobUrl = `https://somkenjobs.com/jobs/${slug}`;
  const richResultsTest = `https://search.google.com/test/rich-results?url=${encodeURIComponent(jobUrl)}`;
  const mobileTest = `https://search.google.com/test/mobile-friendly?url=${encodeURIComponent(jobUrl)}`;
  
  return {
    jobUrl,
    richResultsTest,
    mobileTest,
    instructions: [
      '1. Visit the Rich Results Test URL to validate structured data',
      '2. Check for any errors or warnings in the JobPosting schema',
      '3. Verify that all required fields are present and valid',
      '4. Test mobile-friendliness for better Google Jobs visibility'
    ]
  };
}

// Check if current page has valid JobPosting schema
export function checkPageJobSchema(): GoogleJobsValidationResult[] {
  const results: GoogleJobsValidationResult[] = [];
  
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach((script, index) => {
      try {
        const data = JSON.parse(script.textContent || '{}');
        
        if (data['@type'] === 'JobPosting') {
          const validation = validateJobSchema(data);
          results.push({
            ...validation,
            schema: { ...validation.schema, _scriptIndex: index }
          });
        }
      } catch (parseError) {
        results.push({
          isValid: false,
          errors: [`Invalid JSON in script tag ${index}: ${parseError}`],
          warnings: [],
          recommendations: []
        });
      }
    });
    
  } catch (error) {
    results.push({
      isValid: false,
      errors: [`Error checking page schema: ${error}`],
      warnings: [],
      recommendations: []
    });
  }
  
  return results;
}