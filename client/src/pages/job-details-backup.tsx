import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Calendar, MapPin, Building2, ExternalLink, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { type Job } from "@shared/schema";

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
      .replace(/\\\^/g, '^')          // Fix escaped caret symbols
      .replace(/\\\*/g, '*')          // Fix escaped asterisks (but handle ** bold separately)
      .replace(/\\\+/g, '+')          // Fix escaped plus signs
      .replace(/\\=/g, '=')           // Fix escaped equals signs
      .replace(/\\</g, '<')           // Fix escaped less than
      .replace(/\\>/g, '>')           // Fix escaped greater than
      .replace(/\\\|/g, '|')          // Fix escaped pipes
      .replace(/\\`/g, '`')           // Fix escaped backticks
      .replace(/\\~/g, '~')           // Fix escaped tildes
      .replace(/^#{1,6}\s*/gm, '')    // Remove markdown headers (# ## ### etc.) at start of lines
      .replace(/^\s*#{1,6}\s*/gm, ''); // Remove markdown headers with leading whitespace
  };

  // Helper function to convert URLs to clickable links
  const convertUrlsToLinks = (text: string) => {
    // Don't process text that already contains HTML links
    if (text.includes('<a ') || text.includes('</a>')) {
      return text;
    }
    
    // Enhanced URL regex to catch various URL formats, but exclude those in parentheses following text
    const urlRegex = /((?:https?:\/\/|www\.)[^\s\)]+)/gi;
    
    return text.replace(urlRegex, (url) => {
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

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "reliefweb":
        return "badge-green";
      case "unjobs":
        return "badge-blue";
      default:
        return "badge-gray";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="main-container max-w-4xl card-content-responsive">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
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
        </main>
      </div>
    );
  }

  if (error || !job) {
    console.error("Job details error:", error);
    console.log("Job ID:", jobId, "Job data:", job);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="main-container max-w-4xl card-content-responsive">
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
                              className="p-0 h-auto text-left font-medium text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setLocation(`/jobs/${relatedJob.id}`);
                              }}
                            >
                              {relatedJob.title}
                            </Button>
                          </h4>
                          <p className="text-xs text-muted-foreground mb-1">
                            {relatedJob.organization}
                          </p>
                          <p className="text-xs text-muted-foreground">
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

              {/* How to Apply Card */}
              {job.howToApply && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to Apply</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div
                        className="text-sm text-foreground leading-relaxed break-words"
                        dangerouslySetInnerHTML={{
                          __html: convertUrlsToLinks(cleanText(job.howToApply))
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Apply Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    className="w-full bg-[#0077B5] hover:bg-[#005885] text-white"
                    onClick={() => {
                      if (job.url) {
                        window.open(job.url, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
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
                  <Badge className={`badge ${getSourceBadgeColor(job.source)}`}>
                    {job.source === "reliefweb" ? "ReliefWeb" : "UN Jobs"}
                  </Badge>
                  <Badge className="badge badge-green">
                    Full-time
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
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

        {/* How to Apply */}
        {job.howToApply ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How to Apply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray max-w-none">
                <div className="text-foreground leading-relaxed space-y-4 break-words overflow-wrap-anywhere">
                  {cleanText(job.howToApply)
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to line breaks
                    .replace(/<p>/gi, '\n\n') // Convert <p> to paragraphs
                    .replace(/<\/p>/gi, '') // Remove closing p tags
                    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '___LINK_START___$1___LINK_MIDDLE___$2___LINK_END___') // Preserve HTML links
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '___MARKDOWN_LINK_START___$2___MARKDOWN_LINK_MIDDLE___$1___MARKDOWN_LINK_END___') // Handle markdown-style links
                    .replace(/<strong>(.*?)<\/strong>/gi, '___STRONG_START___$1___STRONG_END___') // Preserve HTML bold
                    .replace(/<b>(.*?)<\/b>/gi, '___STRONG_START___$1___STRONG_END___') // Preserve HTML bold
                    .replace(/<em>(.*?)<\/em>/gi, '___EM_START___$1___EM_END___') // Preserve HTML italic
                    .replace(/<i>(.*?)<\/i>/gi, '___EM_START___$1___EM_END___') // Preserve HTML italic
                    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
                    .split('\n')
                    .filter(line => line.trim().length > 0)
                    .map((paragraph, index) => {
                      const trimmed = paragraph.trim();
                      
                      // Check if it's a header line (only preserved HTML bold, not asterisks)
                      if (trimmed.startsWith('___STRONG_START___') && trimmed.includes('___STRONG_END___')) {
                        const headerText = trimmed.replace(/___STRONG_START___(.*?)___STRONG_END___/g, '$1');
                        return (
                          <h4 key={index} className="font-semibold text-foreground mt-4 mb-2">
                            {headerText}
                          </h4>
                        );
                      }
                      
                      // Check if it contains email addresses, URLs, or preserved links
                      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
                      const urlRegex = /(https?:\/\/[^\s\)]+|www\.[^\s\)]+|\b[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}\/[^\s\)]*)/gi;
                      const hasPreservedLinks = trimmed.includes('___LINK_START___') || trimmed.includes('___MARKDOWN_LINK_START___');
                      
                      if (trimmed.match(emailRegex) || trimmed.match(urlRegex) || hasPreservedLinks) {
                        return (
                          <p key={index} className="mb-3 text-foreground leading-relaxed break-words">
                            <span dangerouslySetInnerHTML={{
                              __html: convertUrlsToLinks(
                                trimmed
                                  .replace(/___LINK_START___(.*?)___LINK_MIDDLE___(.*?)___LINK_END___/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all font-medium">$2</a>')
                                  .replace(/___MARKDOWN_LINK_START___(.*?)___MARKDOWN_LINK_MIDDLE___(.*?)___MARKDOWN_LINK_END___/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all font-medium">$2</a>')
                                  .replace(/___STRONG_START___(.*?)___STRONG_END___/g, '<strong>$1</strong>')
                                  .replace(/___EM_START___(.*?)___EM_END___/g, '<em>$1</em>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert *text* to italic
                                  .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<span class="font-medium text-[#0077B5] bg-[#E8F4FD] px-2 py-1 rounded break-all inline-block max-w-full">$1</span>')
                              )
                            }} />
                          </p>
                        );
                      }
                      
                      // Regular paragraph - convert asterisks to bold
                      return (
                        <p key={index} className="mb-3 text-foreground leading-relaxed break-words">
                          <span dangerouslySetInnerHTML={{
                            __html: convertUrlsToLinks(
                              trimmed
                                .replace(/___LINK_START___(.*?)___LINK_MIDDLE___(.*?)___LINK_END___/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all font-medium">$2</a>')
                                .replace(/___MARKDOWN_LINK_START___(.*?)___MARKDOWN_LINK_MIDDLE___(.*?)___MARKDOWN_LINK_END___/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all font-medium">$2</a>')
                                .replace(/___STRONG_START___(.*?)___STRONG_END___/g, '<strong>$1</strong>')
                                .replace(/___EM_START___(.*?)___EM_END___/g, '<em>$1</em>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold
                                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert *text* to italic
                            )
                          }} />
                        </p>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How to Apply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-700">i</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Application instructions are not available for this position. 
                    {job.url && (
                      <span>
                        {" "}Visit the <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm underline"
                          onClick={() => window.open(job.url, "_blank", "noopener,noreferrer")}
                        >
                          original job posting
                        </Button> for more details.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Requirements & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization</label>
                <p className="text-foreground">{job.organization}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-foreground">{job.location || job.country || "Location not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sector</label>
                <p className="text-foreground">{job.sector || "General"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Source</label>
                <p className="text-foreground">
                  {job.source === "reliefweb" ? "ReliefWeb" : "UN Jobs"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Posted Date</label>
                <p className="text-foreground">{formatDate(job.datePosted)}</p>
              </div>
              {job.deadline && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Application Deadline</label>
                  <p className="text-foreground">{formatDate(job.deadline)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({formatDeadline(job.deadline)})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Related Jobs Section */}
        {relatedJobs && relatedJobs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Related Jobs</h2>
            {isLoadingRelated ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {relatedJobs.map((relatedJob) => (
                  <div 
                    key={relatedJob.id} 
                    className="job-card cursor-pointer"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setLocation(`/jobs/${relatedJob.id}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer mb-2 break-words leading-tight"
                        >
                          {relatedJob.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 text-base text-muted-foreground mb-3">
                          <span className="flex items-center min-w-0">
                            <Building2 className="mr-2 h-5 w-5 flex-shrink-0" />
                            <span className="truncate-org">{relatedJob.organization}</span>
                          </span>
                          <span className="flex items-center flex-shrink-0">
                            <MapPin className="mr-2 h-5 w-5 flex-shrink-0" />
                            <span className="whitespace-nowrap">{relatedJob.location}</span>
                          </span>
                          <span className="flex items-center flex-shrink-0">
                            <Calendar className="mr-2 h-5 w-5 flex-shrink-0" />
                            <span className="whitespace-nowrap">{formatDate(relatedJob.datePosted)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button 
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle bookmark functionality can be added here
                          }}
                        >
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {relatedJob.description ? relatedJob.description.substring(0, 150) + '...' : 'No description available'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {relatedJob.sector && (
                          <span className={`badge ${getSectorBadgeColor(relatedJob.sector)}`}>
                            {relatedJob.sector}
                          </span>
                        )}
                        <span className={`badge ${getSourceBadgeColor(relatedJob.source)}`}>
                          {relatedJob.source === "reliefweb" ? "ReliefWeb" : relatedJob.source === "zyte" ? "Zyte" : "UN Jobs"}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>
                          {relatedJob.deadline 
                            ? `${Math.ceil((new Date(relatedJob.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                            : 'No deadline'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
                      <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mobile Related Jobs - Show below main content on mobile */}
            <div className="lg:hidden mt-6">
              {relatedJobs && relatedJobs.length > 0 && (
                <Card>
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
                              className="p-0 h-auto text-left font-medium text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setLocation(`/jobs/${relatedJob.id}`);
                              }}
                            >
                              {relatedJob.title}
                            </Button>
                          </h4>
                          <p className="text-xs text-muted-foreground mb-1">
                            {relatedJob.organization}
                          </p>
                          <p className="text-xs text-muted-foreground">
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