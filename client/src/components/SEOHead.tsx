import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export default function SEOHead({ 
  title, 
  description, 
  keywords, 
  canonicalUrl,
  ogImage 
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);

      // Update Open Graph description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', description);

      // Update Twitter description
      let twitterDescription = document.querySelector('meta[property="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('property', 'twitter:description');
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
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', title);

      // Update Twitter title
      let twitterTitle = document.querySelector('meta[property="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('property', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', title);
    }

    // Update Open Graph image
    if (ogImage) {
      let ogImageMeta = document.querySelector('meta[property="og:image"]');
      if (!ogImageMeta) {
        ogImageMeta = document.createElement('meta');
        ogImageMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogImageMeta);
      }
      ogImageMeta.setAttribute('content', ogImage);

      let twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('property', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', ogImage);
    }
    // Update Open Graph URL
    if (canonicalUrl) {
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute('content', canonicalUrl);

      // Update Twitter URL
      let twitterUrl = document.querySelector('meta[property="twitter:url"]');
      if (!twitterUrl) {
        twitterUrl = document.createElement('meta');
        twitterUrl.setAttribute('property', 'twitter:url');
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

    // Add image dimensions for better social media display
    if (ogImage) {
      // Add og:image:width
      let ogImageWidth = document.querySelector('meta[property="og:image:width"]');
      if (!ogImageWidth) {
        ogImageWidth = document.createElement('meta');
        ogImageWidth.setAttribute('property', 'og:image:width');
        document.head.appendChild(ogImageWidth);
      }
      ogImageWidth.setAttribute('content', '1200');

      // Add og:image:height
      let ogImageHeight = document.querySelector('meta[property="og:image:height"]');
      if (!ogImageHeight) {
        ogImageHeight = document.createElement('meta');
        ogImageHeight.setAttribute('property', 'og:image:height');
        document.head.appendChild(ogImageHeight);
      }
      ogImageHeight.setAttribute('content', '630');

      // Add og:image:alt
      let ogImageAlt = document.querySelector('meta[property="og:image:alt"]');
      if (!ogImageAlt) {
        ogImageAlt = document.createElement('meta');
        ogImageAlt.setAttribute('property', 'og:image:alt');
        document.head.appendChild(ogImageAlt);
      }
      ogImageAlt.setAttribute('content', title || 'Somken Jobs - Humanitarian Career Opportunities');
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
        ogImage: ogImage?.substring(0, 100) + '...' || 'none'
      });
    }
  }, [title, description, keywords, canonicalUrl, ogImage]);

  return null; // This component doesn't render anything
}