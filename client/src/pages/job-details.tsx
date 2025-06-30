import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Calendar, MapPin, Building2, ExternalLink, Clock, Users } from "lucide-react";
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
  const jobId = params?.id;

  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
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
    if (diffDays < 7) return `${diffDays} days left`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return formatDate(date);
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error ? "Error loading job details" : "The job you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleApply = () => {
    window.open(job.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

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
              <Button onClick={handleApply} size="lg" className="ml-6">
                Apply Now
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
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
            <div className="prose prose-gray max-w-none">
              {job && job.description ? (
                <div className="space-y-4">
                  {(typeof job.description === 'string' ? job.description : String(job.description))
                    .split('\n')
                    .filter(paragraph => paragraph.trim().length > 0)
                    .map((paragraph, index) => {
                      // Format paragraphs with proper styling
                      const trimmedParagraph = paragraph.trim();
                      
                      // Check if it's a header/title (usually short and in caps or ends with colon)
                      if (trimmedParagraph.length < 100 && 
                          (trimmedParagraph.toUpperCase() === trimmedParagraph || 
                           trimmedParagraph.endsWith(':') ||
                           trimmedParagraph.match(/^\d+\.\s/))) {
                        return (
                          <h3 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3">
                            <span dangerouslySetInnerHTML={{
                              __html: trimmedParagraph
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            }} />
                          </h3>
                        );
                      }
                      
                      // Check if it's a bullet point
                      if (trimmedParagraph.startsWith('•') || trimmedParagraph.startsWith('-') || trimmedParagraph.match(/^\*[^*]/)) {
                        return (
                          <li key={index} className="ml-4 mb-2 text-foreground leading-relaxed">
                            <span dangerouslySetInnerHTML={{
                              __html: trimmedParagraph
                                .replace(/^[•\-*]\s*/, '')
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            }} />
                          </li>
                        );
                      }
                      
                      // Regular paragraph
                      return (
                        <p key={index} className="mb-4 text-foreground leading-relaxed">
                          <span dangerouslySetInnerHTML={{
                            __html: trimmedParagraph
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          }} />
                        </p>
                      );
                    })}
                </div>
              ) : (
                <p className="mb-4 text-foreground leading-relaxed">
                  No detailed description available for this position.
                </p>
              )}
            </div>
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
        {job.howToApply && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How to Apply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray max-w-none">
                <div className="text-foreground leading-relaxed space-y-4">
                  {job.howToApply
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                    .replace(/\\_/g, '_') // Fix escaped underscores
                    .replace(/\\@/g, '@') // Fix escaped @ symbols
                    .replace(/\\\//g, '/') // Fix escaped forward slashes
                    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to line breaks
                    .replace(/<p>/gi, '\n\n') // Convert <p> to paragraphs
                    .replace(/<\/p>/gi, '') // Remove closing p tags
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
                      
                      // Check if it contains email addresses
                      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
                      if (trimmed.match(emailRegex)) {
                        return (
                          <p key={index} className="mb-3 text-foreground leading-relaxed">
                            {trimmed
                              .replace(/___STRONG_START___(.*?)___STRONG_END___/g, '<strong>$1</strong>')
                              .replace(/___EM_START___(.*?)___EM_END___/g, '<em>$1</em>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold
                              .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert *text* to italic
                              .split(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
                              .map((part, i) => 
                              /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(part) ? (
                                <span key={i} className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {part}
                                </span>
                              ) : (
                                <span key={i} dangerouslySetInnerHTML={{ __html: part }} />
                              )
                            )}
                          </p>
                        );
                      }
                      
                      // Regular paragraph - convert asterisks to bold
                      return (
                        <p key={index} className="mb-3 text-foreground leading-relaxed">
                          <span dangerouslySetInnerHTML={{
                            __html: trimmed
                              .replace(/___STRONG_START___(.*?)___STRONG_END___/g, '<strong>$1</strong>')
                              .replace(/___EM_START___(.*?)___EM_END___/g, '<em>$1</em>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold
                              .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert *text* to italic
                          }} />
                        </p>
                      );
                    })}
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

        {/* Apply Section */}
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to Apply?</h3>
              <p className="text-muted-foreground mb-4">
                Click the button below to apply for this position through the organization's official website.
              </p>
              <Button onClick={handleApply} size="lg">
                Apply for this Position
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}