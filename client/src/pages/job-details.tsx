import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Calendar, MapPin, Building2, ExternalLink, Clock, Users, ChevronDown, ChevronUp, Briefcase, FileText, Share2 } from "lucide-react";
import { FaFacebook, FaWhatsapp, FaTwitter, FaLinkedin } from "react-icons/fa";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { type Job } from "@shared/schema";
import { generateJobOGTitle, generateJobOGDescription } from "@/utils/generateJobOGImage";
import { generateJobSlug } from "@shared/utils";

export default function JobDetails() {
  const [match, params] = useRoute("/jobs/:id");
  const [, setLocation] = useLocation();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const jobId = params?.id;

  // Scroll to top when component mounts or job ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [jobId]);

  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });

  // Query for related jobs
  const { data: relatedJobs, isLoading: isLoadingRelated } = useQuery<Job[]>({
    queryKey: [`/api/jobs/${jobId}/related`],
    enabled: !!jobId && !!job,
  });

  // Add structured data to head - always run this effect
  useEffect(() => {
    // Remove existing job structured data
    const existingScript = document.querySelector('script[data-job-posting-detail]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data only if job data exists
    if (job) {
      // Build the structured data object with required fields
      const jobStructuredData: any = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        // Required fields - always include with fallbacks
        "title": job.title || "Humanitarian Position",
        "description": job.description || `Join ${job.organization || 'our organization'} in their humanitarian mission in ${job.location || 'the field'}, ${job.country || 'East Africa'}.`,
        "datePosted": new Date(job.datePosted).toISOString(),
        "employmentType": "CONTRACTOR",
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.organization || "Humanitarian Organization"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": job.location || "Field Location",
            "addressCountry": job.country || "East Africa"
          }
        }
      };

      // Add optional fields only if they have valid values
      if (job.deadline) {
        jobStructuredData.validThrough = new Date(job.deadline).toISOString();
      }

      if (job.externalId && job.source) {
        jobStructuredData.identifier = {
          "@type": "PropertyValue",
          "name": job.source,
          "value": job.externalId
        };
      }

      if (job.url) {
        jobStructuredData.url = job.url;
        if (job.url.includes("reliefweb.int")) {
          jobStructuredData.hiringOrganization.sameAs = job.url;
        }
      } else {
        jobStructuredData.url = `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`;
      }

      if (job.sector) {
        jobStructuredData.industry = job.sector;
        jobStructuredData.occupationalCategory = job.sector;
      }

      if (job.qualifications) {
        jobStructuredData.qualifications = job.qualifications;
      }

      if (job.experienceLevel) {
        jobStructuredData.experienceRequirements = job.experienceLevel;
      }

      // Add jobLocationType based on job location/type
      if (job.location && job.location.toLowerCase().includes('remote')) {
        jobStructuredData.jobLocationType = "TELECOMMUTE";
      } else {
        jobStructuredData.jobLocationType = "ON_SITE";
      }

      // Add skills array if sector is available
      if (job.sector) {
        jobStructuredData.skills = [job.sector, "Humanitarian Aid", "Development Work"];
      }

      // Add application contact information
      const applicationUrl = job.url || `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`;
      jobStructuredData.applicationContact = {
        "@type": "ContactPoint",
        "contactType": "HR",
        "url": applicationUrl
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-job-posting-detail', 'true');
      script.textContent = JSON.stringify(jobStructuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      const script = document.querySelector('script[data-job-posting-detail]');
      if (script) {
        script.remove();
      }
    };
  }, [job]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDeadline = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };

  const cleanText = (text: string) => {
    return text
      .replace(/\\-/g, '-')           // Fix escaped hyphens
      .replace(/\\\\/g, '')           // Remove double backslashes
      .replace(/\\'/g, "'")           // Fix escaped apostrophes
      .replace(/\\"/g, '"')           // Fix escaped quotes
      .replace(/\\n/g, '\n')          // Fix escaped newlines
      .replace(/\\t/g, ' ')           // Replace escaped tabs with spaces
      .replace(/\\_/g, '_')           // Fix escaped underscores
      .replace(/\\@/g, '@')           // Fix escaped @ symbols
      .replace(/\\\//g, '/')          // Fix escaped forward slashes
      .replace(/\\&/g, '&')           // Fix escaped ampersands
      .replace(/\\:/g, ':')           // Fix escaped colons
      .replace(/\\;/g, ';')           // Fix escaped semicolons
      .replace(/\\,/g, ',')           // Fix escaped commas
      .replace(/\\\./g, '.')          // Fix escaped periods
      .replace(/\\\?/g, '?')          // Fix escaped question marks
      .replace(/\\!/g, '!')           // Fix escaped exclamation marks
      .replace(/\\\(/g, '(')          // Fix escaped opening parentheses
      .replace(/\\\)/g, ')')          // Fix escaped closing parentheses
      .replace(/\\\[/g, '[')          // Fix escaped opening brackets
      .replace(/\\\]/g, ']')          // Fix escaped closing brackets
      .replace(/\\\{/g, '{')          // Fix escaped opening braces
      .replace(/\\\}/g, '}')          // Fix escaped closing braces
      .replace(/\\%/g, '%')           // Fix escaped percent signs
      .replace(/\\\$/g, '$')          // Fix escaped dollar signs
      .replace(/\\#/g, '#')           // Fix escaped hash symbols
      .replace(/\^\^/g, '^')          // Fix escaped caret symbols
      .replace(/\\\*/g, '*')          // Fix escaped asterisks (but handle ** bold separately)
      .replace(/\\\+/g, '+')          // Fix escaped plus signs
      .replace(/\\=/g, '=')           // Fix escaped equals signs
      .replace(/\\</g, '<')           // Fix escaped less than
      .replace(/\\>/g, '>')           // Fix escaped greater than
      .replace(/\\\|/g, '|')          // Fix escaped pipes
      .replace(/\\`/g, '`')           // Fix escaped backticks
      .replace(/\\~/g, '~')           // Fix escaped tildes
      .replace(/\*{4,}/g, '**')       // Replace 4 or more asterisks with just **
      .replace(/\*{3}/g, '**')        // Replace triple asterisks with double
      .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold (non-greedy)
      .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')             // Convert *text* to italic (non-greedy)
      .replace(/\*\*/g, '')           // Remove any remaining double asterisks
      .replace(/\*+/g, '')            // Remove any remaining single or multiple asterisks
      .replace(/^#{1,6}\s*/gm, '')    // Remove markdown headers (# ## ### etc.) at start of lines
      .replace(/^\s*#{1,6}\s*/gm, '') // Remove markdown headers with leading whitespace
      .replace(/^\s*[\)\]\}]+\s*$/gm, '') // Remove lines that contain only closing brackets/parentheses
      .replace(/^\s*[\)\]\}]+(?=\s)/gm, '') // Remove standalone closing brackets/parentheses at start of lines only if followed by space
      .replace(/(?<=\s)[\)\]\}]+\s*$/gm, '') // Remove standalone closing brackets/parentheses at end of lines only if preceded by space
      .trim();                        // Remove leading/trailing whitespace
  };

  // Helper function to convert URLs and emails to clickable links
  const convertUrlsToLinks = (text: string) => {
    // Don't process text that already contains HTML links
    if (text.includes('<a ') || text.includes('</a>')) {
      return text;
    }
    
    let processedText = text;
    
    // Enhanced email regex to detect email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // First, replace email addresses
    processedText = processedText.replace(emailRegex, (email) => {
      return `<a href="mailto:${email}" class="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block break-all word-break-all max-w-full" style="overflow-wrap: anywhere; word-break: break-all; max-width: 100%;">${email}</a>`;
    });
    
    // Enhanced URL regex to catch various URL formats, but exclude those in parentheses following text
    const urlRegex = /((?:https?:\/\/|www\.)[^\s\)]+)/gi;
    
    // Then, replace URLs (but avoid replacing emails that are already processed)
    processedText = processedText.replace(urlRegex, (url) => {
      // Skip if this URL is already part of an email link
      if (url.includes('mailto:')) {
        return url;
      }
      
      let href = url;
      let displayText = url;
      
      // Add https:// if it's missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        href = `https://${url}`;
      }
      
      // Truncate display text if URL is very long
      if (displayText.length > 60) {
        displayText = displayText.substring(0, 57) + '...';
      }
      
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all font-medium">${displayText}</a>`;
    });
    
    return processedText;
  };

  // Social media sharing functions
  const createShareUrl = (platform: string, jobTitle: string, jobUrl: string) => {
    // Add cache-busting parameter to force fresh previews
    const cacheBuster = `v=${Date.now()}`;
    const jobUrlWithCacheBuster = `${jobUrl}?${cacheBuster}`;
    
    const encodedTitle = encodeURIComponent(`${jobTitle} - Somken Jobs`);
    const encodedUrl = encodeURIComponent(jobUrlWithCacheBuster);
    const shareText = encodeURIComponent(`Check out this job opportunity: ${jobTitle}`);
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${shareText}`;
      case 'whatsapp':
        return `https://wa.me/?text=${shareText}%20${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      default:
        return '';
    }
  };

  const handleShare = (platform: string) => {
    if (!job) return;
    
    const slug = generateJobSlug(job.title, job.id);
    const jobUrl = `${window.location.origin}/jobs/${slug}`;
    const shareUrl = createShareUrl(platform, job.title, jobUrl);
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper function to create Apply Now button for How to Apply section
  const createApplyButton = (text: string) => {
    let url = null;
    let cleanedText = text;
    
    // First, try to extract URL from markdown-style links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const markdownMatches = [...text.matchAll(markdownLinkRegex)];
    
    if (markdownMatches.length > 0) {
      for (const match of markdownMatches) {
        const linkText = match[1];
        const linkUrl = match[2];
        
        // Skip void(0) links and extract the actual website from link text
        if (linkUrl.includes('void(0)') && linkText.includes('.')) {
          // Extract domain from link text (e.g., www.drc.ngo)
          const domainMatch = linkText.match(/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
          if (domainMatch) {
            url = `https://${domainMatch[0]}`;
            cleanedText = text.replace(match[0], `Visit ${linkText} to apply`);
            break;
          }
        } else if (!linkUrl.includes('void(0)')) {
          // Use valid URL
          url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
          cleanedText = text.replace(match[0], `Visit the application link to apply`);
          break;
        }
      }
    }
    
    // If no markdown URL found, try regular URL extraction (excluding void(0))
    if (!url) {
      const urlRegex = /((?:https?:\/\/|www\.)[^\s\)\[\]]+)/gi;
      const urlMatches = text.match(urlRegex);
      
      if (urlMatches) {
        // Filter out void(0) URLs and URLs that are part of markdown links
        const validUrls = urlMatches.filter(foundUrl => {
          // Skip void(0) URLs
          if (foundUrl.includes('void(0)')) return false;
          
          // Skip URLs that are part of markdown links (already processed above)
          const markdownCheck = new RegExp(`\\[([^\\]]+)\\]\\(${foundUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`);
          if (markdownCheck.test(text)) return false;
          
          return true;
        });
        
        if (validUrls.length > 0) {
          url = validUrls[0];
          // Add https:// if it's missing
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
          }
          // Remove the URL from the text but keep the rest
          cleanedText = text.replace(new RegExp(validUrls[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
        }
      }
    }
    
    // If we found a valid URL, create the apply button
    if (url) {
      return `
        <div class="flex flex-col gap-4">
          <div class="text-sm text-gray-700 leading-relaxed">
            ${convertUrlsToLinks(cleanedText) || 'Click the button below to apply for this position.'}
          </div>
          <a href="${url}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center justify-center gap-2 px-4 py-2 text-white font-medium rounded-lg transition-colors duration-200 w-auto max-w-fit no-underline"
             style="background-color: #0077B5; border: none; text-decoration: none;"
             onmouseover="this.style.backgroundColor='#005885'"
             onmouseout="this.style.backgroundColor='#0077B5'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            Apply Now
          </a>
        </div>
      `;
    }
    
    // If no valid URL found, just return the text with conversion
    return convertUrlsToLinks(text);
  };

  const renderDescription = (job: Job) => {
    if (!job) return null;
    
    // Use the full HTML description if available, otherwise use the regular description
    const fullDescription = job.bodyHtml || job.description;
    const shortDescription = job.description;
    
    // Check if we need to show "Show More" button (if there's more content in bodyHtml or description is truncated)
    const needsShowMore = fullDescription && fullDescription.length > shortDescription.length;
    
    const displayDescription = showFullDescription ? fullDescription : shortDescription;
    
    return (
      <div className="space-y-4">
        <div className="prose prose-gray max-w-none">
          <div className="space-y-4 break-words overflow-wrap-anywhere">
            {displayDescription
              .split('\n')
              .filter(paragraph => paragraph.trim().length > 0)
              .map((paragraph, index) => {
                const trimmedParagraph = cleanText(paragraph.trim());
                
                // Check if it's a header/title (usually short and in caps or ends with colon)
                if (trimmedParagraph.length < 100 && 
                    (trimmedParagraph.toUpperCase() === trimmedParagraph || 
                     trimmedParagraph.endsWith(':') ||
                     trimmedParagraph.match(/^\d+\.\s/))) {
                  return (
                    <h3 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3">
                      <span dangerouslySetInnerHTML={{
                        __html: convertUrlsToLinks(
                          trimmedParagraph
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        )
                      }} />
                    </h3>
                  );
                }
                
                // Check if it's a bullet point
                if (trimmedParagraph.startsWith('•') || trimmedParagraph.startsWith('-') || trimmedParagraph.match(/^\*[^*]/)) {
                  return (
                    <li key={index} className="ml-4 mb-2 text-foreground leading-relaxed">
                      <span dangerouslySetInnerHTML={{
                        __html: convertUrlsToLinks(
                          trimmedParagraph
                            .replace(/^[•\-*]\s*/, '')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        )
                      }} />
                    </li>
                  );
                }
                
                // Regular paragraph
                return (
                  <p key={index} className="mb-4 text-foreground leading-relaxed break-words">
                    <span dangerouslySetInnerHTML={{
                      __html: convertUrlsToLinks(
                        trimmedParagraph
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      )
                    }} />
                  </p>
                );
              })}
          </div>
        </div>
        
        {needsShowMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="mt-4 flex items-center gap-2"
          >
            {showFullDescription ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show More
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  const getSectorBadgeColor = (sector: string | null) => {
    if (!sector) return "badge-gray";
    
    switch (sector.toLowerCase()) {
      case "health":
        return "badge-blue";
      case "education":
        return "badge-purple";
      case "wash":
      case "water":
        return "badge-blue";
      case "protection":
        return "badge-pink";
      case "food security":
      case "nutrition":
        return "badge-yellow";
      default:
        return "badge-gray";
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="main-container max-w-5xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="lg:flex lg:gap-8">
              <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-20" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="flex-1 lg:max-w-4xl">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="main-container max-w-5xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error ? "Error loading job details" : "The job you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setLocation("/");
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {job && (
        <SEOHead 
          title={generateJobOGTitle(job)}
          description={generateJobOGDescription(job)}
          keywords={`${job.title}, jobs in ${job.country}, ${job.organization}, ${job.sector || 'humanitarian'} jobs, ${job.location} jobs, NGO careers, UN jobs, ReliefWeb, ${job.country} humanitarian jobs`}
          canonicalUrl={`https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`}
        />
      )}
      <Header />
      
      <main className="main-container max-w-5xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLocation("/");
          }}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        {/* Desktop Layout with Sidebar */}
        <div className="lg:flex lg:gap-8">
          {/* Left Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              {/* Job Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Organization</label>
                    <p className="text-foreground font-medium">{job.organization}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-foreground">{job.location}, {job.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sector</label>
                    <p className="text-foreground">{job.sector || "General"}</p>
                  </div>
                  {job.experience && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Experience Level</label>
                      <p className="text-foreground">{job.experience}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Source</label>
                    <p className="text-foreground">
                      {job.source === "reliefweb" ? "ReliefWeb" : "UN Jobs"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Posted</label>
                    <p className="text-foreground">{formatDate(job.datePosted)}</p>
                  </div>
                  {job.deadline && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Deadline</label>
                      <p className="text-foreground font-medium text-red-600">{formatDeadline(job.deadline)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attachment Card - Sidebar */}
              {job.attachmentUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attachment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#0077B5] rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{job.attachmentUrl}</p>
                        <p className="text-xs text-muted-foreground">Document</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-[#0077B5] hover:bg-[#005885] text-white"
                      onClick={() => {
                        // In a real implementation, this would download the actual file
                        window.open(`/attachments/${job.attachmentUrl}`, '_blank');
                      }}
                    >
                      Download
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Related Jobs Card */}
              {relatedJobs && relatedJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {relatedJobs.slice(0, 5).map((relatedJob) => (
                        <div key={relatedJob.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                          <h4 className="font-medium text-sm mb-2 leading-tight">
                            <Button
                              variant="link"
                              className="p-0 h-auto text-left font-medium text-blue-600 hover:text-blue-800 break-words hyphens-auto flex items-start gap-1"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                const slug = generateJobSlug(relatedJob.title, relatedJob.id);
                                setLocation(`/jobs/${slug}`);
                              }}
                              style={{ 
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal',
                                textAlign: 'left',
                                display: 'flex',
                                width: '100%'
                              }}
                            >
                              {(relatedJob as any).type === 'tender' ? (
                                <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 text-orange-600" />
                              ) : (
                                <Briefcase className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                              )}
                              <span className="flex-1">{relatedJob.title}</span>
                            </Button>
                          </h4>
                          <p className="text-xs text-muted-foreground mb-1 break-words">
                            {relatedJob.organization}
                          </p>
                          <p className="text-xs text-muted-foreground break-words">
                            {relatedJob.location}, {relatedJob.country}
                          </p>
                          {relatedJob.deadline && (
                            <p className="text-xs text-red-600 mt-1">
                              {formatDeadline(relatedJob.deadline)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {relatedJobs.length > 5 && (
                      <Button
                        variant="link"
                        className="p-0 text-sm text-blue-600 hover:text-blue-800 mt-3"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setLocation("/");
                        }}
                      >
                        View all jobs →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}



              
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 lg:max-w-4xl">
            <div className="card-content-responsive">
              {/* Job Header */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl md:text-3xl font-bold mb-4">
                        {job.title}
                      </CardTitle>
                      <div className="flex items-center flex-wrap gap-4 text-muted-foreground mb-4">
                        <span className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          {job.organization}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          {job.location}, {job.country}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Posted {formatDate(job.datePosted)}
                        </span>
                        {job.deadline && (
                          <span className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            Deadline: {formatDeadline(job.deadline)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {job.sector && (
                          <Badge className={`badge ${getSectorBadgeColor(job.sector)}`}>
                            {job.sector}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Social Media Share Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Share2 className="h-4 w-4" />
                        Share this job:
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare('facebook')}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                          title="Share on Facebook"
                        >
                          <FaFacebook className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare('whatsapp')}
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare('twitter')}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                          title="Share on Twitter"
                        >
                          <FaTwitter className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare('linkedin')}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                          title="Share on LinkedIn"
                        >
                          <FaLinkedin className="h-4 w-4 text-blue-700" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Job Description & Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderDescription(job)}
                </CardContent>
              </Card>

              {/* Experience Requirements */}
              {job.experience && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Experience Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">{job.experience}</p>
                  </CardContent>
                </Card>
              )}

              {/* Qualifications */}
              {job.qualifications && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray max-w-none">
                      <div
                        className="text-foreground leading-relaxed break-words"
                        dangerouslySetInnerHTML={{
                          __html: convertUrlsToLinks(cleanText(job.qualifications))
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}



              {/* How to Apply */}
              {job.howToApply && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>How to Apply</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray max-w-none">
                      <div
                        className="text-foreground leading-relaxed break-words overflow-wrap-anywhere text-sm md:text-base"
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}
                        dangerouslySetInnerHTML={{
                          __html: createApplyButton(cleanText(job.howToApply))
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Attachment Section */}
              {job.attachmentUrl ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Attachment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-[#0077B5] rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Document Available</p>
                        <p className="text-sm text-muted-foreground">{job.attachmentUrl}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#0077B5] border-[#0077B5] hover:bg-[#0077B5] hover:text-white"
                        onClick={() => {
                          // In a real implementation, this would download the actual file
                          window.open(`/attachments/${job.attachmentUrl}`, '_blank');
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}





              {/* Mobile Related Jobs - Show below main content on mobile */}
              <div className="lg:hidden">
                {relatedJobs && relatedJobs.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Related Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {relatedJobs.slice(0, 3).map((relatedJob) => (
                          <div key={relatedJob.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                            <h4 className="font-medium text-sm mb-2 leading-tight">
                              <Button
                                variant="link"
                                className="p-0 h-auto text-left font-medium text-blue-600 hover:text-blue-800 break-words hyphens-auto flex items-start gap-1"
                                onClick={() => {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                  setLocation(`/jobs/${relatedJob.id}`);
                                }}
                                style={{ 
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'normal',
                                  textAlign: 'left',
                                  display: 'flex',
                                  width: '100%'
                                }}
                              >
                                {(relatedJob as any).type === 'tender' ? (
                                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 text-orange-600" />
                                ) : (
                                  <Briefcase className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                                )}
                                <span className="flex-1">{relatedJob.title}</span>
                              </Button>
                            </h4>
                            <p className="text-xs text-muted-foreground mb-1 break-words">
                              {relatedJob.organization}
                            </p>
                            <p className="text-xs text-muted-foreground break-words">
                              {relatedJob.location}, {relatedJob.country}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}