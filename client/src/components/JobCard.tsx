import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, MapPin, Calendar, ExternalLink, Bookmark, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [, setLocation] = useLocation();

  const formatPostingDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
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



  const handleViewDetails = () => {
    // Scroll to top before navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLocation(`/jobs/${job.id}`);
  };



  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In a real app, this would save to user preferences or backend
  };

  return (
    <div className="job-card">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer mb-2 break-words leading-tight"
            onClick={handleViewDetails}
          >
            {job.title}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 text-base text-muted-foreground mb-3">
            <span className="flex items-center min-w-0">
              <Building2 className="mr-2 h-5 w-5 flex-shrink-0" />
              <span className="truncate-org">{job.organization}</span>
            </span>
            <span className="flex items-center flex-shrink-0">
              <MapPin className="mr-2 h-5 w-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{job.location}</span>
            </span>
            <span className="flex items-center flex-shrink-0">
              <Calendar className="mr-2 h-5 w-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{formatPostingDate(job.datePosted)}</span>
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Type badge - Job vs Tender */}
            <Badge className={`badge ${(job as any).type === 'tender' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'} text-sm flex items-center gap-1`}>
              {(job as any).type === 'tender' ? (
                <>
                  <FileText className="h-3 w-3" />
                  Tender
                </>
              ) : (
                <>
                  <Briefcase className="h-3 w-3" />
                  Job
                </>
              )}
            </Badge>
            {job.sector && (
              <Badge className={`badge ${getSectorBadgeColor(job.sector)} text-sm`}>
                {job.sector}
              </Badge>
            )}
            <Badge className="badge badge-green text-sm">
              Full-time
            </Badge>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBookmark}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Bookmark this job"
          >
            <Bookmark 
              className={`h-4 w-4 ${
                isBookmarked 
                  ? "fill-primary stroke-primary" 
                  : "stroke-muted-foreground hover:stroke-primary"
              }`} 
            />
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
        <div className="text-base text-muted-foreground">
          {job.deadline && (
            <>
              Deadline: <span className="font-medium text-foreground">{formatDeadline(job.deadline)}</span>
            </>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleViewDetails} className="flex-1 sm:flex-initial">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
