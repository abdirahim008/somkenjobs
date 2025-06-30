import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, MapPin, Calendar, ExternalLink, Bookmark } from "lucide-react";
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
    if (diffDays < 7) return `${diffDays} days left`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return d.toLocaleDateString();
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

  const handleViewDetails = () => {
    setLocation(`/jobs/${job.id}`);
  };



  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In a real app, this would save to user preferences or backend
  };

  return (
    <div className="job-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 
            className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer mb-2"
            onClick={handleViewDetails}
          >
            {job.title}
          </h3>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
            <span className="flex items-center flex-shrink-0">
              <Building2 className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.organization}</span>
            </span>
            <span className="flex items-center flex-shrink-0">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{job.location}</span>
            </span>
            <span className="flex items-center flex-shrink-0">
              <Calendar className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{formatPostingDate(job.datePosted)}</span>
            </span>
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
        <div className="ml-6 flex flex-col items-end space-y-2">
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
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          {job.deadline && (
            <>
              Deadline: <span className="font-medium text-foreground">{formatDeadline(job.deadline)}</span>
            </>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleViewDetails} className="w-full">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
