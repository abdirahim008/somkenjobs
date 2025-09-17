import React, { useEffect } from "react";
import { 
  generateOptimizedTitle, 
  generateOptimizedDescription, 
  validateSEOMetadata 
} from "@shared/seoUtils";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  // Job-specific properties for richer social media previews
  jobLocation?: string;
  jobOrganization?: string;
  jobDeadline?: string;
  jobSector?: string;
  jobCountry?: string;
  jobPostedDate?: string;
  // Additional props for SEO optimization
  pageType?: 'homepage' | 'jobs' | 'job-detail' | 'search';
  jobCount?: number;
  optimizeTitleAndDescription?: boolean; // Flag to enable/disable optimization
}

export default function SEOHead({ 
  title, 
  description, 
  keywords, 
  canonicalUrl,
  ogImage,
  jobLocation,
  jobOrganization,
  jobDeadline,
  jobSector,
  jobCountry,
  jobPostedDate,
  pageType,
  jobCount,
  optimizeTitleAndDescription = true
}: SEOHeadProps) {
  useEffect(() => {
    // Optimize title and description if optimization is enabled
    let optimizedTitle = title;
    let optimizedDescription = description;
    
    if (optimizeTitleAndDescription && pageType) {
      // Generate optimized versions using utility functions
      const context = {
        location: jobLocation,
        country: jobCountry,
        organization: jobOrganization,
        sector: jobSector,
        jobCount,
        pageType
      };
      
      if (title) {
        optimizedTitle = generateOptimizedTitle(title, context);
      }
      
      if (description) {
        optimizedDescription = generateOptimizedDescription(description, {
          ...context,
          deadline: jobDeadline
        });
      }
      
      // Log SEO validation in development
      if (import.meta.env.DEV && optimizedTitle && optimizedDescription) {
        const validation = validateSEOMetadata({
          title: optimizedTitle,
          description: optimizedDescription
        });
        
        if (!validation.isValid) {
          console.warn('SEO Optimization Warnings:', validation.warnings);
        } else {
          console.log('✓ SEO metadata optimized and validated');
        }
      }
    }
    
    // Clear any existing job-specific meta tags FIRST to prevent conflicts
    const existingJobMetas = document.querySelectorAll('meta[data-job-specific]');
    existingJobMetas.forEach(meta => meta.remove());
    
    // Update document title with optimized version
    if (optimizedTitle) {
      document.title = optimizedTitle;
      
      // Also update meta name="title" tag for better SEO
      let metaTitle = document.querySelector('meta[name="title"]');
      if (!metaTitle) {
        metaTitle = document.createElement('meta');
        metaTitle.setAttribute('name', 'title');
        metaTitle.setAttribute('data-job-specific', 'true');
        document.head.appendChild(metaTitle);
      }
      metaTitle.setAttribute('content', optimizedTitle);
    }

    // Update meta description with optimized version
    if (optimizedDescription) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('data-job-specific', 'true');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', optimizedDescription);

      // Update Open Graph description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        ogDescription.setAttribute('data-job-specific', 'true');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', optimizedDescription);

      // Update Twitter description (Twitter uses 'name' not 'property')
      let twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        twitterDescription.setAttribute('data-job-specific', 'true');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', optimizedDescription);
    }

    // Update keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // Update canonical URL
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // Update Open Graph title with optimized version
    if (optimizedTitle) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        ogTitle.setAttribute('data-job-specific', 'true');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', optimizedTitle);

      // Update Twitter title (Twitter uses 'name' not 'property')
      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        twitterTitle.setAttribute('data-job-specific', 'true');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', optimizedTitle);
    }

    // Remove any existing image meta tags to prevent unwanted images in social media previews
    const existingOgImage = document.querySelector('meta[property="og:image"]');
    if (existingOgImage) {
      existingOgImage.remove();
    }

    const existingTwitterImage = document.querySelector('meta[name="twitter:image"]');
    if (existingTwitterImage) {
      existingTwitterImage.remove();
    }
    // Update Open Graph URL
    if (canonicalUrl) {
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        ogUrl.setAttribute('data-job-specific', 'true');
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute('content', canonicalUrl);

      // Update Twitter URL (Twitter uses 'name' not 'property')
      let twitterUrl = document.querySelector('meta[name="twitter:url"]');
      if (!twitterUrl) {
        twitterUrl = document.createElement('meta');
        twitterUrl.setAttribute('name', 'twitter:url');
        twitterUrl.setAttribute('data-job-specific', 'true');
        document.head.appendChild(twitterUrl);
      }
      twitterUrl.setAttribute('content', canonicalUrl);
    }

    // Ensure Open Graph type is set correctly for job pages (only one og:type per page)
    if (canonicalUrl && canonicalUrl.includes('/jobs/')) {
      // Remove any existing og:type tags to prevent duplicates
      const existingOgTypes = document.querySelectorAll('meta[property="og:type"]');
      existingOgTypes.forEach(tag => tag.remove());
      
      // Add single og:type="article" for job pages
      const ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      ogType.setAttribute('content', 'article');
      ogType.setAttribute('data-job-specific', 'true');
      document.head.appendChild(ogType);
    }

    // Add Twitter Card type
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');

    // Add site name for Open Graph
    let ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (!ogSiteName) {
      ogSiteName = document.createElement('meta');
      ogSiteName.setAttribute('property', 'og:site_name');
      document.head.appendChild(ogSiteName);
    }
    ogSiteName.setAttribute('content', 'Somken Jobs');

    // Add locale for Open Graph
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', 'en_US');

    // Add comprehensive Open Graph and Twitter Card properties for job postings
    if (jobLocation || jobOrganization || jobDeadline || jobSector) {
      // Create compelling social media description with rich job details
      let socialDescription = description || '';
      
      // For job pages, create a structured description that social media platforms will display nicely
      if (jobOrganization && jobLocation && jobCountry) {
        const jobDetails = [];
        
        // Add key information in a format that looks good on social platforms
        if (jobOrganization) {
          jobDetails.push(`🏢 ${jobOrganization}`);
        }
        
        if (jobLocation && jobCountry) {
          jobDetails.push(`📍 ${jobLocation}, ${jobCountry}`);
        }
        
        if (jobSector) {
          jobDetails.push(`🏷️ ${jobSector} Sector`);
        }
        
        if (jobDeadline) {
          const deadlineDate = new Date(jobDeadline);
          const isValidDate = !isNaN(deadlineDate.getTime());
          if (isValidDate) {
            const now = new Date();
            const diffTime = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              jobDetails.push(`⏰ ${diffDays} days left to apply`);
            } else {
              const formattedDeadline = deadlineDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
              jobDetails.push(`⏰ Deadline: ${formattedDeadline}`);
            }
          }
        }
        
        // Create the final social media optimized description
        if (jobDetails.length > 0) {
          socialDescription = `${jobDetails.join(' • ')} | Apply now on Somken Jobs - East Africa's leading humanitarian job platform`;
        }
      }
      
      const enrichedDescription = socialDescription;
      
      // Update description in all relevant meta tags  
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', enrichedDescription.substring(0, 160)); // SEO limit
      }
      
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', enrichedDescription.substring(0, 300)); // OG limit
      }
      
      const twitterDescription = document.querySelector('meta[property="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute('content', enrichedDescription.substring(0, 200)); // Twitter limit
      }
      
      // Comprehensive meta tag helper function
      const updateOrCreateMetaTag = (attribute: string, attributeValue: string, content: string, isTwitter = false) => {
        const selector = isTwitter ? `meta[name="${attributeValue}"]` : `meta[${attribute}="${attributeValue}"]`;
        let tag = document.querySelector(selector);
        if (tag) {
          tag.setAttribute('content', content);
        } else {
          tag = document.createElement('meta');
          tag.setAttribute(isTwitter ? 'name' : attribute, attributeValue);
          tag.setAttribute('content', content);
          tag.setAttribute('data-job-specific', 'true');
          document.head.appendChild(tag);
        }
      };
      
      // Enhanced Open Graph tags for job postings
      updateOrCreateMetaTag('property', 'og:type', 'article');
      
      if (jobPostedDate) {
        updateOrCreateMetaTag('property', 'article:published_time', new Date(jobPostedDate).toISOString());
      }
      
      if (jobSector) {
        updateOrCreateMetaTag('property', 'article:section', jobSector);
        updateOrCreateMetaTag('property', 'article:tag', jobSector);
      }
      
      if (jobOrganization) {
        updateOrCreateMetaTag('property', 'article:author', jobOrganization);
      }
      
      // Job-specific Open Graph properties
      if (jobLocation && jobCountry) {
        updateOrCreateMetaTag('property', 'job:location', `${jobLocation}, ${jobCountry}`);
      }
      
      if (jobOrganization) {
        updateOrCreateMetaTag('property', 'job:company', jobOrganization);
      }
      
      if (jobDeadline) {
        updateOrCreateMetaTag('property', 'job:expires', jobDeadline);
      }
      
      if (jobSector) {
        updateOrCreateMetaTag('property', 'job:category', jobSector);
      }
      
      // Enhanced Twitter Card meta tags
      updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image', true);
      updateOrCreateMetaTag('name', 'twitter:site', '@SomkenJobs', true);
      updateOrCreateMetaTag('name', 'twitter:creator', '@SomkenJobs', true);
      
      if (optimizedTitle) {
        updateOrCreateMetaTag('name', 'twitter:title', optimizedTitle, true);
      }
      
      // Twitter-specific job labels for enhanced display
      if (jobOrganization) {
        updateOrCreateMetaTag('name', 'twitter:label1', 'Employer', true);
        updateOrCreateMetaTag('name', 'twitter:data1', jobOrganization, true);
      }
      
      if (jobLocation && jobCountry) {
        updateOrCreateMetaTag('name', 'twitter:label2', 'Location', true);
        updateOrCreateMetaTag('name', 'twitter:data2', `${jobLocation}, ${jobCountry}`, true);
      }
      
      // Additional LinkedIn-specific Open Graph properties
      if (jobOrganization && jobLocation && jobSector) {
        const linkedInTitle = `${title} at ${jobOrganization} | ${jobLocation} | ${jobSector}`;
        updateOrCreateMetaTag('property', 'og:title', linkedInTitle.substring(0, 100));
      }
      
      // Facebook-specific Open Graph properties for better job sharing
      // Remove Facebook App ID for now since it requires actual app registration
      // updateOrCreateMetaTag('property', 'fb:app_id', 'YOUR_FB_APP_ID');
      updateOrCreateMetaTag('property', 'og:updated_time', new Date().toISOString());
    }

    // Remove any existing image-related meta tags
    const existingOgImageWidth = document.querySelector('meta[property="og:image:width"]');
    if (existingOgImageWidth) {
      existingOgImageWidth.remove();
    }

    const existingOgImageHeight = document.querySelector('meta[property="og:image:height"]');
    if (existingOgImageHeight) {
      existingOgImageHeight.remove();
    }

    const existingOgImageAlt = document.querySelector('meta[property="og:image:alt"]');
    if (existingOgImageAlt) {
      existingOgImageAlt.remove();
    }

    // Add WhatsApp specific meta tags
    let whatsappTitle = document.querySelector('meta[property="og:title"]');
    if (whatsappTitle && title) {
      whatsappTitle.setAttribute('content', title);
    }

    // Add LinkedIn specific meta tags
    let linkedinTitle = document.querySelector('meta[property="og:title"]');
    if (linkedinTitle && title) {
      linkedinTitle.setAttribute('content', title);
    }

    // Add Facebook specific meta tags
    let facebookTitle = document.querySelector('meta[property="og:title"]');
    if (facebookTitle && title) {
      facebookTitle.setAttribute('content', title);
    }
    
    // Debug: Log the meta tags being set (only in development)
    if (import.meta.env.DEV) {
      console.log('SEO Head Meta Tags:', {
        title,
        description,
        canonicalUrl,
        ogImage: 'removed - no images in social media previews'
      });
    }
  }, [title, description, keywords, canonicalUrl, ogImage, jobLocation, jobOrganization, jobDeadline, jobSector, jobCountry, jobPostedDate, pageType, jobCount, optimizeTitleAndDescription]);

  return null; // This component doesn't render anything
}