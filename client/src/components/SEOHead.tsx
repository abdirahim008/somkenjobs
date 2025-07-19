import { useEffect } from "react";

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
  jobPostedDate
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Clear any existing job-specific meta tags to prevent conflicts
    const existingJobMetas = document.querySelectorAll('meta[data-job-specific]');
    existingJobMetas.forEach(meta => meta.remove());

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('data-job-specific', 'true');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);

      // Update Open Graph description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        ogDescription.setAttribute('data-job-specific', 'true');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', description);

      // Update Twitter description
      let twitterDescription = document.querySelector('meta[property="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('property', 'twitter:description');
        twitterDescription.setAttribute('data-job-specific', 'true');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', description);
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

    // Update Open Graph title
    if (title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        ogTitle.setAttribute('data-job-specific', 'true');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', title);

      // Update Twitter title
      let twitterTitle = document.querySelector('meta[property="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('property', 'twitter:title');
        twitterTitle.setAttribute('data-job-specific', 'true');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', title);
    }

    // Remove any existing image meta tags to prevent unwanted images in social media previews
    const existingOgImage = document.querySelector('meta[property="og:image"]');
    if (existingOgImage) {
      existingOgImage.remove();
    }

    const existingTwitterImage = document.querySelector('meta[property="twitter:image"]');
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

      // Update Twitter URL
      let twitterUrl = document.querySelector('meta[property="twitter:url"]');
      if (!twitterUrl) {
        twitterUrl = document.createElement('meta');
        twitterUrl.setAttribute('property', 'twitter:url');
        twitterUrl.setAttribute('data-job-specific', 'true');
        document.head.appendChild(twitterUrl);
      }
      twitterUrl.setAttribute('content', canonicalUrl);
    }

    // Ensure Open Graph type is set for job pages
    if (canonicalUrl && canonicalUrl.includes('/jobs/')) {
      let ogType = document.querySelector('meta[property="og:type"]');
      if (!ogType) {
        ogType = document.createElement('meta');
        ogType.setAttribute('property', 'og:type');
        document.head.appendChild(ogType);
      }
      ogType.setAttribute('content', 'article');
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

    // Add job-specific Open Graph properties for richer social media previews
    if (jobLocation || jobOrganization || jobDeadline || jobSector) {
      // Create a richer description by including key job details
      let enrichedDescription = description || '';
      
      if (jobOrganization && jobLocation && jobCountry) {
        enrichedDescription += ` | ${jobOrganization} in ${jobLocation}, ${jobCountry}`;
      }
      
      if (jobSector) {
        enrichedDescription += ` | ${jobSector} sector`;
      }
      
      if (jobDeadline) {
        enrichedDescription += ` | Apply by ${jobDeadline}`;
      }
      
      // Update the enhanced description in all relevant meta tags
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', enrichedDescription);
      }
      
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', enrichedDescription);
      }
      
      const twitterDescription = document.querySelector('meta[property="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute('content', enrichedDescription);
      }
      
      // Add job-specific Open Graph properties
      const updateOrCreateJobOGTag = (property: string, content: string) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (tag) {
          tag.setAttribute('content', content);
        } else {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          tag.setAttribute('content', content);
          tag.setAttribute('data-job-specific', 'true');
          document.head.appendChild(tag);
        }
      };
      
      // Add Article-specific Open Graph tags for better Facebook previews
      if (jobPostedDate) {
        updateOrCreateJobOGTag('article:published_time', jobPostedDate);
      }
      
      if (jobSector) {
        updateOrCreateJobOGTag('article:section', jobSector);
        updateOrCreateJobOGTag('article:tag', jobSector);
      }
      
      if (jobOrganization) {
        updateOrCreateJobOGTag('article:author', jobOrganization);
      }
      
      // Add specific tags for job posts
      if (jobLocation && jobCountry) {
        updateOrCreateJobOGTag('job:location', `${jobLocation}, ${jobCountry}`);
      }
      
      if (jobOrganization) {
        updateOrCreateJobOGTag('job:company', jobOrganization);
      }
      
      if (jobDeadline) {
        updateOrCreateJobOGTag('job:expires', jobDeadline);
      }
      
      if (jobSector) {
        updateOrCreateJobOGTag('job:category', jobSector);
      }
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
  }, [title, description, keywords, canonicalUrl, ogImage, jobLocation, jobOrganization, jobDeadline, jobSector, jobCountry, jobPostedDate]);

  return null; // This component doesn't render anything
}