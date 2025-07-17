import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, MapPin, Calendar, ExternalLink, Bookmark, Briefcase, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Job } from "@shared/schema";
import { FaFacebook, FaWhatsapp, FaTwitter, FaLinkedin } from 'react-icons/fa';

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, .share-button')) {
      return;
    }
    handleViewDetails();
  };

  const createShareUrl = (platform: string, jobTitle: string, jobUrl: string) => {
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

  const handleShare = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    const shareUrl = createShareUrl(platform, job.title, jobUrl);
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };



  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // In a real app, this would save to user preferences or backend
  };

  return (
    <div className="job-card cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={handleCardClick}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground hover:text-primary mb-2 break-words leading-tight">
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
        <div className="flex items-center gap-3 ml-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Share2 className="h-3 w-3" />
            Share:
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleShare('facebook', e)}
              className="share-button h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
              title="Share on Facebook"
            >
              <FaFacebook className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleShare('whatsapp', e)}
              className="share-button h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
              title="Share on WhatsApp"
            >
              <FaWhatsapp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleShare('twitter', e)}
              className="share-button h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-500"
              title="Share on Twitter"
            >
              <FaTwitter className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleShare('linkedin', e)}
              className="share-button h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-700"
              title="Share on LinkedIn"
            >
              <FaLinkedin className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
