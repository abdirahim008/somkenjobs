import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Calendar, Clock, ArrowRight, Briefcase, FileText, Bookmark, Share2 } from "lucide-react";
import { FaFacebook, FaWhatsapp, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import Sidebar from "@/components/Sidebar";
import SEOHead from "@/components/SEOHead";
import { type Job } from "@shared/schema";
import { generateJobSlug } from "@shared/utils";

export default function Tenders() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    country: [],
    organization: [],
    sector: [],
    datePosted: "",
  });
  const [sortBy, setSortBy] = useState("newest");

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["/api/jobs", { ...filters, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.country.length > 0) {
        filters.country.forEach(c => params.append("country", c));
      }
      if (filters.organization.length > 0) {
        filters.organization.forEach(o => params.append("organization", o));
      }
      if (filters.sector.length > 0) {
        filters.sector.forEach(s => params.append("sector", s));
      }
      if (filters.datePosted) {
        params.append("datePosted", filters.datePosted);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    },
  });

  // Filter jobs to show only tender type
  const tenders = jobsData?.jobs?.filter((job: Job) => (job as any).type === 'tender') || [];

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const formatDeadline = (dateString: string) => {
    const deadline = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return "Expired";
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day left";
    return `${diffInDays} days left`;
  };

  const getSectorBadgeColor = (sector: string) => {
    const colors = {
      "Health": "bg-red-100 text-red-800",
      "Education": "bg-blue-100 text-blue-800",
      "Protection": "bg-purple-100 text-purple-800",
      "WASH": "bg-cyan-100 text-cyan-800",
      "Food Security": "bg-green-100 text-green-800",
      "Emergency Response": "bg-orange-100 text-orange-800",
      "Logistics": "bg-yellow-100 text-yellow-800",
      "Coordination": "bg-indigo-100 text-indigo-800",
      "Other": "bg-gray-100 text-gray-800",
    };
    return colors[sector as keyof typeof colors] || colors.Other;
  };



  const handleJobClick = (job: Job) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const slug = generateJobSlug(job.title, job.id);
    setLocation(`/jobs/${slug}`);
  };

  const handleCardClick = (job: Job, e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, .share-button')) {
      return;
    }
    handleJobClick(job);
  };

  const createShareUrl = (platform: string, jobTitle: string, jobUrl: string) => {
    const cacheBuster = `v=${Date.now()}`;
    const jobUrlWithCacheBuster = `${jobUrl}?${cacheBuster}`;
    
    const encodedTitle = encodeURIComponent(`${jobTitle} - Somken Jobs`);
    const encodedUrl = encodeURIComponent(jobUrlWithCacheBuster);
    const shareText = encodeURIComponent(`Check out this tender opportunity: ${jobTitle}`);
    
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

  const handleShare = (platform: string, job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const slug = generateJobSlug(job.title, job.id);
    const jobUrl = `${window.location.origin}/jobs/${slug}`;
    const shareUrl = createShareUrl(platform, job.title, jobUrl);
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Bookmark functionality would go here
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Tenders in Somalia & Kenya | Somken Jobs - Humanitarian Procurement"
        description="Find tender opportunities in Somalia and Kenya with leading humanitarian organizations. Browse procurement tenders, consultancy opportunities, and development contracts. Updated daily."
        keywords="tenders in Somalia, tenders in Kenya, humanitarian tenders, procurement opportunities, consultancy tenders, development contracts, NGO tenders"
        canonicalUrl="https://somkenjobs.com/tenders"
      />
      
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#0077B5] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Tenders in Somalia & Kenya - Procurement Opportunities
            </h1>
            <p className="text-white/90 text-lg max-w-3xl mx-auto">
              Browse {tenders.length || '50+'} current tender opportunities and procurement announcements in Somalia, Kenya and across East Africa.
            </p>
          </div>
        </div>
      </section>
      
      <main className="main-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Section */}
        <section className="py-6">
          <div className="max-w-4xl mx-auto">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </section>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mt-6 lg:mt-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <Sidebar 
                filters={filters} 
                onFilterChange={handleFilterChange}
                availableFilters={jobsData?.filters}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Tender Listings */}
          <div className="flex-1 lg:max-w-4xl">
            <div className="card-content-responsive">
              {/* Tenders Header */}
              <div className="mb-6">
                <div className="flex flex-col space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Latest Tender Opportunities
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <p className="text-muted-foreground">
                        {isLoading ? "Loading..." : `${tenders.length} tender${tenders.length !== 1 ? 's' : ''} found`}
                      </p>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="newest">Newest First</option>
                      <option value="deadline">Deadline</option>
                      <option value="organization">Organization</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Filters */}
              <div className="lg:hidden mb-6">
                <Sidebar 
                  filters={filters} 
                  onFilterChange={handleFilterChange}
                  availableFilters={jobsData?.filters}
                  isLoading={isLoading}
                />
              </div>

              {/* Tender Cards */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading tenders...</p>
                  </div>
                ) : tenders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tenders found matching your criteria.</p>
                  </div>
                ) : (
                  tenders.map((tender: Job) => (
                    <div key={tender.id} className="job-card cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={(e) => handleCardClick(tender, e)}>
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary mb-2 break-words leading-tight">
                            {tender.title}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 text-base text-muted-foreground mb-3">
                            <span className="flex items-center min-w-0">
                              <Building2 className="mr-2 h-5 w-5 flex-shrink-0" />
                              <span className="truncate-org">{tender.organization}</span>
                            </span>
                            <span className="flex items-center flex-shrink-0">
                              <MapPin className="mr-2 h-5 w-5 flex-shrink-0" />
                              <span className="whitespace-nowrap">{tender.location}, {tender.country}</span>
                            </span>
                            <span className="flex items-center flex-shrink-0">
                              <Calendar className="mr-2 h-5 w-5 flex-shrink-0" />
                              <span className="whitespace-nowrap">{formatDate(tender.datePosted)}</span>
                            </span>
                          </div>

                          <div className="flex items-center flex-wrap gap-2">
                            {/* Type badge - Job vs Tender */}
                            <Badge className={`badge bg-orange-100 text-orange-800 hover:bg-orange-100 text-sm flex items-center gap-1`}>
                              <FileText className="h-3 w-3" />
                              Tender
                            </Badge>
                            {tender.sector && (
                              <Badge className={`badge ${getSectorBadgeColor(tender.sector)} text-sm`}>
                                {tender.sector}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBookmark}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Bookmark this tender"
                          >
                            <Bookmark className="h-4 w-4 stroke-muted-foreground hover:stroke-primary" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
                        <div className="text-base text-muted-foreground">
                          {tender.deadline && (
                            <>
                              Deadline: <span className="font-medium text-foreground">{formatDeadline(tender.deadline)}</span>
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
                              onClick={(e) => handleShare('facebook', tender, e)}
                              className="share-button h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                              title="Share on Facebook"
                            >
                              <FaFacebook className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleShare('whatsapp', tender, e)}
                              className="share-button h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                              title="Share on WhatsApp"
                            >
                              <FaWhatsapp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleShare('twitter', tender, e)}
                              className="share-button h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-500"
                              title="Share on Twitter"
                            >
                              <FaTwitter className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleShare('linkedin', tender, e)}
                              className="share-button h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-700"
                              title="Share on LinkedIn"
                            >
                              <FaLinkedin className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
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